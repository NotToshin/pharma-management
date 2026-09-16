"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";

export interface StockAdjustment {
  id: string;
  adjustmentRef: string;
  date: string;
  skuCode: string;
  formulationName: string;
  batchNumber: string;
  warehouseLocation: "Bay 01 - Shelf A" | "Bay 02 - Shelf B" | "Cold Room A (2-8°C)" | "Quarantine Bay Q-01";
  type: "Write-off (Damaged/Broken)" | "Quarantine Transfer" | "Audit Count Discrepancy" | "Restock Inward Correction";
  quantity: number; // Positive or negative
  unitCostBDT: number;
  totalImpactBDT: number;
  reasonCode: string;
  authorizedBy: string;
  approvalStatus: "Approved & Adjusted" | "Pending Review" | "Rejected";
}

const initialAdjustments: StockAdjustment[] = [
  {
    id: "adj-1",
    adjustmentRef: "ADJ-2026-081",
    date: "16 Sep 2026",
    skuCode: "SKU-CF-200",
    formulationName: "Cef-3 200mg/5ml Susp",
    batchNumber: "BX-2026-039",
    warehouseLocation: "Cold Room A (2-8°C)",
    type: "Write-off (Damaged/Broken)",
    quantity: -15,
    unitCostBDT: 185.0,
    totalImpactBDT: -2775.0,
    reasonCode: "Packaging seal compromised during cold-chain offloading",
    authorizedBy: "Mahbubur Rashid (WH Lead)",
    approvalStatus: "Approved & Adjusted",
  },
  {
    id: "adj-2",
    adjustmentRef: "ADJ-2026-082",
    date: "16 Sep 2026",
    skuCode: "SKU-CL-625",
    formulationName: "Clavroc 625mg Tab",
    batchNumber: "BX-2025-119",
    warehouseLocation: "Quarantine Bay Q-01",
    type: "Quarantine Transfer",
    quantity: -60,
    unitCostBDT: 315.0,
    totalImpactBDT: -18900.0,
    reasonCode: "Batch stability threshold breach: transferred out of active pick bays",
    authorizedBy: "Toshin Bin Azad (Super Admin)",
    approvalStatus: "Approved & Adjusted",
  },
  {
    id: "adj-3",
    adjustmentRef: "ADJ-2026-083",
    date: "15 Sep 2026",
    skuCode: "SKU-CP-500",
    formulationName: "Ciprocin 500mg Tab",
    batchNumber: "BX-2025-412",
    warehouseLocation: "Bay 01 - Shelf A",
    type: "Audit Count Discrepancy",
    quantity: -12,
    unitCostBDT: 28.5,
    totalImpactBDT: -342.0,
    reasonCode: "Physical count reconciliation variance vs. system bin ledger",
    authorizedBy: "Internal Audit Team",
    approvalStatus: "Approved & Adjusted",
  },
  {
    id: "adj-4",
    adjustmentRef: "ADJ-2026-084",
    date: "14 Sep 2026",
    skuCode: "SKU-NP-500",
    formulationName: "Napa Extra 500mg",
    batchNumber: "BX-2026-802",
    warehouseLocation: "Bay 02 - Shelf B",
    type: "Restock Inward Correction",
    quantity: 100,
    unitCostBDT: 2.4,
    totalImpactBDT: 240.0,
    reasonCode: "Supplier shipper carton bonus units unlogged at initial receiving",
    authorizedBy: "Mahbubur Rashid (WH Lead)",
    approvalStatus: "Approved & Adjusted",
  },
  {
    id: "adj-5",
    adjustmentRef: "ADJ-2026-085",
    date: "14 Sep 2026",
    skuCode: "SKU-AZ-500",
    formulationName: "Azithromycin 500mg",
    batchNumber: "BX-2026-301",
    warehouseLocation: "Bay 01 - Shelf A",
    type: "Write-off (Damaged/Broken)",
    quantity: -8,
    unitCostBDT: 45.0,
    totalImpactBDT: -360.0,
    reasonCode: "Outer blister dented by hydraulic pallet jack",
    authorizedBy: "Pending Review",
    approvalStatus: "Pending Review",
  },
];

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = React.useState<StockAdjustment[]>(initialAdjustments);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Create Modal State
  const [isNewOpen, setIsNewOpen] = React.useState(false);
  const [skuCode, setSkuCode] = React.useState("");
  const [formulationName, setFormulationName] = React.useState("");
  const [batchNumber, setBatchNumber] = React.useState("");
  const [warehouseLocation, setWarehouseLocation] = React.useState<StockAdjustment["warehouseLocation"]>("Bay 01 - Shelf A");
  const [type, setType] = React.useState<StockAdjustment["type"]>("Write-off (Damaged/Broken)");
  const [quantity, setQuantity] = React.useState("");
  const [unitCostBDT, setUnitCostBDT] = React.useState("");
  const [reasonCode, setReasonCode] = React.useState("");

  // Inspect Slip State
  const [selectedAdjustment, setSelectedAdjustment] = React.useState<StockAdjustment | null>(null);
  const [isSlipOpen, setIsSlipOpen] = React.useState(false);

  const parsedQty = parseFloat(quantity) || 0;
  const parsedCost = parseFloat(unitCostBDT) || 0;
  const calculatedImpact = parsedQty * parsedCost;

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuCode || !batchNumber || parsedQty === 0) return;

    const newEntry: StockAdjustment = {
      id: `adj-${Date.now()}`,
      adjustmentRef: `ADJ-2026-${Math.floor(80 + adjustments.length + 6)}`,
      date: "17 Sep 2026",
      skuCode,
      formulationName,
      batchNumber,
      warehouseLocation,
      type,
      quantity: parsedQty,
      unitCostBDT: parsedCost,
      totalImpactBDT: calculatedImpact,
      reasonCode: reasonCode || "Regularized under plant QA policy",
      authorizedBy: "Toshin Bin Azad (Super Admin)",
      approvalStatus: "Approved & Adjusted",
    };

    setAdjustments((prev) => [newEntry, ...prev]);
    setSkuCode("");
    setFormulationName("");
    setBatchNumber("");
    setQuantity("");
    setUnitCostBDT("");
    setReasonCode("");
    setIsNewOpen(false);
  };

  const handleExportExcel = () => {
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
      "Status": a.approvalStatus,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Adjustments");
    XLSX.writeFile(workbook, `AK_Pharma_Stock_Adjustments_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredAdjustments = adjustments.filter((adj) => {
    const matchesSearch =
      adj.adjustmentRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.skuCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.formulationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.reasonCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === "all" || adj.type.toLowerCase() === typeFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" || adj.approvalStatus.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalNetImpact = adjustments.reduce((acc, curr) => acc + curr.totalImpactBDT, 0);
  const writeOffCount = adjustments.filter((a) => a.type.includes("Write-off")).length;

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-12">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0090FF] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              WAREHOUSE INVENTORY CONTROL
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
            Stock Adjustments & Write-Off Journal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log physical inventory variances, write-offs, quarantine transfers, and DGDA-compliant reconciliation entries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3.5 rounded-lg shadow-none"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Adjustment Ledger
          </Button>

          {/* New Stock Adjustment Dialog */}
          <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none">
                <Plus className="h-4 w-4" />
                New Stock Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[580px] bg-white rounded-2xl max-h-[92vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Log Warehouse Inventory Adjustment
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Record lot reconciliations, physical damage write-offs, or quarantine bin relocations.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateAdjustment} className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">SKU Code *</Label>
                    <Input
                      placeholder="e.g. SKU-CF-200"
                      value={skuCode}
                      onChange={(e) => setSkuCode(e.target.value)}
                      required
                      className="h-8 text-xs font-mono font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Formulation Name *</Label>
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
                    <Label className="text-xs font-medium text-slate-700">Batch Lot Number *</Label>
                    <Input
                      placeholder="e.g. BX-2026-039"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Warehouse Storage Bay</Label>
                    <Select value={warehouseLocation} onValueChange={(val) => setWarehouseLocation(val as StockAdjustment["warehouseLocation"])}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Bay 01 - Shelf A">Bay 01 - Shelf A (Ambient)</SelectItem>
                        <SelectItem value="Bay 02 - Shelf B">Bay 02 - Shelf B (Ambient)</SelectItem>
                        <SelectItem value="Cold Room A (2-8°C)">Cold Room A (2-8°C)</SelectItem>
                        <SelectItem value="Quarantine Bay Q-01">Quarantine Bay Q-01</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Adjustment Classification *</Label>
                  <Select value={type} onValueChange={(val) => setType(val as StockAdjustment["type"])}>
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Write-off (Damaged/Broken)">Write-off (Damaged / Broken / Seal Breached)</SelectItem>
                      <SelectItem value="Quarantine Transfer">Quarantine Transfer (Near Expiry / Defective)</SelectItem>
                      <SelectItem value="Audit Count Discrepancy">Audit Count Discrepancy (Physical vs System)</SelectItem>
                      <SelectItem value="Restock Inward Correction">Restock Inward Correction (Surplus Receipt)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Unit Quantity Adjusted (use '-' for deduction) *
                    </Label>
                    <Input
                      type="number"
                      placeholder="-15 or 50"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Unit Cost (৳) *</Label>
                    <Input
                      type="number"
                      placeholder="185.0"
                      value={unitCostBDT}
                      onChange={(e) => setUnitCostBDT(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Computed Ledger Value Impact:</span>
                  <span className={`font-mono font-bold text-sm ${calculatedImpact < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {calculatedImpact < 0 ? `-৳${Math.abs(calculatedImpact).toLocaleString("en-IN")}` : `+৳${calculatedImpact.toLocaleString("en-IN")}`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Clinical / Quality Audit Reason *</Label>
                  <Input
                    placeholder="e.g. Blister damage during internal pallet relocation"
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsNewOpen(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white font-semibold">
                    Authorize Adjustment
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 print:hidden">
        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Adjustments Impact</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] font-extrabold tracking-tight text-rose-600 leading-none font-mono">
            -৳{Math.abs(totalNetImpact).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-medium">
            Accumulated value variance this fiscal period
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Physical Write-Offs</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] font-extrabold tracking-tight text-slate-900 leading-none font-mono">
            {writeOffCount} Incidents
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-3">
            Damaged, broken or expired units removed
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Audit Compliance</span>
            <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
              DGDA Pass
            </Badge>
          </div>
          <div className="mt-3 text-[26px] font-extrabold tracking-tight text-slate-900 leading-none font-mono">
            100% Signed
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-medium">
            Every entry holds authorized sign-off
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quarantined Stock Value</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#0090FF]">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] font-extrabold tracking-tight text-slate-900 leading-none font-mono">
            ৳18,900
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-medium">
            Bay Q-01 isolated for QA inspection
          </p>
        </Card>
      </div>

      {/* 3. Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 print:hidden">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search ref #, SKU, formulation, batch, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-[190px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
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
            <SelectTrigger className="h-8 w-[160px] text-xs bg-white border-slate-200">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved & adjusted">Approved & Adjusted</SelectItem>
              <SelectItem value="pending review">Pending Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Adjustments Ledger Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              INVENTORY VARIANCE & WRITE-OFF REGISTER
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Audited adjustment records reflecting inventory additions, quarantine lockouts, and physical write-offs
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredAdjustments.length} Records
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Ref & Date</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Formulation & SKU</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Batch & Location</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Classification</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-center">Qty Variance</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Value Impact</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Authorized By</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Slip</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdjustments.map((adj) => (
              <TableRow key={adj.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                {/* Ref & Date */}
                <TableCell className="py-3 pl-0">
                  <div className="leading-tight">
                    <span className="text-xs font-mono font-bold text-[#0090FF] block">{adj.adjustmentRef}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{adj.date}</span>
                  </div>
                </TableCell>

                {/* Formulation & SKU */}
                <TableCell className="py-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block">{adj.formulationName}</span>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{adj.skuCode}</span>
                  </div>
                </TableCell>

                {/* Batch & Bay */}
                <TableCell className="py-3 text-xs text-slate-700">
                  <div>
                    <span className="font-mono font-medium text-slate-900 block">{adj.batchNumber}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{adj.warehouseLocation}</span>
                  </div>
                </TableCell>

                {/* Type */}
                <TableCell className="py-3 text-xs">
                  <Badge variant="outline" className="text-[10px] font-medium bg-slate-50 text-slate-700 border-slate-200">
                    {adj.type}
                  </Badge>
                </TableCell>

                {/* Qty Variance */}
                <TableCell className="py-3 text-xs text-center font-mono font-bold">
                  <span className={adj.quantity < 0 ? "text-rose-600" : "text-emerald-600"}>
                    {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                  </span>
                </TableCell>

                {/* Financial Impact */}
                <TableCell className="py-3 text-xs text-right font-mono font-bold">
                  <span className={adj.totalImpactBDT < 0 ? "text-rose-600" : "text-emerald-600"}>
                    {adj.totalImpactBDT < 0 ? `-৳${Math.abs(adj.totalImpactBDT).toLocaleString("en-IN")}` : `+৳${adj.totalImpactBDT.toLocaleString("en-IN")}`}
                  </span>
                </TableCell>

                {/* Signatory */}
                <TableCell className="py-3 text-xs text-slate-700">
                  <span className="font-medium text-slate-800 block truncate max-w-[150px]">{adj.authorizedBy}</span>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[170px]">{adj.reasonCode}</span>
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3 text-xs text-right pr-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedAdjustment(adj);
                      setIsSlipOpen(true);
                    }}
                    className="h-7 px-2 text-xs text-[#0090FF] border-blue-200 hover:bg-blue-50 gap-1 font-semibold"
                  >
                    <FileText className="h-3 w-3" />
                    Inspect Slip
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Printable Adjustment Slip Modal */}
      <Dialog open={isSlipOpen} onOpenChange={setIsSlipOpen}>
        <DialogContent className="sm:max-w-[620px] bg-white rounded-2xl p-0 overflow-hidden">
          {selectedAdjustment && (
            <div>
              {/* Toolbar Bar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between print:hidden">
                <span className="text-xs font-bold text-slate-800">
                  Official Stock Adjustment Certificate — {selectedAdjustment.adjustmentRef}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white gap-1.5 shadow-none"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print / Save as PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsSlipOpen(false)}
                    className="h-8 text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Printable Body Content */}
              <div className="p-8 text-slate-900 font-sans leading-relaxed text-xs">
                {/* Official Letterhead */}
                <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-black tracking-tight uppercase">AK PHARMA </h2>
                    <p className="text-[11px] text-slate-600 font-medium">Quality Assurance & Warehouse Inventory Control</p>
                    <p className="text-[10px] text-slate-400">Tejgaon Central Depot, Dhaka • DGDA Lic: DL-PH-2026-88</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black uppercase tracking-wider block text-slate-900 border border-slate-900 px-2 py-0.5 inline-block">
                      STOCK ADJUSTMENT SLIP
                    </span>
                    <span className="text-xs font-mono font-bold text-[#0090FF] block mt-1">
                      {selectedAdjustment.adjustmentRef}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Date: {selectedAdjustment.date}
                    </span>
                  </div>
                </div>

                {/* Primary Meta Strip */}
                <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                  <div className="space-y-1">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Formulation / Item:</span>
                      <strong className="text-sm text-slate-900 block">{selectedAdjustment.formulationName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">SKU & Batch Identification:</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedAdjustment.skuCode} • Batch: {selectedAdjustment.batchNumber}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-right sm:text-left">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Warehouse Storage Bin:</span>
                      <strong className="text-slate-900 block">{selectedAdjustment.warehouseLocation}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Action Classification:</span>
                      <span className="font-medium text-slate-800">{selectedAdjustment.type}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity & Ledger Summary */}
                <div className="my-4 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800 block">
                    Inventory Ledger Impact
                  </span>
                  <div className="grid grid-cols-3 gap-4 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Quantity Adjusted:</span>
                      <span className={`font-mono font-bold text-sm ${selectedAdjustment.quantity < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {selectedAdjustment.quantity > 0 ? `+${selectedAdjustment.quantity}` : selectedAdjustment.quantity} Units
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Unit Base Cost:</span>
                      <span className="font-mono font-semibold text-slate-800 text-sm">
                        ৳{selectedAdjustment.unitCostBDT.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Total Net Impact:</span>
                      <span className={`font-mono font-bold text-sm ${selectedAdjustment.totalImpactBDT < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {selectedAdjustment.totalImpactBDT < 0 ? `-৳${Math.abs(selectedAdjustment.totalImpactBDT).toLocaleString("en-IN")}` : `+৳${selectedAdjustment.totalImpactBDT.toLocaleString("en-IN")}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit Narrative */}
                <div className="py-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Audited Reason & Regulatory Justification:
                  </span>
                  <p className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 italic">
                    "{selectedAdjustment.reasonCode}"
                  </p>
                </div>

                {/* Sign-off Blocks */}
                <div className="mt-12 pt-6 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-[11px] text-center">
                  <div>
                    <div className="w-32 border-b border-slate-400 mx-auto mb-1.5" />
                    <span className="font-bold text-slate-900 block">Warehouse Officer</span>
                    <span className="text-[10px] text-slate-500">Stock Controller</span>
                  </div>
                  <div>
                    <div className="w-32 border-b border-slate-400 mx-auto mb-1.5" />
                    <span className="font-bold text-slate-900 block">QA Inspector</span>
                    <span className="text-[10px] text-slate-500">DGDA Compliance Lead</span>
                  </div>
                  <div>
                    <div className="w-32 border-b border-slate-400 mx-auto mb-1.5" />
                    <span className="font-bold text-slate-900 block">{selectedAdjustment.authorizedBy}</span>
                    <span className="text-[10px] text-slate-500">Authorized Signatory</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end print:hidden">
                <Button variant="outline" size="sm" onClick={() => setIsSlipOpen(false)} className="h-8 text-xs">
                  Close Preview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}