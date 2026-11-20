"use client"

import PermissionGate from "@/components/permission-gate"

import * as React from "react"
import Link from "next/link"
import { GlobalLoadingSpinner } from "@/components/ui/global-loading-spinner"
import {
  AccountFormDialog,
  type FinancialAccountRecord,
} from "@/components/finance/account-form-dialog"
import { apiFetch } from "@/lib/api"
import {
  ServerListPagination,
  ServerListToolbar,
  useServerListQuery,
} from "@/components/server-list-controls"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Landmark,
  Plus,
  Download,
  Filter,
  Wallet,
  Building2,
  ArrowRight,
  ArrowRightLeft,
  Trash2,
  CheckCircle2,
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  RefreshCw,
  Printer,
  Pencil,
  Copy,
  TrendingUp,
  Search,
} from "lucide-react"

type AccountRecord = FinancialAccountRecord

interface TransactionRecord {
  id: string
  entryDate: string
  refCode: string
  flowType: "INFLOW" | "OUTFLOW" | "TRANSFER" | "LOAN"
  particulars: string
  fundingEntity?: string
  method: string
  amount: number
  sourceAccountId?: string
  destinationAccountId?: string
  sourceAccount?: AccountRecord
  destinationAccount?: AccountRecord
  reconciliationStatus: "Reconciled" | "In Transit" | "Unreconciled"
}

interface LedgerMetrics {
  totalBankLiquidity: number
  totalCashSafeLiquidity: number
  totalCombinedFunds: number
  totalInflows: number
  totalOutflows: number
  totalLoans: number
  totalTransfers: number
  activeAccountsCount: number
  bankCount: number
  cashCount: number
  totalTransactionCount: number
  reconciledTxCount: number
  pendingReconciliationCount: number
}

function numberToWordsBDT(num: number): string {
  if (num === 0) return "Zero Taka Only"
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ]

  function inWords(n: number): string {
    if (n < 20) return a[n]
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "")
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + inWords(n % 100) : "")
      )
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + inWords(n % 1000) : "")
      )
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + inWords(n % 100000) : "")
      )
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "")
    )
  }

  const rounded = Math.round(Math.abs(num))
  return inWords(rounded).trim() + " Taka Only"
}

function linkedRecordSummary(account: AccountRecord): string {
  const parts: string[] = []
  const journal =
    Number(
      account.blockingTransactionCount !== undefined
        ? account.blockingTransactionCount
        : account.transactionCount
    ) || 0
  const collections = Number(account.linkedCollections) || 0
  const expenses = Number(account.linkedExpenses) || 0
  const settlements = Number(account.linkedSettlements) || 0

  if (journal > 0) {
    parts.push(`${journal} business transaction${journal === 1 ? "" : "s"}`)
  }
  if (collections > 0) parts.push(`${collections} collection${collections === 1 ? "" : "s"}`)
  if (expenses > 0) parts.push(`${expenses} expense voucher${expenses === 1 ? "" : "s"}`)
  if (settlements > 0) parts.push(`${settlements} settlement${settlements === 1 ? "" : "s"}`)

  return parts.join(", ")
}

