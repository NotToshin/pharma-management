"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Printer,
  Pencil,
  Trash2,
  UserPlus,
  Calendar,
  CheckCircle2,
  Search,
} from "lucide-react";

const PRINT_STYLES = `
@page { size: A4; margin: 12mm; }
@media print {
  html, body { height: auto !important; overflow: visible !important; background: #ffffff !important; }
  body * { visibility: hidden !important; }
  .print-payslip-node, .print-payslip-node * { visibility: visible !important; }
  .print-payslip-node {
    position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; background: #ffffff !important;
  }
  .print\\:hidden, button { display: none !important; }
}
`;

export interface EmployeeSalary {
  id: string;
  empId: string;
  fullName: string;
  designation: string;
  department: string;
  territory: string;
  bankName: string;
  bankAccount: string;
  payPeriod: string;
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  conveyanceTaDa: number;
  salesIncentive: number;
  specialBonus: number;
  providentFund: number;
  taxDeduction: number;
  otherDeductions: number;
  leaveDays: number;
  status: "Draft" | "Approved" | "Disbursed";
}

const generateDynamicMonths = () => {
  const months: string[] = [];
  const currentDate = new Date();

  for (let i = -6; i <= 6; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const monthName = d.toLocaleString('en-US', { month: 'long' });
    const year = d.getFullYear();
    months.push(`${monthName} ${year}`);
  }

  return months;
};

const MONTHS_LIST = generateDynamicMonths();

const getCurrentMonthString = () => {
  const d = new Date();
  return `${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`;
};

