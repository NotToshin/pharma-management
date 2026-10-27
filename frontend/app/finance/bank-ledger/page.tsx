"use client"

import * as React from "react"
import { apiFetch } from "@/lib/api"
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
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  Search,
  Filter,
  Wallet,
  Building2,
  ArrowRightLeft,
  Trash2,
  CheckCircle2,
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  RefreshCw,
  Printer,
  Receipt,
  Pencil,
  Copy,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Clock,
} from "lucide-react"

const PRINT_STYLES = `
@page { size: A4 portrait; margin: 10mm; }
@media print {
  html, body { height: auto !important; overflow: visible !important; background: #ffffff !important; }
  body * { visibility: hidden !important; }
  #print-standalone-bank-voucher, #print-standalone-bank-voucher * { visibility: visible !important; }
  #print-standalone-bank-voucher {
    position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; background: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .print\\:hidden, button { display: none !important; }
}
`

export const BANGLADESH_BANKS = {
  conventional: [
    "Eastern Bank PLC",
    "BRAC Bank PLC",
    "City Bank PLC",
    "Dutch-Bangla Bank PLC",
    "United Commercial Bank (UCB)",
    "Prime Bank PLC",
    "Mutual Trust Bank (MTB)",
    "Dhaka Bank PLC",
    "Bank Asia PLC",
    "Pubali Bank PLC",
  ],
  islamic: [
    "Islami Bank Bangladesh PLC",
    "Al-Arafah Islami Bank PLC",
    "Shahjalal Islami Bank PLC",
    "Social Islami Bank PLC (SIBL)",
    "EXIM Bank Bangladesh PLC",
  ],
  foreign: [
    "Standard Chartered Bank",
    "HSBC Bangladesh",
    "Citibank N.A.",
    "Commercial Bank of Ceylon",
  ],
  cashCounters: [
    "Head Office Cash Safe",
    "Sales Counter Cash Drawer",
    "Mirpur Depot Petty Safe",
    "Factory Plant Cash Vault",
  ],
}

interface AccountRecord {
  id: string
  accountTitle: string
  category: "BANK" | "CASH"
  institution: string
  accountNumber: string
  branch: string
  accountClass: string
  balance: number
  isActive?: boolean
}

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

