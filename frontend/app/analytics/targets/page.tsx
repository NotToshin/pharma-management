"use client"

import PermissionGate from "@/components/permission-gate"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import {
  TrendingUp,
  Target,
  Trophy,
  AlertCircle,
  CalendarDays,
  ArrowUpRight,
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  UserCheck,
  Filter,
  CheckCircle2,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  SlidersHorizontal,
} from "lucide-react"
import { getEndpoint, apiFetch } from "@/lib/api"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"

export interface MioTargetItem {
  id: string
  territory: string
  mio: string
  empId?: string | null
  phone?: string | null
  division?: string | null
  zone?: string | null
  targetRaw: number
  achievedRaw: number
  baselineAchievedRaw?: number
  target: string
  achieved: string
  rate: number
  status: "Surpassed" | "On Track" | "Behind"
  fiscalYear?: string
  notes?: string | null
  matchingOrdersCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface TargetSummary {
  totalTarget: number
  totalAchieved: number
  overallRate: number
  topPerformingHub: string
  underperformingCount: number
  activeZonesCount: number
}

export interface MioOption {
  id?: string
  name: string
  empId?: string
  territory?: string
  phone?: string
}

export interface TargetOptions {
  territories: string[]
  mios: MioOption[]
  territoryMioMap: Record<string, string>
}

type SortField = "territory" | "mio" | "targetRaw" | "achievedRaw" | "rate"
type SortDirection = "asc" | "desc"

export default function TargetVsAchievementPage() {
  const [targets, setTargets] = React.useState<MioTargetItem[]>([])
  const [summary, setSummary] = React.useState<TargetSummary>({
    totalTarget: 0,
    totalAchieved: 0,
    overallRate: 0,
    topPerformingHub: "N/A",
    underperformingCount: 0,
    activeZonesCount: 0,
  })
  const [options, setOptions] = React.useState<TargetOptions>({
    territories: [],
    mios: [],
    territoryMioMap: {},
  })

  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const fetchRequest = React.useRef(0)
  const fetchInFlight = React.useRef(false)

  // Filters, Search & Sorting
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedTerritory, setSelectedTerritory] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [sortField, setSortField] = React.useState<SortField>("territory")
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc")

  // Create Modal State
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [newTerritory, setNewTerritory] = React.useState("")
  const [customTerritory, setCustomTerritory] = React.useState("")
  const [isCustomTerritory, setIsCustomTerritory] = React.useState(false)

  const [newMio, setNewMio] = React.useState("")
  const [customMio, setCustomMio] = React.useState("")
  const [isCustomMio, setIsCustomMio] = React.useState(false)

