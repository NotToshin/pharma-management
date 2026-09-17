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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  Plus,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Boxes,
  Store,
  DollarSign,
  ArrowDownLeft,
  ShieldCheck,
  Check,
  ShieldAlert,
  Calendar,
  Clock,
  Phone,
  UserCheck,
  Calculator,
  Landmark,
} from "lucide-react";

interface FieldCollectionItem {
  id: string;
  invoiceNo: string;
  chemistName: string;
  proprietor: string;
  phone: string;
  territory: string;
  salesRepName: string;
  totalInvoiceAmount: number;
  previouslyPaid: number;
  currentCollection: number; // Amount collected in this current field run
  realizationStatus: "Full Realization" | "Partial Collection" | "Uncollected";
}

const initialFieldCollections: FieldCollectionItem[] = [
  {
    id: "fc-1",
    invoiceNo: "INV-2026-9021",
    chemistName: "Popular Pharmacy (Dhanmondi)",
    proprietor: "Kazi Motahar Hossain",
    phone: "+880 1711-223344",
    territory: "Dhaka North",
    salesRepName: "Rafiqul Islam (Zone - Dhanmondi)",
    totalInvoiceAmount: 45000,
    previouslyPaid: 10000,
    currentCollection: 35000,
    realizationStatus: "Full Realization",
  },
  {
    id: "fc-2",
    invoiceNo: "INV-2026-9022",
    chemistName: "Labaid Specialized Hospital Chemist",
    proprietor: "Mahbubur Rahman",
    phone: "+880 1819-334455",
    territory: "Dhaka North",
    salesRepName: "Rafiqul Islam (Zone - Dhanmondi)",
    totalInvoiceAmount: 78000,
    previouslyPaid: 0,
    currentCollection: 50000,
    realizationStatus: "Partial Collection",
  },
  {
    id: "fc-3",
    invoiceNo: "INV-2026-9023",
    chemistName: "Medinova Medical Chemist",
    proprietor: "Dr. Ashfaqul Haque",
    phone: "+880 1912-445566",
    territory: "Dhaka South",
    salesRepName: "Tanvir Ahmed (Zone - Gulshan)",
    totalInvoiceAmount: 32000,
    previouslyPaid: 0,
    currentCollection: 32000,
    realizationStatus: "Full Realization",
  },
  {
    id: "fc-4",
    invoiceNo: "INV-2026-9024",
    chemistName: "Chevron Clinical Lab & Pharmacy",
    proprietor: "S. M. Jamaluddin",
    phone: "+880 1613-556677",
    territory: "Chittagong Central",
    salesRepName: "Kamrul Hasan (Zone - Agrabad)",
    totalInvoiceAmount: 54000,
    previouslyPaid: 0,
    currentCollection: 0,
    realizationStatus: "Uncollected",
  },
];

