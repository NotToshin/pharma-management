"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";

interface ExpiryWatchItem {
  id: string;
  skuCode: string;
  brandName: string;
  genericName: string;
  batchNumber: string;
  warehouseBin: string;
  expiryDate: string;
  daysRemaining: number;
  availableUnits: number;
  unitPrice: number;
  valueAtRisk: number;
  riskTier: "Critical (<30d)" | "High Risk (31-60d)" | "Attention (61-90d)" | "Quarantined";
  dispositionPlan: "Push to Top Retailers" | "Discount Liquidation" | "Manufacturer Return" | "Destruction Protocol";
}

const initialExpiryItems: ExpiryWatchItem[] = [
  {
    id: "1",
    skuCode: "SKU-CP-500",
    brandName: "Ciprocin 500mg",
    genericName: "Ciprofloxacin USP",
    batchNumber: "BX-2025-412",
    warehouseBin: "Bay 01 - Shelf A",
    expiryDate: "10 Oct 2026",
    daysRemaining: 23,
    availableUnits: 1850,
    unitPrice: 14.5,
    valueAtRisk: 26825,
    riskTier: "Critical (<30d)",
    dispositionPlan: "Push to Top Retailers",
  },
  {
    id: "2",
    skuCode: "SKU-CF-200",
    brandName: "Cef-3 200mg/5ml Susp",
    genericName: "Cefixime Trihydrate",
    batchNumber: "BX-2026-039",
    warehouseBin: "Cold Room A - Bin 03",
    expiryDate: "10 Nov 2026",
    daysRemaining: 54,
    availableUnits: 980,
    unitPrice: 185.0,
    valueAtRisk: 181300,
    riskTier: "High Risk (31-60d)",
    dispositionPlan: "Discount Liquidation",
  },
  {
    id: "3",
    skuCode: "SKU-FZ-CAP",
    brandName: "Fefol-Z Capsule",
    genericName: "Carbonyl Iron + Folic Acid + Zinc",
    batchNumber: "BX-2025-911",
    warehouseBin: "Bay 05 - Shelf D",
    expiryDate: "10 Dec 2026",
    daysRemaining: 84,
    availableUnits: 3400,
    unitPrice: 5.2,
    valueAtRisk: 17680,
    riskTier: "Attention (61-90d)",
    dispositionPlan: "Push to Top Retailers",
  },
  {
    id: "4",
    skuCode: "SKU-AZ-500",
    brandName: "Azithromycin 500mg",
    genericName: "Azithromycin Dihydrate",
    batchNumber: "BX-2025-308",
    warehouseBin: "Bay 02 - Shelf B",
    expiryDate: "05 Oct 2026",
    daysRemaining: 18,
    availableUnits: 620,
    unitPrice: 35.0,
    valueAtRisk: 21700,
    riskTier: "Critical (<30d)",
    dispositionPlan: "Discount Liquidation",
  },
  {
    id: "5",
    skuCode: "SKU-CV-625",
    brandName: "Clavroc 625mg Tab",
    genericName: "Amoxicillin + Clavulanic Acid",
    batchNumber: "BX-2025-119",
    warehouseBin: "Quarantine Bay Q-01",
    expiryDate: "28 Sep 2026",
    daysRemaining: 11,
    availableUnits: 450,
    unitPrice: 42.0,
    valueAtRisk: 18900,
    riskTier: "Quarantined",
    dispositionPlan: "Destruction Protocol",
  },
  {
    id: "6",
    skuCode: "SKU-OM-20",
    brandName: "Omeprazole 20mg Cap",
    genericName: "Omeprazole USP",
    batchNumber: "BX-2025-782",
    warehouseBin: "Bay 03 - Shelf F",
    expiryDate: "02 Dec 2026",
    daysRemaining: 76,
    availableUnits: 5100,
    unitPrice: 4.0,
    valueAtRisk: 20400,
    riskTier: "Attention (61-90d)",
    dispositionPlan: "Manufacturer Return",
  },
];

