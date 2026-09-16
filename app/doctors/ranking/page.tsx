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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
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
} from "lucide-react";

interface RankedDoctor {
  id: string;
  rank: number;
  name: string;
  specialty: string;
  institute: string;
  territory: string;
  assignedMio: string;
  tier: "A+" | "A" | "B" | "C";
  patientVolume: number;
  adherenceScore: number;
  estMonthlyRx: string;
  visitCycle: string;
}

const initialRankedDoctors: RankedDoctor[] = [
  {
    id: "1",
    rank: 1,
    name: "Dr. Anwarul Azim",
    specialty: "Cardiology",
    institute: "NICVD & Popular Dhanmondi",
    territory: "Dhaka North",
    assignedMio: "Rafiqul Islam",
    tier: "A+",
    patientVolume: 45,
    adherenceScore: 94,
    estMonthlyRx: "৳2,40,000",
    visitCycle: "Bi-Weekly",
  },
  {
    id: "2",
    rank: 2,
    name: "Dr. Farhana Yasmin",
    specialty: "Gynecology & Obstetrics",
    institute: "DMCH & Labaid Uttara",
    territory: "Dhaka North",
    assignedMio: "Rafiqul Islam",
    tier: "A+",
    patientVolume: 40,
    adherenceScore: 91,
    estMonthlyRx: "৳1,95,000",
    visitCycle: "Bi-Weekly",
  },
  {
    id: "3",
    rank: 3,
    name: "Dr. S. K. Roy",
    specialty: "Internal Medicine",
    institute: "SSMC & Medinova Mirpur",
    territory: "Dhaka South",
    assignedMio: "Tanvir Ahmed",
    tier: "A",
    patientVolume: 35,
    adherenceScore: 86,
    estMonthlyRx: "৳1,60,000",
    visitCycle: "Monthly",
  },
  {
    id: "4",
    rank: 4,
    name: "Dr. Mehedi Hasan",
    specialty: "Pediatrics",
    institute: "CMC & Chevron Chittagong",
    territory: "Chittagong Central",
    assignedMio: "Kamrul Hasan",
    tier: "A",
    patientVolume: 30,
    adherenceScore: 82,
    estMonthlyRx: "৳1,25,000",
    visitCycle: "Monthly",
  },
  {
    id: "5",
    rank: 5,
    name: "Dr. Mustafizur Rahman",
    specialty: "Orthopedic Surgery",
    institute: "SOMC & Ibn Sina Sylhet",
    territory: "Sylhet Sadar",
    assignedMio: "Enamul Haque",
    tier: "B",
    patientVolume: 25,
    adherenceScore: 74,
    estMonthlyRx: "৳90,000",
    visitCycle: "Monthly",
  },
  {
    id: "6",
    rank: 6,
    name: "Dr. Nadia Islam",
    specialty: "General Physician",
    institute: "RMCH & Apollo Rajshahi",
    territory: "Rajshahi Metro",
    assignedMio: "Sabbir Hossain",
    tier: "B",
    patientVolume: 20,
    adherenceScore: 68,
    estMonthlyRx: "৳75,000",
    visitCycle: "Bi-Monthly",
  },
  {
    id: "7",
    rank: 7,
    name: "Dr. Tareq Mahmud",
    specialty: "Dermatology",
    institute: "KMC & Care Point Khulna",
    territory: "Khulna Zone",
    assignedMio: "Mahmudul Hasan",
    tier: "C",
    patientVolume: 18,
    adherenceScore: 58,
    estMonthlyRx: "৳50,000",
    visitCycle: "Quarterly",
  },
];

const tierVolumeChart = [
  { tier: "Cat A+", doctors: 2, share: 46 },
  { tier: "Cat A", doctors: 2, share: 30 },
  { tier: "Cat B", doctors: 2, share: 16 },
  { tier: "Cat C", doctors: 1, share: 8 },
];

