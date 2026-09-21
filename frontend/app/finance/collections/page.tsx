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
  Receipt,
  Plus,
  Download,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarDays,
  Store,
  CreditCard,
  Banknote,
  MoreHorizontal,
  Phone,
  ShieldAlert,
} from "lucide-react";

interface CollectionRecord {
  id: string;
  invoiceNo: string;
  pharmacyName: string;
  proprietor: string;
  phone: string;
  territory: string;
  assignedMio: string;
  invoiceAmount: number;
  paidAmount: number;
  dueAmount: number;
  invoiceDate: string;
  dueDate: string;
  agingBracket: "<30 Days" | "31-60 Days" | "61-90 Days" | ">90 Days (Overdue)";
  status: "Fully Paid" | "Partial Payment" | "Unpaid" | "In Clearance";
  lastPaymentMethod?: string;
}

const initialCollections: CollectionRecord[] = [
  {
    id: "col-1",
    invoiceNo: "INV-2026-9011",
    pharmacyName: "Popular Pharmacy (Dhanmondi)",
    proprietor: "Kazi Motahar Hossain",
    phone: "+880 1711-223344",
    territory: "Dhaka North",
    assignedMio: "Rafiqul Islam",
    invoiceAmount: 180000,
    paidAmount: 140000,
    dueAmount: 40000,
    invoiceDate: "10 Aug 2026",
    dueDate: "10 Sep 2026",
    agingBracket: "31-60 Days",
    status: "Partial Payment",
    lastPaymentMethod: "BEFTN (Eastern Bank)",
  },
  {
    id: "col-2",
    invoiceNo: "INV-2026-9012",
    pharmacyName: "Labaid In-House Chemist (Uttara)",
    proprietor: "Mahbubur Rahman",
    phone: "+880 1819-334455",
    territory: "Dhaka North",
    assignedMio: "Rafiqul Islam",
    invoiceAmount: 240000,
    paidAmount: 240000,
    dueAmount: 0,
    invoiceDate: "20 Aug 2026",
    dueDate: "20 Sep 2026",
    agingBracket: "<30 Days",
    status: "Fully Paid",
    lastPaymentMethod: "Account Payee Cheque",
  },
  {
    id: "col-3",
    invoiceNo: "INV-2026-9013",
    pharmacyName: "Medinova Chemist Corner",
    proprietor: "Dr. Ashfaqul Haque",
    phone: "+880 1912-445566",
    territory: "Dhaka South",
    assignedMio: "Tanvir Ahmed",
    invoiceAmount: 115000,
    paidAmount: 0,
    dueAmount: 115000,
    invoiceDate: "12 Jul 2026",
    dueDate: "12 Aug 2026",
    agingBracket: "61-90 Days",
    status: "Unpaid",
  },
  {
    id: "col-4",
    invoiceNo: "INV-2026-9014",
    pharmacyName: "Chevron Model Drug House",
    proprietor: "S. M. Jamaluddin",
    phone: "+880 1613-556677",
    territory: "Chittagong Central",
    assignedMio: "Kamrul Hasan",
    invoiceAmount: 165000,
    paidAmount: 100000,
    dueAmount: 65000,
    invoiceDate: "05 Jun 2026",
    dueDate: "05 Jul 2026",
    agingBracket: ">90 Days (Overdue)",
    status: "Partial Payment",
    lastPaymentMethod: "Cash Collection",
  },
  {
    id: "col-5",
    invoiceNo: "INV-2026-9015",
    pharmacyName: "Ibn Sina Pharma Outlet (Sylhet)",
    proprietor: "A. K. M. Shamsuddin",
    phone: "+880 1715-667788",
    territory: "Sylhet Sadar",
    assignedMio: "Enamul Haque",
    invoiceAmount: 195000,
    paidAmount: 130000,
    dueAmount: 65000,
    invoiceDate: "02 Sep 2026",
    dueDate: "02 Oct 2026",
    agingBracket: "<30 Days",
    status: "In Clearance",
    lastPaymentMethod: "Cheque in Transit (IBBL)",
  },
  {
    id: "col-6",
    invoiceNo: "INV-2026-9016",
    pharmacyName: "Apollo Medical Hall (Rajshahi)",
    proprietor: "Shahidul Alam",
    phone: "+880 1518-778899",
    territory: "Rajshahi Metro",
    assignedMio: "Sabbir Hossain",
    invoiceAmount: 85000,
    paidAmount: 0,
    dueAmount: 85000,
    invoiceDate: "15 Jun 2026",
    dueDate: "15 Jul 2026",
    agingBracket: ">90 Days (Overdue)",
    status: "Unpaid",
  },
];

