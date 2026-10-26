"use client"

import * as React from "react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  MapPin,
  CalendarDays,
  Plus,
  Filter,
  CheckCircle2,
  Clock4,
  FileCheck2,
  Users2,
  ChevronRight,
} from "lucide-react"

interface TourPlan {
  id: string
  tpCode: string
  mioName: string
  territory: string
  visitDate: string
  targetDoctors: number
  coveredPharmacies: number
  plannedRoute: string
  status: "Approved" | "Pending" | "Completed" | "Rejected"
}

export default function AllTourPlansPage() {
  const [plans, setPlans] = React.useState<TourPlan[]>([])
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  // Modal form states
  const [mioName, setMioName] = React.useState("")
  const [territory, setTerritory] = React.useState("")
  const [visitDate, setVisitDate] = React.useState("")
  const [targetDoctors, setTargetDoctors] = React.useState("")
  const [coveredPharmacies, setCoveredPharmacies] = React.useState("")
  const [plannedRoute, setPlannedRoute] = React.useState("")

  const handleCreateTP = (e: React.FormEvent) => {
    e.preventDefault()
    const newPlan: TourPlan = {
      id: Date.now().toString(),
      tpCode: `TP-2026-0${plans.length + 95}`,
      mioName,
      territory,
      visitDate: visitDate || "21 Sep 2026",
      targetDoctors: Number(targetDoctors) || 0,
      coveredPharmacies: Number(coveredPharmacies) || 0,
      plannedRoute,
      status: "Pending",
    }

    setPlans((prev) => [newPlan, ...prev])
    setMioName("")
    setTerritory("")
    setVisitDate("")
    setTargetDoctors("")
    setCoveredPharmacies("")
    setPlannedRoute("")
    setIsDialogOpen(false)
  }

  const filteredPlans =
    statusFilter === "all"
      ? plans
      : plans.filter(
          (p) => p.status.toLowerCase() === statusFilter.toLowerCase()
        )

  const approvedCount = plans.filter((p) => p.status === "Approved").length
  const pendingCount = plans.filter((p) => p.status === "Pending").length
  const totalDoctorsTargeted = plans.reduce(
    (acc, curr) => acc + curr.targetDoctors,
    0
  )

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-10">
      {/* 1. Page Header with Action Modal */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Tour Programme (TP)
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Field itinerary planning, scheduled practitioner visits, and route
            approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[150px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Create TP Modal */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
              >
                <Plus className="h-4 w-4" />
                New Tour Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl bg-white sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Create Tour Programme
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Assign a doctor visit route and target itinerary to a Medical
                  Information Officer.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateTP} className="space-y-3.5 py-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="mio"
                    className="text-xs font-medium text-slate-700"
                  >
                    MIO Officer Name
                  </Label>
                  <Input
                    id="mio"
                    placeholder="e.g. Rafiqul Islam"
                    value={mioName}
                    onChange={(e) => setMioName(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="territory"
                      className="text-xs font-medium text-slate-700"
                    >
                      Territory Zone
                    </Label>
                    <Input
                      id="territory"
                      placeholder="e.g. Dhaka North"
                      value={territory}
                      onChange={(e) => setTerritory(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="date"
                      className="text-xs font-medium text-slate-700"
                    >
                      Visit Date
                    </Label>
                    <Input
                      id="date"
                      placeholder="e.g. 21 Sep 2026"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="docs"
                      className="text-xs font-medium text-slate-700"
                    >
                      Target Doctors
                    </Label>
                    <Input
                      id="docs"
                      type="number"
                      placeholder="10"
                      value={targetDoctors}
                      onChange={(e) => setTargetDoctors(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="pharmacies"
                      className="text-xs font-medium text-slate-700"
                    >
                      Retail Pharmacies
                    </Label>
                    <Input
                      id="pharmacies"
                      type="number"
                      placeholder="5"
                      value={coveredPharmacies}
                      onChange={(e) => setCoveredPharmacies(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="route"
                    className="text-xs font-medium text-slate-700"
                  >
                    Route Waypoints
                  </Label>
                  <Input
                    id="route"
                    placeholder="e.g. Sector 3 → Station Road → Model Hospital"
                    value={plannedRoute}
                    onChange={(e) => setPlannedRoute(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <DialogFooter className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
                  >
                    Submit for Approval
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
              Total Plans Tracked
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {plans.length}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Active field tour cycles
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Approved Rosters
            </span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {approvedCount}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">Ready for execution</p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Pending Review
            </span>
            <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
              <Clock4 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {pendingCount}
          </div>
          <p className="mt-3 text-[11px] font-medium text-amber-600">
            Awaiting Area Manager signoff
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Doctor Touchpoints
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <Users2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {totalDoctorsTargeted}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Scheduled prescription calls
          </p>
        </Card>
      </div>

      {/* 3. Main Tour Programme Ledger Table */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Field Tour Programme Register
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Verified daily itineraries, scheduled calls, and execution
              authorization
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredPlans.length} Records
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0 text-xs font-medium text-slate-600">
                TP Code
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Officer (MIO)
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Territory
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Schedule
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Planned Route
              </TableHead>
              <TableHead className="text-center text-xs font-medium text-slate-600">
                Docs / Stores
              </TableHead>
              <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.map((item) => (
              <TableRow
                key={item.id}
                className="border-b border-slate-50 hover:bg-slate-50/50"
              >
                <TableCell className="py-3 pl-0 font-mono text-xs font-semibold text-[#0090FF]">
                  {item.tpCode}
                </TableCell>
                <TableCell className="py-3 text-xs font-medium text-slate-900">
                  {item.mioName}
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.territory}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-600">
                  {item.visitDate}
                </TableCell>
                <TableCell className="max-w-[280px] truncate py-3 text-xs text-slate-600">
                  {item.plannedRoute}
                </TableCell>
                <TableCell className="py-3 text-center text-xs font-medium text-slate-700">
                  {item.targetDoctors} / {item.coveredPharmacies}
                </TableCell>
                <TableCell className="py-3 pr-0 text-right text-xs">
                  <Badge
                    variant="outline"
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      item.status === "Approved"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : item.status === "Completed"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : item.status === "Pending"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
