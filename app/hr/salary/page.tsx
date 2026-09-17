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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Banknote,
  Plus,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Printer,
  Pencil,
  Building,
  Home,
  HeartPulse,
  Car,
  TrendingUp,
  Receipt,
  UserPlus,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Print stylesheet                                                    */
/* ------------------------------------------------------------------ */
/*
 * Kept as a plain <style> tag (injected via dangerouslySetInnerHTML) so it
 * works in any React setup, not just Next.js with styled-jsx.
 *
 * Note the double backslash in `.print\\:hidden` — inside a JS template
 * literal a single `\:` collapses to `:`, which produces the invalid
 * selector `.print:hidden` and invalidates the entire comma-separated rule.
 */
const PRINT_STYLES = `
@page {
  size: A4;
  margin: 12mm;
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

  /* Hide everything, then reveal only the payslip subtree.
     Using visibility (not display) keeps Radix's portal ancestors in the
     layout tree, so the dialog itself is still rendered. */
  body * {
    visibility: hidden !important;
  }

  .print-payslip-node,
  .print-payslip-node * {
    visibility: visible !important;
  }

  /* The actual fix for the cropping: shadcn/Radix centres DialogContent with
     left-1/2 top-1/2 + translate(-50%, -50%). Overriding left/top alone left
     the transform in place, pulling the sheet off the top-left of the page. */
  .print-payslip-node {
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

  /* The inner scroll container has to expand, otherwise only the slice that
     was visible on screen makes it onto the page. */
  .print-payslip-body {
    overflow: visible !important;
    max-height: none !important;
    height: auto !important;
  }

  /* Radix overlay / backdrop and the dialog's own close button */
  [data-radix-popper-content-wrapper],
  .print-payslip-node > button[type="button"][class*="absolute"] {
    display: none !important;
  }

  .print\\:hidden,
  button {
    display: none !important;
  }

  table,
  tr,
  td,
  th {
    page-break-inside: avoid;
  }
}
`;

// Mock Directory of Enrolled Employees (Shared from Staff Directory)
const staffDirectoryList = [
  { empId: "EMP-2041", fullName: "Rafiqul Islam", designation: "Senior MIO", department: "Field Force", territory: "Dhaka North Hub", defaultBank: "Eastern Bank PLC" },
  { empId: "EMP-2042", fullName: "Tanvir Ahmed", designation: "MIO", department: "Field Force", territory: "Dhaka South Hub", defaultBank: "Islami Bank Bangladesh" },
  { empId: "EMP-2030", fullName: "Nazmul Huda Chowdhury", designation: "Regional Sales Manager", department: "Sales Management", territory: "Central Division HQ", defaultBank: "BRAC Bank PLC" },
  { empId: "EMP-2045", fullName: "Kamrul Hasan", designation: "MIO", department: "Field Force", territory: "Chittagong Central", defaultBank: "Standard Chartered" },
  { empId: "EMP-2051", fullName: "Enamul Haque", designation: "Junior MIO", department: "Field Force", territory: "Sylhet Sadar", defaultBank: "Eastern Bank PLC" },
  { empId: "EMP-2058", fullName: "Sabbir Hossain", designation: "MIO", department: "Field Force", territory: "Rajshahi Metro", defaultBank: "BRAC Bank PLC" },
  { empId: "EMP-2018", fullName: "Dr. Sumaiya Akhtar", designation: "Head of QA & Compliance", department: "Quality Assurance", territory: "Plant 01 Labs", defaultBank: "Eastern Bank PLC" },
];

interface EmployeeSalary {
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
  status: "Draft" | "Approved" | "Disbursed";
}