export default function AccountLedgerPage() {
  const [accounts, setAccounts] = React.useState<AccountRecord[]>([])
  const [ledger, setLedger] = React.useState<TransactionRecord[]>([])
  const [metrics, setMetrics] = React.useState<LedgerMetrics | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Filters & Search
  const [searchQuery, setSearchQuery] = React.useState("")
  const [accountFilter, setAccountFilter] = React.useState("all")
  const [flowFilter, setFlowFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = React.useState(false)
  const [isEditAccountOpen, setIsEditAccountOpen] = React.useState(false)
  const [isTxOpen, setIsTxOpen] = React.useState(false)
  const [isPrintOpen, setIsPrintOpen] = React.useState(false)
  const [printTarget, setPrintTarget] = React.useState<TransactionRecord | null>(null)

  // Global Delete Modal State
  const [deleteItem, setDeleteItem] = React.useState<{
    type: "ACCOUNT" | "TRANSACTION"
    id: string
    title: string
  } | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Add / Edit Account Form State
  const [editingAccountId, setEditingAccountId] = React.useState<string | null>(null)
  const [accCategory, setAccCategory] = React.useState<"BANK" | "CASH">("BANK")
  const [accInstitution, setAccInstitution] = React.useState(BANGLADESH_BANKS.conventional[0])
  const [accTitle, setAccTitle] = React.useState("")
  const [accNumber, setAccNumber] = React.useState("")
  const [accBranch, setAccBranch] = React.useState("")
  const [accClass, setAccClass] = React.useState("Current")
  const [accBalance, setAccBalance] = React.useState("")
  const [isSavingAccount, setIsSavingAccount] = React.useState(false)

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
        apiFetch("/account-ledger/transactions").catch(() => null),
        apiFetch("/account-ledger/metrics").catch(() => null),
      ])

      if (accRes && accRes.ok) {
        const json = await accRes.json()
        const rawAccs = json.data || json
        const list = Array.isArray(rawAccs) ? rawAccs : []
        const formatted = list.map((a: any) => ({
          ...a,
          balance: Number(a.balance) || 0,
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
  }, [sourceAccountId])

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

  // Filtered Ledger
  const filteredLedger = React.useMemo(() => {
    return ledger.filter((item) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        item.particulars.toLowerCase().includes(q) ||
        item.refCode.toLowerCase().includes(q) ||
        (item.fundingEntity && item.fundingEntity.toLowerCase().includes(q)) ||
        item.method.toLowerCase().includes(q) ||
        (item.sourceAccount?.accountTitle &&
          item.sourceAccount.accountTitle.toLowerCase().includes(q)) ||
        (item.destinationAccount?.accountTitle &&
          item.destinationAccount.accountTitle.toLowerCase().includes(q))

      const matchesAccount =
        accountFilter === "all" ||
        item.sourceAccountId === accountFilter ||
        item.destinationAccountId === accountFilter

      const matchesFlow =
        flowFilter === "all" ||
        item.flowType.toLowerCase() === flowFilter.toLowerCase()

      const matchesStatus =
        statusFilter === "all" || item.reconciliationStatus === statusFilter

      return matchesSearch && matchesAccount && matchesFlow && matchesStatus
    })
  }, [ledger, searchQuery, accountFilter, flowFilter, statusFilter])

  // Pagination Variables
  const totalItems = filteredLedger.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedLedger = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredLedger.slice(startIndex, startIndex + pageSize)
  }, [filteredLedger, currentPage, pageSize])

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, accountFilter, flowFilter, statusFilter, pageSize])

  // Create Account Handler
  const handleOpenAddAccount = () => {
    setEditingAccountId(null)
    setAccCategory("BANK")
    setAccInstitution(BANGLADESH_BANKS.conventional[0])
    setAccTitle("")
    setAccNumber("")
    setAccBranch("")
    setAccClass("Current")
    setAccBalance("0")
    setIsAddAccountOpen(true)
  }

  const handleOpenEditAccount = (acc: AccountRecord) => {
    setEditingAccountId(acc.id)
    setAccCategory(acc.category)
    setAccInstitution(acc.institution)
    setAccTitle(acc.accountTitle)
    setAccNumber(acc.accountNumber)
    setAccBranch(acc.branch)
    setAccClass(acc.accountClass)
    setAccBalance(String(acc.balance))
    setIsEditAccountOpen(true)
  }

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accTitle.trim()) {
      toast.error("Please enter an account title.")
      return
    }

    setIsSavingAccount(true)
    const isEdit = Boolean(editingAccountId)
    const toastId = toast.loading(
      isEdit ? `Updating account ${accTitle}...` : `Creating treasury account ${accTitle}...`
    )

    try {
      const payload: any = {
        accountTitle: accTitle.trim(),
        category: accCategory,
        institution: accInstitution,
        accountNumber: accNumber.trim() || (accCategory === "CASH" ? "CASH-VAULT" : "N/A"),
        branch: accBranch.trim() || "Main Office",
        accountClass: accClass,
      }

      if (isEdit) {
        payload.balance = parseFloat(accBalance) || 0
      } else {
        payload.initialBalance = parseFloat(accBalance) || 0
      }

      const res = await apiFetch(
        isEdit ? `/account-ledger/accounts/${editingAccountId}` : "/account-ledger/accounts",
        {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || "Failed to save treasury account")
      }

      toast.success(
        isEdit
          ? `Account "${accTitle}" updated successfully.`
          : `Treasury account "${accTitle}" registered in central ledger.`,
        { id: toastId }
      )

      setIsAddAccountOpen(false)
      setIsEditAccountOpen(false)
      fetchBackendData()
    } catch (err: any) {
      console.error("Account save error:", err)
      toast.error(err.message || "Failed to save account.", { id: toastId })
    } finally {
      setIsSavingAccount(false)
    }
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
          ? `Account "${deleteItem.title}" unlinked from central ledger.`
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
    const exportRows = filteredLedger.map((item) => ({
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
    toast.success(`Exported ${filteredLedger.length} ledger records to Excel.`)
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
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between shadow-xs">
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

          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenAddAccount}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-none hover:bg-slate-50"
          >
            <Building2 className="h-3.5 w-3.5 text-slate-600" />
            Add Account / Drawer
          </Button>

          <Button
            size="sm"
            onClick={handleOpenPostTx}
            className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-4 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
          >
            <Plus className="h-4 w-4" />
            Post Money / Transfer / Loan
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Combined Liquidity */}
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

        {/* Card 2: Bank Liquidity */}
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

        {/* Card 3: Physical Cash Safe */}
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

        {/* Card 4: Total Inflows & Outflows */}
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
            {metrics?.totalTransactionCount || ledger.length} recorded journal transactions
          </p>
        </Card>
      </div>

      {/* 3. Dynamic Cash Counters & Banks Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
            Active Vaults, Drawers & Banks ({accounts.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            Balances synchronize automatically on journal postings
          </span>
        </div>

        {accounts.length === 0 && !loading ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
            No bank accounts or cash drawers configured. Click{" "}
            <strong>"Add Account / Drawer"</strong> to create your first treasury account.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {accounts.map((acc) => (
              <Card
                key={acc.id}
                className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-none transition-all hover:border-slate-300"
              >
                <div className="flex items-start justify-between">
                  <div>
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
                    <strong
                      className="mt-1.5 block max-w-[170px] truncate text-xs font-bold text-slate-900"
                      title={acc.accountTitle}
                    >
                      {acc.accountTitle}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEditAccount(acc)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700"
                      title="Edit Account"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDeleteAccount(acc)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600"
                      title="Delete Account"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div
                  className={`mt-3 font-mono text-xl font-black tracking-tight ${
                    acc.balance < 0 ? "text-rose-600" : "text-slate-900"
                  }`}
                >
                  ৳{acc.balance.toLocaleString("en-IN")}
                </div>

                <div className="mt-2 flex items-center justify-between truncate text-[10px] text-slate-400">
                  <span className="truncate max-w-[120px]" title={acc.institution}>
                    {acc.institution}
                  </span>
                  <span className="font-mono font-semibold text-slate-500">
                    {acc.accountNumber}
                  </span>
                </div>
              </Card>
            ))}
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
              onClick={() => setFlowFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                flowFilter === tab.id
                  ? "bg-[#0090FF] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Account / Status Selectors */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between shadow-xs">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search ref, particulars, lender, or accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="h-8 w-[210px] border-slate-200 bg-white text-xs">
                <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                <SelectValue placeholder="All Accounts & Drawers" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Accounts & Drawers</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.accountTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[150px] border-slate-200 bg-white text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Reconciled">Reconciled</SelectItem>
                <SelectItem value="In Transit">In Transit</SelectItem>
                <SelectItem value="Unreconciled">Unreconciled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 5. Main Journal Table */}
      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              BANK & CASH JOURNAL LEDGER
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Live double-entry register of corporate bank movements, drawer handovers, and credit intakes.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Showing {paginatedLedger.length} of {totalItems} Filtered Records
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
                  <TableCell colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-[#0090FF]" />
                    Loading treasury ledger data from database...
                  </TableCell>
                </TableRow>
              ) : paginatedLedger.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    No matching journal records found. Click{" "}
                    <strong>"Post Money / Transfer / Loan"</strong> to create an entry.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLedger.map((row) => (
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
                    </TableCell>

                    <TableCell className="py-3 text-slate-800">
                      {row.sourceAccount ? (
                        <div>
                          <strong className="block font-semibold text-slate-900">
                            {row.sourceAccount.accountTitle}
                          </strong>
                          <span className="text-[10px] text-slate-400">
                            {row.sourceAccount.category === "CASH" ? "Cash Drawer" : "Bank Account"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">
                          {row.flowType === "LOAN" ? "Lender / Credit Line" : "External Depositor"}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-slate-800">
                      {row.destinationAccount ? (
                        <div>
                          <strong className="block font-semibold text-slate-900">
                            {row.destinationAccount.accountTitle}
                          </strong>
                          <span className="text-[10px] text-slate-400">
                            {row.destinationAccount.category === "CASH" ? "Cash Drawer" : "Bank Account"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">
                          External Payee / Vendor
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDeleteTransaction(row)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          title="Reverse & Delete Entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 6. Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 mt-2 gap-3 bg-white">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * pageSize, totalItems)}
              </span>{" "}
              of <span className="font-semibold text-slate-800">{totalItems}</span> journal transactions
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px] text-slate-400">Per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-7 w-[68px] text-xs bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 text-xs border-slate-200 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
            </Button>

            <span className="text-xs font-semibold px-2 text-slate-600">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 text-xs border-slate-200 disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* 7. Modal: Add Bank Account or Cash Drawer */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Add Account or Cash Drawer
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create a new physical cash desk or connect an authorized bank account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAccount} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Type of Account</Label>
              <Select
                value={accCategory}
                onValueChange={(val: any) => {
                  setAccCategory(val)
                  setAccInstitution(
                    val === "CASH"
                      ? BANGLADESH_BANKS.cashCounters[0]
                      : BANGLADESH_BANKS.conventional[0]
                  )
                }}
              >
                <SelectTrigger className="h-8 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="BANK">Corporate Bank Account</SelectItem>
                  <SelectItem value="CASH">Physical Cash Drawer / Safe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">
                Financial Institution / Drawer
              </Label>
              <Select value={accInstitution} onValueChange={setAccInstitution}>
                <SelectTrigger className="h-8 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[260px] text-xs">
                  {accCategory === "CASH" ? (
                    <SelectGroup>
                      <SelectLabel className="text-[10px] text-slate-400">
                        Cash Registers & Safes
                      </SelectLabel>
                      {BANGLADESH_BANKS.cashCounters.map((safe) => (
                        <SelectItem key={safe} value={safe}>
                          {safe}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : (
                    <>
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-slate-400">
                          Conventional Banks
                        </SelectLabel>
                        {BANGLADESH_BANKS.conventional.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-slate-400">
                          Islamic Shariah Banks
                        </SelectLabel>
                        {BANGLADESH_BANKS.islamic.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-slate-400">
                          Foreign / Multinational Banks
                        </SelectLabel>
                        {BANGLADESH_BANKS.foreign.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Display Title *</Label>
              <Input
                placeholder="e.g. EBL Operations Clearing / HQ Main Cash Drawer"
                value={accTitle}
                onChange={(e) => setAccTitle(e.target.value)}
                required
                className="h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Account # / Vault Identifier
                </Label>
                <Input
                  placeholder="e.g. 104-102-998 or SAFE-01"
                  value={accNumber}
                  onChange={(e) => setAccNumber(e.target.value)}
                  className="h-8 font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Branch / Physical Location
                </Label>
                <Input
                  placeholder="e.g. Gulshan Corporate / Mirpur 10 HQ"
                  value={accBranch}
                  onChange={(e) => setAccBranch(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Account Class</Label>
                <Input
                  placeholder="Current / Petty Cash / Cash Desk"
                  value={accClass}
                  onChange={(e) => setAccClass(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Initial Balance (৳)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={accBalance}
                  onChange={(e) => setAccBalance(e.target.value)}
                  className="h-8 font-mono font-bold"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddAccountOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingAccount}
                className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
              >
                {isSavingAccount ? "Saving..." : "Save & Link Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 8. Modal: Edit Bank Account / Cash Drawer */}
      <Dialog open={isEditAccountOpen} onOpenChange={setIsEditAccountOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Treasury Account Details
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update branch locations, account titles, or adjust nominal balance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAccount} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Display Title *</Label>
              <Input
                value={accTitle}
                onChange={(e) => setAccTitle(e.target.value)}
                required
                className="h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Account # / Vault Identifier
                </Label>
                <Input
                  value={accNumber}
                  onChange={(e) => setAccNumber(e.target.value)}
                  className="h-8 font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Branch Location</Label>
                <Input
                  value={accBranch}
                  onChange={(e) => setAccBranch(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Account Class</Label>
                <Input
                  value={accClass}
                  onChange={(e) => setAccClass(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Adjusted Balance (৳)</Label>
                <Input
                  type="number"
                  value={accBalance}
                  onChange={(e) => setAccBalance(e.target.value)}
                  className="h-8 font-mono font-bold"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditAccountOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingAccount}
                className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
              >
                {isSavingAccount ? "Saving..." : "Update Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 9. Modal: Post Money / Transfer / Loan */}
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
              <div className="grid grid-cols-2 gap-3">
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
              <div className="grid grid-cols-2 gap-3">
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
              <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
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

      {/* 10. Modal: Printable A4 Voucher Slip */}
      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent className="max-h-[95vh] overflow-y-auto rounded-2xl bg-white sm:max-w-[760px] p-6 print:p-0 shadow-2xl">
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Official Bank & Treasury Voucher
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Treasury journal voucher #{printTarget?.refCode}
                </DialogDescription>
              </div>
              <Button
                size="sm"
                onClick={triggerDirectPrint}
                className="h-8 gap-1.5 bg-black hover:bg-neutral-800 text-xs font-semibold text-white"
              >
                <Printer className="h-3.5 w-3.5" /> Print Voucher
              </Button>
            </div>
          </DialogHeader>

          {printTarget && (
            <div className="space-y-6 pt-2">
              <div id="print-standalone-bank-voucher" className="w-full bg-white text-black font-sans text-xs selection:bg-none print:p-0">
                {/* 1. Header: Logo (left) + Solid Black Box (right) */}
                <div className="flex items-start justify-between">
                  {/* Brand Logo & Contact */}
                  <div className="flex flex-col items-start max-w-[340px]">
                    <img
                      src="/logo.svg"
                      alt="AK Pharma"
                      className="h-[74px] w-auto object-contain"
                    />
                    <div className="mt-1 text-[11px] leading-[1.35] text-black font-normal">
                      <p>Dhaka, Bangladesh</p>
                      <p>Phone: +8801712-611071, +8801798-112763</p>
                      <p>Email: akpharmabd@gmail.com</p>
                    </div>
                  </div>

                  {/* BANK VOUCHER Box */}
                  <div className="bg-black text-white px-8 py-3.5 flex items-center justify-center min-w-[210px] h-[68px]">
                    <span className="text-2xl font-extrabold tracking-[0.2em] text-white uppercase font-sans select-none whitespace-nowrap">
                      BANK VOUCHER
                    </span>
                  </div>
                </div>

                {/* 2. Side-by-Side Dual Boxes */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {/* Left Box: TRANSACTION ACCOUNTS */}
                  <div className="border border-black">
                    <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
                      TRANSACTION ACCOUNTS:
                    </div>
                    <div className="p-2.5 text-xs text-black space-y-1">
                      <p>
                        <span className="font-normal">Source (Debit / Out): </span>
                        <span className="font-semibold">
                          {printTarget.sourceAccount?.accountTitle || "External Source / Payee"}
                        </span>
                      </p>
                      {printTarget.sourceAccount?.accountNumber && (
                        <p className="font-mono text-[11px] text-neutral-600">
                          A/C: {printTarget.sourceAccount.accountNumber}
                        </p>
                      )}
                      <p className="pt-1">
                        <span className="font-normal">Destination (Credit / In): </span>
                        <span className="font-semibold">
                          {printTarget.destinationAccount?.accountTitle || "External Payee / Safe"}
                        </span>
                      </p>
                      {printTarget.destinationAccount?.accountNumber && (
                        <p className="font-mono text-[11px] text-neutral-600">
                          A/C: {printTarget.destinationAccount.accountNumber}
                        </p>
                      )}
                      {printTarget.fundingEntity && (
                        <p className="pt-1">
                          <span className="font-normal">Entity / Counterparty: </span>
                          <span className="font-semibold">{printTarget.fundingEntity}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Box: VOUCHER DETAILS */}
                  <div className="border border-black">
                    <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
                      VOUCHER NO: {printTarget.refCode}
                    </div>
                    <div className="p-2.5 text-xs text-black space-y-1">
                      <p>
                        <span className="font-normal">Date: </span>
                        <span className="font-semibold">{printTarget.entryDate}</span>
                      </p>
                      <p>
                        <span className="font-normal">Operation Flow: </span>
                        <span className="font-semibold">{printTarget.flowType}</span>
                      </p>
                      <p>
                        <span className="font-normal">Payment Channel: </span>
                        <span className="font-semibold">{printTarget.method}</span>
                      </p>
                      <p>
                        <span className="font-normal">Category: </span>
                        <span className="font-semibold">Central Treasury Journal Entry</span>
                      </p>
                      <p>
                        <span className="font-normal">Status: </span>
                        <span className="font-semibold">Posted & Reconciled</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Particulars Table */}
                <table className="w-full border-collapse border border-black mt-6 text-xs text-black">
                  <thead className="bg-black text-white font-bold text-xs uppercase">
                    <tr>
                      <th className="w-12 py-1.5 px-2 text-center border-r border-neutral-700">SL</th>
                      <th className="py-1.5 px-3 text-left border-r border-neutral-700">Particulars / Journal Memo</th>
                      <th className="w-36 py-1.5 px-3 text-right">Transacted Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black h-8">
                      <td className="py-1 px-2 text-center border-r border-black font-mono font-medium">
                        1
                      </td>
                      <td className="py-1 px-3 text-left border-r border-black font-semibold">
                        {printTarget.particulars}
                      </td>
                      <td className="py-1 px-3 text-right font-mono font-bold">
                        ৳{printTarget.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 4. Financial Summary: Amount in Words (Left) & Total (Right) */}
                <div className="flex items-stretch border border-black border-t-0">
                  {/* Left: Amount in Words */}
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div className="text-xs text-black">
                      <span className="font-semibold">Amount in Words: </span>
                      <span className="font-medium underline decoration-black decoration-1 underline-offset-4">
                        {numberToWordsBDT(printTarget.amount)}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-600 mt-2">
                      Treasury Instrument: {printTarget.method} • Flow: {printTarget.flowType}
                    </div>
                  </div>

                  {/* Right: Total box */}
                  <div className="w-80 border-l border-black">
                    <div className="flex text-xs">
                      <div className="w-36 bg-black text-white font-bold py-2.5 px-3 flex items-center">
                        TOTAL TRANSACTED:
                      </div>
                      <div className="flex-1 py-2.5 px-3 text-right font-mono font-bold text-sm text-black">
                        ৳{printTarget.amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Treasury Verification Box */}
                <div className="mt-6 border border-black">
                  <div className="bg-black text-white font-bold text-xs px-2.5 py-1 tracking-wider uppercase">
                    TREASURY RECONCILIATION & AUDIT COMPLIANCE:
                  </div>
                  <div className="p-3 text-xs text-black space-y-1">
                    <p>
                      1. System-generated electronic ledger record verified against bank statement & physical deposit slips.
                    </p>
                    <p>
                      2. Complies with Central Treasury operating procedures and statutory accounting regulations.
                    </p>
                  </div>
                </div>

                {/* 6. Signatures */}
                <div className="mt-14 pb-4 grid grid-cols-3 gap-8 text-center text-xs text-black">
                  <div>
                    <div className="w-40 mx-auto border-t border-black mb-1.5" />
                    <span className="font-semibold text-black">Treasury Officer</span>
                    <span className="block text-[10px] text-neutral-500">Prepared By</span>
                  </div>
                  <div>
                    <div className="w-40 mx-auto border-t border-black mb-1.5" />
                    <span className="font-semibold text-black">Internal Auditor</span>
                    <span className="block text-[10px] text-neutral-500">Verified By</span>
                  </div>
                  <div>
                    <div className="w-40 mx-auto border-t border-black mb-1.5" />
                    <span className="font-semibold text-black">Chief Financial Officer</span>
                    <span className="block text-[10px] text-neutral-500">Authorized Signatory</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pb-2 print:hidden pt-4 border-t border-slate-100">
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
                  className="gap-1.5 bg-black hover:bg-neutral-800 text-xs font-semibold text-white"
                >
                  <Printer className="h-4 w-4" /> Print Voucher
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 11. Global Delete Confirmation Modal */}
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
            ? "Are you sure you want to remove this account? This will unlink it from active central treasury accounts. Accounts with associated transactions cannot be deleted."
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
