"use client"

import * as React from "react"
import { getEndpoint, apiFetch } from "@/lib/api"
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
import { Switch } from "@/components/ui/switch"
import { cn } from "cn"
import { getStoredUser } from "@/lib/auth"
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
  FileSpreadsheet,
  Upload,
  Shield,
  FileCheck2,
  AlertCircle,
  ArrowUpDown,
  Loader2,
  ChevronDown,
  X,
} from "lucide-react"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

import { doctorFormSchema } from "@/lib/validations/doctorValidation"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"

interface ParsedDoctorItem {
  doctorName: string
  bmdcRegNumber: string
  phone: string
  email: string
  specialty: string
  institute: string
  designation: string
  specialtyAndInstitute: string
  chamber: string
  territory: string
  assignedMio: string
  territoryAndMio: string
  tier: string
  patientVolumeDaily: number
  isValid: boolean
  errorReason?: string
}

function parseDoctorRow(row: any): ParsedDoctorItem {
  const getCol = (...names: string[]) => {
    for (const name of names) {
      const lower = name.toLowerCase().replace(/[^a-z0-9]/g, "")
      for (const [key, val] of Object.entries(row)) {
        const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, "")
        if (keyLower === lower && val !== undefined && val !== null && String(val).trim() !== "") {
          return String(val).trim()
        }
      }
    }
    return ""
  }

  const doctorName =
    getCol("Doctor Name", "Name", "DoctorName", "Doctor", "Practitioner Name", "Physician") ||
    "Dr. Medical Practitioner"
  const bmdcRegNumber = getCol(
    "BMDC Reg #",
    "BMDC Reg Number",
    "BMDC Reg",
    "BMDC",
    "bmdcRegNumber",
    "Registration Number",
    "BMDC No"
  )
  const phone =
    getCol("Contact", "Phone", "Phone Number", "Mobile", "Contact Number", "Cell") ||
    "+880 1700-000000"
  const email = getCol("Email", "Email Address", "Mail") || "doctor@akpharma.com"
  const specialty = getCol("Specialty", "Specialization", "Discipline") || "General Medicine"
  const institute = getCol("Institute", "Hospital", "Medical College", "Institution") || "General Hospital"
  const designation = getCol("Designation", "Title", "Rank") || "Consultant"
  const chamber =
    getCol("Chamber Address", "Chamber", "Clinic", "Practice Location", "Address") ||
    "Central Chamber"
  const territory = getCol("Territory", "Zone", "Area", "Region") || "Dhaka North"
  const assignedMio = getCol("Assigned MIO", "MIO", "Representative", "Field Officer") || "Unassigned"
  const potentialCategory = getCol("Rx Potential", "Potential", "Category", "Tier", "Grade") || "A"
  const rawPatients = getCol(
    "Daily Patients",
    "Patient Volume",
    "Patient Volume Daily",
    "Avg Patients",
    "Patients"
  )
  const patientVolumeDaily = parseInt(rawPatients, 10) || 20

  const specialtyAndInstitute = institute ? `${specialty} (${institute})` : specialty
  const territoryAndMio = assignedMio ? `${territory} / MIO: ${assignedMio}` : territory
  const tier =
    potentialCategory.includes("1") || potentialCategory.toUpperCase() === "A+"
      ? "Tier 1 (High Prescriber)"
      : "Tier 2 (Moderate)"

  let isValid = true
  let errorReason = ""

  if (!bmdcRegNumber) {
    isValid = false
    errorReason = "Missing BMDC Reg #"
  }

  return {
    doctorName,
    bmdcRegNumber,
    phone,
    email,
    specialty,
    institute,
    designation,
    specialtyAndInstitute,
    chamber,
    territory,
    assignedMio,
    territoryAndMio,
    tier,
    patientVolumeDaily,
    isValid,
    errorReason,
  }
}

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

interface TerritoryItem {
  id: string
  name: string
  division?: string
}

