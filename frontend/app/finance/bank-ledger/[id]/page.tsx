"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import PermissionGate from "@/components/permission-gate"
import { apiFetch } from "@/lib/api"
import {
  AccountFormDialog,
  type FinancialAccountRecord,
} from "@/components/finance/account-form-dialog"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { GlobalLoadingSpinner } from "@/components/ui/global-loading-spinner"
import {
  ServerListPagination,
  ServerListToolbar,
  useServerListQuery,
} from "@/components/server-list-controls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Coins,
  Download,
  Landmark,
  Pencil,
  RefreshCw,
  Trash2,
  Wallet,
} from "lucide-react"

interface AccountLinkCounts {
  journal: number
  collections: number
  expenses: number
  settlements: number
}

interface AccountSummary {
  balance: number
  totalCredits: number
  totalDebits: number
  netMovement: number
  transactionCount: number
  lastTransactionAt: string | null
}

interface AccountDetailsResponse {
  account: FinancialAccountRecord
  summary: AccountSummary
  linked: AccountLinkCounts
  canDelete: boolean
  deleteBlockedReason: string | null
}

interface LedgerRow {
  id: string
  entryDate: string
  refCode: string
  flowType: "INFLOW" | "OUTFLOW" | "TRANSFER" | "LOAN"
  particulars: string
  fundingEntity?: string | null
  method: string
  amount: number
  sourceAccountId?: string | null
  destinationAccountId?: string | null
  sourceAccount?: FinancialAccountRecord | null
  destinationAccount?: FinancialAccountRecord | null
  reconciliationStatus: "Reconciled" | "In Transit" | "Unreconciled"
  createdAt?: string
}

const money = (value: number) =>
  `৳${(Number(value) || 0).toLocaleString("en-IN")}`

function formatDateTime(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function directionForRow(row: LedgerRow, accountId: string): "IN" | "OUT" | "NONE" {
  if (row.destinationAccountId === accountId) return "IN"
  if (row.sourceAccountId === accountId) return "OUT"
  return "NONE"
}

function counterpartyForRow(row: LedgerRow, accountId: string): string {
  if (row.method === "Opening Balance") return "Account opening"
  if (row.method === "Balance Adjustment") return "Manual balance adjustment"

  const direction = directionForRow(row, accountId)
  if (direction === "IN") {
    return (
      row.sourceAccount?.accountTitle ||
      (row.flowType === "LOAN" ? "Lender / credit line" : "External depositor")
    )
  }
  if (direction === "OUT") {
    return row.destinationAccount?.accountTitle || "External payee / vendor"
  }
  return "—"
}

function linkedSummary(linked: AccountLinkCounts): string {
  const parts: string[] = []
  if (linked.journal > 0) {
    parts.push(`${linked.journal} ledger entr${linked.journal === 1 ? "y" : "ies"}`)
  }
  if (linked.collections > 0) {
    parts.push(`${linked.collections} collection${linked.collections === 1 ? "" : "s"}`)
  }
  if (linked.expenses > 0) {
    parts.push(`${linked.expenses} expense voucher${linked.expenses === 1 ? "" : "s"}`)
  }
  if (linked.settlements > 0) {
    parts.push(`${linked.settlements} settlement${linked.settlements === 1 ? "" : "s"}`)
  }
  return parts.join(", ")
}

function statusBadgeClass(status: string) {
  if (status === "Reconciled") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "In Transit") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-slate-200 bg-slate-100 text-slate-600"
}

