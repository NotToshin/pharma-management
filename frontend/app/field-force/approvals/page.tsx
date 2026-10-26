"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  XCircle,
  Clock4,
  MapPin,
  CalendarDays,
  FileCheck2,
  Stethoscope,
  Store,
  User,
  AlertCircle,
} from "lucide-react"

interface PendingTP {
  id: string
  tpCode: string
  mioName: string
  territory: string
  submissionDate: string
  scheduledDate: string
  doctorsCount: number
  pharmaciesCount: number
  routeSummary: string
  doctorList: string[]
  notes: string
  status: "Pending" | "Approved" | "Rejected"
}

const initialQueue: PendingTP[] = []

export default function PendingApprovalsPage() {
  const [queue, setQueue] = React.useState<PendingTP[]>(initialQueue)
  const [selectedTP, setSelectedTP] = React.useState<PendingTP | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)

  const handleAction = (id: string, newStatus: "Approved" | "Rejected") => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: newStatus } : item
      )
    )
    if (selectedTP && selectedTP.id === id) {
      setIsDetailsOpen(false)
    }
  }

  const pendingItems = queue.filter((item) => item.status === "Pending")
  const approvedToday = queue.filter(
    (item) => item.status === "Approved"
  ).length
  const rejectedToday = queue.filter(
    (item) => item.status === "Rejected"
  ).length

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Pending Tour Programme Approvals
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Review, validate route itineraries, and authorize field officer
            movements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-lg border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800"
          >
            <Clock4 className="mr-1.5 inline h-3.5 w-3.5 text-amber-500" />
            {pendingItems.length} Awaiting Authorization
          </Badge>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              In Review Queue
            </span>
            <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
              <Clock4 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {pendingItems.length}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Requires Area Manager sign-off
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Authorized This Session
            </span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {approvedToday}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Ready for execution by field officers
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Returned / Rejected
            </span>
            <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {rejectedToday}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Returned for route correction
          </p>
        </Card>
      </div>

      {/* 3. Pending Queue Table */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Actionable Review Roster
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Inspect submitted doctor visit paths before authorizing sample
              distribution
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {pendingItems.length} Pending Actions
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0 text-xs font-medium text-slate-600">
                TP Code
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                MIO Officer
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Territory
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Target Date
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Route Waypoints
              </TableHead>
              <TableHead className="text-center text-xs font-medium text-slate-600">
                Docs / Stores
              </TableHead>
              <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                Quick Decisions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-xs text-slate-400"
                >
                  No tour plans awaiting review or authorization.
                </TableCell>
              </TableRow>
            ) : (
              queue.map((item) => (
              <TableRow
                key={item.id}
                className="border-b border-slate-50 hover:bg-slate-50/50"
              >
                <TableCell className="py-3 pl-0 font-mono text-xs font-semibold text-[#0090FF]">
                  <button
                    onClick={() => {
                      setSelectedTP(item)
                      setIsDetailsOpen(true)
                    }}
                    className="text-left hover:underline"
                  >
                    {item.tpCode}
                  </button>
                </TableCell>
                <TableCell className="py-3 text-xs font-semibold text-slate-900">
                  {item.mioName}
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.territory}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-600">
                  {item.scheduledDate}
                </TableCell>
                <TableCell className="max-w-[240px] truncate py-3 text-xs text-slate-600">
                  {item.routeSummary}
                </TableCell>
                <TableCell className="py-3 text-center text-xs font-medium text-slate-700">
                  {item.doctorsCount} / {item.pharmaciesCount}
                </TableCell>
                <TableCell className="py-3 pr-0 text-right text-xs">
                  {item.status === "Pending" ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTP(item)
                          setIsDetailsOpen(true)
                        }}
                        className="h-7 border-slate-200 px-2.5 text-[11px] font-medium hover:bg-slate-50"
                      >
                        Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(item.id, "Approved")}
                        className="h-7 bg-emerald-600 px-2.5 text-[11px] font-medium text-white shadow-none hover:bg-emerald-700"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAction(item.id, "Rejected")}
                        className="h-7 px-2 text-[11px] font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        item.status === "Approved"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                    >
                      {item.status}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </Card>

      {/* 4. Details & Inspection Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[520px]">
          {selectedTP && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-4">
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Tour Programme Review
                  </DialogTitle>
                  <span className="font-mono text-xs font-semibold text-[#0090FF]">
                    {selectedTP.tpCode}
                  </span>
                </div>
                <DialogDescription className="text-xs text-slate-500">
                  Submitted on {selectedTP.submissionDate} by{" "}
                  {selectedTP.mioName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Territory & Schedule */}
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                      Territory
                    </span>
                    <span className="font-semibold text-slate-800">
                      {selectedTP.territory}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                      Scheduled Date
                    </span>
                    <span className="font-semibold text-slate-800">
                      {selectedTP.scheduledDate}
                    </span>
                  </div>
                </div>

                {/* Route */}
                <div>
                  <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                    Planned Route Waypoints
                  </span>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700">
                    {selectedTP.routeSummary}
                  </div>
                </div>

                {/* Targeted Doctors */}
                <div>
                  <span className="mb-1.5 block flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                    Targeted Medical Practitioners ({selectedTP.doctorsCount})
                  </span>
                  <ul className="space-y-1 pl-1">
                    {selectedTP.doctorList.map((doc, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-slate-700"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0090FF]" />
                        <span>{doc}</span>
                      </li>
                    ))}
                    {selectedTP.doctorsCount > selectedTP.doctorList.length && (
                      <li className="pt-0.5 text-[11px] text-slate-400 italic">
                        +{" "}
                        {selectedTP.doctorsCount - selectedTP.doctorList.length}{" "}
                        additional listed doctors
                      </li>
                    )}
                  </ul>
                </div>

                {/* Officer Notes */}
                <div>
                  <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                    Objective / Strategy
                  </span>
                  <p className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-slate-600 italic">
                    "{selectedTP.notes}"
                  </p>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailsOpen(false)}
                  className="h-8 text-xs"
                >
                  Close
                </Button>
                {selectedTP.status === "Pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAction(selectedTP.id, "Rejected")}
                      className="h-8 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Reject Plan
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAction(selectedTP.id, "Approved")}
                      className="h-8 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                    >
                      Approve Tour
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
