"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Banknote,
  Search,
  Plus,
  RotateCcw,
  Trash2,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Printer,
} from "lucide-react"
import { SettlementReceiptSheet } from "@/components/finance/settlement-receipt-sheet"

const PRINT_STYLES = `
@media print {
  @page {
    size: A4 portrait;
    margin: 8mm;
  }
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body * {
    visibility: hidden !important;
  }
  [data-slot="dialog-portal"],
  [data-slot="dialog-overlay"],
  [data-slot="dialog-content"],
  [data-sidebar="sidebar"],
  aside,
  header,
  nav,
  button,
  .print\\:hidden {
    display: none !important;
    visibility: hidden !important;
  }
  #print-standalone-settlement-receipt,
  #print-standalone-settlement-receipt * {
    visibility: visible !important;
  }
  #print-standalone-settlement-receipt {
    display: block !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    box-sizing: border-box !important;
    padding: 0 !important;
    margin: 0 !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    z-index: 999999 !important;
  }
  table {
    width: 100% !important;
    border-collapse: collapse !important;
  }
  thead {
    display: table-header-group !important;
  }
  tr {
    page-break-inside: avoid !important;
  }
}
`

type Direction = "OUTGOING" | "INCOMING"

interface OpenBill {
  id: string
  number: string
  date: string
  partyName: string
  partyCode?: string | null
  total: number
  paid: number
  balance: number
  documentStatus: string
  paymentStatus: string
  terms?: string | null
  referenceLabel: string
}

interface PartyOption {
  name: string
  code?: string | null
  openBalance: number
  advanceBalance: number
}

interface SettlementAllocation {
  documentType: string
  documentId: string
  documentNumber: string
  allocatedAmount: number
}

interface Settlement {
  id: string
  paymentNumber: string
  direction: Direction
  partyName: string
  partyCode?: string | null
  amount: number
  unallocatedAmount: number
  paymentMethod: string
  paymentDate: string
  transactionRef?: string | null
  accountTitle?: string | null
  status: string
  notes?: string | null
  allocations: SettlementAllocation[]
}

interface FinancialAccount {
  id: string
  accountTitle: string
  category: "BANK" | "CASH"
  balance: number
}

interface AllocationLine {
  id: string
  number: string
  date: string
  balance: number
  amount: string
}