export default function SalaryManagementPage() {
  const [salaries, setSalaries] = React.useState<EmployeeSalary[]>([]);
  const [staffDirectory, setStaffDirectory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMonth, setSelectedMonth] = React.useState(getCurrentMonthString());
  const [searchQuery, setSearchQuery] = React.useState("");

  const [isAssignOpen, setIsAssignOpen] = React.useState(false);
  const [selectedStaffEmpId, setSelectedStaffEmpId] = React.useState("");
  
  // Assign Form State
  const [salaryFormState, setSalaryFormState] = React.useState({
    basicSalary: "25000",
    houseRent: "12500",
    medicalAllowance: "3500",
    conveyanceTaDa: "15000",
    salesIncentive: "5000",
    specialBonus: "0",
    providentFund: "2500",
    taxDeduction: "1000",
    otherDeductions: "0",
    leaveDays: 0,
    bankAccount: "104-102-000000",
  });

  const handleSalaryFormChange = (field: string, value: any) => {
    setSalaryFormState((prev) => ({ ...prev, [field]: value }));
  };

  const [editingRecord, setEditingRecord] = React.useState<EmployeeSalary | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const [printRecord, setPrintRecord] = React.useState<EmployeeSalary | null>(null);
  const [isPrintOpen, setIsPrintOpen] = React.useState(false);
  const [successToast, setSuccessToast] = React.useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

      const [staffRes, salaryRes] = await Promise.all([
        fetch(`${API_URL}/staff`),
        fetch(`${API_URL}/salary?month=${encodeURIComponent(selectedMonth)}`)
      ]);

      const staffRaw = staffRes.ok ? await staffRes.json() : [];
      const salaryRaw = salaryRes.ok ? await salaryRes.json() : [];

      const staffData = Array.isArray(staffRaw) ? staffRaw : [];
      const salaryData = Array.isArray(salaryRaw) ? salaryRaw : [];

      setStaffDirectory(staffData.map((s: any) => ({
        empId: s.empId,
        fullName: s.fullName,
        designation: s.role?.name || s.department || "Staff",
        department: s.department || "General",
        territory: s.territory || "Dhaka HQ",
      })));

      setSalaries(salaryData.map((sal: any) => ({
        id: String(sal.id),
        empId: String(sal.staff?.empId || ""),
        fullName: String(sal.staff?.fullName || "Staff Member"),
        designation: String(sal.staff?.role?.name || sal.staff?.department || "Staff"),
        department: String(sal.staff?.department || "General"),
        territory: String(sal.staff?.territory || "Dhaka HQ"),
        bankName: String(sal.bankName || "Eastern Bank PLC"),
        bankAccount: String(sal.bankAccount || "104-102-000000"),
        payPeriod: String(sal.payPeriod || selectedMonth),
        basicSalary: Number(sal.baseSalary) || 0,
        houseRent: Number(sal.houseRent) || 0,
        medicalAllowance: Number(sal.medicalAllowance) || 0,
        conveyanceTaDa: Number(sal.conveyanceTaDa) || 0,
        salesIncentive: Number(sal.salesIncentive) || 0,
        specialBonus: Number(sal.specialBonus) || 0,
        providentFund: Number(sal.providentFund) || 0,
        taxDeduction: Number(sal.taxDeduction) || 0,
        otherDeductions: Number(sal.otherDeductions) || 0,
        leaveDays: Number(sal.leaveDays) || 0,
        status: "Draft",
      })));
      setLoading(false);
    } catch (err) {
      console.error("Error fetching payroll data:", err);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const getGross = (r: { basicSalary: number; houseRent: number; medicalAllowance: number; conveyanceTaDa: number; salesIncentive: number; specialBonus: number }) =>
    r.basicSalary + r.houseRent + r.medicalAllowance + r.conveyanceTaDa + r.salesIncentive + r.specialBonus;

  const getDeductions = (r: { providentFund: number; taxDeduction: number; otherDeductions: number }) =>
    r.providentFund + r.taxDeduction + r.otherDeductions;

  const getNet = (r: any) => getGross(r) - getDeductions(r);

  const unassignedStaff = staffDirectory.filter(
    (staff) => !salaries.some((sal) => sal.empId === staff.empId)
  );

  const handleAssignSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffDirectory.find((s) => s.empId === selectedStaffEmpId);
    if (!staff) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/salary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId: staff.empId,
          payPeriod: selectedMonth,
          baseSalary: parseFloat(salaryFormState.basicSalary) || 0,
          houseRent: parseFloat(salaryFormState.houseRent) || 0,
          medicalAllowance: parseFloat(salaryFormState.medicalAllowance) || 0,
          conveyanceTaDa: parseFloat(salaryFormState.conveyanceTaDa) || 0,
          salesIncentive: parseFloat(salaryFormState.salesIncentive) || 0,
          specialBonus: parseFloat(salaryFormState.specialBonus) || 0,
          providentFund: parseFloat(salaryFormState.providentFund) || 0,
          taxDeduction: parseFloat(salaryFormState.taxDeduction) || 0,
          otherDeductions: parseFloat(salaryFormState.otherDeductions) || 0,
          leaveDays: Number(salaryFormState.leaveDays) || 0,
          bankAccount: salaryFormState.bankAccount || "104-102-000000",
        }),
      });

      if (!res.ok) throw new Error("Failed to save salary");
      setIsAssignOpen(false);
      setSelectedStaffEmpId("");
      fetchData();
      setSuccessToast(`Assigned salary structure successfully for ${staff.fullName}`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      alert("Failed to save salary record.");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/salary/${editingRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseSalary: editingRecord.basicSalary,
          houseRent: editingRecord.houseRent,
          medicalAllowance: editingRecord.medicalAllowance,
          conveyanceTaDa: editingRecord.conveyanceTaDa,
          salesIncentive: editingRecord.salesIncentive,
          specialBonus: editingRecord.specialBonus,
          providentFund: editingRecord.providentFund,
          taxDeduction: editingRecord.taxDeduction,
          otherDeductions: editingRecord.otherDeductions,
          leaveDays: editingRecord.leaveDays,
        }),
      });

      if (!res.ok) throw new Error("Failed to update salary");
      setIsEditOpen(false);
      setEditingRecord(null);
      fetchData();
      setSuccessToast("Salary structure updated successfully.");
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      alert("Failed to update salary.");
    }
  };

  const handleDeleteSalary = async (id: string) => {
    if (!confirm("Are you sure you want to delete this salary record for this month?")) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/salary/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchData();
      setSuccessToast("Salary record deleted successfully.");
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      alert("Failed to delete salary record.");
    }
  };

  const handleTriggerPrint = () => {
    if (!printRecord) return;

    const existingIframe = document.getElementById("payslip-print-iframe");
    if (existingIframe) existingIframe.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "payslip-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const grossEarnings = printRecord.basicSalary + printRecord.houseRent + printRecord.medicalAllowance + printRecord.conveyanceTaDa + printRecord.salesIncentive + printRecord.specialBonus;
    const totalDeductions = printRecord.providentFund + printRecord.taxDeduction + printRecord.otherDeductions;
    const netPayable = grossEarnings - totalDeductions;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${printRecord.fullName} - ${printRecord.payPeriod}</title>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; color: #1e293b; padding: 30px; margin: 0; background: #ffffff; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #cbd5e1; padding-bottom: 15px; margin-bottom: 20px; }
            .company { font-size: 20px; font-weight: bold; color: #0f172a; }
            .subtitle { font-size: 12px; color: #64748b; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; }
            .sections { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 12px; margin-bottom: 20px; }
            .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
            .box-title { font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .net-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; color: #1e40af; margin-bottom: 20px; }
            .leave-info { font-size: 11px; color: #475569; margin-bottom: 30px; padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
            .signatures { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .mono { font-family: monospace; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company">AK PHARMA LTD.</div>
              <div class="subtitle">Official Monthly Pay Advice & Salary Payslip</div>
            </div>
            <div class="text-right">
              <div style="font-weight: bold; color: #0090FF;">${printRecord.payPeriod}</div>
              <div class="subtitle mono">Ref: AKP/${printRecord.empId}/SAL</div>
            </div>
          </div>

          <div class="grid">
            <div>
              <span style="color: #64748b;">Employee Name:</span><br/>
              <strong>${printRecord.fullName}</strong><br/><br/>
              <span style="color: #64748b;">Emp ID & Designation:</span><br/>
              <strong>${printRecord.empId} — ${printRecord.designation}</strong>
            </div>
            <div>
              <span style="color: #64748b;">Department & Territory:</span><br/>
              <strong>${printRecord.department} (${printRecord.territory})</strong><br/><br/>
              <span style="color: #64748b;">Disbursement Account:</span><br/>
              <strong class="mono">${printRecord.bankName} (${printRecord.bankAccount})</strong>
            </div>
          </div>

          <div class="sections">
            <div class="box">
              <div class="box-title">Earnings</div>
              <div class="row"><span>Basic Salary</span><span class="mono">৳${printRecord.basicSalary.toLocaleString("en-IN")}</span></div>
              <div class="row"><span>House Rent</span><span class="mono">৳${printRecord.houseRent.toLocaleString("en-IN")}</span></div>
              <div class="row"><span>Medical Allowance</span><span class="mono">৳${printRecord.medicalAllowance.toLocaleString("en-IN")}</span></div>
              <div class="row"><span>TA-DA Allowance</span><span class="mono">৳${printRecord.conveyanceTaDa.toLocaleString("en-IN")}</span></div>
              <div class="row"><span>Sales Incentive</span><span class="mono" style="color: #059669;">+৳${printRecord.salesIncentive.toLocaleString("en-IN")}</span></div>
              <div class="row"><span>Special Bonus</span><span class="mono" style="color: #059669;">+৳${printRecord.specialBonus.toLocaleString("en-IN")}</span></div>
            </div>

            <div class="box">
              <div class="box-title">Deductions</div>
              <div class="row"><span>Provident Fund</span><span class="mono" style="color: #e11d48;">৳${printRecord.providentFund.toLocaleString("en-IN")}</span></div>
              <div class="row"><span>Tax Deduction</span><span class="mono" style="color: #e11d48;">৳${printRecord.taxDeduction.toLocaleString("en-IN")}</span></div>
              <div class="row"><span>Other Deductions</span><span class="mono" style="color: #e11d48;">৳${printRecord.otherDeductions.toLocaleString("en-IN")}</span></div>
            </div>
          </div>

          <div class="leave-info">
            <strong>Attendance & Leave Note:</strong> Total Leave Days Recorded for ${printRecord.payPeriod}: <strong>${printRecord.leaveDays || 0} Days</strong>
          </div>

          <div class="net-box">
            <span>Net Payable Salary:</span>
            <span class="mono">৳${netPayable.toLocaleString("en-IN")}</span>
          </div>

          <div class="signatures">
            <span>Authorized Signature (HR & Finance)</span>
            <span>Employee Signature</span>
          </div>
        </body>
      </html>
    `;

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 300);
    }
  };

  const filtered = salaries.filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.empId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-bold print:hidden">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Salary & Monthly Payroll Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage month-isolated remuneration, allowances, deductions, and print payslips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <Calendar className="h-4 w-4 text-[#0090FF]" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-7 w-[140px] text-xs font-bold border-none bg-transparent shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                {MONTHS_LIST.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg">
                <UserPlus className="h-4 w-4" />
                Assign Salary ({selectedMonth})
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[580px] bg-white rounded-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Assign Salary Structure</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">Configure pay components for {selectedMonth}.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAssignSalary} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Staff Member</Label>
                  <Select value={selectedStaffEmpId} onValueChange={setSelectedStaffEmpId} required>
                    <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Select staff..." /></SelectTrigger>
                    <SelectContent className="text-xs">
                      {unassignedStaff.map((s) => (
                        <SelectItem key={s.empId} value={s.empId}>{s.fullName} ({s.empId})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">Basic (৳)</Label><Input type="number" value={salaryFormState.basicSalary} onChange={(e) => handleSalaryFormChange("basicSalary", e.target.value)} className="h-8 text-xs font-mono" required /></div>
                  <div><Label className="text-xs">Rent (৳)</Label><Input type="number" value={salaryFormState.houseRent} onChange={(e) => handleSalaryFormChange("houseRent", e.target.value)} className="h-8 text-xs font-mono" required /></div>
                  <div><Label className="text-xs">Medical (৳)</Label><Input type="number" value={salaryFormState.medicalAllowance} onChange={(e) => handleSalaryFormChange("medicalAllowance", e.target.value)} className="h-8 text-xs font-mono" required /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">TA-DA (৳)</Label><Input type="number" value={salaryFormState.conveyanceTaDa} onChange={(e) => handleSalaryFormChange("conveyanceTaDa", e.target.value)} className="h-8 text-xs font-mono" required /></div>
                  <div><Label className="text-xs">Incentive (৳)</Label><Input type="number" value={salaryFormState.salesIncentive} onChange={(e) => handleSalaryFormChange("salesIncentive", e.target.value)} className="h-8 text-xs font-mono text-emerald-600" /></div>
                  <div><Label className="text-xs">Bonus (৳)</Label><Input type="number" value={salaryFormState.specialBonus} onChange={(e) => handleSalaryFormChange("specialBonus", e.target.value)} className="h-8 text-xs font-mono" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">Provident Fund (৳)</Label><Input type="number" value={salaryFormState.providentFund} onChange={(e) => handleSalaryFormChange("providentFund", e.target.value)} className="h-8 text-xs font-mono text-rose-500" /></div>
                  <div><Label className="text-xs">Tax Deduction (৳)</Label><Input type="number" value={salaryFormState.taxDeduction} onChange={(e) => handleSalaryFormChange("taxDeduction", e.target.value)} className="h-8 text-xs font-mono text-rose-500" /></div>
                  <div><Label className="text-xs">Other Deductions (৳)</Label><Input type="number" value={salaryFormState.otherDeductions} onChange={(e) => handleSalaryFormChange("otherDeductions", e.target.value)} className="h-8 text-xs font-mono text-rose-500" /></div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Leave Days Taken</Label>
                  <Input
                    type="number"
                    min="0"
                    value={salaryFormState.leaveDays}
                    onChange={(e) => handleSalaryFormChange("leaveDays", Number(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAssignOpen(false)} className="h-8 text-xs">Cancel</Button>
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] text-white">Save Salary</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Salary Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">Payroll Register — {selectedMonth}</h3>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input placeholder="Search staff..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 w-[220px] text-xs" />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600">
              <TableHead className="pl-0">Employee</TableHead>
              <TableHead className="text-right">Basic</TableHead>
              <TableHead className="text-right">Rent</TableHead>
              <TableHead className="text-right">Medical</TableHead>
              <TableHead className="text-right">TA-DA</TableHead>
              <TableHead className="text-right">Incentive</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Leave Days</TableHead>
              <TableHead className="text-right">Net Payable</TableHead>
              <TableHead className="text-right pr-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={10} className="text-center py-6 text-slate-400">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-6 text-slate-400">No records found for {selectedMonth}.</TableCell></TableRow>
            ) : (
              filtered.map((emp) => {
                const ded = getDeductions(emp);
                const net = getNet(emp);
                return (
                  <TableRow key={emp.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <TableCell className="py-3 pl-0">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 rounded-full border border-slate-200">
                          <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">{emp.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{emp.fullName}</span>
                          <span className="text-[10px] text-slate-400">{emp.empId} — {emp.designation}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">৳{emp.basicSalary.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right font-mono">৳{emp.houseRent.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right font-mono">৳{emp.medicalAllowance.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right font-mono">৳{emp.conveyanceTaDa.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-600">+৳{(emp.salesIncentive + emp.specialBonus).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right font-mono text-rose-500">-৳{ded.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right font-mono text-slate-700">{emp.leaveDays || 0}d</TableCell>
                    <TableCell className="text-right font-mono font-bold text-slate-900">৳{net.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right pr-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => { setEditingRecord({ ...emp }); setIsEditOpen(true); }} className="h-7 px-2 text-xs">
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setPrintRecord(emp); setIsPrintOpen(true); }} className="h-7 px-2 text-xs text-[#0090FF]">
                          <Printer className="h-3 w-3 mr-1" /> Payslip
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteSalary(emp.id)} className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[650px] bg-white rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Edit Remuneration — {editingRecord?.fullName}</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Basic Salary (৳)</Label><Input type="number" value={editingRecord.basicSalary} onChange={(e) => setEditingRecord({ ...editingRecord, basicSalary: Number(e.target.value) })} className="h-8 text-xs font-mono" /></div>
                <div><Label className="text-xs">House Rent (৳)</Label><Input type="number" value={editingRecord.houseRent} onChange={(e) => setEditingRecord({ ...editingRecord, houseRent: Number(e.target.value) })} className="h-8 text-xs font-mono" /></div>
                <div><Label className="text-xs">Medical (৳)</Label><Input type="number" value={editingRecord.medicalAllowance} onChange={(e) => setEditingRecord({ ...editingRecord, medicalAllowance: Number(e.target.value) })} className="h-8 text-xs font-mono" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">TA-DA (৳)</Label><Input type="number" value={editingRecord.conveyanceTaDa} onChange={(e) => setEditingRecord({ ...editingRecord, conveyanceTaDa: Number(e.target.value) })} className="h-8 text-xs font-mono" /></div>
                <div><Label className="text-xs">Sales Incentive (৳)</Label><Input type="number" value={editingRecord.salesIncentive} onChange={(e) => setEditingRecord({ ...editingRecord, salesIncentive: Number(e.target.value) })} className="h-8 text-xs font-mono text-emerald-600" /></div>
                <div><Label className="text-xs">Special Bonus (৳)</Label><Input type="number" value={editingRecord.specialBonus} onChange={(e) => setEditingRecord({ ...editingRecord, specialBonus: Number(e.target.value) })} className="h-8 text-xs font-mono" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Provident Fund (৳)</Label><Input type="number" value={editingRecord.providentFund} onChange={(e) => setEditingRecord({ ...editingRecord, providentFund: Number(e.target.value) })} className="h-8 text-xs font-mono text-rose-500" /></div>
                <div><Label className="text-xs">Tax Deduction (৳)</Label><Input type="number" value={editingRecord.taxDeduction} onChange={(e) => setEditingRecord({ ...editingRecord, taxDeduction: Number(e.target.value) })} className="h-8 text-xs font-mono text-rose-500" /></div>
                <div><Label className="text-xs">Other Deductions (৳)</Label><Input type="number" value={editingRecord.otherDeductions} onChange={(e) => setEditingRecord({ ...editingRecord, otherDeductions: Number(e.target.value) })} className="h-8 text-xs font-mono text-rose-500" /></div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Leave Days Taken</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingRecord.leaveDays}
                  onChange={(e) => setEditingRecord({ ...editingRecord, leaveDays: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Calculated Net Payable:</span>
                <span className="text-sm font-mono text-[#0090FF]">৳{getNet(editingRecord).toLocaleString("en-IN")}</span>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="h-8 text-xs">Cancel</Button>
                <Button type="submit" className="h-8 text-xs bg-[#0090FF] text-white">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Print & Payslip Preview Modal */}
      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white rounded-xl max-h-[95vh] overflow-y-auto">
          {printRecord && (
            <div className="space-y-6">
              <div className="print-payslip-node p-8 bg-white border border-slate-200 rounded-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">AK PHARMA LTD.</h2>
                    <p className="text-[11px] text-slate-500">Official Monthly Pay Advice / Salary Payslip</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#0090FF] block">{printRecord.payPeriod}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Ref: AKP/{printRecord.empId}/SAL</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg">
                  <div>
                    <p className="text-slate-500">Employee Name:</p>
                    <p className="font-bold text-slate-900">{printRecord.fullName}</p>
                    <p className="text-slate-500 mt-2">Emp ID & Designation:</p>
                    <p className="font-semibold text-slate-800">{printRecord.empId} — {printRecord.designation}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Department & Territory:</p>
                    <p className="font-semibold text-slate-800">{printRecord.department} ({printRecord.territory})</p>
                    <p className="text-slate-500 mt-2">Disbursement Account:</p>
                    <p className="font-mono text-slate-800">{printRecord.bankName} ({printRecord.bankAccount})</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div className="space-y-2 border rounded-lg p-3">
                    <p className="font-bold text-slate-900 border-b pb-1">Earnings</p>
                    <div className="flex justify-between"><span>Basic Salary</span><span className="font-mono">৳{printRecord.basicSalary.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span>House Rent</span><span className="font-mono">৳{printRecord.houseRent.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span>Medical Allowance</span><span className="font-mono">৳{printRecord.medicalAllowance.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span>TA-DA Allowance</span><span className="font-mono">৳{printRecord.conveyanceTaDa.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span>Sales Incentive</span><span className="font-mono text-emerald-600">+৳{printRecord.salesIncentive.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span>Special Bonus</span><span className="font-mono text-emerald-600">+৳{printRecord.specialBonus.toLocaleString("en-IN")}</span></div>
                  </div>

                  <div className="space-y-2 border rounded-lg p-3">
                    <p className="font-bold text-slate-900 border-b pb-1">Deductions</p>
                    <div className="flex justify-between"><span>Provident Fund</span><span className="font-mono text-rose-500">৳{printRecord.providentFund.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span>Tax Deduction</span><span className="font-mono text-rose-500">৳{printRecord.taxDeduction.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span>Other Deductions</span><span className="font-mono text-rose-500">৳{printRecord.otherDeductions.toLocaleString("en-IN")}</span></div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 flex justify-between items-center">
                  <span>Attendance & Leave Recorded:</span>
                  <strong className="font-mono">{printRecord.leaveDays || 0} Days Taken</strong>
                </div>

                <div className="bg-[#0090FF]/10 p-4 rounded-lg flex items-center justify-between text-sm font-bold text-slate-900">
                  <span>Net Payable Salary:</span>
                  <span className="font-mono text-base text-[#0090FF]">৳{getNet(printRecord).toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between pt-8 text-[11px] text-slate-400 border-t">
                  <span>Authorized Signature (HR & Finance)</span>
                  <span>Employee Signature</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 print:hidden">
                <Button variant="outline" onClick={() => setIsPrintOpen(false)} className="text-xs">Close</Button>
                <Button onClick={handleTriggerPrint} className="bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs gap-1.5">
                  <Printer className="h-4 w-4" /> Print Payslip
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}