export default function CategoryRankingPage() {
  const [doctors, setDoctors] = React.useState<RankedDoctor[]>(initialRankedDoctors);
  const [tierFilter, setTierFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleUpdateTier = (id: string, newTier: RankedDoctor["tier"]) => {
    setDoctors((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, tier: newTier } : doc))
    );
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.territory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.assignedMio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTier = tierFilter === "all" || doc.tier === tierFilter;

    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Prescription Potential — Category Ranking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stratification framework classifying prescribers by patient footfall, brand loyalty, and revenue yield.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold text-slate-800 bg-white border-slate-200 px-3 py-1.5 rounded-lg">
            <Award className="h-3.5 w-3.5 mr-1.5 inline text-amber-500" />
            4 Active Tier Brackets
          </Badge>
        </div>
      </div>

      {/* 2. Four Tier Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Category A+ */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              Tier A+ • Key Opinion Leaders
            </span>
            <Sparkles className="h-4 w-4 text-[#0090FF]" />
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none">
            {doctors.filter((d) => d.tier === "A+").length} Doctors
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            &gt;40 Patients/day • 46% Revenue Share
          </p>
          <div className="mt-3 text-[11px] text-slate-600 font-medium">
            Mandatory: 2 Visits / Month
          </div>
        </Card>

        {/* Category A */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Tier A • High Yield Prescribers
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none">
            {doctors.filter((d) => d.tier === "A").length} Doctors
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            25 - 40 Patients/day • 30% Revenue Share
          </p>
          <div className="mt-3 text-[11px] text-slate-600 font-medium">
            Mandatory: 1 Visit / Month
          </div>
        </Card>

        {/* Category B */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              Tier B • Moderate Prescribers
            </span>
            <Users className="h-4 w-4 text-slate-500" />
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none">
            {doctors.filter((d) => d.tier === "B").length} Doctors
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            15 - 25 Patients/day • 16% Revenue Share
          </p>
          <div className="mt-3 text-[11px] text-slate-600 font-medium">
            Mandatory: 1 Visit / 45 Days
          </div>
        </Card>

        {/* Category C */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Tier C • Standard Maintenance
            </span>
            <Layers className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none">
            {doctors.filter((d) => d.tier === "C").length} Doctors
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            &lt;15 Patients/day • 8% Revenue Share
          </p>
          <div className="mt-3 text-[11px] text-slate-600 font-medium">
            Quarterly Promotional Touch
          </div>
        </Card>
      </div>

      {/* 3. Mid Section: Revenue Impact Bar Chart */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Revenue Contribution by Tier Breakdown (%)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Prescription share distribution across institutional categories
            </p>
          </div>
          <span className="text-xs font-semibold text-[#0090FF] bg-blue-50 px-2.5 py-1 rounded-md">
            Pareto Ratio: 80/20 Optimal
          </span>
        </div>

        <div className="h-[220px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tierVolumeChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="tier" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717A" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717A" }} />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                formatter={(val) => [`${val}%`, "Contribution Share"]}
              />
              <Bar dataKey="share" fill="#0090FF" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 4. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search physician, specialty, or territory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
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
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Physician Stratification Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked descending by patient footfall and brand adoption score
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredDoctors.length} Practitioners
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0 w-[50px]">Rank</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Doctor & Attached Clinic</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Specialty / Hub</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-center">Daily Patients</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 w-[180px]">Brand Adherence</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Est. Monthly Rx</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Cycle Routine</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Assigned Tier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDoctors.map((doc, idx) => (
              <TableRow key={doc.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                {/* Numerical Rank Badge */}
                <TableCell className="py-3 pl-0 text-xs font-mono font-bold text-slate-500">
                  #{idx + 1}
                </TableCell>

                {/* Doctor Name & Chamber */}
                <TableCell className="py-3 text-xs font-semibold text-slate-900">
                  <div>
                    <span className="block">{doc.name}</span>
                    <span className="text-[10px] font-normal text-slate-400 block max-w-[210px] truncate">
                      {doc.institute}
                    </span>
                  </div>
                </TableCell>

                {/* Specialty & Territory */}
                <TableCell className="py-3 text-xs text-slate-700">
                  <div>
                    <span className="font-medium text-slate-900 block">{doc.specialty}</span>
                    <span className="text-[10px] text-slate-400">{doc.territory}</span>
                  </div>
                </TableCell>

                {/* Daily Patients */}
                <TableCell className="py-3 text-xs text-center font-bold text-slate-900 font-mono">
                  {doc.patientVolume}
                </TableCell>

                {/* Brand Adherence Progress */}
                <TableCell className="py-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Progress value={doc.adherenceScore} className="h-1.5 flex-1 bg-slate-100 [&>div]:bg-[#0090FF]" />
                    <span className="text-[11px] font-bold text-slate-700 w-8 text-right font-mono">
                      {doc.adherenceScore}%
                    </span>
                  </div>
                </TableCell>

                {/* Estimated Monthly Revenue */}
                <TableCell className="py-3 text-xs font-semibold text-slate-900 font-mono">
                  {doc.estMonthlyRx}
                </TableCell>

                {/* Scheduled Cycle */}
                <TableCell className="py-3 text-xs text-slate-600">
                  <span className="text-[11px] font-medium text-slate-700">{doc.visitCycle}</span>
                </TableCell>

                {/* Change Tier Selector */}
                <TableCell className="py-3 text-xs text-right pr-0">
                  <Select
                    value={doc.tier}
                    onValueChange={(val) => handleUpdateTier(doc.id, val as RankedDoctor["tier"])}
                  >
                    <SelectTrigger className="h-7 w-[95px] text-[11px] font-bold bg-white ml-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="A+" className="text-blue-600 font-bold">Category A+</SelectItem>
                      <SelectItem value="A" className="text-emerald-600 font-bold">Category A</SelectItem>
                      <SelectItem value="B" className="text-slate-700 font-bold">Category B</SelectItem>
                      <SelectItem value="C" className="text-amber-600 font-bold">Category C</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}