const money = (value: number) =>
  `৳${(Number(value) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const todayLabel = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

function statusClass(status: string) {
  if (status === "PAID" || status === "COMPLETED") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "PARTIALLY_PAID") return "border-amber-200 bg-amber-50 text-amber-700"
  if (status === "REVERSED") return "border-rose-200 bg-rose-50 text-rose-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

export function PartySettlementPage({
  direction,
  presetDocumentId,
}: {
  direction: Direction
  presetDocumentId?: string | null
}) {
  const outgoing = direction === "OUTGOING"
  const title = outgoing ? "Supplier Payments" : "Buyer Payments"
  const partyLabel = outgoing ? "Supplier" : "Buyer"
  const orderHref = outgoing ? "/procurement/orders" : "/logistics/orders"
  const orderLabel = outgoing ? "Purchase Orders" : "Sales Orders"
  const methods = outgoing
    ? ["Cash", "Cheque", "BEFTN / RTGS", "bKash / Nagad", "Advance Adjustment"]
    : ["Cash", "Cheque", "BEFTN / RTGS", "Card", "bKash / Nagad", "Advance Adjustment"]

  const [bills, setBills] = React.useState<OpenBill[]>([])
  const [parties, setParties] = React.useState<PartyOption[]>([])
  const [summary, setSummary] = React.useState({ openCount: 0, outstanding: 0, advanceBalance: 0 })
  const [payments, setPayments] = React.useState<Settlement[]>([])
  const [accounts, setAccounts] = React.useState<FinancialAccount[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [partyFilter, setPartyFilter] = React.useState("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Settlement | null>(null)
  const [reverseTarget, setReverseTarget] = React.useState<Settlement | null>(null)
  const [printSettlement, setPrintSettlement] = React.useState<Settlement | null>(null)
  const [isPrintOpen, setIsPrintOpen] = React.useState(false)
  const [working, setWorking] = React.useState(false)
  const presetHandled = React.useRef(false)

  const [partyName, setPartyName] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [method, setMethod] = React.useState(methods[0])
  const [accountId, setAccountId] = React.useState("")
  const [paymentDate, setPaymentDate] = React.useState(todayLabel())
  const [transactionRef, setTransactionRef] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [lines, setLines] = React.useState<AllocationLine[]>([])
  const [autoAllocate, setAutoAllocate] = React.useState(true)
  const preferredBillId = React.useRef<string | null>(null)

  const partyBills = React.useMemo(
    () => bills.filter((bill) => bill.partyName.trim().toLowerCase() === partyName.trim().toLowerCase()),
    [bills, partyName]
  )

  const selectedParty = parties.find(
    (party) => party.name.trim().toLowerCase() === partyName.trim().toLowerCase()
  )

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [billRes, payRes, accountRes] = await Promise.all([
        apiFetch(`/settlements/open-bills?direction=${direction}`),
        apiFetch(`/settlements?direction=${direction}&limit=all`),
        apiFetch("/account-ledger/accounts"),
      ])
      const billJson = await billRes.json()
      const payJson = await payRes.json()
      const accountJson = await accountRes.json()
      if (!billRes.ok) throw new Error(billJson.message || "Failed to load open bills")
      if (!payRes.ok) throw new Error(payJson.message || "Failed to load payments")
      setBills(billJson.data?.bills || [])
      setParties(billJson.data?.parties || [])
      setSummary(billJson.data?.summary || { openCount: 0, outstanding: 0, advanceBalance: 0 })
      setPayments(Array.isArray(payJson.data) ? payJson.data : [])
      const loadedAccounts = (accountJson.data || []) as FinancialAccount[]
      setAccounts(loadedAccounts.filter((account) => account.id))
      setAccountId((current) => current || loadedAccounts[0]?.id || "")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load payments")
    } finally {
      setLoading(false)
    }
  }, [direction])

  React.useEffect(() => {
    load()
  }, [load])

  const fillLines = React.useCallback((nextParty: string, nextAmount: number, source = bills) => {
    const open = source.filter(
      (bill) => bill.partyName.trim().toLowerCase() === nextParty.trim().toLowerCase() && bill.balance > 0
    )
    const preferred = preferredBillId.current
    const ordered = [...open].sort((a, b) => {
      if (a.id === preferred) return -1
      if (b.id === preferred) return 1
      return 0
    })
    let left = nextAmount
    setLines(
      ordered.map((bill) => {
        const take = Math.min(bill.balance, Math.max(0, left))
        left = round2(left - take)
        return {
          id: bill.id,
          number: bill.number,
          date: bill.date,
          balance: bill.balance,
          amount: take > 0 ? String(round2(take)) : "",
        }
      })
    )
  }, [bills])

  const openDialogFor = React.useCallback(
    (bill?: OpenBill) => {
      preferredBillId.current = bill?.id || null
      const name = bill?.partyName || ""
      const due = bill ? bill.balance : 0
      setPartyName(name)
      setAmount(due > 0 ? String(due) : "")
      setMethod("Cash")
      setPaymentDate(todayLabel())
      setTransactionRef("")
      setNotes(bill ? `Settlement against ${bill.number}` : "")
      setAutoAllocate(true)
      if (name) fillLines(name, due)
      else setLines([])
      setDialogOpen(true)
    },
    [fillLines]
  )

  React.useEffect(() => {
    if (presetHandled.current || loading || !presetDocumentId) return
    const match = bills.find((bill) => bill.id === presetDocumentId)
    if (!match) return
    presetHandled.current = true
    openDialogFor(match)
  }, [bills, loading, openDialogFor, presetDocumentId])

  const onPartyChange = (name: string) => {
    preferredBillId.current = null
    setPartyName(name)
    setAutoAllocate(true)
    const due = bills
      .filter((bill) => bill.partyName.trim().toLowerCase() === name.trim().toLowerCase())
      .reduce((sum, bill) => sum + bill.balance, 0)
    setAmount(due > 0 ? String(round2(due)) : "")
    fillLines(name, due)
  }

  const onAmountChange = (value: string) => {
    setAmount(value)
    if (autoAllocate) fillLines(partyName, Number(value) || 0)
  }

  const allocatedNow = round2(
    lines.reduce((sum, line) => sum + (Number(line.amount) > 0 ? Number(line.amount) : 0), 0)
  )
  const enteredAmount = Number(amount) || 0
  const leftover = round2(enteredAmount - allocatedNow)
  const advanceMode = method.toLowerCase().includes("advance")

  const visibleBills = bills.filter((bill) => {
    const partyOk = partyFilter === "all" || bill.partyName === partyFilter
    const q = search.trim().toLowerCase()
    const searchOk =
      !q ||
      bill.number.toLowerCase().includes(q) ||
      bill.partyName.toLowerCase().includes(q) ||
      (bill.terms || "").toLowerCase().includes(q)
    return partyOk && searchOk
  })

  const visiblePayments = payments.filter((payment) => {
    const partyOk = partyFilter === "all" || payment.partyName === partyFilter
    const q = search.trim().toLowerCase()
    const searchOk =
      !q ||
      payment.paymentNumber.toLowerCase().includes(q) ||
      payment.partyName.toLowerCase().includes(q) ||
      (payment.transactionRef || "").toLowerCase().includes(q) ||
      payment.allocations.some((line) => line.documentNumber.toLowerCase().includes(q))
    return partyOk && searchOk
  })

  const settledTotal = payments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)

  const submit = async () => {
    if (!partyName) {
      toast.warning(`Choose a ${partyLabel.toLowerCase()} first`)
      return
    }
    if (enteredAmount <= 0) {
      toast.warning("Enter a payment amount")
      return
    }
    if (leftover < -0.05) {
      toast.warning("Allocated amounts are higher than the payment")
      return
    }
    if (!advanceMode && !accountId) {
      toast.warning("Choose the cash drawer or bank account")
      return
    }
    if (advanceMode && leftover > 0.05) {
      toast.warning("Apply the full advance amount to open orders")
      return
    }
    for (const line of lines) {
      const value = Number(line.amount) || 0
      if (value - line.balance > 0.05) {
        toast.warning(`${line.number} only has ${money(line.balance)} open`)
        return
      }
    }

    const toastId = toast.loading(outgoing ? "Recording supplier payment..." : "Recording buyer receipt...")
    setSaving(true)
    try {
      const party = parties.find((item) => item.name === partyName)
      const res = await apiFetch("/settlements", {
        method: "POST",
        body: JSON.stringify({
          direction,
          partyName,
          partyCode: party?.code || null,
          amount: enteredAmount,
          paymentMethod: method,
          paymentDate,
          transactionRef: transactionRef.trim() || null,
          financialAccountId: advanceMode ? null : accountId,
          notes,
          allocations: lines
            .filter((line) => Number(line.amount) > 0)
            .map((line) => ({ documentId: line.id, amount: Number(line.amount) })),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to record payment")
      toast.success(json.message || "Payment recorded", { id: toastId })
      setDialogOpen(false)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record payment", { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  const reversePayment = async () => {
    if (!reverseTarget) return
    const toastId = toast.loading(`Reversing ${reverseTarget.paymentNumber}...`)
    setWorking(true)
    try {
      const res = await apiFetch(`/settlements/${reverseTarget.id}/reverse`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to reverse payment")
      toast.success("Payment reversed and balances restored", { id: toastId })
      setReverseTarget(null)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reverse payment", { id: toastId })
    } finally {
      setWorking(false)
    }
  }

  const deletePayment = async () => {
    if (!deleteTarget) return
    const toastId = toast.loading(`Deleting ${deleteTarget.paymentNumber}...`)
    setWorking(true)
    try {
      const res = await apiFetch(`/settlements/${deleteTarget.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to delete payment")
      toast.success("Payment deleted", { id: toastId })
      setDeleteTarget(null)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete payment", { id: toastId })
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-4">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {outgoing
              ? "Pay suppliers against purchase orders. Partial payments, oldest-bill allocation, and supplier advances post to cash or bank."
              : "Collect buyer receipts against sales orders. Partial receipts, oldest-invoice allocation, and customer advances post to cash or bank."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold">
            <Link href={orderHref}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              {orderLabel}
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => openDialogFor()}
            className="h-9 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {outgoing ? "Pay Supplier" : "Collect Payment"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-slate-200 p-4 shadow-none">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Open {outgoing ? "bills" : "invoices"}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.openCount}</p>
        </Card>
        <Card className="border-slate-200 p-4 shadow-none">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {outgoing ? "Accounts payable" : "Accounts receivable"}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{money(summary.outstanding)}</p>
        </Card>
        <Card className="border-slate-200 p-4 shadow-none">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {outgoing ? "Paid to suppliers" : "Collected from buyers"}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{money(settledTotal)}</p>
          <p className="mt-1 text-[11px] text-slate-400">Unapplied advance {money(summary.advanceBalance)}</p>
        </Card>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${partyLabel.toLowerCase()}, order, or receipt`}
            className="h-9 pl-9 text-xs"
          />
        </div>
        <Select value={partyFilter} onValueChange={setPartyFilter}>
          <SelectTrigger className="h-9 w-full text-xs sm:w-64">
            <SelectValue placeholder={`All ${partyLabel}s`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {partyLabel}s</SelectItem>
            {parties.map((party) => (
              <SelectItem key={party.name} value={party.name}>
                {party.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-slate-200 p-4 shadow-none">
        <div className="mb-3 flex items-center gap-2">
          {outgoing ? <ArrowUpRight className="h-4 w-4 text-rose-500" /> : <ArrowDownLeft className="h-4 w-4 text-emerald-600" />}
          <h2 className="text-sm font-bold text-slate-900">Open {outgoing ? "purchase orders" : "sales orders"}</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Order</TableHead>
              <TableHead className="text-xs">{partyLabel}</TableHead>
              <TableHead className="text-xs">Fulfillment</TableHead>
              <TableHead className="text-right text-xs">Total</TableHead>
              <TableHead className="text-right text-xs">Paid</TableHead>
              <TableHead className="text-right text-xs">Balance</TableHead>
              <TableHead className="text-xs">Payment</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-xs text-slate-400">Loading open orders...</TableCell>
              </TableRow>
            ) : visibleBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-xs text-slate-400">
                  No open balances. New {outgoing ? "purchase" : "sales"} orders appear here until they are paid.
                </TableCell>
              </TableRow>
            ) : (
              visibleBills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="py-3">
                    <span className="block font-mono text-xs font-bold text-[#0090FF]">{bill.number}</span>
                    <span className="text-[10px] text-slate-400">{bill.date}</span>
                  </TableCell>
                  <TableCell className="py-3 text-xs font-semibold text-slate-800">{bill.partyName}</TableCell>
                  <TableCell className="py-3 text-xs text-slate-600">{bill.documentStatus}</TableCell>
                  <TableCell className="py-3 text-right font-mono text-xs">{money(bill.total)}</TableCell>
                  <TableCell className="py-3 text-right font-mono text-xs text-slate-500">{money(bill.paid)}</TableCell>
                  <TableCell className="py-3 text-right font-mono text-xs font-bold">{money(bill.balance)}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={`text-[10px] ${statusClass(bill.paymentStatus)}`}>
                      {bill.paymentStatus.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => openDialogFor(bill)}>
                      {outgoing ? "Pay" : "Collect"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="border-slate-200 p-4 shadow-none">
        <div className="mb-3 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-[#0090FF]" />
          <h2 className="text-sm font-bold text-slate-900">Payment register</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Receipt</TableHead>
              <TableHead className="text-xs">{partyLabel}</TableHead>
              <TableHead className="text-xs">Allocated to</TableHead>
              <TableHead className="text-xs">Method</TableHead>
              <TableHead className="text-right text-xs">Amount</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-400">Loading payments...</TableCell>
              </TableRow>
            ) : visiblePayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-400">No payments recorded yet.</TableCell>
              </TableRow>
            ) : (
              visiblePayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="py-3">
                    <span className="block font-mono text-xs font-bold text-slate-800">{payment.paymentNumber}</span>
                    <span className="text-[10px] text-slate-400">{payment.paymentDate}</span>
                  </TableCell>
                  <TableCell className="py-3 text-xs font-semibold text-slate-800">{payment.partyName}</TableCell>
                  <TableCell className="py-3 text-xs text-slate-600">
                    {payment.allocations?.length
                      ? payment.allocations.map((line) => `${line.documentNumber} ${money(line.allocatedAmount)}`).join(", ")
                      : "Unallocated advance"}
                    {payment.unallocatedAmount > 0 && payment.allocations?.length ? (
                      <span className="mt-0.5 block text-[10px] text-amber-600">
                        Advance left {money(payment.unallocatedAmount)}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="py-3 text-xs text-slate-600">
                    <span className="block">{payment.paymentMethod}</span>
                    <span className="text-[10px] text-slate-400">
                      {payment.accountTitle || payment.transactionRef || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right font-mono text-xs font-bold">{money(payment.amount)}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={`text-[10px] ${statusClass(payment.status)}`}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[11px] text-slate-700 hover:text-black"
                        onClick={() => {
                          setPrintSettlement(payment)
                          setIsPrintOpen(true)
                        }}
                      >
                        <Printer className="mr-1 h-3 w-3" />
                        Print
                      </Button>
                      {payment.status === "COMPLETED" && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => setReverseTarget(payment)}>
                          <RotateCcw className="mr-1 h-3 w-3" />
                          Reverse
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-rose-600" onClick={() => setDeleteTarget(payment)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle className="text-base">{outgoing ? "Pay supplier" : "Collect buyer payment"}</DialogTitle>
            <DialogDescription className="text-xs">
              Money is applied to the oldest open {outgoing ? "purchase orders" : "sales orders"} first. Anything left over stays as an advance for the next bill.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{partyLabel}</Label>
              <Select value={partyName || undefined} onValueChange={onPartyChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={`Select ${partyLabel.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {parties.map((party) => (
                    <SelectItem key={party.name} value={party.name}>
                      {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedParty && (
                <p className="text-[10px] text-slate-400">
                  Open {money(selectedParty.openBalance)} · Advance {money(selectedParty.advanceBalance)}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount (BDT)</Label>
              <Input value={amount} onChange={(event) => onAmountChange(event.target.value)} inputMode="decimal" className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className="h-9 text-xs" />
            </div>
            {!advanceMode && (
              <div className="space-y-1.5">
                <Label className="text-xs">Cash / bank account</Label>
                <Select value={accountId || undefined} onValueChange={setAccountId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountTitle} ({account.category}) · {money(account.balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Cheque / transaction ref</Label>
              <Input value={transactionRef} onChange={(event) => setTransactionRef(event.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-16 text-xs" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <span className="text-xs font-semibold text-slate-700">Allocation</span>
              <span className="text-[11px] text-slate-400">
                Applied {money(allocatedNow)}
                {leftover > 0.009 ? ` · Advance ${money(leftover)}` : ""}
              </span>
            </div>
            {partyBills.length === 0 ? (
              <p className="px-3 py-4 text-xs text-slate-400">
                {partyName
                  ? "This party has no open order balance. The amount will be stored as an advance."
                  : `Select a ${partyLabel.toLowerCase()} to see open orders.`}
              </p>
            ) : (
              <div className="divide-y divide-slate-50">
                {lines.map((line) => (
                  <div key={line.id} className="grid grid-cols-[1fr_140px] items-center gap-3 px-3 py-2">
                    <div>
                      <p className="font-mono text-xs font-bold text-[#0090FF]">{line.number}</p>
                      <p className="text-[10px] text-slate-400">{line.date} · open {money(line.balance)}</p>
                    </div>
                    <Input
                      value={line.amount}
                      inputMode="decimal"
                      className="h-8 text-right text-xs"
                      onChange={(event) => {
                        setAutoAllocate(false)
                        const value = event.target.value
                        setLines((current) => current.map((item) => (item.id === line.id ? { ...item, amount: value } : item)))
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={submit} disabled={saving} className="bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]">
              <Banknote className="mr-1.5 h-3.5 w-3.5" />
              {saving ? "Saving..." : outgoing ? "Record payment" : "Record receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        open={Boolean(reverseTarget)}
        onOpenChange={(open) => !open && setReverseTarget(null)}
        onConfirm={reversePayment}
        isDeleting={working}
        title="Reverse this payment?"
        confirmText="Reverse Payment"
        description="The order balance, party ledger, and cash or bank account return to their position before this receipt."
        itemName={reverseTarget?.paymentNumber}
      />
      <DeleteConfirmationModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={deletePayment}
        isDeleting={working}
        title="Delete this payment?"
        description="The payment is removed and any balance it changed is restored first."
        itemName={deleteTarget?.paymentNumber}
      />

      {/* Screen Settlement Preview & Print Modal */}
      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent className="max-h-[95vh] overflow-y-auto rounded-2xl bg-white sm:max-w-[760px] p-6 print:p-0">
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  {outgoing ? "Official Supplier Payment Voucher" : "Official Buyer Money Receipt"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {outgoing ? "Payment Voucher" : "Money Receipt"} #{printSettlement?.paymentNumber} ({printSettlement?.partyName})
                </DialogDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  requestAnimationFrame(() => {
                    setTimeout(() => window.print(), 60)
                  })
                }}
                className="h-8 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-xs font-semibold text-white shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                {outgoing ? "Print Voucher" : "Print Receipt"}
              </Button>
            </div>
          </DialogHeader>

          {printSettlement && (
            <div className="space-y-6 pt-2">
              <div className="mx-auto w-full max-w-[760px] bg-white text-xs">
                <SettlementReceiptSheet record={printSettlement} />
              </div>

              <div className="flex justify-end gap-2 pb-2 print:hidden pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setIsPrintOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    requestAnimationFrame(() => {
                      setTimeout(() => window.print(), 60)
                    })
                  }}
                  className="gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-xs font-semibold text-white shadow-sm"
                >
                  <Printer className="h-4 w-4" /> {outgoing ? "Print Voucher" : "Print Receipt"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Isolated Standalone Printable Settlement Sheet */}
      {printSettlement && (
        <div
          id="print-standalone-settlement-receipt"
          className="hidden bg-white p-0 font-sans text-black"
        >
          <div className="mx-auto w-full max-w-[760px] bg-white p-6 text-xs">
            <SettlementReceiptSheet record={printSettlement} />
          </div>
        </div>
      )}
    </div>
  )
}
