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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users2,
  Plus,
  Download,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Building2,
  Briefcase,
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
  Printer,
  Calendar,
  Clock,
  IdCard,
} from "lucide-react";

export interface Employee {
  id: string;
  empId: string;
  fullName: string;
  phone: string;
  fathersName: string;
  mothersName: string;
  address: string;
  nidNumber: string;
  email: string;
  designation: string;
  department: string;
  startDate: string;
  employmentStatus: "Active" | "Probationary" | "On Leave" | "Suspended";
  salary: number;
  supervisor: string;
  workSchedule: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
}

const initialEmployees: Employee[] = [
  {
    id: "emp-1",
    empId: "AKP-25001",
    fullName: "Mr. Ruhul Amin Redoy",
    phone: "+880 1611357885",
    fathersName: "Md. Mokbul Hossain",
    mothersName: "Mrs. Rokeya Begum",
    address: "Village+Post: Benotia PS-Shahzadpur Dist: Sirajgonj",
    nidNumber: "1994821049281",
    email: "hasanali@gmail.com",
    designation: "Medical Information Officer (MIO)",
    department: "Medical Information",
    startDate: "January 01, 2025",
    employmentStatus: "Probationary",
    salary: 20000,
    supervisor: "Toshin Bin Azad (Head of HR)",
    workSchedule: "Sat - Thu (8:30 AM - 5:30 PM)",
    emergencyName: "Md. Mokbul Hossain",
    emergencyRelationship: "Father",
    emergencyPhone: "+880 1711223344",
  },
  {
    id: "emp-2",
    empId: "EMP-2041",
    fullName: "Rafiqul Islam",
    phone: "+880 1711-234567",
    fathersName: "Nurul Islam",
    mothersName: "Fatema Begum",
    address: "House 24, Road 4, Sector 10, Uttara, Dhaka",
    nidNumber: "1992109283019",
    email: "rafiqul.mio@akpharma.com",
    designation: "Senior Medical Information Officer (MIO)",
    department: "Field Force (MIO)",
    startDate: "January 15, 2024",
    employmentStatus: "Active",
    salary: 38000,
    supervisor: "Nazmul Huda Chowdhury (RSM)",
    workSchedule: "Sat - Thu (9:00 AM - 6:00 PM)",
    emergencyName: "Shamima Nasrin",
    emergencyRelationship: "Spouse",
    emergencyPhone: "+880 1819-001122",
  },
  {
    id: "emp-3",
    empId: "EMP-2042",
    fullName: "Tanvir Ahmed",
    phone: "+880 1812-345678",
    fathersName: "Ahmed Ali",
    mothersName: "Nasima Akhtar",
    address: "House 12, Road 2, Dhanmondi, Dhaka",
    nidNumber: "1995830192847",
    email: "tanvir.mio@akpharma.com",
    designation: "Medical Information Officer (MIO)",
    department: "Field Force (MIO)",
    startDate: "March 01, 2025",
    employmentStatus: "Active",
    salary: 32000,
    supervisor: "Nazmul Huda Chowdhury (RSM)",
    workSchedule: "Sat - Thu (9:00 AM - 6:00 PM)",
    emergencyName: "Tariq Ahmed",
    emergencyRelationship: "Brother",
    emergencyPhone: "+880 1712-998877",
  },
  {
    id: "emp-4",
    empId: "EMP-2030",
    fullName: "Nazmul Huda Chowdhury",
    phone: "+880 1715-778899",
    fathersName: "Late Golam Mostafa Chowdhury",
    mothersName: "Laila Arjumand",
    address: "Plot 12, Block C, Mirpur 2, Dhaka",
    nidNumber: "1988261902847",
    email: "nazmul.rsm@akpharma.com",
    designation: "Regional Sales Manager (RSM)",
    department: "Sales Management",
    startDate: "August 10, 2022",
    employmentStatus: "Active",
    salary: 85000,
    supervisor: "Managing Director",
    workSchedule: "Sun - Thu (9:00 AM - 6:00 PM)",
    emergencyName: "Nasrin Chowdhury",
    emergencyRelationship: "Spouse",
    emergencyPhone: "+880 1611-224466",
  },
];

