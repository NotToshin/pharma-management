"use client"

import * as React from "react"
import { API_URL, apiFetch } from "@/lib/api"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Printer,
  Pencil,
  Trash2,
  UserPlus,
  Calendar,
  CheckCircle2,
  Search,
  CreditCard,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Zap,
  Users,
  Wallet,
  ArrowRightLeft,
  X,
  AlertCircle,
  Coins,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react"

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
`

export interface StaffItem {
  id: string
  empId: string
  fullName: string
  designation: string
  department: string
  territory: string
  phone?: string
  email?: string
  status?: string
  baseSalary?: number
}

export interface EmployeeSalary {
  id: string
  empId: string
  fullName: string
  designation: string
  department: string
  territory: string
  bankName: string
  bankAccount: string
  payPeriod: string
  basicSalary: number
  houseRent: number
  medicalAllowance: number
  conveyanceTaDa: number
  salesIncentive: number
  specialBonus: number
  providentFund: number
  taxDeduction: number
  otherDeductions: number
  leaveDays: number
  status: "Draft" | "Approved" | "Disbursed" | "Processing"
}

interface TreasuryAccount {
  id: string
  accountTitle: string
  institution: string
  balance: number
  accountNumber: string
}

const generateDynamicMonths = () => {
  const months: string[] = []
  const currentDate = new Date()

  for (let i = -12; i <= 12; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
    const monthName = d.toLocaleString("en-US", { month: "long" })
    const year = d.getFullYear()
    months.push(`${monthName} ${year}`)
  }

  return months
}

const MONTHS_LIST = generateDynamicMonths()

const getCurrentMonthString = () => {
  const d = new Date()
  return `${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`
}

export default function SalaryManagementPage() {
  const [salaries, setSalaries] = React.useState<EmployeeSalary[]>([])
  const [staffDirectory, setStaffDirectory] = React.useState<StaffItem[]>([])
  const [treasuryAccounts, setTreasuryAccounts] = React.useState<TreasuryAccount[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedMonth, setSelectedMonth] = React.useState(getCurrentMonthString())
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "Draft" | "Disbursed">("all")
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all")

  // Assign Salary Dialog State
  const [isAssignOpen, setIsAssignOpen] = React.useState(false)
  const [selectedStaff, setSelectedStaff] = React.useState<StaffItem | null>(null)
  const [staffPickerSearch, setStaffPickerSearch] = React.useState("")
  const [staffPickerFilter, setStaffPickerFilter] = React.useState<"all" | "unassigned" | "assigned">("unassigned")
  const [isPickerDropdownOpen, setIsPickerDropdownOpen] = React.useState(false)

  // Assign Form Values
  const [salaryFormState, setSalaryFormState] = React.useState({
    basicSalary: "25000",
    houseRent: "12500",
    medicalAllowance: "3500",
    conveyanceTaDa: "15000",
    salesIncentive: "0",
    specialBonus: "0",
    providentFund: "2500",
    taxDeduction: "1000",
    otherDeductions: "0",
    leaveDays: 0,
    bankAccount: "104-102-000000",
  })
  const [isSavingSalary, setIsSavingSalary] = React.useState(false)

  // Edit Remuneration Modal State
  const [editingRecord, setEditingRecord] = React.useState<EmployeeSalary | null>(null)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isUpdatingSalary, setIsUpdatingSalary] = React.useState(false)

  // Global Delete Modal State
  const [salaryToDelete, setSalaryToDelete] = React.useState<EmployeeSalary | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [isDeletingSalary, setIsDeletingSalary] = React.useState(false)

  // Print & Payslip Modal State
  const [printRecord, setPrintRecord] = React.useState<EmployeeSalary | null>(null)
  const [isPrintOpen, setIsPrintOpen] = React.useState(false)

  // Treasury Disbursement Modal State
  const [payingRecord, setPayingRecord] = React.useState<EmployeeSalary | null>(null)
  const [isPayOpen, setIsPayOpen] = React.useState(false)
  const [selectedTreasuryAccountId, setSelectedTreasuryAccountId] = React.useState("")
  const [disbursementMethod, setDisbursementMethod] = React.useState("BEFTN Electronic Advice")
  const [disbursing, setDisbursing] = React.useState(false)

  // Batch Generation State
  const [isGeneratingBatch, setIsGeneratingBatch] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)

      const [staffRes, salaryRes, accountsRes] = await Promise.all([
        apiFetch(`${API_URL}/staff`).catch(() => null),
        apiFetch(`${API_URL}/salary?month=${encodeURIComponent(selectedMonth)}`).catch(() => null),
        apiFetch(`${API_URL}/account-ledger/accounts`).catch(() => null),
      ])

      const staffRaw = staffRes && staffRes.ok ? await staffRes.json() : []
      const salaryRaw = salaryRes && salaryRes.ok ? await salaryRes.json() : []
      const accountsRaw = accountsRes && accountsRes.ok ? await accountsRes.json() : []

      const staffData = Array.isArray(staffRaw) ? staffRaw : staffRaw?.data || []
      const salaryData = Array.isArray(salaryRaw) ? salaryRaw : salaryRaw?.data || []
      const accountsData = Array.isArray(accountsRaw) ? accountsRaw : accountsRaw?.data || []

      setTreasuryAccounts(accountsData)

      const parsedStaff: StaffItem[] = staffData.map((s: any) => ({
        id: s.id,
        empId: s.empId || "",
        fullName: s.fullName || "Unnamed Staff",
        designation: s.role?.name || s.designation || s.department || "Staff Member",
        department: s.department || "General",
        territory: s.territory || "Dhaka HQ",
        phone: s.phone || "",
        email: s.email || "",
        status: s.status || "ACTIVE",
        baseSalary: Number(s.salaries?.[0]?.baseSalary) || 25000,
      }))
      setStaffDirectory(parsedStaff)

      setSalaries(
        salaryData.map((sal: any) => {
          let resolvedStatus: "Draft" | "Disbursed" | "Processing" = "Draft"
          const statusStr = (sal.paymentStatus || sal.status || "").toUpperCase()
          if (statusStr === "PAID" || statusStr === "DISBURSED") {
            resolvedStatus = "Disbursed"
          } else if (statusStr === "PROCESSING") {
            resolvedStatus = "Processing"
          }

          return {
            id: String(sal.id),
            empId: String(sal.staff?.empId || sal.empId || ""),
            fullName: String(sal.staff?.fullName || sal.fullName || "Staff Member"),
            designation: String(
              sal.staff?.role?.name || sal.staff?.department || sal.designation || "Staff Member"
            ),
            department: String(sal.staff?.department || sal.department || "General"),
            territory: String(sal.staff?.territory || sal.territory || "Dhaka HQ"),
            bankName: String(sal.bankName || "Eastern Bank PLC"),
            bankAccount: String(sal.bankAccount || "104-102-000000"),
            payPeriod: String(sal.payPeriod || selectedMonth),
            basicSalary: Number(sal.baseSalary || sal.basicSalary) || 0,
            houseRent: Number(sal.houseRent) || 0,
            medicalAllowance: Number(sal.medicalAllowance) || 0,
            conveyanceTaDa: Number(sal.conveyanceTaDa) || 0,
            salesIncentive: Number(sal.salesIncentive) || 0,
            specialBonus: Number(sal.specialBonus) || 0,
            providentFund: Number(sal.providentFund) || 0,
            taxDeduction: Number(sal.taxDeduction) || 0,
            otherDeductions: Number(sal.otherDeductions) || 0,
            leaveDays: Number(sal.leaveDays) || 0,
            status: resolvedStatus,
          }
        })
      )
    } catch (err) {
      console.error("Error fetching payroll data:", err)
      toast.error("Failed to load payroll data. Please check connection.")
    } finally {
      setLoading(false)
    }
  }, [selectedMonth])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const getGross = (r: {
    basicSalary: number
    houseRent: number
    medicalAllowance: number
    conveyanceTaDa: number
    salesIncentive: number
    specialBonus: number
  }) =>
    (r.basicSalary || 0) +
    (r.houseRent || 0) +
    (r.medicalAllowance || 0) +
    (r.conveyanceTaDa || 0) +
    (r.salesIncentive || 0) +
    (r.specialBonus || 0)

  const getDeductions = (r: {
    providentFund: number
    taxDeduction: number
    otherDeductions: number
  }) => (r.providentFund || 0) + (r.taxDeduction || 0) + (r.otherDeductions || 0)

  const getNet = (r: any) => getGross(r) - getDeductions(r)

  // Real-time calculation for the assign form
  const formCalculations = React.useMemo(() => {
    const basic = parseFloat(salaryFormState.basicSalary) || 0
    const rent = parseFloat(salaryFormState.houseRent) || 0
    const med = parseFloat(salaryFormState.medicalAllowance) || 0
    const tada = parseFloat(salaryFormState.conveyanceTaDa) || 0
    const inc = parseFloat(salaryFormState.salesIncentive) || 0
    const bonus = parseFloat(salaryFormState.specialBonus) || 0
    const pf = parseFloat(salaryFormState.providentFund) || 0
    const tax = parseFloat(salaryFormState.taxDeduction) || 0
    const other = parseFloat(salaryFormState.otherDeductions) || 0

    const gross = basic + rent + med + tada + inc + bonus
    const deductions = pf + tax + other
    const net = gross - deductions

    return { gross, deductions, net }
  }, [salaryFormState])

  // Filter staff directory for the searchable selector
  const assignedEmpIds = React.useMemo(() => {
    return new Set(salaries.map((s) => s.empId))
  }, [salaries])

  const filteredStaffPickerList = React.useMemo(() => {
    const q = staffPickerSearch.trim().toLowerCase()
    return staffDirectory.filter((staff) => {
      const isAssigned = assignedEmpIds.has(staff.empId)
      if (staffPickerFilter === "unassigned" && isAssigned) return false
      if (staffPickerFilter === "assigned" && !isAssigned) return false

      if (!q) return true
      return (
        staff.fullName.toLowerCase().includes(q) ||
        staff.empId.toLowerCase().includes(q) ||
        staff.designation.toLowerCase().includes(q) ||
        staff.department.toLowerCase().includes(q) ||
        staff.territory.toLowerCase().includes(q)
      )
    })
  }, [staffDirectory, assignedEmpIds, staffPickerSearch, staffPickerFilter])

  // Auto-fill values when a staff member is selected
  const handleSelectStaff = (staff: StaffItem) => {
    setSelectedStaff(staff)
    setIsPickerDropdownOpen(false)

    // Check if staff already has a salary record for this month
    const existingForMonth = salaries.find((s) => s.empId === staff.empId)
    if (existingForMonth) {
      setSalaryFormState({
        basicSalary: String(existingForMonth.basicSalary),
        houseRent: String(existingForMonth.houseRent),
        medicalAllowance: String(existingForMonth.medicalAllowance),
        conveyanceTaDa: String(existingForMonth.conveyanceTaDa),
        salesIncentive: String(existingForMonth.salesIncentive),
        specialBonus: String(existingForMonth.specialBonus),
        providentFund: String(existingForMonth.providentFund),
        taxDeduction: String(existingForMonth.taxDeduction),
        otherDeductions: String(existingForMonth.otherDeductions),
        leaveDays: existingForMonth.leaveDays || 0,
        bankAccount: existingForMonth.bankAccount || "104-102-000000",
      })
      toast.info(`Loaded existing ${selectedMonth} structure for ${staff.fullName}`)
    } else {
      // Use defaults based on staff base salary
      const base = staff.baseSalary || 25000
      setSalaryFormState({
        basicSalary: String(base),
        houseRent: String(Math.round(base * 0.5)),
        medicalAllowance: "3500",
        conveyanceTaDa: "15000",
        salesIncentive: "0",
        specialBonus: "0",
        providentFund: String(Math.round(base * 0.1)),
        taxDeduction: "1000",
        otherDeductions: "0",
        leaveDays: 0,
        bankAccount: "104-102-000000",
      })
    }
  }

  // Handle Save / Assign Salary Structure
  const handleAssignSalary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff) {
      toast.error("Please search and select a staff member first.")
      return
    }

    const toastId = toast.loading(`Saving salary structure for ${selectedStaff.fullName}...`)
    try {
      setIsSavingSalary(true)
      const res = await apiFetch(`${API_URL}/salary`, {
        method: "POST",
        body: JSON.stringify({
          empId: selectedStaff.empId,
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
          paymentStatus: "PENDING",
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to save salary record")
      }

      toast.success(
        `Assigned salary structure for ${selectedStaff.fullName} (${selectedMonth})`,
        { id: toastId }
      )
      setIsAssignOpen(false)
      setSelectedStaff(null)
      fetchData()
    } catch (err: any) {
      console.error("Error assigning salary:", err)
      toast.error(err.message || "Failed to save salary record.", { id: toastId })
    } finally {
      setIsSavingSalary(false)
    }
  }

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRecord) return

    const toastId = toast.loading(`Updating remuneration for ${editingRecord.fullName}...`)
    try {
      setIsUpdatingSalary(true)
      const res = await apiFetch(`${API_URL}/salary/${editingRecord.id}`, {
        method: "PUT",
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
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to update salary")
      }

      toast.success(`Updated salary structure for ${editingRecord.fullName}`, { id: toastId })
      setIsEditOpen(false)
      setEditingRecord(null)
      fetchData()
    } catch (err: any) {
      console.error("Error updating salary:", err)
      toast.error(err.message || "Failed to update salary.", { id: toastId })
    } finally {
      setIsUpdatingSalary(false)
    }
  }

  // Delete Salary Confirmation
  const handleOpenDeleteModal = (record: EmployeeSalary) => {
    setSalaryToDelete(record)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDeleteSalary = async () => {
    if (!salaryToDelete) return
    const toastId = toast.loading(`Deleting salary record for ${salaryToDelete.fullName}...`)
    try {
      setIsDeletingSalary(true)
      const res = await apiFetch(`${API_URL}/salary/${salaryToDelete.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to delete salary record")
      }

      toast.success(
        `Salary record for ${salaryToDelete.fullName} removed successfully.`,
        { id: toastId }
      )
      setIsDeleteModalOpen(false)
      setSalaryToDelete(null)
      fetchData()
    } catch (err: any) {
      console.error("Error deleting salary:", err)
      toast.error(err.message || "Failed to delete salary record.", { id: toastId })
    } finally {
      setIsDeletingSalary(false)
    }
  }

  // Disburse via Treasury Outflow
  const handleDisburseToTreasury = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payingRecord || !selectedTreasuryAccountId) {
      toast.error("Please select a Source Treasury Account.")
      return
    }

    const toastId = toast.loading(`Disbursing ৳${getNet(payingRecord).toLocaleString("en-IN")} via Treasury...`)
    try {
      setDisbursing(true)
      const netAmount = getNet(payingRecord)

      // 1. Post OUTFLOW Transaction to Treasury Journal
      const journalRes = await apiFetch(`${API_URL}/account-ledger/transactions`, {
        method: "POST",
        body: JSON.stringify({
          entryDate: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          flowType: "OUTFLOW",
          particulars: `Monthly Remuneration & Payroll — ${payingRecord.fullName} (${payingRecord.empId}) for ${payingRecord.payPeriod}`,
          fundingEntity: `${payingRecord.fullName} (${payingRecord.designation})`,
          method: disbursementMethod,
          amount: netAmount,
          sourceAccountId: selectedTreasuryAccountId,
          reconciliationStatus: "Reconciled",
        }),
      })

      if (!journalRes.ok) {
        const errorData = await journalRes.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || "Failed to post Treasury Outflow entry")
      }

      // 2. Update Salary Status to PAID / Disbursed
      const updateRes = await apiFetch(`${API_URL}/salary/${payingRecord.id}`, {
        method: "PUT",
        body: JSON.stringify({
          paymentStatus: "PAID",
          status: "Disbursed",
        }),
      })

      if (!updateRes.ok) {
        console.warn("Could not set salary status to PAID in db")
      }

      toast.success(
        `Disbursed ৳${netAmount.toLocaleString("en-IN")} to ${payingRecord.fullName}. Treasury ledger updated.`,
        { id: toastId }
      )
      setIsPayOpen(false)
      setPayingRecord(null)
      fetchData()
    } catch (err: any) {
      console.error("Disbursement Error:", err)
      toast.error(err.message || "Failed to post disbursement to Treasury.", { id: toastId })
    } finally {
      setDisbursing(false)
    }
  }

  // Batch Auto-Generate Payroll for remaining active staff
  const handleAutoGeneratePayroll = async () => {
    const unassignedCount = staffDirectory.filter(
      (s) => s.status === "ACTIVE" && !assignedEmpIds.has(s.empId)
    ).length

    if (unassignedCount === 0) {
      toast.info(`All active staff members already have payroll records for ${selectedMonth}.`)
      return
    }

    const toastId = toast.loading(`Auto-generating payroll for ${unassignedCount} active staff members...`)
    try {
      setIsGeneratingBatch(true)
      const res = await apiFetch(`${API_URL}/salary/generate`, {
        method: "POST",
        body: JSON.stringify({ payPeriod: selectedMonth }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Failed to generate payroll batch")
      }

      const resData = await res.json()
      const createdCount = Array.isArray(resData?.data) ? resData.data.length : unassignedCount

      toast.success(
        `Generated payroll for ${createdCount} staff members for ${selectedMonth}!`,
        { id: toastId }
      )
      fetchData()
    } catch (err: any) {
      console.error("Batch generation error:", err)
      toast.error(err.message || "Failed to auto-generate payroll.", { id: toastId })
    } finally {
      setIsGeneratingBatch(false)
    }
  }

  // Export Payroll to Excel Spreadsheet
  const handleExportExcel = () => {
    if (salaries.length === 0) {
      toast.info(`No salary records to export for ${selectedMonth}.`)
      return
    }

    try {
      const exportRows = salaries.map((s, idx) => ({
        "SL": idx + 1,
        "Employee ID": s.empId,
        "Full Name": s.fullName,
        "Designation": s.designation,
        "Department": s.department,
        "Territory": s.territory,
        "Pay Period": s.payPeriod,
        "Basic Salary (BDT)": s.basicSalary,
        "House Rent (BDT)": s.houseRent,
        "Medical Allowance (BDT)": s.medicalAllowance,
        "TA-DA Allowance (BDT)": s.conveyanceTaDa,
        "Sales Incentive (BDT)": s.salesIncentive,
        "Special Bonus (BDT)": s.specialBonus,
        "Gross Earnings (BDT)": getGross(s),
        "Provident Fund (BDT)": s.providentFund,
        "Tax Deduction (BDT)": s.taxDeduction,
        "Other Deductions (BDT)": s.otherDeductions,
        "Total Deductions (BDT)": getDeductions(s),
        "Net Payable (BDT)": getNet(s),
        "Leave Days": s.leaveDays,
        "Payment Status": s.status,
        "Bank Name": s.bankName,
        "Bank Account": s.bankAccount,
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, `Payroll ${selectedMonth}`)

      const fileName = `AK_Pharma_Payroll_${selectedMonth.replace(/\s+/g, "_")}.xlsx`
      XLSX.writeFile(workbook, fileName)
      toast.success(`Exported ${salaries.length} records to ${fileName}`)
    } catch (err) {
      console.error("Export error:", err)
      toast.error("Failed to generate Excel file.")
    }
  }

  // Payslip Print Function
  const handleTriggerPrint = () => {
    if (!printRecord) return

    const existingIframe = document.getElementById("payslip-print-iframe")
    if (existingIframe) existingIframe.remove()

    const iframe = document.createElement("iframe")
    iframe.id = "payslip-print-iframe"
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "none"
    document.body.appendChild(iframe)

    const grossEarnings = getGross(printRecord)
    const totalDeductions = getDeductions(printRecord)
    const netPayable = grossEarnings - totalDeductions

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${printRecord.fullName} - ${printRecord.payPeriod}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; padding: 36px; margin: 0; background: #ffffff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0090FF; padding-bottom: 18px; margin-bottom: 24px; }
            .company { font-size: 24px; font-weight: 800; color: #0090FF; letter-spacing: -0.5px; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 500; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 18px; border-radius: 10px; margin-bottom: 24px; font-size: 13px; border: 1px solid #e2e8f0; }
            .grid-label { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
            .grid-val { font-weight: 700; color: #0f172a; }
            .sections { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 13px; margin-bottom: 24px; }
            .box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; background: #ffffff; }
            .box-title { font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
            .total-row { display: flex; justify-content: space-between; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-weight: 700; font-size: 13px; }
            .net-box { background: #f0fdf4; border: 1px solid #86efac; padding: 18px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 800; color: #166534; margin-bottom: 24px; }
            .leave-info { font-size: 12px; color: #475569; margin-bottom: 32px; padding: 12px 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
            .signatures { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 40px; }
            .sig-line { width: 180px; border-top: 1px solid #94a3b8; text-align: center; padding-top: 6px; }
            .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company">AK PHARMA LTD.</div>
              <div class="subtitle">Official Monthly Pay Advice & Salary Payslip</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Gulshan Corporate Office, Dhaka, Bangladesh</div>
            </div>
            <div class="text-right">
              <div style="font-size: 16px; font-weight: 800; color: #0090FF;">${printRecord.payPeriod}</div>
              <div class="subtitle mono">Ref: AKP/${printRecord.empId}/SAL</div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Status: ${printRecord.status.toUpperCase()}</div>
            </div>
          </div>

          <div class="grid">
            <div>
              <div class="grid-label">Employee Details</div>
              <div class="grid-val">${printRecord.fullName}</div>
              <div style="color: #475569; font-size: 12px; margin-top: 2px;">
                ID: <span class="mono">${printRecord.empId}</span> • ${printRecord.designation}
              </div>
            </div>
            <div>
              <div class="grid-label">Department & Bank</div>
              <div class="grid-val">${printRecord.department} (${printRecord.territory})</div>
              <div style="color: #475569; font-size: 12px; margin-top: 2px;" class="mono">
                ${printRecord.bankName} (${printRecord.bankAccount})
              </div>
            </div>
          </div>

          <div class="sections">
            <div class="box">
              <div class="box-title" style="color: #059669;">Earnings Breakdown</div>
              <div class="row"><span>Basic Salary</span><span class="mono">৳${printRecord.basicSalary.toLocaleString("en-IN")}</span></div>
              <div class="row"><span>House Rent Allowance (50%)</span><span class="mono">৳${printRecord.houseRent.toLocaleString("en-IN")}</span></div>
              <div class="row"><span>Medical Allowance</span><span class="mono">৳${printRecord.medicalAllowance.toLocaleString("en-IN")}</span></div>
              <div class="row"><span>TA-DA / Conveyance</span><span class="mono">৳${printRecord.conveyanceTaDa.toLocaleString("en-IN")}</span></div>
              <div class="row"><span>Sales Performance Incentive</span><span class="mono" style="color: #059669;">+৳${printRecord.salesIncentive.toLocaleString("en-IN")}</span></div>
              <div class="row"><span>Special Festival / Bonus</span><span class="mono" style="color: #059669;">+৳${printRecord.specialBonus.toLocaleString("en-IN")}</span></div>
              <div class="total-row"><span>Total Gross Earnings</span><span class="mono" style="color: #059669;">৳${grossEarnings.toLocaleString("en-IN")}</span></div>
            </div>

            <div class="box">
              <div class="box-title" style="color: #e11d48;">Deductions & Withholdings</div>
              <div class="row"><span>Provident Fund (PF 10%)</span><span class="mono" style="color: #e11d48;">৳${printRecord.providentFund.toLocaleString("en-IN")}</span></div>
              <div class="row"><span>Income Tax Withholding</span><span class="mono" style="color: #e11d48;">৳${printRecord.taxDeduction.toLocaleString("en-IN")}</span></div>
              <div class="row"><span>Other Advance / Deductions</span><span class="mono" style="color: #e11d48;">৳${printRecord.otherDeductions.toLocaleString("en-IN")}</span></div>
              <div class="total-row" style="color: #e11d48;"><span>Total Deductions</span><span class="mono">-৳${totalDeductions.toLocaleString("en-IN")}</span></div>
            </div>
          </div>

          <div class="leave-info">
            <strong>Attendance & Leave Summary:</strong> Recorded Leave Days for ${printRecord.payPeriod}: <strong>${printRecord.leaveDays || 0} Day(s)</strong>.
          </div>

          <div class="net-box">
            <span>NET REMUNERATION PAYABLE:</span>
            <span class="mono" style="font-size: 20px;">৳${netPayable.toLocaleString("en-IN")}</span>
          </div>

          <div class="signatures">
            <div class="sig-line">Prepared & Checked By<br/><small style="color: #94a3b8;">HR Department</small></div>
            <div class="sig-line">Authorized Signatory<br/><small style="color: #94a3b8;">Finance & Accounts</small></div>
            <div class="sig-line">Employee Signature<br/><small style="color: #94a3b8;">Received / Acknowledged</small></div>
          </div>
        </body>
      </html>
    `

    const iframeDoc = iframe.contentWindow?.document
    if (iframeDoc) {
      iframeDoc.open()
      iframeDoc.write(htmlContent)
      iframeDoc.close()

      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      }, 300)
    }
  }

  // Month navigation helpers
  const handlePrevMonth = () => {
    const idx = MONTHS_LIST.indexOf(selectedMonth)
    if (idx > 0) {
      setSelectedMonth(MONTHS_LIST[idx - 1])
    }
  }

  const handleNextMonth = () => {
    const idx = MONTHS_LIST.indexOf(selectedMonth)
    if (idx < MONTHS_LIST.length - 1) {
      setSelectedMonth(MONTHS_LIST[idx + 1])
    }
  }

  // Departments list for filter
  const allDepartments = React.useMemo(() => {
    const depts = new Set<string>()
    staffDirectory.forEach((s) => {
      if (s.department) depts.add(s.department)
    })
    return Array.from(depts)
  }, [staffDirectory])

  // KPI Calculations
  const metrics = React.useMemo(() => {
    const totalStaffCount = staffDirectory.length
    const assignedCount = salaries.length
    const unassignedCount = Math.max(0, totalStaffCount - assignedCount)

    let totalGross = 0
    let totalDeductions = 0
    let totalNet = 0
    let disbursedNet = 0
    let disbursedCount = 0
    let draftCount = 0

    salaries.forEach((s) => {
      const g = getGross(s)
      const d = getDeductions(s)
      const n = g - d
      totalGross += g
      totalDeductions += d
      totalNet += n

      if (s.status === "Disbursed") {
        disbursedNet += n
        disbursedCount++
      } else {
        draftCount++
      }
    })

    const coveragePct = totalStaffCount > 0 ? Math.round((assignedCount / totalStaffCount) * 100) : 0

    return {
      totalStaffCount,
      assignedCount,
      unassignedCount,
      coveragePct,
      totalGross,
      totalDeductions,
      totalNet,
      disbursedNet,
      disbursedCount,
      draftCount,
    }
  }, [staffDirectory, salaries])

  // Filtered salary records for the table
  const filteredSalaries = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return salaries.filter((s) => {
      if (statusFilter === "Draft" && s.status === "Disbursed") return false
      if (statusFilter === "Disbursed" && s.status !== "Disbursed") return false
      if (departmentFilter !== "all" && s.department !== departmentFilter) return false

      if (!q) return true
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.empId.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.territory.toLowerCase().includes(q)
      )
    })
  }, [salaries, searchQuery, statusFilter, departmentFilter])

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* Top Header & Month Switcher */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0090FF]/10 text-[#0090FF]">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Salary & Monthly Payroll Management
              </h1>
              <p className="text-xs text-slate-500">
                Automated monthly salary structuring, searchable staff assignment, Treasury disbursement, and payslips.
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              disabled={MONTHS_LIST.indexOf(selectedMonth) <= 0}
              className="h-8 w-8 text-slate-600 hover:text-slate-900"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="h-3.5 w-3.5 text-[#0090FF]" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-7 w-[150px] border-none bg-transparent text-xs font-bold shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64 text-xs">
                  {MONTHS_LIST.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              disabled={MONTHS_LIST.indexOf(selectedMonth) >= MONTHS_LIST.length - 1}
              className="h-8 w-8 text-slate-600 hover:text-slate-900"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {selectedMonth !== getCurrentMonthString() && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMonth(getCurrentMonthString())}
              className="h-9 rounded-lg text-xs font-medium text-slate-600 hover:text-[#0090FF]"
            >
              Current Month
            </Button>
          )}

          {/* Quick Auto-Generate Batch Button */}
          <Button
            size="sm"
            variant="outline"
            disabled={isGeneratingBatch || metrics.unassignedCount === 0}
            onClick={handleAutoGeneratePayroll}
            className="h-9 gap-1.5 rounded-lg border-emerald-200 bg-emerald-50/50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100/70"
            title="Generate payroll for all active unassigned staff using their default salary"
          >
            {isGeneratingBatch ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
            )}
            Auto-Generate ({metrics.unassignedCount})
          </Button>

          {/* Assign Salary Dialog Trigger */}
          <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedStaff(null)
                  setStaffPickerSearch("")
                  setStaffPickerFilter("unassigned")
                }}
                className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0080e5]"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Assign Salary Structure
              </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 sm:max-w-[640px]">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-50 p-2 text-[#0090FF]">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900">
                      Assign Monthly Remuneration
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      Configure individual earnings and deductions for <span className="font-semibold text-slate-700">{selectedMonth}</span>.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleAssignSalary} className="space-y-5 pt-2">
                {/* SEARCHABLE & SELECTIVE STAFF MEMBER PICKER */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800">
                      Staff Member <span className="text-rose-500">*</span>
                    </Label>
                    {selectedStaff && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStaff(null)
                          setIsPickerDropdownOpen(true)
                        }}
                        className="h-6 gap-1 px-2 text-[11px] font-medium text-[#0090FF] hover:bg-blue-50"
                      >
                        <ArrowRightLeft className="h-3 w-3" />
                        Change Staff
                      </Button>
                    )}
                  </div>

                  {/* Selected Staff Showcase Card */}
                  {selectedStaff ? (
                    <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-blue-200 bg-white">
                          <AvatarFallback className="bg-[#0090FF] text-xs font-bold text-white">
                            {selectedStaff.fullName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {selectedStaff.fullName}
                            </span>
                            <Badge variant="outline" className="font-mono text-[10px] bg-white text-slate-700">
                              {selectedStaff.empId}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>{selectedStaff.designation}</span>
                            <span>•</span>
                            <span>{selectedStaff.department}</span>
                            <span>•</span>
                            <span className="text-slate-400">{selectedStaff.territory}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {assignedEmpIds.has(selectedStaff.empId) ? (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] font-semibold border-none">
                            Updating Current Record
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] font-semibold border-none">
                            New Month Entry
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Searchable Staff Selector Popover Dropdown */
                    <div className="relative">
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 shadow-inner">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Search staff by full name, ID (e.g. 26001), department, designation..."
                            value={staffPickerSearch}
                            onChange={(e) => {
                              setStaffPickerSearch(e.target.value)
                              setIsPickerDropdownOpen(true)
                            }}
                            onFocus={() => setIsPickerDropdownOpen(true)}
                            className="h-9 bg-white pl-8 pr-8 text-xs shadow-sm"
                          />
                          {staffPickerSearch && (
                            <button
                              type="button"
                              onClick={() => setStaffPickerSearch("")}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant={staffPickerFilter === "unassigned" ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setStaffPickerFilter("unassigned")}
                              className={`h-6 rounded-md px-2 text-[11px] font-medium ${
                                staffPickerFilter === "unassigned"
                                  ? "bg-[#0090FF] text-white"
                                  : "text-slate-600 hover:bg-slate-200/60"
                              }`}
                            >
                              Unassigned ({metrics.unassignedCount})
                            </Button>
                            <Button
                              type="button"
                              variant={staffPickerFilter === "all" ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setStaffPickerFilter("all")}
                              className={`h-6 rounded-md px-2 text-[11px] font-medium ${
                                staffPickerFilter === "all"
                                  ? "bg-[#0090FF] text-white"
                                  : "text-slate-600 hover:bg-slate-200/60"
                              }`}
                            >
                              All Staff ({staffDirectory.length})
                            </Button>
                            <Button
                              type="button"
                              variant={staffPickerFilter === "assigned" ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setStaffPickerFilter("assigned")}
                              className={`h-6 rounded-md px-2 text-[11px] font-medium ${
                                staffPickerFilter === "assigned"
                                  ? "bg-[#0090FF] text-white"
                                  : "text-slate-600 hover:bg-slate-200/60"
                              }`}
                            >
                              Assigned ({salaries.length})
                            </Button>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {filteredStaffPickerList.length} staff found
                          </span>
                        </div>

                        {/* Search Result List */}
                        <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border border-slate-200 bg-white p-1.5">
                          {filteredStaffPickerList.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                              No staff members matching your query.
                            </div>
                          ) : (
                            filteredStaffPickerList.map((staff) => {
                              const isAlreadyAssigned = assignedEmpIds.has(staff.empId)
                              return (
                                <div
                                  key={staff.id}
                                  onClick={() => handleSelectStaff(staff)}
                                  className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-blue-50/80 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <Avatar className="h-7 w-7 border border-slate-200">
                                      <AvatarFallback className="bg-slate-100 text-[10px] font-bold text-slate-700">
                                        {staff.fullName.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-900">
                                          {staff.fullName}
                                        </span>
                                        <span className="font-mono text-[10px] text-slate-500">
                                          ({staff.empId})
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        {staff.designation} • {staff.department}
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    {isAlreadyAssigned ? (
                                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[9px] text-blue-700">
                                        Assigned
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[9px] text-emerald-700 font-semibold">
                                        + Select
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* EARNINGS BREAKDOWN */}
                <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5" /> Gross Earnings Components
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-700">
                      ৳{formCalculations.gross.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Basic Salary (৳) *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={salaryFormState.basicSalary}
                        onChange={(e) =>
                          setSalaryFormState((prev) => ({
                            ...prev,
                            basicSalary: e.target.value,
                            houseRent: String(Math.round((parseFloat(e.target.value) || 0) * 0.5)),
                            providentFund: String(Math.round((parseFloat(e.target.value) || 0) * 0.1)),
                          }))
                        }
                        className="h-8 font-mono text-xs mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">House Rent (50%) (৳)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={salaryFormState.houseRent}
                        onChange={(e) =>
                          setSalaryFormState((prev) => ({ ...prev, houseRent: e.target.value }))
                        }
                        className="h-8 font-mono text-xs mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Medical Allowance (৳)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={salaryFormState.medicalAllowance}
                        onChange={(e) =>
                          setSalaryFormState((prev) => ({
                            ...prev,
                            medicalAllowance: e.target.value,
                          }))
                        }
                        className="h-8 font-mono text-xs mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Conveyance / TA-DA (৳)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={salaryFormState.conveyanceTaDa}
                        onChange={(e) =>
                          setSalaryFormState((prev) => ({
                            ...prev,
                            conveyanceTaDa: e.target.value,
                          }))
                        }
                        className="h-8 font-mono text-xs mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Sales Incentive (৳)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={salaryFormState.salesIncentive}
                        onChange={(e) =>
                          setSalaryFormState((prev) => ({
                            ...prev,
                            salesIncentive: e.target.value,
                          }))
                        }
                        className="h-8 font-mono text-xs mt-1 text-emerald-600"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Special Bonus (৳)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={salaryFormState.specialBonus}
                        onChange={(e) =>
                          setSalaryFormState((prev) => ({
                            ...prev,
                            specialBonus: e.target.value,
                          }))
                        }
                        className="h-8 font-mono text-xs mt-1 text-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* DEDUCTIONS BREAKDOWN */}
                <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/40 p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> Deductions & Withholdings
                    </span>
                    <span className="font-mono text-xs font-bold text-rose-600">
                      -৳{formCalculations.deductions.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Provident Fund (PF 10%) (৳)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={salaryFormState.providentFund}
                        onChange={(e) =>
                          setSalaryFormState((prev) => ({
                            ...prev,
                            providentFund: e.target.value,
                          }))
                        }
                        className="h-8 font-mono text-xs mt-1 text-rose-500"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Income Tax (৳)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={salaryFormState.taxDeduction}
                        onChange={(e) =>
                          setSalaryFormState((prev) => ({
                            ...prev,
                            taxDeduction: e.target.value,
                          }))
                        }
                        className="h-8 font-mono text-xs mt-1 text-rose-500"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-slate-700">Other Deductions (৳)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={salaryFormState.otherDeductions}
                        onChange={(e) =>
                          setSalaryFormState((prev) => ({
                            ...prev,
                            otherDeductions: e.target.value,
                          }))
                        }
                        className="h-8 font-mono text-xs mt-1 text-rose-500"
                      />
                    </div>
                  </div>

                  <div className="pt-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Recorded Leave Days (Attended Off)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={salaryFormState.leaveDays}
                      onChange={(e) =>
                        setSalaryFormState((prev) => ({
                          ...prev,
                          leaveDays: Number(e.target.value),
                        }))
                      }
                      className="h-8 text-xs mt-1 w-44"
                    />
                  </div>
                </div>

                {/* Net Pay Calculation Footer */}
                <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 p-4 border border-blue-200/80">
                  <div>
                    <span className="block text-xs font-bold text-slate-700">
                      Estimated Net Remuneration:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Gross (৳{formCalculations.gross.toLocaleString("en-IN")}) - Deductions (৳{formCalculations.deductions.toLocaleString("en-IN")})
                    </span>
                  </div>
                  <div className="font-mono text-lg font-black text-[#0090FF]">
                    ৳{formCalculations.net.toLocaleString("en-IN")}
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAssignOpen(false)}
                    className="h-9 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingSalary || !selectedStaff}
                    className="h-9 gap-1.5 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
                  >
                    {isSavingSalary && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Salary Structure
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        {/* Total Net Payroll */}
        <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Net Remuneration</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0090FF]">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-slate-900">
            ৳{metrics.totalNet.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Gross: ৳{metrics.totalGross.toLocaleString("en-IN")}</span>
            <span className="text-rose-500">-৳{metrics.totalDeductions.toLocaleString("en-IN")} ded.</span>
          </div>
        </Card>

        {/* Headcount & Coverage */}
        <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Payroll Staff Coverage</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-slate-900">
              {metrics.assignedCount}
            </span>
            <span className="text-xs text-slate-400">
              / {metrics.totalStaffCount} Active Staff
            </span>
            <Badge variant="outline" className="ml-auto text-[10px] font-semibold border-emerald-200 bg-emerald-50 text-emerald-700">
              {metrics.coveragePct}% Processed
            </Badge>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${metrics.coveragePct}%` }}
            />
          </div>
        </Card>

        {/* Disbursement Progress */}
        <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Treasury Disbursed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-emerald-600">
            ৳{metrics.disbursedNet.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{metrics.disbursedCount} Disbursed</span>
            <span className="text-amber-600">{metrics.draftCount} Pending Pay</span>
          </div>
        </Card>

        {/* Total Deductions Withheld */}
        <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Provident & Tax Withholdings</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-rose-600">
            ৳{metrics.totalDeductions.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Statutory deductions preserved for accounts ledger
          </div>
        </Card>
      </div>

      {/* FILTER CONTROLS & TABLE ACTIONS */}
      <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search staff name, EMP ID, designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-[240px] pl-8 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Department Filter */}
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Departments</SelectItem>
                {allDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Tabs */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                onClick={() => setStatusFilter("all")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  statusFilter === "all"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All ({salaries.length})
              </button>
              <button
                onClick={() => setStatusFilter("Draft")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  statusFilter === "Draft"
                    ? "bg-white text-amber-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Draft / Pending ({metrics.draftCount})
              </button>
              <button
                onClick={() => setStatusFilter("Disbursed")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  statusFilter === "Disbursed"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Disbursed ({metrics.disbursedCount})
              </button>
            </div>
          </div>

          {/* Export Action */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportExcel}
              className="h-8 gap-1.5 text-xs font-medium text-slate-700 hover:text-emerald-700"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              Export Sheet (Excel)
            </Button>
          </div>
        </div>

        {/* SALARY REGISTER TABLE */}
        <div className="overflow-x-auto pt-2">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-xs text-slate-500 hover:bg-transparent">
                <TableHead className="pl-0">Staff Member</TableHead>
                <TableHead className="text-right">Basic Salary</TableHead>
                <TableHead className="text-right">Allowances</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Remuneration</TableHead>
                <TableHead className="text-center">Leave Days</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="pr-0 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-[#0090FF]" />
                      <span className="text-xs">Loading payroll register for {selectedMonth}...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSalaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-6 w-6 text-slate-300" />
                      <span className="text-xs font-semibold text-slate-600">
                        No payroll records found for {selectedMonth}.
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Click &quot;Assign Salary Structure&quot; to add individually, or click &quot;Auto-Generate&quot; to batch create.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSalaries.map((emp) => {
                  const allowances =
                    emp.houseRent +
                    emp.medicalAllowance +
                    emp.conveyanceTaDa +
                    emp.salesIncentive +
                    emp.specialBonus
                  const ded = getDeductions(emp)
                  const net = getNet(emp)
                  const isPaid = emp.status === "Disbursed"

                  return (
                    <TableRow
                      key={emp.id}
                      className="border-b border-slate-50 text-xs hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Employee Info */}
                      <TableCell className="py-3 pl-0">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 rounded-full border border-slate-200">
                            <AvatarFallback className="bg-slate-100 text-[11px] font-bold text-slate-700">
                              {emp.fullName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="block font-bold text-slate-900">
                              {emp.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              <span className="font-mono text-slate-600">{emp.empId}</span> • {emp.designation} ({emp.department})
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Basic */}
                      <TableCell className="text-right font-mono font-medium text-slate-800">
                        ৳{emp.basicSalary.toLocaleString("en-IN")}
                      </TableCell>

                      {/* Allowances */}
                      <TableCell className="text-right font-mono text-emerald-600">
                        +৳{allowances.toLocaleString("en-IN")}
                      </TableCell>

                      {/* Deductions */}
                      <TableCell className="text-right font-mono text-rose-500">
                        -৳{ded.toLocaleString("en-IN")}
                      </TableCell>

                      {/* Net Payable */}
                      <TableCell className="text-right font-mono font-bold text-slate-900 text-sm">
                        ৳{net.toLocaleString("en-IN")}
                      </TableCell>

                      {/* Leave Days */}
                      <TableCell className="text-center">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {emp.leaveDays || 0} d
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            isPaid
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {isPaid ? "Disbursed" : "Draft"}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-0 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Treasury Pay Button */}
                          <Button
                            size="sm"
                            disabled={isPaid}
                            onClick={() => {
                              setPayingRecord(emp)
                              if (treasuryAccounts.length > 0) {
                                setSelectedTreasuryAccountId(treasuryAccounts[0].id)
                              }
                              setIsPayOpen(true)
                            }}
                            className={`h-7 gap-1 rounded-md px-2.5 text-[11px] font-bold shadow-none ${
                              isPaid
                                ? "cursor-not-allowed bg-emerald-100 text-emerald-800 opacity-60"
                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                            }`}
                          >
                            <CreditCard className="h-3 w-3" />
                            {isPaid ? "Paid" : "Pay via Treasury"}
                          </Button>

                          {/* Edit Remuneration */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRecord({ ...emp })
                              setIsEditOpen(true)
                            }}
                            className="h-7 px-2 text-[11px] text-slate-700"
                            title="Edit remuneration numbers"
                          >
                            <Pencil className="mr-1 h-3 w-3" /> Edit
                          </Button>

                          {/* Payslip Print */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPrintRecord(emp)
                              setIsPrintOpen(true)
                            }}
                            className="h-7 px-2 text-[11px] text-[#0090FF] hover:bg-blue-50"
                            title="Generate official payslip"
                          >
                            <Printer className="mr-1 h-3 w-3" /> Payslip
                          </Button>

                          {/* Delete Record */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDeleteModal(emp)}
                            className="h-7 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            title="Delete salary record"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* DISBURSE TO TREASURY MODAL */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="overflow-hidden rounded-2xl bg-white sm:max-w-[480px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Treasury Salary Disbursement
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Deducts net payable from company bank/cash vaults & posts Treasury Outflow ledger entry.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {payingRecord && (
            <form onSubmit={handleDisburseToTreasury} className="min-w-0 space-y-4 pt-1">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <div className="min-w-0 pr-3">
                  <span className="block truncate text-xs font-bold text-slate-900">
                    {payingRecord.fullName}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {payingRecord.empId} • {payingRecord.payPeriod}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="block text-[11px] text-slate-400">Net Payable Amount</span>
                  <span className="font-mono text-base font-black text-emerald-600">
                    ৳{getNet(payingRecord).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Source Treasury Account</Label>
                <Select
                  value={selectedTreasuryAccountId}
                  onValueChange={setSelectedTreasuryAccountId}
                  required
                >
                  <SelectTrigger className="h-9 w-full min-w-0 bg-white text-xs">
                    <SelectValue placeholder="Choose bank account or cash vault..." />
                  </SelectTrigger>
                  <SelectContent className="max-w-[440px] text-xs">
                    {treasuryAccounts.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No bank accounts registered in Treasury
                      </SelectItem>
                    ) : (
                      treasuryAccounts.map((acc) => {
                        const bal = Number(acc.balance || 0);
                        const formattedBal = bal < 0 
                          ? `-৳${Math.abs(bal).toLocaleString("en-IN")}`
                          : `৳${bal.toLocaleString("en-IN")}`;
                        return (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.accountTitle} ({acc.institution}) — Balance: {formattedBal}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Disbursement Method</Label>
                <Select value={disbursementMethod} onValueChange={setDisbursementMethod}>
                  <SelectTrigger className="h-9 w-full min-w-0 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="BEFTN Electronic Advice">BEFTN Electronic Advice</SelectItem>
                    <SelectItem value="NPSB Instant Transfer">NPSB Instant Transfer</SelectItem>
                    <SelectItem value="Account Payee Cheque">Account Payee Cheque</SelectItem>
                    <SelectItem value="Corporate Safe Physical Cash">Corporate Safe Physical Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-[11px] leading-relaxed text-blue-900 break-words">
                Disbursement Account on File: <strong>{payingRecord.bankName}</strong>{" "}
                (<code>{payingRecord.bankAccount}</code>)
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPayOpen(false)}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={disbursing || !selectedTreasuryAccountId}
                  className="h-9 gap-2 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  {disbursing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {disbursing ? "Disbursing & Updating..." : "Confirm & Post to Treasury"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT REMUNERATION MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl bg-white sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Remuneration — {editingRecord?.fullName}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Adjust pay components for {editingRecord?.payPeriod}.
            </DialogDescription>
          </DialogHeader>
          {editingRecord && (
            <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Basic Salary (৳)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingRecord.basicSalary}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        basicSalary: Number(e.target.value),
                      })
                    }
                    className="h-8 font-mono text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">House Rent (৳)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingRecord.houseRent}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        houseRent: Number(e.target.value),
                      })
                    }
                    className="h-8 font-mono text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Medical (৳)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingRecord.medicalAllowance}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        medicalAllowance: Number(e.target.value),
                      })
                    }
                    className="h-8 font-mono text-xs mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">TA-DA / Conveyance (৳)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingRecord.conveyanceTaDa}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        conveyanceTaDa: Number(e.target.value),
                      })
                    }
                    className="h-8 font-mono text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Sales Incentive (৳)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingRecord.salesIncentive}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        salesIncentive: Number(e.target.value),
                      })
                    }
                    className="h-8 font-mono text-xs mt-1 text-emerald-600"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Special Bonus (৳)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingRecord.specialBonus}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        specialBonus: Number(e.target.value),
                      })
                    }
                    className="h-8 font-mono text-xs mt-1 text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Provident Fund (৳)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingRecord.providentFund}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        providentFund: Number(e.target.value),
                      })
                    }
                    className="h-8 font-mono text-xs mt-1 text-rose-500"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Tax Deduction (৳)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingRecord.taxDeduction}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        taxDeduction: Number(e.target.value),
                      })
                    }
                    className="h-8 font-mono text-xs mt-1 text-rose-500"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Other Deductions (৳)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingRecord.otherDeductions}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        otherDeductions: Number(e.target.value),
                      })
                    }
                    className="h-8 font-mono text-xs mt-1 text-rose-500"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Leave Days Taken</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingRecord.leaveDays}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      leaveDays: Number(e.target.value),
                    })
                  }
                  className="h-8 text-xs mt-1 w-32"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 text-xs font-bold text-slate-900 border border-slate-200">
                <span>Calculated Net Payable:</span>
                <span className="font-mono text-base text-[#0090FF]">
                  ৳{getNet(editingRecord).toLocaleString("en-IN")}
                </span>
              </div>

              <DialogFooter>
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
                  disabled={isUpdatingSalary}
                  className="h-8 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
                >
                  {isUpdatingSalary && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* PRINT & OFFICIAL PAYSLIP MODAL */}
      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent className="max-h-[95vh] overflow-y-auto rounded-2xl bg-white sm:max-w-[720px]">
          {printRecord && (
            <div className="space-y-6">
              <div className="print-payslip-node space-y-6 rounded-xl border border-slate-200 bg-white p-8">
                <div className="flex items-start justify-between border-b-2 border-[#0090FF] pb-4">
                  <div>
                    <h2 className="text-xl font-black text-[#0090FF]">
                      AK PHARMA LTD.
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Official Monthly Pay Advice / Salary Payslip
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-black text-slate-900">
                      {printRecord.payPeriod}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Ref: AKP/{printRecord.empId}/SAL
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-xs border border-slate-200">
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Employee Name</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{printRecord.fullName}</p>
                    <p className="mt-2 text-slate-400 text-[10px] uppercase font-bold">Emp ID & Designation</p>
                    <p className="font-semibold text-slate-800">
                      {printRecord.empId} — {printRecord.designation}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Department & Territory</p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {printRecord.department} ({printRecord.territory})
                    </p>
                    <p className="mt-2 text-slate-400 text-[10px] uppercase font-bold">Disbursement Account</p>
                    <p className="font-mono text-slate-800">
                      {printRecord.bankName} ({printRecord.bankAccount})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div className="space-y-2 rounded-xl border p-3.5">
                    <p className="border-b pb-1 font-bold text-emerald-700 uppercase tracking-wider text-[11px]">
                      Earnings Breakdown
                    </p>
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span className="font-mono">৳{printRecord.basicSalary.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>House Rent (50%)</span>
                      <span className="font-mono">৳{printRecord.houseRent.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medical Allowance</span>
                      <span className="font-mono">৳{printRecord.medicalAllowance.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conveyance / TA-DA</span>
                      <span className="font-mono">৳{printRecord.conveyanceTaDa.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Sales Incentive</span>
                      <span className="font-mono">+৳{printRecord.salesIncentive.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Special Bonus</span>
                      <span className="font-mono">+৳{printRecord.specialBonus.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-bold text-emerald-700">
                      <span>Gross Earnings</span>
                      <span className="font-mono">৳{getGross(printRecord).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl border p-3.5">
                    <p className="border-b pb-1 font-bold text-rose-600 uppercase tracking-wider text-[11px]">
                      Deductions & Tax
                    </p>
                    <div className="flex justify-between text-rose-500">
                      <span>Provident Fund (PF)</span>
                      <span className="font-mono">৳{printRecord.providentFund.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-rose-500">
                      <span>Tax Withholding</span>
                      <span className="font-mono">৳{printRecord.taxDeduction.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-rose-500">
                      <span>Other Deductions</span>
                      <span className="font-mono">৳{printRecord.otherDeductions.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-bold text-rose-600">
                      <span>Total Deductions</span>
                      <span className="font-mono">-৳{getDeductions(printRecord).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <span>Attendance & Recorded Leaves:</span>
                  <strong className="font-mono">{printRecord.leaveDays || 0} Day(s) Taken</strong>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-bold text-slate-900">
                  <span className="text-emerald-900 font-extrabold">NET REMUNERATION PAYABLE:</span>
                  <span className="font-mono text-lg font-black text-emerald-700">
                    ৳{getNet(printRecord).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between border-t pt-8 text-[11px] text-slate-400">
                  <span>Authorized Signature (HR & Finance)</span>
                  <span>Employee Signature</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 print:hidden">
                <Button variant="outline" onClick={() => setIsPrintOpen(false)} className="text-xs">
                  Close
                </Button>
                <Button
                  onClick={handleTriggerPrint}
                  className="gap-1.5 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
                >
                  <Printer className="h-4 w-4" /> Print Official Payslip
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* GLOBAL DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDeleteSalary}
        title="Delete Salary Record"
        description="Are you sure you want to delete this payroll salary record for this month? This operation will remove the record from the payroll register."
        itemName={
          salaryToDelete
            ? `${salaryToDelete.fullName} (${salaryToDelete.empId} - ${salaryToDelete.payPeriod})`
            : undefined
        }
        confirmText="Delete Salary Record"
        cancelText="Cancel"
        isDeleting={isDeletingSalary}
      />
    </div>
  )
}