export default function CollectionsPage() {
  const [collections, setCollections] = React.useState<CollectionRecord[]>(initialCollections);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [agingFilter, setAgingFilter] = React.useState("all");
  const [territoryFilter, setTerritoryFilter] = React.useState("all");

  // Record Collection Modal States
  const [isRecordOpen, setIsRecordOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState(initialCollections[0].invoiceNo);
  const [collectionAmount, setCollectionAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("BEFTN / RTGS");
  const [bankAccount, setBankAccount] = React.useState("Eastern Bank PLC");
  const [instrumentRef, setInstrumentRef] = React.useState("");

  const handlePostCollection = (e: React.FormEvent) => {
    e.preventDefault();
    const payNum = parseFloat(collectionAmount) || 0;
    if (payNum <= 0) return;

    setCollections((prev) =>
      prev.map((item) => {
        if (item.invoiceNo === selectedInvoice) {
          const newPaid = item.paidAmount + payNum;
          const newDue = Math.max(0, item.invoiceAmount - newPaid);
          const newStatus: CollectionRecord["status"] =
            newDue === 0 ? "Fully Paid" : "Partial Payment";

          return {
            ...item,
            paidAmount: newPaid,
            dueAmount: newDue,
            status: newStatus,
            lastPaymentMethod: `${paymentMethod} (${bankAccount})`,
          };
        }
        return item;
      })
    );

    setCollectionAmount("");
    setInstrumentRef("");
    setIsRecordOpen(false);
  };

  const handleExportExcel = () => {
    const exportRows = collections.map((item) => ({
      "Invoice Number": item.invoiceNo,
      "Pharmacy / Client": item.pharmacyName,
      Proprietor: item.proprietor,
      Contact: item.phone,
      Territory: item.territory,
      "Assigned MIO": item.assignedMio,
      "Invoice Value (৳)": item.invoiceAmount,
      "Paid Realized (৳)": item.paidAmount,
      "Outstanding Dues (৳)": item.dueAmount,
      "Billing Date": item.invoiceDate,
      "Maturity Date": item.dueDate,
      "Aging Bracket": item.agingBracket,
      "Collection Status": item.status,
      "Last Payment Channel": item.lastPaymentMethod || "None",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accounts Receivable");
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Collections_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const filteredCollections = collections.filter((item) => {
    const matchesSearch =
      item.pharmacyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.proprietor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assignedMio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.territory.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAging =
      agingFilter === "all" || item.agingBracket.toLowerCase() === agingFilter.toLowerCase();

    const matchesTerritory =
      territoryFilter === "all" || item.territory.toLowerCase() === territoryFilter.toLowerCase();

    return matchesSearch && matchesAging && matchesTerritory;
  });

  // KPI Computations
  const totalBilled = collections.reduce((acc, curr) => acc + curr.invoiceAmount, 0);
  const totalCollected = collections.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalOutstanding = collections.reduce((acc, curr) => acc + curr.dueAmount, 0);
  const recoveryRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
  const overdueDebt = collections
    .filter((c) => c.agingBracket === ">90 Days (Overdue)")
    .reduce((acc, curr) => acc + curr.dueAmount, 0);

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Collections & Accounts Receivable (A/R)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pharmacy credit tracking, aging maturity schedules, recovery rates, and settlement receipts.
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
            Export A/R Ledger
          </Button>

          {/* Record Collection Modal */}
          <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none">
                <Plus className="h-4 w-4" />
                Record Collection
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Record Pharmacy Collection</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Post cash, cheque, or electronic payment against outstanding invoice receivables.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handlePostCollection} className="space-y-3.5 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-select" className="text-xs font-medium text-slate-700">Target Invoice & Pharmacy</Label>
                  <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[260px] text-xs">
                      {collections
                        .filter((c) => c.dueAmount > 0)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.invoiceNo}>
                            {c.invoiceNo} — {c.pharmacyName} (Due: ৳{c.dueAmount.toLocaleString("en-IN")})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-xs font-medium text-slate-700">Collected Amount (৳)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="50000"
                      value={collectionAmount}
                      onChange={(e) => setCollectionAmount(e.target.value)}
                      required
                      className="h-8 text-xs font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="method" className="text-xs font-medium text-slate-700">Payment Channel</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="BEFTN / RTGS">BEFTN / RTGS</SelectItem>
                        <SelectItem value="Account Payee Cheque">Account Payee Cheque</SelectItem>
                        <SelectItem value="Cash Realization">Cash Realization</SelectItem>
                        <SelectItem value="bKash / Nagad Corporate MFS">bKash / Nagad Corporate MFS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bank" className="text-xs font-medium text-slate-700">Deposit Into Bank</Label>
                    <Select value={bankAccount} onValueChange={setBankAccount}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Eastern Bank PLC">Eastern Bank PLC</SelectItem>
                        <SelectItem value="Islami Bank Bangladesh PLC">Islami Bank Bangladesh PLC</SelectItem>
                        <SelectItem value="Standard Chartered Bank">Standard Chartered Bank</SelectItem>
                        <SelectItem value="BRAC Bank PLC">BRAC Bank PLC</SelectItem>
                        <SelectItem value="Central Vault Petty Cash">Central Vault Petty Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inst-ref" className="text-xs font-medium text-slate-700">Cheque / TX Reference #</Label>
                    <Input
                      id="inst-ref"
                      placeholder="e.g. CQ-992014"
                      value={instrumentRef}
                      onChange={(e) => setInstrumentRef(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsRecordOpen(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                    Apply Payment
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
            <span className="text-xs font-medium text-slate-500">Gross Billed Receivables</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            ৳{totalBilled.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Across {collections.length} commercial retail invoices
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Collected Realized</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            ৳{totalCollected.toLocaleString("en-IN")}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span>{recoveryRate}% Collection Efficiency</span>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Outstanding Invoices (A/R)</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            ৳{totalOutstanding.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Active credit floating with chemists
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Critical Overdue (&gt;90 Days)</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono text-rose-600">
            ৳{overdueDebt.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-3">
            Requires field recovery intervention
          </p>
        </Card>
      </div>

      {/* 3. Search & Aging Bracket Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search pharmacy, invoice #, proprietor, or MIO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={agingFilter} onValueChange={setAgingFilter}>
            <SelectTrigger className="h-8 w-[170px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="All Aging Brackets" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Aging Brackets</SelectItem>
              <SelectItem value="<30 days">&lt;30 Days (Current)</SelectItem>
              <SelectItem value="31-60 days">31-60 Days</SelectItem>
              <SelectItem value="61-90 days">61-90 Days</SelectItem>
              <SelectItem value=">90 days (overdue)">&gt;90 Days (Overdue)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs bg-white border-slate-200">
              <SelectValue placeholder="All Territories" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Territories</SelectItem>
              <SelectItem value="dhaka north">Dhaka North</SelectItem>
              <SelectItem value="dhaka south">Dhaka South</SelectItem>
              <SelectItem value="chittagong central">Chittagong Central</SelectItem>
              <SelectItem value="sylhet sadar">Sylhet Sadar</SelectItem>
              <SelectItem value="rajshahi metro">Rajshahi Metro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Accounts Receivable Ledger Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              PHARMACY CREDIT & AGING MATURITY REGISTER
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed tracking of billed invoices, settled receipts, and outstanding dues per chemist
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredCollections.length} Accounts
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Invoice / Pharmacy</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Proprietor & Contact</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Territory / MIO</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Maturity Date</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Invoice Value</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Paid</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Balance Due</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Aging Bracket</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCollections.map((col) => (
              <TableRow key={col.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                {/* Invoice No & Pharmacy Name */}
                <TableCell className="py-3 pl-0">
                  <div className="leading-tight">
                    <span className="text-xs font-bold text-slate-900 block">{col.pharmacyName}</span>
                    <span className="text-[10px] font-mono text-[#0090FF] mt-0.5 block">{col.invoiceNo}</span>
                  </div>
                </TableCell>

                {/* Proprietor & Phone */}
                <TableCell className="py-3 text-xs text-slate-700">
                  <div>
                    <span className="font-medium text-slate-900 block">{col.proprietor}</span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      <Phone className="h-2.5 w-2.5 text-slate-400" />
                      <span>{col.phone}</span>
                    </div>
                  </div>
                </TableCell>

                {/* Territory / MIO */}
                <TableCell className="py-3 text-xs text-slate-600">
                  <div>
                    <span className="font-medium text-slate-800 block">{col.territory}</span>
                    <span className="text-[10px] text-slate-400">MIO: {col.assignedMio}</span>
                  </div>
                </TableCell>

                {/* Maturity Due Date */}
                <TableCell className="py-3 text-xs font-mono text-slate-600">
                  {col.dueDate}
                </TableCell>

                {/* Total Invoice Value */}
                <TableCell className="py-3 text-xs text-right font-mono text-slate-600">
                  ৳{col.invoiceAmount.toLocaleString("en-IN")}
                </TableCell>

                {/* Paid Amount */}
                <TableCell className="py-3 text-xs text-right font-mono font-semibold text-emerald-600">
                  ৳{col.paidAmount.toLocaleString("en-IN")}
                </TableCell>

                {/* Balance Due */}
                <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                  {col.dueAmount > 0 ? (
                    <span className={col.agingBracket === ">90 Days (Overdue)" ? "text-rose-600" : ""}>
                      ৳{col.dueAmount.toLocaleString("en-IN")}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">৳0</span>
                  )}
                </TableCell>

                {/* Aging Bracket */}
                <TableCell className="py-3 text-xs">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      col.agingBracket === "<30 Days"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : col.agingBracket === "31-60 Days"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : col.agingBracket === "61-90 Days"
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-rose-700 bg-rose-50 border-rose-200"
                    }`}
                  >
                    {col.agingBracket}
                  </Badge>
                </TableCell>

                {/* Settlement Status */}
                <TableCell className="py-3 text-xs text-right pr-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      col.status === "Fully Paid"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : col.status === "Partial Payment"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : col.status === "In Clearance"
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-rose-700 bg-rose-50 border-rose-200"
                    }`}
                  >
                    {col.status}
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