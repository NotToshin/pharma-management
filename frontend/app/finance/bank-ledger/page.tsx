"use client"

import * as React from "react"
import * as XLSX from "xlsx"
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
  BadgePercent,
  RefreshCw,
} from "lucide-react"

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

export default function AccountLedgerPage() {
  const [accounts, setAccounts] = React.useState<AccountRecord[]>([])
  const [ledger, setLedger] = React.useState<TransactionRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [accountFilter, setAccountFilter] = React.useState("all")
  const [flowFilter, setFlowFilter] = React.useState("all")

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = React.useState(false)
  const [isTxOpen, setIsTxOpen] = React.useState(false)

  // Add Account Form
  const [accCategory, setAccCategory] = React.useState<"BANK" | "CASH">("BANK")
  const [accInstitution, setAccInstitution] = React.useState(
    BANGLADESH_BANKS.conventional[0]
  )
  const [accTitle, setAccTitle] = React.useState("")
  const [accNumber, setAccNumber] = React.useState("")
  const [accBranch, setAccBranch] = React.useState("")
  const [accClass, setAccClass] = React.useState("Current")
  const [accInitialBalance, setAccInitialBalance] = React.useState("")

  // Transaction / Loan / Transfer Form
  const [txFlow, setTxFlow] = React.useState<
    "INFLOW" | "OUTFLOW" | "TRANSFER" | "LOAN"
  >("TRANSFER")
  const [sourceAccountId, setSourceAccountId] = React.useState("")
  const [destinationAccountId, setDestinationAccountId] = React.useState("")
  const [txParticulars, setTxParticulars] = React.useState("")
  const [txFundingEntity, setTxFundingEntity] = React.useState("")
  const [txMethod, setTxMethod] = React.useState("Cash Handover")
  const [txAmount, setTxAmount] = React.useState("")
  const [txStatus, setTxStatus] = React.useState<
    "Reconciled" | "In Transit" | "Unreconciled"
  >("Reconciled")

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

  const fetchBackendData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [accRes, txRes] = await Promise.all([
        fetch(`${API_URL}/account-ledger/accounts`).catch(() => null),
        fetch(`${API_URL}/account-ledger/transactions`).catch(() => null),
      ])

      if (accRes && accRes.ok) {
        const accs = await accRes.json()
        setAccounts(
          accs.map((a: any) => ({ ...a, balance: Number(a.balance) || 0 }))
        )
        if (accs.length > 0) {
          setSourceAccountId(accs[0].id)
          setDestinationAccountId(accs[1]?.id || accs[0].id)
        }
      }

      if (txRes && txRes.ok) {
        const txs = await txRes.json()
        setLedger(
          txs.map((t: any) => ({ ...t, amount: Number(t.amount) || 0 }))
        )
      }
    } catch (err) {
      console.error("Failed to load treasury data:", err)
    } finally {
      setLoading(false)
    }
  }, [API_URL])

  React.useEffect(() => {
    fetchBackendData()
  }, [fetchBackendData])

  // Aggregate Balances
  const totalBankLiquidity = accounts
    .filter((a) => a.category === "BANK")
    .reduce((sum, a) => sum + a.balance, 0)

  const totalCashSafeLiquidity = accounts
    .filter((a) => a.category === "CASH")
    .reduce((sum, a) => sum + a.balance, 0)

  const totalCombinedFunds = totalBankLiquidity + totalCashSafeLiquidity

  // Add Account / Cash Drawer
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        accountTitle: accTitle.trim(),
        category: accCategory,
        institution: accInstitution,
        accountNumber:
          accNumber.trim() || (accCategory === "CASH" ? "CASH-VAULT" : "N/A"),
        branch: accBranch.trim() || "Main Office",
        accountClass: accClass,
        initialBalance: parseFloat(accInitialBalance) || 0,
      }

      const res = await fetch(`${API_URL}/account-ledger/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to create account")

      setAccTitle("")
      setAccNumber("")
      setAccBranch("")
      setAccInitialBalance("")
      setIsAddAccountOpen(false)
      fetchBackendData()
    } catch (err) {
      alert("Error adding account or cash drawer.")
    }
  }

  // Delete Account
  const handleDeleteAccount = async (id: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to remove "${title}"? This will unlink it from active accounts.`
      )
    )
      return
    try {
      const res = await fetch(`${API_URL}/account-ledger/accounts/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete account")
      fetchBackendData()
    } catch {
      alert("Error removing account.")
    }
  }

  // Record Transaction / Transfer / Loan
  const handlePostTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(txAmount)
    if (!numAmount || numAmount <= 0) {
      alert("Please enter a valid amount.")
      return
    }

    if (txFlow === "TRANSFER" && sourceAccountId === destinationAccountId) {
      alert("Source and Destination accounts cannot be the same.")
      return
    }

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
          (txFlow === "LOAN" ? "Loan Disbursement" : "Journal Entry"),
        fundingEntity: txFundingEntity.trim(),
        method: txMethod,
        amount: numAmount,
        sourceAccountId:
          txFlow === "INFLOW" || txFlow === "LOAN"
            ? undefined
            : sourceAccountId,
        destinationAccountId:
          txFlow === "OUTFLOW" ? undefined : destinationAccountId,
        reconciliationStatus: txStatus,
      }

      const res = await fetch(`${API_URL}/account-ledger/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to post transaction")

      setTxParticulars("")
      setTxFundingEntity("")
      setTxAmount("")
      setIsTxOpen(false)
      fetchBackendData()
    } catch (err) {
      alert("Failed to submit transaction.")
    }
  }

  // Delete Transaction (Reverses Balance)
  const handleDeleteTransaction = async (tx: TransactionRecord) => {
    if (
      !confirm(
        `Reverse and delete transaction ${tx.refCode}? This will automatically restore account balances.`
      )
    )
      return
    try {
      const res = await fetch(
        `${API_URL}/account-ledger/transactions/${tx.id}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Failed to delete transaction")
      fetchBackendData()
    } catch {
      alert("Error deleting transaction.")
    }
  }

  const handleExportExcel = () => {
    const exportRows = ledger.map((item) => ({
      "Entry Date": item.entryDate,
      "Ref Code": item.refCode,
      "Flow Type": item.flowType,
      "Source Account": item.sourceAccount?.accountTitle || "External Payer",
      "Destination Account":
        item.destinationAccount?.accountTitle || "External Payee",
      "Particulars / Reason": item.particulars,
      "Entity / Lender": item.fundingEntity || "N/A",
      Method: item.method,
      "Amount (BDT)": item.amount,
      Status: item.reconciliationStatus,
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Treasury Journal")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Treasury_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
  }

  const filteredLedger = ledger.filter((item) => {
    const matchesSearch =
      item.particulars.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.refCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.fundingEntity &&
        item.fundingEntity.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.sourceAccount?.accountTitle &&
        item.sourceAccount.accountTitle
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (item.destinationAccount?.accountTitle &&
        item.destinationAccount.accountTitle
          .toLowerCase()
          .includes(searchQuery.toLowerCase()))

    const matchesAccount =
      accountFilter === "all" ||
      item.sourceAccountId === accountFilter ||
      item.destinationAccountId === accountFilter

    const matchesFlow =
      flowFilter === "all" ||
      item.flowType.toLowerCase() === flowFilter.toLowerCase()

    return matchesSearch && matchesAccount && matchesFlow
  })

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-12 font-sans text-slate-900">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#0090FF]" />
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              CENTRAL TREASURY & LIQUIDITY MASTER
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Account & Cash Journal Ledger
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage your corporate banks, cash drawers, loan intakes, and
            transfers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            onClick={() => setIsAddAccountOpen(true)}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-none"
          >
            <Building2 className="h-3.5 w-3.5 text-slate-600" />
            Add Account / Drawer
          </Button>

          <Button
            size="sm"
            onClick={() => setIsTxOpen(true)}
            className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-4 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
          >
            <Plus className="h-4 w-4" />
            Post Money / Transfer / Loan
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Total Treasury Liquidity
            </span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[30px] leading-none font-extrabold tracking-tight text-slate-900">
            ৳{totalCombinedFunds.toLocaleString("en-IN")}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Combined across all banks and physical cash drawers
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Corporate Bank Accounts
            </span>
            <div className="rounded-lg bg-blue-50 p-1.5 text-[#0090FF]">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[30px] leading-none font-extrabold tracking-tight text-blue-700">
            ৳{totalBankLiquidity.toLocaleString("en-IN")}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Settlement, Clearing, and Foreign Escrow balance
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Physical Cash Drawers
            </span>
            <div className="rounded-lg bg-purple-50 p-1.5 text-purple-700">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[30px] leading-none font-extrabold tracking-tight text-purple-700">
            ৳{totalCashSafeLiquidity.toLocaleString("en-IN")}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            In Central Safe, retail desks, and plant registers
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
            All balances update dynamically on transaction entry
          </span>
        </div>

        {accounts.length === 0 && !loading ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
            No bank accounts or cash drawers configured. Click{" "}
            <strong>"Add Account / Drawer"</strong> to create your first
            treasury account.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
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
                      {acc.category === "CASH" ? "Cash Drawer" : "Bank Account"}
                    </Badge>
                    <strong
                      className="mt-1.5 block max-w-[170px] truncate text-xs font-bold text-slate-900"
                      title={acc.accountTitle}
                    >
                      {acc.accountTitle}
                    </strong>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleDeleteAccount(acc.id, acc.accountTitle)
                    }
                    className="h-6 w-6 p-0 text-slate-300 opacity-60 transition-opacity group-hover:opacity-100 hover:text-rose-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="mt-3 font-mono text-xl font-black tracking-tight text-slate-900">
                  ৳{acc.balance.toLocaleString("en-IN")}
                </div>

                <div className="mt-2 flex items-center justify-between truncate text-[10px] text-slate-400">
                  <span>{acc.institution}</span>
                  <span className="font-mono font-semibold text-slate-500">
                    {acc.accountNumber}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 4. Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search ref, particulars, lender, or accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
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

          <Select value={flowFilter} onValueChange={setFlowFilter}>
            <SelectTrigger className="h-8 w-[150px] border-slate-200 bg-white text-xs">
              <SelectValue placeholder="All Operations" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Operations</SelectItem>
              <SelectItem value="transfer">Internal Transfer</SelectItem>
              <SelectItem value="loan">Loan / Borrowing</SelectItem>
              <SelectItem value="inflow">Inflow / Deposit</SelectItem>
              <SelectItem value="outflow">Outflow / Disbursement</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 5. Main Journal Table */}
      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              BANK & CASH JOURNAL LEDGER
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Live chronological record of all inflows, loans, payouts, and
              transfers
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredLedger.length} Records
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600">
              <TableHead className="pl-0">Date & Ref</TableHead>
              <TableHead>Operation Type</TableHead>
              <TableHead>From (Source)</TableHead>
              <TableHead>To (Destination)</TableHead>
              <TableHead>Particulars / Entity</TableHead>
              <TableHead className="text-right">Amount (৳)</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="pr-0 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-xs text-slate-400"
                >
                  Loading ledger data from database...
                </TableCell>
              </TableRow>
            ) : filteredLedger.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-xs text-slate-400"
                >
                  No journal records found. Click{" "}
                  <strong>"Post Money / Transfer / Loan"</strong> to create an
                  entry.
                </TableCell>
              </TableRow>
            ) : (
              filteredLedger.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-slate-50 text-xs hover:bg-slate-50/50"
                >
                  <TableCell className="py-3 pl-0">
                    <span className="block font-semibold text-slate-900">
                      {row.entryDate}
                    </span>
                    <span className="font-mono text-[10px] text-[#0090FF]">
                      {row.refCode}
                    </span>
                  </TableCell>

                  <TableCell className="py-3">
                    {row.flowType === "TRANSFER" && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-purple-200 bg-purple-50 text-[10px] text-purple-700"
                      >
                        <ArrowRightLeft className="h-3 w-3" /> Transfer
                      </Badge>
                    )}
                    {row.flowType === "LOAN" && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-amber-200 bg-amber-50 text-[10px] text-amber-700"
                      >
                        <Coins className="h-3 w-3" /> Loan Intake
                      </Badge>
                    )}
                    {row.flowType === "INFLOW" && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                      >
                        <ArrowDownRight className="h-3 w-3" /> Inflow
                      </Badge>
                    )}
                    {row.flowType === "OUTFLOW" && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-rose-200 bg-rose-50 text-[10px] text-rose-700"
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
                          {row.sourceAccount.category === "CASH"
                            ? "Cash Drawer"
                            : "Bank"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">
                        {row.flowType === "LOAN"
                          ? "Lender / Credit Line"
                          : "External Source"}
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
                          {row.destinationAccount.category === "CASH"
                            ? "Cash Drawer"
                            : "Bank"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">
                        External Payee / Expense
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="max-w-[240px] py-3 text-slate-700">
                    <span className="block truncate font-medium">
                      {row.particulars}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-slate-400">
                      {row.fundingEntity
                        ? `Entity: ${row.fundingEntity} • `
                        : ""}
                      {row.method}
                    </span>
                  </TableCell>

                  <TableCell className="py-3 text-right font-mono text-sm font-bold text-slate-900">
                    ৳{row.amount.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-3 text-center">
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-slate-50 text-[10px] text-slate-600"
                    >
                      {row.reconciliationStatus}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3 pr-0 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTransaction(row)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 6. Modal: Add Bank Account or Cash Drawer */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Add Account or Cash Drawer
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create a new physical cash desk or connect an authorized bank
              account.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleCreateAccount}
            className="space-y-3.5 py-2 text-xs"
          >
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">
                Type of Account
              </Label>
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
                  <SelectItem value="CASH">
                    Physical Cash Drawer / Safe
                  </SelectItem>
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
              <Label className="text-xs font-medium text-slate-700">
                Display Title *
              </Label>
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
                <Label className="text-xs font-medium text-slate-700">
                  Account Class
                </Label>
                <Input
                  placeholder="Current / Petty Cash / Cash Desk"
                  value={accClass}
                  onChange={(e) => setAccClass(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Initial Balance (৳) *
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={accInitialBalance}
                  onChange={(e) => setAccInitialBalance(e.target.value)}
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
                className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
              >
                Save & Link Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. Modal: Post Money / Transfer / Loan */}
      <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Post Transaction / Transfer / Loan
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Inject capital, record bank loans, disburse funds, or transfer
              between Cash & Bank.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handlePostTransaction}
            className="space-y-3.5 py-2 text-xs"
          >
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">
                Operation Type *
              </Label>
              <Select
                value={txFlow}
                onValueChange={(val: any) => setTxFlow(val)}
              >
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
                  <Select
                    value={sourceAccountId}
                    onValueChange={setSourceAccountId}
                  >
                    <SelectTrigger className="h-8 bg-white">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.accountTitle} (৳{a.balance.toLocaleString("en-IN")}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    To Account / Drawer *
                  </Label>
                  <Select
                    value={destinationAccountId}
                    onValueChange={setDestinationAccountId}
                  >
                    <SelectTrigger className="h-8 bg-white">
                      <SelectValue placeholder="Destination" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.accountTitle} (৳{a.balance.toLocaleString("en-IN")}
                          )
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
                  <Label className="text-xs font-medium text-slate-700">
                    Crediting Into *
                  </Label>
                  <Select
                    value={destinationAccountId}
                    onValueChange={setDestinationAccountId}
                  >
                    <SelectTrigger className="h-8 bg-white">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.accountTitle}
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
                  <Label className="text-xs font-medium text-slate-700">
                    Depositing Into *
                  </Label>
                  <Select
                    value={destinationAccountId}
                    onValueChange={setDestinationAccountId}
                  >
                    <SelectTrigger className="h-8 bg-white">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.accountTitle}
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
                <Select
                  value={sourceAccountId}
                  onValueChange={setSourceAccountId}
                >
                  <SelectTrigger className="h-8 bg-white">
                    <SelectValue placeholder="Select Account" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.accountTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Amount (৳) *
                </Label>
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
                <Label className="text-xs font-medium text-slate-700">
                  Payment Channel
                </Label>
                <Select value={txMethod} onValueChange={setTxMethod}>
                  <SelectTrigger className="h-8 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Cash Handover">
                      Cash Handover / Counter Deposit
                    </SelectItem>
                    <SelectItem value="BEFTN / RTGS">BEFTN / RTGS</SelectItem>
                    <SelectItem value="Cheque Deposit">
                      Cheque Deposit
                    </SelectItem>
                    <SelectItem value="ATM Withdrawal">
                      ATM Withdrawal
                    </SelectItem>
                    <SelectItem value="Online Transfer">
                      Online / App Transfer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">
                Particulars / Purpose Description
              </Label>
              <Input
                placeholder="Reason for transfer, loan intake, or expense..."
                value={txParticulars}
                onChange={(e) => setTxParticulars(e.target.value)}
                className="h-8"
              />
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
                className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
              >
                Post to Ledger
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
