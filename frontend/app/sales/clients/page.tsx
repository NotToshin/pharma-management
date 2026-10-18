"use client"

import * as React from "react"
import { getEndpoint } from "@/lib/api"
import * as XLSX from "xlsx"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { Switch } from "@/components/ui/switch"
import {
  Store,
  Plus,
  Download,
  Upload,
  Search,
  Filter,
  Phone,
  FileText,
  CreditCard,
  Printer,
  Pencil,
  Trash2,
  Truck,
  Receipt,
  Clock,
  MoreHorizontal,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  Loader2,
  ShieldCheck,
  FileSpreadsheet,
  Sparkles,
  RefreshCw,
  BadgePercent,
  ExternalLink,
  UserPlus,
  Shield,
  FileCheck2,
  Users,
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

import { clientFormSchema } from "@/lib/validations/clientValidation"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { getStoredUser } from "@/lib/auth"

export interface ClientProfile {
  id: string
  clientCode: string
  pharmacyName: string
  proprietor: string
  phone: string
  drugLicenseNo: string
  tradeLicenseNo: string
  address: string
  territory: string
  assignedMio: string
  creditLimitBDT: number
  outstandingBalanceBDT: number
  creditTermDays: number
  status: "Active / Healthy" | "Credit Hold" | "Watchlist" | "Cash Only"
  lastBilledDate: string
}

interface ParsedClientRow {
  clientCode?: string
  pharmacyName: string
  proprietor: string
  phone: string
  drugLicenseNo: string
  tradeLicenseNo: string
  address: string
  territory: string
  assignedMio: string
  creditLimitBDT: number
  outstandingBalanceBDT: number
  creditTermDays: number
  status: string
  isValid: boolean
  errorReason?: string
}

interface StaffMember {
  id: string
  name: string
  territory?: string
}

function parseClientRow(row: any): ParsedClientRow {
  const getCol = (...aliases: string[]) => {
    for (const alias of aliases) {
      const lower = alias.toLowerCase().replace(/[^a-z0-9]/g, "")
      for (const [key, val] of Object.entries(row)) {
        const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, "")
        if (keyLower === lower && val !== undefined && val !== null && String(val).trim() !== "") {
          return String(val).trim()
        }
      }
    }
    return ""
  }

  const pharmacyName = getCol("Pharmacy Name", "Chemist Name", "Store Name", "Pharmacy", "Name")
  const clientCode = getCol("Client Code", "Code", "ID")
  const proprietor = getCol("Proprietor", "Owner", "Pharmacist", "Contact Person") || "N/A"
  const phone = getCol("Phone", "Mobile", "Contact", "Contact Number", "Direct Phone") || "+880 1700-000000"
  const drugLicenseNo = getCol("Drug License #", "Drug License", "DGDA License", "License No", "License") || "N/A"
  const tradeLicenseNo = getCol("Trade License #", "Trade License", "Trade Lic") || "N/A"
  const address = getCol("Address", "Location", "Market Address", "Chamber Address") || "N/A"
  const territory = getCol("Territory", "Area", "Zone", "Region") || "Dhaka North"
  const assignedMio = getCol("Assigned MIO", "MIO", "Representative", "Field Officer") || "Unassigned"
  const rawCredit = getCol(
    "Credit Facility (BDT)",
    "Credit Facility",
    "Credit Limit (BDT)",
    "Credit Limit",
    "Limit",
    "Credit"
  )
  const creditLimitBDT =
    rawCredit !== "" && !isNaN(parseFloat(rawCredit)) ? parseFloat(rawCredit) : 0
  const rawBalance = getCol("Outstanding Balance (BDT)", "Outstanding Balance", "Balance", "Due")
  const outstandingBalanceBDT = parseFloat(rawBalance) || 0
  const rawTerms = getCol("Credit Terms (Days)", "Credit Terms", "Terms (Days)", "Terms")
  const creditTermDays = parseInt(rawTerms, 10) || 30
  const status = getCol("Account Status", "Status") || "Active / Healthy"

  let isValid = true
  let errorReason = ""

  if (!pharmacyName) {
    isValid = false
    errorReason = "Missing Pharmacy Name"
  } else if (!phone || phone === "+880 ") {
    isValid = false
    errorReason = "Missing Phone Number"
  }

  return {
    clientCode: clientCode || undefined,
    pharmacyName: pharmacyName || "Unnamed Pharmacy",
    proprietor,
    phone,
    drugLicenseNo,
    tradeLicenseNo,
    address,
    territory,
    assignedMio,
    creditLimitBDT,
    outstandingBalanceBDT,
    creditTermDays,
    status,
    isValid,
    errorReason,
  }
}

