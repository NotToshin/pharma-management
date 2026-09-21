"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Target,
  Trophy,
  AlertCircle,
  CalendarDays,
  ArrowUpRight,
  Plus,
} from "lucide-react";

interface TerritoryItem {
  id: string;
  territory: string;
  mio: string;
  targetRaw: number;
  achievedRaw: number;
  target: string;
  achieved: string;
  rate: number;
  status: "Surpassed" | "On Track" | "Behind";
}

const initialTerritories: TerritoryItem[] = [
  { id: "1", territory: "Dhaka North", mio: "Rafiqul Islam", targetRaw: 1500000, achievedRaw: 1590000, target: "৳15,00,000", achieved: "৳15,90,000", rate: 106, status: "Surpassed" },
  { id: "2", territory: "Dhaka South", mio: "Tanvir Ahmed", targetRaw: 1800000, achievedRaw: 1710000, target: "৳18,00,000", achieved: "৳17,10,000", rate: 95, status: "On Track" },
  { id: "3", territory: "Chittagong Central", mio: "Kamrul Hasan", targetRaw: 1200000, achievedRaw: 1260000, target: "৳12,00,000", achieved: "৳12,60,000", rate: 105, status: "Surpassed" },
  { id: "4", territory: "Sylhet Sadar", mio: "Enamul Haque", targetRaw: 950000, achievedRaw: 760000, target: "৳9,50,000", achieved: "৳7,60,000", rate: 80, status: "Behind" },
  { id: "5", territory: "Rajshahi Metro", mio: "Sabbir Hossain", targetRaw: 1100000, achievedRaw: 1045000, target: "৳11,00,000", achieved: "৳10,45,000", rate: 95, status: "On Track" },
  { id: "6", territory: "Khulna Zone", mio: "Mahmudul Hasan", targetRaw: 850000, achievedRaw: 892500, target: "৳8,50,000", achieved: "৳8,92,500", rate: 105, status: "Surpassed" },
  { id: "7", territory: "Bogura Hub", mio: "Farhan Kabir", targetRaw: 700000, achievedRaw: 525000, target: "৳7,00,000", achieved: "৳5,25,000", rate: 75, status: "Behind" },
];

