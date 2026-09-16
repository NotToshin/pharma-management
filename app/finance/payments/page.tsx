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
  Printer,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Receipt,
  MoreHorizontal,
  Plus,
  Pencil,
  FileText,
  Check,
  Building2,
  ShieldCheck,
  AlertCircle,
  X,
  CreditCard,
} from "lucide-react";

export interface PaymentVoucher {
  id: string;
  voucherNo: string;
  payeeName: string;
  vendorTin: string;
  category: string;
  disbursingBank: string;
  disbursingAccount: string;
  invoiceRef: string;
  poRef: string;
  grossAmount: number;
  tdsRate: number; // Percentage
  vdsRate: number; // Percentage
  netAmount: number;
  paymentMethod: string;
  instrumentRef: string;
  executionDate: string;
  stage: "Settled & Disbursed" | "Awaiting MD Signoff" | "Scheduled Clearing" | "Compliance Hold";
  makerName: string;
  checkerName: string;
  narration: string;
}

// Helper to convert number to Bangladeshi Taka words
function numberToWordsBDT(num: number): string {
  if (num === 0) return "Zero Taka Only";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lac" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  }

  return inWords(Math.floor(num)).trim() + " Taka Only";
}

const initialVouchers: PaymentVoucher[] = [
  {
    id: "pv-1",
    voucherNo: "AKP-PV-2026-0901",
    payeeName: "Square Raw Pharma Ingredients Ltd.",
    vendorTin: "TIN-9948-2841-002",
    category: "Active Pharmaceutical Ingredients (API)",
    disbursingBank: "Standard Chartered Bank",
    disbursingAccount: "01-8849201-01",
    invoiceRef: "API-SQ-88910",
    poRef: "PO-2026-0814",
    grossAmount: 420000,
    tdsRate: 5,
    vdsRate: 7.5,
    netAmount: 367500,
    paymentMethod: "RTGS Real-Time Settlement",
    instrumentRef: "RTGS-SCB-99021",
    executionDate: "16 Sep 2026",
    stage: "Settled & Disbursed",
    makerName: "K. R. Mahmud (Accounts)",
    checkerName: "Toshin Bin Azad (Admin Head)",
    narration: "Commercial release for 500kg Ciprofloxacin USP grade bulk API lot with certified Certificate of Analysis (CoA).",
  },
  {
    id: "pv-2",
    voucherNo: "AKP-PV-2026-0902",
    payeeName: "Bengal Pack & Print Solutions",
    vendorTin: "TIN-8821-4902-119",
    category: "Primary & Secondary Packaging",
    disbursingBank: "Islami Bank Bangladesh PLC",
    disbursingAccount: "205-019-338104",
    invoiceRef: "BP-2026-773",
    poRef: "PO-2026-0842",
    grossAmount: 175000,
    tdsRate: 4,
    vdsRate: 5,
    netAmount: 159250,
    paymentMethod: "Account Payee Crossed Cheque",
    instrumentRef: "CQ-339014",
    executionDate: "18 Sep 2026",
    stage: "Scheduled Clearing",
    makerName: "K. R. Mahmud (Accounts)",
    checkerName: "Pending Executive Counter-Sign",
    narration: "Supply of 120,000 unit pharmaceutical blister aluminum foils with calibrated anti-counterfeit thermal stamping.",
  },
  {
    id: "pv-3",
    voucherNo: "AKP-PV-2026-0903",
    payeeName: "Directorate General of Drug Administration (DGDA)",
    vendorTin: "STATUTORY-GOV-BD",
    category: "Statutory Regulatory & DGDA",
    disbursingBank: "Eastern Bank PLC",
    disbursingAccount: "104-102-994821",
    invoiceRef: "DGDA-CH-2026-9",
    poRef: "STAT-LIC-991",
    grossAmount: 85000,
    tdsRate: 0,
    vdsRate: 0,
    netAmount: 85000,
    paymentMethod: "BEFTN / NPSB Electronic Clearing",
    instrumentRef: "TREASURY-CHAL-091",
    executionDate: "15 Sep 2026",
    stage: "Settled & Disbursed",
    makerName: "Dr. Sumaiya Akhtar (QA)",
    checkerName: "Toshin Bin Azad (Admin Head)",
    narration: "Statutory formulation renewal and GMP secondary cleanroom inspection fee under government treasury code.",
  },
  {
    id: "pv-4",
    voucherNo: "AKP-PV-2026-0904",
    payeeName: "Dhaka North Field Force Consolidated Pool",
    vendorTin: "INTERNAL-STAFF-DISB",
    category: "Field Force DA/TA & Conveyance",
    disbursingBank: "Eastern Bank PLC",
    disbursingAccount: "104-102-994821",
    invoiceRef: "EXP-DHK-N-09",
    poRef: "DCR-TOUR-WK2",
    grossAmount: 38400,
    tdsRate: 0,
    vdsRate: 0,
    netAmount: 38400,
    paymentMethod: "BEFTN / NPSB Electronic Clearing",
    instrumentRef: "EBL-BATCH-SAL-98",
    executionDate: "16 Sep 2026",
    stage: "Settled & Disbursed",
    makerName: "Nazmul Huda (RSM Central)",
    checkerName: "Toshin Bin Azad (Admin Head)",
    narration: "Reimbursable doctor detailing conveyance and GPS-verified doctor sample visit logs for 8 MIOs.",
  },
  {
    id: "pv-5",
    voucherNo: "AKP-PV-2026-0905",
    payeeName: "Aventis Chem Excipients PLC",
    vendorTin: "LC-FOREIGN-4921",
    category: "Active Pharmaceutical Ingredients (API)",
    disbursingBank: "Standard Chartered Bank",
    disbursingAccount: "01-8849201-01",
    invoiceRef: "LC-IMPORT-402",
    poRef: "PO-2026-0799",
    grossAmount: 680000,
    tdsRate: 5,
    vdsRate: 0,
    netAmount: 646000,
    paymentMethod: "RTGS Real-Time Settlement",
    instrumentRef: "PENDING-TX-SWIFT",
    executionDate: "20 Sep 2026",
    stage: "Awaiting MD Signoff",
    makerName: "K. R. Mahmud (Accounts)",
    checkerName: "Managing Director / CFO",
    narration: "Foreign raw material import Letter of Credit document retirement for microcrystalline cellulose excipient.",
  },
];

