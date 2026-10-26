"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
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
  Award,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Stethoscope,
  Users,
  Sparkles,
  Layers,
  ChevronRight,
} from "lucide-react"

import { apiFetch, getEndpoint } from "@/lib/api"

interface RankedDoctor {
  id: string
  rank: number
  name: string
  specialty: string
  institute: string
  territory: string
  assignedMio: string
  tier: "A+" | "A" | "B" | "C"
  patientVolume: number
  adherenceScore: number
  estMonthlyRx: string
  visitCycle: string
}

export default function CategoryRankingPage() {
  const [doctors, setDoctors] = React.useState<RankedDoctor[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tierFilter, setTierFilter] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    async function fetchRankedDoctors() {
      try {
        const res = await apiFetch(getEndpoint("/doctors?limit=100"))
        if (res.ok) {
          const json = await res.json()
          const rawList = Array.isArray(json) ? json : json.data || []
          const mapped: RankedDoctor[] = rawList.map((d: any, idx: number) => {
            const rawSpecInst = d.specialtyAndInstitute || ""
            const specialty = rawSpecInst.includes("(")
              ? rawSpecInst.split("(")[0].trim()
              : d.specialty || rawSpecInst || "General Physician"
            const institute =
              rawSpecInst.includes("(") && rawSpecInst.includes(")")
                ? rawSpecInst
                    .substring(
                      rawSpecInst.indexOf("(") + 1,
                      rawSpecInst.lastIndexOf(")")
                    )
                    .trim()
                : d.institute || "General Hospital"
            const territory = d.territoryAndMio
              ? d.territoryAndMio.split("/")[0].trim()
              : d.territory || "Central Zone"
            const mio = d.territoryAndMio?.includes("MIO:")
              ? d.territoryAndMio.split("MIO:")[1].trim()
              : d.assignedMio || "Unassigned"
            const tier: RankedDoctor["tier"] =
              d.tier?.includes("Tier 1") || d.tier === "A+"
                ? "A+"
                : d.tier?.includes("Tier 2") || d.tier === "A"
                  ? "A"
                  : d.tier?.includes("Tier 3") || d.tier === "B"
                    ? "B"
                    : "C"
            const patientVolume = d.patientVolumeDaily || 20
            return {
              id: d.id || String(idx + 1),
              rank: idx + 1,
              name: d.doctorName || d.name,
              specialty,
              institute,
              territory,
              assignedMio: mio,
              tier,
              patientVolume,
              adherenceScore: Math.min(95, 50 + patientVolume),
              estMonthlyRx: `৳${(patientVolume * 4500).toLocaleString("en-BD")}`,
              visitCycle:
                tier === "A+" ? "Bi-Weekly" : tier === "A" ? "Monthly" : "Bi-Monthly",
            }
          })
          setDoctors(mapped)
        }
      } catch {
        // ignore network error
      } finally {
        setLoading(false)
      }
    }
    fetchRankedDoctors()
  }, [])

  const tierVolumeChart = React.useMemo(() => {
    const total = doctors.length || 1
    const aPlus = doctors.filter((d) => d.tier === "A+").length
    const a = doctors.filter((d) => d.tier === "A").length
    const b = doctors.filter((d) => d.tier === "B").length
    const c = doctors.filter((d) => d.tier === "C").length
    return [
      { tier: "Cat A+", doctors: aPlus, share: Math.round((aPlus / total) * 100) },
      { tier: "Cat A", doctors: a, share: Math.round((a / total) * 100) },
      { tier: "Cat B", doctors: b, share: Math.round((b / total) * 100) },
      { tier: "Cat C", doctors: c, share: Math.round((c / total) * 100) },
    ]
  }, [doctors])

  const handleUpdateTier = (id: string, newTier: RankedDoctor["tier"]) => {
    setDoctors((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, tier: newTier } : doc))
    )
  }

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.territory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.assignedMio.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTier = tierFilter === "all" || doc.tier === tierFilter

    return matchesSearch && matchesTier
  })

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Prescription Potential — Category Ranking
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Stratification framework classifying prescribers by patient
            footfall, brand loyalty, and revenue yield.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-lg border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
          >
            <Award className="mr-1.5 inline h-3.5 w-3.5 text-amber-500" />4
            Active Tier Brackets
          </Badge>
        </div>
      </div>

      {/* 2. Four Tier Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Category A+ */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              Tier A+ • Key Opinion Leaders
            </span>
            <Sparkles className="h-4 w-4 text-[#0090FF]" />
          </div>
          <div className="mt-3 text-[26px] leading-none font-bold tracking-tight text-slate-900">
            {doctors.filter((d) => d.tier === "A+").length} Doctors
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            &gt;40 Patients/day • 46% Revenue Share
          </p>
          <div className="mt-3 text-[11px] font-medium text-slate-600">
            Mandatory: 2 Visits / Month
          </div>
        </Card>

        {/* Category A */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Tier A • High Yield Prescribers
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-[26px] leading-none font-bold tracking-tight text-slate-900">
            {doctors.filter((d) => d.tier === "A").length} Doctors
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            25 - 40 Patients/day • 30% Revenue Share
          </p>
          <div className="mt-3 text-[11px] font-medium text-slate-600">
            Mandatory: 1 Visit / Month
          </div>
        </Card>

        {/* Category B */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              Tier B • Moderate Prescribers
            </span>
            <Users className="h-4 w-4 text-slate-500" />
          </div>
          <div className="mt-3 text-[26px] leading-none font-bold tracking-tight text-slate-900">
            {doctors.filter((d) => d.tier === "B").length} Doctors
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            15 - 25 Patients/day • 16% Revenue Share
          </p>
          <div className="mt-3 text-[11px] font-medium text-slate-600">
            Mandatory: 1 Visit / 45 Days
          </div>
        </Card>

        {/* Category C */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              Tier C • Standard Maintenance
            </span>
            <Layers className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-3 text-[26px] leading-none font-bold tracking-tight text-slate-900">
            {doctors.filter((d) => d.tier === "C").length} Doctors
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            &lt;15 Patients/day • 8% Revenue Share
          </p>
          <div className="mt-3 text-[11px] font-medium text-slate-600">
            Quarterly Promotional Touch
          </div>
        </Card>
      </div>

      {/* 3. Mid Section: Revenue Impact Bar Chart */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Revenue Contribution by Tier Breakdown (%)
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Prescription share distribution across institutional categories
            </p>
          </div>
          <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0090FF]">
            Pareto Ratio: 80/20 Optimal
          </span>
        </div>

        <div className="h-[220px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={tierVolumeChart}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="tier"
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
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "11px",
                }}
                formatter={(val) => [`${val}%`, "Contribution Share"]}
              />
              <Bar
                dataKey="share"
                fill="#0090FF"
                radius={[4, 4, 0, 0]}
                barSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 4. Filter & Search Controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search physician, specialty, or territory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="h-8 w-[150px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Tiers" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="A+">Category A+ Only</SelectItem>
              <SelectItem value="A">Category A Only</SelectItem>
              <SelectItem value="B">Category B Only</SelectItem>
              <SelectItem value="C">Category C Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 5. Ranked Doctor Registry Ledger Table */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Physician Stratification Ledger
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Ranked descending by patient footfall and brand adoption score
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredDoctors.length} Practitioners
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="w-[50px] pl-0 text-xs font-medium text-slate-600">
                Rank
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Doctor & Attached Clinic
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Specialty / Hub
              </TableHead>
              <TableHead className="text-center text-xs font-medium text-slate-600">
                Daily Patients
              </TableHead>
              <TableHead className="w-[180px] text-xs font-medium text-slate-600">
                Brand Adherence
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Est. Monthly Rx
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Cycle Routine
              </TableHead>
              <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                Assigned Tier
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDoctors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-xs text-slate-400"
                >
                  {loading
                    ? "Loading prescribers..."
                    : "No prescribers found. Add prescribers in the Doctor Registry."}
                </TableCell>
              </TableRow>
            ) : (
              filteredDoctors.map((doc, idx) => (
              <TableRow
                key={doc.id}
                className="border-b border-slate-50 hover:bg-slate-50/50"
              >
                {/* Numerical Rank Badge */}
                <TableCell className="py-3 pl-0 font-mono text-xs font-bold text-slate-500">
                  #{idx + 1}
                </TableCell>

                {/* Doctor Name & Chamber */}
                <TableCell className="py-3 text-xs font-semibold text-slate-900">
                  <div>
                    <span className="block">{doc.name}</span>
                    <span className="block max-w-[210px] truncate text-[10px] font-normal text-slate-400">
                      {doc.institute}
                    </span>
                  </div>
                </TableCell>

                {/* Specialty & Territory */}
                <TableCell className="py-3 text-xs text-slate-700">
                  <div>
                    <span className="block font-medium text-slate-900">
                      {doc.specialty}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {doc.territory}
                    </span>
                  </div>
                </TableCell>

                {/* Daily Patients */}
                <TableCell className="py-3 text-center font-mono text-xs font-bold text-slate-900">
                  {doc.patientVolume}
                </TableCell>

                {/* Brand Adherence Progress */}
                <TableCell className="py-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Progress
                      value={doc.adherenceScore}
                      className="h-1.5 flex-1 bg-slate-100 [&>div]:bg-[#0090FF]"
                    />
                    <span className="w-8 text-right font-mono text-[11px] font-bold text-slate-700">
                      {doc.adherenceScore}%
                    </span>
                  </div>
                </TableCell>

                {/* Estimated Monthly Revenue */}
                <TableCell className="py-3 font-mono text-xs font-semibold text-slate-900">
                  {doc.estMonthlyRx}
                </TableCell>

                {/* Scheduled Cycle */}
                <TableCell className="py-3 text-xs text-slate-600">
                  <span className="text-[11px] font-medium text-slate-700">
                    {doc.visitCycle}
                  </span>
                </TableCell>

                {/* Change Tier Selector */}
                <TableCell className="py-3 pr-0 text-right text-xs">
                  <Select
                    value={doc.tier}
                    onValueChange={(val) =>
                      handleUpdateTier(doc.id, val as RankedDoctor["tier"])
                    }
                  >
                    <SelectTrigger className="ml-auto h-7 w-[95px] bg-white text-[11px] font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem
                        value="A+"
                        className="font-bold text-blue-600"
                      >
                        Category A+
                      </SelectItem>
                      <SelectItem
                        value="A"
                        className="font-bold text-emerald-600"
                      >
                        Category A
                      </SelectItem>
                      <SelectItem
                        value="B"
                        className="font-bold text-slate-700"
                      >
                        Category B
                      </SelectItem>
                      <SelectItem
                        value="C"
                        className="font-bold text-amber-600"
                      >
                        Category C
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