export default function TargetVsAchievementPage() {
  const [territories, setTerritories] = React.useState<TerritoryItem[]>(initialTerritories);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Form Fields
  const [newTerritory, setNewTerritory] = React.useState("");
  const [newMio, setNewMio] = React.useState("");
  const [newTarget, setNewTarget] = React.useState("");
  const [newAchieved, setNewAchieved] = React.useState("");

  const handleAddTerritory = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(newTarget) || 0;
    const achievedNum = parseFloat(newAchieved) || 0;
    const calcRate = targetNum > 0 ? Math.round((achievedNum / targetNum) * 100) : 0;

    let calcStatus: "Surpassed" | "On Track" | "Behind" = "Behind";
    if (calcRate >= 100) calcStatus = "Surpassed";
    else if (calcRate >= 90) calcStatus = "On Track";

    const item: TerritoryItem = {
      id: Date.now().toString(),
      territory: newTerritory,
      mio: newMio,
      targetRaw: targetNum,
      achievedRaw: achievedNum,
      target: `৳${targetNum.toLocaleString("en-IN")}`,
      achieved: `৳${achievedNum.toLocaleString("en-IN")}`,
      rate: calcRate,
      status: calcStatus,
    };

    setTerritories((prev) => [...prev, item]);
    setNewTerritory("");
    setNewMio("");
    setNewTarget("");
    setNewAchieved("");
    setIsDialogOpen(false);
  };

  // Aggregated totals computed dynamically
  const totalTarget = territories.reduce((acc, curr) => acc + curr.targetRaw, 0);
  const totalAchieved = territories.reduce((acc, curr) => acc + curr.achievedRaw, 0);
  const overallRate = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

  // Chart data formatted from territories in Lakhs
  const dynamicChartData = territories.map((item) => ({
    name: item.territory.split(" ")[0],
    Target: Number((item.targetRaw / 100000).toFixed(1)),
    Achieved: Number((item.achievedRaw / 100000).toFixed(1)),
  }));

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header with "Add Territory Target" Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Target vs. Achievement
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Territory quotas, assigned field force metrics, and actual sales deliveries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs font-semibold text-slate-800 bg-white border-slate-200 px-3 py-1.5 rounded-lg">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5 inline text-slate-600" />
            Fiscal Year 2026
          </Badge>

          {/* Add Target Modal */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3 rounded-lg shadow-none">
                <Plus className="h-4 w-4" />
                Add Target
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Add Territory Target</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Assign a new sales quota to a territory zone and designated MIO.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddTerritory} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="territory" className="text-xs font-medium text-slate-700">Territory Name</Label>
                  <Input
                    id="territory"
                    placeholder="e.g. Mymensingh Sadar"
                    value={newTerritory}
                    onChange={(e) => setNewTerritory(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mio" className="text-xs font-medium text-slate-700">Assigned MIO</Label>
                  <Input
                    id="mio"
                    placeholder="e.g. Arif Hossain"
                    value={newMio}
                    onChange={(e) => setNewMio(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="target" className="text-xs font-medium text-slate-700">Quota Target (৳)</Label>
                    <Input
                      id="target"
                      type="number"
                      placeholder="1000000"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="achieved" className="text-xs font-medium text-slate-700">Achieved So Far (৳)</Label>
                    <Input
                      id="achieved"
                      type="number"
                      placeholder="850000"
                      value={newAchieved}
                      onChange={(e) => setNewAchieved(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
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
                    Save Target
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Gross Quota Target</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none">
            ৳{totalTarget.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Across {territories.length} Active Zones
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Achieved</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-800 bg-white border-slate-200 px-2 py-0.5 rounded-md">
              <TrendingUp className="h-3 w-3 mr-1 inline text-slate-700" />
              {overallRate}%
            </Badge>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none">
            ৳{totalAchieved.toLocaleString("en-IN")}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <span>Aggregated Field Fulfillment</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-600" />
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Top Performing Hub</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[22px] font-bold tracking-tight text-slate-900 leading-none truncate">
            {territories.reduce((max, t) => (t.rate > max.rate ? t : max), territories[0])?.territory || "N/A"}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Surpassed assigned baseline
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Underperforming Zones</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none">
            {territories.filter((t) => t.status === "Behind").length} Zones
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-3">
            Tracking below 90% threshold
          </p>
        </Card>
      </div>

      {/* 3. Bar Chart based on current territories */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Territory Variance (in Lakh ৳)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Visual comparison between assigned quota and audited field deliveries
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-slate-300" />
              <span>Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#0090FF]" />
              <span>Achieved</span>
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dynamicChartData} barGap={6} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717A" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717A" }} />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
              />
              <Bar dataKey="Target" fill="#cbd5e1" radius={[3, 3, 0, 0]} barSize={14} />
              <Bar dataKey="Achieved" fill="#0090FF" radius={[3, 3, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 4. Territory Quota Breakdown Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
            Territory Performance Ledger
          </h3>
          <span className="text-xs text-slate-400">Showing {territories.length} Registered Zones</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Territory</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Assigned MIO</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Quota Target</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Actual Realized</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 w-[180px]">Achievement %</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {territories.map((row) => (
              <TableRow key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <TableCell className="py-3 text-xs font-semibold text-slate-900 pl-0">
                  {row.territory}
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{row.mio}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600 font-mono">{row.target}</TableCell>
                <TableCell className="py-3 text-xs font-semibold text-slate-900 font-mono">{row.achieved}</TableCell>
                <TableCell className="py-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Progress value={row.rate > 100 ? 100 : row.rate} className="h-1.5 flex-1 bg-slate-100 [&>div]:bg-[#0090FF]" />
                    <span className="text-[11px] font-bold text-slate-700 w-9 text-right">
                      {row.rate}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-xs text-right pr-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      row.status === "Surpassed"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : row.status === "On Track"
                        ? "text-slate-700 bg-slate-50 border-slate-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                    }`}
                  >
                    {row.status}
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