export default function PaymentsPage() {
  const [vouchers, setVouchers] = React.useState<PaymentVoucher[]>(initialVouchers);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [stageFilter, setStageFilter] = React.useState("all");

  // Create / Edit Modal State
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<Omit<PaymentVoucher, "id">>({
    voucherNo: "",
    payeeName: "",
    vendorTin: "",
    category: "Active Pharmaceutical Ingredients (API)",
    disbursingBank: "Eastern Bank PLC",
    disbursingAccount: "104-102-994821",
    invoiceRef: "",
    poRef: "",
    grossAmount: 100000,
    tdsRate: 5,
    vdsRate: 7.5,
    netAmount: 87500,
    paymentMethod: "RTGS Real-Time Settlement",
    instrumentRef: "",
    executionDate: "17 Sep 2026",
    stage: "Settled & Disbursed",
    makerName: "Toshin Bin Azad (Admin Head)",
    checkerName: "Managing Director / CFO",
    narration: "",
  });

  // Dedicated Print Slip Modal State
  const [printTarget, setPrintTarget] = React.useState<PaymentVoucher | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);

  // Recalculate net whenever gross, tds, or vds changes
  const updateGrossAndTaxes = (gross: number, tds: number, vds: number) => {
    const tdsVal = (gross * tds) / 100;
    const vdsVal = (gross * vds) / 100;
    const net = Math.max(0, gross - tdsVal - vdsVal);
    setFormData((prev) => ({
      ...prev,
      grossAmount: gross,
      tdsRate: tds,
      vdsRate: vds,
      netAmount: Math.round(net),
    }));
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      voucherNo: `AKP-PV-2026-09${vouchers.length + 10}`,
      payeeName: "",
      vendorTin: "",
      category: "Active Pharmaceutical Ingredients (API)",
      disbursingBank: "Eastern Bank PLC",
      disbursingAccount: "104-102-994821",
      invoiceRef: "",
      poRef: "",
      grossAmount: 0,
      tdsRate: 5,
      vdsRate: 7.5,
      netAmount: 0,
      paymentMethod: "RTGS Real-Time Settlement",
      instrumentRef: "",
      executionDate: "17 Sep 2026",
      stage: "Settled & Disbursed",
      makerName: "Toshin Bin Azad (Admin Head)",
      checkerName: "Managing Director / CFO",
      narration: "",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: PaymentVoucher) => {
    setEditingId(v.id);
    setFormData({
      voucherNo: v.voucherNo,
      payeeName: v.payeeName,
      vendorTin: v.vendorTin,
      category: v.category,
      disbursingBank: v.disbursingBank,
      disbursingAccount: v.disbursingAccount,
      invoiceRef: v.invoiceRef,
      poRef: v.poRef,
      grossAmount: v.grossAmount,
      tdsRate: v.tdsRate,
      vdsRate: v.vdsRate,
      netAmount: v.netAmount,
      paymentMethod: v.paymentMethod,
      instrumentRef: v.instrumentRef,
      executionDate: v.executionDate,
      stage: v.stage,
      makerName: v.makerName,
      checkerName: v.checkerName,
      narration: v.narration,
    });
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      // Update existing
      setVouchers((prev) =>
        prev.map((v) => (v.id === editingId ? { ...formData, id: editingId } : v))
      );
      if (printTarget && printTarget.id === editingId) {
        setPrintTarget({ ...formData, id: editingId });
      }
    } else {
      // Create new
      const created: PaymentVoucher = {
        ...formData,
        id: `pv-${Date.now()}`,
      };
      setVouchers((prev) => [created, ...prev]);
    }
    setIsFormOpen(false);
  };

  const handleOpenPrintSlip = (v: PaymentVoucher) => {
    setPrintTarget(v);
    setIsPrintModalOpen(true);
  };

  const triggerDirectPrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const data = vouchers.map((v) => ({
      "Voucher Code": v.voucherNo,
      "Payee / Beneficiary": v.payeeName,
      "Vendor TIN": v.vendorTin,
      Category: v.category,
      "Disbursing Bank": v.disbursingBank,
      "Bank Account": v.disbursingAccount,
      "Invoice Ref": v.invoiceRef,
      "PO Ref": v.poRef,
      "Gross (BDT)": v.grossAmount,
      "TDS Rate (%)": v.tdsRate,
      "VDS Rate (%)": v.vdsRate,
      "Net Disbursed (BDT)": v.netAmount,
      Channel: v.paymentMethod,
      "Instrument Ref": v.instrumentRef,
      Date: v.executionDate,
      Stage: v.stage,
      Maker: v.makerName,
      Checker: v.checkerName,
      Narration: v.narration,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Accounts Payable");
    XLSX.writeFile(wb, `AK_Pharma_Payment_Vouchers_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.payeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.invoiceRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.disbursingBank.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || v.category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesStage =
      stageFilter === "all" || v.stage.toLowerCase() === stageFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesStage;
  });

  const totalDisbursedNet = vouchers
    .filter((v) => v.stage === "Settled & Disbursed")
    .reduce((acc, curr) => acc + curr.netAmount, 0);

  const pendingAuthorizationNet = vouchers
    .filter((v) => v.stage === "Awaiting MD Signoff")
    .reduce((acc, curr) => acc + curr.netAmount, 0);

  const totalStatutoryWithheld = vouchers
    .filter((v) => v.stage === "Settled & Disbursed")
    .reduce((acc, curr) => acc + (curr.grossAmount - curr.netAmount), 0);

  return (
    <div className="space-y-6 max-w-[1380px] mx-auto pb-16">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              DISBURSEMENTS & ACCOUNTS PAYABLE
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
            Vendor Remittances & Payment Vouchers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full editable control over vendor disbursements, TDS/VDS statutory tax withholding, and high-fidelity printable slips.
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

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none"
          >
            <Plus className="h-4 w-4" />
            Issue New Voucher
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 print:hidden">
        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Settled Disbursals</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-slate-900 leading-none font-mono">
            ৳{totalDisbursedNet.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-medium">
            Cleared cash outflows across banking routes
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Statutory Tax Withheld</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-slate-900 leading-none font-mono text-purple-700">
            ৳{totalStatutoryWithheld.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-medium">
            TDS Sec-52 & VDS earmarked for treasury deposit
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Authorization</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-slate-900 leading-none font-mono text-amber-600">
            ৳{pendingAuthorizationNet.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-3">
            Awaiting Managing Director countersign
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Vouchers</span>
            <Badge variant="outline" className="text-[10px] font-bold text-blue-700 bg-blue-50 border-blue-200">
              {vouchers.length} Total
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-slate-900 leading-none font-mono">
            {vouchers.filter((v) => v.stage === "Settled & Disbursed").length} / {vouchers.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-medium">
            100% reconciled against bank debits
          </p>
        </Card>
      </div>

      {/* 3. Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 print:hidden">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search voucher #, vendor, invoice ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 w-[190px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Sourcing Categories</SelectItem>
              <SelectItem value="active pharmaceutical ingredients (api)">API & Raw Materials</SelectItem>
              <SelectItem value="primary & secondary packaging">Packaging Materials</SelectItem>
              <SelectItem value="field force da/ta & conveyance">Field Force DA/TA</SelectItem>
              <SelectItem value="statutory regulatory & dgda">Statutory & DGDA</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs bg-white border-slate-200">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Audit Stages</SelectItem>
              <SelectItem value="settled & disbursed">Settled & Disbursed</SelectItem>
              <SelectItem value="awaiting md signoff">Awaiting Signoff</SelectItem>
              <SelectItem value="scheduled clearing">Scheduled</SelectItem>
              <SelectItem value="compliance hold">Compliance Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Voucher Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              PAYMENT VOUCHERS & DISBURSEMENT JOURNAL
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Edit voucher amounts and tax structures, or generate print-ready advice slips.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredVouchers.length} Vouchers
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Voucher / Date</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Beneficiary & Category</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Disbursing Account</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Gross (৳)</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Tax WHT (৳)</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Net Payable (৳)</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Status</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVouchers.map((v) => {
              const totalWht = v.grossAmount - v.netAmount;

              return (
                <TableRow key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <TableCell className="py-3 pl-0">
                    <div className="leading-tight">
                      <span className="text-xs font-mono font-bold text-[#0090FF] block">{v.voucherNo}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{v.executionDate}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 block">{v.payeeName}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[210px] mt-0.5">
                        {v.category}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-700">
                    <div>
                      <span className="font-medium text-slate-900 block">{v.disbursingBank}</span>
                      <span className="text-[10px] font-mono text-slate-400 block">{v.disbursingAccount}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono text-slate-700">
                    ৳{v.grossAmount.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono text-rose-500">
                    {totalWht > 0 ? `-৳${totalWht.toLocaleString("en-IN")}` : "৳0"}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                    ৳{v.netAmount.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-3 text-xs">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        v.stage === "Settled & Disbursed"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : v.stage === "Scheduled Clearing"
                          ? "text-blue-700 bg-blue-50 border-blue-200"
                          : v.stage === "Awaiting MD Signoff"
                          ? "text-amber-700 bg-amber-50 border-amber-200"
                          : "text-rose-700 bg-rose-50 border-rose-200"
                      }`}
                    >
                      {v.stage}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right pr-0">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(v)}
                        className="h-7 px-2 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 gap-1"
                      >
                        <Pencil className="h-3 w-3 text-slate-400" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPrintSlip(v)}
                        className="h-7 px-2 text-xs text-[#0090FF] border-blue-200 hover:bg-blue-50 gap-1 font-semibold"
                      >
                        <Printer className="h-3 w-3" />
                        Print Advice
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Comprehensive Create & Edit Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[620px] bg-white rounded-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingId ? "Edit Payment Voucher Particulars" : "Issue New Payment Voucher"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update payee details, bank account, tax deductions, and narrative justifications.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Voucher Code *</Label>
                <Input
                  value={formData.voucherNo}
                  onChange={(e) => setFormData({ ...formData, voucherNo: e.target.value })}
                  required
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Execution Date *</Label>
                <Input
                  value={formData.executionDate}
                  onChange={(e) => setFormData({ ...formData, executionDate: e.target.value })}
                  required
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Beneficiary / Supplier Name *</Label>
                <Input
                  value={formData.payeeName}
                  onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                  required
                  className="h-8 text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Vendor TIN / Tax ID</Label>
                <Input
                  value={formData.vendorTin}
                  onChange={(e) => setFormData({ ...formData, vendorTin: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Cost Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Disbursing Bank</Label>
                <Input
                  value={formData.disbursingBank}
                  onChange={(e) => setFormData({ ...formData, disbursingBank: e.target.value })}
                  required
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Disbursing Account No.</Label>
                <Input
                  value={formData.disbursingAccount}
                  onChange={(e) => setFormData({ ...formData, disbursingAccount: e.target.value })}
                  required
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Instrument / Cheque #</Label>
                <Input
                  value={formData.instrumentRef}
                  onChange={(e) => setFormData({ ...formData, instrumentRef: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Vendor Invoice #</Label>
                <Input
                  value={formData.invoiceRef}
                  onChange={(e) => setFormData({ ...formData, invoiceRef: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Purchase Order (PO) #</Label>
                <Input
                  value={formData.poRef}
                  onChange={(e) => setFormData({ ...formData, poRef: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* Calculations Container */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Financial Amount & Statutory Withholdings
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-700">Gross Amount (৳)</Label>
                  <Input
                    type="number"
                    value={formData.grossAmount}
                    onChange={(e) =>
                      updateGrossAndTaxes(Number(e.target.value) || 0, formData.tdsRate, formData.vdsRate)
                    }
                    required
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-700">TDS Rate (%)</Label>
                  <Input
                    type="number"
                    value={formData.tdsRate}
                    onChange={(e) =>
                      updateGrossAndTaxes(formData.grossAmount, Number(e.target.value) || 0, formData.vdsRate)
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-700">VDS Rate (%)</Label>
                  <Input
                    type="number"
                    value={formData.vdsRate}
                    onChange={(e) =>
                      updateGrossAndTaxes(formData.grossAmount, formData.tdsRate, Number(e.target.value) || 0)
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Total Deducted at Source:</span>
                  <span className="font-mono font-bold text-rose-600">
                    -৳{(formData.grossAmount - formData.netAmount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Net Disbursed Take-Home:</span>
                  <span className="font-mono font-bold text-base text-[#0090FF]">
                    ৳{formData.netAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Audit Approval Stage</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(val) =>
                    setFormData({ ...formData, stage: val as PaymentVoucher["stage"] })
                  }
                >
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Settled & Disbursed">Settled & Disbursed</SelectItem>
                    <SelectItem value="Awaiting MD Signoff">Awaiting MD Signoff</SelectItem>
                    <SelectItem value="Scheduled Clearing">Scheduled Clearing</SelectItem>
                    <SelectItem value="Compliance Hold">Compliance Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Payment Channel</Label>
                <Input
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Purpose / Commercial Narration</Label>
              <Input
                value={formData.narration}
                onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                {editingId ? "Save Voucher Changes" : "Create Voucher"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Isolated, Print-Perfect Remittance Advice Slip Modal */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="sm:max-w-[780px] bg-white rounded-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col">
          {printTarget && (
            <>
              {/* Toolbar Bar (Completely hidden during printing via print:hidden) */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-[#0090FF]" />
                  <span className="text-xs font-bold text-slate-800">
                    Printable Payment Voucher Preview — {printTarget.voucherNo}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={triggerDirectPrint}
                    className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white gap-1.5 shadow-none"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print / Save as PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPrintModalOpen(false)}
                    className="h-8 text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Printable Body Content */}
              <div
                className="p-8 sm:p-10 text-slate-900 font-sans leading-relaxed text-xs overflow-y-auto print:overflow-visible print:p-0 print:m-0"
                id="printable-payment-voucher"
              >
                {/* Official Letterhead */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase text-slate-900">
                      AK PHARMA LIMITED
                    </h1>
                    <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                      Corporate Finance & Treasury Operations Division
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Plot 14, Sector 7, Uttara Commercial Zone, Dhaka • DGDA Lic: DL-PH-2026-88
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold uppercase tracking-wider block text-slate-900 border border-slate-900 px-2 py-0.5 inline-block">
                      OFFICIAL PAYMENT VOUCHER
                    </span>
                    <span className="text-xs font-mono font-bold text-[#0090FF] block mt-1.5">
                      {printTarget.voucherNo}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Date: {printTarget.executionDate}
                    </span>
                  </div>
                </div>

                {/* Primary Meta Strip */}
                <div className="grid grid-cols-2 gap-6 py-4 border-b border-slate-300 text-xs">
                  <div className="space-y-1">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Paid To (Beneficiary):</span>
                      <strong className="text-sm text-slate-900 block">{printTarget.payeeName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Vendor TIN / Tax Registration:</span>
                      <span className="font-mono font-semibold text-slate-800">{printTarget.vendorTin || "VERIFIED VENDOR"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Invoice / Purchase Order Reference:</span>
                      <span className="font-mono font-medium text-slate-800">{printTarget.invoiceRef} • PO: {printTarget.poRef}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-right sm:text-left">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Disbursing Treasury Account:</span>
                      <strong className="text-slate-900 block">{printTarget.disbursingBank}</strong>
                      <span className="text-[10px] font-mono text-slate-500">{printTarget.disbursingAccount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Channel & Instrument Reference:</span>
                      <span className="font-medium text-slate-800">
                        {printTarget.paymentMethod} {printTarget.instrumentRef ? `(${printTarget.instrumentRef})` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Settlement Status:</span>
                      <strong className="text-emerald-700">{printTarget.stage}</strong>
                    </div>
                  </div>
                </div>

                {/* Expenditure Particulars Table */}
                <div className="py-4">
                  <table className="w-full text-xs border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                        <th className="text-left p-2.5">Particulars / Expenditure Description</th>
                        <th className="text-center p-2.5 w-44">Category</th>
                        <th className="text-right p-2.5 w-36">Gross BDT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">
                            Disbursement for {printTarget.payeeName}
                          </span>
                          <span className="text-[11px] text-slate-600 italic block mt-1 leading-relaxed">
                            "{printTarget.narration || "Commercial expenditure verified under internal audit policy."}"
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-700 font-medium">
                          {printTarget.category}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          ৳{printTarget.grossAmount.toLocaleString("en-IN")}/-
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Statutory Tax Deductions & Legal Net Banner */}
                <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-300">
                  <div className="space-y-1.5 text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-slate-500 block">
                      Statutory Tax Withholdings (Source Deductions)
                    </span>
                    <div className="flex items-center justify-between text-slate-700">
                      <span>TDS Sec-52 Withholding ({printTarget.tdsRate}%):</span>
                      <span className="font-mono font-bold text-rose-600">
                        -৳{((printTarget.grossAmount * printTarget.tdsRate) / 100).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span>VDS Source Deduction ({printTarget.vdsRate}%):</span>
                      <span className="font-mono font-bold text-rose-600">
                        -৳{((printTarget.grossAmount * printTarget.vdsRate) / 100).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center text-right pl-4 border-l border-slate-300">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Net Disbursed Take-Home</span>
                    <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                      ৳{printTarget.netAmount.toLocaleString("en-IN")}/-
                    </div>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="mt-3 p-2.5 border border-slate-200 bg-white rounded-lg flex items-center gap-2 text-[11px]">
                  <span className="font-bold text-slate-500">In Words:</span>
                  <span className="font-semibold text-slate-800 italic">
                    {numberToWordsBDT(printTarget.netAmount)}
                  </span>
                </div>

                {/* Tripartite Sign-off Blocks */}
                <div className="mt-14 pt-8 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-[11px] text-center">
                  <div>
                    <div className="w-36 border-b border-slate-400 mx-auto mb-1.5" />
                    <span className="font-bold text-slate-900 block">{printTarget.makerName}</span>
                    <span className="text-[10px] text-slate-500">Prepared By (Accounts Officer)</span>
                  </div>
                  <div>
                    <div className="w-36 border-b border-slate-400 mx-auto mb-1.5" />
                    <span className="font-bold text-slate-900 block">{printTarget.checkerName}</span>
                    <span className="text-[10px] text-slate-500">Audited By (Internal Audit)</span>
                  </div>
                  <div>
                    <div className="w-36 border-b border-slate-400 mx-auto mb-1.5" />
                    <span className="font-bold text-slate-900 block">Managing Director / CFO</span>
                    <span className="text-[10px] text-slate-500">Authorized Signatory</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}