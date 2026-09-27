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
  Printer,
  Download,
  Search,
  Filter,
  Plus,
  Pencil,
  Receipt,
  Wallet,
  Landmark,
  Trash2,
} from "lucide-react";

export interface ExpenseVoucher {
  id: string;
  voucherNo: string;
  payeeName: string;
  category: "Doctor Gifts & Promotional" | "Wholesaler Settlement" | "Staff Welfare & Meals" | "Meetings & Events" | "General Operating Expense";
  fundingSource: "Cash Safe" | "Bank Account";
  sourceDetail: string;
  amount: number;
  paymentDate: string;
  notes: string;
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

export default function GeneralPaymentsPage() {
  const [vouchers, setVouchers] = React.useState<ExpenseVoucher[]>([
  ]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<Omit<ExpenseVoucher, "id">>({
    voucherNo: `AKP-EXP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    payeeName: "",
    category: "Doctor Gifts & Promotional",
    fundingSource: "Cash Safe",
    sourceDetail: "Head Office Cash Safe",
    amount: 0,
    paymentDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    notes: "",
  });

  const [printTarget, setPrintTarget] = React.useState<ExpenseVoucher | null>(null);
  const [isPrintOpen, setIsPrintOpen] = React.useState(false);

  // Hidden print iframe trigger
  const handlePrint = (record: ExpenseVoucher) => {
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Voucher_${record.voucherNo}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            * {
              box-sizing: border-box;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            body {
              margin: 0;
              padding: 0;
              color: #0f172a;
              background: #fff;
              font-size: 13px;
              line-height: 1.5;
            }
            .voucher-box {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 24px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
            }
            .company-name {
              font-size: 20px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: -0.5px;
            }
            .sub-title {
              font-size: 11px;
              color: #64748b;
              margin-top: 2px;
            }
            .voucher-tag {
              text-align: right;
            }
            .tag-badge {
              display: inline-block;
              font-size: 11px;
              font-weight: 800;
              border: 1px solid #0f172a;
              padding: 2px 8px;
              text-transform: uppercase;
            }
            .voucher-num {
              font-family: monospace;
              font-weight: 700;
              color: #0090FF;
              margin-top: 4px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 14px;
              margin-top: 16px;
            }
            .meta-label {
              font-size: 10px;
              text-transform: uppercase;
              font-weight: 700;
              color: #64748b;
            }
            .meta-val {
              font-weight: 600;
              font-size: 13px;
              margin-top: 2px;
            }
            .particulars-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .particulars-table th {
              background: #f1f5f9;
              text-align: left;
              padding: 10px 12px;
              border: 1px solid #cbd5e1;
              font-size: 11px;
              text-transform: uppercase;
            }
            .particulars-table td {
              padding: 12px;
              border: 1px solid #cbd5e1;
              font-size: 12px;
            }
            .amount-box {
              margin-top: 16px;
              padding: 12px 16px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .signatures {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              padding: 0 40px;
            }
            .sig-block {
              text-align: center;
              width: 200px;
            }
            .sig-line {
              border-top: 1px solid #475569;
              margin-bottom: 6px;
            }
            .sig-title {
              font-weight: 700;
              font-size: 11px;
            }
            .sig-sub {
              font-size: 10px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="voucher-box">
            <div class="header">
              <div>
                <div class="company-name">AK PHARMA </div>
                <div class="sub-title">Corporate Finance & General Expense Disbursement</div>
                <div class="sub-title">Plot 14, Sector 7, Uttara Commercial Zone, Dhaka • DGDA Lic: DL-PH-2026-88</div>
              </div>
              <div class="voucher-tag">
                <div class="tag-badge">Expense Payment Voucher</div>
                <div class="voucher-num">${record.voucherNo}</div>
                <div class="sub-title" style="font-family: monospace;">Date: ${record.paymentDate}</div>
              </div>
            </div>

            <div class="meta-grid">
              <div>
                <div class="meta-label">Payee / Beneficiary</div>
                <div class="meta-val">${record.payeeName}</div>
                <div class="meta-label" style="margin-top: 8px;">Expense Category</div>
                <div class="meta-val">${record.category}</div>
              </div>
              <div>
                <div class="meta-label">Disbursing Account / Safe</div>
                <div class="meta-val">${record.sourceDetail} (${record.fundingSource})</div>
                <div class="meta-label" style="margin-top: 8px;">Payment Status</div>
                <div class="meta-val" style="color: #059669;">Settled & Disbursed</div>
              </div>
            </div>

            <table class="particulars-table">
              <thead>
                <tr>
                  <th>Particulars / Purpose of Payment</th>
                  <th style="width: 140px; text-align: right;">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Payment to ${record.payeeName}</strong>
                    <div style="color: #475569; font-style: italic; margin-top: 4px;">
                      "${record.notes || "General operational expense disbursement."}"
                    </div>
                  </td>
                  <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 14px;">
                    ৳${record.amount.toLocaleString("en-IN")}/-
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="amount-box">
              <span style="color: #64748b; font-size: 11px; font-weight: 600;">Amount in Words:</span>
              <span style="font-weight: 700; font-style: italic;">${numberToWordsBDT(record.amount)}</span>
            </div>

            <div class="signatures">
              <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-title">Chief Executive Officer (CEO)</div>
                <div class="sig-sub">Executive Approval</div>
              </div>
              <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-title">Managing Director (MD)</div>
                <div class="sig-sub">Final Financial Sign-off</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    }, 250);
  };
  
const handleOpenCreate = async () => {
  setEditingId(null);

  let nextSerial = "AKP-EXP-2026-0001";

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${API_URL}/payments/next-number`);
    if (res.ok) {
      const data = await res.json();
      nextSerial = data.nextVoucherNo;
    } else {
      // Local fallback: count current vouchers + 1
      nextSerial = `AKP-EXP-2026-${String(vouchers.length + 1).padStart(4, "0")}`;
    }
  } catch {
    nextSerial = `AKP-EXP-2026-${String(vouchers.length + 1).padStart(4, "0")}`;
  }

  setFormData({
    voucherNo: nextSerial,
    payeeName: "",
    category: "Doctor Gifts & Promotional",
    fundingSource: "Cash Safe",
    sourceDetail: "Head Office Cash Safe",
    amount: 0,
    paymentDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    notes: "",
  });

  setIsFormOpen(true);
};

  const handleOpenEdit = (v: ExpenseVoucher) => {
    setEditingId(v.id);
    setFormData({
      voucherNo: v.voucherNo,
      payeeName: v.payeeName,
      category: v.category,
      fundingSource: v.fundingSource,
      sourceDetail: v.sourceDetail,
      amount: v.amount,
      paymentDate: v.paymentDate,
      notes: v.notes,
    });
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setVouchers((prev) =>
        prev.map((v) => (v.id === editingId ? { ...formData, id: editingId } : v))
      );
    } else {
      const created: ExpenseVoucher = {
        ...formData,
        id: `exp-${Date.now()}`,
      };
      setVouchers((prev) => [created, ...prev]);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense voucher?")) {
      setVouchers((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const handleExportExcel = () => {
    const data = vouchers.map((v) => ({
      "Voucher #": v.voucherNo,
      "Date": v.paymentDate,
      "Payee / Beneficiary": v.payeeName,
      "Category": v.category,
      "Source Type": v.fundingSource,
      "Source Detail": v.sourceDetail,
      "Amount (BDT)": v.amount,
      "Notes": v.notes,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "General Payments");
    XLSX.writeFile(workbook, `AK_Pharma_General_Payments_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.payeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.notes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat =
      categoryFilter === "all" || v.category === categoryFilter;

    return matchesSearch && matchesCat;
  });

  const totalExpenseAmount = vouchers.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 max-w-[1380px] mx-auto pb-16 font-sans text-neutral-900">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0090FF] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              EXPENSE & DISBURSEMENT LEDGER
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
            General Payments & Cash Outflows
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record doctor gifts, wholesaler payments, staff expenses, and meeting costs with simple cash or bank allocation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3.5 rounded-lg shadow-none"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" /> Export Ledger
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none"
          >
            <Plus className="h-4 w-4" /> Record New Payment
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl border border-slate-200 shadow-sm bg-white p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Payments Recorded</span>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-slate-900 font-mono">
            {vouchers.length} Vouchers
          </div>
        </Card>
        <Card className="rounded-xl border border-slate-200 shadow-sm bg-white p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Outflow Amount</span>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-emerald-700 font-mono">
            ৳{totalExpenseAmount.toLocaleString("en-IN")}
          </div>
        </Card>
        <Card className="rounded-xl border border-slate-200 shadow-sm bg-white p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Funding Sources</span>
          <div className="mt-3 text-xs font-semibold text-slate-700 flex gap-2">
            <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">Cash Safes Active</span>
            <span className="px-2.5 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200">Corporate Banks Active</span>
          </div>
        </Card>
      </div>

      {/* 3. Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search voucher #, payee, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-8 w-[240px] text-xs bg-white border-slate-200">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="text-xs">
            <SelectItem value="all">All Expense Categories</SelectItem>
            <SelectItem value="Doctor Gifts & Promotional">Doctor Gifts & Promotional</SelectItem>
            <SelectItem value="Wholesaler Settlement">Wholesaler Settlement</SelectItem>
            <SelectItem value="Staff Welfare & Meals">Staff Welfare & Meals</SelectItem>
            <SelectItem value="Meetings & Events">Meetings & Events</SelectItem>
            <SelectItem value="General Operating Expense">General Operating Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 4. Voucher Table */}
      <Card className="rounded-xl border border-slate-200 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
            General Payment & Expense Register
          </h3>
          <span className="text-xs text-slate-400 font-medium">Showing {filteredVouchers.length} Records</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600">
              <TableHead className="pl-0">Voucher & Date</TableHead>
              <TableHead>Payee / Beneficiary</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Funding Source</TableHead>
              <TableHead className="text-right">Amount (৳)</TableHead>
              <TableHead className="text-right pr-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVouchers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                  No payment vouchers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredVouchers.map((v) => (
                <TableRow key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50 text-xs">
                  <TableCell className="py-3 pl-0">
                    <span className="font-mono font-bold text-[#0090FF] block">{v.voucherNo}</span>
                    <span className="text-[10px] text-slate-400">{v.paymentDate}</span>
                  </TableCell>

                  <TableCell className="py-3">
                    <strong className="text-slate-900 block">{v.payeeName}</strong>
                    <span className="text-[10px] text-slate-500">{v.notes || "No additional notes"}</span>
                  </TableCell>

                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-[10px] font-semibold">{v.category}</Badge>
                  </TableCell>

                  <TableCell className="py-3 text-slate-700">
                    <div className="flex items-center gap-1 font-medium">
                      {v.fundingSource === "Cash Safe" ? <Wallet className="h-3 w-3 text-emerald-600" /> : <Landmark className="h-3 w-3 text-blue-600" />}
                      <span>{v.sourceDetail}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-right font-mono font-bold text-slate-900 text-sm">
                    ৳{v.amount.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-3 text-right pr-0">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => handleOpenEdit(v)} className="h-7 px-2 text-xs">
                        <Pencil className="h-3 w-3 text-slate-400 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPrintTarget(v);
                          setIsPrintOpen(true);
                        }}
                        className="h-7 px-2 text-xs text-[#0090FF] border-blue-200"
                      >
                        <Receipt className="h-3 w-3 mr-1" /> View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrint(v)}
                        className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        <Printer className="h-3 w-3 mr-1" /> Print
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(v.id)} className="h-7 w-7 p-0 text-rose-600 border-rose-200">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Create / Edit Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[520px] bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingId ? "Edit Payment Voucher" : "Record General Payment"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Simple cash or bank expense recording.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-3.5 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Voucher Code *</Label>
                <Input
                  value={formData.voucherNo}
                  onChange={(e) => setFormData({ ...formData, voucherNo: e.target.value })}
                  required
                  className="h-8 font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Payment Date *</Label>
                <Input
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  required
                  className="h-8 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Payee / Beneficiary Name *</Label>
              <Input
                placeholder="e.g. Dr. Ahmed Hossain / Wholesaler Name / Staff Member"
                value={formData.payeeName}
                onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                required
                className="h-8 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Expense Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val: any) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-8 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Doctor Gifts & Promotional">Doctor Gifts & Promotional</SelectItem>
                    <SelectItem value="Wholesaler Settlement">Wholesaler Settlement</SelectItem>
                    <SelectItem value="Staff Welfare & Meals">Staff Welfare & Meals</SelectItem>
                    <SelectItem value="Meetings & Events">Meetings & Events</SelectItem>
                    <SelectItem value="General Operating Expense">General Operating Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Amount (৳) *</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) || 0 })}
                  required
                  className="h-8 font-mono font-bold text-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Funding Type *</Label>
                <Select
                  value={formData.fundingSource}
                  onValueChange={(val: any) => {
                    setFormData({
                      ...formData,
                      fundingSource: val,
                      sourceDetail: val === "Cash Safe" ? "Head Office Cash Safe" : "Eastern Bank PLC",
                    });
                  }}
                >
                  <SelectTrigger className="h-8 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Cash Safe">Physical Cash Safe</SelectItem>
                    <SelectItem value="Bank Account">Corporate Bank Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Specific Safe / Bank *</Label>
                <Select
                  value={formData.sourceDetail}
                  onValueChange={(val) => setFormData({ ...formData, sourceDetail: val })}
                >
                  <SelectTrigger className="h-8 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {formData.fundingSource === "Cash Safe" ? (
                      <>
                        <SelectItem value="Head Office Cash Safe">Head Office Cash Safe</SelectItem>
                        <SelectItem value="CEO Cash Safe">CEO Cash Safe</SelectItem>
                        <SelectItem value="Chairman Cash Safe">Chairman Cash Safe</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Eastern Bank PLC (Corporate Ops)">Eastern Bank PLC (Corporate Ops)</SelectItem>
                        <SelectItem value="Islami Bank Bangladesh PLC">Islami Bank Bangladesh PLC</SelectItem>
                        <SelectItem value="Standard Chartered Bank">Standard Chartered Bank</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Notes / Purpose Description</Label>
              <Input
                placeholder="Details of expense..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-8"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                {editingId ? "Save Changes" : "Save Payment Voucher"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Screen Preview Modal with Reliable Direct Print Button */}
      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white rounded-xl max-h-[95vh] overflow-y-auto">
          {printTarget && (
            <div className="space-y-6">
              <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-5 text-xs text-neutral-900">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 uppercase">AK PHARMA</h2>
                    <p className="text-[11px] text-slate-500">Official Expense Payment Voucher / Disbursement Slip</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#0090FF] block font-mono">{printTarget.voucherNo}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Date: {printTarget.paymentDate}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg">
                  <div>
                    <p className="text-slate-500 font-medium">Payee / Beneficiary:</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{printTarget.payeeName}</p>
                    <p className="text-slate-500 font-medium mt-3">Classification:</p>
                    <p className="font-semibold text-slate-800">{printTarget.category}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Disbursed From ({printTarget.fundingSource}):</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{printTarget.sourceDetail}</p>
                    <p className="text-slate-500 font-medium mt-3">Authorization Status:</p>
                    <p className="font-bold text-emerald-600">Settled & Disbursed</p>
                  </div>
                </div>

                <div className="space-y-2 border rounded-lg p-4">
                  <p className="font-bold text-slate-900 border-b pb-2">Expenditure Particulars</p>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 italic">"{printTarget.notes || "General operational expense disbursement."}"</span>
                    <span className="font-mono font-bold text-sm text-slate-900">৳{printTarget.amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Amount in Words:</span>
                  <strong className="italic text-slate-900">{numberToWordsBDT(printTarget.amount)}</strong>
                </div>

                <div className="flex justify-between pt-10 text-[11px] text-slate-500 border-t">
                  <div className="text-center">
                    <div className="w-36 border-b border-slate-400 mx-auto mb-1" />
                    <strong className="text-slate-900 block">Chief Executive Officer (CEO)</strong>
                    <span className="text-[9px]">Executive Approval</span>
                  </div>
                  <div className="text-center">
                    <div className="w-36 border-b border-slate-400 mx-auto mb-1" />
                    <strong className="text-slate-900 block">Managing Director (MD)</strong>
                    <span className="text-[9px]">Final Financial Sign-off</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pb-2">
                <Button variant="outline" onClick={() => setIsPrintOpen(false)} className="text-xs">Close</Button>
                <Button onClick={() => handlePrint(printTarget)} className="bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs gap-1.5">
                  <Printer className="h-4 w-4" /> Print Voucher
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    
  );
  
};
