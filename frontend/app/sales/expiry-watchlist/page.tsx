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
  AlertOctagon,
  Calendar,
  CheckCircle2,
  Download,
  Filter,
  MoreHorizontal,
  Pencil,
  Printer,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  Clock,
  ShieldCheck,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Optimized Landscape Print stylesheet for Sales Expiry Watchlist      */
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

  .print-sales-expiry-node,
  .print-sales-expiry-node * {
    visibility: visible !important;
  }

  .print-sales-expiry-node {
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
  .print-sales-expiry-node > button[type="button"][class*="absolute"] {
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

export interface SalesExpiryItem {
  id: string;
  itemCode: string;
  itemName: string;
  batchNumber: string;
  clientChannel: "Pharmacy Network" | "Distributor Hub" | "Institutional" | "Hospital Direct";
  quantity: number;
  unitType: "Boxes" | "Strips" | "Bottles" | "Vials";
  expiryDate: string;
  salesRiskStatus: "Critical Return Risk" | "Watchlist (<60 Days)" | "Clearance Sale Eligible" | "Safe";
  commercialAction: "Recall & Replace" | "Urgent Discount" | "Distributor Swap" | "Standard Distribution";
}

const initialSalesExpiry: SalesExpiryItem[] = [
  {
    id: "sexp-1",
    itemCode: "DRG-1004",
    itemName: "Fefol-Z Hematinic Syrup",
    batchNumber: "BTH-99124",
    clientChannel: "Pharmacy Network",
    quantity: 120,
    unitType: "Bottles",
    expiryDate: "2026-10-05",
    salesRiskStatus: "Critical Return Risk",
    commercialAction: "Recall & Replace",
  },
  {
    id: "sexp-2",
    itemCode: "DRG-1020",
    itemName: "Amoxicillin 250mg Suspension",
    batchNumber: "BTH-44112",
    clientChannel: "Distributor Hub",
    quantity: 450,
    unitType: "Bottles",
    expiryDate: "2026-11-15",
    salesRiskStatus: "Watchlist (<60 Days)",
    commercialAction: "Urgent Discount",
  },
  {
    id: "sexp-3",
    itemCode: "DRG-1088",
    itemName: "Ranitidine 150mg Tablet",
    batchNumber: "BTH-11029",
    clientChannel: "Institutional",
    quantity: 800,
    unitType: "Strips",
    expiryDate: "2026-12-01",
    salesRiskStatus: "Clearance Sale Eligible",
    commercialAction: "Distributor Swap",
  },
];

export default function SalesExpiryWatchlistPage() {
  const [expiryList, setExpiryList] = React.useState<SalesExpiryItem[]>(initialSalesExpiry);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [riskFilter, setRiskFilter] = React.useState("all");

  // Edit State
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<SalesExpiryItem | null>(null);

  const [successToast, setSuccessToast] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleOpenEdit = (item: SalesExpiryItem) => {
    setEditingItem({ ...item });
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setExpiryList((prev) =>
      prev.map((i) => (i.id === editingItem.id ? editingItem : i))
    );
    setIsEditOpen(false);
    setEditingItem(null);
    showNotification("Sales expiry record updated successfully.");
  };

  const handleDeleteItem = (id: string) => {
    setExpiryList((prev) => prev.filter((i) => i.id !== id));
    showNotification("Item removed from sales expiry watchlist.");
  };

  const handleTriggerPrint = () => {
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 60);
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = expiryList.map((i) => ({
      "Item Code": i.itemCode,
      "Item Name": i.itemName,
      "Batch Number": i.batchNumber,
      "Client Channel": i.clientChannel,
      "Quantity": i.quantity,
      "Unit": i.unitType,
      "Expiry Date": i.expiryDate,
      "Sales Risk Status": i.salesRiskStatus,
      "Commercial Action": i.commercialAction,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Expiry Watchlist");
    XLSX.writeFile(workbook, `AK_Pharma_Sales_Expiry_Watchlist_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showNotification("Sales expiry watchlist exported to Excel.");
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

        const importedItems: SalesExpiryItem[] = data.map((row, index) => ({
          id: `imported-${Date.now()}-${index}`,
          itemCode: row["Item Code"] || `DRG-${8000 + index}`,
          itemName: row["Item Name"] || "Formulation Stock",
          batchNumber: row["Batch Number"] || `BTH-${70000 + index}`,
          clientChannel: (row["Client Channel"] || "Pharmacy Network") as SalesExpiryItem["clientChannel"],
          quantity: Number(row["Quantity"] || 100),
          unitType: (row["Unit"] || "Boxes") as SalesExpiryItem["unitType"],
          expiryDate: row["Expiry Date"] || "2026-12-31",
          salesRiskStatus: (row["Sales Risk Status"] || "Watchlist (<60 Days)") as SalesExpiryItem["salesRiskStatus"],
          commercialAction: (row["Commercial Action"] || "Urgent Discount") as SalesExpiryItem["commercialAction"],
        }));

        setExpiryList((prev) => [...importedItems, ...prev]);
        showNotification(`Successfully imported ${importedItems.length} records.`);
      } catch (err) {
        console.error(err);
        alert("Failed to parse Excel file.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filteredExpiryList = expiryList.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientChannel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk =
      riskFilter === "all" || item.salesRiskStatus.toLowerCase().includes(riskFilter.toLowerCase());

    return matchesSearch && matchesRisk;
  });

  const criticalReturnCount = expiryList.filter((i) => i.salesRiskStatus === "Critical Return Risk").length;
  const watchlistCount = expiryList.filter((i) => i.salesRiskStatus === "Watchlist (<60 Days)").length;
  const clearanceCount = expiryList.filter((i) => i.salesRiskStatus === "Clearance Sale Eligible").length;

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
            Order Processing — Sales Expiry Watchlist
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Client channel risk tracking, return prevention protocols, and commercial clearance strategies.
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
            Print Watchlist
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 print:hidden">
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Critical Return Risks</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-rose-600 leading-none">
            {criticalReturnCount} Batches
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-3">
            Immediate recall required
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Sales Watchlist (&lt;60 Days)</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-amber-600 leading-none">
            {watchlistCount} Batches
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-3">
            Channel monitoring active
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Clearance Eligible</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {clearanceCount} Batches
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Eligible for promotional discount
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Commercial Protection</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-md">
              Optimized
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            Active
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Preventing pharmacy return friction
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 print:hidden">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search item, code, batch, or channel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="h-8 w-[190px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="Filter Risk Status" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Risk Statuses</SelectItem>
              <SelectItem value="critical">Critical Return Risk</SelectItem>
              <SelectItem value="watchlist">Watchlist (&lt;60 Days)</SelectItem>
              <SelectItem value="clearance">Clearance Eligible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Sales Expiry Watchlist Table */}
      <Card className="print-sales-expiry-node rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              AK PHARMA — SALES EXPIRY & RISK WATCHLIST
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Client channel stock expiration oversight and commercial action plans
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium print:hidden">
              Showing {filteredExpiryList.length} Watchlist Records
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
              <TableHead className="text-xs font-medium text-slate-600">Batch Number</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Client Channel</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Quantity</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Expiry Date</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-center">Sales Risk Status</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Commercial Action</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0 print:hidden">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpiryList.map((item) => (
              <TableRow key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <TableCell className="py-3 pl-0">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{item.itemName}</span>
                    <span className="font-mono text-[10px] text-[#0090FF] font-semibold block mt-0.5">
                      {item.itemCode}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="py-3 text-xs font-mono text-slate-700">
                  {item.batchNumber}
                </TableCell>

                <TableCell className="py-3 text-xs text-slate-600">
                  {item.clientChannel}
                </TableCell>

                <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                  {item.quantity.toLocaleString("en-IN")} {item.unitType}
                </TableCell>

                <TableCell className="py-3 text-xs font-mono font-semibold text-slate-700 whitespace-nowrap">
                  {item.expiryDate}
                </TableCell>

                <TableCell className="py-3 text-xs text-center">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      item.salesRiskStatus === "Critical Return Risk"
                        ? "text-rose-700 bg-rose-50 border-rose-200"
                        : item.salesRiskStatus === "Watchlist (<60 Days)"
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : item.salesRiskStatus === "Clearance Sale Eligible"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    {item.salesRiskStatus}
                  </Badge>
                </TableCell>

                <TableCell className="py-3 text-xs font-medium text-slate-700">
                  {item.commercialAction}
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
                          Edit Action
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
        <DialogContent className="sm:max-w-[480px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Edit Sales Expiry Protocol</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update commercial risk status or assign clearance actions.
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <form onSubmit={handleSaveEdit} className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Item Name</Label>
                <Input
                  value={editingItem.itemName}
                  onChange={(e) => setEditingItem({ ...editingItem, itemName: e.target.value })}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Batch Number</Label>
                  <Input
                    value={editingItem.batchNumber}
                    onChange={(e) => setEditingItem({ ...editingItem, batchNumber: e.target.value })}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Expiry Date</Label>
                  <Input
                    type="date"
                    value={editingItem.expiryDate}
                    onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Sales Risk Status</Label>
                  <Select
                    value={editingItem.salesRiskStatus}
                    onValueChange={(v) => setEditingItem({ ...editingItem, salesRiskStatus: v as SalesExpiryItem["salesRiskStatus"] })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Critical Return Risk">Critical Return Risk</SelectItem>
                      <SelectItem value="Watchlist (<60 Days)">Watchlist (&lt;60 Days)</SelectItem>
                      <SelectItem value="Clearance Sale Eligible">Clearance Sale Eligible</SelectItem>
                      <SelectItem value="Safe">Safe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Commercial Action</Label>
                  <Select
                    value={editingItem.commercialAction}
                    onValueChange={(v) => setEditingItem({ ...editingItem, commercialAction: v as SalesExpiryItem["commercialAction"] })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Recall & Replace">Recall & Replace</SelectItem>
                      <SelectItem value="Urgent Discount">Urgent Discount</SelectItem>
                      <SelectItem value="Distributor Swap">Distributor Swap</SelectItem>
                      <SelectItem value="Standard Distribution">Standard Distribution</SelectItem>
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