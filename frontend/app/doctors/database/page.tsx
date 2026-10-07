"use client"

import * as React from "react"
import { getEndpoint } from "@/lib/api"
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
  SheetDescription,
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
  Stethoscope,
  Search,
  Filter,
  Plus,
  Download,
  MapPin,
  Building2,
  Sparkles,
  MoreHorizontal,
  Pencil,
  Trash2,
  Phone,
  Calendar,
  Users,
  Pill,
  Award,
  Clock,
  CheckCircle2,
  FileText,
  ExternalLink,
} from "lucide-react"

import { doctorFormSchema } from "@/lib/validations/doctorValidation"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"

interface DoctorRecord {
  id: string
  docCode: string
  name: string
  bmdcReg: string
  specialty: string
  designation: string
  institute: string
  chamberAddress: string
  territory: string
  contactNumber: string
  potentialCategory: "A+" | "A" | "B" | "C"
  patientVolumeDaily: number
  assignedMio: string
  status: "Active" | "Inactive"
  email?: string
  keyProducts?: string[]
  lastVisited?: string
  monthlyRevenueEst?: string
  visitFrequency?: string
}

interface StaffMember {
  id: string
  name: string
  territory?: string
}

export default function DoctorMasterDatabasePage() {
  const [doctors, setDoctors] = React.useState<DoctorRecord[]>([])
  const [staffList, setStaffList] = React.useState<StaffMember[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [specialtyFilter, setSpecialtyFilter] = React.useState("all")
  const [categoryFilter, setCategoryFilter] = React.useState("all")

  // Portfolio Sheet State
  const [selectedDoctor, setSelectedDoctor] =
    React.useState<DoctorRecord | null>(null)
  const [isPortfolioOpen, setIsPortfolioOpen] = React.useState(false)

  // Add Dialog State
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [bmdcReg, setBmdcReg] = React.useState("")
  const [specialty, setSpecialty] = React.useState("Cardiology")
  const [designation, setDesignation] = React.useState("")
  const [institute, setInstitute] = React.useState("")
  const [chamberAddress, setChamberAddress] = React.useState("")
  const [territory, setTerritory] = React.useState("Dhaka North")
  const [contactNumber, setContactNumber] = React.useState("")
  const [potentialCategory, setPotentialCategory] =
    React.useState<DoctorRecord["potentialCategory"]>("A")
  const [patientVolumeDaily, setPatientVolumeDaily] = React.useState("")
  const [assignedMio, setAssignedMio] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

  // Edit Dialog State
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingDoctor, setEditingDoctor] = React.useState<DoctorRecord | null>(
    null
  )

  // Global Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = React.useState<{
    isOpen: boolean
    doctorId: string | null
    doctorName: string | null
    isDeleting: boolean
  }>({
    isOpen: false,
    doctorId: null,
    doctorName: null,
    isDeleting: false,
  })

  // Fetch doctors and staff directory from backend
  const fetchData = async () => {
    try {
      const [docRes, staffRes] = await Promise.all([
        fetch(getEndpoint("/doctors")).catch(() => null),
        fetch(getEndpoint("/staff")).catch(() => null), // Fallback if staff endpoint is still being wired
      ])

      if (docRes && docRes.ok) {
        const docResult = await docRes.json()
        const rawData = Array.isArray(docResult)
          ? docResult
          : docResult.data || []

        const formattedDoctors: DoctorRecord[] = rawData.map(
          (doc: any, index: number) => {
            // Safely extract specialty (before parenthesis) and institute (inside parentheses)
            const rawSpecInst = doc.specialtyAndInstitute || ""
            const extractedSpecialty = rawSpecInst.includes("(")
              ? rawSpecInst.split("(")[0].trim()
              : doc.specialty || rawSpecInst || "General Physician"

            const extractedInstitute =
              rawSpecInst.includes("(") && rawSpecInst.includes(")")
                ? rawSpecInst
                    .substring(
                      rawSpecInst.indexOf("(") + 1,
                      rawSpecInst.lastIndexOf(")")
                    )
                    .trim()
                : doc.institute || "General Hospital"

            return {
              id: doc.id || String(index),
              docCode: doc.docCode || `DOC-204${index + 10}`,
              name: doc.doctorName || doc.name,
              bmdcReg: doc.bmdcRegNumber || doc.bmdcReg || "A-00000",
              specialty: extractedSpecialty,
              designation: doc.designation || "Consultant",
              institute: extractedInstitute,
              chamberAddress:
                doc.chamber || doc.chamberAddress || "General Chamber",
              territory: doc.territoryAndMio
                ? doc.territoryAndMio.split("/")[0].trim()
                : doc.territory || "Central Hub",
              contactNumber: doc.phone || doc.contactNumber || "+880 1700-000000",
              potentialCategory: doc.tier?.includes("Tier 1")
                ? "A+"
                : doc.tier?.includes("Tier 2")
                  ? "A"
                  : "B",
              patientVolumeDaily:
                doc.patientVolumeDaily !== undefined
                  ? doc.patientVolumeDaily
                  : 30,
              assignedMio: doc.territoryAndMio?.includes("MIO:")
                ? doc.territoryAndMio.split("MIO:")[1].trim()
                : doc.assignedMio || "Unassigned",
              status: "Active",
              email: doc.email || "doctor@akpharma.com",
              keyProducts: ["Standard Line Products"],
              lastVisited: "16 Sep 2026",
              monthlyRevenueEst: "৳1,50,000",
              visitFrequency: "Monthly (P2)",
            }
          }
        )

        setDoctors(formattedDoctors)
      }

      if (staffRes && staffRes.ok) {
        const staffData = await staffRes.json()
        setStaffList(
          Array.isArray(staffData) ? staffData : staffData.data || []
        )
      } else {
        // Fallback default staff list if API isn't built yet
        setStaffList([
          { id: "1", name: "Rafiqul Islam" },
          { id: "2", name: "Tanvir Ahmed" },
          { id: "3", name: "Kamrul Hasan" },
          { id: "4", name: "Enamul Haque" },
          { id: "5", name: "Sabbir Hossain" },
        ])
      }
    } catch (err) {
      console.error("Failed to fetch data from backend server:", err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [])

  const handleOpenPortfolio = (doc: DoctorRecord) => {
    setSelectedDoctor(doc)
    setIsPortfolioOpen(true)
  }

  const handleExportExcel = () => {
    const excelData = doctors.map((doc) => ({
      "Doctor ID": doc.docCode,
      "Doctor Name": doc.name,
      "BMDC Reg #": doc.bmdcReg,
      Specialty: doc.specialty,
      Designation: doc.designation,
      Institute: doc.institute,
      "Chamber Address": doc.chamberAddress,
      Territory: doc.territory,
      Contact: doc.contactNumber,
      "Rx Potential": doc.potentialCategory,
      "Daily Patients": doc.patientVolumeDaily,
      "Assigned MIO": doc.assignedMio,
      Status: doc.status,
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Doctor Master Database")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Doctor_Database_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
  }

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    const specialtyAndInstitute = institute ? `${specialty} (${institute})` : specialty
    const territoryAndMio = assignedMio ? `${territory} / MIO: ${assignedMio}` : territory
    const tier = potentialCategory === "A+" ? "Tier 1 (High Prescriber)" : "Tier 2 (Moderate)"

    const newDocPayload = {
      doctorName: name,
      phone: contactNumber,
      bmdcRegNumber: bmdcReg,
      specialtyAndInstitute,
      chamber: chamberAddress,
      territoryAndMio,
      email,
      tier,
      patientVolumeDaily: Number(patientVolumeDaily),
    }

    const validationResult = doctorFormSchema.safeParse(newDocPayload)
    if (!validationResult.success) {
      const errorsMap: Record<string, string> = {}
      validationResult.error.issues.forEach((issue) => {
        const pathKey = issue.path[0]?.toString() || "form"
        errorsMap[pathKey] = issue.message
      })
      setFormErrors(errorsMap)
      toast.error("Form validation failed. Please check the highlighted fields.")
      return
    }

    const toastId = toast.loading("Saving new doctor profile to database...")

    try {
      const res = await fetch(getEndpoint("/doctors"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationResult.data),
      })

      if (res.ok) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        setName("")
        setBmdcReg("")
        setDesignation("")
        setInstitute("")
        setChamberAddress("")
        setContactNumber("")
        setEmail("")
        setPatientVolumeDaily("")
        setAssignedMio("")
        setFormErrors({})
        setIsAddOpen(false)
        toast.success(`Successfully registered Dr. ${newDocPayload.doctorName}.`, { id: toastId })
        fetchData()
      } else {
        const errorData = await res.json().catch(() => null)
        toast.error(errorData?.message || "Server failed to save doctor record.", { id: toastId })
      }
    } catch (error) {
      console.error("Network error adding doctor:", error)
      toast.error("Network error: Could not connect to server.", { id: toastId })
    }
  }

  const handleOpenEdit = (doc: DoctorRecord) => {
    setEditingDoctor({ ...doc })
    setIsEditOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDoctor) return

    const cleanSpecialty = editingDoctor.specialty.split("(")[0].trim()
    const cleanInstitute = editingDoctor.institute.split("(")[0].trim()
    const specialtyAndInstitute = cleanInstitute
      ? `${cleanSpecialty} (${cleanInstitute})`
      : cleanSpecialty

    const updatedPayload = {
      doctorName: editingDoctor.name,
      phone: editingDoctor.contactNumber,
      bmdcRegNumber: editingDoctor.bmdcReg,
      specialtyAndInstitute,
      chamber: editingDoctor.chamberAddress,
      territoryAndMio: `${editingDoctor.territory} / MIO: ${editingDoctor.assignedMio}`,
      tier:
        editingDoctor.potentialCategory === "A+"
          ? "Tier 1 (High Prescriber)"
          : "Tier 2 (Moderate)",
      patientVolumeDaily: Number(editingDoctor.patientVolumeDaily),
    }

    const validationResult = doctorFormSchema.partial().safeParse(updatedPayload)
    if (!validationResult.success) {
      toast.error(validationResult.error.issues.map((i) => i.message).join("\n"))
      return
    }

    const toastId = toast.loading("Updating doctor profile in database...")

    try {
      const res = await fetch(
        getEndpoint(`/doctors/${editingDoctor.id}`),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validationResult.data),
        }
      )

      if (res.ok) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        setIsEditOpen(false)
        setEditingDoctor(null)
        toast.success(`Doctor profile for ${editingDoctor.name} updated successfully!`, { id: toastId })
        fetchData()
      } else {
        const errorData = await res.json().catch(() => null)
        toast.error(errorData?.message || "Failed to update doctor record on the server.", { id: toastId })
      }
    } catch (error) {
      console.error("Failed to update doctor record:", error)
      toast.error("Network error: Failed to update doctor record.", { id: toastId })
    }
  }

  const promptDeleteDoctor = (doc: DoctorRecord) => {
    setDeleteModal({
      isOpen: true,
      doctorId: doc.id,
      doctorName: doc.name,
      isDeleting: false,
    })
  }

  const handleConfirmDeleteDoctor = async () => {
    if (!deleteModal.doctorId) return
    const id = deleteModal.doctorId
    const targetName = deleteModal.doctorName || "Doctor"

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }))
    const toastId = toast.loading(`Deleting doctor profile for ${targetName}...`)

    try {
      const res = await fetch(getEndpoint(`/doctors/${id}`), {
        method: "DELETE",
      })
      if (res.ok) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        setDoctors((prev) => prev.filter((doc) => doc.id !== id))
        if (selectedDoctor && selectedDoctor.id === id) {
          setIsPortfolioOpen(false)
        }
        toast.success(`Doctor profile for ${targetName} deleted successfully.`, { id: toastId })
        setDeleteModal({ isOpen: false, doctorId: null, doctorName: null, isDeleting: false })
        fetchData()
      } else {
        const errorData = await res.json().catch(() => null)
        toast.error(errorData?.message || "Failed to delete doctor record.", { id: toastId })
        setDeleteModal((prev) => ({ ...prev, isDeleting: false }))
      }
    } catch (error) {
      console.error("Failed to delete doctor from backend:", error)
      toast.error("Network error: Could not delete doctor record.", { id: toastId })
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.bmdcReg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.contactNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.territory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.assignedMio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.chamberAddress.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSpecialty =
      specialtyFilter === "all" ||
      doc.specialty.toLowerCase().includes(specialtyFilter.toLowerCase())

    const matchesCategory =
      categoryFilter === "all" || doc.potentialCategory === categoryFilter

    return matchesSearch && matchesSpecialty && matchesCategory
  })

  const categoryACount = doctors.filter(
    (d) => d.potentialCategory === "A+" || d.potentialCategory === "A"
  ).length
  const totalPatientReach = doctors.reduce(
    (acc, curr) => acc + curr.patientVolumeDaily,
    0
  )

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Doctor Registry — Master Database
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Central repository of licensed practitioners, BMDC numbers, direct
            contacts, and clinical portfolios.
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
            Export to Excel
          </Button>

          {/* Add Doctor Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
              >
                <Plus className="h-4 w-4" />
                Add New Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl bg-white sm:max-w-[540px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Register Medical Practitioner
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Enter physician credentials, BMDC number, contact phone, and
                  chamber details.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddDoctor} className="space-y-3.5 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Doctor Full Name
                    </Label>
                    <Input
                      placeholder="e.g. Dr. K. M. Saifullah"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      BMDC Reg. Number
                    </Label>
                    <Input
                      placeholder="e.g. A-49821"
                      value={bmdcReg}
                      onChange={(e) => setBmdcReg(e.target.value)}
                      required
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Specialty
                    </Label>
                    <Input
                      placeholder="e.g. Cardiology"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Designation
                    </Label>
                    <Input
                      placeholder="e.g. Associate Professor"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Affiliated Hospital / Medical College
                  </Label>
                  <Input
                    placeholder="e.g. Dhaka Medical College Hospital"
                    value={institute}
                    onChange={(e) => setInstitute(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Primary Chamber Address
                  </Label>
                  <Input
                    placeholder="e.g. Room 302, Popular Diagnostic Center, Mirpur"
                    value={chamberAddress}
                    onChange={(e) => setChamberAddress(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Phone Number *
                    </Label>
                    <Input
                      placeholder="+880 1700-000000"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      required
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Email Address *
                    </Label>
                    <Input
                      type="email"
                      placeholder="e.g. doctor@akpharma.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Territory Hub *
                    </Label>
                    <Input
                      placeholder="e.g. Dhaka North"
                      value={territory}
                      onChange={(e) => setTerritory(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Rx Tier
                    </Label>
                    <Select
                      value={potentialCategory}
                      onValueChange={(val) =>
                        setPotentialCategory(
                          val as DoctorRecord["potentialCategory"]
                        )
                      }
                    >
                      <SelectTrigger className="h-8 bg-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="A+">Category A+</SelectItem>
                        <SelectItem value="A">Category A</SelectItem>
                        <SelectItem value="B">Category B</SelectItem>
                        <SelectItem value="C">Category C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Daily Patients
                    </Label>
                    <Input
                      type="number"
                      placeholder="35"
                      value={patientVolumeDaily}
                      onChange={(e) => setPatientVolumeDaily(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Assigned MIO
                    </Label>
                    <Select value={assignedMio} onValueChange={setAssignedMio}>
                      <SelectTrigger className="h-8 bg-white text-xs">
                        <SelectValue placeholder="Select Staff" />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        {staffList.map((staff) => (
                          <SelectItem key={staff.id} value={staff.name}>
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    Save to Directory
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total Registered Doctors
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <Stethoscope className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {doctors.length}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Click any doctor row to view full portfolio
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Tier A & A+ High Yield
            </span>
            <div className="rounded-lg bg-blue-50 p-1.5 text-[#0090FF]">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {categoryACount} Specialists
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Priority call targets for field force
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Daily Patient Footfall
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            ~{totalPatientReach} / day
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Cumulative consultation reach
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Export & Backup
            </span>
            <Badge
              variant="outline"
              className="rounded-md border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
            >
              Synchronized
            </Badge>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            Excel / XLSX
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Direct table export ready
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search doctor, phone, BMDC, or chamber..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="h-8 w-[150px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Specialties" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Specialties</SelectItem>
              <SelectItem value="cardiology">Cardiology</SelectItem>
              <SelectItem value="gynecology">Gynecology</SelectItem>
              <SelectItem value="medicine">Medicine</SelectItem>
              <SelectItem value="pediatrics">Pediatrics</SelectItem>
              <SelectItem value="orthopedic">Orthopedics</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 w-[130px] border-slate-200 bg-white text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="A+">Category A+</SelectItem>
              <SelectItem value="A">Category A</SelectItem>
              <SelectItem value="B">Category B</SelectItem>
              <SelectItem value="C">Category C</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Table with Clickable Doctor Name & Visible Phone */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              DOCTOR MASTER DIRECTORY
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Click a physician's name to inspect their full institutional
              portfolio and prescription metrics
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredDoctors.length} Registered Practitioners
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0 text-xs font-medium text-slate-600">
                Doctor & Direct Phone
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                BMDC Reg #
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Specialty & Institute
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Chamber Address
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Territory / MIO
              </TableHead>
              <TableHead className="text-center text-xs font-medium text-slate-600">
                Patients/day
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Potential Tier
              </TableHead>
              <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDoctors.map((doc) => (
              <TableRow
                key={doc.id}
                className="border-b border-slate-50 hover:bg-slate-50/50"
              >
                <TableCell className="py-3 pl-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      onClick={() => handleOpenPortfolio(doc)}
                      className="h-8 w-8 cursor-pointer rounded-full border border-slate-200 transition-colors hover:border-[#0090FF]"
                    >
                      <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                        {doc.name.replace("Dr. ", "").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                      <button
                        onClick={() => handleOpenPortfolio(doc)}
                        className="block text-left text-xs font-bold text-slate-900 hover:text-[#0090FF] hover:underline"
                      >
                        {doc.name}
                      </button>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Phone className="h-2.5 w-2.5 text-slate-400" />
                        <span className="font-mono font-medium text-slate-600">
                          {doc.contactNumber}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">
                          {doc.designation}
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3 font-mono text-xs font-medium text-slate-600">
                  {doc.bmdcReg}
                </TableCell>

                <TableCell className="py-3 text-xs text-slate-700">
                  <div>
                    <span className="block font-semibold text-slate-900">
                      {doc.specialty}
                    </span>
                    <span className="block max-w-[190px] truncate text-[10px] text-slate-400">
                      {doc.institute}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="max-w-[210px] truncate py-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                    <span className="truncate">{doc.chamberAddress}</span>
                  </div>
                </TableCell>

                <TableCell className="py-3 text-xs text-slate-700">
                  <div>
                    <span className="block font-medium text-slate-900">
                      {doc.territory}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      MIO: {doc.assignedMio}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="py-3 text-center font-mono text-xs font-bold text-slate-900">
                  {doc.patientVolumeDaily}
                </TableCell>

                <TableCell className="py-3 text-xs">
                  <Badge
                    variant="outline"
                    className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold ${
                      doc.potentialCategory === "A+"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : doc.potentialCategory === "A"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : doc.potentialCategory === "B"
                            ? "border-slate-200 bg-slate-50 text-slate-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    Category {doc.potentialCategory}
                  </Badge>
                </TableCell>

                <TableCell className="py-3 pr-0 text-right text-xs">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-white">
                      <DropdownMenuLabel className="text-[10px] tracking-wider text-slate-400 uppercase">
                        Physician Options
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleOpenPortfolio(doc)}
                        className="cursor-pointer text-xs text-slate-700"
                      >
                        <FileText className="mr-2 h-3.5 w-3.5 text-blue-600" />
                        View Full Portfolio
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenEdit(doc)}
                        className="cursor-pointer text-xs text-slate-700"
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5 text-slate-500" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => promptDeleteDoctor(doc)}
                        className="cursor-pointer text-xs text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete Doctor
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Doctor Portfolio Slide-Over (Sheet) */}
      <Sheet open={isPortfolioOpen} onOpenChange={setIsPortfolioOpen}>
        <SheetContent className="w-full overflow-y-auto border-l border-slate-200 bg-white p-0 sm:max-w-md">
          {selectedDoctor && (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                <div className="flex items-start justify-between">
                  <Avatar className="h-14 w-14 rounded-xl border-2 border-white shadow-xs">
                    <AvatarFallback className="bg-blue-600 text-base font-bold text-white">
                      {selectedDoctor.name
                        .replace("Dr. ", "")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Badge
                    variant="outline"
                    className={`rounded-lg px-3 py-1 text-xs font-bold ${
                      selectedDoctor.potentialCategory === "A+"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    Category {selectedDoctor.potentialCategory} Tier
                  </Badge>
                </div>

                <div className="mt-4">
                  <h2 className="text-lg leading-tight font-bold text-slate-900">
                    {selectedDoctor.name}
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold text-[#0090FF]">
                    {selectedDoctor.specialty}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedDoctor.designation} • {selectedDoctor.institute}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-slate-200/60 pt-4">
                  <Button
                    size="sm"
                    className="h-8 flex-1 gap-1.5 bg-[#0090FF] text-xs font-medium text-white shadow-none hover:bg-[#0080e5]"
                    onClick={() =>
                      window.open(`tel:${selectedDoctor.contactNumber}`)
                    }
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call {selectedDoctor.contactNumber}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    onClick={() => handleOpenEdit(selectedDoctor)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 space-y-6 p-6 text-xs">
                <div>
                  <h4 className="mb-2.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Registration & Affiliation
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                      <span className="block text-[10px] font-medium text-slate-400">
                        BMDC Reg #
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {selectedDoctor.bmdcReg}
                      </span>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                      <span className="block text-[10px] font-medium text-slate-400">
                        Doctor Internal ID
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {selectedDoctor.docCode}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Prescription Capacity
                  </h4>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-center">
                      <span className="block text-[10px] text-slate-400">
                        Daily Footfall
                      </span>
                      <span className="mt-0.5 block font-mono text-base font-bold text-slate-900">
                        {selectedDoctor.patientVolumeDaily}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        Patients/day
                      </span>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-center">
                      <span className="block text-[10px] text-slate-400">
                        Est. Monthly Rx
                      </span>
                      <span className="mt-0.5 block font-mono text-base font-bold text-slate-900">
                        {selectedDoctor.monthlyRevenueEst || "৳1,50,000"}
                      </span>
                      <span className="text-[9px] font-semibold text-emerald-600">
                        +8% yield
                      </span>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-center">
                      <span className="block text-[10px] text-slate-400">
                        Roster Priority
                      </span>
                      <span className="mt-0.5 block text-base font-bold text-slate-900">
                        {selectedDoctor.potentialCategory}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        High Yield
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Chamber & Territory Assignment
                  </h4>
                  <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <div>
                        <span className="block font-semibold text-slate-800">
                          Primary Chamber
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {selectedDoctor.chamberAddress}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px]">
                      <span className="text-slate-500">
                        Territory:{" "}
                        <strong className="text-slate-800">
                          {selectedDoctor.territory}
                        </strong>
                      </span>
                      <span className="text-slate-500">
                        Assigned MIO:{" "}
                        <strong className="text-slate-800">
                          {selectedDoctor.assignedMio}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Key Promoted Formulations
                  </h4>
                  <div className="space-y-1.5">
                    {(
                      selectedDoctor.keyProducts || [
                        "Rosuvastatin 10mg",
                        "Ciprocin 500mg",
                      ]
                    ).map((drug, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Pill className="h-3.5 w-3.5 text-[#0090FF]" />
                          <span className="font-medium text-slate-800">
                            {drug}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-slate-50 text-[9px] text-slate-500"
                        >
                          Active Detailing
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => promptDeleteDoctor(selectedDoctor)}
                  className="h-8 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete Doctor
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPortfolioOpen(false)}
                    className="h-8 text-xs text-slate-600"
                  >
                    Close Drawer
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleOpenEdit(selectedDoctor)}
                    className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
                  >
                    Modify Portfolio
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      {/* 6. Edit Doctor Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl bg-white sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Doctor Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update physician credentials, contact phone, and assigned
              territory.
            </DialogDescription>
          </DialogHeader>

          {editingDoctor && (
            <form onSubmit={handleSaveEdit} className="space-y-3.5 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Doctor Full Name
                  </Label>
                  <Input
                    value={editingDoctor.name}
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        name: e.target.value,
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    BMDC Reg. Number
                  </Label>
                  <Input
                    value={editingDoctor.bmdcReg}
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        bmdcReg: e.target.value,
                      })
                    }
                    required
                    className="h-8 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Specialty with Autocomplete Dropdown & Writing support */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Specialty
                  </Label>
                  <Input
                    list="edit-bangladesh-specialties"
                    placeholder="e.g. Gynecologist"
                    value={editingDoctor.specialty}
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        specialty: e.target.value,
                      })
                    }
                    required
                    className="h-8 bg-white text-xs"
                  />
                  <datalist id="edit-bangladesh-specialties">
                    <option value="Gynecologist & Obstetrician" />
                    <option value="Cardiologist" />
                    <option value="Internal Medicine Specialist" />
                    <option value="Pediatrician" />
                    <option value="Orthopedic Surgeon" />
                    <option value="Dermatologist & Venereologist" />
                    <option value="Neurologist" />
                    <option value="Nephrologist" />
                    <option value="Endocrinologist & Diabetologist" />
                    <option value="Gastroenterologist" />
                    <option value="Psychiatrist" />
                    <option value="Ophthalmologist (Eye Specialist)" />
                    <option value="ENT Specialist & Head-Neck Surgeon" />
                    <option value="General Surgeon" />
                    <option value="Urologist" />
                    <option value="Oncologist (Cancer Specialist)" />
                    <option value="Pulmonologist (Chest Specialist)" />
                    <option value="Rheumatologist" />
                    <option value="Hematologist" />
                    <option value="Neurosurgeon" />
                    <option value="Plastic Surgeon" />
                    <option value="Physical Medicine & Rehabilitation Specialist" />
                    <option value="Radiologist & Imaging Specialist" />
                    <option value="Pathologist" />
                    <option value="Anesthesiologist" />
                    <option value="Dental Surgeon" />
                    <option value="General Physician" />
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Designation
                  </Label>
                  <Input
                    value={editingDoctor.designation}
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        designation: e.target.value,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Affiliated Hospital
                </Label>
                <Input
                  value={editingDoctor.institute}
                  onChange={(e) =>
                    setEditingDoctor({
                      ...editingDoctor,
                      institute: e.target.value,
                    })
                  }
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Chamber Address
                </Label>
                <Input
                  value={editingDoctor.chamberAddress}
                  onChange={(e) =>
                    setEditingDoctor({
                      ...editingDoctor,
                      chamberAddress: e.target.value,
                    })
                  }
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Contact Number
                  </Label>
                  <Input
                    value={editingDoctor.contactNumber}
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        contactNumber: e.target.value,
                      })
                    }
                    required
                    className="h-8 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Territory Hub
                  </Label>
                  <Input
                    value={editingDoctor.territory}
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        territory: e.target.value,
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Rx Tier
                  </Label>
                  <Select
                    value={editingDoctor.potentialCategory}
                    onValueChange={(val) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        potentialCategory:
                          val as DoctorRecord["potentialCategory"],
                      })
                    }
                  >
                    <SelectTrigger className="h-8 bg-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="A+">Category A+</SelectItem>
                      <SelectItem value="A">Category A</SelectItem>
                      <SelectItem value="B">Category B</SelectItem>
                      <SelectItem value="C">Category C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Daily Patients
                  </Label>
                  <Input
                    type="number"
                    value={editingDoctor.patientVolumeDaily}
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        patientVolumeDaily: Number(e.target.value),
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Assigned MIO
                  </Label>
                  <Select
                    value={editingDoctor.assignedMio}
                    onValueChange={(val) =>
                      setEditingDoctor({ ...editingDoctor, assignedMio: val })
                    }
                  >
                    <SelectTrigger className="h-8 bg-white text-xs">
                      <SelectValue placeholder="Select Staff" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {staffList.map((staff) => (
                        <SelectItem key={staff.id} value={staff.name}>
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  Update Record
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Global Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModal.isOpen}
        onOpenChange={(open) =>
          setDeleteModal((prev) => ({ ...prev, isOpen: open }))
        }
        onConfirm={handleConfirmDeleteDoctor}
        title="Delete Doctor Record"
        description="Are you sure you want to remove this physician from the master database? This action cannot be undone."
        itemName={deleteModal.doctorName ? `Dr. ${deleteModal.doctorName}` : undefined}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  )
}