export default function ExpiryWatchlistPage() {
  const [items, setItems] = React.useState<ExpiryWatchItem[]>(initialExpiryItems);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [tierFilter, setTierFilter] = React.useState("all");

  // Quarantine Modal State
  const [isQuarantineOpen, setIsQuarantineOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<ExpiryWatchItem | null>(null);
  const [quarantineReason, setQuarantineReason] = React.useState("Approaching 15-day shelf life threshold");

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
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expiry Risk Watchlist");
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Expiry_Watchlist_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handleMoveToQuarantine = (item: ExpiryWatchItem) => {
    setSelectedItem(item);
    setIsQuarantineOpen(true);
  };

  const confirmQuarantine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

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
    );
    setIsQuarantineOpen(false);
    setSelectedItem(null);
  };

  const handleUpdatePlan = (id: string, newPlan: ExpiryWatchItem["dispositionPlan"]) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, dispositionPlan: newPlan } : i))
    );
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouseBin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.skuCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTier =
      tierFilter === "all" || item.riskTier.toLowerCase().includes(tierFilter.toLowerCase());

    return matchesSearch && matchesTier;
  });

  const totalExposure = items.reduce((acc, curr) => acc + curr.valueAtRisk, 0);
  const criticalCount = items.filter((i) => i.riskTier === "Critical (<30d)").length;
  const quarantinedCount = items.filter((i) => i.riskTier === "Quarantined").length;
  const totalUnitsAtRisk = items.reduce((acc, curr) => acc + curr.availableUnits, 0);

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            FEFO Stock Control — Expiry Watchlist
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Near-expiry surveillance, statutory quarantine protocols, and loss-mitigation clearance schedules.
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
            Export Audit Sheet
          </Button>

          <Badge variant="outline" className="text-xs font-semibold text-rose-700 bg-rose-50 border-rose-200 px-3 py-1.5 rounded-lg">
            <Flame className="h-3.5 w-3.5 mr-1.5 inline text-rose-600" />
            {criticalCount} Batches Require Immediate Clearance
          </Badge>
        </div>
      </div>

      {/* 2. Key Loss-Mitigation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Financial Risk */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Gross Value at Risk</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            ৳{totalExposure.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-3">
            Across {items.length} monitored batch lines
          </p>
        </Card>

        {/* Units Under Surveillance */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Units Exposed</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {totalUnitsAtRisk.toLocaleString("en-IN")} Units
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Targeting 90-day liquidation run-rate
          </p>
        </Card>

        {/* Critical Bracket (<30 Days) */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Critical Stage (&lt;30d)</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {criticalCount} Batches
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-3">
            Auto-assigned to Priority Push
          </p>
        </Card>

        {/* Quarantined & Isolated */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Quarantine Locked</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {quarantinedCount} Batches
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Ineligible for order picking & billing
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search medicine brand, batch #, SKU, or bay..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="h-8 w-[170px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
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
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              EXPIRY RISK ACTION REGISTER
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live batch countdown, warehouse isolation state, and active mitigation routing
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredItems.length} Monitored Batches
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Product / SKU</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Batch Code</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Location Bin</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Expiry Date</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-center">Remaining</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Available Stock</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Value at Risk</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Risk Severity</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Mitigation Strategy</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                {/* Brand & SKU */}
                <TableCell className="py-3 pl-0">
                  <div className="leading-tight">
                    <span className="text-xs font-bold text-slate-900 block">{item.brandName}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono text-slate-500">{item.skuCode}</span>
                      <span>•</span>
                      <span className="truncate max-w-[150px]">{item.genericName}</span>
                    </div>
                  </div>
                </TableCell>

                {/* Batch */}
                <TableCell className="py-3 text-xs font-mono font-semibold text-slate-800">
                  {item.batchNumber}
                </TableCell>

                {/* Warehouse Location */}
                <TableCell className="py-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Warehouse className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className={item.riskTier === "Quarantined" ? "font-bold text-rose-700" : ""}>
                      {item.warehouseBin}
                    </span>
                  </div>
                </TableCell>

                {/* Expiry Date */}
                <TableCell className="py-3 text-xs font-mono text-slate-800">
                  {item.expiryDate}
                </TableCell>

                {/* Countdown Badge */}
                <TableCell className="py-3 text-xs text-center">
                  <span
                    className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded-md inline-block ${
                      item.daysRemaining <= 30
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : item.daysRemaining <= 60
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.daysRemaining} days
                  </span>
                </TableCell>

                {/* Stock Quantity */}
                <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                  {item.availableUnits.toLocaleString()}
                </TableCell>

                {/* Value at Risk */}
                <TableCell className="py-3 text-xs text-right font-mono font-semibold text-rose-600">
                  ৳{item.valueAtRisk.toLocaleString("en-IN")}
                </TableCell>

                {/* Risk Tier Badge */}
                <TableCell className="py-3 text-xs">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      item.riskTier === "Critical (<30d)"
                        ? "text-rose-700 bg-rose-50 border-rose-200"
                        : item.riskTier === "High Risk (31-60d)"
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : item.riskTier === "Quarantined"
                        ? "text-purple-700 bg-purple-50 border-purple-200"
                        : "text-slate-700 bg-slate-50 border-slate-200"
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
                      handleUpdatePlan(item.id, val as ExpiryWatchItem["dispositionPlan"])
                    }
                  >
                    <SelectTrigger className="h-7 w-[160px] text-[11px] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Push to Top Retailers">Push to Top Retailers</SelectItem>
                      <SelectItem value="Discount Liquidation">Discount Liquidation</SelectItem>
                      <SelectItem value="Manufacturer Return">Manufacturer Return</SelectItem>
                      <SelectItem value="Destruction Protocol">Destruction Protocol</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>

                {/* Actions Button */}
                <TableCell className="py-3 text-xs text-right pr-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white">
                      <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Disposition Actions
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleMoveToQuarantine(item)}
                        className="text-xs cursor-pointer text-amber-700 focus:text-amber-700 focus:bg-amber-50"
                      >
                        <Lock className="h-3.5 w-3.5 mr-2" />
                        Move to Quarantine
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleUpdatePlan(item.id, "Push to Top Retailers")}
                        className="text-xs cursor-pointer text-slate-700"
                      >
                        <Flame className="h-3.5 w-3.5 mr-2 text-rose-500" />
                        Prioritize Dispatch
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleUpdatePlan(item.id, "Manufacturer Return")}
                        className="text-xs cursor-pointer text-slate-700"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-2 text-blue-500" />
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
        <DialogContent className="sm:max-w-[460px] bg-white rounded-xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Isolate Batch into Quarantine
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Quarantining immediately locks this batch. It will be removed from order picking and sales allocation.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <form onSubmit={confirmQuarantine} className="space-y-3.5 py-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Formulation:</span>
                  <span className="font-bold text-slate-900">{selectedItem.brandName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Batch Code:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedItem.batchNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Stock Quantity:</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedItem.availableUnits.toLocaleString()} units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Isolation Bin:</span>
                  <span className="font-semibold text-rose-700">Quarantine Bay Q-01</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="q-reason" className="text-xs font-medium text-slate-700">
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
                  className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-none"
                >
                  Lock into Quarantine
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}