export default function AccountLedgerPage() {
  const [accounts, setAccounts] = React.useState<AccountRecord[]>([])
  const [ledger, setLedger] = React.useState<TransactionRecord[]>([])
  const [metrics, setMetrics] = React.useState<LedgerMetrics | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Server-side list state (search / filters / sort / pagination)
  const listQuery = useServerListQuery({
    initialLimit: 10,
    initialSortBy: "createdAt",
    initialSortOrder: "desc",
    initialFilters: { flowType: "all", accountId: "all", reconciliationStatus: "all" },
  })
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)

  // Modals
  const [isAccountFormOpen, setIsAccountFormOpen] = React.useState(false)
  const [editingAccount, setEditingAccount] = React.useState<AccountRecord | null>(null)
  const [isTxOpen, setIsTxOpen] = React.useState(false)
  const [isPrintOpen, setIsPrintOpen] = React.useState(false)
  const [printTarget, setPrintTarget] = React.useState<TransactionRecord | null>(null)

  // Account list filters
  const [accountSearch, setAccountSearch] = React.useState("")
  const [accountCategoryFilter, setAccountCategoryFilter] = React.useState<"all" | "BANK" | "CASH">(
    "all"
  )

  // Global Delete Modal State
  const [deleteItem, setDeleteItem] = React.useState<{
    type: "ACCOUNT" | "TRANSACTION"
    id: string
    title: string
  } | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Post Transaction Form State
  const [txFlow, setTxFlow] = React.useState<"INFLOW" | "OUTFLOW" | "TRANSFER" | "LOAN">("TRANSFER")
  const [sourceAccountId, setSourceAccountId] = React.useState("")
  const [destinationAccountId, setDestinationAccountId] = React.useState("")
  const [txParticulars, setTxParticulars] = React.useState("")
  const [txFundingEntity, setTxFundingEntity] = React.useState("")
  const [txMethod, setTxMethod] = React.useState("Cash Handover")
  const [txAmount, setTxAmount] = React.useState("")
  const [txStatus, setTxStatus] = React.useState<"Reconciled" | "In Transit" | "Unreconciled">("Reconciled")
  const [isSubmittingTx, setIsSubmittingTx] = React.useState(false)

  // Fetch Central Treasury Data
  const fetchBackendData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [accRes, txRes, metricsRes] = await Promise.all([
        apiFetch("/account-ledger/accounts").catch(() => null),
        apiFetch(`/account-ledger/transactions?${listQuery.queryKey}`).catch(() => null),
        apiFetch("/account-ledger/metrics").catch(() => null),
      ])

      if (accRes && accRes.ok) {
        const json = await accRes.json()
        const rawAccs = json.data || json
        const list = Array.isArray(rawAccs) ? rawAccs : []
        const formatted = list.map((a: any) => ({
          ...a,
          balance: Number(a.balance) || 0,
          transactionCount: Number(a.transactionCount) || 0,
          blockingTransactionCount:
            a.blockingTransactionCount !== undefined
              ? Number(a.blockingTransactionCount) || 0
              : Number(a.transactionCount) || 0,
          linkedCollections: Number(a.linkedCollections) || 0,
          linkedExpenses: Number(a.linkedExpenses) || 0,
          linkedSettlements: Number(a.linkedSettlements) || 0,
          canDelete: a.canDelete !== false,
        }))
        setAccounts(formatted)

        if (formatted.length > 0 && !sourceAccountId) {
          setSourceAccountId(formatted[0].id)
          setDestinationAccountId(formatted[1]?.id || formatted[0].id)
        }
      }

      if (txRes && txRes.ok) {
        const json = await txRes.json()
        const rawTxs = json.data || json
        const list = Array.isArray(rawTxs) ? rawTxs : []
        setLedger(
          list.map((t: any) => ({
            ...t,
            amount: Number(t.amount) || 0,
          }))
        )
        const meta = json.meta || {}
        setTotalPages(meta.totalPage || meta.totalPages || 1)
        setTotalCount(meta.total ?? list.length)
      }

      if (metricsRes && metricsRes.ok) {
        const json = await metricsRes.json()
        setMetrics(json.data || null)
      }
    } catch (err) {
      console.error("Failed to load central treasury ledger:", err)
      toast.error("Failed to load central treasury ledger data from database.")
    } finally {
      setLoading(false)
    }
  }, [sourceAccountId, listQuery.queryKey])

  React.useEffect(() => {
    fetchBackendData()
  }, [fetchBackendData])

  // Aggregate Balances from Accounts
  const totalBankLiquidity = React.useMemo(() => {
    return accounts
      .filter((a) => a.category === "BANK")
      .reduce((sum, a) => sum + (a.balance || 0), 0)
  }, [accounts])

  const totalCashSafeLiquidity = React.useMemo(() => {
    return accounts
      .filter((a) => a.category === "CASH")
      .reduce((sum, a) => sum + (a.balance || 0), 0)
  }, [accounts])

  const totalCombinedFunds = totalBankLiquidity + totalCashSafeLiquidity

  const filteredAccounts = React.useMemo(() => {
    const term = accountSearch.trim().toLowerCase()
    return accounts.filter((account) => {
      if (accountCategoryFilter !== "all" && account.category !== accountCategoryFilter) {
        return false
      }
      if (!term) return true
      return [account.accountTitle, account.institution, account.accountNumber, account.branch]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    })
  }, [accounts, accountCategoryFilter, accountSearch])

  // Create / Edit Account Handlers
  const handleOpenAddAccount = () => {
    setEditingAccount(null)
    setIsAccountFormOpen(true)
  }

  const handleOpenEditAccount = (acc: AccountRecord) => {
    setEditingAccount(acc)
    setIsAccountFormOpen(true)
  }

  // Post Transaction Handler
  const handleOpenPostTx = () => {
    setTxFlow("TRANSFER")
    setTxParticulars("")
    setTxFundingEntity("")
    setTxMethod("Cash Handover")
    setTxAmount("")
    setTxStatus("Reconciled")
    if (accounts.length > 0) {
      setSourceAccountId(accounts[0].id)
      setDestinationAccountId(accounts[1]?.id || accounts[0].id)
    }
    setIsTxOpen(true)
  }

  const handlePostTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(txAmount)
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid positive amount.")
      return
    }

    if (txFlow === "TRANSFER" && sourceAccountId === destinationAccountId) {
      toast.error("Source and Destination accounts cannot be the same.")
      return
    }

    setIsSubmittingTx(true)
    const toastId = toast.loading(
      `Posting ৳${numAmount.toLocaleString("en-IN")} ${txFlow} to central ledger...`
    )

    try {
      const payload = {
        entryDate: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        flowType: txFlow,
        particulars:
          txParticulars.trim() ||
          (txFlow === "LOAN"
            ? "Loan Disbursement Intake"
            : txFlow === "TRANSFER"
            ? "Cash-to-Bank / Inter-account Transfer"
            : "Central Ledger Entry"),
        fundingEntity: txFundingEntity.trim(),
        method: txMethod,
        amount: numAmount,
        sourceAccountId:
          txFlow === "INFLOW" || txFlow === "LOAN" ? undefined : sourceAccountId,
        destinationAccountId:
          txFlow === "OUTFLOW" ? undefined : destinationAccountId,
        reconciliationStatus: txStatus,
      }

      const res = await apiFetch("/account-ledger/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || "Failed to post transaction")
      }

      const json = await res.json()
      const refCode = json.data?.refCode || "JRN"

      toast.success(
        `Transaction ${refCode} (৳${numAmount.toLocaleString("en-IN")}) posted and balances synchronized.`,
        { id: toastId }
      )

      setIsTxOpen(false)
      fetchBackendData()
    } catch (err: any) {
      console.error("Transaction post error:", err)
      toast.error(err.message || "Failed to submit transaction.", { id: toastId })
    } finally {
      setIsSubmittingTx(false)
    }
  }

  // Quick Reconcile Status Toggle
  const handleToggleReconciliation = async (
    tx: TransactionRecord,
    newStatus: "Reconciled" | "In Transit" | "Unreconciled"
  ) => {
    const toastId = toast.loading(`Marking transaction ${tx.refCode} as ${newStatus}...`)
    try {
      const res = await apiFetch(`/account-ledger/transactions/${tx.id}/reconcile`, {
        method: "PATCH",
        body: JSON.stringify({ reconciliationStatus: newStatus }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || "Failed to update reconciliation status")
      }

      toast.success(`Transaction ${tx.refCode} marked as ${newStatus}.`, { id: toastId })
      fetchBackendData()
    } catch (err: any) {
      console.error("Reconciliation error:", err)
      toast.error(err.message || "Failed to update status.", { id: toastId })
    }
  }

  // Delete Handlers via Global DeleteConfirmationModal
  const handleOpenDeleteAccount = (acc: AccountRecord) => {
    setDeleteItem({
      type: "ACCOUNT",
      id: acc.id,
      title: `${acc.accountTitle} (${acc.category === "CASH" ? "Cash Drawer" : "Bank Account"})`,
    })
    setIsDeleteModalOpen(true)
  }

  const handleOpenDeleteTransaction = (tx: TransactionRecord) => {
    setDeleteItem({
      type: "TRANSACTION",
      id: tx.id,
      title: `Transaction ${tx.refCode} • ${tx.flowType} (৳${tx.amount.toLocaleString("en-IN")})`,
    })
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteItem) return
    const isAcc = deleteItem.type === "ACCOUNT"
    setIsDeleting(true)
    const toastId = toast.loading(
      isAcc ? `Removing account "${deleteItem.title}"...` : `Reversing and removing ${deleteItem.title}...`
    )

    try {
      const url = isAcc
        ? `/account-ledger/accounts/${deleteItem.id}`
        : `/account-ledger/transactions/${deleteItem.id}`

      const res = await apiFetch(url, { method: "DELETE" })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(
          errData.message || (isAcc ? "Failed to delete account" : "Failed to delete transaction")
        )
      }

      toast.success(
        isAcc
          ? `Account "${deleteItem.title}" removed from the treasury ledger.`
          : `${deleteItem.title} reversed and removed. Balances rolled back.`,
        { id: toastId }
      )
      setIsDeleteModalOpen(false)
      setDeleteItem(null)
      fetchBackendData()
    } catch (error: any) {
      console.error("Error deleting:", error)
      toast.error(error.message || "Failed to complete delete operation.", { id: toastId })
    } finally {
      setIsDeleting(false)
    }
  }

  // Excel Export
  const handleExportExcel = () => {
    const exportRows = ledger.map((item) => ({
      "Entry Date": item.entryDate,
      "Ref Code": item.refCode,
      "Flow Type": item.flowType,
      "Source Account": item.sourceAccount?.accountTitle || "External Source / Payer",
      "Destination Account": item.destinationAccount?.accountTitle || "External Payee / Drawer",
      "Particulars / Reason": item.particulars,
      "Entity / Lender": item.fundingEntity || "N/A",
      Method: item.method,
      "Amount (BDT)": item.amount,
      Status: item.reconciliationStatus,
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Central Treasury Journal")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Central_Treasury_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
    toast.success(`Exported ${ledger.length} ledger records to Excel.`)
  }

  // Print Slip
  const handlePrint = (tx: TransactionRecord) => {
    setPrintTarget(tx)
    setIsPrintOpen(true)
  }

  const triggerDirectPrint = () => {
    window.print()
  }

  const copyRefToClipboard = (ref: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(ref)
      toast.success(`Copied ref code ${ref} to clipboard.`)
    }
  }

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-12 font-sans text-slate-900">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#0090FF]" />
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              CENTRAL TREASURY & LIQUIDITY MASTER
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Bank & Cash Journal Ledger
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time multi-account banking, cash drawers, loan intakes, and automated double-entry postings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchBackendData}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Ledger
          </Button>

          <PermissionGate feature="Bank Accounts Ledger" action="create">
<Button
              size="sm"
              variant="outline"
              onClick={handleOpenAddAccount}
              className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-none hover:bg-slate-50"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-600" />
              Add Account / Drawer
            </Button>
</PermissionGate>

          <PermissionGate feature="Bank Accounts Ledger" action="special">
<Button
              size="sm"
              onClick={handleOpenPostTx}
              className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-4 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
            >
              <Plus className="h-4 w-4" />
              Post Money / Transfer / Loan
            </Button>
</PermissionGate>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Combined Liquidity */}
<PermissionGate feature="Bank Accounts Ledger" action="overview:liquidity">
<Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Total Central Liquidity
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-slate-900">
            ৳{totalCombinedFunds.toLocaleString("en-IN")}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Across {accounts.length} active banks & physical drawers
          </p>
        </Card>
