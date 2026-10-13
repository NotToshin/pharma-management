"use client"

import * as React from "react"
import Link from "next/link"
import { getEndpoint } from "@/lib/api"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { toast } from "sonner"
import {
  MapPin,
  Users2,
  Building2,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  Store,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  Stethoscope,
  Phone,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Info,
  CheckCircle2,
  Clock,
  Briefcase,
} from "lucide-react"

// ─────────────────────────────────────────────
// Division & Territory Taxonomy for Bangladesh
// ─────────────────────────────────────────────

export const BANGLADESH_DIVISIONS = [
  "Dhaka Division",
  "Chittagong Division",
  "Sylhet Division",
  "Rajshahi Division",
  "Khulna Division",
  "Barisal Division",
  "Rangpur Division",
  "Mymensingh Division",
] as const

export const DIVISION_TERRITORIES: Record<string, string[]> = {
  "Dhaka Division": [
    "Dhaka North",
    "Dhaka South",
    "Mirpur",
    "Uttara",
    "Dhanmondi",
    "Gulshan",
    "Mohakhali",
    "Motijheel",
    "Savar",
    "Gazipur",
    "Narayanganj",
  ],
  "Chittagong Division": [
    "Chittagong Central",
    "Chittagong North",
    "Agrabad C/A",
    "GEC Circle",
    "Cox's Bazar",
    "Comilla",
    "Feni",
    "Noakhali",
  ],
  "Sylhet Division": [
    "Sylhet Sadar",
    "Zindabazar",
    "Amberkhana",
    "Moulvibazar",
    "Habiganj",
    "Sunamganj",
  ],
  "Rajshahi Division": [
    "Rajshahi Metro",
    "Shaheb Bazar",
    "Bogura Central",
    "Pabna",
    "Natore",
    "Sirajganj",
  ],
  "Khulna Division": [
    "Khulna Zone",
    "Shibbari More",
    "Jessore",
    "Kushtia",
    "Satkhira",
    "Jhenaidah",
  ],
  "Barisal Division": [
    "Barisal Sadar",
    "Patuakhali",
    "Bhola",
    "Pirojpur",
    "Jhalokati",
  ],
  "Rangpur Division": [
    "Rangpur Cantt",
    "Dinajpur",
    "Kurigram",
    "Saidpur",
    "Gaibandha",
  ],
  "Mymensingh Division": [
    "Mymensingh Town",
    "Jamalpur",
    "Netrokona",
    "Sherpur",
  ],
}

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface ConnectedDoctor {
  id: string
  doctorName: string
  bmdcRegNumber: string
  specialtyAndInstitute: string
  chamber: string
  territoryAndMio?: string
  tier: string
  phone: string
}

export interface ConnectedPharmacy {
  id: string
  clientCode: string
  pharmacyName: string
  proprietor: string
  phone: string
  address: string
  territory?: string
  assignedMio?: string
  creditLimitBDT: number
  outstandingBalanceBDT: number
  status: string
}

export interface AllocationItem {
  id: string
  staffId?: string | null
  mioName: string
  employeeId: string
  phone: string
  email?: string | null
  division: string
  territory: string
  allocatedZone: string // Short text for zone details
  effectiveDate: string
  notes?: string | null
  status: "Active" | "Probation" | "On Leave" | "Suspended" | "Inactive" | "Terminated"
  staffStatusRaw?: string
  assignedDoctors: number
  assignedPharmacies: number
  doctors: ConnectedDoctor[]
  pharmacies: ConnectedPharmacy[]
  createdAt?: string
  updatedAt?: string
}

export interface StaffMioOption {
  id: string
  empId: string
  fullName: string
  phone: string
  email?: string | null
  department?: string | null
  territory?: string | null
  role?: string
  status: "Active" | "Probation" | "On Leave" | "Suspended" | "Inactive" | "Terminated"
  rawStatus?: string
}

