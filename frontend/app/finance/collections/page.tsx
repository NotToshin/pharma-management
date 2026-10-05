"use client"

import * as React from "react"
import * as XLSX from "xlsx"
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
  Search,
  Filter,
  Download,
  UserCheck,
  Wallet,
  CheckCircle2,
  RotateCcw,
  Archive,
} from "lucide-react"

interface CollectionItem {
  id: string
  invoiceNo: string
  chemistName: string
  territory: string
  salesRepName: string
  totalInvoiceAmount: number
  currentCollection: number
  status: "Realized" | "Partial" | "Pending"
  orderStatus: string
  isSettled: boolean
}

export default function CollectionsPage() {
  const [collections, setCollections] = React.useState<CollectionItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [activeTab, setActiveTab] = React.useState<"active" | "settled">(
    "active"
  )

  // Settlement Modal State
  const [isSettlementOpen, setIsSettlementOpen] = React.useState(false)
  const [destinationType, setDestinationType] = React.useState<
    "Cash Drawer" | "Bank Account"
  >("Cash Drawer")
  const [targetBank, setTargetBank] = React.useState(
    "Eastern Bank PLC (Corporate Ops)"
  )
  const [cashSafeName, setCashSafeName] = React.useState(
    "Head Office Cash Safe"
  )

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://pharma-management-b7fk.onrender.com/api"

  // Fetch live orders connected from clients & logistics
  const fetchCollections = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/orders`)
      if (!res.ok) throw new Error("Failed to fetch orders")
      const data = await res.json()

      const mapped: CollectionItem[] = (Array.isArray(data) ? data : [])
        .filter((ord: any) => ord.status !== "Cancelled")
        .map((ord: any, idx: number) => {
          const val = Number(ord.orderValue) || 0
          const isSettled = ord.status === "Settled" || Boolean(ord.isSettled)
          const isDelivered = ord.status === "Delivered & Invoiced" || isSettled

          return {
            id: ord.id || `col-${idx}`,
            invoiceNo:
              ord.invoiceNumber ||
              `INV-2026-${String(idx + 1).padStart(4, "0")}`,
            chemistName: ord.pharmacyName || "Registered Chemist",
            territory: ord.territory || "Dhaka North",
            salesRepName: ord.assignedMio || "General MIO",
            totalInvoiceAmount: val,
            currentCollection: isDelivered ? val : 0,
            status: isDelivered ? "Realized" : "Pending",
            orderStatus: ord.status || "FEFO Allocated",
            isSettled: isSettled,
          }
        })

      setCollections(mapped)
      setLoading(false)
    } catch (err) {
      console.error("Error loading collections:", err)
      setLoading(false)
    }
  }, [API_BASE])

  React.useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  const handleUpdateAmount = (id: string, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0)
    setCollections((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const status =
            num >= item.totalInvoiceAmount
              ? "Realized"
              : num > 0
                ? "Partial"
                : "Pending"
          return {
            ...item,
            currentCollection: num,
            status: status as CollectionItem["status"],
          }
        }
        return item
      })
    )
  }

  // Mark single invoice as fully realized & settled so it vanishes immediately
  const handleVanishInvoice = async (item: CollectionItem) => {
    try {
      // Update status in backend order table
      await fetch(`${API_BASE}/orders/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Settled" }),
      }).catch(() => null)

      setCollections((prev) =>
        prev.map((ord) =>
          ord.id === item.id ? { ...ord, isSettled: true } : ord
        )
      )
    } catch (err) {
      console.error("Error settling invoice:", err)
    }
  }

  // Filter collections by Tab (Active vs Settled)
  const displayedCollections = React.useMemo(() => {
    return collections.filter((item) => {
      const tabMatch = activeTab === "active" ? !item.isSettled : item.isSettled

      const matchesSearch =
        item.chemistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.salesRepName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ||
        item.status.toLowerCase() === statusFilter.toLowerCase()

      return tabMatch && matchesSearch && matchesStatus
    })
  }, [collections, activeTab, searchQuery, statusFilter])

  const totalCollected = React.useMemo(() => {
    return collections
      .filter((c) => !c.isSettled && c.status === "Realized")
      .reduce((acc, curr) => acc + curr.currentCollection, 0)
  }, [collections])

  // Bulk Settlement & Post
  const handleSettleAndPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (totalCollected <= 0) {
      alert("No realized funds available to settle.")
      return
    }

    try {
      const destination =
        destinationType === "Cash Drawer" ? cashSafeName : targetBank

      // 1. Post to treasury deposit ledger
      await fetch(`${API_BASE}/treasury/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationType,
          destinationName: destination,
          amount: totalCollected,
        }),
      }).catch(() => null)

      // 2. Mark all realized items as Settled so they vanish from Active table
      const realizedItems = collections.filter(
        (c) => !c.isSettled && c.status === "Realized"
      )
      await Promise.all(
        realizedItems.map((item) =>
          fetch(`${API_BASE}/orders/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Settled" }),
          }).catch(() => null)
        )
      )

      setCollections((prev) =>
        prev.map((c) =>
          c.status === "Realized" ? { ...c, isSettled: true } : c
        )
      )

      setIsSettlementOpen(false)
      alert(
        `Successfully settled ৳${totalCollected.toLocaleString("en-IN")} into [${destinationType}] -> ${destination}. Realized orders have been archived.`
      )
    } catch (error) {
      console.error("Error posting settlement:", error)
      alert("Settlement completed locally.")
      setIsSettlementOpen(false)
    }
  }

  const handleExportExcel = () => {
    const data = displayedCollections.map((c) => ({
      "Invoice #": c.invoiceNo,
      "Chemist / Pharmacy": c.chemistName,
      Territory: c.territory,
      "Sales Rep (MIO)": c.salesRepName,
      "Invoice Amount (৳)": c.totalInvoiceAmount,
      "Collected Amount (৳)": c.currentCollection,
      Status: c.status,
      "Settlement State": c.isSettled
        ? "Settled to Safe/Bank"
        : "Pending Settlement",
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Collections")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Collections_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
  }

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-16 font-sans text-neutral-900">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
            <span className="font-mono text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
              FINANCE & TREASURY • CASH & BANK REALIZATION
            </span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            Collections & Safe / Bank Settlement
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Realize payments from delivered logistics orders and post funds to
            physical cash safes or corporate bank accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchCollections}
            className="h-9 gap-1.5 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" /> Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" /> Export Sheet
          </Button>

          <Button
            size="sm"
            onClick={() => setIsSettlementOpen(true)}
            disabled={totalCollected === 0}
            className="h-9 gap-1.5 rounded-lg bg-[#0090FF] text-xs font-semibold text-white shadow-none hover:bg-[#0080e5] disabled:opacity-50"
          >
            <Wallet className="h-3.5 w-3.5" /> Settle Realized Funds (৳
            {totalCollected.toLocaleString("en-IN")})
          </Button>
        </div>
      </div>

      {/* 2. Tabs, Search & Filter Bar */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          {/* Active vs Settled Switcher */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              onClick={() => setActiveTab("active")}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === "active"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Active Receivables (
              {collections.filter((c) => !c.isSettled).length})
            </button>
            <button
              onClick={() => setActiveTab("settled")}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === "settled"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Settled Archive ({collections.filter((c) => c.isSettled).length})
            </button>
          </div>

          <div className="relative w-72">
            <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search chemist, invoice #, or sales rep..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[160px] border-slate-200 bg-white text-xs">
            <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="text-xs">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="realized">Realized</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 3. Collections Table */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
              {activeTab === "active"
                ? "Active Logistics Invoices & Collections"
                : "Settled & Archived Cash Realizations"}
            </h3>
            <p className="text-xs text-slate-400">
              {activeTab === "active"
                ? "Invoices currently pending collection or awaiting treasury settlement"
                : "Realized payments cleared and posted to physical cash safes or banks"}
            </p>
          </div>
          {activeTab === "active" && (
            <span className="font-mono text-xs font-medium text-slate-400">
              Pending Settlement:{" "}
              <strong className="text-emerald-700">
                ৳{totalCollected.toLocaleString("en-IN")}
              </strong>
            </span>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs font-semibold text-slate-600">
              <TableHead className="pl-0">Invoice & Chemist</TableHead>
              <TableHead>Territory</TableHead>
              <TableHead>Assigned Sales Rep (MIO)</TableHead>
              <TableHead className="text-right">Total Invoice (৳)</TableHead>
              <TableHead className="text-right">Collected Amount (৳)</TableHead>
              <TableHead className="text-center">Status</TableHead>
              {activeTab === "active" && (
                <TableHead className="pr-0 text-right">Action</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-xs text-slate-400"
                >
                  Loading collections from logistics orders...
                </TableCell>
              </TableRow>
            ) : displayedCollections.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-xs text-slate-400"
                >
                  {activeTab === "active"
                    ? "All collected cash has been realized and settled. No pending collections."
                    : "No settled records in archive."}
                </TableCell>
              </TableRow>
            ) : (
              displayedCollections.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-b border-slate-50 text-xs hover:bg-slate-50/50"
                >
                  <TableCell className="py-3.5 pl-0">
                    <strong className="block text-slate-900">
                      {item.chemistName}
                    </strong>
                    <span className="font-mono text-[10px] text-[#0090FF]">
                      {item.invoiceNo}
                    </span>
                  </TableCell>

                  <TableCell className="py-3.5 text-slate-700">
                    {item.territory}
                  </TableCell>

                  <TableCell className="py-3.5 text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <UserCheck className="h-3 w-3 text-slate-400" />
                      <span>{item.salesRepName}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5 text-right font-mono text-slate-700">
                    ৳{item.totalInvoiceAmount.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-3.5 text-right font-mono">
                    {item.isSettled ? (
                      <span className="font-bold text-emerald-700">
                        ৳{item.currentCollection.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-slate-400">৳</span>
                        <Input
                          type="number"
                          value={item.currentCollection}
                          onChange={(e) =>
                            handleUpdateAmount(item.id, e.target.value)
                          }
                          className="h-7 w-28 border-slate-200 bg-white text-right font-mono text-xs font-bold"
                        />
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="py-3.5 text-center">
                    <Badge
                      variant="outline"
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        item.status === "Realized"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : item.status === "Partial"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.isSettled ? "Settled" : item.status}
                    </Badge>
                  </TableCell>

                  {activeTab === "active" && (
                    <TableCell className="py-3.5 pr-0 text-right">
                      {item.status === "Realized" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVanishInvoice(item)}
                          className="h-7 gap-1 px-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Mark Settled
                        </Button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          Awaiting Payment
                        </span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Settle to Safe or Bank Modal */}
      <Dialog open={isSettlementOpen} onOpenChange={setIsSettlementOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Settle & Post Realized Funds
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Posting realized funds will archive settled invoices and transfer
              the balance to physical cash safes or bank ledgers.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSettleAndPost}
            className="space-y-4 py-2 text-xs"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Destination Type
              </Label>
              <Select
                value={destinationType}
                onValueChange={(v: any) => setDestinationType(v)}
              >
                <SelectTrigger className="h-8 bg-white text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="Cash Drawer">
                    Physical Cash Safe
                  </SelectItem>
                  <SelectItem value="Bank Account">
                    Corporate Bank Account
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {destinationType === "Cash Drawer" ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Select Cash Safe
                </Label>
                <Select value={cashSafeName} onValueChange={setCashSafeName}>
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Head Office Cash Safe">
                      Head Office Cash Safe
                    </SelectItem>
                    <SelectItem value="CEO Cash Safe">CEO Cash Safe</SelectItem>
                    <SelectItem value="Chairman Cash Safe">
                      Chairman Cash Safe
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Select Corporate Bank Account
                </Label>
                <Select value={targetBank} onValueChange={setTargetBank}>
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Eastern Bank PLC (Corporate Ops)">
                      Eastern Bank PLC (Corporate Ops)
                    </SelectItem>
                    <SelectItem value="Islami Bank Bangladesh PLC (Wholesale)">
                      Islami Bank Bangladesh PLC (Wholesale)
                    </SelectItem>
                    <SelectItem value="Standard Chartered Bank (LC Escrow)">
                      Standard Chartered Bank (LC Escrow)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs">
              <span className="font-sans text-slate-600">
                Total Realized to Settle:
              </span>
              <strong className="text-sm text-emerald-700">
                ৳{totalCollected.toLocaleString("en-IN")}
              </strong>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettlementOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-8 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
              >
                Confirm & Post to Ledger
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
