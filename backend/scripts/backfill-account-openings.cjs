/**
 * Backfills opening-balance journal entries for accounts that were created
 * before opening balances were posted to the ledger.
 *
 * Usage (from backend/):
 *   node scripts/backfill-account-openings.cjs           # preview only
 *   node scripts/backfill-account-openings.cjs --apply   # write
 *
 * For each account, the implied opening is:
 *   current book balance - net of all existing journal movements
 * When it is non-zero, the script records an "Opening Balance" entry and
 * adjusts the book balance through that entry so the ledger and balance stay
 * consistent. Re-running the script is safe: the implied opening becomes zero
 * after the entry is posted.
 */
const path = require("node:path")
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") })
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()
const APPLY = process.argv.includes("--apply")

const round = (value) => Math.round((Number(value) || 0) * 100) / 100

const formatEntryDate = (value) => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

async function nextOpeningRef(client) {
  const prefix = "JRN-OPEN-"
  const rows = await client.journalTransaction.findMany({
    where: { refCode: { startsWith: prefix } },
    select: { refCode: true },
  })

  let max = 0
  for (const row of rows) {
    const suffix = row.refCode.slice(prefix.length)
    if (/^\d+$/.test(suffix)) {
      max = Math.max(max, Number(suffix))
    }
  }

  return `${prefix}${String(max + 1).padStart(3, "0")}`
}

async function computeNet(client, accountId) {
  const [credits, debits] = await Promise.all([
    client.journalTransaction.aggregate({
      where: { destinationAccountId: accountId },
      _sum: { amount: true },
    }),
    client.journalTransaction.aggregate({
      where: { sourceAccountId: accountId },
      _sum: { amount: true },
    }),
  ])
  return round((credits._sum.amount || 0) - (debits._sum.amount || 0))
}

async function main() {
  const accounts = await prisma.financialAccount.findMany({
    orderBy: { createdAt: "asc" },
  })

  let planned = 0
  let applied = 0

  for (const account of accounts) {
    const net = await computeNet(prisma, account.id)
    const opening = round(account.balance - net)

    if (Math.abs(opening) < 0.01) {
      console.log(`SKIP  ${account.accountTitle}: already reconciled`)
      continue
    }

    planned += 1
    console.log(
      `${APPLY ? "APPLY" : "PLAN "} ${account.accountTitle}: ` +
        `balance=${account.balance} net=${net} opening=${opening}`
    )

    if (!APPLY) continue

    const created = await prisma.$transaction(async (tx) => {
      const current = await tx.financialAccount.findUnique({ where: { id: account.id } })
      if (!current) return null

      const currentNet = await computeNet(tx, current.id)
      const amount = round(current.balance - currentNet)
      if (Math.abs(amount) < 0.01) return null

      const direction = amount > 0 ? "IN" : "OUT"
      const absolute = Math.abs(amount)

      // Move the book balance back to the journal-derived balance, then post
      // the opening entry through the normal balance direction so deleting
      // the entry later reverses the same amount.
      await tx.financialAccount.update({
        where: { id: current.id },
        data: { balance: currentNet },
      })

      const refCode = await nextOpeningRef(tx)

      const entry = await tx.journalTransaction.create({
        data: {
          entryDate: formatEntryDate(current.createdAt),
          refCode,
          flowType: direction === "IN" ? "INFLOW" : "OUTFLOW",
          particulars: `Opening balance for ${current.accountTitle}`,
          fundingEntity: "AK Pharma Treasury",
          method: "Opening Balance",
          amount: absolute,
          sourceAccountId: direction === "OUT" ? current.id : null,
          destinationAccountId: direction === "IN" ? current.id : null,
          reconciliationStatus: "Reconciled",
          createdAt: current.createdAt,
        },
      })

      await tx.financialAccount.update({
        where: { id: current.id },
        data: {
          balance:
            direction === "IN"
              ? { increment: absolute }
              : { decrement: absolute },
        },
      })

      return entry
    })

    if (created) {
      applied += 1
      console.log(`      created ${created.refCode} (BDT ${created.amount})`)
    }
  }

  console.log(
    `\n${APPLY ? "Applied" : "Planned"} ${planned} opening balance record(s).` +
      (APPLY ? ` Created ${applied}.` : " Run with --apply to write.")
  )
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