export default function MioZoneAllocationsPage() {
  const [allocations, setAllocations] = React.useState<AllocationItem[]>([])
  const [staffMios, setStaffMios] = React.useState<StaffMioOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [divisionFilter, setDivisionFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [selectedStaffId, setSelectedStaffId] = React.useState("")
  const [createMioName, setCreateMioName] = React.useState("")
  const [createEmployeeId, setCreateEmployeeId] = React.useState("")
  const [createPhone, setCreatePhone] = React.useState("")
  const [createDivision, setCreateDivision] = React.useState<string>("Dhaka Division")
  const [createTerritory, setCreateTerritory] = React.useState<string>("Dhaka North")
  const [createAllocatedZone, setCreateAllocatedZone] = React.useState("")
  const [createEffectiveDate, setCreateEffectiveDate] = React.useState(
    new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  )
  const [createNotes, setCreateNotes] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<AllocationItem | null>(null)
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Details Sheet (Docs & Stores Network)
  const [activeNetworkItem, setActiveNetworkItem] = React.useState<AllocationItem | null>(null)
  const [isNetworkSheetOpen, setIsNetworkSheetOpen] = React.useState(false)
  const [networkTab, setNetworkTab] = React.useState<"doctors" | "pharmacies">("doctors")

  // Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = React.useState<{
    isOpen: boolean
    allocationId: string | null
    officerName: string | null
    isDeleting: boolean
  }>({
    isOpen: false,
    allocationId: null,
    officerName: null,
    isDeleting: false,
  })

  // Fetch all allocations and Staff MIOs from Backend
  const fetchAllocationsData = React.useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setIsRefreshing(true)

      const [allocRes, staffRes] = await Promise.all([
        fetch(getEndpoint("/zone-allocations")),
        fetch(getEndpoint("/zone-allocations/staff-mios")),
      ])

      if (allocRes.ok) {
        const json = await allocRes.json()
        const list = Array.isArray(json) ? json : json.data || []
        setAllocations(list)
      } else {
        toast.error("Failed to load zone allocations from backend.")
      }

      if (staffRes.ok) {
        const staffJson = await staffRes.json()
        const staffList = Array.isArray(staffJson) ? staffJson : staffJson.data || []
        setStaffMios(staffList)
      }
    } catch (err) {
      console.error("Error fetching zone allocations:", err)
      toast.error("Network error while connecting to backend server.")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAllocationsData()
  }, [fetchAllocationsData])

  // Handle Staff Selection in Create Modal
  const handleSelectStaffMio = (staffId: string) => {
    setSelectedStaffId(staffId)
    const staff = staffMios.find((s) => s.id === staffId)
    if (staff) {
      setCreateMioName(staff.fullName)
      setCreateEmployeeId(staff.empId)
      setCreatePhone(staff.phone)

      // If staff has a known territory, auto-select it if possible
      if (staff.territory) {
        setCreateTerritory(staff.territory)
        // Find which division contains this territory
        for (const [div, territories] of Object.entries(DIVISION_TERRITORIES)) {
          if (territories.includes(staff.territory)) {
            setCreateDivision(div)
            break
          }
        }
      }
    }
  }

  // Handle Division change in Create Modal -> Update Territory options
  const handleDivisionChange = (division: string) => {
    setCreateDivision(division)
    const territories = DIVISION_TERRITORIES[division] || []
    if (territories.length > 0) {
      setCreateTerritory(territories[0])
    }
  }

  // Handle Division change in Edit Modal
  const handleEditDivisionChange = (division: string) => {
    if (!editingItem) return
    const territories = DIVISION_TERRITORIES[division] || []
    setEditingItem({
      ...editingItem,
      division,
      territory: territories[0] || editingItem.territory,
    })
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    // Reset or pre-fill with first staff member
    if (staffMios.length > 0) {
      const first = staffMios[0]
      setSelectedStaffId(first.id)
      setCreateMioName(first.fullName)
      setCreateEmployeeId(first.empId)
      setCreatePhone(first.phone)
      if (first.territory) {
        setCreateTerritory(first.territory)
        for (const [div, territories] of Object.entries(DIVISION_TERRITORIES)) {
          if (territories.includes(first.territory)) {
            setCreateDivision(div)
            break
          }
        }
      } else {
        setCreateDivision("Dhaka Division")
        setCreateTerritory("Dhaka North")
      }
    } else {
      setSelectedStaffId("")
      setCreateMioName("")
      setCreateEmployeeId("")
      setCreatePhone("")
      setCreateDivision("Dhaka Division")
      setCreateTerritory("Dhaka North")
    }
    setCreateAllocatedZone("")
    setCreateNotes("")
    setIsCreateOpen(true)
  }

  // Submit Create Allocation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createMioName.trim() || !createEmployeeId.trim() || !createAllocatedZone.trim()) {
      toast.error("Please fill in all required fields including Zone Details.")
      return
    }

    const toastId = toast.loading("Allocating zone for MIO officer...")
    setIsCreating(true)

    try {
      const payload = {
        staffId: selectedStaffId || null,
        mioName: createMioName.trim(),
        employeeId: createEmployeeId.trim(),
        phone: createPhone.trim(),
        division: createDivision,
        territory: createTerritory,
        allocatedZone: createAllocatedZone.trim(),
        effectiveDate: createEffectiveDate,
        notes: createNotes.trim() || null,
      }

      const res = await fetch(getEndpoint("/zone-allocations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(`Zone successfully allocated for ${createMioName}!`, {
          id: toastId,
        })
        setIsCreateOpen(false)
        fetchAllocationsData(true)
      } else {
        const errorJson = await res.json().catch(() => null)
        toast.error(errorJson?.message || "Failed to create zone allocation.", {
          id: toastId,
        })
      }
    } catch (err) {
      console.error("Create allocation error:", err)
      toast.error("Network error while creating zone allocation.", {
        id: toastId,
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (item: AllocationItem) => {
    setEditingItem({ ...item })
    setIsEditOpen(true)
  }

  // Submit Edit Allocation
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    const toastId = toast.loading("Updating MIO zone parameters...")
    setIsUpdating(true)

    try {
      const payload = {
        staffId: editingItem.staffId || null,
        mioName: editingItem.mioName,
        employeeId: editingItem.employeeId,
        phone: editingItem.phone,
        division: editingItem.division,
        territory: editingItem.territory,
        allocatedZone: editingItem.allocatedZone,
        effectiveDate: editingItem.effectiveDate,
        notes: editingItem.notes || null,
      }

      const res = await fetch(getEndpoint(`/zone-allocations/${editingItem.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(`Zone allocation for ${editingItem.mioName} updated!`, {
          id: toastId,
        })
        setIsEditOpen(false)
        setEditingItem(null)
        fetchAllocationsData(true)
      } else {
        const errorJson = await res.json().catch(() => null)
        toast.error(errorJson?.message || "Failed to update zone allocation.", {
          id: toastId,
        })
      }
    } catch (err) {
      console.error("Update allocation error:", err)
      toast.error("Network error while updating zone allocation.", {
        id: toastId,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Open Delete Confirmation Modal
  const promptDeleteAllocation = (item: AllocationItem) => {
    setDeleteModal({
      isOpen: true,
      allocationId: item.id,
      officerName: item.mioName,
      isDeleting: false,
    })
  }

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteModal.allocationId) return

    const toastId = toast.loading("Removing zone allocation record...")
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }))

    try {
      const res = await fetch(
        getEndpoint(`/zone-allocations/${deleteModal.allocationId}`),
        { method: "DELETE" }
      )

      if (res.ok) {
        toast.success(`Removed zone allocation for ${deleteModal.officerName}.`, {
          id: toastId,
        })
        setDeleteModal({
          isOpen: false,
          allocationId: null,
          officerName: null,
          isDeleting: false,
        })
        fetchAllocationsData(true)
      } else {
        const errorJson = await res.json().catch(() => null)
        toast.error(errorJson?.message || "Failed to delete zone allocation.", {
          id: toastId,
        })
        setDeleteModal((prev) => ({ ...prev, isDeleting: false }))
      }
    } catch (err) {
      console.error("Delete allocation error:", err)
      toast.error("Network error while deleting zone allocation.", {
        id: toastId,
      })
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  // Open Connected Network (Docs & Stores) Drawer
  const handleOpenNetwork = (item: AllocationItem, defaultTab: "doctors" | "pharmacies" = "doctors") => {
    setActiveNetworkItem(item)
    setNetworkTab(defaultTab)
    setIsNetworkSheetOpen(true)
  }

  // Filtered Allocations
  const filteredAllocations = allocations.filter((item) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      item.mioName.toLowerCase().includes(q) ||
      item.employeeId.toLowerCase().includes(q) ||
      item.territory.toLowerCase().includes(q) ||
      item.allocatedZone.toLowerCase().includes(q)

    const matchesDivision =
      divisionFilter === "all" ||
      item.division.toLowerCase().includes(divisionFilter.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      item.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesDivision && matchesStatus
  })

  // Aggregated Counts
  const totalOfficers = allocations.length
  const activeOfficers = allocations.filter((a) => a.status === "Active").length
  const totalConnectedDocs = allocations.reduce((acc, curr) => acc + (curr.assignedDoctors || 0), 0)
  const totalConnectedStores = allocations.reduce((acc, curr) => acc + (curr.assignedPharmacies || 0), 0)

  // Selected Staff for Create Modal (to show status preview)
  const currentSelectedStaff = staffMios.find((s) => s.id === selectedStaffId)

  // Status Badge Helper (Connected from Staff Directory)
  const renderStatusBadge = (status: AllocationItem["status"]) => {
    let style = "border-slate-300 bg-slate-50 text-slate-700"
    if (status === "Active") {
      style = "border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold"
    } else if (status === "Probation") {
      style = "border-amber-300 bg-amber-50 text-amber-700 font-semibold"
    } else if (status === "On Leave") {
      style = "border-blue-300 bg-blue-50 text-blue-700 font-semibold"
    } else if (status === "Suspended") {
      style = "border-orange-300 bg-orange-50 text-orange-700 font-semibold"
    } else if (status === "Inactive" || status === "Terminated") {
      style = "border-rose-300 bg-rose-50 text-rose-700 font-semibold"
    }

    return (
      <div className="flex flex-col items-start gap-0.5">
        <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[10px] ${style}`}>
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
          {status}
        </Badge>
        <span className="text-[9px] text-slate-400">Synced w/ Staff</span>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-12">
      {/* ─────────────────────────────────────────────
          1. Page Header & Key Metrics
      ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              MIO Zone Allocations
            </h1>
            <Badge className="bg-[#0090FF]/10 text-[#0090FF] border-0 text-[11px] font-semibold">
              Field Force Network
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Allocate MIO field officers to territories and zones. Doctors and Pharmacy Clients auto-connect directly from registries. Status is live-synced from HR Staff Directory.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAllocationsData(true)}
            disabled={isRefreshing}
            className="h-8 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
            Sync Network
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-8 gap-1.5 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0080e5]"
          >
            <Plus className="h-3.5 w-3.5" />
            Allocate Zone
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total Allocations
            </span>
            <Users2 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalOfficers}</span>
            <span className="text-[11px] text-slate-500">Officers</span>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Active Coverage
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{activeOfficers}</span>
            <span className="text-[11px] text-slate-500">HR Active Officers</span>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Connected Doctors
            </span>
            <Stethoscope className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalConnectedDocs}</span>
            <span className="text-[11px] text-slate-500">Auto-Linked Docs</span>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Covered Stores
            </span>
            <Store className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalConnectedStores}</span>
            <span className="text-[11px] text-slate-500">Auto-Linked Clients</span>
          </div>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────
          2. Search & Filter Bar
      ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search MIO name, ID, territory, or zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs focus-visible:ring-1 focus-visible:ring-[#0090FF]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Division Filter */}
          <Select value={divisionFilter} onValueChange={setDivisionFilter}>
            <SelectTrigger className="h-8 w-[170px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Divisions" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Divisions</SelectItem>
              {BANGLADESH_DIVISIONS.map((div) => (
                <SelectItem key={div} value={div}>
                  {div}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[140px] border-slate-200 bg-white text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="probation">Probation</SelectItem>
              <SelectItem value="on leave">On Leave</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || divisionFilter !== "all" || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setDivisionFilter("all")
                setStatusFilter("all")
              }}
              className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-900"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          3. Allocations Register Table
      ───────────────────────────────────────────── */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              FIELD FORCE TERRITORIAL ALLOCATIONS REGISTER
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              MIO territory deployments, auto-connected doctors and pharmacy clients, and live HR statuses.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredAllocations.length} of {allocations.length} Officers
          </span>
        </div>

        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-[#0090FF]" />
            <span className="text-xs">Connecting to database and calculating live network...</span>
          </div>
        ) : filteredAllocations.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <Users2 className="h-8 w-8 text-slate-300" />
            <h4 className="text-sm font-semibold text-slate-700">No Zone Allocations Found</h4>
            <p className="max-w-sm text-xs text-slate-400">
              No matching field officer zone allocations match your criteria. Click "Allocate Zone" to assign an MIO to a new territory.
            </p>
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="mt-2 h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Allocate Zone Now
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
                  <TableHead className="pl-0 text-xs font-medium text-slate-600">
                    Officer Details
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Territory & Division
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Allocated Zone Details
                  </TableHead>
                  <TableHead className="text-center text-xs font-medium text-slate-600">
                    Docs / Stores (Auto)
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Effective Date
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    HR Staff Status
                  </TableHead>
                  <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAllocations.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-b border-slate-50 transition-colors hover:bg-slate-50/60"
                  >
                    {/* Officer Details */}
                    <TableCell className="py-3.5 pl-0">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 rounded-full border border-slate-200">
                          <AvatarFallback className="bg-blue-50 text-xs font-semibold text-[#0090FF]">
                            {item.mioName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                          <span className="block text-xs font-semibold text-slate-900">
                            {item.mioName}
                          </span>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                            <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1 py-0.2 rounded">
                              {item.employeeId}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Phone className="h-2.5 w-2.5 text-slate-400" />
                              {item.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Territory & Division */}
                    <TableCell className="py-3.5 text-xs text-slate-700">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0090FF]" />
                        <div>
                          <span className="block font-semibold text-slate-900">
                            {item.territory}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.division}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Allocated Zone Details (Short Text) */}
                    <TableCell className="max-w-[260px] py-3.5 text-xs text-slate-700">
                      <div className="rounded-md border border-slate-100 bg-slate-50/80 px-2 py-1 text-[11px] font-medium text-slate-800">
                        {item.allocatedZone}
                      </div>
                    </TableCell>

                    {/* Docs / Stores (Live Connected from Doctor Registry & Client Directory) */}
                    <TableCell className="py-3.5 text-center text-xs">
                      <button
                        type="button"
                        onClick={() => handleOpenNetwork(item)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-2xs transition-all hover:border-[#0090FF] hover:bg-blue-50/30"
                        title="Click to view connected Doctors and Pharmacies list"
                      >
                        <span className="flex items-center gap-1 font-semibold text-blue-700">
                          <Stethoscope className="h-3 w-3 text-blue-600" />
                          {item.assignedDoctors}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="flex items-center gap-1 font-semibold text-indigo-700">
                          <Store className="h-3 w-3 text-indigo-600" />
                          {item.assignedPharmacies}
                        </span>
                      </button>
                    </TableCell>

                    {/* Effective Date */}
                    <TableCell className="py-3.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.effectiveDate}</span>
                      </div>
                    </TableCell>

                    {/* Status (Live Synced from Staff Directory) */}
                    <TableCell className="py-3.5 text-xs">
                      {renderStatusBadge(item.status)}
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="py-3.5 pr-0 text-right text-xs">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg">
                          <DropdownMenuLabel className="text-[10px] tracking-wider text-slate-400 uppercase">
                            Zone Actions
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleOpenNetwork(item)}
                            className="cursor-pointer text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <Stethoscope className="mr-2 h-3.5 w-3.5 text-blue-600" />
                            View Connected Network
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(item)}
                            className="cursor-pointer text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5 text-slate-500" />
                            Edit Allocation
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => promptDeleteAllocation(item)}
                            className="cursor-pointer text-xs text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Remove Allocation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* ─────────────────────────────────────────────
          4. Create Zone Allocation Modal
      ───────────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#0090FF]" />
              New MIO Zone Allocation
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select an officer from the Staff Directory. Territory & Division are dropdowns, and Zone details is short text. Docs & Stores auto-connect from their directories.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            {/* MIO Selection from Staff Directory */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="select-staff" className="text-xs font-semibold text-slate-700">
                  Select MIO Officer (from Staff Directory) *
                </Label>
                {currentSelectedStaff && (
                  <Badge variant="outline" className="text-[10px] border-emerald-300 bg-emerald-50 text-emerald-700">
                    HR Status: {currentSelectedStaff.status}
                  </Badge>
                )}
              </div>
              <Select value={selectedStaffId} onValueChange={handleSelectStaffMio}>
                <SelectTrigger id="select-staff" className="h-9 bg-white text-xs">
                  <SelectValue placeholder="Choose MIO from Staff Directory" />
                </SelectTrigger>
                <SelectContent className="text-xs max-h-56">
                  {staffMios.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <span className="font-semibold text-slate-800">{staff.fullName}</span>{" "}
                      <span className="text-slate-400">({staff.empId})</span> -{" "}
                      <span className="text-slate-500">{staff.role || "MIO"}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Officer Details Preview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-empId" className="text-xs font-medium text-slate-700">
                  Employee ID *
                </Label>
                <Input
                  id="create-empId"
                  value={createEmployeeId}
                  onChange={(e) => setCreateEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-2041"
                  required
                  className="h-8 font-mono text-xs bg-slate-50/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-phone" className="text-xs font-medium text-slate-700">
                  Contact Phone *
                </Label>
                <Input
                  id="create-phone"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  placeholder="+880 1711..."
                  required
                  className="h-8 text-xs bg-slate-50/50"
                />
              </div>
            </div>

            {/* Division & Territory Dropdowns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-division" className="text-xs font-semibold text-slate-700">
                  Division (Dropdown) *
                </Label>
                <Select value={createDivision} onValueChange={handleDivisionChange}>
                  <SelectTrigger id="create-division" className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {BANGLADESH_DIVISIONS.map((div) => (
                      <SelectItem key={div} value={div}>
                        {div}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-territory" className="text-xs font-semibold text-slate-700">
                  Territory (Dropdown) *
                </Label>
                <Select value={createTerritory} onValueChange={setCreateTerritory}>
                  <SelectTrigger id="create-territory" className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs max-h-56">
                    {(DIVISION_TERRITORIES[createDivision] || []).map((terr) => (
                      <SelectItem key={terr} value={terr}>
                        {terr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Allocated Zone Details (Short Text) */}
            <div className="space-y-1.5">
              <Label htmlFor="create-zone" className="text-xs font-semibold text-slate-700">
                Allocated Zone Details (Short Text) *
              </Label>
              <Input
                id="create-zone"
                value={createAllocatedZone}
                onChange={(e) => setCreateAllocatedZone(e.target.value)}
                placeholder="e.g. Sector 3, 7, 9 & Azampur Hub"
                required
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-slate-400">
                Provide concise boundary landmarks, sectors, or clinical cluster hubs.
              </p>
            </div>

            {/* Effective Date & Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-date" className="text-xs font-medium text-slate-700">
                  Effective Date
                </Label>
                <Input
                  id="create-date"
                  value={createEffectiveDate}
                  onChange={(e) => setCreateEffectiveDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-notes" className="text-xs font-medium text-slate-700">
                  Notes (Optional)
                </Label>
                <Input
                  id="create-notes"
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  placeholder="Special instructions..."
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Live Auto-Connection Notice */}
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-2.5 text-xs text-blue-900 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-[#0090FF] shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-[11px] leading-relaxed">
                <span className="font-semibold block">Automatic Doctor & Pharmacy Connection:</span>
                Doctors assigned in the Doctor Directory and pharmacies assigned in Client Onboarding will automatically connect to this MIO zone without manual data re-entry.
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="h-8 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
              >
                {isCreating ? "Allocating..." : "Confirm Allocation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────
          5. Edit Zone Allocation Modal
      ───────────────────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Pencil className="h-4 w-4 text-[#0090FF]" />
              Edit Zone Allocation
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update division, territory, or allocated zone boundaries. Status remains live-connected to Staff Directory.
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <form onSubmit={handleEditSubmit} className="space-y-3.5 py-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    {editingItem.mioName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {editingItem.employeeId} • {editingItem.phone}
                  </span>
                </div>
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px]">
                  HR Status: {editingItem.status}
                </Badge>
              </div>

              {/* Division & Territory */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-division" className="text-xs font-semibold text-slate-700">
                    Division (Dropdown) *
                  </Label>
                  <Select
                    value={editingItem.division}
                    onValueChange={handleEditDivisionChange}
                  >
                    <SelectTrigger id="edit-division" className="h-8 bg-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {BANGLADESH_DIVISIONS.map((div) => (
                        <SelectItem key={div} value={div}>
                          {div}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-territory" className="text-xs font-semibold text-slate-700">
                    Territory (Dropdown) *
                  </Label>
                  <Select
                    value={editingItem.territory}
                    onValueChange={(val) =>
                      setEditingItem({ ...editingItem, territory: val })
                    }
                  >
                    <SelectTrigger id="edit-territory" className="h-8 bg-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs max-h-56">
                      {(DIVISION_TERRITORIES[editingItem.division] || []).map((terr) => (
                        <SelectItem key={terr} value={terr}>
                          {terr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Allocated Zone Details (Short Text) */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-zone" className="text-xs font-semibold text-slate-700">
                  Allocated Zone Details (Short Text) *
                </Label>
                <Input
                  id="edit-zone"
                  value={editingItem.allocatedZone}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      allocatedZone: e.target.value,
                    })
                  }
                  required
                  className="h-8 text-xs"
                />
              </div>

              {/* Effective Date & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-date" className="text-xs font-medium text-slate-700">
                    Effective Date
                  </Label>
                  <Input
                    id="edit-date"
                    value={editingItem.effectiveDate}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        effectiveDate: e.target.value,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-notes" className="text-xs font-medium text-slate-700">
                    Notes
                  </Label>
                  <Input
                    id="edit-notes"
                    value={editingItem.notes || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        notes: e.target.value,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
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
                  disabled={isUpdating}
                  className="h-8 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────
          6. Connected Network (Docs & Stores) Drawer
      ───────────────────────────────────────────── */}
      <Sheet open={isNetworkSheetOpen} onOpenChange={setIsNetworkSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-white p-6 overflow-y-auto">
          {activeNetworkItem && (
            <div className="space-y-6">
              <SheetHeader className="text-left space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 text-[10px]">
                    Live Connected Network
                  </Badge>
                  {renderStatusBadge(activeNetworkItem.status)}
                </div>
                <SheetTitle className="text-base font-bold text-slate-900">
                  {activeNetworkItem.mioName}
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500">
                  {activeNetworkItem.territory} • {activeNetworkItem.division}
                </SheetDescription>
              </SheetHeader>

              {/* Zone Summary Banner */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-1.5">
                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Allocated Zone Footprint
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  {activeNetworkItem.allocatedZone}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                  <span className="font-mono">{activeNetworkItem.employeeId}</span>
                  <span>•</span>
                  <span>{activeNetworkItem.phone}</span>
                </div>
              </div>

              {/* Tabs for Doctors vs Pharmacies */}
              <div className="flex border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setNetworkTab("doctors")}
                  className={`flex flex-1 items-center justify-center gap-2 pb-2.5 text-xs font-semibold transition-all border-b-2 ${
                    networkTab === "doctors"
                      ? "border-[#0090FF] text-[#0090FF]"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <Stethoscope className="h-3.5 w-3.5" />
                  Assigned Doctors ({activeNetworkItem.assignedDoctors})
                </button>
                <button
                  type="button"
                  onClick={() => setNetworkTab("pharmacies")}
                  className={`flex flex-1 items-center justify-center gap-2 pb-2.5 text-xs font-semibold transition-all border-b-2 ${
                    networkTab === "pharmacies"
                      ? "border-[#0090FF] text-[#0090FF]"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <Store className="h-3.5 w-3.5" />
                  Assigned Stores ({activeNetworkItem.assignedPharmacies})
                </button>
              </div>

              {/* Tab Content: Doctors */}
              {networkTab === "doctors" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[11px] font-medium">Auto-connected from Doctor Registry</span>
                    <Link
                      href="/doctors/database"
                      className="text-[11px] font-medium text-[#0090FF] hover:underline flex items-center gap-1"
                    >
                      Doctor Registry <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  {activeNetworkItem.doctors.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400">
                      <Stethoscope className="mx-auto h-6 w-6 text-slate-300 mb-2" />
                      <p className="text-xs font-semibold text-slate-700">No Doctors Connected Yet</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        When a doctor is registered with territory &quot;{activeNetworkItem.territory}&quot; or MIO &quot;{activeNetworkItem.mioName}&quot;, they appear here automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {activeNetworkItem.doctors.map((doc) => (
                        <div
                          key={doc.id}
                          className="rounded-lg border border-slate-100 bg-white p-3 shadow-2xs hover:border-slate-200"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">
                                {doc.doctorName}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {doc.specialtyAndInstitute}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[9px] border-blue-200 bg-blue-50 text-blue-700">
                              {doc.tier || "Prescriber"}
                            </Badge>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Chamber: {doc.chamber}</span>
                            <span className="font-mono">Reg: {doc.bmdcRegNumber}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Pharmacies / Stores */}
              {networkTab === "pharmacies" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[11px] font-medium">Auto-connected from Pharmacy Clients</span>
                    <Link
                      href="/sales/clients"
                      className="text-[11px] font-medium text-[#0090FF] hover:underline flex items-center gap-1"
                    >
                      Client Directory <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  {activeNetworkItem.pharmacies.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400">
                      <Store className="mx-auto h-6 w-6 text-slate-300 mb-2" />
                      <p className="text-xs font-semibold text-slate-700">No Pharmacy Stores Connected Yet</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        When a pharmacy is registered in Sales/Clients with MIO &quot;{activeNetworkItem.mioName}&quot; or territory &quot;{activeNetworkItem.territory}&quot;, it appears here automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {activeNetworkItem.pharmacies.map((store) => (
                        <div
                          key={store.id}
                          className="rounded-lg border border-slate-100 bg-white p-3 shadow-2xs hover:border-slate-200"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">
                                {store.pharmacyName}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Prop: {store.proprietor} • {store.phone}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-50 px-1 py-0.5 rounded">
                              {store.clientCode}
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-500">
                            <span>Address: {store.address || "N/A"}</span>
                            <span className="font-semibold text-emerald-600">
                              Limit: ৳{store.creditLimitBDT?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─────────────────────────────────────────────
          7. Global Delete Confirmation Modal
      ───────────────────────────────────────────── */}
      <DeleteConfirmationModal
        open={deleteModal.isOpen}
        onOpenChange={(open) =>
          setDeleteModal((prev) => ({ ...prev, isOpen: open }))
        }
        title="Remove MIO Zone Allocation"
        description="Are you sure you want to remove this MIO zone allocation? The MIO officer profile will remain in the HR Staff Directory, but this territory assignment will be unlinked."
        itemName={deleteModal.officerName || undefined}
        confirmText="Remove Allocation"
        cancelText="Cancel"
        isDeleting={deleteModal.isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
