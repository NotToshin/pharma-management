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
  ShoppingCart,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  CalendarDays,
  Download,
  Upload,
  Printer,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building,
  DollarSign,
  PackageCheck,
  Clock,
  Boxes,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Optimized Print stylesheet for Order Processing / Sales Inventory   */
/* ------------------------------------------------------------------ */
const PRINT_STYLES = `
@page {
  size: A4 landscape;
  margin: 10mm;
}

@media print {
  html,
  body {
    height: auto !important;
    overflow: visible !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body * {
    visibility: hidden !important;
  }

  .print-order-processing-node,
  .print-order-processing-node * {
    visibility: visible !important;
  }

  .print-order-processing-node {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    right: auto !important;
    bottom: auto !important;
    transform: none !important;
    translate: none !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: visible !important;
    display: block !important;
    background: #ffffff !important;
  }

  [data-radix-popper-content-wrapper],
  .print-order-processing-node > button[type="button"][class*="absolute"] {
    display: none !important;
  }

  .print\\:hidden,
  button {
    display: none !important;
  }

  table {
    width: 100% !important;
    border-collapse: collapse !important;
  }

  th, td {
    padding: 6px 8px !important;
    font-size: 10.5px !important;
    border-bottom: 1px solid #cbd5e1 !important;
  }

  tr {
    page-break-inside: avoid;
  }
}
`;

export interface ProcessingInventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: "Tablet / Capsule" | "Syrup / Suspension" | "Injection / Vial" | "Drops / Topical";
  batchNumber: string;
  warehouseLocation: string;
  availableStock: number;
  unitType: "Boxes" | "Strips" | "Bottles" | "Vials";
  allocatedForOrders: number;
  unitPrice: number;
  fulfillmentReadiness: "Ready to Dispatch" | "Allocated" | "Backordered" | "Verifying Stock";
}

const initialProcessingInventory: ProcessingInventoryItem[] = [
  {
    id: "proc-1",
    itemCode: "DRG-1001",
    itemName: "Napa Extra 500mg Tablet",
    category: "Tablet / Capsule",
    batchNumber: "BTH-88219",
    warehouseLocation: "Central Warehouse, Dhaka",
    availableStock: 4500,
    unitType: "Boxes",
    allocatedForOrders: 150,
    unitPrice: 120,
    fulfillmentReadiness: "Ready to Dispatch",
  },
  {
    id: "proc-2",
    itemCode: "DRG-1002",
    itemName: "Ciprocin 500mg Antimicrobial",
    category: "Tablet / Capsule",
    batchNumber: "BTH-77302",
    warehouseLocation: "Central Warehouse, Dhaka",
    availableStock: 1200,
    unitType: "Boxes",
    allocatedForOrders: 50,
    unitPrice: 350,
    fulfillmentReadiness: "Ready to Dispatch",
  },
  {
    id: "proc-3",
    itemCode: "DRG-1003",
    itemName: "Rosuvastatin 10mg Lipid Regulating",
    category: "Tablet / Capsule",
    batchNumber: "BTH-55410",
    warehouseLocation: "Plant 01 Labs (Cold Storage)",
    availableStock: 350,
    unitType: "Boxes",
    allocatedForOrders: 200,
    unitPrice: 650,
    fulfillmentReadiness: "Allocated",
  },
  {
    id: "proc-4",
    itemCode: "DRG-1004",
    itemName: "Fefol-Z Hematinic Syrup",
    category: "Syrup / Suspension",
    batchNumber: "BTH-99124",
    warehouseLocation: "Chittagong Regional Depot",
    availableStock: 80,
    unitType: "Bottles",
    allocatedForOrders: 90,
    unitPrice: 180,
    fulfillmentReadiness: "Backordered",
  },
];

