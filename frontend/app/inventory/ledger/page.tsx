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
  DialogTrigger,
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
  Boxes,
  Search,
  Filter,
  Plus,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  Snowflake,
  MoreHorizontal,
  Pencil,
  Trash2,
  Barcode,
} from "lucide-react";

interface InventoryBatch {
  id: string;
  skuCode: string;
  brandName: string;
  genericName: string;
  category: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  daysToExpiry: number;
  availableUnits: number;
  unitPrice: number;
  warehouseBin: string;
  storageCondition: "Cold Chain (2-8°C)" | "Controlled Ambient (<25°C)";
  fefoStatus: "Priority Out" | "Healthy" | "Near Expiry";
}

const initialLedger: InventoryBatch[] = [
  {
    id: "1",
    skuCode: "SKU-NP-500",
    brandName: "Napa Extra 500mg",
    genericName: "Paracetamol + Caffeine",
    category: "Analgesic",
    batchNumber: "BX-2026-881",
    mfgDate: "Jan 2026",
    expiryDate: "Dec 2027",
    daysToExpiry: 440,
    availableUnits: 14200,
    unitPrice: 2.8,
    warehouseBin: "Bay 02 - Shelf C",
    storageCondition: "Controlled Ambient (<25°C)",
    fefoStatus: "Healthy",
  },
  {
    id: "2",
    skuCode: "SKU-CP-500",
    brandName: "Ciprocin 500mg",
    genericName: "Ciprofloxacin USP",
    category: "Antibiotic",
    batchNumber: "BX-2025-412",
    mfgDate: "Nov 2025",
    expiryDate: "Oct 2026",
    daysToExpiry: 23,
    availableUnits: 1850,
    unitPrice: 14.5,
    warehouseBin: "Bay 01 - Shelf A",
    storageCondition: "Controlled Ambient (<25°C)",
    fefoStatus: "Priority Out",
  },
  {
    id: "3",
    skuCode: "SKU-RS-10",
    brandName: "Rosuvastatin 10mg",
    genericName: "Rosuvastatin Calcium",
    category: "Cardiovascular",
    batchNumber: "BX-2026-104",
    mfgDate: "Feb 2026",
    expiryDate: "Jan 2028",
    daysToExpiry: 470,
    availableUnits: 8400,
    unitPrice: 22.0,
    warehouseBin: "Bay 04 - Shelf B",
    storageCondition: "Controlled Ambient (<25°C)",
    fefoStatus: "Healthy",
  },
  {
    id: "4",
    skuCode: "SKU-CF-200",
    brandName: "Cef-3 200mg / 5ml Susp",
    genericName: "Cefixime Trihydrate",
    category: "Antibiotic",
    batchNumber: "BX-2026-039",
    mfgDate: "Mar 2026",
    expiryDate: "Nov 2026",
    daysToExpiry: 54,
    availableUnits: 980,
    unitPrice: 185.0,
    warehouseBin: "Cold Room A - Bin 03",
    storageCondition: "Cold Chain (2-8°C)",
    fefoStatus: "Near Expiry",
  },
  {
    id: "5",
    skuCode: "SKU-MX-20",
    brandName: "Maxpro 20mg",
    genericName: "Esomeprazole Magnesium",
    category: "Gastroenterology",
    batchNumber: "BX-2026-621",
    mfgDate: "Apr 2026",
    expiryDate: "Mar 2028",
    daysToExpiry: 532,
    availableUnits: 22000,
    unitPrice: 6.5,
    warehouseBin: "Bay 03 - Pallet 12",
    storageCondition: "Controlled Ambient (<25°C)",
    fefoStatus: "Healthy",
  },
  {
    id: "6",
    skuCode: "SKU-FZ-CAP",
    brandName: "Fefol-Z Capsule",
    genericName: "Carbonyl Iron + Folic Acid + Zinc",
    category: "Hematology & Nutrition",
    batchNumber: "BX-2025-911",
    mfgDate: "Aug 2025",
    expiryDate: "Dec 2026",
    daysToExpiry: 84,
    availableUnits: 3400,
    unitPrice: 5.2,
    warehouseBin: "Bay 05 - Shelf D",
    storageCondition: "Controlled Ambient (<25°C)",
    fefoStatus: "Priority Out",
  },
];

