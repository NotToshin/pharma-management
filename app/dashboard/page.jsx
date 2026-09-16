"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
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
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  LineChart as LineChartIcon,
} from "lucide-react";

const chartData = [
  { month: "Jan", bar1: 52, bar2: 24 },
  { month: "Feb", bar1: 82, bar2: 54 },
  { month: "Mar", bar1: 67, bar2: 34 },
  { month: "Apr", bar1: 22, bar2: 52 },
  { month: "May", bar1: 57, bar2: 40 },
  { month: "Jun", bar1: 60, bar2: 46 },
];

const checkinFeed = [
  { name: "Toshin", role: "Managing Director" },
  { name: "Toshin", role: "Managing Director" },
  { name: "Toshin", role: "Managing Director" },
  { name: "Toshin", role: "Managing Director" },
  { name: "Toshin", role: "Managing Director" },
];

const fefoWatchlist = [
  { name: "MedX", batch: "Batch A", expiry: "12/01/27", qty: "300", wholesaler: "GNC Ltd.", status: "Safe" },
  { name: "MedX", batch: "Batch A", expiry: "12/01/27", qty: "300", wholesaler: "GNC Ltd.", status: "Safe" },
  { name: "MedX", batch: "Batch A", expiry: "12/01/27", qty: "300", wholesaler: "GNC Ltd.", status: "Safe" },
  { name: "MedX", batch: "Batch A", expiry: "12/01/27", qty: "300", wholesaler: "GNC Ltd.", status: "Safe" },
  { name: "MedX", batch: "Batch A", expiry: "12/01/27", qty: "300", wholesaler: "GNC Ltd.", status: "Safe" },
  { name: "MedX", batch: "Batch A", expiry: "12/01/27", qty: "300", wholesaler: "GNC Ltd.", status: "Safe" },
  { name: "MedX", batch: "Batch A", expiry: "12/01/27", qty: "300", wholesaler: "GNC Ltd.", status: "Safe" },
  { name: "MedX", batch: "Batch A", expiry: "12/01/27", qty: "300", wholesaler: "GNC Ltd.", status: "Safe" },
];

export default function DashboardPage() {
  const [date, setDate] = React.useState(new Date(2025, 5, 25));

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto">
      {/* 1. Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Today's Revenue</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-800 bg-white border-slate-200 px-2 py-0.5 rounded-md">
              <TrendingUp className="h-3 w-3 mr-1 inline text-slate-700" />
              +12.5%
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            $1,250.00
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <span>Trending up this month</span>
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Visitors for the last 6 months
          </p>
        </Card>

        {/* Active MIOs */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active MIOs</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-800 bg-white border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full border border-emerald-500 bg-emerald-500/20" />
              Online
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            14/18
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <span>Down 20% this period</span>
            <TrendingDown className="h-3.5 w-3.5" />
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Acquisition needs attention
          </p>
        </Card>

        {/* Pending Deliveries */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Deliveries</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-800 bg-white border-slate-200 px-2 py-0.5 rounded-md">
              8 Orders Out
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            10
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <span>Strong user retention</span>
            <Activity className="h-3.5 w-3.5" />
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Engagement exceed targets
          </p>
        </Card>

        {/* Cash in Bank */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cash in Bank</span>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            ৳80,00,000
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-800">
            <span>Steady performance increase</span>
            <LineChartIcon className="h-3.5 w-3.5" />
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Meets growth projections
          </p>
        </Card>
      </div>

      {/* 2. Middle Grid: Chart + Live Feed + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Target vs Achievement */}
        <Card className="lg:col-span-4 rounded-xl border border-slate-200/90 shadow-none bg-white p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Target vs. Achievement</h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">January - June 2024</p>
            <div className="h-[170px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#71717A" }}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                  />
                  <Bar dataKey="bar1" fill="#0090FF" radius={[3, 3, 0, 0]} barSize={9} />
                  <Bar dataKey="bar2" fill="#0090FF" radius={[3, 3, 0, 0]} barSize={9} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
              <span>Trending up by 5.2% this month</span>
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Showing total visitors for the last 6 months
            </p>
          </div>
        </Card>

        {/* Live MIO Check-in Feed */}
        <Card className="lg:col-span-5 rounded-xl border border-slate-200/90 shadow-none bg-white p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Live MIO Check-in Feed</h3>
            <div className="divide-y divide-slate-100">
              {checkinFeed.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/avatar.png" alt={item.name} />
                    <AvatarFallback className="rounded-lg bg-purple-600 text-white text-xs font-semibold">
                      TO
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 leading-none">
                    <p className="text-xs font-bold text-slate-900">{item.name}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{item.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Calendar Card */}
        <Card className="lg:col-span-3 rounded-xl border border-slate-200/90 shadow-none bg-white p-3 flex items-center justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            defaultMonth={new Date(2025, 5)}
            className="p-0"
          />
        </Card>
      </div>

      {/* 3. Bottom Table: FEFO INVENTORY WATCHLIST */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase mb-4">
          FEFO INVENTORY WATCHLIST
        </h3>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Medicine Name</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Batch #</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Expiry Date</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Stock Qty.</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Wholesaler</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 pr-0">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fefoWatchlist.map((item, idx) => (
              <TableRow key={idx} className="border-b border-slate-50 hover:bg-transparent">
                <TableCell className="py-3 text-xs font-medium text-slate-900 pl-0">{item.name}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{item.batch}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{item.expiry}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{item.qty}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{item.wholesaler}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600 pr-0">{item.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}