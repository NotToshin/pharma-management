"use client"

import * as React from "react"
import * as XLSX from "xlsx"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
} from "lucide-react"

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

  body * {
    visibility: hidden !important;
  }

  #staff-dossier-printable,
  #staff-dossier-printable * {
    visibility: visible !important;
  }

  #staff-dossier-printable {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 10px !important;
    background: #ffffff !important;
  }

  .print\\:hidden,
  button,
  [data-radix-popper-content-wrapper] {
    display: none !important;
  }
}
`

export interface Employee {
  id: string
  empId: string
  fullName: string
  phone: string
  fathersName: string
  mothersName: string
  address: string
  nidNumber: string
  email: string
  designation: string
  department: string
  startDate: string
  employmentStatus: "Active" | "Probationary" | "On Leave" | "Suspended"
  salary: number
  supervisor: string
  workSchedule: string
  emergencyName: string
  emergencyRelationship: string
  emergencyPhone: string
}

export default function StaffDirectoryPage() {
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Dynamic dropdown lists for custom Add More options
  const [designations, setDesignations] = React.useState([
    "Medical Information Officer",
    "Sales Representative",
    "Accountant",
    "Human Resource",
    "Area Manager",
    "Product Executive",
  ])
  const [departments, setDepartments] = React.useState([
    "Field Force",
    "Administrative",
    "Accounts",
    "Management",
    "Supply Chain",
    "Marketing",
  ])

  // Filters for department and status
  const [departmentFilter, setDepartmentFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")

  // Portfolio Sheet State
  const [selectedEmp, setSelectedEmp] = React.useState<Employee | null>(null)
  const [isPortfolioOpen, setIsPortfolioOpen] = React.useState(false)

  // Printable Dossier Modal State
  const [printProfile, setPrintProfile] = React.useState<Employee | null>(null)
  const [isPrintOpen, setIsPrintOpen] = React.useState(false)

  // Onboard New Staff Modal State
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [formState, setFormState] = React.useState({
    empId: "",
    fullName: "",
    phone: "+880 ",
    fathersName: "",
    mothersName: "",
    address: "",
    nidNumber: "",
    email: "",
    designation: "Medical Information Officer",
    department: "Field Force",
    startDate: "January 01, 2025",
    employmentStatus: "Active" as Employee["employmentStatus"],
    salary: "",
    supervisor: "Toshin Bin Azad (Human Resource)",
    workSchedule: "Sat - Thu (8:30 AM - 5:30 PM)",
    emergencyName: "",
    emergencyRelationship: "",
    emergencyPhone: "+880 ",
  })

  // Edit Staff Modal State
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingEmp, setEditingEmp] = React.useState<Employee | null>(null)

  const fetchStaffData = async () => {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
      const res = await fetch(`${API_URL}/staff`)
      if (!res.ok) throw new Error("Failed to fetch staff")
      const data = await res.json()

      const formattedData = data.map((item: any) => ({
        id: item.id,
        empId: item.empId,
        fullName: item.fullName,
        phone: item.phone,
        fathersName: item.fathersName || "N/A",
        mothersName: item.mothersName || "N/A",
        address: item.address || "N/A",
        nidNumber: item.nidNumber || "N/A",
        email: item.email || "",
        designation: item.designation || item.role?.name || "Staff Member",
        department: item.department || "General",
        startDate: item.joiningDate
          ? new Date(item.joiningDate).toLocaleDateString("en-US", {
              month: "long",
              day: "2-digit",
              year: "numeric",
            })
          : "January 01, 2025",
        employmentStatus:
          item.status === "ACTIVE"
            ? "Active"
            : item.status === "PROBATION"
              ? "Probationary"
              : item.status === "ON_LEAVE"
                ? "On Leave"
                : item.status === "SUSPENDED"
                  ? "Suspended"
                  : "Active",
        salary: item.salaryDetails?.baseSalary
          ? Number(item.salaryDetails.baseSalary)
          : item.salaries?.[0]?.baseSalary
            ? Number(item.salaries[0].baseSalary)
            : 20000,
        supervisor: item.supervisor || "Toshin Bin Azad (Human Resource)",
        workSchedule: item.workSchedule || "Sat - Thu (8:30 AM - 5:30 PM)",
        emergencyName: item.emergencyName || item.fathersName || "N/A",
        emergencyRelationship: item.emergencyRelationship || "Father / Spouse",
        emergencyPhone: item.emergencyPhone || "+880 1711223344",
      }))

      setEmployees(formattedData)
      setLoading(false)
    } catch (err) {
      console.error("Error loading staff data:", err)
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchStaffData()
  }, [])

  const handleFormChange = (field: string, val: any) => {
    if (val === "__ADD_NEW_DESIGNATION__") {
      const customDesig = prompt(
        "Enter new designation title (Super Admin access):"
      )
      if (customDesig && customDesig.trim() !== "") {
        const formatted = customDesig.trim()
        if (!designations.includes(formatted)) {
          setDesignations((prev) => [...prev, formatted])
        }
        setFormState((prev) => ({ ...prev, designation: formatted }))
      }
      return
    }

    if (val === "__ADD_NEW_DEPARTMENT__") {
      const customDept = prompt(
        "Enter new department title (Super Admin access):"
      )
      if (customDept && customDept.trim() !== "") {
        const formatted = customDept.trim()
        if (!departments.includes(formatted)) {
          setDepartments((prev) => [...prev, formatted])
        }
        setFormState((prev) => ({ ...prev, department: formatted }))
      }
      return
    }

    setFormState((prev) => ({ ...prev, [field]: val }))
  }

  const handleEditFormChange = (field: string, val: any) => {
    if (!editingEmp) return

    if (val === "__ADD_NEW_DESIGNATION__") {
      const customDesig = prompt(
        "Enter new designation title (Super Admin access):"
      )
      if (customDesig && customDesig.trim() !== "") {
        const formatted = customDesig.trim()
        if (!designations.includes(formatted)) {
          setDesignations((prev) => [...prev, formatted])
        }
        setEditingEmp({ ...editingEmp, designation: formatted })
      }
      return
    }

    if (val === "__ADD_NEW_DEPARTMENT__") {
      const customDept = prompt(
        "Enter new department title (Super Admin access):"
      )
      if (customDept && customDept.trim() !== "") {
        const formatted = customDept.trim()
        if (!departments.includes(formatted)) {
          setDepartments((prev) => [...prev, formatted])
        }
        setEditingEmp({ ...editingEmp, department: formatted })
      }
      return
    }

    setEditingEmp({ ...editingEmp, [field]: val })
  }

  const handleOpenPortfolio = (emp: Employee) => {
    setSelectedEmp(emp)
    setIsPortfolioOpen(true)
  }

  const handleOpenPrint = (emp: Employee) => {
    setPrintProfile(emp)
    setIsPrintOpen(true)
  }

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp({ ...emp })
    setIsEditOpen(true)
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
      const payload = {
        empId:
          formState.empId || `AKP-${Math.floor(25000 + employees.length + 1)}`,
        fullName: formState.fullName,
        phone: formState.phone,
        email: formState.email,
        nidNumber: formState.nidNumber,
        fathersName: formState.fathersName,
        mothersName: formState.mothersName,
        address: formState.address,
        designation: formState.designation,
        department: formState.department,
        territory: "Dhaka",
        salary: Number(formState.salary) || 20000,
        supervisor: formState.supervisor,
        workSchedule: formState.workSchedule,
        emergencyName: formState.emergencyName,
        emergencyRelationship: formState.emergencyRelationship,
        emergencyPhone: formState.emergencyPhone,
      }

      const res = await fetch(`${API_URL}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to save staff to database")

      setIsAddOpen(false)
      fetchStaffData()
    } catch (error) {
      console.error("Error adding employee:", error)
      alert("Failed to onboard staff member.")
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmp) return

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
      const payload = {
        fullName: editingEmp.fullName,
        phone: editingEmp.phone,
        email: editingEmp.email,
        nidNumber: editingEmp.nidNumber,
        fathersName: editingEmp.fathersName,
        mothersName: editingEmp.mothersName,
        address: editingEmp.address,
        department: editingEmp.department,
        designation: editingEmp.designation,
        employmentStatus: editingEmp.employmentStatus,
        supervisor: editingEmp.supervisor,
        workSchedule: editingEmp.workSchedule,
        salary: Number(editingEmp.salary) || 20000,
        emergencyName: editingEmp.emergencyName,
        emergencyRelationship: editingEmp.emergencyRelationship,
        emergencyPhone: editingEmp.emergencyPhone,
      }

      const res = await fetch(`${API_URL}/staff/${editingEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to update staff record")

      setIsEditOpen(false)
      setEditingEmp(null)
      fetchStaffData()
    } catch (error) {
      console.error("Error updating employee:", error)
      alert("Failed to update staff record.")
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
      const res = await fetch(`${API_URL}/staff/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete staff")

      if (selectedEmp && selectedEmp.id === id) {
        setIsPortfolioOpen(false)
      }
      fetchStaffData()
    } catch (error) {
      console.error("Error deleting staff:", error)
    }
  }

  const handleExportExcel = () => {
    const data = employees.map((emp) => ({
      ID: emp.empId,
      "Full Name": emp.fullName,
      "Phone Number": emp.phone,
      "Father's Name": emp.fathersName,
      "Mother's Name": emp.mothersName,
      Address: emp.address,
      "NID Number": emp.nidNumber,
      Email: emp.email,
      "Desig.": emp.designation,
      "Dept.": emp.department,
      "Start Date": emp.startDate,
      "Employment Status": emp.employmentStatus,
      "Salary (৳)": emp.salary,
      Supervisor: emp.supervisor,
      "Work Schedule": emp.workSchedule,
      "Emergency Contact Name": emp.emergencyName,
      "Emergency Relationship": emp.emergencyRelationship,
      "Emergency Phone": emp.emergencyPhone,
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Directory")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Staff_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
  }

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nidNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDept =
      departmentFilter === "all" ||
      emp.department.toLowerCase() === departmentFilter.toLowerCase()

    const matchesStatus =
      statusFilter === "all" ||
      emp.employmentStatus.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesDept && matchesStatus
  })

  const activeStaffCount = employees.filter(
    (e) => e.employmentStatus === "Active"
  ).length
  const totalPayrollLiability = employees.reduce(
    (acc, curr) => acc + curr.salary,
    0
  )

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-10">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Staff Directory & Workforce Management
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Personnel records, organizational hierarchy, territorial postings,
            and employee credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Staff Roster
          </Button>

          {/* Onboard New Staff Modal */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
              >
                <Plus className="h-4 w-4" />
                Onboard New Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl bg-white sm:max-w-[620px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Onboard Corporate Employee
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Register new medical representative or administrative staff
                  member into the company directory.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddEmployee} className="space-y-4 py-2">
                <div>
                  <h4 className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    1. Identity & Contact Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Full Name
                      </Label>
                      <Input
                        placeholder="Mr. Ruhul Amin Redoy"
                        value={formState.fullName}
                        onChange={(e) =>
                          handleFormChange("fullName", e.target.value)
                        }
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">
                        ID.
                      </Label>
                      <Input
                        placeholder="AKP-25001"
                        value={formState.empId}
                        onChange={(e) =>
                          handleFormChange("empId", e.target.value)
                        }
                        required
                        className="h-8 font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">
                        Phone Number
                      </Label>
                      <Input
                        placeholder="+880 1611357885"
                        value={formState.phone}
                        onChange={(e) => {
                          const val = e.target.value
                          if (!val.startsWith("+880")) {
                            handleFormChange(
                              "phone",
                              "+880 " + val.replace(/^\+?880\s*/, "")
                            )
                          } else {
                            handleFormChange("phone", val)
                          }
                        }}
                        required
                        className="h-8 font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">
                        Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="hasanali@gmail.com"
                        value={formState.email}
                        onChange={(e) =>
                          handleFormChange("email", e.target.value)
                        }
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">
                        NID Number
                      </Label>
                      <Input
                        placeholder="1994821049281"
                        value={formState.nidNumber}
                        onChange={(e) =>
                          handleFormChange("nidNumber", e.target.value)
                        }
                        required
                        className="h-8 font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">
                        Father's Name
                      </Label>
                      <Input
                        placeholder="Md. Mokbul Hossain"
                        value={formState.fathersName}
                        onChange={(e) =>
                          handleFormChange("fathersName", e.target.value)
                        }
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Mother's Name
                      </Label>
                      <Input
                        placeholder="Mrs. Rokeya Begum"
                        value={formState.mothersName}
                        onChange={(e) =>
                          handleFormChange("mothersName", e.target.value)
                        }
                        required
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-3">
                      <Label className="text-xs font-medium text-slate-700">
                        Address
                      </Label>
                      <Input
                        placeholder="Village+Post: Benotia PS-Shahzadpur Dist: Sirajgonj"
                        value={formState.address}
                        onChange={(e) =>
                          handleFormChange("address", e.target.value)
                        }
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2">
                  <h4 className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    2. Corporate Role & Posting
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">
                        Designation
                      </Label>
                      <Select
                        value={formState.designation}
                        onValueChange={(v) =>
                          handleFormChange("designation", v)
                        }
                      >
                        <SelectTrigger className="h-8 bg-white text-xs">
                          <SelectValue placeholder="Select Designation" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[240px] text-xs">
                          {designations.map((desig) => (
                            <SelectItem key={desig} value={desig}>
                              {desig}
                            </SelectItem>
                          ))}
                          <SelectItem
                            value="__ADD_NEW_DESIGNATION__"
                            className="mt-1 border-t border-slate-100 pt-1 font-semibold text-blue-600"
                          >
                            + Add more (Super Admin access)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">
                        Department
                      </Label>
                      <Select
                        value={formState.department}
                        onValueChange={(v) => handleFormChange("department", v)}
                      >
                        <SelectTrigger className="h-8 bg-white text-xs">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                          <SelectItem
                            value="__ADD_NEW_DEPARTMENT__"
                            className="mt-1 border-t border-slate-100 pt-1 font-semibold text-blue-600"
                          >
                            + Add more (Super Admin access)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">
                        Start Date
                      </Label>
                      <Input
                        placeholder="January 01, 2025"
                        value={formState.startDate}
                        onChange={(e) =>
                          handleFormChange("startDate", e.target.value)
                        }
                        required
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">
                        Employment Status
                      </Label>
                      <Select
                        value={formState.employmentStatus}
                        onValueChange={(v) =>
                          handleFormChange("employmentStatus", v)
                        }
                      >
                        <SelectTrigger className="h-8 bg-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Probationary">
                            Probationary
                          </SelectItem>
                          <SelectItem value="On Leave">On Leave</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">
                        Salary (৳)
                      </Label>
                      <Input
                        type="number"
                        placeholder="20000"
                        value={formState.salary}
                        onChange={(e) =>
                          handleFormChange("salary", e.target.value)
                        }
                        required
                        className="h-8 font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">
                        Supervisor
                      </Label>
                      <Input
                        placeholder="Toshin Bin Azad (Human Resource)"
                        value={formState.supervisor}
                        onChange={(e) =>
                          handleFormChange("supervisor", e.target.value)
                        }
                        required
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-3">
                      <Label className="text-xs font-medium text-slate-700">
                        Work Schedule
                      </Label>
                      <Input
                        placeholder="Sat - Thu (8:30 AM - 5:30 PM)"
                        value={formState.workSchedule}
                        onChange={(e) =>
                          handleFormChange("workSchedule", e.target.value)
                        }
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2">
                  <h4 className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    3. Emergency Contact Details
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">
                        Name
                      </Label>
                      <Input
                        placeholder="Md. Mokbul Hossain"
                        value={formState.emergencyName}
                        onChange={(e) =>
                          handleFormChange("emergencyName", e.target.value)
                        }
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">
                        Relationship
                      </Label>
                      <Input
                        placeholder="Father / Spouse"
                        value={formState.emergencyRelationship}
                        onChange={(e) =>
                          handleFormChange(
                            "emergencyRelationship",
                            e.target.value
                          )
                        }
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">
                        Phone Number
                      </Label>
                      <Input
                        placeholder="+880 1711223344"
                        value={formState.emergencyPhone}
                        onChange={(e) => {
                          const val = e.target.value
                          if (!val.startsWith("+880")) {
                            handleFormChange(
                              "emergencyPhone",
                              "+880 " + val.replace(/^\+?880\s*/, "")
                            )
                          } else {
                            handleFormChange("emergencyPhone", val)
                          }
                        }}
                        required
                        className="h-8 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddOpen(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
                  >
                    Confirm & Enroll Staff
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total Enrolled Headcount
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <Users2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {employees.length} Staff
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Active Operational Ratio
            </span>
            <div className="rounded-lg bg-blue-50 p-1.5 text-[#0090FF]">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {activeStaffCount} Active
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Monthly Payroll Liability
            </span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-bold tracking-tight text-slate-900">
            ৳{totalPayrollLiability.toLocaleString("en-IN")}
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Workforce Compliance
            </span>
            <Badge
              variant="outline"
              className="rounded-md border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
            >
              100%
            </Badge>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-bold tracking-tight text-slate-900">
            Verified
          </div>
        </Card>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search employee name, ID, NID, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="h-8 w-[140px] bg-white text-xs">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[130px] bg-white text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Probationary">Probationary</SelectItem>
              <SelectItem value="On Leave">On Leave</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Staff Directory Table */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none print:hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              PERSONNEL ROSTER REGISTER
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Click an employee's name to open their corporate profile dossier
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredEmployees.length} Personnel
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0 text-xs font-medium text-slate-600">
                ID. & Full Name
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Phone & NID
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Parents' Names
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Desig. & Dept.
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Start Date
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-slate-600">
                Salary
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Supervisor
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Status
              </TableHead>
              <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-6 text-center text-xs text-slate-400"
                >
                  Loading live staff directory from database...
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-6 text-center text-xs text-slate-400"
                >
                  No personnel records found. Click "Onboard New Staff" to add
                  someone.
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((emp) => (
                <TableRow
                  key={emp.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50"
                >
                  <TableCell className="py-3 pl-0">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        onClick={() => handleOpenPortfolio(emp)}
                        className="h-8 w-8 cursor-pointer rounded-full border border-slate-200 transition-colors hover:border-[#0090FF]"
                      >
                        <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                          {emp.fullName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <button
                          onClick={() => handleOpenPortfolio(emp)}
                          className="block text-left text-xs font-bold text-slate-900 hover:text-[#0090FF] hover:underline"
                        >
                          {emp.fullName}
                        </button>
                        <span className="mt-0.5 block font-mono text-[10px] font-semibold text-[#0090FF]">
                          {emp.empId}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-700">
                    <div>
                      <span className="block font-mono text-slate-900">
                        {emp.phone}
                      </span>
                      <span className="block font-mono text-[10px] text-slate-400">
                        NID: {emp.nidNumber}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="max-w-[180px] py-3 text-xs text-slate-600">
                    <div>
                      <span className="block truncate">
                        F: {emp.fathersName}
                      </span>
                      <span className="block truncate text-[10px] text-slate-400">
                        M: {emp.mothersName}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-700">
                    <div>
                      <span className="block font-semibold text-slate-900">
                        {emp.designation}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {emp.department}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-600">
                    {emp.startDate}
                  </TableCell>

                  <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-900">
                    ৳{emp.salary.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="max-w-[150px] truncate py-3 text-xs text-slate-600">
                    {emp.supervisor}
                  </TableCell>

                  <TableCell className="py-3 text-xs">
                    <Badge
                      variant="outline"
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        emp.employmentStatus === "Active"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : emp.employmentStatus === "Probationary"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : emp.employmentStatus === "On Leave"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : emp.employmentStatus === "Suspended"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {emp.employmentStatus}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3 pr-0 text-right text-xs">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPrint(emp)}
                        className="h-7 gap-1 border-blue-200 px-2.5 text-xs font-medium text-[#0090FF] hover:bg-blue-50"
                      >
                        <Printer className="h-3 w-3" />
                        Print Dossier
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44 bg-white"
                        >
                          <DropdownMenuLabel className="text-[10px] tracking-wider text-slate-400 uppercase">
                            Staff Options
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleOpenPortfolio(emp)}
                            className="cursor-pointer text-xs text-slate-700"
                          >
                            <FileText className="mr-2 h-3.5 w-3.5 text-blue-600" />
                            View Dossier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(emp)}
                            className="cursor-pointer text-xs text-slate-700"
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                            Edit Staff
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="cursor-pointer text-xs text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Deactivate Staff
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Employee Dossier Slide-Over */}
      <Sheet open={isPortfolioOpen} onOpenChange={setIsPortfolioOpen}>
        <SheetContent className="w-full overflow-y-auto border-l border-slate-200 bg-white p-0 sm:max-w-md print:hidden">
          {selectedEmp && (
            <div className="flex h-full flex-col space-y-4 p-6">
              <SheetHeader>
                <SheetTitle className="text-lg font-bold text-slate-900">
                  {selectedEmp.fullName}
                </SheetTitle>
              </SheetHeader>
              <div>
                <p className="text-xs font-semibold text-[#0090FF]">
                  {selectedEmp.designation}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {selectedEmp.department}
                </p>
              </div>
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs">
                <div>
                  <strong>Employee ID:</strong>{" "}
                  <span className="font-mono text-slate-700">
                    {selectedEmp.empId}
                  </span>
                </div>
                <div>
                  <strong>Phone:</strong>{" "}
                  <span className="font-mono text-slate-700">
                    {selectedEmp.phone}
                  </span>
                </div>
                <div>
                  <strong>Email:</strong>{" "}
                  <span className="text-slate-700">{selectedEmp.email}</span>
                </div>
                <div>
                  <strong>NID Number:</strong>{" "}
                  <span className="font-mono text-slate-700">
                    {selectedEmp.nidNumber}
                  </span>
                </div>
                <div>
                  <strong>Father's Name:</strong>{" "}
                  <span className="text-slate-700">
                    {selectedEmp.fathersName}
                  </span>
                </div>
                <div>
                  <strong>Mother's Name:</strong>{" "}
                  <span className="text-slate-700">
                    {selectedEmp.mothersName}
                  </span>
                </div>
                <div>
                  <strong>Salary:</strong>{" "}
                  <span className="font-mono text-slate-700">
                    ৳{selectedEmp.salary.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <strong>Supervisor:</strong>{" "}
                  <span className="text-slate-700">
                    {selectedEmp.supervisor}
                  </span>
                </div>
                <div>
                  <strong>Work Schedule:</strong>{" "}
                  <span className="text-slate-700">
                    {selectedEmp.workSchedule}
                  </span>
                </div>
                <div>
                  <strong>Address:</strong>{" "}
                  <span className="text-slate-700">{selectedEmp.address}</span>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <h4 className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  Emergency Contact
                </h4>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div>
                    <strong>Name:</strong> {selectedEmp.emergencyName}
                  </div>
                  <div>
                    <strong>Relationship:</strong>{" "}
                    {selectedEmp.emergencyRelationship}
                  </div>
                  <div>
                    <strong>Phone:</strong>{" "}
                    <span className="font-mono">
                      {selectedEmp.emergencyPhone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 6. Printable Dossier Modal */}
      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden rounded-xl bg-white p-0 sm:max-w-[680px]">
          {printProfile && (
            <div>
              {/* Header Toolbar (Hidden while printing) */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-4 print:hidden">
                <span className="text-xs font-bold text-slate-700">
                  Official Personnel Dossier Preview
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 gap-1.5 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
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
              <div
                className="max-h-[calc(92vh-60px)] overflow-y-auto p-8 font-sans text-slate-900"
                id="staff-dossier-printable"
              >
                {/* Letterhead */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight uppercase">
                      AK PHARMA
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Human Resources & Personnel Administration
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Dhaka, Bangladesh
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold tracking-wider text-slate-800 uppercase">
                      EMPLOYEE DOSSIER
                    </span>
                    <span className="block font-mono text-xs font-medium text-slate-600">
                      {printProfile.empId}
                    </span>
                  </div>
                </div>

                {/* Core Credentials */}
                <div className="grid grid-cols-2 gap-4 border-b border-slate-200 py-4 text-xs">
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-slate-400">Full Name: </span>
                      <strong>{printProfile.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Employee ID: </span>
                      <span className="font-mono font-semibold">
                        {printProfile.empId}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">
                        National ID (NID):{" "}
                      </span>
                      <span className="font-mono">
                        {printProfile.nidNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone Number: </span>
                      <span className="font-mono">{printProfile.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Email: </span>
                      {printProfile.email}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-right sm:text-left">
                    <div>
                      <span className="text-slate-400">Designation: </span>
                      <strong>{printProfile.designation}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Department: </span>
                      {printProfile.department}
                    </div>
                    <div>
                      <span className="text-slate-400">Start Date: </span>
                      {printProfile.startDate}
                    </div>
                    <div>
                      <span className="text-slate-400">
                        Employment Status:{" "}
                      </span>
                      <span className="font-semibold text-emerald-700">
                        {printProfile.employmentStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Salary: </span>
                      <span className="font-mono font-bold">
                        ৳{printProfile.salary.toLocaleString("en-IN")}/-
                      </span>
                    </div>
                  </div>
                </div>

                {/* Family & Residence */}
                <div className="space-y-1.5 border-b border-slate-200 py-4 text-xs">
                  <h4 className="mb-1 font-bold tracking-wider text-slate-900 uppercase">
                    Family & Residence Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400">Father's Name: </span>
                      <strong>{printProfile.fathersName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Mother's Name: </span>
                      <strong>{printProfile.mothersName}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Address: </span>
                    <span>{printProfile.address}</span>
                  </div>
                </div>

                {/* Supervision & Schedule */}
                <div className="space-y-1.5 border-b border-slate-200 py-4 text-xs">
                  <h4 className="mb-1 font-bold tracking-wider text-slate-900 uppercase">
                    Supervision & Work Schedule
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400">Supervisor: </span>
                      <strong>{printProfile.supervisor}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Work Schedule: </span>
                      <strong>{printProfile.workSchedule}</strong>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-1.5 border-b border-slate-200 py-4 text-xs">
                  <h4 className="mb-1 font-bold tracking-wider text-slate-900 uppercase">
                    Emergency Contact Particulars
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400">Name: </span>
                      <strong>{printProfile.emergencyName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Relationship: </span>
                      <span>{printProfile.emergencyRelationship}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone Number: </span>
                      <strong className="font-mono">
                        {printProfile.emergencyPhone}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Signature / Footer */}
                <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6 text-[11px] text-slate-400">
                  <div className="text-center">
                    <div className="mb-1 w-32 border-b border-slate-300" />
                    <span>Employee Signature</span>
                  </div>
                  <div className="text-center">
                    <div className="mb-1 w-32 border-b border-slate-300" />
                    <span>HR Verification</span>
                  </div>
                  <div className="text-center">
                    <div className="mb-1 w-32 border-b border-slate-300" />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl bg-white sm:max-w-[580px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Personnel Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update institutional credentials, parents' names, schedule, or
              salary.
            </DialogDescription>
          </DialogHeader>

          {editingEmp && (
            <form onSubmit={handleSaveEdit} className="space-y-3.5 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Full Name
                  </Label>
                  <Input
                    value={editingEmp.fullName}
                    onChange={(e) =>
                      setEditingEmp({ ...editingEmp, fullName: e.target.value })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Phone Number
                  </Label>
                  <Input
                    value={editingEmp.phone}
                    onChange={(e) =>
                      setEditingEmp({ ...editingEmp, phone: e.target.value })
                    }
                    required
                    className="h-8 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Father's Name
                  </Label>
                  <Input
                    value={editingEmp.fathersName}
                    onChange={(e) =>
                      setEditingEmp({
                        ...editingEmp,
                        fathersName: e.target.value,
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Mother's Name
                  </Label>
                  <Input
                    value={editingEmp.mothersName}
                    onChange={(e) =>
                      setEditingEmp({
                        ...editingEmp,
                        mothersName: e.target.value,
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Address
                </Label>
                <Input
                  value={editingEmp.address}
                  onChange={(e) =>
                    setEditingEmp({ ...editingEmp, address: e.target.value })
                  }
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    NID Number
                  </Label>
                  <Input
                    value={editingEmp.nidNumber}
                    onChange={(e) =>
                      setEditingEmp({
                        ...editingEmp,
                        nidNumber: e.target.value,
                      })
                    }
                    required
                    className="h-8 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Email
                  </Label>
                  <Input
                    value={editingEmp.email}
                    onChange={(e) =>
                      setEditingEmp({ ...editingEmp, email: e.target.value })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Edit Designation Dropdown with Super Admin Add More */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Designation
                  </Label>
                  <Select
                    value={editingEmp.designation}
                    onValueChange={(val) =>
                      handleEditFormChange("designation", val)
                    }
                  >
                    <SelectTrigger className="h-8 bg-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[240px] text-xs">
                      {designations.map((desig) => (
                        <SelectItem key={desig} value={desig}>
                          {desig}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="__ADD_NEW_DESIGNATION__"
                        className="mt-1 border-t border-slate-100 pt-1 font-semibold text-blue-600"
                      >
                        + Add more (Super Admin access)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Edit Department Dropdown with Super Admin Add More */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Department
                  </Label>
                  <Select
                    value={editingEmp.department}
                    onValueChange={(val) =>
                      handleEditFormChange("department", val)
                    }
                  >
                    <SelectTrigger className="h-8 bg-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="__ADD_NEW_DEPARTMENT__"
                        className="mt-1 border-t border-slate-100 pt-1 font-semibold text-blue-600"
                      >
                        + Add more (Super Admin access)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Salary (৳)
                  </Label>
                  <Input
                    type="number"
                    value={editingEmp.salary}
                    onChange={(e) =>
                      setEditingEmp({
                        ...editingEmp,
                        salary: Number(e.target.value),
                      })
                    }
                    required
                    className="h-8 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Employment Status
                  </Label>
                  <Select
                    value={editingEmp.employmentStatus}
                    onValueChange={(val) =>
                      setEditingEmp({
                        ...editingEmp,
                        employmentStatus: val as Employee["employmentStatus"],
                      })
                    }
                  >
                    <SelectTrigger className="h-8 bg-white text-xs">
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
                  <Label className="text-xs font-medium text-slate-700">
                    Supervisor
                  </Label>
                  <Input
                    value={editingEmp.supervisor}
                    onChange={(e) =>
                      setEditingEmp({
                        ...editingEmp,
                        supervisor: e.target.value,
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Work Schedule
                  </Label>
                  <Input
                    value={editingEmp.workSchedule}
                    onChange={(e) =>
                      setEditingEmp({
                        ...editingEmp,
                        workSchedule: e.target.value,
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
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
                <Button
                  type="submit"
                  className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
                >
                  Update Personnel Record
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