export default function OrderProcessingActiveInventoryPage() {
  const [inventory, setInventory] = React.useState<ProcessingInventoryItem[]>(initialProcessingInventory);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [readinessFilter, setReadinessFilter] = React.useState("all");
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  // Edit State
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<ProcessingInventoryItem | null>(null);

  const [successToast, setSuccessToast] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Form states for adding items under Order Processing
  const [itemName, setItemName] = React.useState("");
  const [itemCode, setItemCode] = React.useState("");
  const [category, setCategory] = React.useState<ProcessingInventoryItem["category"]>("Tablet / Capsule");
  const [batchNumber, setBatchNumber] = React.useState("");
  const [warehouseLocation, setWarehouseLocation] = React.useState("");
  const [availableStock, setAvailableStock] = React.useState("");
  const [unitType, setUnitType] = React.useState<ProcessingInventoryItem["unitType"]>("Boxes");
  const [allocatedForOrders, setAllocatedForOrders] = React.useState("");
  const [unitPrice, setUnitPrice] = React.useState("");
  const [fulfillmentReadiness, setFulfillmentReadiness] = React.useState<ProcessingInventoryItem["fulfillmentReadiness"]>("Ready to Dispatch");

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: ProcessingInventoryItem = {
      id: `proc-${Date.now()}`,
      itemCode: itemCode || `DRG-${Math.floor(4000 + inventory.length + 1)}`,
      itemName,
      category,
      batchNumber: batchNumber || `BTH-${Math.floor(10000 + Math.random() * 90000)}`,
      warehouseLocation: warehouseLocation || "Central Warehouse, Dhaka",
      availableStock: Number(availableStock) || 500,
      unitType,
      allocatedForOrders: Number(allocatedForOrders) || 0,
      unitPrice: Number(unitPrice) || 100,
      fulfillmentReadiness,
    };

    setInventory((prev) => [newItem, ...prev]);
    setItemName("");
    setItemCode("");
    setBatchNumber("");
    setWarehouseLocation("");
    setAvailableStock("");
    setAllocatedForOrders("");
    setUnitPrice("");
    setIsAddOpen(false);
    showNotification(`Added ${newItem.itemName} to order processing inventory.`);
  };

  const handleOpenEdit = (item: ProcessingInventoryItem) => {
    setEditingItem({ ...item });
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setInventory((prev) =>
      prev.map((i) => (i.id === editingItem.id ? editingItem : i))
    );
    setIsEditOpen(false);
    setEditingItem(null);
    showNotification("Order processing inventory updated successfully.");
  };

  const handleDeleteItem = (id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
    showNotification("Item removed from processing ledger.");
  };

  const handleTriggerPrint = () => {
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 60);
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = inventory.map((i) => ({
      "Item Code": i.itemCode,
      "Item Name": i.itemName,
      "Category": i.category,
      "Batch Number": i.batchNumber,
      "Warehouse Location": i.warehouseLocation,
      "Available Stock": i.availableStock,
      "Unit": i.unitType,
      "Allocated for Orders": i.allocatedForOrders,
      "Unit Price (৳)": i.unitPrice,
      "Fulfillment Readiness": i.fulfillmentReadiness,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Order Processing Inventory");
    XLSX.writeFile(workbook, `AK_Pharma_Order_Processing_Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showNotification("Order processing inventory exported to Excel.");
  };

  // Import from Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        const importedItems: ProcessingInventoryItem[] = data.map((row, index) => ({
          id: `imported-${Date.now()}-${index}`,
          itemCode: row["Item Code"] || `DRG-${5000 + index}`,
          itemName: row["Item Name"] || "Pharmaceutical Stock",
          category: (row["Category"] || "Tablet / Capsule") as ProcessingInventoryItem["category"],
          batchNumber: row["Batch Number"] || `BTH-${60000 + index}`,
          warehouseLocation: row["Warehouse Location"] || "Central Warehouse, Dhaka",
          availableStock: Number(row["Available Stock"] || 500),
          unitType: (row["Unit"] || "Boxes") as ProcessingInventoryItem["unitType"],
          allocatedForOrders: Number(row["Allocated for Orders"] || 20),
          unitPrice: Number(row["Unit Price (৳)"] || row["Unit Price"] || 100),
          fulfillmentReadiness: (row["Fulfillment Readiness"] || "Ready to Dispatch") as ProcessingInventoryItem["fulfillmentReadiness"],
        }));

        setInventory((prev) => [...importedItems, ...prev]);
        showNotification(`Successfully imported ${importedItems.length} records.`);
      } catch (err) {
        console.error(err);
        alert("Failed to parse Excel file.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouseLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesReadiness =
      readinessFilter === "all" || item.fulfillmentReadiness.toLowerCase() === readinessFilter.toLowerCase();

    return matchesSearch && matchesReadiness;
  });

  const totalAvailableStock = inventory.reduce((acc, curr) => acc + curr.availableStock, 0);
  const totalAllocated = inventory.reduce((acc, curr) => acc + curr.allocatedForOrders, 0);
  const readyCount = inventory.filter((i) => i.fulfillmentReadiness === "Ready to Dispatch").length;

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-bold print:hidden">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Hidden file input for Excel import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportExcel}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Order Processing — Active Inventory Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stock availability check, order allocation tracking, and dispatch readiness verification.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3 rounded-lg shadow-none"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Excel
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3 rounded-lg shadow-none"
          >
            <Upload className="h-3.5 w-3.5 text-blue-600" />
            Import Excel
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleTriggerPrint}
            className="h-9 gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3 rounded-lg shadow-none"
          >
            <Printer className="h-3.5 w-3.5 text-slate-600" />
            Print Ledger
          </Button>

          {/* Add Item Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none">
                <Plus className="h-4 w-4" />
                Add Stock Allocation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] bg-white rounded-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Add Processing Stock Record</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Register formulation allocations for active sales orders.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddItem} className="space-y-3.5 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Item Name</Label>
                    <Input
                      placeholder="e.g. Napa Extra Tablet"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Item Code</Label>
                    <Input
                      placeholder="e.g. DRG-1001"
                      value={itemCode}
                      onChange={(e) => setItemCode(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Category</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as ProcessingInventoryItem["category"])}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Tablet / Capsule">Tablet / Capsule</SelectItem>
                        <SelectItem value="Syrup / Suspension">Syrup / Suspension</SelectItem>
                        <SelectItem value="Injection / Vial">Injection / Vial</SelectItem>
                        <SelectItem value="Drops / Topical">Drops / Topical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Batch Number</Label>
                    <Input
                      placeholder="e.g. BTH-88219"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Warehouse Location</Label>
                  <Input
                    placeholder="e.g. Central Warehouse, Dhaka"
                    value={warehouseLocation}
                    onChange={(e) => setWarehouseLocation(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Available Stock</Label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={availableStock}
                      onChange={(e) => setAvailableStock(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Unit</Label>
                    <Select value={unitType} onValueChange={(v) => setUnitType(v as ProcessingInventoryItem["unitType"])}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Boxes">Boxes</SelectItem>
                        <SelectItem value="Strips">Strips</SelectItem>
                        <SelectItem value="Bottles">Bottles</SelectItem>
                        <SelectItem value="Vials">Vials</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Allocated</Label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={allocatedForOrders}
                      onChange={(e) => setAllocatedForOrders(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Unit Price (৳)</Label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Readiness Status</Label>
                    <Select value={fulfillmentReadiness} onValueChange={(v) => setFulfillmentReadiness(v as ProcessingInventoryItem["fulfillmentReadiness"])}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Ready to Dispatch">Ready to Dispatch</SelectItem>
                        <SelectItem value="Allocated">Allocated</SelectItem>
                        <SelectItem value="Backordered">Backordered</SelectItem>
                        <SelectItem value="Verifying Stock">Verifying Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                    Save Record
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 print:hidden">
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Available Units</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {totalAvailableStock.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Ready in processing inventory
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Allocated for Orders</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {totalAllocated.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-[#0090FF] font-medium mt-3">
            Reserved for customer shipments
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ready to Dispatch</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {readyCount} SKUs
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-3">
            Fully verified and packed
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pipeline Status</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-md">
              Synchronized
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            Active
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Sales & inventory integrated
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 print:hidden">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search item, code, batch, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={readinessFilter} onValueChange={setReadinessFilter}>
            <SelectTrigger className="h-8 w-[180px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="Filter Readiness" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Readiness States</SelectItem>
              <SelectItem value="ready to dispatch">Ready to Dispatch</SelectItem>
              <SelectItem value="allocated">Allocated</SelectItem>
              <SelectItem value="backordered">Backordered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Order Processing Inventory Ledger Table */}
      <Card className="print-order-processing-node rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              AK PHARMA — ORDER PROCESSING INVENTORY LEDGER
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live stock verification and order allocation status for distribution fulfillment
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium print:hidden">
              Showing {filteredInventory.length} Processing Records
            </span>
            <span className="text-xs text-slate-400 font-mono hidden print:inline">
              Generated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Item Code & Name</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Category & Batch</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Warehouse Location</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Available</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Allocated</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Unit Price</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-center">Readiness Status</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0 print:hidden">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.map((item) => (
              <TableRow key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <TableCell className="py-3 pl-0">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{item.itemName}</span>
                    <span className="font-mono text-[10px] text-[#0090FF] font-semibold block mt-0.5">
                      {item.itemCode}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="py-3 text-xs text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-900 block">{item.category}</span>
                    <span className="font-mono text-[10px] text-slate-400 block">{item.batchNumber}</span>
                  </div>
                </TableCell>

                <TableCell className="py-3 text-xs text-slate-600 max-w-[180px] truncate">
                  {item.warehouseLocation}
                </TableCell>

                <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                  {item.availableStock.toLocaleString("en-IN")} {item.unitType}
                </TableCell>

                <TableCell className="py-3 text-xs text-right font-mono font-semibold text-blue-600">
                  {item.allocatedForOrders.toLocaleString("en-IN")} {item.unitType}
                </TableCell>

                <TableCell className="py-3 text-xs text-right font-mono text-slate-700">
                  ৳{item.unitPrice.toLocaleString("en-IN")}
                </TableCell>

                <TableCell className="py-3 text-xs text-center">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      item.fulfillmentReadiness === "Ready to Dispatch"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : item.fulfillmentReadiness === "Allocated"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                    }`}
                  >
                    {item.fulfillmentReadiness}
                  </Badge>
                </TableCell>

                <TableCell className="py-3 text-xs text-right pr-0 print:hidden">
                  <div className="flex items-center justify-end gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 bg-white">
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(item)}
                          className="text-xs cursor-pointer text-slate-700"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-2 text-slate-500" />
                          Edit Allocation
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-xs cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[520px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Edit Processing Stock Record</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update available inventory or order allocation quantities.
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <form onSubmit={handleSaveEdit} className="space-y-3.5 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Item Name</Label>
                  <Input
                    value={editingItem.itemName}
                    onChange={(e) => setEditingItem({ ...editingItem, itemName: e.target.value })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Item Code</Label>
                  <Input
                    value={editingItem.itemCode}
                    onChange={(e) => setEditingItem({ ...editingItem, itemCode: e.target.value })}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Category</Label>
                  <Select
                    value={editingItem.category}
                    onValueChange={(v) => setEditingItem({ ...editingItem, category: v as ProcessingInventoryItem["category"] })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Tablet / Capsule">Tablet / Capsule</SelectItem>
                      <SelectItem value="Syrup / Suspension">Syrup / Suspension</SelectItem>
                      <SelectItem value="Injection / Vial">Injection / Vial</SelectItem>
                      <SelectItem value="Drops / Topical">Drops / Topical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Batch Number</Label>
                  <Input
                    value={editingItem.batchNumber}
                    onChange={(e) => setEditingItem({ ...editingItem, batchNumber: e.target.value })}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Warehouse Location</Label>
                <Input
                  value={editingItem.warehouseLocation}
                  onChange={(e) => setEditingItem({ ...editingItem, warehouseLocation: e.target.value })}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Available Stock</Label>
                  <Input
                    type="number"
                    value={editingItem.availableStock}
                    onChange={(e) => setEditingItem({ ...editingItem, availableStock: Number(e.target.value) })}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Unit</Label>
                  <Select
                    value={editingItem.unitType}
                    onValueChange={(v) => setEditingItem({ ...editingItem, unitType: v as ProcessingInventoryItem["unitType"] })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Boxes">Boxes</SelectItem>
                      <SelectItem value="Strips">Strips</SelectItem>
                      <SelectItem value="Bottles">Bottles</SelectItem>
                      <SelectItem value="Vials">Vials</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Allocated</Label>
                  <Input
                    type="number"
                    value={editingItem.allocatedForOrders}
                    onChange={(e) => setEditingItem({ ...editingItem, allocatedForOrders: Number(e.target.value) })}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Unit Price (৳)</Label>
                  <Input
                    type="number"
                    value={editingItem.unitPrice}
                    onChange={(e) => setEditingItem({ ...editingItem, unitPrice: Number(e.target.value) })}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Readiness Status</Label>
                  <Select
                    value={editingItem.fulfillmentReadiness}
                    onValueChange={(v) => setEditingItem({ ...editingItem, fulfillmentReadiness: v as ProcessingInventoryItem["fulfillmentReadiness"] })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Ready to Dispatch">Ready to Dispatch</SelectItem>
                      <SelectItem value="Allocated">Allocated</SelectItem>
                      <SelectItem value="Backordered">Backordered</SelectItem>
                      <SelectItem value="Verifying Stock">Verifying Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}