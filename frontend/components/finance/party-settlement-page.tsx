"use client"

import PermissionGate from "@/components/permission-gate"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import {
  ServerListPagination,
  ServerListToolbar,
  useServerListQuery,
} from "@/components/server-list-controls"
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
  Plus,
  RotateCcw,
  Trash2,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
} from "lucide-react"

type Direction = "OUTGOING" | "INCOMING"

interface OpenBill {
  id: string
  number: string
  date: string
  partyName: string
  partyCode?: string | null
  partyId?: string | null
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
  partyId?: string | null
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

const PO_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "Draft", label: "Draft" },
  { value: "Submitted", label: "Submitted" },
  { value: "Approved", label: "Approved" },
  { value: "Partially Received", label: "Partially Received" },
  { value: "Received", label: "Received" },
  { value: "Cancelled", label: "Cancelled" },
]

export function PartySettlementPage({
  direction,
  presetDocumentId,
}: {
  direction?: Direction
  presetDocumentId?: string | null
}) {
  const outgoing = direction !== "INCOMING"
  const title = "Supplier Payments"
  const partyLabel = "Supplier"
  const orderHref = "/procurement/orders"
  const orderLabel = "Purchase Orders"
  const methods = ["Cash", "Cheque", "BEFTN / RTGS", "bKash / Nagad", "Advance Adjustment"]

  const [bills, setBills] = React.useState<OpenBill[]>([])
  const [billsMeta, setBillsMeta] = React.useState({ total: 0, totalPages: 1 })
  const [billsLoading, setBillsLoading] = React.useState(true)
  const [parties, setParties] = React.useState<PartyOption[]>([])
  const [summary, setSummary] = React.useState({ openCount: 0, outstanding: 0, advanceBalance: 0, settled: 0 })
  const [payments, setPayments] = React.useState<Settlement[]>([])
  const [paymentsMeta, setPaymentsMeta] = React.useState({ total: 0, totalPages: 1 })
  const [paymentsLoading, setPaymentsLoading] = React.useState(true)
  const [accounts, setAccounts] = React.useState<FinancialAccount[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogBills, setDialogBills] = React.useState<OpenBill[]>([])
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Settlement | null>(null)
  const [reverseTarget, setReverseTarget] = React.useState<Settlement | null>(null)
  const [working, setWorking] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"orders" | "register">("orders")
  const presetHandled = React.useRef(false)
  const presetResolving = React.useRef(false)

  // Server-driven list state (search, filter, pagination) per tab
  const billsQuery = useServerListQuery({ initialLimit: 10, initialFilters: { partyName: "all", status: "all" } })
  const paymentsQuery = useServerListQuery({ initialLimit: 10, initialFilters: { partyName: "all", method: "all" } })

  const billsQueryString = React.useMemo(() => {
    const params = new URLSearchParams(billsQuery.queryKey)
    params.set("direction", direction ?? "OUTGOING")
    return params.toString()
  }, [billsQuery.queryKey, direction])

  const paymentsQueryString = React.useMemo(() => {
    const params = new URLSearchParams(paymentsQuery.queryKey)
    params.set("direction", direction ?? "OUTGOING")
    return params.toString()
  }, [paymentsQuery.queryKey, direction])

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
    () => dialogBills.filter((bill) => bill.partyName.trim().toLowerCase() === partyName.trim().toLowerCase()),
    [dialogBills, partyName]
  )

  const selectedParty = parties.find(
    (party) => party.name.trim().toLowerCase() === partyName.trim().toLowerCase()
  )

  const loadAccounts = React.useCallback(async () => {
    try {
      const res = await apiFetch("/account-ledger/accounts")
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to load accounts")
      const loadedAccounts = (json.data || []) as FinancialAccount[]
      setAccounts(loadedAccounts.filter((account) => account.id))
      setAccountId((current) => current || loadedAccounts[0]?.id || "")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load accounts")
    }
  }, [])

  const loadBills = React.useCallback(async () => {
    setBillsLoading(true)
    try {
      const res = await apiFetch(`/settlements/open-bills?${billsQueryString}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to load open bills")
      setBills(json.data?.bills || [])
      setParties(json.data?.parties || [])
      setSummary(json.data?.summary || { openCount: 0, outstanding: 0, advanceBalance: 0, settled: 0 })
      setBillsMeta({
        total: json.data?.meta?.total || 0,
        totalPages: json.data?.meta?.totalPage || json.data?.meta?.totalPages || 1,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load open bills")
    } finally {
      setBillsLoading(false)
      setLoading(false)
    }
  }, [billsQueryString])

  const loadPayments = React.useCallback(async () => {
    setPaymentsLoading(true)
    try {
      const res = await apiFetch(`/settlements?${paymentsQueryString}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to load payments")
      setPayments(Array.isArray(json.data) ? json.data : [])
      setPaymentsMeta({
        total: json.meta?.total || 0,
        totalPages: json.meta?.totalPage || json.meta?.totalPages || 1,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load payments")
    } finally {
      setPaymentsLoading(false)
    }
  }, [paymentsQueryString])

  React.useEffect(() => {
    loadBills()
  }, [loadBills])

  React.useEffect(() => {
    loadPayments()
  }, [loadPayments])

  React.useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const loadDialogBills = React.useCallback(
    async (name: string): Promise<OpenBill[]> => {
      if (!name) return []
      const res = await apiFetch(`/settlements/open-bills?direction=${direction}&partyName=${encodeURIComponent(name)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to load supplier orders")
      return (json.data?.bills || []) as OpenBill[]
    },
    [direction]
  )

  const fillLines = React.useCallback((nextParty: string, nextAmount: number, source: OpenBill[]) => {
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
  }, [])

  const openDialogFor = React.useCallback(
    async (bill?: OpenBill) => {
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
      setDialogOpen(true)
      if (name) {
        try {
          const open = await loadDialogBills(name)
          setDialogBills(open)
          fillLines(name, due, open)
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to load supplier orders")
          setDialogBills([])
          setLines([])
        }
      } else {
        setDialogBills([])
        setLines([])
      }
    },
    [fillLines, loadDialogBills]
  )

  React.useEffect(() => {
    if (presetHandled.current || presetResolving.current || loading || !presetDocumentId) return
    const match = bills.find((bill) => bill.id === presetDocumentId)
    if (match) {
      presetHandled.current = true
      openDialogFor(match)
      return
    }
    // The preset order is not on the loaded page — resolve it once from the full list
    presetResolving.current = true
    apiFetch(`/settlements/open-bills?direction=${direction}`)
      .then((res) => res.json())
      .then((json) => {
        const full = (json.data?.bills || []) as OpenBill[]
        const found = full.find((bill) => bill.id === presetDocumentId)
        if (found && !presetHandled.current) {
          presetHandled.current = true
          openDialogFor(found)
        }
      })
      .catch(() => {
        // ignore — the operator can still pay manually
      })
      .finally(() => {
        presetResolving.current = false
      })
  }, [bills, direction, loading, openDialogFor, presetDocumentId])

  const onPartyChange = async (name: string) => {
    preferredBillId.current = null
    setPartyName(name)
    setAutoAllocate(true)
    if (!name) {
      setDialogBills([])
      setLines([])
      setAmount("")
      return
    }
    try {
      const open = await loadDialogBills(name)
      setDialogBills(open)
      const due = open.reduce((sum, bill) => sum + bill.balance, 0)
      setAmount(due > 0 ? String(round2(due)) : "")
      fillLines(name, due, open)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load supplier orders")
    }
  }

  const onAmountChange = (value: string) => {
    setAmount(value)
    if (autoAllocate) fillLines(partyName, Number(value) || 0, dialogBills)
  }

  const allocatedNow = round2(
    lines.reduce((sum, line) => sum + (Number(line.amount) > 0 ? Number(line.amount) : 0), 0)
  )
  const enteredAmount = Number(amount) || 0
  const leftover = round2(enteredAmount - allocatedNow)
  const advanceMode = method.toLowerCase().includes("advance")

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
      await Promise.all([loadBills(), loadPayments()])
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
      await Promise.all([loadBills(), loadPayments()])
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
      await Promise.all([loadBills(), loadPayments()])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete payment", { id: toastId })
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-4">
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
          <PermissionGate feature="Supplier Payments" action="create" also="special">
<Button
              size="sm"
              onClick={() => openDialogFor()}
              className="h-9 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {outgoing ? "Pay Supplier" : "Collect Payment"}
            </Button>
</PermissionGate>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
<PermissionGate feature="Supplier Payments" action="overview:openBills">
<Card className="border-slate-200 p-4 shadow-none">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Open {outgoing ? "bills" : "invoices"}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.openCount}</p>
        </Card>
</PermissionGate>
<PermissionGate feature="Supplier Payments" action="overview:payable">
<Card className="border-slate-200 p-4 shadow-none">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {outgoing ? "Accounts payable" : "Accounts receivable"}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{money(summary.outstanding)}</p>
        </Card>
</PermissionGate>
<PermissionGate feature="Supplier Payments" action="overview:paid">
<Card className="border-slate-200 p-4 shadow-none">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {outgoing ? "Paid to suppliers" : "Collected from buyers"}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{money(summary.settled || 0)}</p>
          <p className="mt-1 text-[11px] text-slate-400">Unapplied advance {money(summary.advanceBalance)}</p>
        </Card>
</PermissionGate>
      </div>

      <Card className="border-slate-200 p-4 shadow-none">
        {/* Navigation Tabs (White Active State, RBAC style) */}
        <div className="mb-3 border-b border-slate-100 pb-3">
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "orders"
                  ? "bg-white font-bold text-slate-900 shadow-xs ring-1 ring-slate-900/5"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              {outgoing ? (
                <ArrowUpRight className={`h-3.5 w-3.5 ${activeTab === "orders" ? "text-[#0090FF]" : "text-slate-400"}`} />
              ) : (
                <ArrowDownLeft className={`h-3.5 w-3.5 ${activeTab === "orders" ? "text-[#0090FF]" : "text-slate-400"}`} />
              )}
              <span>{outgoing ? "Purchase Order" : "Sales Order"}</span>
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === "orders" ? "bg-blue-50 text-[#0090FF]" : "bg-slate-200/70 text-slate-600"
                }`}
              >
                {billsMeta.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "register"
                  ? "bg-white font-bold text-slate-900 shadow-xs ring-1 ring-slate-900/5"
                  : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              <Wallet className={`h-3.5 w-3.5 ${activeTab === "register" ? "text-[#0090FF]" : "text-slate-400"}`} />
              <span>Payment Register</span>
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === "register" ? "bg-blue-50 text-[#0090FF]" : "bg-slate-200/70 text-slate-600"
                }`}
              >
                {paymentsMeta.total}
              </span>
            </button>
          </div>
        </div>

        {activeTab === "orders" && (
        <div className="space-y-3">
          <ServerListToolbar
            search={billsQuery.search}
            onSearchChange={billsQuery.setSearch}
            searchPlaceholder={`Search order, ${partyLabel.toLowerCase()}, or terms...`}
            loading={billsLoading}
            filters={[
              {
                id: "partyName",
                value: billsQuery.filters.partyName || "all",
                onValueChange: (value) => billsQuery.setFilter("partyName", value),
                options: [
                  { value: "all", label: `All ${partyLabel}s` },
                  ...parties.map((party) => ({ value: party.name, label: party.name })),
                ],
                placeholder: `All ${partyLabel}s`,
                widthClassName: "w-[190px]",
              },
              {
                id: "status",
                value: billsQuery.filters.status || "all",
                onValueChange: (value) => billsQuery.setFilter("status", value),
                options: PO_STATUS_OPTIONS,
                placeholder: "All Statuses",
                widthClassName: "w-[190px]",
              },
            ]}
          />
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
            {billsLoading && bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-xs text-slate-400">Loading open orders...</TableCell>
              </TableRow>
            ) : bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-xs text-slate-400">
                  No open balances match this search or filter.
                </TableCell>
              </TableRow>
            ) : (
              bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="py-3">
                    <span className="block font-mono text-xs font-bold text-[#0090FF]">{bill.number}</span>
                    <span className="text-[10px] text-slate-400">{bill.date}</span>
                  </TableCell>
                  <TableCell className="py-3 text-xs font-semibold text-slate-800">
                    {bill.partyId ? (
                      <Link
                        href={`/procurement/suppliers/${bill.partyId}`}
                        className="text-[#0090FF] transition-colors hover:text-[#0080e5] hover:underline"
                      >
                        {bill.partyName}
                      </Link>
                    ) : (
                      bill.partyName
                    )}
                  </TableCell>
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
          <ServerListPagination
            page={billsQuery.page}
            totalPages={billsMeta.totalPages}
            total={billsMeta.total}
            limit={billsQuery.limit}
            onPageChange={billsQuery.setPage}
            onLimitChange={billsQuery.setLimit}
            loading={billsLoading}
          />
        </div>
        )}

        {activeTab === "register" && (
        <div className="space-y-3">
          <ServerListToolbar
            search={paymentsQuery.search}
            onSearchChange={paymentsQuery.setSearch}
            searchPlaceholder={`Search receipt, ${partyLabel.toLowerCase()}, or ref...`}
            loading={paymentsLoading}
            filters={[
              {
                id: "partyName",
                value: paymentsQuery.filters.partyName || "all",
                onValueChange: (value) => paymentsQuery.setFilter("partyName", value),
                options: [
                  { value: "all", label: `All ${partyLabel}s` },
                  ...parties.map((party) => ({ value: party.name, label: party.name })),
                ],
                placeholder: `All ${partyLabel}s`,
                widthClassName: "w-[190px]",
              },
              {
                id: "method",
                value: paymentsQuery.filters.method || "all",
                onValueChange: (value) => paymentsQuery.setFilter("method", value),
                options: [
                  { value: "all", label: "All Methods" },
                  ...methods.map((item) => ({ value: item, label: item })),
                ],
                placeholder: "All Methods",
                widthClassName: "w-[190px]",
              },
            ]}
          />
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
            {paymentsLoading && payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-400">Loading payments...</TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  No payments match this search or filter.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="py-3">
                    <span className="block font-mono text-xs font-bold text-slate-800">{payment.paymentNumber}</span>
                    <span className="text-[10px] text-slate-400">{payment.paymentDate}</span>
                  </TableCell>
                  <TableCell className="py-3 text-xs font-semibold text-slate-800">
                    {payment.partyId ? (
                      <Link
                        href={`/procurement/suppliers/${payment.partyId}`}
                        className="text-[#0090FF] transition-colors hover:text-[#0080e5] hover:underline"
                      >
                        {payment.partyName}
                      </Link>
                    ) : (
                      payment.partyName
                    )}
                  </TableCell>
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
                      {payment.status === "COMPLETED" && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => setReverseTarget(payment)}>
                          <RotateCcw className="mr-1 h-3 w-3" />
                          Reverse
                        </Button>
                      )}
                      <PermissionGate feature="Supplier Payments" action="delete">
<Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-rose-600" onClick={() => setDeleteTarget(payment)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
</PermissionGate>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
          <ServerListPagination
            page={paymentsQuery.page}
            totalPages={paymentsMeta.totalPages}
            total={paymentsMeta.total}
            limit={paymentsQuery.limit}
            onPageChange={paymentsQuery.setPage}
            onLimitChange={paymentsQuery.setLimit}
            loading={paymentsLoading}
          />
        </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle className="text-base">Pay supplier</DialogTitle>
            <DialogDescription className="text-xs">
              Money is applied to the oldest open purchase orders first. Anything left over stays as an advance for the next bill.
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
            <PermissionGate feature="Supplier Payments" action="create" also="special">
<Button onClick={submit} disabled={saving} className="bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]">
                <Banknote className="mr-1.5 h-3.5 w-3.5" />
                {saving ? "Saving..." : outgoing ? "Record payment" : "Record receipt"}
              </Button>
</PermissionGate>
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
    </div>
  )
}