const initialSalaries: EmployeeSalary[] = [
  {
    id: "sal-1",
    empId: "EMP-2041",
    fullName: "Rafiqul Islam",
    designation: "Senior MIO",
    department: "Field Force",
    territory: "Dhaka North Hub",
    bankName: "Eastern Bank PLC",
    bankAccount: "104-102-449102",
    payPeriod: "September 2026",
    basicSalary: 26000,
    houseRent: 13000,
    medicalAllowance: 4000,
    conveyanceTaDa: 18400,
    salesIncentive: 15000,
    specialBonus: 2500,
    providentFund: 2600,
    taxDeduction: 1500,
    otherDeductions: 0,
    status: "Disbursed",
  },
  {
    id: "sal-2",
    empId: "EMP-2042",
    fullName: "Tanvir Ahmed",
    designation: "MIO",
    department: "Field Force",
    territory: "Dhaka South Hub",
    bankName: "Islami Bank Bangladesh",
    bankAccount: "205-019-338104",
    payPeriod: "September 2026",
    basicSalary: 22000,
    houseRent: 11000,
    medicalAllowance: 3500,
    conveyanceTaDa: 16200,
    salesIncentive: 9500,
    specialBonus: 0,
    providentFund: 2200,
    taxDeduction: 1000,
    otherDeductions: 0,
    status: "Approved",
  },
  {
    id: "sal-3",
    empId: "EMP-2030",
    fullName: "Nazmul Huda Chowdhury",
    designation: "Regional Sales Manager",
    department: "Sales Management",
    territory: "Central Division HQ",
    bankName: "BRAC Bank PLC",
    bankAccount: "150-120-994821",
    payPeriod: "September 2026",
    basicSalary: 55000,
    houseRent: 25000,
    medicalAllowance: 6000,
    conveyanceTaDa: 22000,
    salesIncentive: 25000,
    specialBonus: 10000,
    providentFund: 5500,
    taxDeduction: 7500,
    otherDeductions: 0,
    status: "Approved",
  },
];

