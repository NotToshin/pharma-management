"use client"

import * as React from "react"
import * as XLSX from "xlsx"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Flame,
  Search,
  Filter,
  Download,
  ShieldAlert,
  Clock,
  Warehouse,
  Boxes,
  Lock,
  ArrowRight,
  MoreHorizontal,
  RefreshCw,
  Archive,
  CheckCircle2,
} from "lucide-react"

interface ExpiryWatchItem {
  id: string
  skuCode: string
  brandName: string
  genericName: string
  batchNumber: string
  warehouseBin: string
  expiryDate: string
  daysRemaining: number
  availableUnits: number
  unitPrice: number
  valueAtRisk: number
  riskTier:
    | "Critical (<30d)"
    | "High Risk (31-60d)"
    | "Attention (61-90d)"
    | "Quarantined"
  dispositionPlan:
    | "Push to Top Retailers"
    | "Discount Liquidation"
    | "Manufacturer Return"
    | "Destruction Protocol"
}

export default function ExpiryWatchlistPage() {
  const [items, setItems] = React.useState<ExpiryWatchItem[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [tierFilter, setTierFilter] = React.useState("all")

  React.useEffect(() => {
    async function loadBatches() {
      try {
        const res = await fetch("/api/inventory/batches")
        if (res.ok) {
          const json = await res.json()
          const batchList = Array.isArray(json) ? json : json.data || []
          const now = Date.now()
          const mapped: ExpiryWatchItem[] = batchList
            .map((b: any) => {
              const parsedTime = Date.parse(b.expiryDate)
              const targetDate = isNaN(parsedTime) ? now : parsedTime
              const daysRemaining = Math.max(0, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)))
              const isQuarantined = (b.warehouseBin || "").toLowerCase().includes("quarantine")
              let riskTier: ExpiryWatchItem["riskTier"] = "Healthy / Monitored" as any
              if (isQuarantined) {
                riskTier = "Quarantined"
              } else if (daysRemaining <= 30) {
                riskTier = "Critical (<30d)"
              } else if (daysRemaining <= 60) {
                riskTier = "High Risk (31-60d)"
              } else if (daysRemaining <= 90) {
                riskTier = "Attention (61-90d)"
              }
              const availableUnits = Number(b.availableUnits) || 0
              const unitPrice = Number(b.unitPrice) || 0
              return {
                id: b.id,
                skuCode: b.skuCode || `SKU-${b.id?.slice(-6)}`,
                brandName: b.brandName || "Unknown",
                genericName: b.genericName || "Unknown",
                batchNumber: b.batchNumber || "N/A",
                warehouseBin: b.warehouseBin || "General Bay",
                expiryDate: b.expiryDate || "",
                daysRemaining,
                availableUnits,
                unitPrice,
                valueAtRisk: Math.round(availableUnits * unitPrice * 100) / 100,
                riskTier,
                dispositionPlan: isQuarantined
                  ? "Destruction Protocol"
                  : daysRemaining <= 30
                  ? "Push to Top Retailers"
                  : "Discount Liquidation",
              }
            })
            .filter((i: ExpiryWatchItem) => i.daysRemaining <= 90 || i.riskTier === "Quarantined")
          setItems(mapped)
        }
      } catch (err) {
        console.error("Failed to load expiry batches:", err)
      }
    }
    loadBatches()
  }, [])

  // Quarantine Modal State
  const [isQuarantineOpen, setIsQuarantineOpen] = React.useState(false)
  const [selectedItem, setSelectedItem] =
    React.useState<ExpiryWatchItem | null>(null)
  const [quarantineReason, setQuarantineReason] = React.useState(
    "Approaching 15-day shelf life threshold"
  )

  const handleExportExcel = () => {
    const exportRows = items.map((i) => ({
      "SKU Code": i.skuCode,
      "Product Name": i.brandName,
      Generic: i.genericName,
      "Batch Number": i.batchNumber,
      "Current Bin": i.warehouseBin,
      "Expiry Date": i.expiryDate,
      "Days Remaining": i.daysRemaining,
      "Units Exposed": i.availableUnits,
      "Unit Cost (৳)": i.unitPrice,
      "Financial Exposure (৳)": i.valueAtRisk,
      "Risk Severity": i.riskTier,
      "Action / Disposition Strategy": i.dispositionPlan,
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expiry Risk Watchlist")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Expiry_Watchlist_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
  }

  const handleMoveToQuarantine = (item: ExpiryWatchItem) => {
    setSelectedItem(item)
    setIsQuarantineOpen(true)
  }

  const confirmQuarantine = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    setItems((prev) =>
      prev.map((i) =>
        i.id === selectedItem.id
          ? {
              ...i,
              warehouseBin: "Quarantine Bay Q-01",
              riskTier: "Quarantined",
              dispositionPlan: "Destruction Protocol",
            }
          : i
      )
    )
    setIsQuarantineOpen(false)
    setSelectedItem(null)
  }

  const handleUpdatePlan = (
    id: string,
    newPlan: ExpiryWatchItem["dispositionPlan"]
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, dispositionPlan: newPlan } : i))
    )
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouseBin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.skuCode.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTier =
      tierFilter === "all" ||
      item.riskTier.toLowerCase().includes(tierFilter.toLowerCase())

    return matchesSearch && matchesTier
  })

  const totalExposure = items.reduce((acc, curr) => acc + curr.valueAtRisk, 0)
  const criticalCount = items.filter(
    (i) => i.riskTier === "Critical (<30d)"
  ).length
  const quarantinedCount = items.filter(
    (i) => i.riskTier === "Quarantined"
  ).length
  const totalUnitsAtRisk = items.reduce(
    (acc, curr) => acc + curr.availableUnits,
    0
  )

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            FEFO Stock Control — Expiry Watchlist
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Near-expiry surveillance, statutory quarantine protocols, and
            loss-mitigation clearance schedules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Audit Sheet
          </Button>

          <Badge
            variant="outline"
            className="rounded-lg border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
          >
            <Flame className="mr-1.5 inline h-3.5 w-3.5 text-rose-600" />
            {criticalCount} Batches Require Immediate Clearance
          </Badge>
        </div>
      </div>

      {/* 2. Key Loss-Mitigation KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Financial Risk */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Gross Value at Risk
            </span>
            <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            ৳{totalExposure.toLocaleString("en-IN")}
          </div>
          <p className="mt-3 text-[11px] font-medium text-rose-600">
            Across {items.length} monitored batch lines
          </p>
        </Card>

        {/* Units Under Surveillance */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total Units Exposed
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {totalUnitsAtRisk.toLocaleString("en-IN")} Units
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Targeting 90-day liquidation run-rate
          </p>
        </Card>

        {/* Critical Bracket (<30 Days) */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Critical Stage (&lt;30d)
            </span>
            <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {criticalCount} Batches
          </div>
          <p className="mt-3 text-[11px] font-medium text-amber-600">
            Auto-assigned to Priority Push
          </p>
        </Card>

        {/* Quarantined & Isolated */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Quarantine Locked
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-800">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {quarantinedCount} Batches
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Ineligible for order picking & billing
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search medicine brand, batch #, SKU, or bay..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="h-8 w-[170px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Risk Brackets" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Brackets</SelectItem>
              <SelectItem value="critical">Critical (&lt;30 Days)</SelectItem>
              <SelectItem value="high risk">High Risk (31-60 Days)</SelectItem>
              <SelectItem value="attention">Attention (61-90 Days)</SelectItem>
              <SelectItem value="quarantined">Quarantined Locked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Watchlist Surveillance Table */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              EXPIRY RISK ACTION REGISTER
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Live batch countdown, warehouse isolation state, and active
              mitigation routing
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredItems.length} Monitored Batches
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0 text-xs font-medium text-slate-600">
                Product / SKU
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Batch Code
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Location Bin
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Expiry Date
              </TableHead>
              <TableHead className="text-center text-xs font-medium text-slate-600">
                Remaining
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-slate-600">
                Available Stock
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-slate-600">
                Value at Risk
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Risk Severity
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Mitigation Strategy
              </TableHead>
              <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow
                key={item.id}
                className="border-b border-slate-50 hover:bg-slate-50/50"
              >
                {/* Brand & SKU */}
                <TableCell className="py-3 pl-0">
                  <div className="leading-tight">
                    <span className="block text-xs font-bold text-slate-900">
                      {item.brandName}
                    </span>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="font-mono text-slate-500">
                        {item.skuCode}
                      </span>
                      <span>•</span>
                      <span className="max-w-[150px] truncate">
                        {item.genericName}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Batch */}
                <TableCell className="py-3 font-mono text-xs font-semibold text-slate-800">
                  {item.batchNumber}
                </TableCell>

                {/* Warehouse Location */}
                <TableCell className="py-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Warehouse className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span
                      className={
                        item.riskTier === "Quarantined"
                          ? "font-bold text-rose-700"
                          : ""
                      }
                    >
                      {item.warehouseBin}
                    </span>
                  </div>
                </TableCell>

                {/* Expiry Date */}
                <TableCell className="py-3 font-mono text-xs text-slate-800">
                  {item.expiryDate}
                </TableCell>

                {/* Countdown Badge */}
                <TableCell className="py-3 text-center text-xs">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                      item.daysRemaining <= 30
                        ? "border border-rose-200 bg-rose-50 text-rose-700"
                        : item.daysRemaining <= 60
                          ? "border border-amber-200 bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.daysRemaining} days
                  </span>
                </TableCell>

                {/* Stock Quantity */}
                <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-900">
                  {item.availableUnits.toLocaleString()}
                </TableCell>

                {/* Value at Risk */}
                <TableCell className="py-3 text-right font-mono text-xs font-semibold text-rose-600">
                  ৳{item.valueAtRisk.toLocaleString("en-IN")}
                </TableCell>

                {/* Risk Tier Badge */}
                <TableCell className="py-3 text-xs">
                  <Badge
                    variant="outline"
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      item.riskTier === "Critical (<30d)"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : item.riskTier === "High Risk (31-60d)"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : item.riskTier === "Quarantined"
                            ? "border-purple-200 bg-purple-50 text-purple-700"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {item.riskTier}
                  </Badge>
                </TableCell>

                {/* Strategy Dropdown */}
                <TableCell className="py-3 text-xs">
                  <Select
                    value={item.dispositionPlan}
                    onValueChange={(val) =>
                      handleUpdatePlan(
                        item.id,
                        val as ExpiryWatchItem["dispositionPlan"]
                      )
                    }
                  >
                    <SelectTrigger className="h-7 w-[160px] bg-white text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Push to Top Retailers">
                        Push to Top Retailers
                      </SelectItem>
                      <SelectItem value="Discount Liquidation">
                        Discount Liquidation
                      </SelectItem>
                      <SelectItem value="Manufacturer Return">
                        Manufacturer Return
                      </SelectItem>
                      <SelectItem value="Destruction Protocol">
                        Destruction Protocol
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>

                {/* Actions Button */}
                <TableCell className="py-3 pr-0 text-right text-xs">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white">
                      <DropdownMenuLabel className="text-[10px] tracking-wider text-slate-400 uppercase">
                        Disposition Actions
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleMoveToQuarantine(item)}
                        className="cursor-pointer text-xs text-amber-700 focus:bg-amber-50 focus:text-amber-700"
                      >
                        <Lock className="mr-2 h-3.5 w-3.5" />
                        Move to Quarantine
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleUpdatePlan(item.id, "Push to Top Retailers")
                        }
                        className="cursor-pointer text-xs text-slate-700"
                      >
                        <Flame className="mr-2 h-3.5 w-3.5 text-rose-500" />
                        Prioritize Dispatch
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          handleUpdatePlan(item.id, "Manufacturer Return")
                        }
                        className="cursor-pointer text-xs text-slate-700"
                      >
                        <RefreshCw className="mr-2 h-3.5 w-3.5 text-blue-500" />
                        Initiate Return Claim
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Move to Quarantine Modal */}
      <Dialog open={isQuarantineOpen} onOpenChange={setIsQuarantineOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[460px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Isolate Batch into Quarantine
              </DialogTitle>
            </div>
            <DialogDescription className="mt-1 text-xs text-slate-500">
              Quarantining immediately locks this batch. It will be removed from
              order picking and sales allocation.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <form
              onSubmit={confirmQuarantine}
              className="space-y-3.5 py-2 text-xs"
            >
              <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Formulation:</span>
                  <span className="font-bold text-slate-900">
                    {selectedItem.brandName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Batch Code:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedItem.batchNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Stock Quantity:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {selectedItem.availableUnits.toLocaleString()} units
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Isolation Bin:</span>
                  <span className="font-semibold text-rose-700">
                    Quarantine Bay Q-01
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="q-reason"
                  className="text-xs font-medium text-slate-700"
                >
                  Regulatory Quarantine Reason
                </Label>
                <Input
                  id="q-reason"
                  value={quarantineReason}
                  onChange={(e) => setQuarantineReason(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuarantineOpen(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-8 bg-rose-600 text-xs font-semibold text-white shadow-none hover:bg-rose-700"
                >
                  Lock into Quarantine
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