function TerritorySearchSelect({
  value,
  onChange,
  territories,
  placeholder = "Search or select territory...",
  id = "territory-search-select",
}: {
  value: string
  onChange: (value: string) => void
  territories: TerritoryItem[]
  placeholder?: string
  id?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) {
      setSearchTerm(value)
    }
  }, [value, open])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = React.useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim()
    if (!q) return territories
    return territories.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.division && t.division.toLowerCase().includes(q))
    )
  }, [territories, searchTerm])

  const handleSelect = (name: string) => {
    onChange(name)
    setSearchTerm(name)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setSearchTerm("")
  }

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="relative">
        <Input
          id={id}
          value={open ? searchTerm : value}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            onChange(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => {
            setSearchTerm(value)
            setOpen(true)
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="h-8 pr-14 text-xs bg-white"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
              title="Clear territory"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 text-xs shadow-lg animate-in fade-in-0 zoom-in-95">
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-center text-[11px] text-slate-400">
              {searchTerm ? (
                <div>
                  <p>No matching territories found.</p>
                  <button
                    type="button"
                    className="mt-1 text-blue-600 font-medium hover:underline cursor-pointer"
                    onClick={() => handleSelect(searchTerm)}
                  >
                    Use "{searchTerm}" as custom territory
                  </button>
                </div>
              ) : (
                "No territories available in database."
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((t) => {
                const isSelected = value === t.name
                return (
                  <button
                    key={t.id || t.name}
                    type="button"
                    onClick={() => handleSelect(t.name)}
                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition ${
                      isSelected
                        ? "bg-blue-50 font-semibold text-[#0090FF]"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin
                        className={`h-3 w-3 shrink-0 ${
                          isSelected ? "text-[#0090FF]" : "text-slate-400"
                        }`}
                      />
                      <span className="truncate">{t.name}</span>
                    </div>
                    {t.division && (
                      <span className="ml-2 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-normal text-slate-500">
                        {t.division.replace(" Division", "")}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DoctorMasterDatabasePage() {
  const [doctors, setDoctors] = React.useState<DoctorRecord[]>([])
  const [staffList, setStaffList] = React.useState<StaffMember[]>([])
  const [territoryList, setTerritoryList] = React.useState<TerritoryItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isSearching, setIsSearching] = React.useState(false)

  // Server-side Pagination, Sort & Filter State
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [totalItems, setTotalItems] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(1)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [sortBy, setSortBy] = React.useState("createdAt")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
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
  const [territory, setTerritory] = React.useState("")
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

  // Excel Import Modal State (Super Admin)
  const [isImportOpen, setIsImportOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [parsedDoctors, setParsedDoctors] = React.useState<ParsedDoctorItem[]>([])
  const [updateExisting, setUpdateExisting] = React.useState(false)
  const [isImporting, setIsImporting] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Debounce search query to avoid spamming the backend
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Helper to format raw backend doctor response into UI DoctorRecord
  const formatRawDoctor = (doc: any, index: number): DoctorRecord => {
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
      territory: doc.territory || (doc.territoryAndMio
        ? doc.territoryAndMio.includes(" / MIO:")
          ? doc.territoryAndMio.split(" / MIO:")[0].trim() || ""
          : doc.territoryAndMio.startsWith("MIO:")
            ? ""
            : doc.territoryAndMio.trim()
        : ""),
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

  // Fetch doctors and staff directory from backend with pagination, sort, and search
  const fetchData = React.useCallback(async () => {
    try {
      setIsSearching(true)
      const params = new URLSearchParams()
      params.set("page", String(currentPage))
      params.set("limit", String(pageSize))
      params.set("sortBy", sortBy)
      params.set("sortOrder", sortOrder)

      if (debouncedSearch.trim()) {
        params.set("searchTerm", debouncedSearch.trim())
      }

      if (specialtyFilter !== "all") {
        params.set("specialtyAndInstitute", specialtyFilter)
      }

      if (categoryFilter !== "all") {
        const tierMapping: Record<string, string> = {
          "A+": "Tier 1",
          "A": "Tier 2",
          "B": "Tier 3",
          "C": "Tier 4",
        }
        params.set("tier", tierMapping[categoryFilter] || categoryFilter)
      }

      const [docRes, staffRes, territoryRes] = await Promise.all([
        apiFetch(getEndpoint(`/doctors?${params.toString()}`)).catch(() => null),
        staffList.length === 0 ? apiFetch(getEndpoint("/staff")).catch(() => null) : null,
        territoryList.length === 0 ? apiFetch(getEndpoint("/territories")).catch(() => null) : null,
      ])

      if (docRes && docRes.ok) {
        const docResult = await docRes.json()
        const rawData = Array.isArray(docResult)
          ? docResult
          : docResult.data || []

        if (docResult.meta) {
          setTotalItems(docResult.meta.total ?? rawData.length)
          setTotalPages(docResult.meta.totalPage ?? 1)
        } else {
          setTotalItems(rawData.length)
          setTotalPages(1)
        }

        const formattedDoctors = rawData.map(formatRawDoctor)
        setDoctors(formattedDoctors)
      }

      if (staffRes && staffRes.ok) {
        const staffData = await staffRes.json()
        const rawStaff = Array.isArray(staffData) ? staffData : staffData.data || []
        setStaffList(
          rawStaff.map((s: any) => ({
            id: s.id,
            name: s.fullName || s.name,
            territory: s.territory,
          }))
        )
      }

      if (territoryRes && territoryRes.ok) {
        const tResult = await territoryRes.json()
        const rawTerritories = Array.isArray(tResult) ? tResult : tResult.data || []
        setTerritoryList(
          rawTerritories.map((t: any) => ({
            id: t.id || t.name,
            name: t.name,
            division: t.division || "",
          }))
        )
      }
    } catch (err) {
      console.error("Failed to fetch data from backend server:", err)
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }, [
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    debouncedSearch,
    specialtyFilter,
    categoryFilter,
    staffList.length,
  ])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenPortfolio = (doc: DoctorRecord) => {
    setSelectedDoctor(doc)
    setIsPortfolioOpen(true)
  }

  const handleExportExcel = async () => {
    const toastId = toast.loading("Preparing full doctor database export...")
    try {
      let exportDocs = doctors
      const res = await apiFetch(getEndpoint("/doctors?limit=0")).catch(() => null)
      if (res && res.ok) {
        const json = await res.json()
        const raw = Array.isArray(json) ? json : json.data || []
        exportDocs = raw.map(formatRawDoctor)
      }

      const excelData = exportDocs.map((doc) => ({
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
      toast.success("Doctor database exported successfully!", { id: toastId })
    } catch {
      toast.error("Failed to export doctors database.", { id: toastId })
    }
  }

  const handleOpenImportModal = () => {
    const user = getStoredUser()
    const isSuperAdmin = Boolean(
      !user ||
      user.role?.toLowerCase().includes("super") ||
      user.role?.toLowerCase().includes("admin") ||
      user.roleName?.toLowerCase().includes("super") ||
      user.roleName?.toLowerCase().includes("admin") ||
      user.roleName?.toLowerCase().includes("managing director")
    )

    if (!isSuperAdmin) {
      toast.error(
        "Super Admin Clearance Required: Only Super Administrators have permission to bulk import practitioners into the Master Database."
      )
      return
    }

    setIsImportOpen(true)
  }

  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        "Doctor Name": "Prof. Dr. Sayeba Akhter",
        "BMDC Reg #": "A-12450",
        Specialty: "Gynecology & Obstetrics",
        Designation: "Professor & Head",
        Institute: "Dhaka Medical College & Hospital",
        "Chamber Address": "Popular Diagnostic Centre, Dhanmondi",
        Territory: "Dhanmondi North",
        "Assigned MIO": "Rafiqul Islam",
        Contact: "+880 1711-223344",
        Email: "sayebaakhter@gmail.com",
        "Rx Potential": "A+",
        "Daily Patients": 35,
      },
      {
        "Doctor Name": "Dr. Mahmudul Hasan",
        "BMDC Reg #": "A-54321",
        Specialty: "Cardiology",
        Designation: "Assistant Professor",
        Institute: "National Institute of Cardiovascular Diseases",
        "Chamber Address": "Ibn Sina Diagnostic Centre, Dhanmondi",
        Territory: "Dhanmondi South",
        "Assigned MIO": "Tanvir Ahmed",
        Contact: "+880 1812-345678",
        Email: "dr.hasan@cardio.org",
        "Rx Potential": "A",
        "Daily Patients": 25,
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Doctor Import Template")
    XLSX.writeFile(workbook, "AK_Pharma_Doctor_Import_Template.xlsx")
    toast.success("Excel template downloaded successfully!")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet)

        if (rows.length === 0) {
          toast.error("The uploaded Excel sheet is empty.")
          setParsedDoctors([])
          return
        }

        const parsed = rows.map(parseDoctorRow)
        setParsedDoctors(parsed)
        const validCount = parsed.filter((d) => d.isValid).length
        toast.info(`Parsed ${parsed.length} rows (${validCount} valid) from ${file.name}`)
      } catch (err) {
        console.error("Error parsing Excel file:", err)
        toast.error("Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.")
      }
    }

    reader.readAsArrayBuffer(file)
  }

  const handleExecuteImport = async () => {
    const validDoctors = parsedDoctors.filter((d) => d.isValid)
    if (validDoctors.length === 0) {
      toast.error("No valid doctor records found to import. Please ensure BMDC registration numbers are provided.")
      return
    }

    const toastId = toast.loading(`Importing ${validDoctors.length} doctors into master database...`)
    setIsImporting(true)

    try {
      const payload = {
        doctors: validDoctors.map((d) => ({
          doctorName: d.doctorName,
          phone: d.phone,
          bmdcRegNumber: d.bmdcRegNumber,
          specialtyAndInstitute: d.specialtyAndInstitute,
          chamber: d.chamber,
          territoryAndMio: d.territoryAndMio,
          email: d.email,
          tier: d.tier,
          patientVolumeDaily: d.patientVolumeDaily,
        })),
        updateExisting,
      }

      const res = await apiFetch(getEndpoint("/doctors/bulk-import"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to bulk import doctors")
      }

      const resJson = await res.json()
      const resultData = resJson.data || resJson

      const created = resultData.createdCount ?? 0
      const updated = resultData.updatedCount ?? 0
      const skipped = resultData.skippedCount ?? 0

      let successMsg = `Successfully processed ${validDoctors.length} doctors!`
      if (created > 0 && updated > 0) {
        successMsg = `Imported ${created} new doctors, updated ${updated} existing records!`
      } else if (created > 0) {
        successMsg = `Imported ${created} new doctors successfully!`
      } else if (updated > 0) {
        successMsg = `Updated ${updated} existing doctor records!`
      }

      if (skipped > 0 && !updateExisting) {
        successMsg += ` (${skipped} already existing records skipped)`
      }

      toast.success(successMsg, { id: toastId })
      setIsImportOpen(false)
      setSelectedFile(null)
      setParsedDoctors([])
      await fetchData()
    } catch (err: any) {
      console.error("Bulk import error:", err)
      toast.error(err.message || "Failed to import doctors", { id: toastId })
    } finally {
      setIsImporting(false)
    }
  }

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    const specialtyAndInstitute = institute ? `${specialty} (${institute})` : specialty
    const cleanTerritory = territory.trim()
    const territoryAndMio = cleanTerritory
      ? (assignedMio ? `${cleanTerritory} / MIO: ${assignedMio}` : cleanTerritory)
      : (assignedMio ? `MIO: ${assignedMio}` : "Unassigned")
    const tier = potentialCategory === "A+" ? "Tier 1 (High Prescriber)" : "Tier 2 (Moderate)"

    const newDocPayload = {
      doctorName: name,
      phone: contactNumber,
      bmdcRegNumber: bmdcReg,
      specialtyAndInstitute,
      chamber: chamberAddress,
      territory: cleanTerritory || undefined,
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
      const res = await apiFetch(getEndpoint("/doctors"), {
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
        setTerritory("")
        setPatientVolumeDaily("")
        setAssignedMio("")
        setFormErrors({})
        setIsAddOpen(false)
        const formattedDocName = newDocPayload.doctorName.startsWith("Dr.") ? newDocPayload.doctorName : `Dr. ${newDocPayload.doctorName}`
        toast.success(`Successfully registered ${formattedDocName}.`, { id: toastId })
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

    const cleanTerritory = editingDoctor.territory?.trim() || ""

    const updatedPayload = {
      doctorName: editingDoctor.name,
      phone: editingDoctor.contactNumber,
      bmdcRegNumber: editingDoctor.bmdcReg,
      specialtyAndInstitute,
      chamber: editingDoctor.chamberAddress,
      territory: cleanTerritory || undefined,
      territoryAndMio: editingDoctor.territory?.trim()
        ? (editingDoctor.assignedMio ? `${editingDoctor.territory.trim()} / MIO: ${editingDoctor.assignedMio}` : editingDoctor.territory.trim())
        : (editingDoctor.assignedMio ? `MIO: ${editingDoctor.assignedMio}` : "Unassigned"),
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
      const res = await apiFetch(
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
      const res = await apiFetch(getEndpoint(`/doctors/${id}`), {
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

  const categoryACount = doctors.filter(
    (d) => d.potentialCategory === "A+" || d.potentialCategory === "A"
  ).length
  const totalPatientReach = doctors.reduce(
    (acc, curr) => acc + curr.patientVolumeDaily,
    0
  )

  const getPaginationItems = () => {
    const items: Array<{ type: "page" | "ellipsis"; page?: number }> = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        items.push({ type: "page", page: i })
      }
    } else {
      items.push({ type: "page", page: 1 })
      if (currentPage > 3) {
        items.push({ type: "ellipsis" })
      }
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) {
        items.push({ type: "page", page: i })
      }
      if (currentPage < totalPages - 2) {
        items.push({ type: "ellipsis" })
      }
      items.push({ type: "page", page: totalPages })
    }
    return items
  }

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

          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenImportModal}
            className="h-9 gap-1.5 rounded-lg border-purple-200 bg-purple-50/70 px-3.5 text-xs font-semibold text-purple-700 shadow-none hover:bg-purple-100 hover:text-purple-800"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-purple-600" />
            Import Doctor
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

                <div className="grid grid-cols-2 gap-3">
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
                      Territory <span className="font-normal text-slate-400">(Optional)</span>
                    </Label>
                    <TerritorySearchSelect
                      value={territory}
                      onChange={setTerritory}
                      territories={territoryList}
                      placeholder="Search or select territory..."
                      id="add-doctor-territory"
                    />
                  </div>
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

                <div className="grid grid-cols-2 gap-3">
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

          {/* Bulk Import Doctor Dialog (Super Admin) */}
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogContent className="max-h-[92vh] overflow-y-auto rounded-xl bg-white sm:max-w-[720px]">
              <DialogHeader>
                <div className="flex items-center justify-between pr-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-slate-900">
                        Import Doctor Registry via Excel
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500">
                        Bulk upload licensed practitioners, BMDC registrations, and contact directories.
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700"
                  >
                    <Shield className="mr-1 h-3 w-3 text-purple-600" />
                    Super Admin Only
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Template Download Card */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-800">
                      Need the official import template?
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Download our pre-structured Excel template with example records and supported headers.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    className="h-8 gap-1.5 border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-600" />
                    Download Template (.xlsx)
                  </Button>
                </div>

                {/* Upload Drag & Drop Zone */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all",
                    selectedFile
                      ? "border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/60"
                      : "border-slate-300 bg-slate-50/40 hover:border-purple-400 hover:bg-purple-50/30"
                  )}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <FileCheck2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-950">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose a different spreadsheet
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-700 transition group-hover:scale-105">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Click to browse or drop doctor Excel sheet here
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Supports Microsoft Excel files (.xlsx, .xls). Must contain BMDC Reg. numbers.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Parsed Summary and Options */}
                {parsedDoctors.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-3">
                        <div className="text-xs">
                          <span className="font-semibold text-slate-700">Parsed: </span>
                          <span className="font-bold text-slate-900">{parsedDoctors.length} rows</span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-emerald-700">Valid: </span>
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[11px] font-bold text-emerald-700">
                            {parsedDoctors.filter((d) => d.isValid).length}
                          </Badge>
                        </div>
                        {parsedDoctors.some((d) => !d.isValid) && (
                          <div className="text-xs">
                            <span className="font-semibold text-amber-700">Invalid: </span>
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[11px] font-bold text-amber-700">
                              {parsedDoctors.filter((d) => !d.isValid).length}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Update Existing Toggle */}
                      <div className="flex items-center gap-2">
                        <Switch
                          id="update-existing-toggle"
                          checked={updateExisting}
                          onCheckedChange={setUpdateExisting}
                        />
                        <Label
                          htmlFor="update-existing-toggle"
                          className="cursor-pointer text-xs font-medium text-slate-700"
                        >
                          Update existing if BMDC matches
                        </Label>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-700">
                          Data Preview (First {Math.min(parsedDoctors.length, 5)} of {parsedDoctors.length} records)
                        </p>
                        {parsedDoctors.length > 5 && (
                          <span className="text-[11px] text-slate-500">
                            + {parsedDoctors.length - 5} additional records
                          </span>
                        )}
                      </div>

                      <div className="max-h-56 overflow-auto rounded-lg border border-slate-200">
                        <Table className="text-xs">
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead className="h-8 font-semibold text-slate-700">BMDC Reg #</TableHead>
                              <TableHead className="h-8 font-semibold text-slate-700">Doctor Name</TableHead>
                              <TableHead className="h-8 font-semibold text-slate-700">Specialty</TableHead>
                              <TableHead className="h-8 font-semibold text-slate-700">Contact</TableHead>
                              <TableHead className="h-8 font-semibold text-slate-700">Daily Pts</TableHead>
                              <TableHead className="h-8 font-semibold text-slate-700">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parsedDoctors.slice(0, 5).map((doc, idx) => (
                              <TableRow key={idx} className="hover:bg-slate-50/70">
                                <TableCell className="py-1.5 font-medium text-slate-900">
                                  {doc.bmdcRegNumber || (
                                    <span className="text-amber-600 italic">None</span>
                                  )}
                                </TableCell>
                                <TableCell className="py-1.5 font-medium text-slate-800">
                                  {doc.doctorName}
                                </TableCell>
                                <TableCell className="py-1.5 text-slate-600">
                                  {doc.specialty}
                                </TableCell>
                                <TableCell className="py-1.5 text-slate-600">
                                  {doc.phone}
                                </TableCell>
                                <TableCell className="py-1.5 text-slate-600">
                                  {doc.patientVolumeDaily}
                                </TableCell>
                                <TableCell className="py-1.5">
                                  {doc.isValid ? (
                                    <Badge
                                      variant="outline"
                                      className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                                    >
                                      Ready
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="border-amber-200 bg-amber-50 text-[10px] text-amber-700"
                                    >
                                      {doc.errorReason || "Invalid"}
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsImportOpen(false)}
                  disabled={isImporting}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={
                    isImporting ||
                    parsedDoctors.filter((d) => d.isValid).length === 0
                  }
                  className="h-8 gap-1.5 bg-purple-600 text-xs text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <Clock className="h-3.5 w-3.5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Confirm & Import ({parsedDoctors.filter((d) => d.isValid).length} Doctors)
                    </>
                  )}
                </Button>
              </DialogFooter>
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
            {totalItems}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Total active practitioners in database
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Server-side Sort Selector */}
          <Select
            value={`${sortBy}:${sortOrder}`}
            onValueChange={(val) => {
              const [field, order] = val.split(":")
              setSortBy(field)
              setSortOrder(order as "asc" | "desc")
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[165px] border-slate-200 bg-white text-xs">
              <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="Sort Practitioners" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="createdAt:desc">Newest First</SelectItem>
              <SelectItem value="createdAt:asc">Oldest First</SelectItem>
              <SelectItem value="doctorName:asc">Name (A → Z)</SelectItem>
              <SelectItem value="doctorName:desc">Name (Z → A)</SelectItem>
              <SelectItem value="patientVolumeDaily:desc">Daily Patients (High → Low)</SelectItem>
              <SelectItem value="patientVolumeDaily:asc">Daily Patients (Low → High)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={specialtyFilter}
            onValueChange={(val) => {
              setSpecialtyFilter(val)
              setCurrentPage(1)
            }}
          >
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

          <Select
            value={categoryFilter}
            onValueChange={(val) => {
              setCategoryFilter(val)
              setCurrentPage(1)
            }}
          >
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
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              DOCTOR MASTER DIRECTORY
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Click a physician's name to inspect their full institutional
              portfolio and prescription metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSearching && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin text-[#0090FF]" />
                Updating...
              </span>
            )}
            <span className="text-xs font-medium text-slate-400">
              Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems} Practitioners
            </span>
          </div>
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
            {doctors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-xs text-slate-400"
                >
                  {isSearching ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#0090FF]" />
                      <span>Loading practitioner records...</span>
                    </div>
                  ) : (
                    "No registered doctors found matching your criteria."
                  )}
                </TableCell>
              </TableRow>
            ) : (
              doctors.map((doc) => (
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
            ))
          )}
          </TableBody>
        </Table>

        {/* Shadcn Pagination Controls */}
        <div className="mt-5 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-row">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Page {currentPage} of {Math.max(1, totalPages)} ({totalItems} total)
            </span>
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-7 w-[70px] border-slate-200 bg-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    aria-disabled={currentPage <= 1 || isSearching}
                    className={
                      currentPage <= 1 || isSearching
                        ? "pointer-events-none opacity-40 cursor-not-allowed"
                        : "cursor-pointer hover:bg-slate-100"
                    }
                  />
                </PaginationItem>

                {getPaginationItems().map((item, idx) => (
                  <PaginationItem key={idx}>
                    {item.type === "page" ? (
                      <PaginationLink
                        isActive={item.page === currentPage}
                        onClick={() => setCurrentPage(item.page!)}
                        disabled={isSearching}
                        className="cursor-pointer"
                      >
                        {item.page}
                      </PaginationLink>
                    ) : (
                      <PaginationEllipsis />
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    aria-disabled={currentPage >= totalPages || isSearching}
                    className={
                      currentPage >= totalPages || isSearching
                        ? "pointer-events-none opacity-40 cursor-not-allowed"
                        : "cursor-pointer hover:bg-slate-100"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Affiliated Hospital / Medical College
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
                    Territory <span className="font-normal text-slate-400">(Optional)</span>
                  </Label>
                  <TerritorySearchSelect
                    value={editingDoctor.territory || ""}
                    onChange={(val) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        territory: val,
                      })
                    }
                    territories={territoryList}
                    placeholder="Search or select territory..."
                    id="edit-doctor-territory"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Primary Chamber Address
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
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={editingDoctor.email || ""}
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        email: e.target.value,
                      })
                    }
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
        itemName={deleteModal.doctorName || undefined}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  )
}
