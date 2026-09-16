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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "recharts";
import {
  MapPin,
  TrendingUp,
  Building2,
  Users,
  Store,
  ArrowUpRight,
  Filter,
} from "lucide-react";

// Zone Sales Volume (in Lakhs BDT)
const zoneBarData = [
  { zone: "Dhaka N", sales: 48.2, growth: "+14%" },
  { zone: "Dhaka S", sales: 42.6, growth: "+9%" },
  { zone: "Chittagong", sales: 34.5, growth: "+12%" },
  { zone: "Sylhet", sales: 21.0, growth: "-4%" },
  { zone: "Rajshahi", sales: 19.4, growth: "+6%" },
  { zone: "Khulna", sales: 17.8, growth: "+8%" },
  { zone: "Barisal", sales: 11.2, growth: "+2%" },
];

// Revenue share by division
const divisionShareData = [
  { name: "Dhaka Div.", value: 46.5, color: "#0090FF" },
  { name: "Chittagong", value: 24.2, color: "#38bdf8" },
  { name: "Sylhet", value: 11.5, color: "#818cf8" },
  { name: "North Bengal", value: 17.8, color: "#cbd5e1" },
];

// Granular Territory Ledger
const territoryLedger = [
  {
    territory: "Dhaka North",
    division: "Dhaka",
    activeMios: 4,
    pharmacies: 142,
    topProduct: "Napa Extra / Ciprocin",
    revenue: "৳48,20,000",
    orderCount: 1240,
    growth: "+14.2%",
    status: "Top Tier",
  },
  {
    territory: "Dhaka South",
    division: "Dhaka",
    activeMios: 4,
    pharmacies: 128,
    topProduct: "Maxpro 20mg",
    revenue: "৳42,60,000",
    orderCount: 1090,
    growth: "+9.1%",
    status: "Strong",
  },
  {
    territory: "Chittagong Central",
    division: "Chittagong",
    activeMios: 3,
    pharmacies: 96,
    topProduct: "Azithromycin 500",
    revenue: "৳34,50,000",
    orderCount: 840,
    growth: "+12.0%",
    status: "Strong",
  },
  {
    territory: "Sylhet Sadar",
    division: "Sylhet",
    activeMios: 2,
    pharmacies: 64,
    topProduct: "Cef-3 200mg",
    revenue: "৳21,00,000",
    orderCount: 520,
    growth: "-4.1%",
    status: "Lagging",
  },
  {
    territory: "Rajshahi Metro",
    division: "Rajshahi",
    activeMios: 2,
    pharmacies: 58,
    topProduct: "Sergel 20mg",
    revenue: "৳19,40,000",
    orderCount: 460,
    growth: "+6.4%",
    status: "Stable",
  },
  {
    territory: "Khulna Zone",
    division: "Khulna",
    activeMios: 2,
    pharmacies: 52,
    topProduct: "Monas 10mg",
    revenue: "৳17,80,000",
    orderCount: 410,
    growth: "+8.2%",
    status: "Stable",
  },
  {
    territory: "Barisal Sadar",
    division: "Barisal",
    activeMios: 1,
    pharmacies: 38,
    topProduct: "Ace Plus",
    revenue: "৳11,20,000",
    orderCount: 290,
    growth: "+2.0%",
    status: "Stable",
  },
];

export default function TerritorySalesBreakdownPage() {
  const [selectedDivision, setSelectedDivision] = React.useState("all");

  const filteredTerritories =
    selectedDivision === "all"
      ? territoryLedger
      : territoryLedger.filter((t) => t.division.toLowerCase() === selectedDivision.toLowerCase());

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header with Division Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Territory Sales Breakdown
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Regional distribution revenue, MIO territory density, and retail pharmacy penetration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedDivision} onValueChange={setSelectedDivision}>
            <SelectTrigger className="h-9 w-[170px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="All Divisions" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Divisions</SelectItem>
              <SelectItem value="dhaka">Dhaka Division</SelectItem>
              <SelectItem value="chittagong">Chittagong Division</SelectItem>
              <SelectItem value="sylhet">Sylhet Division</SelectItem>
              <SelectItem value="rajshahi">Rajshahi Division</SelectItem>
              <SelectItem value="khulna">Khulna Division</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Regional Sales */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Gross Regional Sales</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            ৳1,94,70,000
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <span>+8.4% YoY Growth</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-600" />
          </div>
        </Card>

        {/* Territory Count */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Operational Hubs</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-800 bg-white border-slate-200 px-2 py-0.5 rounded-md">
              7 Hubs
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            64 Zones
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Covering 8 administrative divisions
          </p>
        </Card>

        {/* Retail Outlets Penetration */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Subscribed Pharmacies</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            578 Stores
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Avg. 82 client accounts per zone
          </p>
        </Card>

        {/* MIO Workforce Density */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Field Force (MIOs)</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            18 Officers
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            ৳10.8L monthly turnover per MIO
          </p>
        </Card>
      </div>

      {/* 3. Middle Grid: Zone Bar Distribution & Share Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Zone Bar Chart */}
        <Card className="lg:col-span-8 rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Regional Sales Volume (in Lakh ৳)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Billed medicine dispatches across primary administrative territories
              </p>
            </div>
            <span className="text-xs font-semibold text-[#0090FF] bg-blue-50 px-2.5 py-1 rounded-md">
              Current Fiscal Quarter
            </span>
          </div>

          <div className="h-[260px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="zone" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717A" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717A" }} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                  formatter={(value) => [`৳${value} Lakh`, "Volume"]}
                />
                <Bar dataKey="sales" fill="#0090FF" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Division Market Share Pie */}
        <Card className="lg:col-span-4 rounded-xl border border-slate-200/90 shadow-none bg-white p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Territory Market Share</h2>
            <p className="text-xs text-slate-400 mt-0.5 mb-2">Revenue percentage by major cluster</p>

            <div className="h-[180px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={divisionShareData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {divisionShareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                    formatter={(val) => [`${val}%`, "Share"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {divisionShareData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 4. Detailed Territory Ledger Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Territory Operations Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Client count, top-moving medicine category, and growth trend by designated territory
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredTerritories.length} Territories
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Territory Hub</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">MIOs</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Client Pharmacies</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Leading Formulation</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Total Revenue</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Orders</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">YoY Trend</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTerritories.map((item, idx) => (
              <TableRow key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                <TableCell className="py-3 text-xs font-semibold text-slate-900 pl-0">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.territory}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{item.activeMios}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{item.pharmacies}</TableCell>
                <TableCell className="py-3 text-xs text-slate-700 font-medium">{item.topProduct}</TableCell>
                <TableCell className="py-3 text-xs font-bold text-slate-900 font-mono">{item.revenue}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600 font-mono">{item.orderCount}</TableCell>
                <TableCell className="py-3 text-xs">
                  <span
                    className={`font-semibold ${
                      item.growth.startsWith("+") ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {item.growth}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-xs text-right pr-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      item.status === "Top Tier"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : item.status === "Strong"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : item.status === "Stable"
                        ? "text-slate-700 bg-slate-50 border-slate-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
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