export default function SalesRepCashCollectionPage() {
  const [collections, setCollections] = React.useState<FieldCollectionItem[]>(initialFieldCollections);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [repFilter, setRepFilter] = React.useState("all");

  // Active Rep Session State
  const [selectedRep, setSelectedRep] = React.useState("Rafiqul Islam (Zone - Dhanmondi)");
  const [isSettlementOpen, setIsSettlementOpen] = React.useState(false);
  const [targetBank, setTargetBank] = React.useState("Eastern Bank PLC (Corporate Ops)");
  const [discrepancyAction, setDiscrepancyAction] = React.useState<"Payroll Deduction" | "Management Waiver" | "Rep Suspense Account">("Payroll Deduction");
  const [managerPin, setManagerPin] = React.useState("");
  const [sessionStatus, setSessionStatus] = React.useState<"Open" | "Pending Reconciliation" | "Locked & Posted">("Open");

  // Currency Denomination Counter States
  const [note1000, setNote1000] = React.useState<number>(80);
  const [note500, setNote500] = React.useState<number>(35);
  const [note100, setNote100] = React.useState<number>(80);
  const [note50, setNote50] = React.useState<number>(20);
  const [note20, setNote20] = React.useState<number>(10);
  const [note10, setNote10] = React.useState<number>(10);

  // Filter collections for active rep
  const repCollections = collections.filter((item) => item.salesRepName === selectedRep);

  // Calculations
  const expectedCash = repCollections.reduce((sum, item) => sum + item.currentCollection, 0);
  
  const physicalCountedCash =
    note1000 * 1000 +
    note500 * 500 +
    note100 * 100 +
    note50 * 50 +
    note20 * 20 +
    note10 * 10;

  const discrepancy = physicalCountedCash - expectedCash; // Negative = Shortage, Positive = Overage

  const handleUpdateCollectionAmount = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setCollections((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const remainingDue = item.totalInvoiceAmount - item.previouslyPaid;
          const validCollection = Math.min(num, remainingDue);
          const status =
            validCollection >= remainingDue
              ? "Full Realization"
              : validCollection > 0
              ? "Partial Collection"
              : "Uncollected";
          return {
            ...item,
            currentCollection: validCollection,
            realizationStatus: status,
          };
        }
        return item;
      })
    );
  };

  const handleFinalSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (discrepancy !== 0 && !managerPin) {
      alert("Discrepancy detected between expected collections and physical currency count. Manager override PIN required.");
      return;
    }

    setSessionStatus("Locked & Posted");
    setIsSettlementOpen(false);
    alert(`Success! ৳${physicalCountedCash.toLocaleString("en-IN")} deposited into ${targetBank} and posted to Bank & Cash Ledger.`);
  };

  const handleExportExcel = () => {
    const exportData = collections.map((c) => ({
      "Invoice No": c.invoiceNo,
      "Chemist Name": c.chemistName,
      Proprietor: c.proprietor,
      Contact: c.phone,
      Territory: c.territory,
      "Sales Rep": c.salesRepName,
      "Total Invoice (৳)": c.totalInvoiceAmount,
      "Collected This Run (৳)": c.currentCollection,
      "Realization Status": c.realizationStatus,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Rep Cash Realization");
    XLSX.writeFile(workbook, `AK_Pharma_SalesRep_Realization_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredCollections = collections.filter((item) => {
    const matchesSearch =
      item.chemistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.salesRepName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRep =
      repFilter === "all" || item.salesRepName.toLowerCase() === repFilter.toLowerCase();

    return matchesSearch && matchesRep;
  });

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-16 font-sans text-neutral-900">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-neutral-200 p-5 rounded-lg shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-500 font-bold">
              Field Sales & Treasury Node • Sales Rep Cash Realization
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Sales Rep Cash Collection & Drawer Reconciliation
          </h1>
          <p className="text-xs text-neutral-500">
            Log physical cash brought back by sales reps from field visits, count currency notes, and auto-post to the Account Ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-8 text-xs font-medium border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-md gap-1"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" /> Export Sheet
          </Button>

          <Button
            size="sm"
            onClick={() => setIsSettlementOpen(true)}
            className="h-8 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-md shadow-none gap-1.5"
          >
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Count Notes & Settle Drawer
          </Button>
        </div>
      </div>

      {/* 2. Rep Session Reconciliation Ribbon & Currency Counter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Session Selector & Summary */}
        <div className="bg-white border border-neutral-200 p-5 rounded-lg space-y-4 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 block">Active Sales Rep Session</span>
            <Select value={selectedRep} onValueChange={setSelectedRep}>
              <SelectTrigger className="h-9 w-full text-xs font-bold bg-white border-neutral-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="Rafiqul Islam (Zone - Dhanmondi)">Rafiqul Islam (Zone - Dhanmondi)</SelectItem>
                <SelectItem value="Tanvir Ahmed (Zone - Gulshan)">Tanvir Ahmed (Zone - Gulshan)</SelectItem>
                <SelectItem value="Kamrul Hasan (Zone - Agrabad)">Kamrul Hasan (Zone - Agrabad)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-3 border-t border-neutral-100 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">Session Status:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                sessionStatus === "Locked & Posted" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                sessionStatus === "Pending Reconciliation" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                {sessionStatus}
              </span>
            </div>

            <div className="bg-neutral-50 p-3 rounded-md space-y-2 border border-neutral-200 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-sans">Expected Collections:</span>
                <span className="font-bold">৳{expectedCash.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-sans">Physical Counted Cash:</span>
                <span className="font-bold text-emerald-700">৳{physicalCountedCash.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-200 font-bold">
                <span className="font-sans">Discrepancy:</span>
                <span className={discrepancy < 0 ? "text-rose-600" : discrepancy > 0 ? "text-blue-600" : "text-emerald-600"}>
                  {discrepancy < 0 ? `-৳${Math.abs(discrepancy)} (Short)` : discrepancy > 0 ? `+৳${discrepancy} (Over)` : "৳0 (Balanced)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Physical Note Denomination Counter */}
        <div className="bg-white border border-neutral-200 p-5 rounded-lg space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[#0090FF]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Physical Currency Denomination Counter
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              Total Counted: ৳{physicalCountedCash.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-[11px] text-neutral-600">1000৳ Notes</Label>
              <Input
                type="number"
                value={note1000}
                onChange={(e) => setNote1000(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-neutral-600">500৳ Notes</Label>
              <Input
                type="number"
                value={note500}
                onChange={(e) => setNote500(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-neutral-600">100৳ Notes</Label>
              <Input
                type="number"
                value={note100}
                onChange={(e) => setNote100(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-neutral-600">50৳ Notes</Label>
              <Input
                type="number"
                value={note50}
                onChange={(e) => setNote50(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-neutral-600">20৳ Notes</Label>
              <Input
                type="number"
                value={note20}
                onChange={(e) => setNote20(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-neutral-600">10৳ Notes / Coins</Label>
              <Input
                type="number"
                value={note10}
                onChange={(e) => setNote10(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        </div>

      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-neutral-200 p-3 rounded-lg">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <Input
            placeholder="Search chemist, invoice #, or sales rep..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-neutral-200 bg-neutral-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={repFilter} onValueChange={setRepFilter}>
            <SelectTrigger className="h-8 w-[240px] text-xs bg-white border-neutral-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-neutral-400" />
              <SelectValue placeholder="All Sales Reps" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Sales Representatives</SelectItem>
              <SelectItem value="rafiqul islam">Rafiqul Islam (Zone - Dhanmondi)</SelectItem>
              <SelectItem value="tanvir ahmed">Tanvir Ahmed (Zone - Gulshan)</SelectItem>
              <SelectItem value="kamrul hasan">Kamrul Hasan (Zone - Agrabad)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Field Collections Entry Table */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Chemist Invoices & Cash Realization Entry
            </h3>
            <p className="text-xs text-neutral-500">Enter the exact cash amount collected by the sales rep from each chemist outlet</p>
          </div>
          <span className="text-xs text-neutral-500 font-mono font-medium">
            Showing {filteredCollections.length} Records
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-neutral-200 text-xs text-neutral-600 font-bold">
              <TableHead className="pl-0">Invoice & Chemist Name</TableHead>
              <TableHead>Proprietor & Contact</TableHead>
              <TableHead>Sales Representative</TableHead>
              <TableHead className="text-right">Total Invoice (৳)</TableHead>
              <TableHead className="text-right">Previously Paid (৳)</TableHead>
              <TableHead className="text-right">Collection This Run (৳)</TableHead>
              <TableHead className="text-right pr-0">Realization Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCollections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-neutral-400 text-xs">
                  No collection records found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredCollections.map((item) => {
                const remainingDue = item.totalInvoiceAmount - item.previouslyPaid;
                return (
                  <TableRow key={item.id} className="border-b border-neutral-100 text-xs hover:bg-neutral-50">
                    <TableCell className="py-3.5 pl-0">
                      <span className="font-bold block text-neutral-900">{item.chemistName}</span>
                      <span className="font-mono text-[10px] text-blue-600">{item.invoiceNo} • {item.territory}</span>
                    </TableCell>

                    <TableCell className="py-3.5">
                      <span className="font-medium text-neutral-800 block">{item.proprietor}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{item.phone}</span>
                    </TableCell>

                    <TableCell className="py-3.5 text-neutral-700">
                      <div className="flex items-center gap-1.5 font-medium">
                        <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                        <span>{item.salesRepName}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 text-right font-mono text-neutral-600">
                      ৳{item.totalInvoiceAmount.toLocaleString("en-IN")}
                    </TableCell>

                    <TableCell className="py-3.5 text-right font-mono text-emerald-700 font-medium">
                      ৳{item.previouslyPaid.toLocaleString("en-IN")}
                    </TableCell>

                    {/* Editable Input for Cash Collected in this Run */}
                    <TableCell className="py-3.5 text-right font-mono">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-neutral-400">৳</span>
                        <Input
                          type="number"
                          value={item.currentCollection}
                          onChange={(e) => handleUpdateCollectionAmount(item.id, e.target.value)}
                          max={remainingDue}
                          className="h-7 w-28 text-xs font-mono font-bold text-right bg-white border-neutral-300"
                        />
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 text-right pr-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.realizationStatus === "Full Realization" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        item.realizationStatus === "Partial Collection" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        "bg-neutral-100 text-neutral-600 border border-neutral-200"
                      }`}>
                        {item.realizationStatus}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Settlement & Bank Deposit Routing Modal */}
      <Dialog open={isSettlementOpen} onOpenChange={setIsSettlementOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Settle Drawer & Post to Bank Ledger</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select destination bank account and lock reconciliation for {selectedRep}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFinalSettlement} className="space-y-4 py-2 text-xs">
            
            {/* Target Bank Deposit Routing */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Deposit Into Corporate Bank Account / Vault</Label>
              <Select value={targetBank} onValueChange={setTargetBank}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="Eastern Bank PLC (Corporate Ops)">Eastern Bank PLC (Corporate Ops)</SelectItem>
                  <SelectItem value="Islami Bank Bangladesh PLC (Wholesale)">Islami Bank Bangladesh PLC (Wholesale)</SelectItem>
                  <SelectItem value="Standard Chartered Bank (LC Escrow)">Standard Chartered Bank (LC Escrow)</SelectItem>
                  <SelectItem value="Central Vault Petty Cash">Central Vault Petty Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-neutral-50 p-3 rounded-md space-y-1 border border-neutral-200">
              <div className="flex justify-between">
                <span className="text-neutral-500">Expected Collections:</span>
                <span className="font-mono font-bold">৳{expectedCash.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Physical Counted Cash:</span>
                <span className="font-mono font-bold text-emerald-700">৳{physicalCountedCash.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-200 font-bold">
                <span>Discrepancy:</span>
                <span className={`font-mono ${discrepancy !== 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {discrepancy !== 0 ? `৳${discrepancy}` : "৳0 (Balanced)"}
                </span>
              </div>
            </div>

            {discrepancy !== 0 && (
              <div className="space-y-2.5 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" /> Discrepancy Resolution Protocol Required
                </div>
                
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-rose-900">Select Resolution Action:</Label>
                  <Select value={discrepancyAction} onValueChange={(v: any) => setDiscrepancyAction(v)}>
                    <SelectTrigger className="h-7 text-xs bg-white border-rose-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Payroll Deduction">Deduct Shortage from Rep's Next Payroll</SelectItem>
                      <SelectItem value="Management Waiver">Waive Shortage via Management Approval</SelectItem>
                      <SelectItem value="Rep Suspense Account">Transfer Shortage to Rep Suspense Ledger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 pt-1">
                  <Label className="text-[11px] font-medium text-rose-900">Manager Override PIN:</Label>
                  <Input
                    type="password"
                    placeholder="Enter PIN to authorize"
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value)}
                    required
                    className="h-7 text-xs bg-white border-rose-300 font-mono"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSettlementOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" className="h-8 text-xs bg-neutral-900 hover:bg-neutral-800 text-white font-bold">
                Lock Drawer & Post to Bank Ledger
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}