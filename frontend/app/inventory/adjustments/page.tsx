"use client"

import * as React from "react"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { API_URL } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
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
  DialogTrigger,
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
  SlidersHorizontal,
  Plus,
  Download,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  FileText,
  Clock,
  Printer,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Trash2,
  Check,
  Package,
} from "lucide-react"

import { numberToWordsBDT } from "@/components/logistics/order-invoice"

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
  #print-standalone-adjustment,
  #print-standalone-adjustment * {
    visibility: visible !important;
  }
  #print-standalone-adjustment {
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

export interface StockAdjustment {
  id: string
  adjustmentRef: string
  date: string
  skuCode: string
  formulationName: string
  batchNumber: string
  warehouseLocation: string
  type: string
  quantity: number // Positive or negative
  unitCostBDT: number
  totalImpactBDT: number
  reasonCode: string
  authorizedBy: string
  approvalStatus: "Approved & Adjusted" | "Pending Review" | "Rejected"
}

export interface InventoryBatchOption {
  id: string
  skuCode: string
  brandName: string
  genericName: string
  batchNumber: string
  availableUnits: number
  unitPrice: number
  warehouseBin: string
  storageCondition: string
}

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = React.useState<StockAdjustment[]>([])
  const [batches, setBatches] = React.useState<InventoryBatchOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")

  // Create Modal State
  const [isNewOpen, setIsNewOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selectedBatchId, setSelectedBatchId] = React.useState<string>("custom")
  const [skuCode, setSkuCode] = React.useState("")
  const [formulationName, setFormulationName] = React.useState("")
  const [batchNumber, setBatchNumber] = React.useState("")
  const [warehouseLocation, setWarehouseLocation] = React.useState<string>("Bay 01 - Shelf A")
  const [type, setType] = React.useState<string>("Write-off (Damaged/Broken)")
  const [quantity, setQuantity] = React.useState("")
  const [unitCostBDT, setUnitCostBDT] = React.useState("")
  const [reasonCode, setReasonCode] = React.useState("")
  const [authorizedBy, setAuthorizedBy] = React.useState("Toshin Bin Azad (Super Admin)")
  const [approvalStatus, setApprovalStatus] = React.useState<StockAdjustment["approvalStatus"]>("Approved & Adjusted")

  // Inspect Slip State
  const [selectedAdjustment, setSelectedAdjustment] = React.useState<StockAdjustment | null>(null)
  const [isSlipOpen, setIsSlipOpen] = React.useState(false)

  // Delete Modal State
  const [adjustmentToDelete, setAdjustmentToDelete] = React.useState<StockAdjustment | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const parsedQty = parseFloat(quantity) || 0
  const parsedCost = parseFloat(unitCostBDT) || 0
  const calculatedImpact = parsedQty * parsedCost

  // Fetch adjustments and batches from backend
  const loadData = React.useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true)
      else setLoading(true)

      const [adjRes, batchRes] = await Promise.all([
        fetch(`${API_URL}/stock-adjustments`),
        fetch(`${API_URL}/inventory`).catch(() => null),
      ])

      if (adjRes.ok) {
        const json = await adjRes.json()
        const data = json.data || json
        if (Array.isArray(data)) {
          setAdjustments(data)
        }
      }

      if (batchRes && batchRes.ok) {
        const batchJson = await batchRes.json()
        const batchData = batchJson.data || batchJson
        if (Array.isArray(batchData)) {
          setBatches(batchData)
        }
      }

      if (showToast) {
        toast.success("Stock adjustments data re-synchronized")
      }
    } catch (err: any) {
      console.error("Failed to load stock adjustments:", err)
      toast.error("Failed to sync with stock adjustments backend")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // When a batch is selected in the new adjustment dialog, autofill fields
  const handleBatchSelect = (batchId: string) => {
    setSelectedBatchId(batchId)
    if (batchId === "custom") {
      return
    }

    const batch = batches.find((b) => b.id === batchId)
    if (batch) {
      setSkuCode(batch.skuCode)
      setFormulationName(batch.brandName)
      setBatchNumber(batch.batchNumber)
      setUnitCostBDT(String(batch.unitPrice || ""))
      if (batch.warehouseBin) {
        setWarehouseLocation(batch.warehouseBin)
      }
    }
  }

  // Create Adjustment
  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!skuCode || !batchNumber || parsedQty === 0) {
      toast.error("Please enter a valid SKU, Batch Number, and non-zero quantity")
      return
    }

    const toastId = toast.loading("Logging warehouse stock adjustment...")
    setIsSubmitting(true)

    try {
      const payload = {
        skuCode: skuCode.trim(),
        formulationName: formulationName.trim(),
        batchNumber: batchNumber.trim(),
        warehouseLocation,
        type,
        quantity: parsedQty,
        unitCostBDT: parsedCost,
        totalImpactBDT: calculatedImpact,
        reasonCode: reasonCode.trim() || "Regularized under plant QA policy",
        authorizedBy: authorizedBy.trim() || "Toshin Bin Azad (Super Admin)",
        approvalStatus,
      }

      const res = await fetch(`${API_URL}/stock-adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.message || "Failed to create adjustment")
      }

      toast.success(
        `Adjustment ${json.data?.adjustmentRef || ""} recorded and stock ledger synchronized`,
        { id: toastId }
      )

      // Reset form
      setSkuCode("")
      setFormulationName("")
      setBatchNumber("")
      setQuantity("")
      setUnitCostBDT("")
      setReasonCode("")
      setSelectedBatchId("custom")
      setIsNewOpen(false)

      // Refresh list
      loadData()
    } catch (err: any) {
      console.error("Error creating adjustment:", err)
      toast.error(err.message || "Could not save adjustment", { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick Approve Adjustment
  const handleApproveAdjustment = async (adj: StockAdjustment) => {
    const toastId = toast.loading(`Approving adjustment ${adj.adjustmentRef}...`)
    try {
      const res = await fetch(`${API_URL}/stock-adjustments/${adj.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus: "Approved & Adjusted" }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || "Failed to approve adjustment")
      }

      toast.success(`Adjustment ${adj.adjustmentRef} approved & stock synced`, { id: toastId })
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to approve adjustment", { id: toastId })
    }
  }

  // Delete Adjustment via DeleteConfirmationModal
  const handleDeleteAdjustment = async () => {
    if (!adjustmentToDelete) return

    setIsDeleting(true)
    const toastId = toast.loading(`Removing record ${adjustmentToDelete.adjustmentRef}...`)

    try {
      const res = await fetch(`${API_URL}/stock-adjustments/${adjustmentToDelete.id}`, {
        method: "DELETE",
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || "Failed to delete adjustment")
      }

      toast.success(`Adjustment ${adjustmentToDelete.adjustmentRef} deleted successfully`, {
        id: toastId,
      })
      setIsDeleteOpen(false)
      setAdjustmentToDelete(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Could not delete adjustment", { id: toastId })
    } finally {
      setIsDeleting(false)
    }
  }

  // Export to Excel
  const handleExportExcel = () => {
    if (adjustments.length === 0) {
      toast.error("No adjustments data available to export")
      return
    }

    const data = adjustments.map((a) => ({
      "Adjustment Ref": a.adjustmentRef,
      Date: a.date,
      "SKU Code": a.skuCode,
      "Formulation Name": a.formulationName,
      "Batch Number": a.batchNumber,
      Location: a.warehouseLocation,
      "Adjustment Type": a.type,
      "Quantity Adjusted": a.quantity,
      "Unit Cost (৳)": a.unitCostBDT,
      "Total Financial Impact (৳)": a.totalImpactBDT,
      "Justification / Reason": a.reasonCode,
      "Authorized Signatory": a.authorizedBy,
      Status: a.approvalStatus,
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Adjustments")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Stock_Adjustments_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
    toast.success("Excel ledger exported successfully")
  }

  // Filtered adjustments
  const filteredAdjustments = adjustments.filter((adj) => {
    const matchesSearch =
      (adj.adjustmentRef || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (adj.skuCode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (adj.formulationName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (adj.batchNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (adj.reasonCode || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType =
      typeFilter === "all" ||
      (adj.type || "").toLowerCase() === typeFilter.toLowerCase()

    const matchesStatus =
      statusFilter === "all" ||
      (adj.approvalStatus || "").toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesType && matchesStatus
  })

  // Live Metric Telemetry Calculations
  const totalNetImpact = adjustments.reduce(
    (acc, curr) => acc + (Number(curr.totalImpactBDT) || 0),
    0
  )
  const writeOffAdjustments = adjustments.filter((a) =>
    (a.type || "").toLowerCase().includes("write-off")
  )
  const writeOffCount = writeOffAdjustments.length
  const writeOffTotalUnits = writeOffAdjustments.reduce(
    (acc, curr) => acc + Math.abs(curr.quantity || 0),
    0
  )

  const approvedCount = adjustments.filter(
    (a) => a.approvalStatus === "Approved & Adjusted"
  ).length
  const auditComplianceRate =
    adjustments.length > 0
      ? Math.round((approvedCount / adjustments.length) * 100)
      : 100

  const quarantinedImpact = adjustments
    .filter(
      (a) =>
        (a.type || "").toLowerCase().includes("quarantine") ||
        (a.warehouseLocation || "").toLowerCase().includes("quarantine") ||
        (a.warehouseLocation || "").toLowerCase().includes("q-01")
    )
    .reduce((acc, curr) => acc + Math.abs(curr.totalImpactBDT || 0), 0)

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-12">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#0090FF]" />
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              WAREHOUSE INVENTORY CONTROL
            </span>
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50/50 text-[10px] font-semibold text-[#0090FF]"
            >
              Live Sync Active
            </Badge>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Stock Adjustments & Write-Off Journal
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Log physical inventory variances, write-offs, quarantine transfers,
            and DGDA-compliant reconciliation entries synchronized with batch ledgers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`}
            />
            Sync
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Adjustment Ledger
          </Button>

          {/* New Stock Adjustment Dialog */}
          <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
              >
                <Plus className="h-4 w-4" />
                New Stock Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl bg-white sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Log Warehouse Inventory Adjustment
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Record lot reconciliations, physical damage write-offs, or
                  quarantine bin relocations with automatic inventory ledger synchronization.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateAdjustment} className="space-y-4 py-2 text-xs">
                {/* Optional Quick Batch Picker */}
                {batches.length > 0 && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                    <Label className="text-xs font-semibold text-blue-900">
                      Quick Select Active Batch (Auto-populates fields)
                    </Label>
                    <Select value={selectedBatchId} onValueChange={handleBatchSelect}>
                      <SelectTrigger className="mt-1.5 h-8 bg-white text-xs">
                        <SelectValue placeholder="Choose from inventory batches..." />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="custom">— Manual / Custom Entry —</SelectItem>
                        {batches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.brandName} • Batch: {b.batchNumber} ({b.availableUnits} units available)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      SKU Code *
                    </Label>
                    <Input
                      placeholder="e.g. SKU-CF-200"
                      value={skuCode}
                      onChange={(e) => setSkuCode(e.target.value)}
                      required
                      className="h-8 font-mono text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Formulation Name *
                    </Label>
                    <Input
                      placeholder="e.g. Cef-3 200mg/5ml Susp"
                      value={formulationName}
                      onChange={(e) => setFormulationName(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Batch Lot Number *
                    </Label>
                    <Input
                      placeholder="e.g. BX-2026-039"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      required
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Warehouse Storage Bay *
                    </Label>
                    <Select
                      value={warehouseLocation}
                      onValueChange={setWarehouseLocation}
                    >
                      <SelectTrigger className="h-8 bg-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Bay 01 - Shelf A">
                          Bay 01 - Shelf A (Ambient)
                        </SelectItem>
                        <SelectItem value="Bay 02 - Shelf B">
                          Bay 02 - Shelf B (Ambient)
                        </SelectItem>
                        <SelectItem value="Cold Room A (2-8°C)">
                          Cold Room A (2-8°C)
                        </SelectItem>
                        <SelectItem value="Quarantine Bay Q-01">
                          Quarantine Bay Q-01
                        </SelectItem>
                        {warehouseLocation &&
                          !["Bay 01 - Shelf A", "Bay 02 - Shelf B", "Cold Room A (2-8°C)", "Quarantine Bay Q-01"].includes(
                            warehouseLocation
                          ) && (
                            <SelectItem value={warehouseLocation}>
                              {warehouseLocation}
                            </SelectItem>
                          )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Adjustment Classification *
                    </Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="h-8 bg-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Write-off (Damaged/Broken)">
                          Write-off (Damaged / Broken / Seal Breached)
                        </SelectItem>
                        <SelectItem value="Quarantine Transfer">
                          Quarantine Transfer (Near Expiry / Defective)
                        </SelectItem>
                        <SelectItem value="Audit Count Discrepancy">
                          Audit Count Discrepancy (Physical vs System)
                        </SelectItem>
                        <SelectItem value="Restock Inward Correction">
                          Restock Inward Correction (Surplus Receipt)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Approval Workflow *
                    </Label>
                    <Select
                      value={approvalStatus}
                      onValueChange={(val) =>
                        setApprovalStatus(val as StockAdjustment["approvalStatus"])
                      }
                    >
                      <SelectTrigger className="h-8 bg-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Approved & Adjusted">
                          Immediate (Approved & Adjusted)
                        </SelectItem>
                        <SelectItem value="Pending Review">
                          Submit for QA Audit Review
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Unit Quantity (use '-' for deduction) *
                    </Label>
                    <Input
                      type="number"
                      placeholder="-15 or 50"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      className="h-8 font-mono text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Unit Cost (৳) *
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="185.0"
                      value={unitCostBDT}
                      onChange={(e) => setUnitCostBDT(e.target.value)}
                      required
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                  <span className="font-medium text-slate-500">
                    Computed Ledger Value Impact:
                  </span>
                  <span
                    className={`font-mono text-sm font-bold ${calculatedImpact < 0 ? "text-rose-600" : calculatedImpact > 0 ? "text-emerald-600" : "text-slate-600"}`}
                  >
                    {calculatedImpact < 0
                      ? `-৳${Math.abs(calculatedImpact).toLocaleString("en-IN")}`
                      : `+৳${calculatedImpact.toLocaleString("en-IN")}`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Clinical / Quality Audit Reason *
                  </Label>
                  <Input
                    placeholder="e.g. Blister damage during internal pallet relocation"
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Authorized Signatory
                  </Label>
                  <Input
                    value={authorizedBy}
                    onChange={(e) => setAuthorizedBy(e.target.value)}
                    placeholder="e.g. Toshin Bin Azad (Super Admin)"
                    className="h-8 text-xs"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewOpen(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-8 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
                  >
                    {isSubmitting ? "Processing..." : "Authorize Adjustment"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Synchronized with real database records) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Net Adjustments Impact
            </span>
            <div
              className={`rounded-xl p-2 ${totalNetImpact < 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}
            >
              {totalNetImpact < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
            </div>
          </div>
          <div
            className={`mt-3 font-mono text-[26px] leading-none font-extrabold tracking-tight ${totalNetImpact < 0 ? "text-rose-600" : "text-emerald-600"}`}
          >
            {totalNetImpact < 0
              ? `-৳${Math.abs(totalNetImpact).toLocaleString("en-IN")}`
              : `+৳${totalNetImpact.toLocaleString("en-IN")}`}
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Real-time value variance across {adjustments.length} adjustment records
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Physical Write-Offs
            </span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[26px] leading-none font-extrabold tracking-tight text-slate-900">
            {writeOffCount} Incidents
          </div>
          <p className="mt-3 text-[11px] font-semibold text-amber-600">
            {writeOffTotalUnits} damaged or compromised units removed
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Audit Compliance
            </span>
            <Badge
              variant="outline"
              className={
                auditComplianceRate === 100
                  ? "border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-[10px] font-bold text-amber-700"
              }
            >
              {auditComplianceRate === 100 ? "DGDA Pass" : "Audit Pending"}
            </Badge>
          </div>
          <div className="mt-3 font-mono text-[26px] leading-none font-extrabold tracking-tight text-slate-900">
            {auditComplianceRate}% Approved
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            {approvedCount} of {adjustments.length} adjustments holds authorized sign-off
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Quarantined Stock Value
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-[#0090FF]">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[26px] leading-none font-extrabold tracking-tight text-slate-900">
            ৳{quarantinedImpact.toLocaleString("en-IN")}
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            Isolated in Quarantine Bay Q-01 for QA testing
          </p>
        </Card>
      </div>

      {/* 3. Search & Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search ref #, SKU, formulation, batch, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-[190px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Adjustment Types</SelectItem>
              <SelectItem value="write-off (damaged/broken)">Write-offs</SelectItem>
              <SelectItem value="quarantine transfer">Quarantine Transfers</SelectItem>
              <SelectItem value="audit count discrepancy">Audit Discrepancies</SelectItem>
              <SelectItem value="restock inward correction">Inward Corrections</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[160px] border-slate-200 bg-white text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved & adjusted">Approved & Adjusted</SelectItem>
              <SelectItem value="pending review">Pending Review</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Adjustments Ledger Table */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none print:hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              INVENTORY VARIANCE & WRITE-OFF REGISTER
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Audited adjustment records reflecting inventory additions,
              quarantine lockouts, and physical write-offs
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredAdjustments.length} of {adjustments.length} Records
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-[#0090FF]" />
            <span className="mt-2 block">Loading stock adjustments from database...</span>
          </div>
        ) : filteredAdjustments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Package className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 font-medium text-slate-600">No stock adjustment entries found</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Click "New Stock Adjustment" above to log a new inventory reconciliation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
                  <TableHead className="pl-0 text-xs font-medium text-slate-600">
                    Ref & Date
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Formulation & SKU
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Batch & Location
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Classification
                  </TableHead>
                  <TableHead className="text-center text-xs font-medium text-slate-600">
                    Qty Variance
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium text-slate-600">
                    Value Impact
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Status & Signatory
                  </TableHead>
                  <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdjustments.map((adj) => (
                  <TableRow
                    key={adj.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50"
                  >
                    {/* Ref & Date */}
                    <TableCell className="py-3 pl-0">
                      <div className="leading-tight">
                        <span className="block font-mono text-xs font-bold text-[#0090FF]">
                          {adj.adjustmentRef}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-slate-400">
                          {adj.date}
                        </span>
                      </div>
                    </TableCell>

                    {/* Formulation & SKU */}
                    <TableCell className="py-3 text-xs">
                      <div>
                        <span className="block font-semibold text-slate-900">
                          {adj.formulationName}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] text-slate-400">
                          {adj.skuCode}
                        </span>
                      </div>
                    </TableCell>

                    {/* Batch & Bay */}
                    <TableCell className="py-3 text-xs text-slate-700">
                      <div>
                        <span className="block font-mono font-medium text-slate-900">
                          {adj.batchNumber}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          {adj.warehouseLocation}
                        </span>
                      </div>
                    </TableCell>

                    {/* Type */}
                    <TableCell className="py-3 text-xs">
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-700"
                      >
                        {adj.type}
                      </Badge>
                    </TableCell>

                    {/* Qty Variance */}
                    <TableCell className="py-3 text-center font-mono text-xs font-bold">
                      <span
                        className={
                          adj.quantity < 0 ? "text-rose-600" : "text-emerald-600"
                        }
                      >
                        {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                      </span>
                    </TableCell>

                    {/* Financial Impact */}
                    <TableCell className="py-3 text-right font-mono text-xs font-bold">
                      <span
                        className={
                          adj.totalImpactBDT < 0
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }
                      >
                        {adj.totalImpactBDT < 0
                          ? `-৳${Math.abs(adj.totalImpactBDT).toLocaleString("en-IN")}`
                          : `+৳${adj.totalImpactBDT.toLocaleString("en-IN")}`}
                      </span>
                    </TableCell>

                    {/* Signatory & Status */}
                    <TableCell className="py-3 text-xs text-slate-700">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          {adj.approvalStatus === "Approved & Adjusted" ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-200 bg-emerald-50 text-[9px] font-bold text-emerald-700"
                            >
                              <Check className="mr-0.5 h-2.5 w-2.5" />
                              Approved
                            </Badge>
                          ) : adj.approvalStatus === "Pending Review" ? (
                            <Badge
                              variant="outline"
                              className="border-amber-200 bg-amber-50 text-[9px] font-bold text-amber-700"
                            >
                              <Clock className="mr-0.5 h-2.5 w-2.5" />
                              Pending
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-rose-200 bg-rose-50 text-[9px] font-bold text-rose-700"
                            >
                              Rejected
                            </Badge>
                          )}
                          <span className="max-w-[120px] truncate font-medium text-slate-800">
                            {adj.authorizedBy}
                          </span>
                        </div>
                        <span className="max-w-[170px] truncate text-[10px] text-slate-400">
                          {adj.reasonCode}
                        </span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3 pr-0 text-right text-xs">
                      <div className="flex items-center justify-end gap-1.5">
                        {adj.approvalStatus === "Pending Review" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveAdjustment(adj)}
                            title="Approve Adjustment"
                            className="h-7 gap-1 border-emerald-200 bg-emerald-50/50 px-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            <Check className="h-3 w-3" />
                            Approve
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAdjustment(adj)
                            setIsSlipOpen(true)
                          }}
                          className="h-7 gap-1 border-blue-200 px-2 text-[11px] font-semibold text-[#0090FF] hover:bg-blue-50"
                        >
                          <FileText className="h-3 w-3" />
                          Inspect Slip
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAdjustmentToDelete(adj)
                            setIsDeleteOpen(true)
                          }}
                          className="h-7 w-7 p-0 border-rose-200 text-rose-600 hover:bg-rose-50"
                          title="Delete Record"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* 5. Printable Adjustment Slip Modal */}
      <Dialog open={isSlipOpen} onOpenChange={setIsSlipOpen}>
        <DialogContent className="max-h-[95vh] overflow-y-auto rounded-2xl bg-white sm:max-w-[760px] p-6 print:p-0 shadow-2xl">
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Stock Adjustment Certificate
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Certificate #{selectedAdjustment?.adjustmentRef} ({selectedAdjustment?.formulationName})
                </DialogDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  requestAnimationFrame(() => {
                    setTimeout(() => window.print(), 60)
                  })
                }}
                className="h-8 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-xs font-semibold text-white shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" /> Print Certificate
              </Button>
            </div>
          </DialogHeader>

          {selectedAdjustment && (
            <div className="space-y-6 pt-2">
              <div className="mx-auto w-full max-w-[760px] bg-white text-xs">
                <StockAdjustmentCertificateSheet selectedAdjustment={selectedAdjustment} />
              </div>

              <div className="flex justify-end gap-2 pb-2 print:hidden pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSlipOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    requestAnimationFrame(() => {
                      setTimeout(() => window.print(), 60)
                    })
                  }}
                  className="gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-xs font-semibold text-white shadow-sm"
                >
                  <Printer className="h-4 w-4" /> Print Certificate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Isolated Standalone Printable Adjustment Certificate */}
      {selectedAdjustment && (
        <div
          id="print-standalone-adjustment"
          className="hidden bg-white p-0 font-sans text-black"
        >
          <div className="mx-auto w-full max-w-[760px] bg-white p-6 text-xs">
            <StockAdjustmentCertificateSheet selectedAdjustment={selectedAdjustment} />
          </div>
        </div>
      )}

      {/* 6. Global Delete Confirmation Modal (Rule 7: Mandatory DeleteConfirmationModal) */}
      <DeleteConfirmationModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteAdjustment}
        title="Delete Stock Adjustment Entry"
        description="Are you sure you want to permanently delete this stock adjustment record? This will remove the audit entry from the inventory register."
        itemName={
          adjustmentToDelete
            ? `${adjustmentToDelete.adjustmentRef} (${adjustmentToDelete.formulationName} • ${adjustmentToDelete.quantity} Units)`
            : undefined
        }
        confirmText="Confirm Delete"
        isDeleting={isDeleting}
      />
    </div>
  )
}

function StockAdjustmentCertificateSheet({ selectedAdjustment }: { selectedAdjustment: StockAdjustment }) {
  return (
    <div className="w-full bg-white text-slate-900 font-sans text-xs selection:bg-none">
      {/* 1. Header: Horizontal Logo & Motto + Stock Adjustment Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200/90 gap-4">
        {/* Brand Horizontal Logo with Motto */}
        <div className="flex flex-col items-start max-w-[390px]">
          <img
            src="/horizontal-logo-motto.svg"
            alt="AK Pharma - Smart Solutions for Healthier Living"
            className="h-10 w-auto object-contain"
          />
          <div className="mt-2 text-[11px] leading-relaxed text-slate-500 font-normal">
            <p className="font-semibold text-slate-700">AK Pharma Ltd. • QA & Central Inventory Governance</p>
            <p>10/26, Rupnagar R/A, Mirpur, Dhaka 1216, Bangladesh</p>
            <p>Tel: +8801712-611071 • Email: akpharmabd@gmail.com</p>
            <p className="text-[10px] text-slate-400">DGDA Lic: DL-2024-DH-08492 • Tax TIN: 4892-1082-9381</p>
          </div>
        </div>

        {/* Certificate Meta Block */}
        <div className="text-left sm:text-right space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            DGDA GxP Certified
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
            Stock Adjustment Certificate
          </h2>
          <p className="font-mono text-xs font-bold text-slate-800">
            Certificate Ref: <span className="text-amber-600">{selectedAdjustment.adjustmentRef}</span>
          </p>
          <div className="text-[11px] text-slate-500 space-y-0.5">
            <p>
              Audit Date: <span className="font-semibold text-slate-700">{selectedAdjustment.date}</span>
            </p>
            <p>
              Action Type: <span className="font-semibold text-slate-700">{selectedAdjustment.type}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side Dual Cards: Item & Batch Profile vs Regulatory Reference */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left: Item & Batch Profile */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="flex items-center gap-2 mb-2.5">
            <Package className="h-4 w-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-[11px] tracking-wider uppercase">
              Formulation & Batch Identification
            </h3>
          </div>
          <div className="space-y-1.5 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Formulation Name</p>
              <p className="font-bold text-slate-900 text-sm">{selectedAdjustment.formulationName}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">SKU Code</p>
                <p className="font-mono font-semibold text-slate-700">{selectedAdjustment.skuCode}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Batch Number</p>
                <p className="font-mono font-semibold text-slate-700">{selectedAdjustment.batchNumber}</p>
              </div>
            </div>
            <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-600">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Storage Location / Bin</span>
              <p className="font-semibold text-slate-800">{selectedAdjustment.warehouseLocation}</p>
            </div>
          </div>
        </div>

        {/* Right: Regulatory Reference & Authorization */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="flex items-center gap-2 mb-2.5">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-[11px] tracking-wider uppercase">
              Action Classification & Authority
            </h3>
          </div>
          <div className="space-y-1.5 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Classification Type</p>
              <p className="font-bold text-slate-900">{selectedAdjustment.type}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Authorized Officer</p>
                <p className="font-semibold text-slate-800">{selectedAdjustment.authorizedBy}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Audit Status</p>
                <p className="font-medium text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Reconciled
                </p>
              </div>
            </div>
            <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-600">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Facility Context</span>
              <p className="font-semibold text-slate-800">Central Pharma Logistics Depot - Tejgaon</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Items Table */}
      <div className="mt-5 rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <th className="w-10 py-2.5 px-3 text-center font-semibold">SL</th>
              <th className="py-2.5 px-3 text-left font-semibold">Formulation & SKU Code</th>
              <th className="w-28 py-2.5 px-3 text-center font-semibold">Batch No</th>
              <th className="w-28 py-2.5 px-3 text-center font-semibold">Quantity Delta</th>
              <th className="w-28 py-2.5 px-3 text-right font-semibold">Unit Cost (৳)</th>
              <th className="w-36 py-2.5 px-3 text-right font-semibold">Net Financial Impact (৳)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">01</td>
              <td className="py-3 px-3">
                <p className="font-bold text-slate-900">{selectedAdjustment.formulationName}</p>
                <p className="text-[10px] font-mono text-slate-500">SKU: {selectedAdjustment.skuCode}</p>
              </td>
              <td className="py-3 px-3 text-center font-mono text-slate-700 font-semibold">
                {selectedAdjustment.batchNumber}
              </td>
              <td className="py-3 px-3 text-center font-mono font-bold">
                <span
                  className={
                    selectedAdjustment.quantity > 0
                      ? "text-emerald-700"
                      : "text-red-700"
                  }
                >
                  {selectedAdjustment.quantity > 0
                    ? `+${selectedAdjustment.quantity}`
                    : selectedAdjustment.quantity}{" "}
                  Units
                </span>
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate-700">
                ৳{selectedAdjustment.unitCostBDT.toFixed(2)}
              </td>
              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                <span
                  className={
                    selectedAdjustment.totalImpactBDT < 0
                      ? "text-red-700"
                      : "text-emerald-700"
                  }
                >
                  {selectedAdjustment.totalImpactBDT < 0
                    ? `-৳${Math.abs(selectedAdjustment.totalImpactBDT).toLocaleString("en-IN")}`
                    : `+৳${selectedAdjustment.totalImpactBDT.toLocaleString("en-IN")}`}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Financial Calculation & Words Callout */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
        {/* Left: Amount in Words */}
        <div className="sm:col-span-7 rounded-xl border border-amber-100 bg-amber-50/40 p-4">
          <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-amber-600" />
            Financial Adjustment Valuation in Words
          </p>
          <p className="text-xs font-semibold text-amber-950 italic leading-relaxed">
            "{numberToWordsBDT(Math.abs(selectedAdjustment.totalImpactBDT))}"
          </p>
          <div className="mt-3 pt-2.5 border-t border-amber-200/50 flex flex-wrap items-center justify-between text-[11px] text-amber-800">
            <span>Reason: <strong>{selectedAdjustment.reasonCode}</strong></span>
            <span>Action: <strong>{selectedAdjustment.type}</strong></span>
          </div>
        </div>

        {/* Right: Net Financial Valuation Delta */}
        <div className="sm:col-span-5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Ledger Impact Classification</span>
            <span className="font-semibold text-slate-800">{selectedAdjustment.type}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Net Impact
            </span>
            <span
              className={`font-mono text-base font-black ${
                selectedAdjustment.totalImpactBDT < 0
                  ? "text-red-700"
                  : "text-emerald-700"
              }`}
            >
              {selectedAdjustment.totalImpactBDT < 0
                ? `-৳${Math.abs(selectedAdjustment.totalImpactBDT).toLocaleString("en-IN")}`
                : `+৳${selectedAdjustment.totalImpactBDT.toLocaleString("en-IN")}`}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Regulatory Justification & Audit Memo */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-700 space-y-1.5">
        <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px] tracking-wide uppercase">
          <ShieldCheck className="h-4 w-4 text-slate-600" />
          Regulatory Justification & DGDA Audit Protocol
        </div>
        <p className="italic text-slate-800 text-[11px]">
          "{selectedAdjustment.reasonCode}"
        </p>
        <p className="text-[11px] leading-relaxed text-slate-600 pt-0.5">
          This adjustment conforms to Directorate General of Drug Administration (DGDA) standard operating procedures for physical stock reconciliations, quarantine, or disposal. Physical count records and financial sub-ledgers have been updated accordingly.
        </p>
      </div>

      {/* 6. Executive 3-Tier Signatures */}
      <div className="mt-10 pt-4 grid grid-cols-3 gap-6 text-center text-xs">
        <div>
          <div className="w-36 mx-auto border-t border-slate-400 mb-1.5" />
          <p className="font-bold text-slate-800">Warehouse Officer</p>
          <p className="text-[10px] text-slate-400">Stock Controller</p>
        </div>
        <div>
          <div className="w-36 mx-auto border-t border-slate-400 mb-1.5" />
          <p className="font-bold text-slate-800">QA Inspector</p>
          <p className="text-[10px] text-slate-400">DGDA Compliance Lead</p>
        </div>
        <div>
          <div className="w-36 mx-auto border-t border-slate-400 mb-1.5" />
          <p className="font-bold text-slate-800">{selectedAdjustment.authorizedBy}</p>
          <p className="text-[10px] text-slate-400">Authorized Signatory</p>
        </div>
      </div>
    </div>
  )
}
