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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  MapPin,
  TrendingUp,
  Building2,
  Users,
  Store,
  ArrowUpRight,
  Filter,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  FileText,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  SlidersHorizontal,
  Loader2,
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export interface TerritoryLedgerItem {
  territory: string
  division: string
  activeMios: number
  mioNames: string[]
  pharmacies: number
  topProduct: string
  revenueRaw: number
  revenue: string
  orderCount: number
  targetAmount: number
  targetRate: number
  growth: string
  status: "Top Tier" | "Strong" | "Stable" | "Lagging"
  recentOrders?: Array<{
    orderNumber: string
    date: string
    pharmacy: string
    value: number
    status: string
  }>
  clients?: Array<{
    name: string
    phone: string
    status: string
  }>
}

export interface ZoneBarItem {
  zone: string
  fullZone: string
  sales: number
  salesRaw: number
  growth: string
  orders: number
}

export interface DivisionShareItem {
  name: string
  fullName: string
  value: number
  revenueRaw: number
  revenueFormatted: string
  color: string
}

export interface AnalyticsKPIs {
  grossRegionalSales: number
  grossRegionalSalesFormatted: string
  yoyGrowthRate: string
  activeHubsCount: number
  activeZonesCount: number
  divisionsCoveredCount: number
  subscribedPharmacies: number
  avgClientsPerZone: number
  fieldForceOfficers: number
  avgTurnoverPerMio: number
  avgTurnoverPerMioFormatted: string
  totalOrdersCount: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface AnalyticsPayload {
  selectedDivision: string
  availableDivisions: string[]
  kpis: AnalyticsKPIs
  zoneBarData: ZoneBarItem[]
  divisionShareData: DivisionShareItem[]
  territoryLedger: TerritoryLedgerItem[]
  pagination: PaginationMeta
  meta?: PaginationMeta
  sorting?: {
    sortBy: string
    sortOrder: "asc" | "desc"
  }
  filters?: {
    searchTerm: string
    status: string
  }
}

export default function TerritorySalesBreakdownPage() {
  const [data, setData] = React.useState<AnalyticsPayload | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isTableLoading, setIsTableLoading] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Server-side Pagination, Sort & Filter State (Exact match to Doctor Registry — Master Database)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [totalItems, setTotalItems] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(1)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [selectedDivision, setSelectedDivision] = React.useState("all")
  const [selectedStatus, setSelectedStatus] = React.useState("all")
  const [sortBy, setSortBy] = React.useState<string>("revenue")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")

  // Drilldown modal state
  const [activeTerritory, setActiveTerritory] = React.useState<TerritoryLedgerItem | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  // Debounce search query to avoid spamming the backend (matching Doctor Registry)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Centralized Fetch function sending search, sort, and pagination to the backend API
  const fetchData = React.useCallback(
    async (showToast = false, isFullReload = false) => {
      try {
        if (isFullReload) {
          setIsLoading(true)
        } else {
          setIsTableLoading(true)
        }
        if (showToast) setIsRefreshing(true)

        const queryParams = new URLSearchParams()
        if (selectedDivision !== "all") queryParams.set("division", selectedDivision)
        if (debouncedSearch.trim()) queryParams.set("searchTerm", debouncedSearch.trim())
        if (selectedStatus !== "all") queryParams.set("status", selectedStatus)
        if (sortBy) queryParams.set("sortBy", sortBy)
        if (sortOrder) queryParams.set("sortOrder", sortOrder)
        queryParams.set("page", String(currentPage))
        queryParams.set("limit", String(pageSize))

        const qs = queryParams.toString()
        const endpoint = qs ? `/territory-analytics?${qs}` : "/territory-analytics"

        const res = await apiFetch(endpoint)
        if (!res.ok) {
          throw new Error(`Failed to load territory telemetry (Status: ${res.status})`)
        }

        const json = await res.json()
        const payload: AnalyticsPayload = json.data || json
        setData(payload)

        if (payload.pagination) {
          setTotalItems(payload.pagination.total ?? 0)
          setTotalPages(Math.max(1, payload.pagination.totalPage ?? 1))
        }

        if (showToast) {
          toast.success("Territory analytics synchronized with live database")
        }
      } catch (err: any) {
        console.error("Error fetching territory telemetry:", err)
        toast.error("Failed to load territory data from database")
      } finally {
        setIsLoading(false)
        setIsTableLoading(false)
        setIsRefreshing(false)
      }
    },
    [selectedDivision, debouncedSearch, selectedStatus, sortBy, sortOrder, currentPage, pageSize]
  )

