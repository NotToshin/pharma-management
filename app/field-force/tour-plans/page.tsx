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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";

interface TourPlan {
  id: string;
  tpCode: string;
  mioName: string;
  territory: string;
  visitDate: string;
  targetDoctors: number;
  coveredPharmacies: number;
  plannedRoute: string;
  status: "Approved" | "Pending" | "Completed" | "Rejected";
}

const initialTourPlans: TourPlan[] = [
  {
    id: "1",
    tpCode: "TP-2026-089",
    mioName: "Rafiqul Islam",
    territory: "Dhaka North",
    visitDate: "18 Sep 2026",
    targetDoctors: 12,
    coveredPharmacies: 6,
    plannedRoute: "Uttara Sector 3 → Azampur → Airport Road",
    status: "Approved",
  },
  {
    id: "2",
    tpCode: "TP-2026-090",
    mioName: "Tanvir Ahmed",
    territory: "Dhaka South",
    visitDate: "18 Sep 2026",
    targetDoctors: 14,
    coveredPharmacies: 8,
    plannedRoute: "Dhanmondi 27 → Green Road → Panthapath",
    status: "Completed",
  },
  {
    id: "3",
    tpCode: "TP-2026-091",
    mioName: "Kamrul Hasan",
    territory: "Chittagong Central",
    visitDate: "19 Sep 2026",
    targetDoctors: 10,
    coveredPharmacies: 5,
    plannedRoute: "GEC Circle → Agrabad C/A → Halishahar",
    status: "Pending",
  },
  {
    id: "4",
    tpCode: "TP-2026-092",
    mioName: "Enamul Haque",
    territory: "Sylhet Sadar",
    visitDate: "19 Sep 2026",
    targetDoctors: 9,
    coveredPharmacies: 4,
    plannedRoute: "Zindabazar → Amberkhana → Subidbazar",
    status: "Pending",
  },
  {
    id: "5",
    tpCode: "TP-2026-093",
    mioName: "Sabbir Hossain",
    territory: "Rajshahi Metro",
    visitDate: "20 Sep 2026",
    targetDoctors: 11,
    coveredPharmacies: 7,
    plannedRoute: "Shaheb Bazar → Kazihata → Laxmipur",
    status: "Approved",
  },
  {
    id: "6",
    tpCode: "TP-2026-094",
    mioName: "Mahmudul Hasan",
    territory: "Khulna Zone",
    visitDate: "20 Sep 2026",
    targetDoctors: 8,
    coveredPharmacies: 5,
    plannedRoute: "Shibbari More → Daulatpur → Boyra",
    status: "Approved",
  },
];

export default function AllTourPlansPage() {
  const [plans, setPlans] = React.useState<TourPlan[]>(initialTourPlans);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Modal form states
  const [mioName, setMioName] = React.useState("");
  const [territory, setTerritory] = React.useState("");
  const [visitDate, setVisitDate] = React.useState("");
  const [targetDoctors, setTargetDoctors] = React.useState("");
  const [coveredPharmacies, setCoveredPharmacies] = React.useState("");
  const [plannedRoute, setPlannedRoute] = React.useState("");

  const handleCreateTP = (e: React.FormEvent) => {
    e.preventDefault();
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
    };

    setPlans((prev) => [newPlan, ...prev]);
    setMioName("");
    setTerritory("");
    setVisitDate("");
    setTargetDoctors("");
    setCoveredPharmacies("");
    setPlannedRoute("");
    setIsDialogOpen(false);
  };

  const filteredPlans =
    statusFilter === "all"
      ? plans
      : plans.filter((p) => p.status.toLowerCase() === statusFilter.toLowerCase());

  const approvedCount = plans.filter((p) => p.status === "Approved").length;
  const pendingCount = plans.filter((p) => p.status === "Pending").length;
  const totalDoctorsTargeted = plans.reduce((acc, curr) => acc + curr.targetDoctors, 0);

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header with Action Modal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Tour Programme (TP)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Field itinerary planning, scheduled practitioner visits, and route approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[150px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
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
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none">
                <Plus className="h-4 w-4" />
                New Tour Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Create Tour Programme</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Assign a doctor visit route and target itinerary to a Medical Information Officer.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateTP} className="space-y-3.5 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="mio" className="text-xs font-medium text-slate-700">MIO Officer Name</Label>
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
                    <Label htmlFor="territory" className="text-xs font-medium text-slate-700">Territory Zone</Label>
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
                    <Label htmlFor="date" className="text-xs font-medium text-slate-700">Visit Date</Label>
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
                    <Label htmlFor="docs" className="text-xs font-medium text-slate-700">Target Doctors</Label>
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
                    <Label htmlFor="pharmacies" className="text-xs font-medium text-slate-700">Retail Pharmacies</Label>
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
                  <Label htmlFor="route" className="text-xs font-medium text-slate-700">Route Waypoints</Label>
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
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                    Submit for Approval
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Plans Tracked</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {plans.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Active field tour cycles
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Approved Rosters</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {approvedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Ready for execution
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Review</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock4 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {pendingCount}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-3">
            Awaiting Area Manager signoff
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Doctor Touchpoints</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Users2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {totalDoctorsTargeted}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Scheduled prescription calls
          </p>
        </Card>
      </div>

      {/* 3. Main Tour Programme Ledger Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Field Tour Programme Register
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified daily itineraries, scheduled calls, and execution authorization
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredPlans.length} Records
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">TP Code</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Officer (MIO)</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Territory</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Schedule</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Planned Route</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-center">Docs / Stores</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.map((item) => (
              <TableRow key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <TableCell className="py-3 text-xs font-mono font-semibold text-[#0090FF] pl-0">
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
                <TableCell className="py-3 text-xs text-slate-600 max-w-[280px] truncate">
                  {item.plannedRoute}
                </TableCell>
                <TableCell className="py-3 text-xs text-center font-medium text-slate-700">
                  {item.targetDoctors} / {item.coveredPharmacies}
                </TableCell>
                <TableCell className="py-3 text-xs text-right pr-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      item.status === "Approved"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : item.status === "Completed"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : item.status === "Pending"
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-rose-700 bg-rose-50 border-rose-200"
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
  );
}