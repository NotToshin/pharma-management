/**
 * Renumbers legacy random journal references to sequential 3-digit codes.
 *
 * Examples:
 *   JRN-SPAY-MVQ85E56 -> JRN-SPAY-002
 *   JRN-OPEN-MWNRZYZPRMJ -> JRN-OPEN-001
 *
 * Numeric references are kept as they are. Random references are numbered
 * oldest-first after the highest existing number for that prefix.
 *
 * Usage (from backend/):
 *   node scripts/renumber-journal-refs.cjs           # preview only
 *   node scripts/renumber-journal-refs.cjs --apply   # write
 */
const path = require("node:path")
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") })
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()
const APPLY = process.argv.includes("--apply")

const PREFIXES = ["JRN-SPAY-", "JRN-REV-", "JRN-OPEN-", "JRN-ADJ-", "JRN-BPAY-"]

const isNumericSuffix = (refCode, prefix) => /^\d+$/.test(refCode.slice(prefix.length))

async function main() {
  let totalPlanned = 0
  let totalApplied = 0

  for (const prefix of PREFIXES) {
    const rows = await prisma.journalTransaction.findMany({
      where: { refCode: { startsWith: prefix } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, refCode: true, createdAt: true },
    })

    if (rows.length === 0) {
      console.log(`SKIP ${prefix} no references`)
      continue
    }

    let max = 0
    for (const row of rows) {
      if (isNumericSuffix(row.refCode, prefix)) {
        max = Math.max(max, Number(row.refCode.slice(prefix.length)))
      }
    }

    const randomRows = rows.filter((row) => !isNumericSuffix(row.refCode, prefix))
    if (randomRows.length === 0) {
      console.log(`SKIP ${prefix} already numeric`)
      continue
    }

    console.log(`\n${prefix} ${randomRows.length} random reference(s), current max ${max}`)

    const planned = []
    let next = max + 1
    for (const row of randomRows) {
      let candidate = `${prefix}${String(next).padStart(3, "0")}`
      while (
        rows.some((existing) => existing.refCode === candidate) ||
        planned.some((item) => item.candidate === candidate)
      ) {
        next += 1
        candidate = `${prefix}${String(next).padStart(3, "0")}`
      }
      planned.push({ id: row.id, oldRef: row.refCode, candidate })
      next += 1
    }

    for (const item of planned) {
      console.log(`  ${item.oldRef} -> ${item.candidate}`)
    }
    totalPlanned += planned.length

    if (!APPLY) continue

    await prisma.$transaction(async (tx) => {
      for (const item of planned) {
        const exists = await tx.journalTransaction.findUnique({
          where: { refCode: item.candidate },
          select: { id: true },
        })
        if (exists) {
          throw new Error(`Reference collision for ${item.candidate}`)
        }
        await tx.journalTransaction.update({
          where: { id: item.id },
          data: { refCode: item.candidate },
        })
      }
    })
    totalApplied += planned.length
  }

  console.log(
    `\n${APPLY ? "Renumbered" : "Planned"} ${totalPlanned} reference(s).` +
      (APPLY ? ` Updated ${totalApplied}.` : " Run with --apply to write.")
  )
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