export default function ActiveInventoryLedgerPage() {
  const [ledger, setLedger] = React.useState<InventoryBatch[]>(initialLedger);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [fefoFilter, setFefoFilter] = React.useState("all");
  const [isAddBatchOpen, setIsAddBatchOpen] = React.useState(false);

  // Form states for receiving a new batch
  const [brandName, setBrandName] = React.useState("");
  const [genericName, setGenericName] = React.useState("");
  const [category, setCategory] = React.useState("Analgesic");
  const [batchNumber, setBatchNumber] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");
  const [availableUnits, setAvailableUnits] = React.useState("");
  const [unitPrice, setUnitPrice] = React.useState("");
  const [warehouseBin, setWarehouseBin] = React.useState("");
  const [storageCondition, setStorageCondition] = React.useState<InventoryBatch["storageCondition"]>(
    "Controlled Ambient (<25°C)"
  );

  const handleExportExcel = () => {
    const exportData = ledger.map((item) => ({
      "SKU Code": item.skuCode,
      "Brand Name": item.brandName,
      "Generic Composition": item.genericName,
      Category: item.category,
      "Batch Number": item.batchNumber,
      "Mfg Date": item.mfgDate,
      "Expiry Date": item.expiryDate,
      "Days Remaining": item.daysToExpiry,
      "Units in Stock": item.availableUnits,
      "Unit Cost (৳)": item.unitPrice,
      "Total Batch Valuation (৳)": (item.availableUnits * item.unitPrice).toFixed(2),
      "Warehouse Bin": item.warehouseBin,
      "Storage Condition": item.storageCondition,
      "FEFO Priority Status": item.fefoStatus,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FEFO Inventory Ledger");
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Inventory_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const newBatch: InventoryBatch = {
      id: Date.now().toString(),
      skuCode: `SKU-${brandName.slice(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      brandName,
      genericName,
      category,
      batchNumber,
      mfgDate: "Sep 2026",
      expiryDate,
      daysToExpiry: 365,
      availableUnits: Number(availableUnits) || 1000,
      unitPrice: Number(unitPrice) || 10,
      warehouseBin: warehouseBin || "Bay 01 - Shelf A",
      storageCondition,
      fefoStatus: "Healthy",
    };

    setLedger((prev) => [newBatch, ...prev]);
    setBrandName("");
    setGenericName("");
    setBatchNumber("");
    setExpiryDate("");
    setAvailableUnits("");
    setUnitPrice("");
    setWarehouseBin("");
    setIsAddBatchOpen(false);
  };

  const handleDeleteBatch = (id: string) => {
    setLedger((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredLedger = ledger.filter((item) => {
    const matchesSearch =
      item.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouseBin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.skuCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || item.category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesFefo =
      fefoFilter === "all" || item.fefoStatus.toLowerCase() === fefoFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesFefo;
  });

  const totalValuation = ledger.reduce(
    (acc, curr) => acc + curr.availableUnits * curr.unitPrice,
    0
  );
  const totalPacks = ledger.reduce((acc, curr) => acc + curr.availableUnits, 0);
  const priorityOutCount = ledger.filter(
    (i) => i.fefoStatus === "Priority Out" || i.fefoStatus === "Near Expiry"
  ).length;

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            FEFO Stock Control — Active Inventory Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Batch-level First-Expiry, First-Out tracking, storage bin mapping, and pharmaceutical stock valuation.
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
            Export Ledger
          </Button>

          {/* Receive Stock Batch Dialog */}
          <Dialog open={isAddBatchOpen} onOpenChange={setIsAddBatchOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none">
                <Plus className="h-4 w-4" />
                Receive New Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px] bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Receive Stock Batch</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Log incoming production or wholesaler consignment with FEFO expiry controls.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddBatch} className="space-y-3.5 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="brand" className="text-xs font-medium text-slate-700">Commercial Brand Name</Label>
                    <Input
                      id="brand"
                      placeholder="e.g. Napa Extra 500mg"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="generic" className="text-xs font-medium text-slate-700">Generic Composition</Label>
                    <Input
                      id="generic"
                      placeholder="e.g. Paracetamol + Caffeine"
                      value={genericName}
                      onChange={(e) => setGenericName(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="cat" className="text-xs font-medium text-slate-700">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Analgesic">Analgesic</SelectItem>
                        <SelectItem value="Antibiotic">Antibiotic</SelectItem>
                        <SelectItem value="Cardiovascular">Cardiovascular</SelectItem>
                        <SelectItem value="Gastroenterology">Gastroenterology</SelectItem>
                        <SelectItem value="Hematology">Hematology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="batch" className="text-xs font-medium text-slate-700">Batch Number</Label>
                    <Input
                      id="batch"
                      placeholder="BX-2026-901"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      required
                      className="h-8 text-xs font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="expiry" className="text-xs font-medium text-slate-700">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="Nov 2027"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="units" className="text-xs font-medium text-slate-700">Units Received</Label>
                    <Input
                      id="units"
                      type="number"
                      placeholder="5000"
                      value={availableUnits}
                      onChange={(e) => setAvailableUnits(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="text-xs font-medium text-slate-700">Unit Cost (৳)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.1"
                      placeholder="5.5"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bin" className="text-xs font-medium text-slate-700">Warehouse Bin / Location</Label>
                    <Input
                      id="bin"
                      placeholder="Bay 02 - Shelf C"
                      value={warehouseBin}
                      onChange={(e) => setWarehouseBin(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="storage" className="text-xs font-medium text-slate-700">Storage Environment</Label>
                    <Select
                      value={storageCondition}
                      onValueChange={(v) =>
                        setStorageCondition(v as InventoryBatch["storageCondition"])
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Controlled Ambient (<25°C)">Controlled Ambient (&lt;25°C)</SelectItem>
                        <SelectItem value="Cold Chain (2-8°C)">Cold Chain (2-8°C)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddBatchOpen(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                    Confirm Inward Batch
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Gross Inventory Valuation</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            ৳{totalValuation.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Realized cost baseline across {ledger.length} batches
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Available Stock Volume</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-800 bg-white border-slate-200 px-2 py-0.5 rounded-md">
              Live Stock
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {totalPacks.toLocaleString("en-IN")} Units
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Stored across 6 active warehouse bays
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">FEFO Priority Dispatch</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {priorityOutCount} Batches
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-3">
            Expiring within 90 days (Dispatch First)
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cold Chain Integrity</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
              <Snowflake className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            4.2°C Avg
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-3">
            Optimal refrigeration active
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search brand, generic, batch #, bin, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="analgesic">Analgesic</SelectItem>
              <SelectItem value="antibiotic">Antibiotic</SelectItem>
              <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
              <SelectItem value="gastroenterology">Gastroenterology</SelectItem>
              <SelectItem value="hematology">Hematology</SelectItem>
            </SelectContent>
          </Select>

          <Select value={fefoFilter} onValueChange={setFefoFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs bg-white border-slate-200">
              <SelectValue placeholder="FEFO Priority" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All FEFO Status</SelectItem>
              <SelectItem value="priority out">Priority Out (Next)</SelectItem>
              <SelectItem value="near expiry">Near Expiry (&lt;60d)</SelectItem>
              <SelectItem value="healthy">Healthy Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Active Inventory Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Batch Inventory Ledger & Storage Allocations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Audited stocks organized strictly by First-Expiry, First-Out (FEFO) dispensing order
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredLedger.length} Active Batches
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Medicine / SKU</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Batch Code</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Mfg / Expiry</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Storage Location</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Stock (Units)</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Unit Price</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Batch Valuation</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">FEFO Order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLedger.map((batch) => (
              <TableRow key={batch.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                {/* Brand & Generic */}
                <TableCell className="py-3 pl-0">
                  <div className="leading-tight">
                    <span className="text-xs font-bold text-slate-900 block">{batch.brandName}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono text-slate-500">{batch.skuCode}</span>
                      <span>•</span>
                      <span className="truncate max-w-[180px]">{batch.genericName}</span>
                    </div>
                  </div>
                </TableCell>

                {/* Batch Code */}
                <TableCell className="py-3 text-xs font-mono font-semibold text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Barcode className="h-3.5 w-3.5 text-slate-400" />
                    <span>{batch.batchNumber}</span>
                  </div>
                </TableCell>

                {/* Expiry & Days Remaining */}
                <TableCell className="py-3 text-xs text-slate-700">
                  <div className="leading-tight">
                    <span className="font-mono font-medium text-slate-900 block">Exp: {batch.expiryDate}</span>
                    <span
                      className={`text-[10px] font-semibold ${
                        batch.daysToExpiry <= 60
                          ? "text-rose-600"
                          : batch.daysToExpiry <= 90
                          ? "text-amber-600"
                          : "text-slate-400"
                      }`}
                    >
                      {batch.daysToExpiry} days remaining
                    </span>
                  </div>
                </TableCell>

                {/* Warehouse Location & Storage */}
                <TableCell className="py-3 text-xs text-slate-600">
                  <div>
                    <span className="font-medium text-slate-800 block">{batch.warehouseBin}</span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      {batch.storageCondition.includes("Cold") && (
                        <Snowflake className="h-2.5 w-2.5 text-[#0090FF]" />
                      )}
                      <span>{batch.storageCondition}</span>
                    </div>
                  </div>
                </TableCell>

                {/* Available Units */}
                <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                  {batch.availableUnits.toLocaleString()}
                </TableCell>

                {/* Unit Cost */}
                <TableCell className="py-3 text-xs text-right font-mono text-slate-600">
                  ৳{batch.unitPrice.toFixed(2)}
                </TableCell>

                {/* Total Valuation */}
                <TableCell className="py-3 text-xs text-right font-mono font-semibold text-slate-900">
                  ৳{(batch.availableUnits * batch.unitPrice).toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </TableCell>

                {/* FEFO Status Badge */}
                <TableCell className="py-3 text-xs text-right pr-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md ${
                      batch.fefoStatus === "Priority Out"
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : batch.fefoStatus === "Near Expiry"
                        ? "text-rose-700 bg-rose-50 border-rose-200"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    {batch.fefoStatus}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}