export default function ClientsDirectoryPage() {
  const router = useRouter()
  const [clients, setClients] = React.useState<ClientProfile[]>([])
  const [staffList, setStaffList] = React.useState<StaffMember[]>([])
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
  const [territoryFilter, setTerritoryFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")

  // Statement / Profile Sheet State
  const [activeClient, setActiveClient] = React.useState<ClientProfile | null>(null)
  const [isStatementOpen, setIsStatementOpen] = React.useState(false)

  // Add & Edit Dialog State
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState<Omit<ClientProfile, "id">>({
    clientCode: "",
    pharmacyName: "",
    proprietor: "",
    phone: "+880 ",
    drugLicenseNo: "",
    tradeLicenseNo: "",
    address: "",
    territory: "Dhaka North",
    assignedMio: "Unassigned",
    creditLimitBDT: 0,
    outstandingBalanceBDT: 0,
    creditTermDays: 30,
    status: "Active / Healthy",
    lastBilledDate: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  })
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = React.useState(false)

  // Global Delete Confirmation Modal State
  const [clientToDelete, setClientToDelete] = React.useState<ClientProfile | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [isDeletingClient, setIsDeletingClient] = React.useState(false)

  // Excel Bulk Import Modal State
  const [isImportOpen, setIsImportOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [parsedClients, setParsedClients] = React.useState<ParsedClientRow[]>([])
  const [updateExisting, setUpdateExisting] = React.useState(true)
  const [isImporting, setIsImporting] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch client directory and staff list from backend
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

      if (territoryFilter !== "all") {
        params.set("territory", territoryFilter)
      }

      if (statusFilter !== "all") {
        params.set("status", statusFilter)
      }

      const [clientRes, staffRes] = await Promise.all([
        fetch(getEndpoint(`/clients?${params.toString()}`)).catch(() => null),
        staffList.length === 0 ? fetch(getEndpoint("/staff")).catch(() => null) : null,
      ])

      if (clientRes && clientRes.ok) {
        const json = await clientRes.json()
        const rawData = Array.isArray(json) ? json : json.data || []

        if (json.meta) {
          setTotalItems(json.meta.total ?? rawData.length)
          setTotalPages(json.meta.totalPage ?? 1)
        } else {
          setTotalItems(rawData.length)
          setTotalPages(1)
        }

        const formatted: ClientProfile[] = rawData.map((item: any) => ({
          id: item.id,
          clientCode: item.clientCode || `AKP-CL-${item.id?.slice(0, 4) || "0000"}`,
          pharmacyName: item.pharmacyName,
          proprietor: item.proprietor || "N/A",
          phone: item.phone || "+880 ",
          drugLicenseNo: item.drugLicenseNo || "N/A",
          tradeLicenseNo: item.tradeLicenseNo || "N/A",
          address: item.address || "N/A",
          territory: item.territory || "Dhaka North",
          assignedMio: item.assignedMio || "Unassigned",
          creditLimitBDT:
            item.creditLimitBDT !== undefined && item.creditLimitBDT !== null
              ? Number(item.creditLimitBDT)
              : 0,
          outstandingBalanceBDT: Number(item.outstandingBalanceBDT) || 0,
          creditTermDays: Number(item.creditTermDays) || 30,
          status: item.status || "Active / Healthy",
          lastBilledDate: item.lastBilledDate || "Recent",
        }))

        setClients(formatted)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("clients-updated"))
        }
      }

      if (staffRes && staffRes.ok) {
        const staffJson = await staffRes.json()
        const rawStaff = Array.isArray(staffJson) ? staffJson : staffJson.data || []
        setStaffList(
          rawStaff.map((s: any) => ({
            id: s.id,
            name: s.fullName || s.name,
            territory: s.territory,
          }))
        )
      } else if (staffList.length === 0) {
        setStaffList([
          { id: "1", name: "Rafiqul Islam", territory: "Dhaka North" },
          { id: "2", name: "Tanvir Ahmed", territory: "Chittagong Central" },
          { id: "3", name: "Kamrul Hasan", territory: "Dhanmondi" },
          { id: "4", name: "Enamul Haque", territory: "Gulshan" },
          { id: "5", name: "Sabbir Hossain", territory: "Sylhet" },
        ])
      }
    } catch (err) {
      console.error("Error loading clients from backend:", err)
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
    territoryFilter,
    statusFilter,
    staffList.length,
  ])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Direct connection to /logistics/orders
  const handleRedirectToOrder = (client: ClientProfile) => {
    const availableCredit = Math.max(
      0,
      client.creditLimitBDT - client.outstandingBalanceBDT
    )
    const params = new URLSearchParams({
      clientCode: client.clientCode,
      pharmacy: client.pharmacyName,
      territory: client.territory,
      mio: client.assignedMio,
      creditStatus: client.status,
      availableCredit: String(availableCredit),
    })
    router.push(`/logistics/orders?${params.toString()}`)
  }

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({
      clientCode: `AKP-CL-${Math.floor(1000 + Math.random() * 9000)}`,
      pharmacyName: "",
      proprietor: "",
      phone: "+880 ",
      drugLicenseNo: "",
      tradeLicenseNo: "",
      address: "",
      territory: "Dhaka North",
      assignedMio: "Unassigned",
      creditLimitBDT: 0,
      outstandingBalanceBDT: 0,
      creditTermDays: 30,
      status: "Active / Healthy",
      lastBilledDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    })
    setFormErrors({})
    setIsFormOpen(true)
  }

  const handleOpenEdit = (client: ClientProfile) => {
    setEditingId(client.id)
    setFormData({
      clientCode: client.clientCode,
      pharmacyName: client.pharmacyName,
      proprietor: client.proprietor,
      phone: client.phone,
      drugLicenseNo: client.drugLicenseNo,
      tradeLicenseNo: client.tradeLicenseNo,
      address: client.address,
      territory: client.territory,
      assignedMio: client.assignedMio,
      creditLimitBDT:
        client.creditLimitBDT !== undefined && client.creditLimitBDT !== null
          ? Number(client.creditLimitBDT)
          : 0,
      outstandingBalanceBDT: client.outstandingBalanceBDT,
      creditTermDays: client.creditTermDays,
      status: client.status,
      lastBilledDate: client.lastBilledDate,
    })
    setFormErrors({})
    setIsFormOpen(true)
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    const validationResult = clientFormSchema.safeParse(formData)
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

    setIsSaving(true)
    const toastId = toast.loading(
      editingId ? "Updating pharmacy client record..." : "Enrolling new chemist client..."
    )

    try {
      const endpoint = editingId
        ? getEndpoint(`/clients/${editingId}`)
        : getEndpoint("/clients")
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationResult.data),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to save client record")
      }

      toast.success(
        editingId
          ? `Pharmacy ${formData.pharmacyName} updated successfully!`
          : `Pharmacy ${formData.pharmacyName} enrolled successfully!`,
        { id: toastId }
      )
      setIsFormOpen(false)
      fetchData()
    } catch (error: any) {
      console.error("Error saving client:", error)
      toast.error(error.message || "Failed to save client record to database.", { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  // Delete Client Handlers
  const handleOpenDeleteModal = (client: ClientProfile) => {
    setClientToDelete(client)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete) return
    const toastId = toast.loading(`Deleting pharmacy client record for ${clientToDelete.pharmacyName}...`)
    try {
      setIsDeletingClient(true)
      const res = await fetch(getEndpoint(`/clients/${clientToDelete.id}`), {
        method: "DELETE",
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to delete client record")
      }

      toast.success(`Pharmacy client ${clientToDelete.pharmacyName} deleted successfully.`, { id: toastId })
      setIsDeleteModalOpen(false)
      setClientToDelete(null)
      fetchData()
    } catch (error: any) {
      console.error("Error deleting client:", error)
      toast.error(error.message || "Failed to delete client record.", { id: toastId })
    } finally {
      setIsDeletingClient(false)
    }
  }

  // Excel Export Handler (Fetching complete dataset when limit=0)
  const handleExportExcel = async () => {
    const toastId = toast.loading("Preparing chemist client master database export...")
    try {
      let exportClients = clients
      const res = await fetch(getEndpoint("/clients?limit=0")).catch(() => null)
      if (res && res.ok) {
        const json = await res.json()
        const raw = Array.isArray(json) ? json : json.data || []
        exportClients = raw.map((item: any) => ({
          id: item.id,
          clientCode: item.clientCode,
          pharmacyName: item.pharmacyName,
          proprietor: item.proprietor || "N/A",
          phone: item.phone || "+880 ",
          drugLicenseNo: item.drugLicenseNo || "N/A",
          tradeLicenseNo: item.tradeLicenseNo || "N/A",
          address: item.address || "N/A",
          territory: item.territory || "Dhaka North",
          assignedMio: item.assignedMio || "Unassigned",
          creditLimitBDT:
            item.creditLimitBDT !== undefined && item.creditLimitBDT !== null
              ? Number(item.creditLimitBDT)
              : 0,
          outstandingBalanceBDT: Number(item.outstandingBalanceBDT) || 0,
          creditTermDays: Number(item.creditTermDays) || 30,
          status: item.status || "Active / Healthy",
          lastBilledDate: item.lastBilledDate || "N/A",
        }))
      }

      const excelData = exportClients.map((c) => ({
        "Client Code": c.clientCode,
        "Pharmacy / Chemist": c.pharmacyName,
        Proprietor: c.proprietor,
        Phone: c.phone,
        "Drug License #": c.drugLicenseNo,
        "Trade License #": c.tradeLicenseNo,
        Address: c.address,
        Territory: c.territory,
        "Assigned MIO": c.assignedMio,
        "Credit Facility (BDT)": c.creditLimitBDT,
        "Outstanding Balance (BDT)": c.outstandingBalanceBDT,
        "Available Credit (BDT)": Math.max(0, c.creditLimitBDT - c.outstandingBalanceBDT),
        "Credit Terms (Days)": c.creditTermDays,
        "Account Status": c.status,
        "Last Billed Date": c.lastBilledDate,
      }))

      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Chemist Master Database")
      XLSX.writeFile(
        workbook,
        `AK_Pharma_Chemist_Clients_${new Date().toISOString().slice(0, 10)}.xlsx`
      )
      toast.success("Chemist client master database exported successfully!", { id: toastId })
    } catch (err) {
      console.error("Export error:", err)
      toast.error("Failed to export client database.", { id: toastId })
    }
  }

  // Bulk Ingestion Modal Handlers
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
        "Super Admin Clearance Required: Only Super Administrators have permission to bulk import client rosters into the Master Database."
      )
      return
    }

    setIsImportOpen(true)
  }

  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        "Client Code": "AKP-CL-8801",
        "Pharmacy Name": "Lazz Pharma Kalabagan",
        Proprietor: "Md. Lutfor Rahman",
        Phone: "+880 1711-445566",
        "Drug License #": "DL-DHK-9921",
        "Trade License #": "TR-2024-5120",
        Address: "House 12, Mirpur Road, Kalabagan, Dhaka",
        Territory: "Dhaka North",
        "Assigned MIO": "Rafiqul Islam",
        "Credit Limit (BDT)": 300000,
        "Credit Terms (Days)": 30,
        "Account Status": "Active / Healthy",
      },
      {
        "Client Code": "AKP-CL-8802",
        "Pharmacy Name": "Tamanna Medical Hall",
        Proprietor: "Abdul Karim",
        Phone: "+880 1819-778899",
        "Drug License #": "DL-CTG-3301",
        "Trade License #": "TR-2024-8199",
        Address: "GEC Circle, Central Avenue, Chittagong",
        Territory: "Chittagong Central",
        "Assigned MIO": "Tanvir Ahmed",
        "Credit Limit (BDT)": 200000,
        "Credit Terms (Days)": 15,
        "Account Status": "Active / Healthy",
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chemist Import Template")
    XLSX.writeFile(workbook, "AK_Pharma_Chemist_Import_Template.xlsx")
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
          toast.error("The uploaded Excel sheet contains no data.")
          setParsedClients([])
          return
        }

        const parsed = rows.map(parseClientRow)
        setParsedClients(parsed)
        const validCount = parsed.filter((c) => c.isValid).length
        toast.info(`Parsed ${parsed.length} rows (${validCount} valid) from ${file.name}`)
      } catch (err) {
        console.error("Error parsing Excel file:", err)
        toast.error("Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.")
      }
    }

    reader.readAsArrayBuffer(file)
  }

  const handleExecuteImport = async () => {
    const validClients = parsedClients.filter((c) => c.isValid)
    if (validClients.length === 0) {
      toast.error("No valid client records found to import. Please check required pharmacy names and phone numbers.")
      return
    }

    const toastId = toast.loading(`Importing ${validClients.length} pharmacy clients into master database...`)
    setIsImporting(true)

    try {
      const payload = {
        clients: validClients.map((c) => ({
          clientCode: c.clientCode,
          pharmacyName: c.pharmacyName,
          proprietor: c.proprietor,
          phone: c.phone,
          drugLicenseNo: c.drugLicenseNo,
          tradeLicenseNo: c.tradeLicenseNo,
          address: c.address,
          territory: c.territory,
          assignedMio: c.assignedMio,
          creditLimitBDT: c.creditLimitBDT,
          outstandingBalanceBDT: c.outstandingBalanceBDT,
          creditTermDays: c.creditTermDays,
          status: c.status,
        })),
        updateExisting,
      }

      const res = await fetch(getEndpoint("/clients/bulk-import"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to bulk import clients")
      }

      const resJson = await res.json()
      const resultData = resJson.data || resJson

      const created = resultData.createdCount ?? 0
      const updated = resultData.updatedCount ?? 0
      const skipped = resultData.skippedCount ?? 0

      let successMsg = `Successfully processed ${validClients.length} pharmacy clients!`
      if (created > 0 && updated > 0) {
        successMsg = `Imported ${created} new clients, updated ${updated} existing records!`
      } else if (created > 0) {
        successMsg = `Imported ${created} new pharmacy clients successfully!`
      } else if (updated > 0) {
        successMsg = `Updated ${updated} existing client records!`
      }

      if (skipped > 0 && !updateExisting) {
        successMsg += ` (${skipped} already existing records skipped)`
      }

      toast.success(successMsg, { id: toastId })
      setIsImportOpen(false)
      setSelectedFile(null)
      setParsedClients([])
      await fetchData()
    } catch (err: any) {
      console.error("Bulk import error:", err)
      toast.error(err.message || "Failed to import pharmacy clients", { id: toastId })
    } finally {
      setIsImporting(false)
    }
  }

  const handleOpenStatement = (client: ClientProfile) => {
    setActiveClient(client)
    setIsStatementOpen(true)
  }

  // Summary Metrics
  const totalCreditPool = clients.reduce((sum, c) => sum + c.creditLimitBDT, 0)
  const totalOutstanding = clients.reduce((sum, c) => sum + c.outstandingBalanceBDT, 0)
  const activeHealthyCount = clients.filter((c) => c.status === "Active / Healthy").length
  const healthyPercent = clients.length > 0 ? Math.round((activeHealthyCount / clients.length) * 100) : 100

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
              SALES & DISTRIBUTION
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-500">Pharmacy Network</span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            Chemist Client Master Database
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Comprehensive central registry of licensed pharmacy partners, credit facilities, regulatory compliance, and territory distribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Database
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenImportModal}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
            Bulk Ingestion
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-4 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Enroll New Chemist
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Enrolled Chemists</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {totalItems}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Active retail dispensing accounts in network
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Credit Health Rate</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
            {healthyPercent}%
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {activeHealthyCount} of {clients.length} accounts in good standing
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Extended Credit Limit</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-slate-900">
            ৳{(totalCreditPool / 100000).toFixed(1)} Lakh
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Total distributor authorized credit line
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Outstanding Receivable</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-amber-700">
            ৳{(totalOutstanding / 100000).toFixed(1)} Lakh
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Pending field realization and collection
          </p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-xl border border-slate-200/90 bg-white shadow-none">
        {/* Toolbar */}
        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative min-w-[260px] flex-1 sm:max-w-xs">
                <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search chemist, license, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-slate-50/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute top-2 right-2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Territory Filter */}
              <Select value={territoryFilter} onValueChange={(val) => { setTerritoryFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 w-[150px] bg-white text-xs">
                  <SelectValue placeholder="Territory" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="all">All Territories</SelectItem>
                  <SelectItem value="Dhaka North">Dhaka North</SelectItem>
                  <SelectItem value="Dhaka South">Dhaka South</SelectItem>
                  <SelectItem value="Dhanmondi">Dhanmondi</SelectItem>
                  <SelectItem value="Gulshan">Gulshan</SelectItem>
                  <SelectItem value="Uttara">Uttara</SelectItem>
                  <SelectItem value="Chittagong Central">Chittagong Central</SelectItem>
                  <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                  <SelectItem value="Sylhet">Sylhet</SelectItem>
                </SelectContent>
              </Select>

              {/* Account Status Filter */}
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 w-[150px] bg-white text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active / Healthy">Active / Healthy</SelectItem>
                  <SelectItem value="Watchlist">Watchlist</SelectItem>
                  <SelectItem value="Credit Hold">Credit Hold</SelectItem>
                  <SelectItem value="Cash Only">Cash Only</SelectItem>
                </SelectContent>
              </Select>

              {(searchQuery || territoryFilter !== "all" || statusFilter !== "all") && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("")
                    setTerritoryFilter("all")
                    setStatusFilter("all")
                    setCurrentPage(1)
                  }}
                  className="h-8 px-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Reset
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-[70px] bg-white text-xs">
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
        </div>

        {/* Master Table */}
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-4 text-xs font-semibold text-slate-600">
                Chemist & Proprietor
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">
                Client Code & Drug License
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">
                Contact Phone & Address
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">
                Territory & MIO
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">
                Credit Facility (BDT)
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">
                Status
              </TableHead>
              <TableHead className="pr-4 text-right text-xs font-semibold text-slate-600">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-xs text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#0090FF]" />
                    <span>Loading chemist master directory...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-xs text-slate-400">
                  No pharmacy clients found matching your query.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => {
                const availableCredit = Math.max(0, client.creditLimitBDT - client.outstandingBalanceBDT)
                const utilizationPct = client.creditLimitBDT > 0 ? Math.min(100, Math.round((client.outstandingBalanceBDT / client.creditLimitBDT) * 100)) : 0

                return (
                  <TableRow key={client.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <TableCell className="py-3.5 pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className="shrink-0 rounded-lg bg-blue-50 p-2 text-[#0090FF]">
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-slate-900">
                            {client.pharmacyName}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-slate-500">
                            Proprietor: {client.proprietor || "N/A"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 text-xs">
                      <span className="block font-mono font-bold text-blue-600">{client.clientCode}</span>
                      <span className="mt-0.5 block font-mono text-[11px] text-slate-500">
                        {client.drugLicenseNo || "No License"}
                      </span>
                    </TableCell>

                    <TableCell className="py-3.5 text-xs">
                      <div className="flex items-center gap-1 font-mono text-slate-700">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {client.phone}
                      </div>
                      <span className="mt-0.5 block max-w-[200px] truncate text-[11px] text-slate-400">
                        {client.address || "N/A"}
                      </span>
                    </TableCell>

                    <TableCell className="py-3.5 text-xs">
                      <span className="block font-medium text-slate-800">{client.territory}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        MIO: {client.assignedMio}
                      </span>
                    </TableCell>

                    <TableCell className="py-3.5 text-xs">
                      <div className="flex items-center justify-between font-mono font-semibold text-slate-800">
                        <span>৳{client.creditLimitBDT.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400">({client.creditTermDays}d)</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full ${
                              utilizationPct > 80
                                ? "bg-rose-500"
                                : utilizationPct > 50
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${utilizationPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {utilizationPct}%
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 text-xs">
                      <Badge
                        variant="outline"
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          client.status === "Active / Healthy"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : client.status === "Credit Hold"
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {client.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3.5 pr-4 text-right text-xs">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRedirectToOrder(client)}
                          className="h-7 gap-1 px-2 text-[11px] font-semibold text-blue-600 hover:bg-blue-50"
                          title="Generate Delivery Order"
                        >
                          <Truck className="h-3 w-3" />
                          Order
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuLabel className="text-[11px] font-bold text-slate-500">
                              Chemist Actions
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenStatement(client)}>
                              <FileText className="mr-2 h-3.5 w-3.5 text-blue-600" />
                              View Statement & Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRedirectToOrder(client)}>
                              <Truck className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                              Create Sales Order
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(client)}>
                              <Pencil className="mr-2 h-3.5 w-3.5 text-amber-600" />
                              Edit Chemist Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenDeleteModal(client)}
                              className="text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 p-4">
          <div className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {clients.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * pageSize, totalItems)}
            </span>{" "}
            of <span className="font-semibold text-slate-800">{totalItems}</span> chemists
          </div>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-40 text-xs" : "cursor-pointer text-xs"}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((pageNum, idx, arr) => {
                  const prev = arr[idx - 1]
                  return (
                    <React.Fragment key={pageNum}>
                      {prev && pageNum - prev > 1 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          isActive={currentPage === pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className="cursor-pointer text-xs"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    </React.Fragment>
                  )
                })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages || totalPages === 0 ? "pointer-events-none opacity-40 text-xs" : "cursor-pointer text-xs"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>

      {/* Excel Bulk Ingestion Dialog (Super Admin / Master Ingestion) */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:max-w-4xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Bulk Chemist Client Excel Ingestion
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Upload an Excel (.xlsx, .xls) roster of licensed pharmacies to batch-enroll or update the client master directory.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Template Download & File Selector */}
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="block text-xs font-bold text-slate-800">
                  Standard Chemist Import Template
                </span>
                <span className="block text-[11px] text-slate-500">
                  Columns: Pharmacy Name, Drug License #, Proprietor, Phone, Territory, MIO, Credit Terms
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="h-8 gap-1.5 border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                Download Blank Template
              </Button>
            </div>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 p-6 text-center transition hover:border-[#0090FF] hover:bg-blue-50/20"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <Upload className="h-6 w-6 text-slate-400" />
              <span className="mt-2 text-xs font-bold text-slate-800">
                {selectedFile ? selectedFile.name : "Click to select or drag & drop Excel workbook"}
              </span>
              <span className="mt-0.5 text-[11px] text-slate-400">
                Supports Microsoft Excel .xlsx, .xls, and .csv files
              </span>
            </div>

            {/* Ingestion Settings */}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800">
                  Update Existing Clients
                </span>
                <span className="block text-[11px] text-slate-500">
                  If Drug License # or Client Code matches an existing client, update their record instead of skipping
                </span>
              </div>
              <Switch
                checked={updateExisting}
                onCheckedChange={setUpdateExisting}
              />
            </div>

            {/* Parsed Preview Table */}
            {parsedClients.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Parsed Chemist Records Preview ({parsedClients.length})
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {parsedClients.filter((c) => c.isValid).length} Valid
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-500">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {parsedClients.filter((c) => !c.isValid).length} Invalid
                    </span>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="text-xs">
                        <TableHead className="py-2 text-xs">Status</TableHead>
                        <TableHead className="py-2 text-xs">Pharmacy Name</TableHead>
                        <TableHead className="py-2 text-xs">Drug License #</TableHead>
                        <TableHead className="py-2 text-xs">Contact Phone</TableHead>
                        <TableHead className="py-2 text-xs">Territory</TableHead>
                        <TableHead className="py-2 text-xs">Credit Limit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedClients.slice(0, 50).map((row, idx) => (
                        <TableRow key={idx} className="text-xs">
                          <TableCell className="py-2">
                            {row.isValid ? (
                              <Badge className="bg-emerald-100 text-[10px] text-emerald-800 shadow-none hover:bg-emerald-100">
                                Ready
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-100 text-[10px] text-rose-800 shadow-none hover:bg-rose-100">
                                {row.errorReason}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-2 font-medium">{row.pharmacyName}</TableCell>
                          <TableCell className="py-2 font-mono">{row.drugLicenseNo}</TableCell>
                          <TableCell className="py-2 font-mono">{row.phone}</TableCell>
                          <TableCell className="py-2">{row.territory}</TableCell>
                          <TableCell className="py-2 font-mono">৳{row.creditLimitBDT.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsImportOpen(false)
                setSelectedFile(null)
                setParsedClients([])
              }}
              className="h-8 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting || parsedClients.filter((c) => c.isValid).length === 0}
              className="h-8 bg-[#0090FF] text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Ingesting Data...
                </>
              ) : (
                `Execute Bulk Ingestion (${parsedClients.filter((c) => c.isValid).length})`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / Quick Add Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingId ? "Edit Pharmacy Client Profile" : "Enroll New Chemist Client"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editingId
                ? "Update commercial terms, license numbers, or territory details for this account."
                : "Register a new pharmacy partner with verified commercial and credit credentials."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Pharmacy / Chemist Name *
                </Label>
                <Input
                  value={formData.pharmacyName}
                  onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                  required
                  className="h-8 text-xs"
                />
                {formErrors.pharmacyName && (
                  <p className="text-[11px] text-rose-500">{formErrors.pharmacyName}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Proprietor / Contact Person
                </Label>
                <Input
                  value={formData.proprietor}
                  onChange={(e) => setFormData({ ...formData, proprietor: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Contact Phone Number *
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="h-8 font-mono text-xs"
                />
                {formErrors.phone && (
                  <p className="text-[11px] text-rose-500">{formErrors.phone}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Client Code
                </Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    value={formData.clientCode}
                    onChange={(e) => setFormData({ ...formData, clientCode: e.target.value })}
                    className="h-8 font-mono text-xs flex-1"
                  />
                  {!editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, clientCode: `AKP-CL-${Math.floor(1000 + Math.random() * 9000)}` })}
                      className="h-8 px-2 text-slate-500 hover:text-slate-800"
                      title="Generate new client code"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  DGDA Drug License #
                </Label>
                <Input
                  value={formData.drugLicenseNo}
                  onChange={(e) => setFormData({ ...formData, drugLicenseNo: e.target.value })}
                  placeholder="e.g. DL-DHK-9921"
                  className="h-8 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Municipal Trade License #
                </Label>
                <Input
                  value={formData.tradeLicenseNo}
                  onChange={(e) => setFormData({ ...formData, tradeLicenseNo: e.target.value })}
                  placeholder="e.g. TR-2024-5120"
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">
                Physical Pharmacy Address
              </Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. House 12, Mirpur Road, Kalabagan, Dhaka"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Territory / Zone *
                </Label>
                <Select
                  value={formData.territory}
                  onValueChange={(val) => setFormData({ ...formData, territory: val })}
                >
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Dhaka North">Dhaka North</SelectItem>
                    <SelectItem value="Dhaka South">Dhaka South</SelectItem>
                    <SelectItem value="Dhanmondi">Dhanmondi</SelectItem>
                    <SelectItem value="Gulshan">Gulshan</SelectItem>
                    <SelectItem value="Uttara">Uttara</SelectItem>
                    <SelectItem value="Chittagong Central">Chittagong Central</SelectItem>
                    <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                    <SelectItem value="Sylhet">Sylhet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Assigned MIO
                </Label>
                <Select
                  value={formData.assignedMio}
                  onValueChange={(val) => setFormData({ ...formData, assignedMio: val })}
                >
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue placeholder="Select active MIO" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Unassigned">Unassigned</SelectItem>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.name || s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Credit Facility (BDT) *
                </Label>
                <Input
                  type="number"
                  value={
                    formData.creditLimitBDT === undefined || formData.creditLimitBDT === null
                      ? ""
                      : formData.creditLimitBDT
                  }
                  onChange={(e) => {
                    const val = e.target.value
                    setFormData({
                      ...formData,
                      creditLimitBDT: val === "" ? ("" as unknown as number) : Number(val),
                    })
                  }}
                  min={0}
                  placeholder="0"
                  className="h-8 font-mono text-xs"
                />
                <div className="flex gap-1 pt-1">
                  {[0, 50000, 150000, 300000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormData({ ...formData, creditLimitBDT: amt })}
                      className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 hover:bg-slate-100"
                    >
                      {amt === 0 ? "৳0" : `৳${amt / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Credit Terms (Days)
                </Label>
                <Select
                  value={String(formData.creditTermDays)}
                  onValueChange={(val) => setFormData({ ...formData, creditTermDays: Number(val) })}
                >
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="15">15 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="45">45 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Account Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Active / Healthy">Active / Healthy</SelectItem>
                    <SelectItem value="Watchlist">Watchlist</SelectItem>
                    <SelectItem value="Credit Hold">Credit Hold</SelectItem>
                    <SelectItem value="Cash Only">Cash Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="h-8 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-8 bg-[#0090FF] text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
              >
                {isSaving ? "Saving..." : editingId ? "Update Client" : "Enroll Chemist"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Statement & Profile Sheet */}
      <Sheet open={isStatementOpen} onOpenChange={setIsStatementOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {activeClient && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-50 p-2 text-[#0090FF]">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <SheetTitle className="text-base font-bold text-slate-900">
                      {activeClient.pharmacyName}
                    </SheetTitle>
                    <SheetDescription className="text-xs font-mono text-slate-500">
                      {activeClient.clientCode} • {activeClient.territory}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6 pt-6 text-xs">
                {/* Credit Overview Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Commercial Credit Status</span>
                    <Badge
                      variant="outline"
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        activeClient.status === "Active / Healthy"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : activeClient.status === "Credit Hold"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {activeClient.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[11px] text-slate-500">Credit Facility:</span>
                      <p className="font-mono text-sm font-bold text-slate-900">
                        ৳{(activeClient.creditLimitBDT ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Outstanding Due:</span>
                      <p className="font-mono text-sm font-bold text-rose-600">
                        ৳{activeClient.outstandingBalanceBDT.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Available Credit Headroom:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      ৳{Math.max(0, activeClient.creditLimitBDT - activeClient.outstandingBalanceBDT).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Regulatory & Commercial Profile */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Regulatory Credentials
                  </h4>
                  <div className="space-y-2 rounded-xl border border-slate-100 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">DGDA Drug License:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {activeClient.drugLicenseNo}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Trade License #:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {activeClient.tradeLicenseNo}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Proprietor / Pharmacist:</span>
                      <span className="font-semibold text-slate-800">
                        {activeClient.proprietor}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Primary Phone:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {activeClient.phone}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Store Address:</span>
                      <span className="text-slate-800 max-w-[220px] text-right truncate">
                        {activeClient.address}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Field Force Assignment */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Field Assignment
                  </h4>
                  <div className="space-y-2 rounded-xl border border-slate-100 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Territory:</span>
                      <span className="font-semibold text-slate-800">{activeClient.territory}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Assigned MIO Officer:</span>
                      <span className="font-semibold text-slate-800">{activeClient.assignedMio}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Credit Term Agreement:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {activeClient.creditTermDays} Days Net
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleRedirectToOrder(activeClient)}
                    className="flex-1 h-9 bg-[#0090FF] text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
                  >
                    <Truck className="mr-1.5 h-3.5 w-3.5" />
                    Book Delivery Order
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Global Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDeleteClient}
        title="Delete Pharmacy Client Record"
        description="Are you sure you want to remove this client from the distributor master directory? This action cannot be undone."
        itemName={clientToDelete?.pharmacyName}
        isDeleting={isDeletingClient}
      />
    </div>
  )
}
