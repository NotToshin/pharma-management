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
  Clock,
  MapPin,
  Plus,
  Stethoscope,
  Filter,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  Search,
} from "lucide-react";

interface VisitLog {
  id: string;
  dcrCode: string;
  doctorName: string;
  specialty: string;
  chamber: string;
  mioName: string;
  territory: string;
  visitTime: string;
  promotedDrugs: string;
  samplesGiven: string;
  feedback: "High Potential" | "Positive" | "Neutral" | "Needs Follow-up";
}

const initialLogs: VisitLog[] = [
  {
    id: "1",
    dcrCode: "DCR-2026-101",
    doctorName: "Dr. Anwarul Azim",
    specialty: "Cardiologist",
    chamber: "Popular Diagnostic Center, Dhanmondi",
    mioName: "Rafiqul Islam",
    territory: "Dhaka North",
    visitTime: "10:30 AM",
    promotedDrugs: "Rosuvastatin 10mg, Cardiloc 5mg",
    samplesGiven: "4 Strips",
    feedback: "High Potential",
  },
  {
    id: "2",
    dcrCode: "DCR-2026-102",
    doctorName: "Dr. Farhana Yasmin",
    specialty: "Gynecologist",
    chamber: "Labaid Specialized Hospital",
    mioName: "Rafiqul Islam",
    territory: "Dhaka North",
    visitTime: "11:45 AM",
    promotedDrugs: "Fefol-Z, Calcium D3",
    samplesGiven: "6 Strips",
    feedback: "Positive",
  },
  {
    id: "3",
    dcrCode: "DCR-2026-103",
    doctorName: "Dr. S. K. Roy",
    specialty: "Internal Medicine",
    chamber: "Medinova Medical Services, Mirpur",
    mioName: "Tanvir Ahmed",
    territory: "Dhaka South",
    visitTime: "01:15 PM",
    promotedDrugs: "Azithromycin 500mg, Omeprazole",
    samplesGiven: "2 Strips",
    feedback: "High Potential",
  },
  {
    id: "4",
    dcrCode: "DCR-2026-104",
    doctorName: "Dr. Mehedi Hasan",
    specialty: "Pediatrician",
    chamber: "Chevron Clinical Lab, Chittagong",
    mioName: "Kamrul Hasan",
    territory: "Chittagong Central",
    visitTime: "03:40 PM",
    promotedDrugs: "Cef-3 Drops, Paracetamol Susp.",
    samplesGiven: "5 Vials",
    feedback: "Neutral",
  },
  {
    id: "5",
    dcrCode: "DCR-2026-105",
    doctorName: "Dr. Mustafizur Rahman",
    specialty: "Orthopedics",
    chamber: "Ibn Sina Hospital, Sylhet",
    mioName: "Enamul Haque",
    territory: "Sylhet Sadar",
    visitTime: "05:10 PM",
    promotedDrugs: "Aceclofenac 100mg, Diacerein",
    samplesGiven: "3 Strips",
    feedback: "Needs Follow-up",
  },
  {
    id: "6",
    dcrCode: "DCR-2026-106",
    doctorName: "Dr. Nadia Islam",
    specialty: "General Physician",
    chamber: "Apollo Clinic, Rajshahi",
    mioName: "Sabbir Hossain",
    territory: "Rajshahi Metro",
    visitTime: "06:30 PM",
    promotedDrugs: "Pantoprazole 20mg, Antacid Susp.",
    samplesGiven: "4 Strips",
    feedback: "Positive",
  },
];

