"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
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
  Receipt,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

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
  items: InvoiceItem[];
  discountPct: number;
  taxVatAmount: number;
  paymentMethod: string;
  instrumentRef: string;
  executionDate: string;
  stage: "Settled & Disbursed" | "Awaiting MD Signoff" | "Scheduled Clearing" | "Compliance Hold";
  makerName: string;
  checkerName: string;
  narration: string;
}

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
    voucherNo: "AKP-INV-2026-0901",
    payeeName: "Popular Pharmacy (Dhanmondi)",
    vendorTin: "TIN-9948-2841-002",
    category: "Commercial Distribution",
    disbursingBank: "Standard Chartered Bank",
    disbursingAccount: "01-8849201-01",
    invoiceRef: "INV-88910",
    poRef: "PO-2026-0814",
    items: [
      { id: "it-1", description: "Napa Extra 500mg Tablet (Box)", quantity: 20, unitPrice: 120.00 },
      { id: "it-2", description: "Ciprocin 500mg Antimicrobial (Box)", quantity: 10, unitPrice: 350.00 },
      { id: "it-3", description: "Rosuvastatin 10mg Lipid Regulating", quantity: 5, unitPrice: 650.00 }
    ],
    discountPct: 5,
    taxVatAmount: 200.00,
    paymentMethod: "RTGS Real-Time Settlement",
    instrumentRef: "RTGS-SCB-99021",
    executionDate: "17 Sep 2026",
    stage: "Settled & Disbursed",
    makerName: "Rafiqul Islam (MIO)",
    checkerName: "Toshin Bin Azad (Admin Head)",
    narration: "Urgent restocking order dispatched via company ambient transport van.",
  },
];