export default function StaffDirectoryPage() {
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Portfolio Sheet State
  const [selectedEmp, setSelectedEmp] = React.useState<Employee | null>(null);
  const [isPortfolioOpen, setIsPortfolioOpen] = React.useState(false);

  // Printable Dossier Modal State
  const [printProfile, setPrintProfile] = React.useState<Employee | null>(null);
  const [isPrintOpen, setIsPrintOpen] = React.useState(false);

  // Onboard New Staff Modal State
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [formState, setFormState] = React.useState({
    empId: "",
    fullName: "",
    phone: "",
    fathersName: "",
    mothersName: "",
    address: "",
    nidNumber: "",
    email: "",
    designation: "",
    department: "Field Force (MIO)",
    startDate: "January 01, 2025",
    employmentStatus: "Active" as Employee["employmentStatus"],
    salary: "",
    supervisor: "Toshin Bin Azad (Head of HR)",
    workSchedule: "Sat - Thu (8:30 AM - 5:30 PM)",
    emergencyName: "",
    emergencyRelationship: "",
    emergencyPhone: "",
  });

  // Edit Staff Modal State
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingEmp, setEditingEmp] = React.useState<Employee | null>(null);

  const handleFormChange = (field: string, val: any) => {
    setFormState((prev) => ({ ...prev, [field]: val }));
  };

  const handleOpenPortfolio = (emp: Employee) => {
    setSelectedEmp(emp);
    setIsPortfolioOpen(true);
  };

  const handleOpenPrint = (emp: Employee) => {
    setPrintProfile(emp);
    setIsPrintOpen(true);
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: Employee = {
      id: `emp-${Date.now()}`,
      empId: formState.empId || `AKP-${Math.floor(25000 + employees.length + 1)}`,
      fullName: formState.fullName,
      phone: formState.phone,
      fathersName: formState.fathersName,
      mothersName: formState.mothersName,
      address: formState.address,
      nidNumber: formState.nidNumber,
      email: formState.email,
      designation: formState.designation,
      department: formState.department,
      startDate: formState.startDate,
      employmentStatus: formState.employmentStatus,
      salary: Number(formState.salary) || 20000,
      supervisor: formState.supervisor,
      workSchedule: formState.workSchedule,
      emergencyName: formState.emergencyName,
      emergencyRelationship: formState.emergencyRelationship,
      emergencyPhone: formState.emergencyPhone,
    };

    setEmployees((prev) => [newStaff, ...prev]);
    setIsAddOpen(false);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp({ ...emp });
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    setEmployees((prev) =>
      prev.map((item) => (item.id === editingEmp.id ? editingEmp : item))
    );
    if (selectedEmp && selectedEmp.id === editingEmp.id) {
      setSelectedEmp(editingEmp);
    }
    setIsEditOpen(false);
    setEditingEmp(null);
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    if (selectedEmp && selectedEmp.id === id) {
      setIsPortfolioOpen(false);
    }
  };

  const handleExportExcel = () => {
    const data = employees.map((emp) => ({
      "ID": emp.empId,
      "Full Name": emp.fullName,
      "Phone Number": emp.phone,
      "Father's Name": emp.fathersName,
      "Mother's Name": emp.mothersName,
      "Address": emp.address,
      "NID Number": emp.nidNumber,
      "Email": emp.email,
      "Desig.": emp.designation,
      "Dept.": emp.department,
      "Start Date": emp.startDate,
      "Employeement Status": emp.employmentStatus,
      "Salary (৳)": emp.salary,
      "Supervisor": emp.supervisor,
      "Work Schedule": emp.workSchedule,
      "Name": emp.emergencyName,
      "Relationship": emp.emergencyRelationship,
      "Phone Number (Emergency)": emp.emergencyPhone,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Directory");
    XLSX.writeFile(workbook, `AK_Pharma_Staff_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nidNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      departmentFilter === "all" || emp.department.toLowerCase() === departmentFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" || emp.employmentStatus.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesDept && matchesStatus;
  });

  const activeStaffCount = employees.filter((e) => e.employmentStatus === "Active").length;
  const totalPayrollLiability = employees.reduce((acc, curr) => acc + curr.salary, 0);

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Staff Directory & Workforce Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Personnel records, organizational hierarchy, territorial postings, and employee credentials.
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
            Export Staff Roster
          </Button>

          {/* Onboard New Staff Modal */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none">
                <Plus className="h-4 w-4" />
                Onboard New Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[620px] bg-white rounded-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Onboard Corporate Employee</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Register new medical representative or administrative staff member into the company directory.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddEmployee} className="space-y-4 py-2">
                {/* 1. Identity & Family */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    1. Identity & Contact Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-medium text-slate-700">Full Name</Label>
                      <Input
                        placeholder="Mr. Ruhul Amin Redoy"
                        value={formState.fullName}
                        onChange={(e) => handleFormChange("fullName", e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">ID.</Label>
                      <Input
                        placeholder="AKP-25001"
                        value={formState.empId}
                        onChange={(e) => handleFormChange("empId", e.target.value)}
                        required
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Phone Number</Label>
                      <Input
                        placeholder="+880 1611357885"
                        value={formState.phone}
                        onChange={(e) => handleFormChange("phone", e.target.value)}
                        required
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Email</Label>
                      <Input
                        type="email"
                        placeholder="hasanali@gmail.com"
                        value={formState.email}
                        onChange={(e) => handleFormChange("email", e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">NID Number</Label>
                      <Input
                        placeholder="1994821049281"
                        value={formState.nidNumber}
                        onChange={(e) => handleFormChange("nidNumber", e.target.value)}
                        required
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Father's Name</Label>
                      <Input
                        placeholder="Md. Mokbul Hossain"
                        value={formState.fathersName}
                        onChange={(e) => handleFormChange("fathersName", e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-medium text-slate-700">Mother's Name</Label>
                      <Input
                        placeholder="Mrs. Rokeya Begum"
                        value={formState.mothersName}
                        onChange={(e) => handleFormChange("mothersName", e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-3">
                      <Label className="text-xs font-medium text-slate-700">Address</Label>
                      <Input
                        placeholder="Village+Post: Benotia PS-Shahzadpur Dist: Sirajgonj"
                        value={formState.address}
                        onChange={(e) => handleFormChange("address", e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Employment & Postings */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    2. Corporate Role & Posting
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Desig.</Label>
                      <Input
                        placeholder="Medical Information Officer (MIO)"
                        value={formState.designation}
                        onChange={(e) => handleFormChange("designation", e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Dept.</Label>
                      <Input
                        placeholder="Medical Information"
                        value={formState.department}
                        onChange={(e) => handleFormChange("department", e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Start Date</Label>
                      <Input
                        placeholder="January 01, 2025"
                        value={formState.startDate}
                        onChange={(e) => handleFormChange("startDate", e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Employeement Status</Label>
                      <Select
                        value={formState.employmentStatus}
                        onValueChange={(v) => handleFormChange("employmentStatus", v)}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Probationary">Probationary</SelectItem>
                          <SelectItem value="On Leave">On Leave</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Salary (৳)</Label>
                      <Input
                        type="number"
                        placeholder="20000"
                        value={formState.salary}
                        onChange={(e) => handleFormChange("salary", e.target.value)}
                        required
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Supervisor</Label>
                      <Input
                        placeholder="Toshin Bin Azad (Head of HR)"
                        value={formState.supervisor}
                        onChange={(e) => handleFormChange("supervisor", e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-3">
                      <Label className="text-xs font-medium text-slate-700">Work Schedule</Label>
                      <Input
                        placeholder="Sat - Thu (8:30 AM - 5:30 PM)"
                        value={formState.workSchedule}
                        onChange={(e) => handleFormChange("workSchedule", e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Emergency Contact */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    3. Emergency Contact Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Name</Label>
                      <Input
                        placeholder="Md. Mokbul Hossain"
                        value={formState.emergencyName}
                        onChange={(e) => handleFormChange("emergencyName", e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Relationship</Label>
                      <Input
                        placeholder="Father / Spouse"
                        value={formState.emergencyRelationship}
                        onChange={(e) => handleFormChange("emergencyRelationship", e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Phone Number</Label>
                      <Input
                        placeholder="+880 1711223344"
                        value={formState.emergencyPhone}
                        onChange={(e) => handleFormChange("emergencyPhone", e.target.value)}
                        required
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                    Confirm & Enroll Staff
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
            <span className="text-xs font-medium text-slate-500">Total Enrolled Headcount</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Users2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {employees.length} Staff
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Across registered corporate departments
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Operational Ratio</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {activeStaffCount} Active
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Fully confirmed staff members
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Monthly Payroll Liability</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            ৳{totalPayrollLiability.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-3">
            Total base commitments
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Workforce Compliance</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-md">
              100%
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            Verified
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            NID & credential documentation logged
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search employee name, ID, NID, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="h-8 w-[180px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="medical information">Medical Information</SelectItem>
              <SelectItem value="field force (mio)">Field Force (MIO)</SelectItem>
              <SelectItem value="sales management">Sales Management</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[140px] text-xs bg-white border-slate-200">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="probationary">Probationary</SelectItem>
              <SelectItem value="on leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Staff Directory Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              PERSONNEL ROSTER REGISTER
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click an employee's name to open their corporate profile dossier
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredEmployees.length} Personnel
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">ID. & Full Name</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Phone & NID</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Parents' Names</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Desig. & Dept.</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Start Date</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Salary</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Supervisor</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Status</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((emp) => (
              <TableRow key={emp.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                {/* ID & Name */}
                <TableCell className="py-3 pl-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      onClick={() => handleOpenPortfolio(emp)}
                      className="h-8 w-8 rounded-full border border-slate-200 cursor-pointer hover:border-[#0090FF] transition-colors"
                    >
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">
                        {emp.fullName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                      <button
                        onClick={() => handleOpenPortfolio(emp)}
                        className="text-xs font-bold text-slate-900 block hover:text-[#0090FF] hover:underline text-left"
                      >
                        {emp.fullName}
                      </button>
                      <span className="font-mono text-[10px] text-[#0090FF] font-semibold block mt-0.5">
                        {emp.empId}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Phone & NID */}
                <TableCell className="py-3 text-xs text-slate-700">
                  <div>
                    <span className="font-mono text-slate-900 block">{emp.phone}</span>
                    <span className="font-mono text-[10px] text-slate-400 block">NID: {emp.nidNumber}</span>
                  </div>
                </TableCell>

                {/* Parents' Names */}
                <TableCell className="py-3 text-xs text-slate-600 max-w-[180px]">
                  <div>
                    <span className="block truncate">F: {emp.fathersName}</span>
                    <span className="block truncate text-[10px] text-slate-400">M: {emp.mothersName}</span>
                  </div>
                </TableCell>

                {/* Desig. & Dept. */}
                <TableCell className="py-3 text-xs text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-900 block">{emp.designation}</span>
                    <span className="text-[10px] text-slate-400 block">{emp.department}</span>
                  </div>
                </TableCell>

                {/* Start Date */}
                <TableCell className="py-3 text-xs text-slate-600">
                  {emp.startDate}
                </TableCell>

                {/* Salary */}
                <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                  ৳{emp.salary.toLocaleString("en-IN")}
                </TableCell>

                {/* Supervisor */}
                <TableCell className="py-3 text-xs text-slate-600 max-w-[150px] truncate">
                  {emp.supervisor}
                </TableCell>

                {/* Status */}
                <TableCell className="py-3 text-xs">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      emp.employmentStatus === "Active"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : emp.employmentStatus === "Probationary"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                    }`}
                  >
                    {emp.employmentStatus}
                  </Badge>
                </TableCell>

                {/* Actions */}
                <TableCell className="py-3 text-xs text-right pr-0">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenPrint(emp)}
                      className="h-7 px-2.5 text-xs text-[#0090FF] border-blue-200 hover:bg-blue-50 gap-1 font-medium"
                    >
                      <Printer className="h-3 w-3" />
                      Print Dossier
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-white">
                        <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-wider">
                          Staff Options
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleOpenPortfolio(emp)}
                          className="text-xs cursor-pointer text-slate-700"
                        >
                          <FileText className="h-3.5 w-3.5 mr-2 text-blue-600" />
                          View Dossier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(emp)}
                          className="text-xs cursor-pointer text-slate-700"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-2 text-slate-500" />
                          Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="text-xs cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Deactivate Staff
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

      {/* 5. Employee Dossier Slide-Over (Sheet) */}
      <Sheet open={isPortfolioOpen} onOpenChange={setIsPortfolioOpen}>
        <SheetContent className="w-full sm:max-w-md bg-white p-0 overflow-y-auto border-l border-slate-200">
          {selectedEmp && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between">
                  <Avatar className="h-14 w-14 rounded-xl border-2 border-white shadow-xs">
                    <AvatarFallback className="bg-[#0090FF] text-white font-bold text-base">
                      {selectedEmp.fullName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                      selectedEmp.employmentStatus === "Active"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                    }`}
                  >
                    {selectedEmp.employmentStatus}
                  </Badge>
                </div>

                <div className="mt-4">
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    {selectedEmp.fullName}
                  </h2>
                  <p className="text-xs font-semibold text-[#0090FF] mt-0.5">
                    {selectedEmp.designation}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedEmp.department}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200/60">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs font-medium bg-[#0090FF] hover:bg-[#0080e5] text-white gap-1.5 shadow-none"
                    onClick={() => window.open(`tel:${selectedEmp.phone}`)}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call {selectedEmp.phone}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-slate-200 hover:bg-slate-100 text-slate-700"
                    onClick={() => handleOpenEdit(selectedEmp)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Dossier Body */}
              <div className="p-6 space-y-5 flex-1 text-xs">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Institutional Credentials
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                      <span className="text-[10px] text-slate-400 block font-medium">ID.</span>
                      <span className="font-mono font-bold text-slate-800">{selectedEmp.empId}</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                      <span className="text-[10px] text-slate-400 block font-medium">NID Number</span>
                      <span className="font-mono font-bold text-slate-800">{selectedEmp.nidNumber}</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                      <span className="text-[10px] text-slate-400 block font-medium">Salary</span>
                      <span className="font-mono font-bold text-slate-800">৳{selectedEmp.salary.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                      <span className="text-[10px] text-slate-400 block font-medium">Start Date</span>
                      <span className="font-semibold text-slate-800">{selectedEmp.startDate}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Family & Residential Details
                  </h4>
                  <div className="space-y-2 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Father's Name:</span>
                      <span className="font-medium text-slate-900">{selectedEmp.fathersName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Mother's Name:</span>
                      <span className="font-medium text-slate-900">{selectedEmp.mothersName}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200/60">
                      <span className="text-slate-500 block mb-0.5">Address:</span>
                      <span className="text-slate-800 leading-relaxed block">{selectedEmp.address}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Supervision & Work Schedule
                  </h4>
                  <div className="space-y-2 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Supervisor:</span>
                      <span className="font-medium text-slate-900">{selectedEmp.supervisor}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Work Schedule:</span>
                      <span className="font-medium text-slate-900">{selectedEmp.workSchedule}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-mono text-slate-900">{selectedEmp.email}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Emergency Contact (Name, Relationship, Phone)
                  </h4>
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-bold text-slate-900">{selectedEmp.emergencyName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Relationship:</span>
                      <span className="text-slate-800">{selectedEmp.emergencyRelationship}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Phone Number:</span>
                      <span className="font-mono font-bold text-[#0090FF]">{selectedEmp.emergencyPhone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsPortfolioOpen(false)}
                  className="h-8 text-xs text-slate-600"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleOpenPrint(selectedEmp)}
                  className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Dossier
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 6. Printable Dossier Modal */}
      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent className="sm:max-w-[680px] bg-white rounded-xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
          {printProfile && (
            <div>
              {/* Header Toolbar (Hidden while printing) */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between print:hidden">
                <span className="text-xs font-bold text-slate-700">Official Personnel Dossier Preview</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print / Save as PDF
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

              {/* Printable Body Content */}
              <div className="p-8 text-slate-900 font-sans" id="staff-dossier-printable">
                {/* Letterhead */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight uppercase">AK PHARMA</h2>
                    <p className="text-[11px] text-slate-500">Human Resources & Personnel Administration</p>
                    <p className="text-[10px] text-slate-400">Dhaka, Bangladesh</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-wider block text-slate-800">EMPLOYEE DOSSIER</span>
                    <span className="text-xs font-mono font-medium text-slate-600 block">{printProfile.empId}</span>
                  </div>
                </div>

                {/* Core Credentials */}
                <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                  <div className="space-y-1.5">
                    <div><span className="text-slate-400">Full Name: </span><strong>{printProfile.fullName}</strong></div>
                    <div><span className="text-slate-400">Employee ID: </span><span className="font-mono font-semibold">{printProfile.empId}</span></div>
                    <div><span className="text-slate-400">National ID (NID): </span><span className="font-mono">{printProfile.nidNumber}</span></div>
                    <div><span className="text-slate-400">Phone Number: </span><span className="font-mono">{printProfile.phone}</span></div>
                    <div><span className="text-slate-400">Email: </span>{printProfile.email}</div>
                  </div>
                  <div className="space-y-1.5 text-right sm:text-left">
                    <div><span className="text-slate-400">Designation: </span><strong>{printProfile.designation}</strong></div>
                    <div><span className="text-slate-400">Department: </span>{printProfile.department}</div>
                    <div><span className="text-slate-400">Start Date: </span>{printProfile.startDate}</div>
                    <div><span className="text-slate-400">Employment Status: </span><span className="font-semibold text-emerald-700">{printProfile.employmentStatus}</span></div>
                    <div><span className="text-slate-400">Salary: </span><span className="font-mono font-bold">৳{printProfile.salary.toLocaleString("en-IN")}/-</span></div>
                  </div>
                </div>

                {/* Family & Residence */}
                <div className="py-4 border-b border-slate-200 text-xs space-y-1.5">
                  <h4 className="font-bold uppercase tracking-wider text-slate-900 mb-1">
                    Family & Residence Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-slate-400">Father's Name: </span><strong>{printProfile.fathersName}</strong></div>
                    <div><span className="text-slate-400">Mother's Name: </span><strong>{printProfile.mothersName}</strong></div>
                  </div>
                  <div><span className="text-slate-400">Address: </span><span>{printProfile.address}</span></div>
                </div>

                {/* Supervision & Schedule */}
                <div className="py-4 border-b border-slate-200 text-xs space-y-1.5">
                  <h4 className="font-bold uppercase tracking-wider text-slate-900 mb-1">
                    Supervision & Work Schedule
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-slate-400">Supervisor: </span><strong>{printProfile.supervisor}</strong></div>
                    <div><span className="text-slate-400">Work Schedule: </span><strong>{printProfile.workSchedule}</strong></div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="py-4 border-b border-slate-200 text-xs space-y-1.5">
                  <h4 className="font-bold uppercase tracking-wider text-slate-900 mb-1">
                    Emergency Contact Particulars
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div><span className="text-slate-400">Name: </span><strong>{printProfile.emergencyName}</strong></div>
                    <div><span className="text-slate-400">Relationship: </span><span>{printProfile.emergencyRelationship}</span></div>
                    <div><span className="text-slate-400">Phone Number: </span><strong className="font-mono">{printProfile.emergencyPhone}</strong></div>
                  </div>
                </div>

                {/* Signature / Footer */}
                <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="text-center">
                    <div className="w-32 border-b border-slate-300 mb-1" />
                    <span>Employee Signature</span>
                  </div>
                  <div className="text-center">
                    <div className="w-32 border-b border-slate-300 mb-1" />
                    <span>HR Verification</span>
                  </div>
                  <div className="text-center">
                    <div className="w-32 border-b border-slate-300 mb-1" />
                    <span>Authorized Official</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. Edit Employee Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[580px] bg-white rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Edit Personnel Profile</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update institutional credentials, parents' names, schedule, or salary.
            </DialogDescription>
          </DialogHeader>

          {editingEmp && (
            <form onSubmit={handleSaveEdit} className="space-y-3.5 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Full Name</Label>
                  <Input
                    value={editingEmp.fullName}
                    onChange={(e) => setEditingEmp({ ...editingEmp, fullName: e.target.value })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Phone Number</Label>
                  <Input
                    value={editingEmp.phone}
                    onChange={(e) => setEditingEmp({ ...editingEmp, phone: e.target.value })}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Father's Name</Label>
                  <Input
                    value={editingEmp.fathersName}
                    onChange={(e) => setEditingEmp({ ...editingEmp, fathersName: e.target.value })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Mother's Name</Label>
                  <Input
                    value={editingEmp.mothersName}
                    onChange={(e) => setEditingEmp({ ...editingEmp, mothersName: e.target.value })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Address</Label>
                <Input
                  value={editingEmp.address}
                  onChange={(e) => setEditingEmp({ ...editingEmp, address: e.target.value })}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">NID Number</Label>
                  <Input
                    value={editingEmp.nidNumber}
                    onChange={(e) => setEditingEmp({ ...editingEmp, nidNumber: e.target.value })}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Email</Label>
                  <Input
                    value={editingEmp.email}
                    onChange={(e) => setEditingEmp({ ...editingEmp, email: e.target.value })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Desig.</Label>
                  <Input
                    value={editingEmp.designation}
                    onChange={(e) => setEditingEmp({ ...editingEmp, designation: e.target.value })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Dept.</Label>
                  <Input
                    value={editingEmp.department}
                    onChange={(e) => setEditingEmp({ ...editingEmp, department: e.target.value })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Salary (৳)</Label>
                  <Input
                    type="number"
                    value={editingEmp.salary}
                    onChange={(e) => setEditingEmp({ ...editingEmp, salary: Number(e.target.value) })}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Employeement Status</Label>
                  <Select
                    value={editingEmp.employmentStatus}
                    onValueChange={(val) =>
                      setEditingEmp({
                        ...editingEmp,
                        employmentStatus: val as Employee["employmentStatus"],
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Probationary">Probationary</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Supervisor</Label>
                  <Input
                    value={editingEmp.supervisor}
                    onChange={(e) => setEditingEmp({ ...editingEmp, supervisor: e.target.value })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Work Schedule</Label>
                  <Input
                    value={editingEmp.workSchedule}
                    onChange={(e) => setEditingEmp({ ...editingEmp, workSchedule: e.target.value })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                  Update Personnel Record
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}