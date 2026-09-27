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
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  Boxes,
  Search,
  Filter,
  Plus,
  Download,
  Clock,
  Snowflake,
  MoreHorizontal,
  Pencil,
  Trash2,
  Barcode,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";

export interface InventoryBatch {
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

export const PHARMA_CATEGORIES = {
  generalInfectious: [
    "Antibiotic",
    "Antiviral",
    "Antifungal",
    "Antiparasitic / Anthelmintic",
  ],
  systemicTherapies: [
    "Analgesic & Antipyretic",
    "Cardiovascular (Hypertension & Lipid)",
    "Gastroenterology (Anti-ulcerant & Antacid)",
    "Antidiabetic (Oral & Insulin)",
    "Respiratory (Bronchodilator & Anti-asthma)",
    "Antihistamine & Anti-allergic",
  ],
  specialtyClinicals: [
    "Neurology & CNS",
    "Psychiatry & Sedatives",
    "Hematology & Hematinics",
    "Dermatology & Topicals",
    "Ophthalmology & ENT",
    "Musculoskeletal & Anti-inflammatory",
    "Urology & Nephrology",
    "Gynecology & Hormonal",
  ],
  nutritionAndSupplements: [
    "Vitamins, Minerals & Supplements",
    "Electrolytes & IV Fluids",
    "Immunology & Vaccines",
    "Oncology & Antineoplastic",
  ],
};

export const ALL_CATEGORIES = [
  ...PHARMA_CATEGORIES.generalInfectious,
  ...PHARMA_CATEGORIES.systemicTherapies,
  ...PHARMA_CATEGORIES.specialtyClinicals,
  ...PHARMA_CATEGORIES.nutritionAndSupplements,
];

function calculateFefoMeta(expiryDateStr: string): { days: number; status: InventoryBatch["fefoStatus"] } {
  const parsedTime = Date.parse(expiryDateStr);
  const targetDate = isNaN(parsedTime) ? new Date(2027, 11, 31).getTime() : parsedTime;
  const now = Date.now();
  const diffTime = targetDate - now;
  const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  let status: InventoryBatch["fefoStatus"] = "Healthy";
  if (days <= 60) {
    status = "Near Expiry";
  } else if (days <= 180) {
    status = "Priority Out";
  }

  return { days, status };
}

export default function ActiveInventoryLedgerPage() {
  const [ledger, setLedger] = React.useState<InventoryBatch[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [fefoFilter, setFefoFilter] = React.useState("all");

  const [isAddBatchOpen, setIsAddBatchOpen] = React.useState(false);
  const [editingBatch, setEditingBatch] = React.useState<InventoryBatch | null>(null);
  const [stockAdjustTarget, setStockAdjustTarget] = React.useState<InventoryBatch | null>(null);
  const [adjustQty, setAdjustQty] = React.useState("");
  const [adjustType, setAdjustType] = React.useState<"IN" | "OUT">("IN");

  const [formData, setFormData] = React.useState({
    brandName: "",
    genericName: "",
    category: "Analgesic & Antipyretic",
    batchNumber: "",
    mfgDate: "",
    expiryDate: "",
    availableUnits: "",
    unitPrice: "",
    warehouseBin: "",
    storageCondition: "Controlled Ambient (<25°C)" as InventoryBatch["storageCondition"],
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const fetchInventory = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/inventory`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLedger(
            data.map((item: any) => {
              const { days, status } = calculateFefoMeta(item.expiryDate);
              return {
                id: item.id,
                skuCode: item.skuCode,
                brandName: item.brandName,
                genericName: item.genericName,
                category: item.category,
                batchNumber: item.batchNumber,
                mfgDate: item.mfgDate,
                expiryDate: item.expiryDate,
                daysToExpiry: days,
                availableUnits: Number(item.availableUnits) || 0,
                unitPrice: Number(item.unitPrice) || 0,
                warehouseBin: item.warehouseBin,
                storageCondition: item.storageCondition,
                fefoStatus: status,
              };
            })
          );
        }
      }
    } catch (err) {
      console.error("Error loading inventory from backend:", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  React.useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleOpenAdd = () => {
    setEditingBatch(null);
    setFormData({
      brandName: "",
      genericName: "",
      category: "Analgesic & Antipyretic",
      batchNumber: `BX-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      mfgDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      availableUnits: "",
      unitPrice: "",
      warehouseBin: "Bay 01 - Shelf A",
      storageCondition: "Controlled Ambient (<25°C)",
    });
    setIsAddBatchOpen(true);
  };

  const handleOpenEdit = (batch: InventoryBatch) => {
    setEditingBatch(batch);
    setFormData({
      brandName: batch.brandName,
      genericName: batch.genericName,
      category: batch.category,
      batchNumber: batch.batchNumber,
      mfgDate: batch.mfgDate,
      expiryDate: batch.expiryDate,
      availableUnits: String(batch.availableUnits),
      unitPrice: String(batch.unitPrice),
      warehouseBin: batch.warehouseBin,
      storageCondition: batch.storageCondition,
    });
    setIsAddBatchOpen(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      brandName: formData.brandName,
      genericName: formData.genericName,
      category: formData.category,
      batchNumber: formData.batchNumber,
      mfgDate: formData.mfgDate,
      expiryDate: formData.expiryDate,
      availableUnits: Number(formData.availableUnits) || 0,
      unitPrice: Number(formData.unitPrice) || 0,
      warehouseBin: formData.warehouseBin,
      storageCondition: formData.storageCondition,
    };

    try {
      const endpoint = editingBatch ? `${API_URL}/inventory/${editingBatch.id}` : `${API_URL}/inventory`;
      const method = editingBatch ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to persist batch");
      setIsAddBatchOpen(false);
      fetchInventory();
    } catch (err) {
      alert("Error saving batch to server. Please ensure backend is reachable.");
    }
  };

  const handleApplyStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustTarget) return;

