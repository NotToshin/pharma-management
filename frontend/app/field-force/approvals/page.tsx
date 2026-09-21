"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "lucide-react";

interface PendingTP {
  id: string;
  tpCode: string;
  mioName: string;
  territory: string;
  submissionDate: string;
  scheduledDate: string;
  doctorsCount: number;
  pharmaciesCount: number;
  routeSummary: string;
  doctorList: string[];
  notes: string;
  status: "Pending" | "Approved" | "Rejected";
}

const initialQueue: PendingTP[] = [
  {
    id: "1",
    tpCode: "TP-2026-091",
    mioName: "Kamrul Hasan",
    territory: "Chittagong Central",
    submissionDate: "16 Sep 2026",
    scheduledDate: "19 Sep 2026",
    doctorsCount: 10,
    pharmaciesCount: 5,
    routeSummary: "GEC Circle → Agrabad C/A → Halishahar",
    doctorList: [
      "Dr. Anwarul Azim (Cardiology)",
      "Dr. Farhana Yasmin (Gynecology)",
      "Dr. S. K. Roy (Internal Medicine)",
      "Dr. Mehedi Hasan (Pediatrics)",
    ],
    notes: "Prioritizing new sample distribution for Ciprocin launch.",
    status: "Pending",
  },
  {
    id: "2",
    tpCode: "TP-2026-092",
    mioName: "Enamul Haque",
    territory: "Sylhet Sadar",
    submissionDate: "16 Sep 2026",
    scheduledDate: "19 Sep 2026",
    doctorsCount: 9,
    pharmaciesCount: 4,
    routeSummary: "Zindabazar → Amberkhana → Subidbazar",
    doctorList: [
      "Dr. Mustafizur Rahman (Orthopedics)",
      "Dr. Nadia Islam (General Physician)",
      "Dr. Tareq Mahmud (Dermatology)",
    ],
    notes: "Follow-up visit regarding quarterly prescription potential.",
    status: "Pending",
  },
  {
    id: "3",
    tpCode: "TP-2026-095",
    mioName: "Arif Hossain",
    territory: "Mymensingh Sadar",
    submissionDate: "17 Sep 2026",
    scheduledDate: "20 Sep 2026",
    doctorsCount: 11,
    pharmaciesCount: 6,
    routeSummary: "Chorpara Medical Road → Town Hall → Notun Bazar",
    doctorList: [
      "Dr. K. M. Saifullah (Medicine)",
      "Dr. Nusrat Jahan (Obstetrics)",
      "Dr. Abu Sayeed (Neurology)",
    ],
    notes: "Targeting high prescription specialists in Medical College circle.",
    status: "Pending",
  },
  {
    id: "4",
    tpCode: "TP-2026-096",
    mioName: "Farhan Kabir",
    territory: "Bogura Hub",
    submissionDate: "17 Sep 2026",
    scheduledDate: "21 Sep 2026",
    doctorsCount: 8,
    pharmaciesCount: 4,
    routeSummary: "Satmatha → Thanthania → Sherpur Road",
    doctorList: [
      "Dr. Aminul Islam (Pediatrics)",
      "Dr. Shamim Ara (Gynecology)",
    ],
    notes: "Recovery route to improve quota realization in lagging territory.",
    status: "Pending",
  },
];

export default function PendingApprovalsPage() {
  const [queue, setQueue] = React.useState<PendingTP[]>(initialQueue);
  const [selectedTP, setSelectedTP] = React.useState<PendingTP | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  const handleAction = (id: string, newStatus: "Approved" | "Rejected") => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    if (selectedTP && selectedTP.id === id) {
      setIsDetailsOpen(false);
    }
  };

  const pendingItems = queue.filter((item) => item.status === "Pending");
  const approvedToday = queue.filter((item) => item.status === "Approved").length;
  const rejectedToday = queue.filter((item) => item.status === "Rejected").length;

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Pending Tour Programme Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review, validate route itineraries, and authorize field officer movements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold text-slate-800 bg-white border-slate-200 px-3 py-1 rounded-lg">
            <Clock4 className="h-3.5 w-3.5 mr-1.5 inline text-amber-500" />
            {pendingItems.length} Awaiting Authorization
          </Badge>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">In Review Queue</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock4 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {pendingItems.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Requires Area Manager sign-off
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Authorized This Session</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {approvedToday}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Ready for execution by field officers
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Returned / Rejected</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {rejectedToday}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Returned for route correction
          </p>
        </Card>
      </div>

      {/* 3. Pending Queue Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Actionable Review Roster
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect submitted doctor visit paths before authorizing sample distribution
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {pendingItems.length} Pending Actions
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">TP Code</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">MIO Officer</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Territory</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Target Date</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Route Waypoints</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-center">Docs / Stores</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Quick Decisions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.map((item) => (
              <TableRow key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <TableCell className="py-3 text-xs font-mono font-semibold text-[#0090FF] pl-0">
                  <button
                    onClick={() => {
                      setSelectedTP(item);
                      setIsDetailsOpen(true);
                    }}
                    className="hover:underline text-left"
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
                <TableCell className="py-3 text-xs text-slate-600 max-w-[240px] truncate">
                  {item.routeSummary}
                </TableCell>
                <TableCell className="py-3 text-xs text-center font-medium text-slate-700">
                  {item.doctorsCount} / {item.pharmaciesCount}
                </TableCell>
                <TableCell className="py-3 text-xs text-right pr-0">
                  {item.status === "Pending" ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTP(item);
                          setIsDetailsOpen(true);
                        }}
                        className="h-7 px-2.5 text-[11px] font-medium border-slate-200 hover:bg-slate-50"
                      >
                        Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(item.id, "Approved")}
                        className="h-7 px-2.5 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-none"
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
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        item.status === "Approved"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-rose-700 bg-rose-50 border-rose-200"
                      }`}
                    >
                      {item.status}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 4. Details & Inspection Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[520px] bg-white rounded-xl">
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
                  Submitted on {selectedTP.submissionDate} by {selectedTP.mioName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Territory & Schedule */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Territory</span>
                    <span className="font-semibold text-slate-800">{selectedTP.territory}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Scheduled Date</span>
                    <span className="font-semibold text-slate-800">{selectedTP.scheduledDate}</span>
                  </div>
                </div>

                {/* Route */}
                <div>
                  <span className="text-slate-500 block text-[11px] font-semibold mb-1">Planned Route Waypoints</span>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-700">
                    {selectedTP.routeSummary}
                  </div>
                </div>

                {/* Targeted Doctors */}
                <div>
                  <span className="text-slate-500 block text-[11px] font-semibold mb-1.5 flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                    Targeted Medical Practitioners ({selectedTP.doctorsCount})
                  </span>
                  <ul className="space-y-1 pl-1">
                    {selectedTP.doctorList.map((doc, idx) => (
                      <li key={idx} className="text-slate-700 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0090FF]" />
                        <span>{doc}</span>
                      </li>
                    ))}
                    {selectedTP.doctorsCount > selectedTP.doctorList.length && (
                      <li className="text-slate-400 italic text-[11px] pt-0.5">
                        + {selectedTP.doctorsCount - selectedTP.doctorList.length} additional listed doctors
                      </li>
                    )}
                  </ul>
                </div>

                {/* Officer Notes */}
                <div>
                  <span className="text-slate-500 block text-[11px] font-semibold mb-1">Objective / Strategy</span>
                  <p className="p-2.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-100 italic">
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
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
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
  );
}