  // Auto-fetch data on dependency changes (matching Doctor Registry)
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Column Header Sort Toggle Handler
  const handleSort = (column: string) => {
    let newOrder: "asc" | "desc" = "desc"
    if (sortBy === column) {
      newOrder = sortOrder === "asc" ? "desc" : "asc"
    } else {
      newOrder =
        column === "territory" || column === "division" || column === "topProduct"
          ? "asc"
          : "desc"
    }
    setSortBy(column)
    setSortOrder(newOrder)
    setCurrentPage(1)
  }

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedDivision("all")
    setSearchQuery("")
    setDebouncedSearch("")
    setSelectedStatus("all")
    setSortBy("revenue")
    setSortOrder("desc")
    setCurrentPage(1)
  }

  // Baseline data re-sync
  const handleSyncBaseline = async () => {
    const toastId = toast.loading("Syncing regional operational baseline...")
    try {
      const res = await apiFetch("/territory-analytics/sync-baseline", {
        method: "POST",
      })
      if (!res.ok) throw new Error("Sync failed")
      const json = await res.json()
      setData(json.data || json)
      toast.success("Regional operational data synchronized successfully", {
        id: toastId,
      })
    } catch (err) {
      console.error(err)
      toast.error("Failed to sync regional baseline data", { id: toastId })
    }
  }

  const openDrillDown = (item: TerritoryLedgerItem) => {
    setActiveTerritory(item)
    setIsModalOpen(true)
  }

  // Sort icon renderer
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5 text-blue-600 font-bold" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5 text-blue-600 font-bold" />
    )
  }

  const isSearching = isTableLoading || isLoading

  // Pagination items builder matching Doctor Registry — Master Database
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
    <div className="mx-auto max-w-[1360px] space-y-6 pb-12">
      {/* 1. Page Header with Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Territory Sales Breakdown
            </h1>
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold gap-1 py-0.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live DB Synced
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl">
            Real-time regional turnover distribution, MIO field force allocation,
            and retail pharmacy market penetration with backend search, sorting, and pagination.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Division Selector */}
          <Select
            value={selectedDivision}
            onValueChange={(div) => {
              setSelectedDivision(div)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="h-9 w-[190px] border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-xs hover:border-slate-300">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Divisions" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Administrative Divisions</SelectItem>
              {data?.availableDivisions?.map((div) => (
                <SelectItem key={div} value={div}>
                  {div}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true, false)}
            disabled={isRefreshing}
            className="h-9 gap-1.5 border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-slate-500 ${
                isRefreshing ? "animate-spin text-blue-600" : ""
              }`}
            />
            <span>Refresh</span>
          </Button>

          {/* Baseline Sync Action */}
          <PermissionGate feature="Territory Sales Breakdown" action="special">
<Button
              size="sm"
              onClick={handleSyncBaseline}
              className="h-9 gap-1.5 bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-600"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-100" />
              <span>Sync Baseline Data</span>
            </Button>
</PermissionGate>
        </div>
      </div>

      {/* 2. Key Performance Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Gross Regional Sales */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gross Regional Sales
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-[#0090FF]">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <div className="text-[28px] font-bold tracking-tight text-slate-900 font-mono">
                {data?.kpis?.grossRegionalSalesFormatted || "৳0"}
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {data?.kpis?.yoyGrowthRate || "+8.4% YoY"}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              {data?.kpis?.totalOrdersCount || 0} Orders Billed
            </span>
          </div>
        </Card>

        {/* Territory Count */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Operational Hubs
            </span>
            <Badge
              variant="outline"
              className="rounded-md border-blue-200 bg-blue-50/80 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
            >
              {data?.kpis?.activeHubsCount || 0} Hubs Active
            </Badge>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-[28px] font-bold tracking-tight text-slate-900">
                {data?.kpis?.activeZonesCount || 0} Zones
              </div>
            )}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Covering {data?.kpis?.divisionsCoveredCount || 0} administrative divisions
          </p>
        </Card>

        {/* Retail Outlets Penetration */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Subscribed Pharmacies
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-[28px] font-bold tracking-tight text-slate-900">
                {data?.kpis?.subscribedPharmacies || 0} Stores
              </div>
            )}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Avg. {data?.kpis?.avgClientsPerZone || 0} client pharmacies per hub
          </p>
        </Card>

        {/* MIO Workforce Density */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Field Force (MIOs)
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-[28px] font-bold tracking-tight text-slate-900">
                {data?.kpis?.fieldForceOfficers ?? 0} Officer{(data?.kpis?.fieldForceOfficers ?? 0) === 1 ? "" : "s"}
              </div>
            )}
          </div>
          <p className="mt-3 text-[11px] text-slate-400 truncate">
            {data?.kpis?.avgTurnoverPerMioFormatted || "৳0 monthly turnover per MIO"}
          </p>
        </Card>
      </div>

      {/* 3. Middle Visualizations Grid: Bar Chart & Market Share Pie */}
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
        {/* Zone Bar Chart */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-xs lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Regional Sales Volume (in Lakh ৳)
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Billed medicine dispatches across primary administrative territories from database orders
                </p>
              </div>
              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0090FF]">
                Fiscal Year 2026
              </span>
            </div>

            <div className="h-[280px] w-full pt-4">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : data?.zoneBarData && data.zoneBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    key={`barchart-${data.zoneBarData.length}-${selectedDivision}`}
                    data={data.zoneBarData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="zone"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                      }}
                      formatter={(value: any, name: any, item: any) => [
                        `৳${value} Lakh (৳${(item.payload.salesRaw || 0).toLocaleString("en-IN")})`,
                        "Sales Volume",
                      ]}
                      labelFormatter={(label, payload) => {
                        const full = payload?.[0]?.payload?.fullZone || label
                        return `Territory Hub: ${full}`
                      }}
                    />
                    <Bar
                      dataKey="sales"
                      fill="#0090FF"
                      radius={[6, 6, 0, 0]}
                      barSize={28}
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-slate-400 text-xs">
                  <Building2 className="h-8 w-8 text-slate-300 mb-2" />
                  No order volume recorded for this division yet.
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Showing top {data?.zoneBarData?.length || 0} active territory hubs</span>
            <span className="font-mono text-slate-600">Source: Real-time Order Ledger</span>
          </div>
        </Card>

        {/* Division Market Share Pie */}
        <Card className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-6 shadow-xs lg:col-span-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Territory Market Share
            </h2>
            <p className="mt-0.5 mb-2 text-xs text-slate-400">
              Revenue distribution percentage by division
            </p>

            <div className="flex h-[180px] w-full items-center justify-center">
              {isLoading ? (
                <Skeleton className="h-36 w-36 rounded-full" />
              ) : data?.divisionShareData && data.divisionShareData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart key={`piechart-${data.divisionShareData.length}-${selectedDivision}`}>
                    <Pie
                      data={data.divisionShareData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    >
                      {data.divisionShareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "11px",
                      }}
                      formatter={(val: any, name: any, item: any) => [
                        `${val}% (${item.payload.revenueFormatted || ""})`,
                        "Market Share",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No share data available
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            {data?.divisionShareData?.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-slate-600 truncate max-w-[140px]">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400 text-[11px]">
                    {item.revenueFormatted}
                  </span>
                  <span className="font-bold text-slate-900 min-w-[38px] text-right">
                    {item.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 3. Search & Filter Bar (Matching Doctor Registry — Master Database) */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search hub, formulation, MIO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
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
              <SelectValue placeholder="Sort Hubs" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="revenue:desc">Revenue (High → Low)</SelectItem>
              <SelectItem value="revenue:asc">Revenue (Low → High)</SelectItem>
              <SelectItem value="territory:asc">Territory (A → Z)</SelectItem>
              <SelectItem value="territory:desc">Territory (Z → A)</SelectItem>
              <SelectItem value="orders:desc">Orders (High → Low)</SelectItem>
              <SelectItem value="orders:asc">Orders (Low → High)</SelectItem>
              <SelectItem value="growth:desc">Growth (High → Low)</SelectItem>
              <SelectItem value="growth:asc">Growth (Low → High)</SelectItem>
            </SelectContent>
          </Select>

          {/* Division Filter */}
          <Select
            value={selectedDivision}
            onValueChange={(val) => {
              setSelectedDivision(val)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[150px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Divisions" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Divisions</SelectItem>
              {data?.availableDivisions?.map((div) => (
                <SelectItem key={div} value={div}>
                  {div}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={selectedStatus}
            onValueChange={(val) => {
              setSelectedStatus(val)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[130px] border-slate-200 bg-white text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Top Tier">Top Tier</SelectItem>
              <SelectItem value="Strong">Strong</SelectItem>
              <SelectItem value="Stable">Stable</SelectItem>
              <SelectItem value="Lagging">Lagging</SelectItem>
            </SelectContent>
          </Select>

          {(searchQuery || selectedStatus !== "all" || selectedDivision !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 px-2 text-xs text-slate-500 hover:text-slate-900"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* 4. Detailed Territory Operations Ledger (Matching Doctor Registry) */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              TERRITORY OPERATIONS LEDGER
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Regional dispatch registry with live order metrics, MIO assignments, and fulfillment telemetry
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
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems} Territories
            </span>
          </div>
        </div>

        {/* Server-Side Paginated & Sorted Table */}
        <div className="rounded-lg border border-slate-100 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-slate-200/70 text-xs text-slate-600 hover:bg-transparent">
                <TableHead
                  onClick={() => handleSort("territory")}
                  className="pl-4 text-xs font-semibold text-slate-700 cursor-pointer select-none group hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center">
                    <span>Territory Hub</span>
                    {renderSortIcon("territory")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("division")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none group hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center">
                    <span>Division</span>
                    {renderSortIcon("division")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("activeMios")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none group hover:bg-slate-100/60 transition-colors text-center"
                >
                  <div className="flex items-center justify-center">
                    <span>MIOs</span>
                    {renderSortIcon("activeMios")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("pharmacies")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none group hover:bg-slate-100/60 transition-colors text-center"
                >
                  <div className="flex items-center justify-center">
                    <span>Pharmacies</span>
                    {renderSortIcon("pharmacies")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("topProduct")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none group hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center">
                    <span>Leading Formulation</span>
                    {renderSortIcon("topProduct")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("revenue")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none group hover:bg-slate-100/60 transition-colors text-right"
                >
                  <div className="flex items-center justify-end">
                    <span>Total Revenue</span>
                    {renderSortIcon("revenue")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("orders")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none group hover:bg-slate-100/60 transition-colors text-center"
                >
                  <div className="flex items-center justify-center">
                    <span>Orders</span>
                    {renderSortIcon("orders")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("growth")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none group hover:bg-slate-100/60 transition-colors text-center"
                >
                  <div className="flex items-center justify-center">
                    <span>Growth / Quota</span>
                    {renderSortIcon("growth")}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("status")}
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none group hover:bg-slate-100/60 transition-colors text-center"
                >
                  <div className="flex items-center justify-center">
                    <span>Status</span>
                    {renderSortIcon("status")}
                  </div>
                </TableHead>
                <TableHead className="pr-4 text-right text-xs font-semibold text-slate-700">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isTableLoading ? (
                Array.from({ length: pageSize || 10 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-slate-50">
                    <TableCell colSpan={10} className="py-3 px-4">
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.territoryLedger && data.territoryLedger.length > 0 ? (
                data.territoryLedger.map((item, idx) => (
                  <TableRow
                    key={idx}
                    className="border-b border-slate-50 transition-colors hover:bg-slate-50/70 cursor-pointer"
                    onClick={() => openDrillDown(item)}
                  >
                    <TableCell className="py-3.5 pl-4 text-xs font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="hover:underline">{item.territory}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-slate-500">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                        {item.division.replace(" Division", "")}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-slate-700 font-medium text-center">
                      <span
                        className="inline-flex items-center justify-center rounded-full bg-slate-100 h-6 px-2 text-[11px]"
                        title={item.mioNames?.join(", ") || "No MIO"}
                      >
                        {item.activeMios} MIO{item.activeMios === 1 ? "" : "s"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-slate-700 font-medium text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Store className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.pharmacies}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 text-xs font-medium text-slate-700">
                      <span className="truncate max-w-[200px] inline-block font-sans text-slate-800">
                        {item.topProduct}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 font-mono text-xs font-bold text-slate-900 text-right">
                      {item.revenue}
                    </TableCell>
                    <TableCell className="py-3.5 font-mono text-xs text-slate-600 text-center">
                      {item.orderCount}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-center">
                      <span
                        className={`font-semibold ${
                          item.growth.startsWith("+")
                            ? "text-emerald-600"
                            : item.growth === "0.0%"
                              ? "text-slate-400"
                              : "text-rose-600"
                        }`}
                      >
                        {item.growth}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 text-center">
                      <Badge
                        variant="outline"
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          item.status === "Top Tier"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : item.status === "Strong"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : item.status === "Stable"
                                ? "border-slate-200 bg-slate-50 text-slate-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 pr-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDrillDown(item)
                        }}
                        className="h-7 px-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-12 text-center text-xs text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <MapPin className="h-8 w-8 text-slate-300" />
                      <p className="font-medium text-slate-600">
                        No territories match your search query or active filters.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="mt-1 h-8 text-xs"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

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

      {/* 6. Territory Drill-Down Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white p-6 rounded-xl border border-slate-200">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {activeTerritory?.territory} Hub Breakdown
                </DialogTitle>
              </div>
              <Badge
                variant="outline"
                className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                  activeTerritory?.status === "Top Tier"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : activeTerritory?.status === "Strong"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : activeTerritory?.status === "Stable"
                        ? "border-slate-200 bg-slate-50 text-slate-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {activeTerritory?.status}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Division: {activeTerritory?.division} • Formulations, field officers,
              and recent sales dispatches.
            </DialogDescription>
          </DialogHeader>

          {activeTerritory && (
            <div className="space-y-4 pt-3">
              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">
                    Total Revenue
                  </span>
                  <div className="mt-1 font-mono text-base font-bold text-slate-900">
                    {activeTerritory.revenue}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    {activeTerritory.growth} YoY
                  </span>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">
                    Dispatched Orders
                  </span>
                  <div className="mt-1 text-base font-bold text-slate-900 font-mono">
                    {activeTerritory.orderCount} Orders
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Avg. ৳{(activeTerritory.orderCount > 0 ? activeTerritory.revenueRaw / activeTerritory.orderCount : 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })} / order
                  </span>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">
                    Retail Penetration
                  </span>
                  <div className="mt-1 text-base font-bold text-slate-900 font-mono">
                    {activeTerritory.pharmacies} Stores
                  </div>
                  <span className="text-[11px] text-slate-400 truncate block">
                    Lead: {activeTerritory.topProduct}
                  </span>
                </div>
              </div>

              {/* Assigned MIOs */}
              <div className="rounded-lg border border-slate-100 p-3.5 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-indigo-500" />
                    Assigned Field Force (MIOs)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {activeTerritory.mioNames?.length || 0} Officer{activeTerritory.mioNames?.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeTerritory.mioNames && activeTerritory.mioNames.length > 0 ? (
                    activeTerritory.mioNames.map((name, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="bg-indigo-50/50 text-indigo-700 border-indigo-200 text-xs py-1"
                      >
                        {name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      No dedicated MIO assigned yet
                    </span>
                  )}
                </div>
              </div>

              {/* Recent Orders in Territory */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-2 flex items-center gap-1.5">
                  <PackageCheck className="h-3.5 w-3.5 text-blue-500" />
                  Recent Sales Dispatches
                </h4>
                {activeTerritory.recentOrders && activeTerritory.recentOrders.length > 0 ? (
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                    {activeTerritory.recentOrders.map((ord, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50/80"
                      >
                        <div>
                          <div className="font-mono font-bold text-slate-900">
                            {ord.orderNumber}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {ord.pharmacy} • {ord.date}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900">
                            ৳{ord.value.toLocaleString("en-IN")}
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 border-emerald-200 bg-emerald-50 text-emerald-700"
                          >
                            {ord.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                    No orders dispatched to this territory yet.
                  </p>
                )}
              </div>

              {/* Subscribed Client Pharmacies */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-2 flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-emerald-500" />
                  Subscribed Retail Pharmacies
                </h4>
                {activeTerritory.clients && activeTerritory.clients.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeTerritory.clients.map((cli, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-slate-100 p-2.5 bg-slate-50/50 text-xs flex justify-between items-center"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            {cli.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {cli.phone}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 border-slate-200 bg-white text-slate-700"
                        >
                          {cli.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                    No retail pharmacies registered in this territory yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