</PermissionGate>

        {/* Card 2: Bank Liquidity */}
<PermissionGate feature="Bank Accounts Ledger" action="overview:bankBalances">
<Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Corporate Bank Balances
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-[#0090FF]">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-[#0090FF]">
            ৳{totalBankLiquidity.toLocaleString("en-IN")}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            In {accounts.filter((a) => a.category === "BANK").length} corporate banking accounts
          </p>
        </Card>
</PermissionGate>

        {/* Card 3: Physical Cash Safe */}
<PermissionGate feature="Bank Accounts Ledger" action="overview:cashDrawers">
<Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Physical Cash Drawers
            </span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-700">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-purple-700">
            ৳{totalCashSafeLiquidity.toLocaleString("en-IN")}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            In {accounts.filter((a) => a.category === "CASH").length} vaults, retail desks & petty safes
          </p>
        </Card>
</PermissionGate>

        {/* Card 4: Total Inflows & Outflows */}
<PermissionGate feature="Bank Accounts Ledger" action="overview:flows">
<Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Total Inflows vs Outflows
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold text-emerald-600">
              +৳{(metrics?.totalInflows || 0).toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="font-mono text-sm font-semibold text-rose-600">
              -৳{(metrics?.totalOutflows || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {metrics?.totalTransactionCount || totalCount} recorded journal transactions
          </p>
        </Card>
</PermissionGate>
      </div>

      {/* 3. Dynamic Cash Counters & Banks Strip */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
              Active Vaults, Drawers & Banks ({filteredAccounts.length}
              {filteredAccounts.length !== accounts.length ? ` of ${accounts.length}` : ""})
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Open any account to see every posted transaction, opening balance, and balance
              adjustment. Accounts with business transactions cannot be deleted.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={accountSearch}
                onChange={(event) => setAccountSearch(event.target.value)}
                placeholder="Search accounts..."
                className="h-8 w-[190px] pl-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              {[
                { id: "all", label: "All" },
                { id: "BANK", label: "Bank Accounts" },
                { id: "CASH", label: "Cash Drawers" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setAccountCategoryFilter(tab.id as "all" | "BANK" | "CASH")
                  }
                  aria-pressed={accountCategoryFilter === tab.id}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    accountCategoryFilter === tab.id
                      ? "bg-[#0090FF] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && accounts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <GlobalLoadingSpinner message="Loading accounts..." className="py-0" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
            No bank accounts or cash drawers configured. Click{" "}
            <strong>"Add Account / Drawer"</strong> to create your first treasury account.
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
            No accounts match this search or filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAccounts.map((acc) => {
              const blockedBy = linkedRecordSummary(acc)
              const deleteBlocked = acc.canDelete === false
              const linkedCount = Number(acc.transactionCount) || 0
              const blockingCount = Number(acc.blockingTransactionCount) || 0
              const openingOnly = linkedCount > 0 && blockingCount === 0

              return (
                <Card
                  key={acc.id}
                  className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-none transition-all hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold ${
                          acc.category === "CASH"
                            ? "border-purple-200 bg-purple-50 text-purple-700"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                        }`}
                      >
                        {acc.category === "CASH" ? "Cash Drawer / Safe" : "Bank Account"}
                      </Badge>
                      <Link
                        href={`/finance/bank-ledger/${acc.id}`}
                        className="mt-1.5 block max-w-[190px] truncate text-xs font-bold text-slate-900 hover:text-[#0090FF] hover:underline"
                        title={`${acc.accountTitle} — open statement`}
                      >
                        {acc.accountTitle}
                      </Link>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <PermissionGate feature="Bank Accounts Ledger" action="edit">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditAccount(acc)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700"
                          title="Edit account"
                          aria-label={`Edit ${acc.accountTitle}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate feature="Bank Accounts Ledger" action="delete">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={deleteBlocked}
                          onClick={() => handleOpenDeleteAccount(acc)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                          title={
                            deleteBlocked
                              ? `Cannot delete: ${blockedBy}`
                              : "Delete account"
                          }
                          aria-label={`Delete ${acc.accountTitle}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </div>

                  <div
                    className={`mt-3 font-mono text-xl font-black tracking-tight ${
                      acc.balance < 0 ? "text-rose-600" : "text-slate-900"
                    }`}
                  >
                    ৳{acc.balance.toLocaleString("en-IN")}
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 truncate text-[10px] text-slate-400">
                    <span
                      className="truncate"
                      title={`${acc.institution}${acc.branch ? ` • ${acc.branch}` : ""}`}
                    >
                      {acc.institution}
                    </span>
                    <span className="shrink-0 font-mono font-semibold text-slate-500">
                      {acc.accountNumber}
                    </span>
                  </div>

                  <div className="mt-1 text-[10px] text-slate-400">
                    {acc.lastTransactionAt
                      ? `Last activity: ${new Date(acc.lastTransactionAt).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "short", year: "numeric" }
                        )}`
                      : "No transactions yet"}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <span className="text-[10px] font-semibold text-slate-500">
                      {openingOnly
                        ? `${linkedCount} opening balance record${
                            linkedCount === 1 ? "" : "s"
                          }`
                        : `${linkedCount} ledger entr${linkedCount === 1 ? "y" : "ies"}`}
                    </span>
                    <Link
                      href={`/finance/bank-ledger/${acc.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0090FF] hover:underline"
                    >
                      View statement
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {deleteBlocked && (
                    <p
                      className="mt-1 truncate text-[10px] font-medium text-amber-600"
                      title={`Cannot delete: ${blockedBy}`}
                    >
                      Delete locked: {blockedBy}
                    </p>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. Filter Toolbar & Operation Tabs */}
      <div className="space-y-3">
        {/* Quick Flow Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: "all", label: "All Operations" },
            { id: "transfer", label: "Transfers (Cash ⇄ Bank)" },
            { id: "loan", label: "Loans & Borrowing" },
            { id: "inflow", label: "Deposits & Inflows" },
            { id: "outflow", label: "Disbursements & Outflows" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => listQuery.setFilter("flowType", tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                listQuery.filters.flowType === tab.id
                  ? "bg-[#0090FF] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Server-driven search, account & status filters */}
        <ServerListToolbar
          search={listQuery.search}
          onSearchChange={listQuery.setSearch}
          searchPlaceholder="Search ref, particulars, lender, or accounts..."
          loading={loading}
          sort={{
            value: `${listQuery.sortBy}:${listQuery.sortOrder}`,
            onValueChange: (value) => {
              const [field, order] = value.split(":")
              listQuery.setSort(field, order === "asc" ? "asc" : "desc")
            },
            widthClassName: "w-[180px]",
            options: [
              { value: "createdAt:desc", label: "Newest entries first" },
              { value: "createdAt:asc", label: "Oldest entries first" },
              { value: "amount:desc", label: "Amount high → low" },
              { value: "amount:asc", label: "Amount low → high" },
              { value: "refCode:asc", label: "Ref code A–Z" },
            ],
          }}
          filters={[
            {
              id: "accountId",
              value: listQuery.filters.accountId || "all",
              onValueChange: (value) => listQuery.setFilter("accountId", value),
              placeholder: "All Accounts & Drawers",
              widthClassName: "w-[210px]",
              icon: <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />,
              options: [
                { value: "all", label: "All Accounts & Drawers" },
                ...accounts.map((a) => ({
                  value: a.id,
                  label: a.accountTitle,
                })),
              ],
            },
            {
              id: "reconciliationStatus",
              value: listQuery.filters.reconciliationStatus || "all",
              onValueChange: (value) => listQuery.setFilter("reconciliationStatus", value),
              placeholder: "All Statuses",
              widthClassName: "w-[150px]",
              options: [
                { value: "all", label: "All Statuses" },
                { value: "Reconciled", label: "Reconciled" },
                { value: "In Transit", label: "In Transit" },
                { value: "Unreconciled", label: "Unreconciled" },
              ],
            },
          ]}
        />
      </div>

      {/* 5. Main Journal Table */}
      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="mb-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              BANK & CASH JOURNAL LEDGER
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Live double-entry register of corporate bank movements, drawer handovers, and credit intakes.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Showing {ledger.length} of {totalCount} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-xs text-slate-600 bg-slate-50/50">
                <TableHead className="pl-3 py-3">Date & Ref</TableHead>
                <TableHead className="py-3">Operation Type</TableHead>
                <TableHead className="py-3">From (Source)</TableHead>
                <TableHead className="py-3">To (Destination)</TableHead>
                <TableHead className="py-3">Particulars / Channel</TableHead>
                <TableHead className="py-3 text-right">Amount (৳)</TableHead>
                <TableHead className="py-3 text-center">Status</TableHead>
                <TableHead className="pr-3 py-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-2 text-center">
                    <GlobalLoadingSpinner
                      message="Loading treasury ledger data from database..."
                      className="py-0"
                    />
                  </TableCell>
                </TableRow>
              ) : ledger.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    No matching journal records found. Click{" "}
                    <strong>"Post Money / Transfer / Loan"</strong> to create an entry.
                  </TableCell>
                </TableRow>
              ) : (
                ledger.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-b border-slate-50 text-xs hover:bg-slate-50/60 transition-colors"
                  >
                    <TableCell className="py-3 pl-3">
                      <span className="block font-semibold text-slate-900">
                        {row.entryDate}
                      </span>
                      <button
                        onClick={() => copyRefToClipboard(row.refCode)}
                        className="group flex items-center gap-1 font-mono text-[10px] text-[#0090FF] hover:underline"
                        title="Click to copy reference"
                      >
                        {row.refCode}
                        <Copy className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
                      </button>
                    </TableCell>

                    <TableCell className="py-3">
                      {row.flowType === "TRANSFER" && (
                        <Badge
                          variant="outline"
                          className="gap-1 border-purple-200 bg-purple-50 text-[10px] text-purple-700 font-semibold"
                        >
                          <ArrowRightLeft className="h-3 w-3" /> Transfer
                        </Badge>
                      )}
                      {row.flowType === "LOAN" && (
                        <Badge
                          variant="outline"
                          className="gap-1 border-amber-200 bg-amber-50 text-[10px] text-amber-700 font-semibold"
                        >
                          <Coins className="h-3 w-3" /> Loan Intake
                        </Badge>
                      )}
                      {row.flowType === "INFLOW" && (
                        <Badge
                          variant="outline"
                          className="gap-1 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 font-semibold"
                        >
                          <ArrowDownRight className="h-3 w-3" /> Inflow
                        </Badge>
                      )}
                      {row.flowType === "OUTFLOW" && (
                        <Badge
                          variant="outline"
                          className="gap-1 border-rose-200 bg-rose-50 text-[10px] text-rose-700 font-semibold"
                        >
                          <ArrowUpRight className="h-3 w-3" /> Outflow
                        </Badge>
                      )}
                      {(row.method === "Opening Balance" ||
                        row.method === "Balance Adjustment") && (
                        <span
                          className={`mt-1 block text-[10px] font-semibold ${
                            row.method === "Opening Balance"
                              ? "text-blue-600"
                              : "text-amber-600"
                          }`}
                        >
                          {row.method}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-slate-800">
                      {row.sourceAccount ? (
                        <div>
                          <Link
                            href={`/finance/bank-ledger/${row.sourceAccount.id}`}
                            className="block font-semibold text-slate-900 hover:text-[#0090FF] hover:underline"
                            title={`Open ${row.sourceAccount.accountTitle} statement`}
                          >
                            {row.sourceAccount.accountTitle}
                          </Link>
                          <span className="text-[10px] text-slate-400">
                            {row.sourceAccount.category === "CASH" ? "Cash Drawer" : "Bank Account"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">
                          {row.flowType === "LOAN"
                            ? "Lender / Credit Line"
                            : row.method === "Opening Balance"
                              ? "Account opening"
                              : row.method === "Balance Adjustment"
                                ? "Manual adjustment"
                                : "External Depositor"}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-slate-800">
                      {row.destinationAccount ? (
                        <div>
                          <Link
                            href={`/finance/bank-ledger/${row.destinationAccount.id}`}
                            className="block font-semibold text-slate-900 hover:text-[#0090FF] hover:underline"
                            title={`Open ${row.destinationAccount.accountTitle} statement`}
                          >
                            {row.destinationAccount.accountTitle}
                          </Link>
                          <span className="text-[10px] text-slate-400">
                            {row.destinationAccount.category === "CASH" ? "Cash Drawer" : "Bank Account"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">
                          {row.method === "Opening Balance"
                            ? "Account opening"
                            : row.method === "Balance Adjustment"
                              ? "Manual adjustment"
                              : "External Payee / Vendor"}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="max-w-[240px] py-3 text-slate-700">
                      <span className="block truncate font-medium text-slate-900" title={row.particulars}>
                        {row.particulars}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-slate-400">
                        {row.fundingEntity ? `Entity: ${row.fundingEntity} • ` : ""}
                        {row.method}
                      </span>
                    </TableCell>

                    <TableCell className="py-3 text-right font-mono text-sm font-bold">
                      <span
                        className={
                          row.flowType === "INFLOW"
                            ? "text-emerald-700"
                            : row.flowType === "OUTFLOW"
                            ? "text-rose-700"
                            : row.flowType === "LOAN"
                            ? "text-amber-700"
                            : "text-slate-900"
                        }
                      >
                        ৳{row.amount.toLocaleString("en-IN")}
                      </span>
                    </TableCell>

                    {/* Status with Quick Toggle */}
                    <TableCell className="py-3 text-center">
                      <Select
                        value={row.reconciliationStatus}
                        onValueChange={(val: any) => handleToggleReconciliation(row, val)}
                      >
                        <SelectTrigger className="h-6 w-[110px] mx-auto border-0 bg-transparent p-0 text-[10px] font-semibold focus:ring-0">
                          <SelectValue>
                            <Badge
                              variant="outline"
                              className={`cursor-pointer text-[10px] ${
                                row.reconciliationStatus === "Reconciled"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : row.reconciliationStatus === "In Transit"
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-slate-200 bg-slate-100 text-slate-600"
                              }`}
                            >
                              {row.reconciliationStatus}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectItem value="Reconciled">Reconciled</SelectItem>
                          <SelectItem value="In Transit">In Transit</SelectItem>
                          <SelectItem value="Unreconciled">Unreconciled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="py-3 pr-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePrint(row)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-[#0090FF]"
                          title="Print Official Slip"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <PermissionGate feature="Bank Accounts Ledger" action="delete">
<Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDeleteTransaction(row)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                            title="Reverse & Delete Entry"
                          >
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
        </div>

        {/* 6. Server Pagination */}
        <ServerListPagination
          page={listQuery.page}
          totalPages={totalPages}
          total={totalCount}
          limit={listQuery.limit}
          loading={loading}
          onPageChange={listQuery.setPage}
          onLimitChange={listQuery.setLimit}
        />
      </Card>

      {/* 7. Modal: Add / Edit Bank Account or Cash Drawer */}
      <AccountFormDialog
        open={isAccountFormOpen}
        onOpenChange={(open) => {
          setIsAccountFormOpen(open)
          if (!open) setEditingAccount(null)
        }}
        account={editingAccount}
        onSaved={fetchBackendData}
      />

      {/* 8. Modal: Post Money / Transfer / Loan */}
      <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Post Transaction / Transfer / Loan
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Inject capital, record bank loans, disburse funds, or transfer between Cash & Bank.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePostTransaction} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Operation Type *</Label>
              <Select value={txFlow} onValueChange={(val: any) => setTxFlow(val)}>
                <SelectTrigger className="h-8 bg-white font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="TRANSFER">
                    Internal Transfer (Cash ⇄ Bank / Safe ⇄ Safe)
                  </SelectItem>
                  <SelectItem value="LOAN">
                    Loan Intake (Bank Loan / Director Borrowing)
                  </SelectItem>
                  <SelectItem value="INFLOW">
                    Deposit / Capital Inflow (Chemist Collection, Equity)
                  </SelectItem>
                  <SelectItem value="OUTFLOW">
                    Direct Outflow / External Disbursement
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transfer Mode */}
            {txFlow === "TRANSFER" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    From Account / Drawer *
                  </Label>
                  <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
                    <SelectTrigger className="h-8 bg-white">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.accountTitle} (৳{a.balance.toLocaleString("en-IN")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    To Account / Drawer *
                  </Label>
                  <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
                    <SelectTrigger className="h-8 bg-white">
                      <SelectValue placeholder="Destination" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.accountTitle} (৳{a.balance.toLocaleString("en-IN")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Loan Mode */}
            {txFlow === "LOAN" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Lender / Financial Source *
                  </Label>
                  <Input
                    placeholder="e.g. BRAC Bank Term Loan / Director Loan"
                    value={txFundingEntity}
                    onChange={(e) => setTxFundingEntity(e.target.value)}
                    required
                    className="h-8 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Crediting Into *</Label>
                  <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
                    <SelectTrigger className="h-8 bg-white">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.accountTitle} (৳{a.balance.toLocaleString("en-IN")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Inflow Mode */}
            {txFlow === "INFLOW" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Depositor / Payer Entity
                  </Label>
                  <Input
                    placeholder="e.g. Popular Chemist / Investor Equity"
                    value={txFundingEntity}
                    onChange={(e) => setTxFundingEntity(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Depositing Into *</Label>
                  <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
                    <SelectTrigger className="h-8 bg-white">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.accountTitle} (৳{a.balance.toLocaleString("en-IN")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Outflow Mode */}
            {txFlow === "OUTFLOW" && (
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Paying Out From Account / Drawer *
                </Label>
                <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
                  <SelectTrigger className="h-8 bg-white">
                    <SelectValue placeholder="Select Account" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.accountTitle} (৳{a.balance.toLocaleString("en-IN")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Amount (৳) *</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  required
                  className="h-8 font-mono text-sm font-bold text-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Payment Channel</Label>
                <Select value={txMethod} onValueChange={setTxMethod}>
                  <SelectTrigger className="h-8 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Cash Handover">
                      Cash Handover / Counter Deposit
                    </SelectItem>
                    <SelectItem value="BEFTN / RTGS">BEFTN / RTGS</SelectItem>
                    <SelectItem value="Cheque Deposit">Cheque Deposit</SelectItem>
                    <SelectItem value="ATM Withdrawal">ATM Withdrawal</SelectItem>
                    <SelectItem value="Online Transfer">Online / App Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Particulars / Description
                </Label>
                <Input
                  placeholder="Reason for transfer, loan intake, or expense..."
                  value={txParticulars}
                  onChange={(e) => setTxParticulars(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Reconciliation Status</Label>
                <Select value={txStatus} onValueChange={(val: any) => setTxStatus(val)}>
                  <SelectTrigger className="h-8 bg-white font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Reconciled">Reconciled (Immediate Credit)</SelectItem>
                    <SelectItem value="In Transit">In Transit (Cheque / BEFTN Hold)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTxOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingTx}
                className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
              >
                {isSubmittingTx ? "Posting..." : "Post to Ledger"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 9. Modal: Printable A4 Voucher Slip */}
      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent className="rounded-2xl bg-white p-4 shadow-xl sm:max-w-[650px] sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800">
              Official Central Treasury Journal Voucher
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Printable audit-ready voucher for physical bank files and accounting verification.
            </DialogDescription>
          </DialogHeader>

          {printTarget && (
            <div className="mt-4 rounded-xl border border-slate-300 bg-white p-4 font-sans text-slate-900 sm:p-6 print:border-none print:p-0">
              {/* Slip Header */}
              <div className="flex flex-col gap-4 border-b-2 border-slate-900 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">
                    AK PHARMA LIMITED
                  </h2>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Central Treasury & Cash Management Division
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Corporate HQ: Gulshan-2, Dhaka-1212, Bangladesh
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className="border-slate-800 text-slate-900 font-mono font-bold text-xs"
                  >
                    VOUCHER
                  </Badge>
                  <div className="mt-2 font-mono text-xs font-bold text-slate-900">
                    {printTarget.refCode}
                  </div>
                  <div className="text-[11px] text-slate-500">{printTarget.entryDate}</div>
                </div>
              </div>

              {/* Transaction Metadata Grid */}
              <div className="grid grid-cols-1 gap-4 border-b border-slate-200 py-4 text-xs sm:grid-cols-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Operation Flow
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {printTarget.flowType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Payment Channel
                  </span>
                  <span className="font-medium text-slate-800">{printTarget.method}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Source Account (Debit / Out)
                  </span>
                  <span className="font-semibold text-slate-900">
                    {printTarget.sourceAccount?.accountTitle || "External Payer / Source"}
                  </span>
                  {printTarget.sourceAccount?.accountNumber && (
                    <span className="text-[10px] text-slate-500 block font-mono">
                      A/C: {printTarget.sourceAccount.accountNumber}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Destination Account (Credit / In)
                  </span>
                  <span className="font-semibold text-slate-900">
                    {printTarget.destinationAccount?.accountTitle || "External Payee / Safe"}
                  </span>
                  {printTarget.destinationAccount?.accountNumber && (
                    <span className="text-[10px] text-slate-500 block font-mono">
                      A/C: {printTarget.destinationAccount.accountNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Particulars & Amount */}
              <div className="py-4 border-b border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Particulars / Description
                </span>
                <p className="text-xs font-medium text-slate-800 mt-0.5">
                  {printTarget.particulars}
                </p>
                {printTarget.fundingEntity && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Entity / Counterparty: <strong>{printTarget.fundingEntity}</strong>
                  </p>
                )}

                <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Amount in Words
                    </span>
                    <span className="text-xs font-bold italic text-slate-800">
                      {numberToWordsBDT(printTarget.amount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Total Transacted
                    </span>
                    <span className="font-mono text-xl font-black text-slate-900">
                      ৳{printTarget.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formal Signatures */}
              <div className="mt-12 grid grid-cols-1 gap-6 pt-4 text-center text-xs text-slate-500 sm:grid-cols-3">
                <div className="border-t border-slate-400 pt-1">
                  <span className="font-semibold block text-slate-800">Treasury Officer</span>
                  <span className="text-[10px]">Prepared By</span>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <span className="font-semibold block text-slate-800">Internal Auditor</span>
                  <span className="text-[10px]">Verified By</span>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <span className="font-semibold block text-slate-800">Chief Financial Officer</span>
                  <span className="text-[10px]">Authorized Signature</span>
                </div>
              </div>

              <div className="mt-8 text-center text-[10px] text-slate-400 font-mono">
                System-generated audit voucher • 21 CFR Part 11 compliant • AK Pharma ERP
              </div>
            </div>
          )}

          <DialogFooter className="mt-2 flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPrintOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={triggerDirectPrint}
              className="bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" /> Print Voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 10. Global Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title={
          deleteItem?.type === "ACCOUNT"
            ? "Remove Bank Account / Cash Drawer"
            : "Reverse & Delete Journal Transaction"
        }
        description={
          deleteItem?.type === "ACCOUNT"
            ? "Are you sure you want to remove this account? Accounts with business transactions, collections, expense vouchers, or settlements cannot be deleted. Opening balance records are removed with the account."
            : "Are you sure you want to reverse and delete this journal transaction? Account balances will be automatically adjusted to their prior state."
        }
        itemName={deleteItem?.title}
        confirmText={deleteItem?.type === "ACCOUNT" ? "Remove Account" : "Reverse Transaction"}
        cancelText="Cancel"
        isDeleting={isDeleting}
      />
    </div>
  )
}