  const [newTarget, setNewTarget] = React.useState("")
  const [newAchieved, setNewAchieved] = React.useState("")
  const [newNotes, setNewNotes] = React.useState("")

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingTarget, setEditingTarget] = React.useState<MioTargetItem | null>(null)
  const [editTerritory, setEditTerritory] = React.useState("")
  const [editMio, setEditMio] = React.useState("")
  const [editTargetAmount, setEditTargetAmount] = React.useState("")
  const [editAchievedAmount, setEditAchievedAmount] = React.useState("")
  const [editNotes, setEditNotes] = React.useState("")
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Delete Modal State
  const [deleteModal, setDeleteModal] = React.useState<{
    isOpen: boolean
    targetId: string | null
    itemName: string | null
    isDeleting: boolean
  }>({
    isOpen: false,
    targetId: null,
    itemName: null,
    isDeleting: false,
  })

  // Fetch targets and options from Backend
  const fetchData = React.useCallback(async (silent = false, background = false) => {
    if (background && fetchInFlight.current) return
    const requestId = ++fetchRequest.current
    fetchInFlight.current = true
    try {
      if (!background) {
        if (!silent) setIsLoading(true)
        else setIsRefreshing(true)
      }

      const [targetsRes, optionsRes] = await Promise.all([
        apiFetch(getEndpoint("/targets"), { cache: "no-store" }),
        apiFetch(getEndpoint("/targets/options"), { cache: "no-store" }),
      ])
      if (requestId !== fetchRequest.current) return

      if (targetsRes.ok) {
        const json = await targetsRes.json()
        if (requestId !== fetchRequest.current) return
        const payload = json.data || json
        if (payload.targets && Array.isArray(payload.targets)) {
          setTargets(payload.targets)
          if (payload.summary) {
            setSummary(payload.summary)
          }
        } else if (Array.isArray(payload)) {
          setTargets(payload)
        }
      } else if (!background) {
        toast.error("Failed to fetch MIO targets from database.")
      }

      if (optionsRes.ok) {
        const optJson = await optionsRes.json()
        if (requestId !== fetchRequest.current) return
        const optData = optJson.data || optJson
        setOptions({
          territories: optData.territories || [],
          mios: optData.mios || [],
          territoryMioMap: optData.territoryMioMap || {},
        })
      }
    } catch (err) {
      console.error("Error loading targets from database:", err)
      if (!background) toast.error("Network error while connecting to backend server.")
    } finally {
      if (requestId === fetchRequest.current) {
        fetchInFlight.current = false
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  React.useEffect(() => {
    const refreshAchievements = () => {
      if (document.visibilityState === "visible" && !isAddOpen && !isEditOpen && !deleteModal.isOpen) {
        void fetchData(true, true)
      }
    }
    const interval = window.setInterval(refreshAchievements, 30_000)
    window.addEventListener("focus", refreshAchievements)
    document.addEventListener("visibilitychange", refreshAchievements)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", refreshAchievements)
      document.removeEventListener("visibilitychange", refreshAchievements)
    }
  }, [fetchData, isAddOpen, isEditOpen, deleteModal.isOpen])

  // Handle Territory selection in Add Modal
  const handleTerritorySelection = (val: string) => {
    if (val === "CUSTOM_ENTRY") {
      setIsCustomTerritory(true)
      setNewTerritory("")
    } else {
      setIsCustomTerritory(false)
      setNewTerritory(val)
      const suggestedMio = options.territoryMioMap[val]
      if (suggestedMio) {
        setIsCustomMio(false)
        setNewMio(suggestedMio)
      }
    }
  }

  // Handle MIO selection in Add Modal
  const handleMioSelection = (val: string) => {
    if (val === "CUSTOM_MIO_ENTRY") {
      setIsCustomMio(true)
      setNewMio("")
    } else {
      setIsCustomMio(false)
      setNewMio(val)
      if (!newTerritory && !isCustomTerritory) {
        const foundMio = options.mios.find((m) => m.name === val)
        if (foundMio && foundMio.territory) {
          setNewTerritory(foundMio.territory)
        }
      }
    }
  }

  // Toggle Sorting column
  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle preset sort selection from dropdown
  const handleSortDropdownChange = (value: string) => {
    const [field, dir] = value.split(":") as [SortField, SortDirection]
    setSortField(field)
    setSortDirection(dir)
  }

  // Handle Create Target Form Submission
  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault()

    const targetTerritoryName = isCustomTerritory ? customTerritory.trim() : newTerritory.trim()
    const targetMioName = isCustomMio ? customMio.trim() : newMio.trim()
    const targetNum = parseFloat(newTarget) || 0
    const achievedNum = parseFloat(newAchieved) || 0

    if (!targetMioName) {
      toast.error("Please select or enter an Assigned MIO.")
      return
    }

    if (!targetTerritoryName) {
      toast.error("Please select or enter a Territory Name.")
      return
    }

    if (targetNum <= 0) {
      toast.error("Quota Target must be greater than ৳0.")
      return
    }

    const toastId = toast.loading(`Saving quota target for MIO ${targetMioName}...`)
    setIsSubmitting(true)

    try {
      const res = await apiFetch(getEndpoint("/targets"), {
        method: "POST",
        body: JSON.stringify({
          territory: targetTerritoryName,
          mioName: targetMioName,
          targetAmount: targetNum,
          achievedAmount: achievedNum,
          fiscalYear: "Fiscal Year 2026",
          notes: newNotes.trim() || undefined,
        }),
      })

      const json = await res.json()

      if (res.ok && json.success) {
        toast.success(`Quota for MIO "${targetMioName}" in ${targetTerritoryName} saved successfully!`, {
          id: toastId,
        })
        setIsAddOpen(false)
        setNewTerritory("")
        setCustomTerritory("")
        setIsCustomTerritory(false)
        setNewMio("")
        setCustomMio("")
        setIsCustomMio(false)
        setNewTarget("")
        setNewAchieved("")
        setNewNotes("")
        await fetchData(true)
      } else {
        toast.error(json.message || "Failed to save target quota.", {
          id: toastId,
        })
      }
    } catch (err: any) {
      console.error("Error creating target:", err)
      toast.error(err.message || "Server error while creating quota target.", {
        id: toastId,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (target: MioTargetItem) => {
    setEditingTarget(target)
    setEditTerritory(target.territory)
    setEditMio(target.mio)
    setEditTargetAmount(String(target.targetRaw))
    setEditAchievedAmount(String(target.baselineAchievedRaw ?? target.achievedRaw))
    setEditNotes(target.notes || "")
    setIsEditOpen(true)
  }

  // Handle Edit Target Form Submission
  const handleUpdateTarget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTarget) return

    const targetNum = parseFloat(editTargetAmount) || 0
    const achievedNum = parseFloat(editAchievedAmount) || 0

    if (!editMio.trim()) {
      toast.error("MIO Name is required.")
      return
    }
    if (!editTerritory.trim()) {
      toast.error("Territory Name is required.")
      return
    }
    if (targetNum <= 0) {
      toast.error("Target Quota must be greater than 0.")
      return
    }

    const toastId = toast.loading(`Updating quota for MIO ${editMio}...`)
    setIsUpdating(true)

    try {
      const res = await apiFetch(getEndpoint(`/targets/${editingTarget.id}`), {
        method: "PUT",
        body: JSON.stringify({
          territory: editTerritory.trim(),
          mioName: editMio.trim(),
          targetAmount: targetNum,
          achievedAmount: achievedNum,
          notes: editNotes.trim() || undefined,
        }),
      })

      const json = await res.json()

      if (res.ok && json.success) {
        toast.success(`Quota for MIO ${editMio} updated successfully!`, {
          id: toastId,
        })
        setIsEditOpen(false)
        setEditingTarget(null)
        await fetchData(true)
      } else {
        toast.error(json.message || "Failed to update target quota.", {
          id: toastId,
        })
      }
    } catch (err: any) {
      console.error("Error updating target quota:", err)
      toast.error(err.message || "Server error while updating quota.", {
        id: toastId,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Open Delete Confirmation Modal
  const openDeleteModal = (target: MioTargetItem) => {
    setDeleteModal({
      isOpen: true,
      targetId: target.id,
      itemName: `${target.mio} — ${target.territory} Quota`,
      isDeleting: false,
    })
  }

  // Handle Delete Confirmation
  const confirmDeleteTarget = async () => {
    if (!deleteModal.targetId) return

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }))
    const toastId = toast.loading(`Deleting quota for ${deleteModal.itemName}...`)

    try {
      const res = await apiFetch(getEndpoint(`/targets/${deleteModal.targetId}`), {
        method: "DELETE",
      })

      const json = await res.json()

      if (res.ok && json.success) {
        toast.success(`Quota record for ${deleteModal.itemName} deleted successfully!`, {
          id: toastId,
        })
        setDeleteModal({
          isOpen: false,
          targetId: null,
          itemName: null,
          isDeleting: false,
        })
        await fetchData(true)
      } else {
        toast.error(json.message || "Failed to delete target record.", {
          id: toastId,
        })
        setDeleteModal((prev) => ({ ...prev, isDeleting: false }))
      }
    } catch (err: any) {
      console.error("Error deleting target:", err)
      toast.error(err.message || "Server error while deleting target.", {
        id: toastId,
      })
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  // Filter and Sort targets
  const processedTargets = React.useMemo(() => {
    const filtered = targets.filter((item) => {
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        q === "" ||
        item.mio.toLowerCase().includes(q) ||
        item.territory.toLowerCase().includes(q) ||
        (item.empId && item.empId.toLowerCase().includes(q)) ||
        (item.phone && item.phone.toLowerCase().includes(q))

      const matchesTerritory =
        selectedTerritory === "all" ||
        item.territory.toLowerCase() === selectedTerritory.toLowerCase()

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter

      return matchesSearch && matchesTerritory && matchesStatus
    })

    // Sort according to active sortField and sortDirection
    return filtered.sort((a, b) => {
      let comparison = 0
      if (sortField === "territory") {
        comparison = a.territory.localeCompare(b.territory)
      } else if (sortField === "mio") {
        comparison = a.mio.localeCompare(b.mio)
      } else if (sortField === "targetRaw") {
        comparison = a.targetRaw - b.targetRaw
      } else if (sortField === "achievedRaw") {
        comparison = a.achievedRaw - b.achievedRaw
      } else if (sortField === "rate") {
        comparison = a.rate - b.rate
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [targets, searchQuery, selectedTerritory, statusFilter, sortField, sortDirection])

  const isFiltered =
    selectedTerritory !== "all" ||
    searchQuery.trim() !== "" ||
    statusFilter !== "all"

  const activeList = isFiltered ? processedTargets : targets

  // Aggregated totals computed dynamically from current database targets
  const totalTarget = activeList.reduce((acc, curr) => acc + curr.targetRaw, 0)
  const totalAchieved = activeList.reduce((acc, curr) => acc + curr.achievedRaw, 0)
  const totalMatchingOrders = activeList.reduce(
    (sum, t) => sum + (t.matchingOrdersCount || 0),
    0
  )
  const overallRate =
    totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0

  const topPerforming =
    activeList.length > 0
      ? activeList.reduce((max, t) => (t.rate > max.rate ? t : max), activeList[0])
      : null

  const underperformingCount = activeList.filter((t) => t.status === "Behind").length
  const onTrackCount = activeList.filter(
    (t) => t.status === "On Track" || t.status === "Surpassed"
  ).length

  // Chart data formatted from targets per MIO (in Lakhs)
  const dynamicChartData = processedTargets.map((item) => ({
    name: item.mio.split(" ")[0],
    fullName: item.mio,
    territory: item.territory,
    Target: Number((item.targetRaw / 100000).toFixed(2)),
    Achieved: Number((item.achievedRaw / 100000).toFixed(2)),
    rate: item.rate,
    ordersCount: item.matchingOrdersCount || 0,
  }))

  // Distinct territories in database for filtering dropdown
  const uniqueTerritories = React.useMemo(() => {
    const terrSet = new Set<string>()
    targets.forEach((t) => {
      if (t.territory?.trim()) terrSet.add(t.territory.trim())
    })
    options.territories.forEach((t) => {
      if (t?.trim()) terrSet.add(t.trim())
    })
    return Array.from(terrSet).sort((a, b) => a.localeCompare(b))
  }, [targets, options.territories])

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-12">
      {/* 1. Page Header with Refresh and "Add MIO Target" Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Target vs. Achievement
            </h1>
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
            >
              <CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-600" />
              Live Database Orders Synced
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Field Force sales quotas, territory assignments, and verified invoiced order fulfillment per MIO.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Badge
            variant="outline"
            className="rounded-lg border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
          >
            <CalendarDays className="mr-1.5 inline h-3.5 w-3.5 text-slate-600" />
            Fiscal Year 2026
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing || isLoading}
            className="h-9 gap-1.5 rounded-lg border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isRefreshing ? "animate-spin text-[#0090FF]" : "text-slate-500"
              }`}
            />
            Sync Live
          </Button>

          {/* Add MIO Target Modal */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <PermissionGate feature="Target Vs Achievement" action="create">
<DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0080e5] transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add MIO Target
                </Button>
              </DialogTrigger>
</PermissionGate>
            <DialogContent className="rounded-2xl border border-slate-200 bg-white sm:max-w-[480px] shadow-xl">
              <DialogHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0090FF]">
                  <Target className="h-5 w-5" />
                </div>
                <DialogTitle className="text-base font-bold text-slate-900 mt-2">
                  Assign MIO Sales Quota
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Select a registered MIO officer and territory directly from the database to allocate sales quotas.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddTarget} className="space-y-4 py-2">
                {/* MIO Select (From DB) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="mio-select"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Assigned MIO Officer *
                    </Label>
                    <button
                      type="button"
                      onClick={() => setIsCustomMio(!isCustomMio)}
                      className="text-[11px] font-semibold text-[#0090FF] hover:underline"
                    >
                      {isCustomMio ? "Pick from DB List" : "+ Enter Custom"}
                    </button>
                  </div>

                  {isCustomMio ? (
                    <Input
                      id="custom-mio"
                      placeholder="e.g. Md. Kabir Hossain"
                      value={customMio}
                      onChange={(e) => setCustomMio(e.target.value)}
                      required
                      className="h-9 text-xs"
                    />
                  ) : (
                    <Select value={newMio} onValueChange={handleMioSelection}>
                      <SelectTrigger id="mio-select" className="h-9 text-xs bg-white">
                        <SelectValue placeholder="Select MIO from Database..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-56 text-xs">
                        {options.mios.map((mio) => (
                          <SelectItem key={mio.name} value={mio.name}>
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-semibold text-slate-900">
                                {mio.name}
                              </span>
                              {mio.empId && (
                                <Badge
                                  variant="outline"
                                  className="border-slate-200 bg-slate-50 px-1.5 py-0 text-[10px] text-slate-600 font-mono"
                                >
                                  {mio.empId}
                                </Badge>
                              )}
                              {mio.territory && (
                                <span className="text-[10px] text-[#0090FF]">
                                  • {mio.territory}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem
                          value="CUSTOM_MIO_ENTRY"
                          className="font-semibold text-[#0090FF]"
                        >
                          + Other (Type Custom MIO Name)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Territory Select (From DB) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="territory-select"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Assigned Territory *
                    </Label>
                    <button
                      type="button"
                      onClick={() => setIsCustomTerritory(!isCustomTerritory)}
                      className="text-[11px] font-semibold text-[#0090FF] hover:underline"
                    >
                      {isCustomTerritory ? "Pick from DB List" : "+ Enter Custom"}
                    </button>
                  </div>

                  {isCustomTerritory ? (
                    <Input
                      id="custom-territory"
                      placeholder="e.g. Mymensingh Sadar"
                      value={customTerritory}
                      onChange={(e) => setCustomTerritory(e.target.value)}
                      required
                      className="h-9 text-xs"
                    />
                  ) : (
                    <Select
                      value={newTerritory}
                      onValueChange={handleTerritorySelection}
                    >
                      <SelectTrigger id="territory-select" className="h-9 text-xs bg-white">
                        <SelectValue placeholder="Select territory from DB..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-56 text-xs">
                        {options.territories.map((terr) => (
                          <SelectItem key={terr} value={terr}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-medium text-slate-900">{terr}</span>
                              {options.territoryMioMap[terr] && (
                                <span className="text-[10px] text-slate-400">
                                  ({options.territoryMioMap[terr]})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem
                          value="CUSTOM_ENTRY"
                          className="font-semibold text-[#0090FF]"
                        >
                          + Other (Type Custom Territory)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Quota Target & Baseline Achieved */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="target"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Quota Target (৳) *
                    </Label>
                    <Input
                      id="target"
                      type="number"
                      placeholder="1500000"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      required
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="achieved"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Realized Baseline (৳)
                    </Label>
                    <Input
                      id="achieved"
                      type="number"
                      placeholder="0"
                      value={newAchieved}
                      onChange={(e) => setNewAchieved(e.target.value)}
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Optional Notes */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="notes"
                    className="text-xs font-medium text-slate-600"
                  >
                    Allocation Justification / Operational Notes (Optional)
                  </Label>
                  <Input
                    id="notes"
                    placeholder="e.g. Q4 growth target for hospital distribution"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddOpen(false)}
                    disabled={isSubmitting}
                    className="h-9 text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-9 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving to DB...
                      </>
                    ) : (
                      "Save MIO Quota"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Dynamic Real Database KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Gross Quota Target */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Gross Quota Target
            </span>
            <div className="rounded-lg bg-blue-50 p-1.5 text-[#0090FF]">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] leading-none font-bold tracking-tight text-slate-900">
            ৳{totalTarget.toLocaleString("en-IN")}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            {isFiltered
              ? `Filtered (${activeList.length} of ${targets.length} MIO Quotas)`
              : `Across ${targets.length} Active MIO Field Quotas`}
          </p>
        </Card>

        {/* Card 2: Total Realized Achieved */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total Realized Achieved
            </span>
            <Badge
              variant="outline"
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                overallRate >= 100
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : overallRate >= 90
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              <TrendingUp className="mr-1 inline h-3 w-3" />
              {overallRate}%
            </Badge>
          </div>
          <div className="mt-3 text-[26px] leading-none font-bold tracking-tight text-slate-900">
            ৳{totalAchieved.toLocaleString("en-IN")}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <span>{totalMatchingOrders} Verified Invoiced Orders</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-600" />
          </div>
        </Card>

        {/* Card 3: Top Performing MIO */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Top Performing MIO
            </span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 truncate text-[20px] leading-none font-bold tracking-tight text-slate-900">
            {topPerforming ? topPerforming.mio : "N/A"}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            {topPerforming
              ? `${topPerforming.rate}% achieved • ${topPerforming.territory}`
              : "No quota allocations yet"}
          </p>
        </Card>

        {/* Card 4: Behind Quota Target */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Behind Quota Target
            </span>
            <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] leading-none font-bold tracking-tight text-slate-900">
            {underperformingCount} Officers
          </div>
          <p className="mt-3 text-[11px] font-medium text-amber-600">
            {underperformingCount === 0
              ? "All active officers meeting quota threshold"
              : `${onTrackCount} on track • ${underperformingCount} tracking below 90%`}
          </p>
        </Card>
      </div>

      {/* 3. Bar Chart based on current real database MIO targets */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              MIO Quota vs. Achievement Variance (in Lakh ৳)
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Audited comparison between assigned sales quota and delivered orders per MIO
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-slate-300" />
              <span>Target Quota</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#0090FF]" />
              <span>Actual Delivered</span>
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full pt-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#0090FF]" />
              Loading MIO performance analytics from database...
            </div>
          ) : dynamicChartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No MIO quotas registered in database yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dynamicChartData}
                barGap={6}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#71717A" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#71717A" }}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-md">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                            <span className="text-xs font-bold text-slate-900">
                              {data.fullName}
                            </span>
                            <span className="text-[10px] font-medium text-[#0090FF]">
                              {data.territory}
                            </span>
                          </div>
                          <div className="mt-1.5 space-y-1 text-[11px]">
                            <p className="text-slate-500">
                              Target Quota:{" "}
                              <span className="font-semibold text-slate-900">
                                ৳{data.Target} Lakh
                              </span>
                            </p>
                            <p className="text-blue-600">
                              Realized Invoiced:{" "}
                              <span className="font-semibold">
                                ৳{data.Achieved} Lakh
                              </span>
                            </p>
                            <p className="font-semibold text-slate-800">
                              Achievement Rate: {data.rate}%
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Matching Orders: {data.ordersCount} fulfilled
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="Target"
                  fill="#cbd5e1"
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                />
                <Bar
                  dataKey="Achieved"
                  fill="#0090FF"
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* 4. MIO Performance Ledger with Territory Sorting, Filtering & Search */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
                MIO Performance Ledger
              </h3>
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-700"
              >
                Target vs. Achievement
              </Badge>
            </div>
            <span className="text-xs text-slate-400">
              Showing {processedTargets.length} of {targets.length} Designated MIO Field Quotas from Database
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-44 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search MIO or Territory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-slate-50/50"
              />
            </div>

            {/* Filter by Territory */}
            <Select value={selectedTerritory} onValueChange={setSelectedTerritory}>
              <SelectTrigger className="h-8 text-xs w-[145px] bg-white">
                <MapPin className="mr-1 h-3 w-3 text-slate-400" />
                <SelectValue placeholder="All Territories" />
              </SelectTrigger>
              <SelectContent className="max-h-60 text-xs">
                <SelectItem value="all">All Territories</SelectItem>
                {uniqueTerritories.map((terr) => (
                  <SelectItem key={terr} value={terr}>
                    {terr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <Select
              value={`${sortField}:${sortDirection}`}
              onValueChange={handleSortDropdownChange}
            >
              <SelectTrigger className="h-8 text-xs w-[165px] bg-white">
                <SlidersHorizontal className="mr-1 h-3 w-3 text-slate-400" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="territory:asc">Territory: A → Z</SelectItem>
                <SelectItem value="territory:desc">Territory: Z → A</SelectItem>
                <SelectItem value="mio:asc">MIO Name: A → Z</SelectItem>
                <SelectItem value="mio:desc">MIO Name: Z → A</SelectItem>
                <SelectItem value="rate:desc">Achievement: High → Low</SelectItem>
                <SelectItem value="rate:asc">Achievement: Low → High</SelectItem>
                <SelectItem value="targetRaw:desc">Target: High → Low</SelectItem>
                <SelectItem value="targetRaw:asc">Target: Low → High</SelectItem>
                <SelectItem value="achievedRaw:desc">Achieved: High → Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-[130px] bg-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Surpassed">Surpassed (≥100%)</SelectItem>
                <SelectItem value="On Track">On Track (90-99%)</SelectItem>
                <SelectItem value="Behind">Behind (&lt;90%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
                {/* 1. MIO Column */}
                <TableHead
                  onClick={() => handleSortToggle("mio")}
                  className="pl-0 text-xs font-semibold text-slate-700 cursor-pointer select-none hover:text-[#0090FF] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Medical Information Officer (MIO)</span>
                    {sortField === "mio" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-[#0090FF]" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-[#0090FF]" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                </TableHead>

                {/* 2. Territory Column (User highlighted sorting by territory!) */}
                <TableHead
                  onClick={() => handleSortToggle("territory")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none hover:text-[#0090FF] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>Territory</span>
                    {sortField === "territory" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-[#0090FF]" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-[#0090FF]" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                </TableHead>

                {/* 3. Quota Target */}
                <TableHead
                  onClick={() => handleSortToggle("targetRaw")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none hover:text-[#0090FF] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Quota Target</span>
                    {sortField === "targetRaw" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-[#0090FF]" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-[#0090FF]" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                </TableHead>

                {/* 4. Actual Realized */}
                <TableHead
                  onClick={() => handleSortToggle("achievedRaw")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none hover:text-[#0090FF] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Actual Realized</span>
                    {sortField === "achievedRaw" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-[#0090FF]" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-[#0090FF]" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                </TableHead>

                {/* 5. Target vs Achievement Rate % */}
                <TableHead
                  onClick={() => handleSortToggle("rate")}
                  className="w-[190px] text-xs font-semibold text-slate-700 cursor-pointer select-none hover:text-[#0090FF] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Target vs. Achievement</span>
                    {sortField === "rate" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-[#0090FF]" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-[#0090FF]" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                </TableHead>

                {/* 6. Status */}
                <TableHead className="text-center text-xs font-semibold text-slate-600">
                  Status
                </TableHead>

                {/* 7. Actions */}
                <TableHead className="pr-0 text-right text-xs font-semibold text-slate-600">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-xs text-slate-400"
                  >
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-[#0090FF]" />
                    Loading MIO performance ledger from database...
                  </TableCell>
                </TableRow>
              ) : processedTargets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-xs text-slate-400"
                  >
                    No matching MIO quota records found in database.
                  </TableCell>
                </TableRow>
              ) : (
                processedTargets.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* MIO Info */}
                    <TableCell className="py-3 pl-0 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 font-bold text-[#0090FF] text-[11px]">
                          {row.mio
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {row.mio}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            {row.empId ? (
                              <span className="font-mono text-slate-500 font-medium">
                                {row.empId}
                              </span>
                            ) : (
                              <span>Field Force</span>
                            )}
                            {row.phone && (
                              <span>• {row.phone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Territory */}
                    <TableCell className="py-3 text-xs text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#0090FF] shrink-0" />
                        <div>
                          <span className="font-medium text-slate-900">
                            {row.territory}
                          </span>
                          {row.zone && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {row.zone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Quota Target */}
                    <TableCell className="py-3 font-mono text-xs text-slate-700">
                      {row.target}
                    </TableCell>

                    {/* Actual Realized */}
                    <TableCell className="py-3 font-mono text-xs font-semibold text-slate-900">
                      <div>
                        {row.achieved}
                        <div className="text-[10px] font-sans font-normal text-slate-400">
                          {row.matchingOrdersCount && row.matchingOrdersCount > 0
                            ? `${row.matchingOrdersCount} invoiced order${row.matchingOrdersCount > 1 ? "s" : ""}`
                            : "No live orders"}
                        </div>
                      </div>
                    </TableCell>

                    {/* Achievement Progress */}
                    <TableCell className="py-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <Progress
                          value={row.rate > 100 ? 100 : row.rate}
                          className={`h-1.5 flex-1 bg-slate-100 ${
                            row.rate >= 100
                              ? "[&>div]:bg-emerald-500"
                              : row.rate >= 90
                              ? "[&>div]:bg-[#0090FF]"
                              : "[&>div]:bg-amber-500"
                          }`}
                        />
                        <span
                          className={`w-10 text-right text-[11px] font-bold ${
                            row.rate >= 100
                              ? "text-emerald-700"
                              : row.rate >= 90
                              ? "text-blue-700"
                              : "text-amber-700"
                          }`}
                        >
                          {row.rate}%
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3 text-center text-xs">
                      <Badge
                        variant="outline"
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          row.status === "Surpassed"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : row.status === "On Track"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3 pr-0 text-right text-xs">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 text-xs">
                          <DropdownMenuLabel className="text-[11px] text-slate-500">
                            Quota Actions
                          </DropdownMenuLabel>
                          <PermissionGate feature="Target Vs Achievement" action="edit" also="special">
<DropdownMenuItem
                              onClick={() => openEditModal(row)}
                              className="cursor-pointer gap-2 text-xs"
                            >
                              <Pencil className="h-3.5 w-3.5 text-slate-600" />
                              Edit Quota
                            </DropdownMenuItem>
</PermissionGate>
                          <DropdownMenuSeparator />
                          <PermissionGate feature="Target Vs Achievement" action="delete">
<DropdownMenuItem
                              onClick={() => openDeleteModal(row)}
                              className="cursor-pointer gap-2 text-xs text-rose-600 focus:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete Target
                            </DropdownMenuItem>
</PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* 5. Edit Target Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-2xl border border-slate-200 bg-white sm:max-w-[460px] shadow-xl">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0090FF]">
              <Pencil className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 mt-2">
              Edit MIO Quota Target
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Modify the sales quota target or designated territory for this MIO officer.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateTarget} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-mio" className="text-xs font-semibold text-slate-700">
                Assigned MIO Officer *
              </Label>
              <Input
                id="edit-mio"
                value={editMio}
                onChange={(e) => setEditMio(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-territory" className="text-xs font-semibold text-slate-700">
                Territory Name *
              </Label>
              <Input
                id="edit-territory"
                value={editTerritory}
                onChange={(e) => setEditTerritory(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-target" className="text-xs font-semibold text-slate-700">
                  Quota Target (৳) *
                </Label>
                <Input
                  id="edit-target"
                  type="number"
                  value={editTargetAmount}
                  onChange={(e) => setEditTargetAmount(e.target.value)}
                  required
                  className="h-9 font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-achieved" className="text-xs font-semibold text-slate-700">
                  Realized Baseline (৳)
                </Label>
                <Input
                  id="edit-achieved"
                  type="number"
                  value={editAchievedAmount}
                  onChange={(e) => setEditAchievedAmount(e.target.value)}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-notes" className="text-xs font-medium text-slate-600">
                Adjustment Notes
              </Label>
              <Input
                id="edit-notes"
                placeholder="Reason for quota change"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isUpdating}
                className="h-9 text-xs font-semibold text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="h-9 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Quota"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Global Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModal.isOpen}
        onOpenChange={(open) => {
          if (!deleteModal.isDeleting) {
            setDeleteModal((prev) => ({ ...prev, isOpen: open }))
          }
        }}
        onConfirm={confirmDeleteTarget}
        title="Delete MIO Quota Target"
        description="Are you sure you want to delete this sales quota target? This action will permanently remove the record from the database and log a 21 CFR Part 11 audit trail event."
        itemName={deleteModal.itemName || undefined}
        confirmText="Confirm Deletion"
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  )
}