    const delta = Number(adjustQty) || 0;
    if (delta <= 0) return;

    try {
      const res = await fetch(`${API_URL}/inventory/${stockAdjustTarget.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: adjustType, quantity: delta }),
      });

      if (!res.ok) throw new Error("Stock adjustment failed");

      setStockAdjustTarget(null);
      setAdjustQty("");
      fetchInventory();
    } catch (err) {
      alert("Failed to adjust inventory units on server.");
    }
  };

  const handleDeleteBatch = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete batch record for "${name}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/inventory/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove batch");
      fetchInventory();
    } catch {
      alert("Failed to delete inventory batch from server.");
    }
  };

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
    XLSX.writeFile(workbook, `AK_Pharma_Inventory_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredLedger = React.useMemo(() => {
    return ledger
      .filter((item) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          item.brandName.toLowerCase().includes(q) ||
          item.genericName.toLowerCase().includes(q) ||
          item.batchNumber.toLowerCase().includes(q) ||
          item.warehouseBin.toLowerCase().includes(q) ||
          item.skuCode.toLowerCase().includes(q);

        const matchesCategory = categoryFilter === "all" || item.category.toLowerCase() === categoryFilter.toLowerCase();
        const matchesFefo = fefoFilter === "all" || item.fefoStatus.toLowerCase() === fefoFilter.toLowerCase();

        return matchesSearch && matchesCategory && matchesFefo;
      })
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  }, [ledger, searchQuery, categoryFilter, fefoFilter]);

  const totalValuation = React.useMemo(
    () => ledger.reduce((acc, curr) => acc + curr.availableUnits * curr.unitPrice, 0),
    [ledger]
  );
  const totalPacks = React.useMemo(
    () => ledger.reduce((acc, curr) => acc + curr.availableUnits, 0),
    [ledger]
  );
  const priorityOutCount = React.useMemo(
    () => ledger.filter((i) => i.fefoStatus === "Priority Out" || i.fefoStatus === "Near Expiry").length,
    [ledger]
  );

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10 text-slate-900 font-sans">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0090FF] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              WAREHOUSE INVENTORY & FEFO CONTROLS
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
            FEFO Stock Control — Active Inventory Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time batch-level First-Expiry, First-Out dispatch, storage bin tracking, and stock adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchInventory}
            className="h-9 gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3 rounded-lg shadow-none"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3.5 rounded-lg shadow-none"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Ledger
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-4 rounded-lg shadow-none"
          >
            <Plus className="h-4 w-4" />
            Receive New Batch
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-200 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Gross Inventory Valuation</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            ৳{totalValuation.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Realized cost baseline across {ledger.length} active batches
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Available Stock Volume</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-800 bg-white border-slate-200 px-2 py-0.5 rounded-md">
              Live Stock
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {totalPacks.toLocaleString("en-IN")} Units
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Stored across active warehouse bays
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">FEFO Priority Dispatch</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {priorityOutCount} Batches
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-3">
            Expiring soonest (Dispatch First Priority)
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cold Chain Integrity</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
              <Snowflake className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            4.2°C Avg
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-3">
            Optimal temperature active
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
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
            <SelectTrigger className="h-8 w-[230px] text-xs bg-white border-slate-200 truncate">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400 shrink-0" />
              <SelectValue placeholder="All Therapeutic Categories" />
            </SelectTrigger>
            <SelectContent className="max-h-[340px] text-xs">
              <SelectItem value="all">All Categories ({ALL_CATEGORIES.length})</SelectItem>
              
              <SelectGroup>
                <SelectLabel className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Infectious Diseases</SelectLabel>
                {PHARMA_CATEGORIES.generalInfectious.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectGroup>

              <SelectGroup>
                <SelectLabel className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Systemic & Chronic</SelectLabel>
                {PHARMA_CATEGORIES.systemicTherapies.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectGroup>

              <SelectGroup>
                <SelectLabel className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Specialty & Organ Specific</SelectLabel>
                {PHARMA_CATEGORIES.specialtyClinicals.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectGroup>

              <SelectGroup>
                <SelectLabel className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Nutrition & Hospital</SelectLabel>
                {PHARMA_CATEGORIES.nutritionAndSupplements.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={fefoFilter} onValueChange={setFefoFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs bg-white border-slate-200">
              <SelectValue placeholder="FEFO Priority" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All FEFO Status</SelectItem>
              <SelectItem value="near expiry">Near Expiry (&le;60d)</SelectItem>
              <SelectItem value="priority out">Priority Out (&le;180d)</SelectItem>
              <SelectItem value="healthy">Healthy Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Active Inventory Table */}
      <Card className="rounded-xl border border-slate-200 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              BATCH INVENTORY LEDGER & STORAGE ALLOCATIONS
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
              <TableHead className="text-xs font-medium text-slate-600">Category</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Batch Code</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Mfg / Expiry</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Storage Location</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Stock (Units)</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Unit Price</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Batch Valuation</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-center">FEFO Order</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-slate-400 text-xs">
                  Loading inventory ledger from database...
                </TableCell>
              </TableRow>
            ) : filteredLedger.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-slate-400 text-xs">
                  No stock batches currently stored. Click <strong>"Receive New Batch"</strong> to log incoming shipments.
                </TableCell>
              </TableRow>
            ) : (
              filteredLedger.map((batch) => (
                <TableRow key={batch.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <TableCell className="py-3 pl-0">
                    <div className="leading-tight">
                      <strong className="text-xs font-bold text-slate-900 block">{batch.brandName}</strong>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono text-slate-500">{batch.skuCode}</span>
                        <span>•</span>
                        <span className="truncate max-w-[160px]">{batch.genericName}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-700">
                    <span className="text-[11px] font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-800 inline-block max-w-[170px] truncate" title={batch.category}>
                      {batch.category}
                    </span>
                  </TableCell>

                  <TableCell className="py-3 text-xs font-mono font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Barcode className="h-3.5 w-3.5 text-slate-400" />
                      <span>{batch.batchNumber}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-700">
                    <div className="leading-tight">
                      <span className="font-mono font-medium text-slate-900 block">Exp: {batch.expiryDate}</span>
                      <span
                        className={`text-[10px] font-semibold ${
                          batch.daysToExpiry <= 60
                            ? "text-rose-600"
                            : batch.daysToExpiry <= 180
                            ? "text-amber-600"
                            : "text-slate-400"
                        }`}
                      >
                        {batch.daysToExpiry} days remaining
                      </span>
                    </div>
                  </TableCell>

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

                  <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>{batch.availableUnits.toLocaleString()}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setStockAdjustTarget(batch);
                          setAdjustType("IN");
                          setAdjustQty("");
                        }}
                        className="h-5 w-5 p-0 text-slate-400 hover:text-emerald-600"
                        title="Adjust Stock (+ / -)"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono text-slate-600">
                    ৳{batch.unitPrice.toFixed(2)}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono font-semibold text-slate-900">
                    ৳
                    {(batch.availableUnits * batch.unitPrice).toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-center">
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

                  <TableCell className="py-3 text-xs text-right pr-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white">
                        <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-wider">
                          Batch Controls
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(batch)}
                          className="text-xs cursor-pointer text-slate-700"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-2 text-slate-500" />
                          Edit Batch Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setStockAdjustTarget(batch);
                            setAdjustType("IN");
                            setAdjustQty("");
                          }}
                          className="text-xs cursor-pointer text-emerald-600"
                        >
                          <ArrowDownRight className="h-3.5 w-3.5 mr-2" />
                          Stock Inward (+)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setStockAdjustTarget(batch);
                            setAdjustType("OUT");
                            setAdjustQty("");
                          }}
                          className="text-xs cursor-pointer text-amber-600"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5 mr-2" />
                          Stock Outward (-)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteBatch(batch.id, batch.brandName)}
                          className="text-xs cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2 text-rose-600" />
                          Delete Batch
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Add / Edit Batch Dialog */}
      <Dialog open={isAddBatchOpen} onOpenChange={setIsAddBatchOpen}>
        <DialogContent className="sm:max-w-[560px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingBatch ? "Edit Batch Details" : "Receive Stock Batch"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Log incoming production or wholesaler consignment with FEFO expiry controls.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBatch} className="space-y-3.5 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Commercial Brand Name *</Label>
                <Input
                  placeholder="e.g. Napa Extra 500mg"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  required
                  className="h-8 text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Generic Composition *</Label>
                <Input
                  placeholder="e.g. Paracetamol + Caffeine"
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  required
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1 col-span-1">
                <Label className="text-xs font-medium text-slate-700">Therapeutic Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-8 text-xs bg-white truncate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] text-xs">
                    <SelectGroup>
                      <SelectLabel className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Infectious Diseases</SelectLabel>
                      {PHARMA_CATEGORIES.generalInfectious.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Systemic & Chronic</SelectLabel>
                      {PHARMA_CATEGORIES.systemicTherapies.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Specialty & Organ Specific</SelectLabel>
                      {PHARMA_CATEGORIES.specialtyClinicals.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Nutrition & Hospital</SelectLabel>
                      {PHARMA_CATEGORIES.nutritionAndSupplements.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Batch Number *</Label>
                <Input
                  placeholder="BX-2026-901"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  required
                  className="h-8 text-xs font-mono font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Expiry Date *</Label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  required
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Available Units *</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={formData.availableUnits}
                  onChange={(e) => setFormData({ ...formData, availableUnits: e.target.value })}
                  required
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Unit Price (৳) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="5.5"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  required
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Warehouse Bin / Shelf Location *</Label>
                <Input
                  placeholder="Bay 02 - Shelf C"
                  value={formData.warehouseBin}
                  onChange={(e) => setFormData({ ...formData, warehouseBin: e.target.value })}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Storage Environment</Label>
                <Select
                  value={formData.storageCondition}
                  onValueChange={(val: any) => setFormData({ ...formData, storageCondition: val })}
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
                {editingBatch ? "Save Changes" : "Confirm Inward Batch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Stock In / Stock Out Quick Adjustment Dialog */}
      <Dialog open={Boolean(stockAdjustTarget)} onOpenChange={(open) => !open && setStockAdjustTarget(null)}>
        <DialogContent className="sm:max-w-[420px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Quick Stock Adjustment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {stockAdjustTarget?.brandName} ({stockAdjustTarget?.batchNumber})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplyStockAdjustment} className="space-y-3.5 py-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500">Current Stock:</span>
              <strong className="font-mono text-sm text-slate-900">
                {stockAdjustTarget?.availableUnits.toLocaleString()} Units
              </strong>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Adjustment Type</Label>
              <Select value={adjustType} onValueChange={(val: any) => setAdjustType(val)}>
                <SelectTrigger className="h-8 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="IN">Stock Inward / Receiving (+)</SelectItem>
                  <SelectItem value="OUT">Stock Outward / Dispatch / Damage (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Adjustment Quantity (Units) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 500"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                required
                className="h-8 font-mono font-bold"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setStockAdjustTarget(null)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                Apply Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}