export default function BankAccountDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const accountId = Array.isArray(params?.id) ? params.id[0] : params?.id || ""

  const [details, setDetails] = React.useState<AccountDetailsResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)

  const listQuery = useServerListQuery({
    initialLimit: 10,
    initialSortBy: "createdAt",
    initialSortOrder: "desc",
    initialFilters: { flowType: "all", reconciliationStatus: "all" },
  })
  const [rows, setRows] = React.useState<LedgerRow[]>([])
  const [rowsLoading, setRowsLoading] = React.useState(false)
  const [meta, setMeta] = React.useState({ total: 0, totalPages: 1 })
  const [statementRefresh, setStatementRefresh] = React.useState(0)

  const txQueryString = React.useMemo(() => {
    const query = new URLSearchParams(listQuery.queryKey)
    if (accountId) query.set("accountId", accountId)
    return query.toString()
  }, [listQuery.queryKey, accountId])

  const fetchDetails = React.useCallback(async () => {
    if (!accountId) return
    try {
      setLoading(true)
      setLoadError(null)
      const res = await apiFetch(`/account-ledger/accounts/${accountId}`)
      const json = await res.json().catch(() => ({}))

      if (res.status === 404) {
        setNotFound(true)
        setDetails(null)
        return
      }
      if (!res.ok) {
        throw new Error(json.message || "Failed to load account details")
      }

      setDetails(json.data)
      setNotFound(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load account details"
      setLoadError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [accountId])

  React.useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  React.useEffect(() => {
    if (!accountId) return
    let cancelled = false

    const loadTransactions = async () => {
      setRowsLoading(true)
      try {
        const res = await apiFetch(`/account-ledger/transactions?${txQueryString}`)
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(json.message || "Failed to load account transactions")
        }
        if (cancelled) return

        const list = Array.isArray(json.data) ? json.data : []
        setRows(
          list.map((row: LedgerRow) => ({
            ...row,
            amount: Number(row.amount) || 0,
          }))
        )
        setMeta({
          total: json.meta?.total || 0,
          totalPages: json.meta?.totalPage || json.meta?.totalPages || 1,
        })
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load account transactions"
          )
        }
      } finally {
        if (!cancelled) setRowsLoading(false)
      }
    }

    loadTransactions()
    return () => {
      cancelled = true
    }
  }, [txQueryString, accountId, statementRefresh])

  const handleAccountSaved = React.useCallback(() => {
    fetchDetails()
    setStatementRefresh((value) => value + 1)
  }, [fetchDetails])

  const handleConfirmDelete = async () => {
    if (!accountId) return
    setIsDeleting(true)
    const toastId = toast.loading("Removing account from the treasury ledger...")

    try {
      const res = await apiFetch(`/account-ledger/accounts/${accountId}`, {
        method: "DELETE",
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(json.message || "Failed to delete the account")
      }

      toast.success("Account removed from the treasury ledger.", { id: toastId })
      setIsDeleteOpen(false)
      router.push("/finance/bank-ledger")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete the account",
        { id: toastId }
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExport = async () => {
    if (!accountId || !details) return
    setExporting(true)
    const toastId = toast.loading("Preparing the account statement export...")

    try {
      const query = new URLSearchParams(txQueryString)
      query.set("limit", "all")
      query.delete("page")

      const res = await apiFetch(`/account-ledger/transactions?${query.toString()}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.message || "Failed to load transactions for export")
      }

      const list: LedgerRow[] = (Array.isArray(json.data) ? json.data : []).map(
        (row: LedgerRow) => ({
          ...row,
          amount: Number(row.amount) || 0,
        })
      )

      if (list.length === 0) {
        toast.error("No transactions to export for this account.", { id: toastId })
        return
      }

      const exportRows = list.map((row) => {
        const direction = directionForRow(row, accountId)
        return {
          "Entry Date": row.entryDate,
          "Ref Code": row.refCode,
          Direction:
            direction === "IN"
              ? "Credit (In)"
              : direction === "OUT"
                ? "Debit (Out)"
                : "—",
          "Flow Type": row.flowType,
          Counterparty: counterpartyForRow(row, accountId),
          Particulars: row.particulars,
          "Funding Entity": row.fundingEntity || "",
          Method: row.method,
          "Amount (BDT)": row.amount,
          Status: row.reconciliationStatus,
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(exportRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Account Statement")
      const safeTitle = details.account.accountTitle
        .replace(/[^a-z0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 40)
      XLSX.writeFile(
        workbook,
        `AK_Pharma_Account_Statement_${safeTitle || "Account"}_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      )
      toast.success(`Exported ${list.length} transactions.`, { id: toastId })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to export the account statement",
        { id: toastId }
      )
    } finally {
      setExporting(false)
    }
  }

  if (loading && !details) {
    return <GlobalLoadingSpinner message="Loading account details..." className="py-6" />
  }

  if (loadError && !details) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-[620px] flex-col items-center justify-center p-6 text-center">
        <div className="w-full rounded-2xl border border-amber-200 bg-amber-50/50 p-8">
          <Badge
            variant="outline"
            className="border-amber-300 bg-white px-3 py-1 text-xs font-bold text-amber-700 uppercase"
          >
            Could Not Load Account
          </Badge>
          <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">
            The account details could not be loaded
          </h2>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-600">{loadError}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDetails}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
            <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold">
              <Link href="/finance/bank-ledger">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Bank Accounts Ledger
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !details) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-[620px] flex-col items-center justify-center p-6 text-center">
        <div className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 p-8">
          <Badge
            variant="outline"
            className="border-rose-300 bg-white px-3 py-1 text-xs font-bold text-rose-700 uppercase"
          >
            Account Not Found
          </Badge>
          <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">
            This account no longer exists in the treasury ledger
          </h2>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
            The bank account or cash drawer may have been removed. Return to the ledger to review
            the remaining accounts.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold">
              <Link href="/finance/bank-ledger">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Bank Accounts Ledger
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const account = details.account
  const summary = details.summary
  const isBank = account.category === "BANK"
  const blocked = details.canDelete === false
  const blockedText =
    details.deleteBlockedReason || `This account is linked to ${linkedSummary(details.linked)}.`

  return (
    <div className="mx-auto max-w-[1360px] space-y-5 pb-12 font-sans text-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
            {isBank ? (
              <Landmark className="h-5 w-5 text-[#0090FF]" />
            ) : (
              <Wallet className="h-5 w-5 text-purple-600" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">
                {account.accountTitle}
              </h1>
              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  isBank
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-purple-200 bg-purple-50 text-purple-700"
                }`}
              >
                {isBank ? "Bank Account" : "Cash Drawer / Safe"}
              </Badge>
              <Badge
                variant="outline"
                className={
                  account.isActive === false
                    ? "border-slate-200 bg-slate-100 text-slate-600 text-[10px]"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]"
                }
              >
                {account.isActive === false ? "Inactive" : "Active"}
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {account.institution}
              <span className="mx-1.5 text-slate-300">•</span>
              <span className="font-mono">{account.accountNumber}</span>
              {account.branch && (
                <>
                  <span className="mx-1.5 text-slate-300">•</span>
                  {account.branch}
                </>
              )}
              {account.accountClass && (
                <>
                  <span className="mx-1.5 text-slate-300">•</span>
                  {account.accountClass}
                </>
              )}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Last activity: {formatDateTime(summary.lastTransactionAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Link href="/finance/bank-ledger">
              <ArrowLeft className="h-3.5 w-3.5" />
              Bank Accounts Ledger
            </Link>
          </Button>

          <PermissionGate feature="Bank Accounts Ledger" action="edit">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Account
            </Button>
          </PermissionGate>

          <PermissionGate feature="Bank Accounts Ledger" action="delete">
            <Button
              variant="outline"
              size="sm"
              disabled={blocked}
              onClick={() => setIsDeleteOpen(true)}
              title={blocked ? `Cannot delete: ${blockedText}` : "Delete account"}
              className="h-9 gap-1.5 border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Account
            </Button>
          </PermissionGate>
        </div>
      </div>

      {blocked && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div>
            <p className="text-xs font-bold text-amber-900">
              This account cannot be deleted while it has linked records
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
              {blockedText}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-none">
          <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Current Book Balance
          </p>
          <p
            className={`mt-2 font-mono text-2xl font-black tracking-tight ${
              summary.balance < 0 ? "text-rose-600" : "text-slate-900"
            }`}
          >
            {money(summary.balance)}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Includes the opening balance and all posted entries
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-none">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Total Credits
            </p>
            <ArrowDownRight className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-black tracking-tight text-emerald-700">
            +{money(summary.totalCredits)}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Opening balance and money received
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-none">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Total Debits
            </p>
            <ArrowUpRight className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-black tracking-tight text-rose-700">
            −{money(summary.totalDebits)}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Money paid out and negative balance adjustments
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-none">
          <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Net Movement
          </p>
          <p
            className={`mt-2 font-mono text-2xl font-black tracking-tight ${
              summary.netMovement < 0 ? "text-rose-700" : "text-slate-900"
            }`}
          >
            {summary.netMovement < 0 ? "−" : ""}
            {money(Math.abs(summary.netMovement))}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            {summary.transactionCount} ledger entr
            {summary.transactionCount === 1 ? "y" : "ies"}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-none">
          <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Delivery Collections
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-slate-900">
            {details.linked.collections}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Receipts linked for clearance into this account
          </p>
        </Card>
        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-none">
          <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Expense Vouchers
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-slate-900">
            {details.linked.expenses}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Vouchers funded from this account
          </p>
        </Card>
        <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-none">
          <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Party Settlements
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-slate-900">
            {details.linked.settlements}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Supplier or buyer settlements using this account
          </p>
        </Card>
      </div>

      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-none">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Account Statement
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Every posted journal transaction involving this account.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Showing {rows.length} of {meta.total} entries
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={exporting || meta.total === 0}
              className="h-8 gap-1.5 text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              {exporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <ServerListToolbar
            search={listQuery.search}
            onSearchChange={listQuery.setSearch}
            searchPlaceholder="Search ref, particulars, entity, or method..."
            loading={rowsLoading}
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
                id: "flowType",
                value: listQuery.filters.flowType || "all",
                onValueChange: (value) => listQuery.setFilter("flowType", value),
                placeholder: "All Operations",
                widthClassName: "w-[175px]",
                options: [
                  { value: "all", label: "All Operations" },
                  { value: "inflow", label: "Inflows" },
                  { value: "outflow", label: "Outflows" },
                  { value: "transfer", label: "Transfers" },
                  { value: "loan", label: "Loans" },
                ],
              },
              {
                id: "reconciliationStatus",
                value: listQuery.filters.reconciliationStatus || "all",
                onValueChange: (value) =>
                  listQuery.setFilter("reconciliationStatus", value),
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

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-600">
                  <TableHead className="py-3 pl-3">Date &amp; Ref</TableHead>
                  <TableHead className="py-3">Direction</TableHead>
                  <TableHead className="py-3">Counterparty</TableHead>
                  <TableHead className="py-3">Particulars / Channel</TableHead>
                  <TableHead className="py-3 text-right">Amount (৳)</TableHead>
                  <TableHead className="py-3 pr-3 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-2 text-center">
                      <GlobalLoadingSpinner
                        message="Loading account transactions..."
                        className="py-0"
                      />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No transactions match this search or filter for this account.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const direction = directionForRow(row, accountId)
                    const counterparty = counterpartyForRow(row, accountId)

                    return (
                      <TableRow
                        key={row.id}
                        className="border-b border-slate-50 text-xs transition-colors hover:bg-slate-50/60"
                      >
                        <TableCell className="py-3 pl-3">
                          <span className="block font-semibold text-slate-900">
                            {row.entryDate}
                          </span>
                          <span className="font-mono text-[10px] text-[#0090FF]">
                            {row.refCode}
                          </span>
                        </TableCell>

                        <TableCell className="py-3">
                          {direction === "IN" ? (
                            <Badge
                              variant="outline"
                              className="gap-1 border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700"
                            >
                              <ArrowDownRight className="h-3 w-3" /> Credit
                            </Badge>
                          ) : direction === "OUT" ? (
                            <Badge
                              variant="outline"
                              className="gap-1 border-rose-200 bg-rose-50 text-[10px] font-semibold text-rose-700"
                            >
                              <ArrowUpRight className="h-3 w-3" /> Debit
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-600"
                            >
                              <ArrowRightLeft className="h-3 w-3" /> Linked
                            </Badge>
                          )}
                          <span className="mt-1 block text-[10px] text-slate-400">
                            {row.method === "Opening Balance" ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                                <Wallet className="h-3 w-3" /> Opening balance
                              </span>
                            ) : row.method === "Balance Adjustment" ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                                <Pencil className="h-3 w-3" /> Balance adjustment
                              </span>
                            ) : row.flowType === "LOAN" ? (
                              <span className="inline-flex items-center gap-1">
                                <Coins className="h-3 w-3" /> Loan
                              </span>
                            ) : (
                              row.flowType.charAt(0) + row.flowType.slice(1).toLowerCase()
                            )}
                          </span>
                        </TableCell>

                        <TableCell className="max-w-[190px] py-3">
                          <span className="block truncate font-semibold text-slate-800" title={counterparty}>
                            {counterparty}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {row.method === "Opening Balance" ||
                            row.method === "Balance Adjustment"
                              ? "Treasury ledger entry"
                              : row.flowType === "TRANSFER"
                                ? "Internal transfer"
                                : "External / ledger"}
                          </span>
                        </TableCell>

                        <TableCell className="max-w-[250px] py-3">
                          <span
                            className="block truncate font-medium text-slate-900"
                            title={row.particulars}
                          >
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
                              direction === "IN"
                                ? "text-emerald-700"
                                : direction === "OUT"
                                  ? "text-rose-700"
                                  : "text-slate-900"
                            }
                          >
                            {direction === "IN" ? "+" : direction === "OUT" ? "−" : ""}
                            {money(row.amount)}
                          </span>
                        </TableCell>

                        <TableCell className="py-3 pr-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${statusBadgeClass(
                              row.reconciliationStatus
                            )}`}
                          >
                            {row.reconciliationStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <ServerListPagination
            page={listQuery.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={listQuery.limit}
            onPageChange={listQuery.setPage}
            onLimitChange={listQuery.setLimit}
            loading={rowsLoading}
          />
        </div>
      </Card>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <AlertTriangle className="h-3.5 w-3.5" />
        Deleting an account is only allowed when it has no business transactions, collections,
        expense vouchers, or settlements. Opening balance records are removed with the account.
      </p>

      <AccountFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        account={account}
        onSaved={handleAccountSaved}
      />

      <DeleteConfirmationModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleConfirmDelete}
        title="Remove Bank Account / Cash Drawer"
        description="This account has no blocking business transactions. Removing it will delete the account and any opening balance records. This action cannot be undone."
        itemName={account.accountTitle}
        confirmText="Remove Account"
        cancelText="Cancel"
        isDeleting={isDeleting}
      />
    </div>
  )
}