export default function SalaryManagementPage() {
  const [salaries, setSalaries] = React.useState<EmployeeSalary[]>(initialSalaries);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("all");

  // Assign New Salary Modal State
  const [isAssignOpen, setIsAssignOpen] = React.useState(false);
  const [selectedStaffEmpId, setSelectedStaffEmpId] = React.useState("");
  const [newBasic, setNewBasic] = React.useState("25000");
  const [newHouseRent, setNewHouseRent] = React.useState("12500");
  const [newMedical, setNewMedical] = React.useState("3500");
  const [newConveyance, setNewConveyance] = React.useState("15000");
  const [newIncentive, setNewIncentive] = React.useState("5000");
  const [newBonus, setNewBonus] = React.useState("0");
  const [newPf, setNewPf] = React.useState("2500");
  const [newTax, setNewTax] = React.useState("1000");
  const [newBankAccount, setNewBankAccount] = React.useState("");

  // Edit & Print Preview Modals
  const [editingRecord, setEditingRecord] = React.useState<EmployeeSalary | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [printRecord, setPrintRecord] = React.useState<EmployeeSalary | null>(null);
  const [isPrintOpen, setIsPrintOpen] = React.useState(false);
  const [successToast, setSuccessToast] = React.useState<string | null>(null);

  // Helper Computations
  const getGrossEarnings = (r: EmployeeSalary) =>
    r.basicSalary + r.houseRent + r.medicalAllowance + r.conveyanceTaDa + r.salesIncentive + r.specialBonus;

  const getTotalDeductions = (r: EmployeeSalary) =>
    r.providentFund + r.taxDeduction + r.otherDeductions;

  const getNetPayable = (r: EmployeeSalary) =>
    getGrossEarnings(r) - getTotalDeductions(r);

  // Filter staff who don't have an active salary record yet
  const unassignedStaff = staffDirectoryList.filter(
    (staff) => !salaries.some((sal) => sal.empId === staff.empId)
  );

  const handleAssignSalary = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffDirectoryList.find((s) => s.empId === selectedStaffEmpId);
    if (!staff) return;

    const newSalaryRecord: EmployeeSalary = {
      id: `sal-${Date.now()}`,
      empId: staff.empId,
      fullName: staff.fullName,
      designation: staff.designation,
      department: staff.department,
      territory: staff.territory,
      bankName: staff.defaultBank,
      bankAccount: newBankAccount || "104-102-000000",
      payPeriod: "September 2026",
      basicSalary: parseFloat(newBasic) || 0,
      houseRent: parseFloat(newHouseRent) || 0,
      medicalAllowance: parseFloat(newMedical) || 0,
      conveyanceTaDa: parseFloat(newConveyance) || 0,
      salesIncentive: parseFloat(newIncentive) || 0,
      specialBonus: parseFloat(newBonus) || 0,
      providentFund: parseFloat(newPf) || 0,
      taxDeduction: parseFloat(newTax) || 0,
      otherDeductions: 0,
      status: "Draft",
    };

    setSalaries((prev) => [newSalaryRecord, ...prev]);
    setSelectedStaffEmpId("");
    setNewBankAccount("");
    setIsAssignOpen(false);
    showNotification(`Assigned salary structure successfully for ${staff.fullName}`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setSalaries((prev) =>
      prev.map((item) => (item.id === editingRecord.id ? editingRecord : item))
    );
    setIsEditOpen(false);
    setEditingRecord(null);
    showNotification(`Updated remuneration structure for ${editingRecord.fullName}`);
  };

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  /*
   * Wait for the dialog to finish opening/animating before handing control to
   * the browser's print dialog, otherwise a fast click can capture a blank or
   * half-transformed sheet.
   */
  const handleTriggerPrint = () => {
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 60);
    });
  };

  const handleExportExcel = () => {
    const exportData = salaries.map((r) => ({
      "Employee ID": r.empId,
      "Full Name": r.fullName,
      Designation: r.designation,
      Department: r.department,
      Territory: r.territory,
      "Basic Salary": r.basicSalary,
      "House Rent": r.houseRent,
      "Medical Allowance": r.medicalAllowance,
      "Conveyance / TA-DA": r.conveyanceTaDa,
      "Sales Incentive": r.salesIncentive,
      "Special Bonus": r.specialBonus,
      "Gross Total": getGrossEarnings(r),
      "Provident Fund": r.providentFund,
      "Tax Deduction": r.taxDeduction,
      "Total Deductions": getTotalDeductions(r),
      "Net Payable": getNetPayable(r),
      Status: r.status,
      "Bank Account": `${r.bankName} - ${r.bankAccount}`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Salaries & Benefits");
    XLSX.writeFile(workbook, `AK_Pharma_Payroll_Benefits_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredSalaries = salaries.filter((item) => {
    const matchesSearch =
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.territory.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      departmentFilter === "all" || item.department.toLowerCase() === departmentFilter.toLowerCase();

    return matchesSearch && matchesDept;
  });

  const totalNetPayroll = salaries.reduce((acc, curr) => acc + getNetPayable(curr), 0);
  const totalIncentives = salaries.reduce((acc, curr) => acc + curr.salesIncentive + curr.specialBonus, 0);
  const totalAllowances = salaries.reduce((acc, curr) => acc + curr.houseRent + curr.medicalAllowance + curr.conveyanceTaDa, 0);

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* Print styles — plain <style> so it works outside Next.js too */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* Toast Alert */}
      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-bold print:hidden">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Salary, Benefits & Incentive Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure compensation packages for enrolled staff, adjust housing subsidies, and generate printable payslips.
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
            Export Payroll Matrix
          </Button>

          {/* Assign Salary to Enrolled Staff Dialog */}
          <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none">
                <UserPlus className="h-4 w-4" />
                Assign Salary to Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[580px] bg-white rounded-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Assign Salary Package to Enrolled Staff
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Select an employee from the Staff Directory to configure their remuneration structure.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAssignSalary} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Select Employee from Directory</Label>
                  <Select value={selectedStaffEmpId} onValueChange={setSelectedStaffEmpId} required>
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue placeholder="Choose staff member..." />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {unassignedStaff.length > 0 ? (
                        unassignedStaff.map((s) => (
                          <SelectItem key={s.empId} value={s.empId}>
                            {s.fullName} ({s.empId}) — {s.designation} [{s.territory}]
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          All enrolled staff already have active salary records
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Bank Account Number</Label>
                  <Input
                    placeholder="e.g. 104-102-998822"
                    value={newBankAccount}
                    onChange={(e) => setNewBankAccount(e.target.value)}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>

                {/* Base & Fixed Subsidies */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Base Salary & Subsidies
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">Basic Pay (৳)</Label>
                      <Input
                        type="number"
                        value={newBasic}
                        onChange={(e) => setNewBasic(e.target.value)}
                        required
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">House Rent (৳)</Label>
                      <Input
                        type="number"
                        value={newHouseRent}
                        onChange={(e) => setNewHouseRent(e.target.value)}
                        required
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">Medical (৳)</Label>
                      <Input
                        type="number"
                        value={newMedical}
                        onChange={(e) => setNewMedical(e.target.value)}
                        required
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Field Conveyance & Incentives */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Field Conveyance & Incentives
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">Conveyance / TA-DA (৳)</Label>
                      <Input
                        type="number"
                        value={newConveyance}
                        onChange={(e) => setNewConveyance(e.target.value)}
                        required
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">Quota Incentive (৳)</Label>
                      <Input
                        type="number"
                        value={newIncentive}
                        onChange={(e) => setNewIncentive(e.target.value)}
                        className="h-8 text-xs font-mono text-emerald-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">Special Bonus (৳)</Label>
                      <Input
                        type="number"
                        value={newBonus}
                        onChange={(e) => setNewBonus(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Deductions
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">Provident Fund (৳)</Label>
                      <Input
                        type="number"
                        value={newPf}
                        onChange={(e) => setNewPf(e.target.value)}
                        className="h-8 text-xs font-mono text-rose-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">Tax Withholding (৳)</Label>
                      <Input
                        type="number"
                        value={newTax}
                        onChange={(e) => setNewTax(e.target.value)}
                        className="h-8 text-xs font-mono text-rose-500"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAssignOpen(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!selectedStaffEmpId} className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                    Save Salary Structure
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 print:hidden">
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Net Take-Home Pool</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            ৳{totalNetPayroll.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Across {salaries.length} active employee files
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Subsidies (Rent, Med, TA)</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Home className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            ৳{totalAllowances.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Includes living & conveyance allocations
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Incentives & Bonuses</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-emerald-600 leading-none font-mono">
            ৳{totalIncentives.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-3">
            Target achievement rewards
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Unconfigured Directory Staff</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-amber-700 bg-amber-50 border-amber-200 px-2 py-0.5 rounded-md">
              Action Required
            </Badge>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {unassignedStaff.length} Employees
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Enrolled without salary structure
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 print:hidden">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search employee name, ID, or territory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="field force">Field Force</SelectItem>
              <SelectItem value="sales management">Sales Management</SelectItem>
              <SelectItem value="quality assurance">Quality Assurance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Main Editable Roster Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              EMPLOYEE COMPENSATION & ALLOWANCE BREAKDOWN
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Modify basic pay, rent subsidies, field conveyance, and preview professional payslips
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredSalaries.length} Configured Structures
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Employee</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Basic Pay</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">House Rent</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Medical</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">TA / DA</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Incentive</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Deductions</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Net Take-Home</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSalaries.map((emp) => {
              const deductions = getTotalDeductions(emp);
              const net = getNetPayable(emp);

              return (
                <TableRow key={emp.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <TableCell className="py-3 pl-0">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 rounded-full border border-slate-200">
                        <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">
                          {emp.fullName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <span className="text-xs font-bold text-slate-900 block">{emp.fullName}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {emp.designation} • {emp.territory}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono text-slate-700">
                    ৳{emp.basicSalary.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono text-slate-700">
                    ৳{emp.houseRent.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono text-slate-700">
                    ৳{emp.medicalAllowance.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono text-slate-700">
                    ৳{emp.conveyanceTaDa.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono font-semibold text-emerald-600">
                    {emp.salesIncentive + emp.specialBonus > 0
                      ? `+৳${(emp.salesIncentive + emp.specialBonus).toLocaleString("en-IN")}`
                      : "—"}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono text-rose-500">
                    -৳{deductions.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                    ৳{net.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right pr-0">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRecord({ ...emp });
                          setIsEditOpen(true);
                        }}
                        className="h-7 px-2.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 gap-1"
                      >
                        <Pencil className="h-3 w-3 text-slate-400" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPrintRecord(emp);
                          setIsPrintOpen(true);
                        }}
                        className="h-7 px-2.5 text-xs text-[#0090FF] border-blue-200 hover:bg-blue-50 gap-1 font-semibold"
                      >
                        <Printer className="h-3 w-3" />
                        Payslip
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Comprehensive Structure & Benefit Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[620px] bg-white rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Salary & Benefit Configuration
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update base remuneration, housing subsidies, field allowances, and performance bonus tiers.
            </DialogDescription>
          </DialogHeader>

          {editingRecord && (
            <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{editingRecord.fullName}</span>
                  <span className="text-slate-500">{editingRecord.designation} • {editingRecord.territory}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-slate-600 block">{editingRecord.bankName}</span>
                  <span className="font-mono text-[10px] text-slate-400">{editingRecord.bankAccount}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Fixed Earnings & Subsidies
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Basic Salary (৳)</Label>
                    <Input
                      type="number"
                      value={editingRecord.basicSalary}
                      onChange={(e) =>
                        setEditingRecord({ ...editingRecord, basicSalary: Number(e.target.value) || 0 })
                      }
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">House Rent (৳)</Label>
                    <Input
                      type="number"
                      value={editingRecord.houseRent}
                      onChange={(e) =>
                        setEditingRecord({ ...editingRecord, houseRent: Number(e.target.value) || 0 })
                      }
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Medical Subsidy (৳)</Label>
                    <Input
                      type="number"
                      value={editingRecord.medicalAllowance}
                      onChange={(e) =>
                        setEditingRecord({ ...editingRecord, medicalAllowance: Number(e.target.value) || 0 })
                      }
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Field Allowances & Incentives
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Conveyance / TA-DA (৳)</Label>
                    <Input
                      type="number"
                      value={editingRecord.conveyanceTaDa}
                      onChange={(e) =>
                        setEditingRecord({ ...editingRecord, conveyanceTaDa: Number(e.target.value) || 0 })
                      }
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Sales Quota Incentive (৳)</Label>
                    <Input
                      type="number"
                      value={editingRecord.salesIncentive}
                      onChange={(e) =>
                        setEditingRecord({ ...editingRecord, salesIncentive: Number(e.target.value) || 0 })
                      }
                      className="h-8 text-xs font-mono text-emerald-600 font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Special Bonus (৳)</Label>
                    <Input
                      type="number"
                      value={editingRecord.specialBonus}
                      onChange={(e) =>
                        setEditingRecord({ ...editingRecord, specialBonus: Number(e.target.value) || 0 })
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Statutory & Advance Deductions
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Provident Fund (PF) (৳)</Label>
                    <Input
                      type="number"
                      value={editingRecord.providentFund}
                      onChange={(e) =>
                        setEditingRecord({ ...editingRecord, providentFund: Number(e.target.value) || 0 })
                      }
                      className="h-8 text-xs font-mono text-rose-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Tax Withholding (৳)</Label>
                    <Input
                      type="number"
                      value={editingRecord.taxDeduction}
                      onChange={(e) =>
                        setEditingRecord({ ...editingRecord, taxDeduction: Number(e.target.value) || 0 })
                      }
                      className="h-8 text-xs font-mono text-rose-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Other Deductions (৳)</Label>
                    <Input
                      type="number"
                      value={editingRecord.otherDeductions}
                      onChange={(e) =>
                        setEditingRecord({ ...editingRecord, otherDeductions: Number(e.target.value) || 0 })
                      }
                      className="h-8 text-xs font-mono text-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Recalculated Gross Remuneration</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    ৳{getGrossEarnings(editingRecord).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Updated Net Disbursed Payout</span>
                  <span className="font-mono font-bold text-[#0090FF] text-base">
                    ৳{getNetPayable(editingRecord).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="h-8 text-xs">
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

      {/* 6. Formatted Printable Payslip Preview Dialog */}
      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent className="print-payslip-node sm:max-w-[680px] bg-white rounded-xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
          {printRecord && (
            <>
              <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between print:hidden">
                <span className="text-xs font-bold text-slate-700">Official Payslip Preview</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleTriggerPrint}
                    className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white gap-1.5 shadow-none"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print / Save PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPrintOpen(false)}
                    className="h-8 text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* print-payslip-body: the print stylesheet expands this scroll
                  container so the full payslip reaches the page. */}
              <div className="print-payslip-body p-5 text-slate-900 font-sans overflow-y-auto space-y-3 text-[11px]">
                <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight uppercase">AK PHARMA</h2>
                    <p className="text-[10px] text-slate-500">Corporate Headquarters & Pharmaceuticals Division</p>
                    <p className="text-[9px] text-slate-400">Dhaka, Bangladesh</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-800">PAYSLIP ADVICE</span>
                    <span className="text-[11px] font-mono font-medium text-[#0090FF] block mt-0.5">{printRecord.payPeriod}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 border-b border-slate-200 text-[11px]">
                  <div className="space-y-0.5">
                    <div><span className="text-slate-400">Employee Name: </span><strong>{printRecord.fullName}</strong></div>
                    <div><span className="text-slate-400">Employee ID: </span><span className="font-mono font-semibold">{printRecord.empId}</span></div>
                    <div><span className="text-slate-400">Designation: </span>{printRecord.designation}</div>
                    <div><span className="text-slate-400">Department: </span>{printRecord.department}</div>
                  </div>
                  <div className="space-y-0.5 text-right sm:text-left">
                    <div><span className="text-slate-400">Assigned Hub: </span>{printRecord.territory}</div>
                    <div><span className="text-slate-400">Disbursing Bank: </span>{printRecord.bankName}</div>
                    <div><span className="text-slate-400">A/C Number: </span><span className="font-mono">{printRecord.bankAccount}</span></div>
                    <div><span className="text-slate-400">Payment Status: </span><span className="font-semibold text-emerald-700">{printRecord.status}</span></div>
                  </div>
                </div>

                <div className="py-1 text-[11px]">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-300 text-[10px]">
                        Earnings & Allowances
                      </h4>
                      <table className="w-full mt-1.5 text-[11px]">
                        <tbody>
                          <tr className="border-b border-slate-100"><td className="py-1 text-slate-600">Basic Pay</td><td className="text-right font-mono font-medium">৳{printRecord.basicSalary.toLocaleString("en-IN")}</td></tr>
                          <tr className="border-b border-slate-100"><td className="py-1 text-slate-600">House Rent Allowance</td><td className="text-right font-mono font-medium">৳{printRecord.houseRent.toLocaleString("en-IN")}</td></tr>
                          <tr className="border-b border-slate-100"><td className="py-1 text-slate-600">Medical Subsidy</td><td className="text-right font-mono font-medium">৳{printRecord.medicalAllowance.toLocaleString("en-IN")}</td></tr>
                          <tr className="border-b border-slate-100"><td className="py-1 text-slate-600">Conveyance / Field TA-DA</td><td className="text-right font-mono font-medium">৳{printRecord.conveyanceTaDa.toLocaleString("en-IN")}</td></tr>
                          <tr className="border-b border-slate-100"><td className="py-1 text-slate-600">Sales Quota Incentive</td><td className="text-right font-mono font-medium text-emerald-700">+৳{printRecord.salesIncentive.toLocaleString("en-IN")}</td></tr>
                          {printRecord.specialBonus > 0 && (
                            <tr className="border-b border-slate-100"><td className="py-1 text-slate-600">Special Bonus</td><td className="text-right font-mono font-medium text-emerald-700">+৳{printRecord.specialBonus.toLocaleString("en-IN")}</td></tr>
                          )}
                          <tr className="font-bold"><td className="pt-1.5">Total Gross Earnings</td><td className="text-right font-mono pt-1.5">৳{getGrossEarnings(printRecord).toLocaleString("en-IN")}</td></tr>
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <h4 className="font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-300 text-[10px]">
                        Statutory Deductions
                      </h4>
                      <table className="w-full mt-1.5 text-[11px]">
                        <tbody>
                          <tr className="border-b border-slate-100"><td className="py-1 text-slate-600">Provident Fund (PF)</td><td className="text-right font-mono font-medium text-rose-600">৳{printRecord.providentFund.toLocaleString("en-IN")}</td></tr>
                          <tr className="border-b border-slate-100"><td className="py-1 text-slate-600">Tax Withheld (TDS)</td><td className="text-right font-mono font-medium text-rose-600">৳{printRecord.taxDeduction.toLocaleString("en-IN")}</td></tr>
                          {printRecord.otherDeductions > 0 && (
                            <tr className="border-b border-slate-100"><td className="py-1 text-slate-600">Other Adjustments</td><td className="text-right font-mono font-medium text-rose-600">৳{printRecord.otherDeductions.toLocaleString("en-IN")}</td></tr>
                          )}
                          <tr className="font-bold"><td className="pt-1.5">Total Deductions</td><td className="text-right font-mono pt-1.5 text-rose-600">৳{getTotalDeductions(printRecord).toLocaleString("en-IN")}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="mt-2 p-2.5 border-2 border-slate-900 bg-slate-50 flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wide text-[11px]">Net Disbursed Take-Home Pay</span>
                  <span className="text-sm font-mono font-extrabold text-[#0090FF]">
                    ৳{getNetPayable(printRecord).toLocaleString("en-IN")}/-
                  </span>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="text-center">
                    <div className="w-28 border-b border-slate-300 mb-1 mx-auto" />
                    <span>Prepared By (HR)</span>
                  </div>
                  <div className="text-center">
                    <div className="w-28 border-b border-slate-300 mb-1 mx-auto" />
                    <span>Checked By (Accounts)</span>
                  </div>
                  <div className="text-center">
                    <div className="w-28 border-b border-slate-300 mb-1 mx-auto" />
                    <span>Employee Signature</span>
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