export default function DoctorVisitLogsPage() {
  const [logs, setLogs] = React.useState<VisitLog[]>(initialLogs);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [feedbackFilter, setFeedbackFilter] = React.useState("all");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Form states
  const [doctorName, setDoctorName] = React.useState("");
  const [specialty, setSpecialty] = React.useState("");
  const [chamber, setChamber] = React.useState("");
  const [mioName, setMioName] = React.useState("");
  const [territory, setTerritory] = React.useState("");
  const [visitTime, setVisitTime] = React.useState("");
  const [promotedDrugs, setPromotedDrugs] = React.useState("");
  const [samplesGiven, setSamplesGiven] = React.useState("");
  const [feedback, setFeedback] = React.useState<VisitLog["feedback"]>("Positive");

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: VisitLog = {
      id: Date.now().toString(),
      dcrCode: `DCR-2026-10${logs.length + 7}`,
      doctorName,
      specialty,
      chamber,
      mioName,
      territory,
      visitTime: visitTime || "12:00 PM",
      promotedDrugs,
      samplesGiven: samplesGiven || "None",
      feedback,
    };

    setLogs((prev) => [newLog, ...prev]);
    setDoctorName("");
    setSpecialty("");
    setChamber("");
    setMioName("");
    setTerritory("");
    setVisitTime("");
    setPromotedDrugs("");
    setSamplesGiven("");
    setIsDialogOpen(false);
  };

  const filteredLogs = logs.filter((item) => {
    const matchesSearch =
      item.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.chamber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mioName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFeedback =
      feedbackFilter === "all" || item.feedback.toLowerCase() === feedbackFilter.toLowerCase();

    return matchesSearch && matchesFeedback;
  });

  const highPotentialCount = logs.filter((l) => l.feedback === "High Potential").length;

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Daily Call Reports (DCR) — Doctor Visit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time field call entries, prescription commitment feedback, and drug sample records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs font-semibold text-slate-800 bg-white border-slate-200 px-3 py-1.5 rounded-lg">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5 inline text-slate-600" />
            Today's Visits
          </Badge>

          {/* New Call Log Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none">
                <Plus className="h-4 w-4" />
                Log Doctor Call
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Log Daily Doctor Call</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Record field engagement notes, sampled items, and commitment feedback.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddLog} className="space-y-3.5 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="doc" className="text-xs font-medium text-slate-700">Doctor Name</Label>
                    <Input
                      id="doc"
                      placeholder="e.g. Dr. Tareq Mahmud"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="specialty" className="text-xs font-medium text-slate-700">Specialty</Label>
                    <Input
                      id="specialty"
                      placeholder="e.g. Cardiology"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="chamber" className="text-xs font-medium text-slate-700">Chamber / Hospital Address</Label>
                  <Input
                    id="chamber"
                    placeholder="e.g. Popular Diagnostic, Mirpur"
                    value={chamber}
                    onChange={(e) => setChamber(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="mio" className="text-xs font-medium text-slate-700">Field MIO</Label>
                    <Input
                      id="mio"
                      placeholder="MIO Name"
                      value={mioName}
                      onChange={(e) => setMioName(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="territory" className="text-xs font-medium text-slate-700">Territory</Label>
                    <Input
                      id="territory"
                      placeholder="Territory Zone"
                      value={territory}
                      onChange={(e) => setTerritory(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="time" className="text-xs font-medium text-slate-700">Call Time</Label>
                    <Input
                      id="time"
                      placeholder="11:30 AM"
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="drugs" className="text-xs font-medium text-slate-700">Promoted Formulations</Label>
                    <Input
                      id="drugs"
                      placeholder="e.g. Napa Extra, Ciprocin"
                      value={promotedDrugs}
                      onChange={(e) => setPromotedDrugs(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="samples" className="text-xs font-medium text-slate-700">Samples Handed Over</Label>
                    <Input
                      id="samples"
                      placeholder="e.g. 4 Strips"
                      value={samplesGiven}
                      onChange={(e) => setSamplesGiven(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="feedback" className="text-xs font-medium text-slate-700">Doctor Feedback Sentiment</Label>
                  <Select
                    value={feedback}
                    onValueChange={(val) => setFeedback(val as VisitLog["feedback"])}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="High Potential">High Potential (Committed to Prescribe)</SelectItem>
                      <SelectItem value="Positive">Positive (Interested in Trial)</SelectItem>
                      <SelectItem value="Neutral">Neutral (Standard Briefing)</SelectItem>
                      <SelectItem value="Needs Follow-up">Needs Follow-up (Stock Clarification)</SelectItem>
                    </SelectContent>
                  </Select>
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
                    Save Call Log
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Visits Logged</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Stethoscope className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {logs.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Physicians visited across territories
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">High Potential Calls</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {highPotentialCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Committed to active prescription
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Call Success Rate</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-800 bg-white border-slate-200 px-2 py-0.5 rounded-md">
              Target: 80%
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {Math.round((highPotentialCount / (logs.length || 1)) * 100)}%
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Positive conversion index
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Samples Handed Out</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            24 Units
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Sample reconciliation verified
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search doctor, chamber, or MIO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="Filter Sentiment" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Sentiments</SelectItem>
              <SelectItem value="high potential">High Potential</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="needs follow-up">Needs Follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Doctor Visit Logs Ledger */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Field Execution Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified doctor calls, promotional detailing, and physician feedback
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredLogs.length} Records
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Call Ref</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Doctor / Specialty</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Chamber Location</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Field MIO</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Time</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Promoted Drugs</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Samples</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Commitment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((item) => (
              <TableRow key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <TableCell className="py-3 text-xs font-mono font-semibold text-[#0090FF] pl-0">
                  {item.dcrCode}
                </TableCell>
                <TableCell className="py-3 text-xs font-semibold text-slate-900">
                  <div>
                    <span>{item.doctorName}</span>
                    <span className="block text-[11px] font-normal text-slate-500">{item.specialty}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-600 max-w-[200px] truncate">
                  {item.chamber}
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span>{item.mioName}</span>
                    <span className="text-[10px] text-slate-400">({item.territory})</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-600 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>{item.visitTime}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-700 max-w-[180px] truncate">
                  {item.promotedDrugs}
                </TableCell>
                <TableCell className="py-3 text-xs font-medium text-slate-600">
                  {item.samplesGiven}
                </TableCell>
                <TableCell className="py-3 text-xs text-right pr-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      item.feedback === "High Potential"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : item.feedback === "Positive"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : item.feedback === "Neutral"
                        ? "text-slate-700 bg-slate-50 border-slate-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                    }`}
                  >
                    {item.feedback}
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