export default function PaymentsPage() {
  const [vouchers, setVouchers] = React.useState<PaymentVoucher[]>(initialVouchers);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [stageFilter, setStageFilter] = React.useState("all");

  // Create / Edit Modal State
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Form states
  const [voucherNo, setVoucherNo] = React.useState("");
  const [payeeName, setPayeeName] = React.useState("");
  const [vendorTin, setVendorTin] = React.useState("");
  const [category, setCategory] = React.useState("Commercial Distribution");
  const [disbursingBank, setDisbursingBank] = React.useState("Eastern Bank PLC");
  const [disbursingAccount, setDisbursingAccount] = React.useState("104-102-994821");
  const [invoiceRef, setInvoiceRef] = React.useState("");
  const [poRef, setPoRef] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("RTGS Real-Time Settlement");
  const [instrumentRef, setInstrumentRef] = React.useState("");
  const [executionDate, setExecutionDate] = React.useState("17 Sep 2026");
  const [stage, setStage] = React.useState<PaymentVoucher["stage"]>("Settled & Disbursed");
  const [makerName, setMakerName] = React.useState("Rafiqul Islam (MIO)");
  const [checkerName, setCheckerName] = React.useState("Toshin Bin Azad (Admin Head)");
  const [narration, setNarration] = React.useState("");
  const [discountPct, setDiscountPct] = React.useState<number>(0);
  const [taxVatAmount, setTaxVatAmount] = React.useState<number>(0);

  // Multiple Items State
  const [items, setItems] = React.useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0 }
  ]);

  // Dedicated Print Modal State
  const [printTarget, setPrintTarget] = React.useState<PaymentVoucher | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);

  // ReactToPrint component ref
  const componentRef = useRef<HTMLDivElement | null>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: printTarget ? `Invoice-${printTarget.voucherNo}` : "Invoice",
  });

  const calculateSubtotal = (currentItems: InvoiceItem[] | undefined) => {
    if (!currentItems) return 0;
    return currentItems.reduce((acc, curr) => acc + (curr.quantity || 0) * (curr.unitPrice || 0), 0);
  };

  const calculateDiscountValue = (sub: number, pct: number) => {
    return (sub * (pct || 0)) / 100;
  };

  const calculateGrandTotal = (v: PaymentVoucher) => {
    const sub = calculateSubtotal(v.items);
    const discVal = calculateDiscountValue(sub, v.discountPct);
    return Math.max(0, sub - discVal + (v.taxVatAmount || 0));
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: `it-${Date.now()}`, description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, val: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setVoucherNo(`AKP-INV-2026-09${vouchers.length + 10}`);
    setPayeeName("");
    setVendorTin("");
    setCategory("Commercial Distribution");
    setDisbursingBank("Eastern Bank PLC");
    setDisbursingAccount("104-102-994821");
    setInvoiceRef("");
    setPoRef("");
    setPaymentMethod("RTGS Real-Time Settlement");
    setInstrumentRef("");
    setExecutionDate("17 Sep 2026");
    setStage("Settled & Disbursed");
    setMakerName("Rafiqul Islam (MIO)");
    setCheckerName("Toshin Bin Azad (Admin Head)");
    setNarration("");
    setDiscountPct(0);
    setTaxVatAmount(0);
    setItems([{ id: "1", description: "", quantity: 1, unitPrice: 0 }]);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: PaymentVoucher) => {
    setEditingId(v.id);
    setVoucherNo(v.voucherNo);
    setPayeeName(v.payeeName);
    setVendorTin(v.vendorTin);
    setCategory(v.category);
    setDisbursingBank(v.disbursingBank);
    setDisbursingAccount(v.disbursingAccount);
    setInvoiceRef(v.invoiceRef);
    setPoRef(v.poRef);
    setPaymentMethod(v.paymentMethod);
    setInstrumentRef(v.instrumentRef);
    setExecutionDate(v.executionDate);
    setStage(v.stage);
    setMakerName(v.makerName);
    setCheckerName(v.checkerName);
    setNarration(v.narration);
    setDiscountPct(v.discountPct || 0);
    setTaxVatAmount(v.taxVatAmount || 0);
    setItems(v.items && v.items.length > 0 ? [...v.items] : [{ id: "1", description: "", quantity: 1, unitPrice: 0 }]);
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Omit<PaymentVoucher, "id"> = {
      voucherNo,
      payeeName,
      vendorTin,
      category,
      disbursingBank,
      disbursingAccount,
      invoiceRef,
      poRef,
      items,
      discountPct,
      taxVatAmount,
      paymentMethod,
      instrumentRef,
      executionDate,
      stage,
      makerName,
      checkerName,
      narration,
    };

    if (editingId) {
      setVouchers((prev) =>
        prev.map((v) => (v.id === editingId ? { ...payload, id: editingId } : v))
      );
    } else {
      const created: PaymentVoucher = {
        ...payload,
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

  const handleExportExcel = () => {
    const data = vouchers.map((v) => ({
      "Invoice Code": v.voucherNo,
      "Chemist / Payee": v.payeeName,
      Date: v.executionDate,
      "Total Amount (BDT)": calculateGrandTotal(v),
      Stage: v.stage,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, `AK_Pharma_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.payeeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === "all" || v.stage.toLowerCase() === stageFilter.toLowerCase();
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6 max-w-[1380px] mx-auto pb-16">
      {/* Print Page Setup CSS locking in system font styling */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-page-copy {
            page-break-after: always;
            break-after: page;
            min-height: 94vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: #ffffff !important;
            padding: 8mm;
            margin-bottom: 5mm;
          }
          .print-page-copy:last-child {
            page-break-after: avoid;
            break-after: avoid;
            margin-bottom: 0;
          }
        }
      `}</style>

      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              COMMERCIAL INVOICING & DISPATCH
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
            Sales Invoices & Delivery Challans
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-item medicine invoicing matching professional template layouts with dual office/customer copies.
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
            Export Invoices
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none"
          >
            <Plus className="h-4 w-4" />
            Create New Invoice
          </Button>
        </div>
      </div>

      {/* 4. Invoice Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              ISSUED SALES INVOICES & CHALLANS
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click "Print Invoice" to generate dual copies formatted with red headers.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredVouchers.length} Invoices
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Invoice No / Date</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Chemist Name</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Items Count</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Grand Total (৳)</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Status</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVouchers.map((v) => {
              const grandTot = calculateGrandTotal(v);

              return (
                <TableRow key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <TableCell className="py-3 pl-0">
                    <div className="leading-tight">
                      <span className="text-xs font-mono font-bold text-[#0090FF] block">{v.voucherNo}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{v.executionDate}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs font-semibold text-slate-900">
                    {v.payeeName}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-600 font-mono">
                    {v.items ? v.items.length : 0} Products
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                    ৳{grandTot.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>

                  <TableCell className="py-3 text-xs">
                    <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
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
                        Print Invoice
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Create & Edit Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[800px] bg-white rounded-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingId ? "Edit Sales Invoice" : "Create New Sales Invoice"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure chemist destination, ordered items, percentage discount, and tax/VAT.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Invoice / Voucher Code *</Label>
                <Input
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value)}
                  required
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Chemist / Pharmacy Name *</Label>
                <Input
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  required
                  className="h-8 text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Date *</Label>
                <Input
                  value={executionDate}
                  onChange={(e) => setExecutionDate(e.target.value)}
                  required
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Sales Representative (SR)</Label>
                <Input
                  value={checkerName}
                  onChange={(e) => setCheckerName(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Territory & Assigned Field Officer</Label>
                <Input
                  value={makerName}
                  onChange={(e) => setMakerName(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Multiple Medicine Line Items Table */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Products Description & Pricing
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-center w-20">Quantity</th>
                      <th className="p-2 text-right w-28">Unit Price (৳)</th>
                      <th className="p-2 text-right w-28">Amount (৳)</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it) => {
                      const itemTotal = (it.quantity || 0) * (it.unitPrice || 0);
                      return (
                        <tr key={it.id} className="hover:bg-slate-50/50">
                          <td className="p-2">
                            <Input
                              value={it.description}
                              onChange={(e) => handleUpdateItem(it.id, "description", e.target.value)}
                              placeholder="e.g. Napa Extra 500mg Tablet"
                              required
                              className="h-8 text-xs font-medium"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              value={it.quantity}
                              onChange={(e) => handleUpdateItem(it.id, "quantity", Number(e.target.value) || 1)}
                              className="h-8 text-xs font-mono text-center"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              value={it.unitPrice}
                              onChange={(e) => handleUpdateItem(it.id, "unitPrice", Number(e.target.value) || 0)}
                              className="h-8 text-xs font-mono text-right"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900 pr-3">
                            ৳{itemTotal.toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveItem(it.id)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Totals & Notes Configuration */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Notes / Instructions</Label>
                <Input
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder="e.g. Deliver before 2 PM..."
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2 border border-slate-200 p-3 rounded-xl bg-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-semibold">Subtotal:</span>
                  <span className="font-mono font-bold">৳{calculateSubtotal(items).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-600 font-semibold">Discount (%):</span>
                  <Input
                    type="number"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(Number(e.target.value) || 0)}
                    placeholder="e.g. 5"
                    className="h-7 w-28 text-xs font-mono text-right bg-white"
                  />
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-600 font-semibold">Tax / VAT (৳):</span>
                  <Input
                    type="number"
                    value={taxVatAmount}
                    onChange={(e) => setTaxVatAmount(Number(e.target.value) || 0)}
                    className="h-7 w-28 text-xs font-mono text-right bg-white"
                  />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-black text-sm">
                  <span>Total:</span>
                  <span className="font-mono text-[#0090FF]">
                    ৳{((calculateSubtotal(items) - calculateDiscountValue(calculateSubtotal(items), discountPct)) + taxVatAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                {editingId ? "Save Invoice" : "Create Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Isolated, Print-Perfect Dual Invoice Modal using ReactToPrint useRef */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="sm:max-w-[780px] bg-white rounded-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col">
          {printTarget && (
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Toolbar Bar (Hidden during printing) */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-[#0090FF]" />
                  <span className="text-xs font-bold text-slate-800">
                    Dual Invoice Preview (Office & Customer Copy) — {printTarget.voucherNo}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handlePrint()}
                    className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white gap-1.5 shadow-none"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print 2 Copies
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

              {/* Printable Wrapper Attached to componentRef */}
              <div ref={componentRef} id="printable-invoice-wrapper" className="flex flex-col p-6 sm:p-8 bg-white text-slate-900 font-sans">
                
                {/* ========================================================= */}
                {/* PAGE 1: OFFICE COPY                                       */}
                {/* ========================================================= */}
                <div className="print-page-copy leading-relaxed text-xs">
                  <div>
                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-black tracking-tight uppercase">AK PHARMA</h2>
                        <p className="text-[11px] text-slate-700 font-medium">Warehouse</p>
                        <p className="text-[10px] text-slate-600">26/10, Rupnagar R/A, Mirpur, Dhaka 1216</p>
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 border border-slate-900 px-3 py-1 inline-block bg-white">
                          INVOICE (OFFICE COPY)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-900 block">
                          {printTarget.voucherNo}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono block mt-0.5">
                          Date: {printTarget.executionDate}
                        </span>
                      </div>
                    </div>

                    {/* Chemist & Sales Rep Strip */}
                    <div className="grid grid-cols-2 gap-6 py-3 border-b border-slate-300 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Chemist:</span>
                        <strong className="text-sm text-slate-900 block">{printTarget.payeeName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Sales Representative:</span>
                        <strong className="text-sm text-slate-900 block">{printTarget.checkerName}</strong>
                      </div>
                    </div>
                    <div className="py-1.5 text-[11px] text-slate-700 border-b border-slate-200">
                      <span>Territory & Assigned Field Officer: </span>
                      <strong className="text-slate-900">{printTarget.makerName}</strong>
                    </div>

                    {/* Itemized Table with Red Header */}
                    <div className="py-4">
                      <table className="w-full text-xs border border-slate-900 bg-white" style={{ borderCollapse: "collapse" }}>
                        <thead>
                          <tr className="bg-[#cc0000] text-white font-bold border-b border-slate-900">
                            <th style={{ backgroundColor: "#cc0000", color: "#ffffff", padding: "8px", textAlign: "left", borderRight: "1px solid #000" }}>DESCRIPTION</th>
                            <th style={{ backgroundColor: "#cc0000", color: "#ffffff", padding: "8px", textAlign: "center", borderRight: "1px solid #000", width: "90px" }}>QUANTITY</th>
                            <th style={{ backgroundColor: "#cc0000", color: "#ffffff", padding: "8px", textAlign: "right", borderRight: "1px solid #000", width: "100px" }}>UNIT PRICE</th>
                            <th style={{ backgroundColor: "#cc0000", color: "#ffffff", padding: "8px", textAlign: "right", width: "100px" }}>AMOUNT (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printTarget.items && printTarget.items.map((it, idx) => {
                            const amt = (it.quantity || 0) * (it.unitPrice || 0);
                            return (
                              <tr key={it.id || idx} style={{ borderBottom: "1px solid #cbd5e1" }}>
                                <td style={{ padding: "8px", borderRight: "1px solid #cbd5e1", fontWeight: 600 }}>{it.description}</td>
                                <td style={{ padding: "8px", borderRight: "1px solid #cbd5e1", textAlign: "center", fontFamily: "monospace" }}>{it.quantity}</td>
                                <td style={{ padding: "8px", borderRight: "1px solid #cbd5e1", textAlign: "right", fontFamily: "monospace" }}>{(it.unitPrice || 0).toFixed(2)}</td>
                                <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", fontWeight: "bold" }}>{amt.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Grid: Notes & Summary Sidebar matching template */}
                    <div className="grid grid-cols-2 gap-6 pt-2 items-start">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 block text-[11px]">NOTES:</span>
                        <div className="p-2 border border-slate-300 rounded bg-slate-50 min-h-[60px] text-slate-700 text-[11px]">
                          {printTarget.narration || "Thank you for your business with AK Pharma."}
                        </div>
                      </div>

                      <div className="border border-slate-900 text-xs">
                        <div style={{ backgroundColor: "#cc0000", color: "#ffffff" }} className="flex justify-between p-1.5 border-b border-slate-900 font-bold">
                          <span>SUBTOTAL</span>
                          <span className="font-mono">৳{calculateSubtotal(printTarget.items).toFixed(2)}</span>
                        </div>
                        <div style={{ backgroundColor: "#cc0000", color: "#ffffff" }} className="flex justify-between p-1.5 border-b border-slate-900 font-bold">
                          <span>DISCOUNT ({printTarget.discountPct || 0}%)</span>
                          <span className="font-mono">৳{calculateDiscountValue(calculateSubtotal(printTarget.items), printTarget.discountPct).toFixed(2)}</span>
                        </div>
                        <div style={{ backgroundColor: "#cc0000", color: "#ffffff" }} className="flex justify-between p-1.5 border-b border-slate-900 font-bold">
                          <span>TAX / VAT</span>
                          <span className="font-mono">৳{(printTarget.taxVatAmount || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ backgroundColor: "#cc0000", color: "#ffffff" }} className="flex justify-between p-2 font-black text-sm">
                          <span>TOTAL</span>
                          <span className="font-mono">৳{calculateGrandTotal(printTarget).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount in words without RS prefix */}
                    <div className="mt-3 text-[11px] font-semibold italic text-slate-700">
                      {numberToWordsBDT(calculateGrandTotal(printTarget))}
                    </div>
                  </div>

                  {/* Office Copy Signatures */}
                  <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-[11px] text-center font-semibold text-slate-800">
                    <div>
                      <div className="w-32 border-b border-slate-500 mx-auto mb-1" />
                      <span>Sales Representative (sign)</span>
                    </div>
                    <div>
                      <div className="w-32 border-b border-slate-500 mx-auto mb-1" />
                      <span>Account Officer (sign)</span>
                    </div>
                    <div>
                      <div className="w-32 border-b border-slate-500 mx-auto mb-1" />
                      <span>Chemist Receiver (sign)</span>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* PAGE 2: CUSTOMER COPY (NO SIGNATURES)                     */}
                {/* ========================================================= */}
                <div className="print-page-copy leading-relaxed text-xs pt-4">
                  <div>
                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-black tracking-tight uppercase">AK PHARMA</h2>
                        <p className="text-[11px] text-slate-700 font-medium">Warehouse</p>
                        <p className="text-[10px] text-slate-600">26/10, Rupnagar R/A, Mirpur, Dhaka 1216</p>
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 border border-slate-900 px-3 py-1 inline-block bg-white">
                          INVOICE (CUSTOMER COPY)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-900 block">
                          {printTarget.voucherNo}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono block mt-0.5">
                          Date: {printTarget.executionDate}
                        </span>
                      </div>
                    </div>

                    {/* Chemist & Sales Rep Strip */}
                    <div className="grid grid-cols-2 gap-6 py-3 border-b border-slate-300 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Chemist:</span>
                        <strong className="text-sm text-slate-900 block">{printTarget.payeeName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Sales Representative:</span>
                        <strong className="text-sm text-slate-900 block">{printTarget.checkerName}</strong>
                      </div>
                    </div>
                    <div className="py-1.5 text-[11px] text-slate-700 border-b border-slate-200">
                      <span>Territory & Assigned Field Officer: </span>
                      <strong className="text-slate-900">{printTarget.makerName}</strong>
                    </div>

                    {/* Itemized Table with Red Header */}
                    <div className="py-4">
                      <table className="w-full text-xs border border-slate-900 bg-white" style={{ borderCollapse: "collapse" }}>
                        <thead>
                          <tr className="bg-[#cc0000] text-white font-bold border-b border-slate-900">
                            <th style={{ backgroundColor: "#cc0000", color: "#ffffff", padding: "8px", textAlign: "left", borderRight: "1px solid #000" }}>DESCRIPTION</th>
                            <th style={{ backgroundColor: "#cc0000", color: "#ffffff", padding: "8px", textAlign: "center", borderRight: "1px solid #000", width: "90px" }}>QUANTITY</th>
                            <th style={{ backgroundColor: "#cc0000", color: "#ffffff", padding: "8px", textAlign: "right", borderRight: "1px solid #000", width: "100px" }}>UNIT PRICE</th>
                            <th style={{ backgroundColor: "#cc0000", color: "#ffffff", padding: "8px", textAlign: "right", width: "100px" }}>AMOUNT (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printTarget.items && printTarget.items.map((it, idx) => {
                            const amt = (it.quantity || 0) * (it.unitPrice || 0);
                            return (
                              <tr key={it.id || idx} style={{ borderBottom: "1px solid #cbd5e1" }}>
                                <td style={{ padding: "8px", borderRight: "1px solid #cbd5e1", fontWeight: 600 }}>{it.description}</td>
                                <td style={{ padding: "8px", borderRight: "1px solid #cbd5e1", textAlign: "center", fontFamily: "monospace" }}>{it.quantity}</td>
                                <td style={{ padding: "8px", borderRight: "1px solid #cbd5e1", textAlign: "right", fontFamily: "monospace" }}>{(it.unitPrice || 0).toFixed(2)}</td>
                                <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", fontWeight: "bold" }}>{amt.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Grid: Notes & Summary Sidebar matching template */}
                    <div className="grid grid-cols-2 gap-6 pt-2 items-start">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 block text-[11px]">NOTES:</span>
                        <div className="p-2 border border-slate-300 rounded bg-slate-50 min-h-[60px] text-slate-700 text-[11px]">
                          {printTarget.narration || "Thank you for your business with AK Pharma."}
                        </div>
                      </div>

                      <div className="border border-slate-900 text-xs">
                        <div style={{ backgroundColor: "#cc0000", color: "#ffffff" }} className="flex justify-between p-1.5 border-b border-slate-900 font-bold">
                          <span>SUBTOTAL</span>
                          <span className="font-mono">৳{calculateSubtotal(printTarget.items).toFixed(2)}</span>
                        </div>
                        <div style={{ backgroundColor: "#cc0000", color: "#ffffff" }} className="flex justify-between p-1.5 border-b border-slate-900 font-bold">
                          <span>DISCOUNT ({printTarget.discountPct || 0}%)</span>
                          <span className="font-mono">৳{calculateDiscountValue(calculateSubtotal(printTarget.items), printTarget.discountPct).toFixed(2)}</span>
                        </div>
                        <div style={{ backgroundColor: "#cc0000", color: "#ffffff" }} className="flex justify-between p-1.5 border-b border-slate-900 font-bold">
                          <span>TAX / VAT</span>
                          <span className="font-mono">৳{(printTarget.taxVatAmount || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ backgroundColor: "#cc0000", color: "#ffffff" }} className="flex justify-between p-2 font-black text-sm">
                          <span>TOTAL</span>
                          <span className="font-mono">৳{calculateGrandTotal(printTarget).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount in words without RS prefix */}
                    <div className="mt-3 text-[11px] font-semibold italic text-slate-700">
                      {numberToWordsBDT(calculateGrandTotal(printTarget))}
                    </div>
                  </div>

                  {/* Customer Copy Notice (No Signatures) */}
                  <div className="pt-10 text-center text-slate-500 text-xs italic">
                    — Customer Copy (Thank you for your business with AK Pharma) —
                  </div>
                </div>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}