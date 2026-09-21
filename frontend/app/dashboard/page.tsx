"use client";

import * as React from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Banknote,
  Boxes,
  Stethoscope,
  Truck,
  Users,
  ShieldCheck,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarDays,
  Plus,
  ArrowRight,
  Flame,
  Store,
  Layers,
  Sparkles,
  Lock,
  Building2,
  Receipt,
  Activity,
  Snowflake,
  Zap,
  ChevronRight,
  Radar,
  Radio,
  FileCheck,
} from "lucide-react";

// Cash Flow & Monthly Run-Rate Trend (in Lakhs BDT)
const monthlyRunRateData = [
  { month: "May", Revenue: 158.0, Collections: 145.0, Burn: 41.2 },
  { month: "Jun", Revenue: 165.4, Collections: 159.8, Burn: 44.0 },
  { month: "Jul", Revenue: 178.2, Collections: 164.5, Burn: 46.5 },
  { month: "Aug", Revenue: 189.6, Collections: 178.0, Burn: 49.0 },
  { month: "Sep", Revenue: 194.7, Collections: 182.4, Burn: 51.2 },
];

// Product Category Contribution %
const categorySalesShare = [
  { category: "Cardiology", share: 32, value: "৳62.3L" },
  { category: "Antibiotics", share: 28, value: "৳54.5L" },
  { category: "Gastroenterology", share: 22, value: "৳42.8L" },
  { category: "Analgesic", share: 12, value: "৳23.3L" },
  { category: "Nutrition & Care", share: 6, value: "৳11.8L" },
];

export default function MasterExecutiveDashboardPage() {
  const [activeDate] = React.useState("Thursday, September 17, 2026");

  const handleExportExecutiveSummary = () => {
    const summaryData = [
      { Metric: "Gross Billed Turnover", Value: "৳1,94,70,000", Pacing: "+11.8% MoM" },
      { Metric: "Realized Cash Collections", Value: "৳1,82,40,000", Pacing: "93.6% Recovery Rate" },
      { Metric: "Active Inventory Valuation", Value: "৳5,24,940", Pacing: "6 Warehouse Bays" },
      { Metric: "Critical Expiry Value at Risk", Value: "৳2,48,725", Pacing: "23 Days Avg to Expiry" },
      { Metric: "Liquid Bank Balances", Value: "৳2,03,90,000", Pacing: "5 Reconciled Accounts" },
      { Metric: "Active Enrolled Staff", Value: "7 Personnel", Pacing: "100% Verified Credentials" },
      { Metric: "Field Call Compliance", Value: "96.2%", Pacing: "Target > 90%" },
    ];

    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AK Pharma Executive Summary");
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Executive_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="space-y-6 max-w-[1380px] mx-auto pb-16">
      {/* 1. HERO BANNER: Dark Gradient Glassmorphism with Live Telemetry */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#0090FF]/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 gap-1.5 px-2.5 py-0.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                LIVE SYSTEM TELEMETRY
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                {activeDate} • Dhaka HQ Gateway
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AK PHARMA <span className="text-[#0090FF]">Command Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time synchronization across FEFO Warehouse, Territorial Detailing, Commercial Accounts, and Workforce Operations.
            </p>
          </div>

          {/* Quick Telemetry Indicators */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Snowflake className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cold Chain</span>
                <span className="text-xs font-mono font-bold text-emerald-400">4.2°C Normal</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">DGDA / GMP</span>
                <span className="text-xs font-mono font-bold text-emerald-400">Audit Compliant</span>
              </div>
            </div>

            <Button
              onClick={handleExportExecutiveSummary}
              className="h-10 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 gap-2 px-4 rounded-xl shadow-none transition-all"
            >
              <Download className="h-3.5 w-3.5 text-[#0090FF]" />
              Export Brief
            </Button>
          </div>
        </div>

        {/* Action Command Ribbon */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <Link
            href="/logistics/orders"
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-200"
          >
            <Plus className="h-3.5 w-3.5 text-[#0090FF]" />
            <span>Book Sales Order</span>
          </Link>
          <Link
            href="/doctors/new"
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-200"
          >
            <Stethoscope className="h-3.5 w-3.5 text-emerald-400" />
            <span>Enroll Doctor</span>
          </Link>
          <Link
            href="/finance/payments"
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-200"
          >
            <Receipt className="h-3.5 w-3.5 text-purple-400" />
            <span>Issue Payment</span>
          </Link>
          <Link
            href="/hr/salary"
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-200"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Process Payroll</span>
          </Link>
        </div>
      </div>

      {/* 2. Top-Level Operational KPI Cards with Gradient Tint Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Gross Revenue Pacing */}
        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5 hover:shadow-md hover:border-blue-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-slate-500">Gross Turnover</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#0090FF]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-slate-900 leading-none font-mono">
            ৳1,94,70,000
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="h-3.5 w-3.5" /> +11.8% MoM
            </span>
            <span className="text-slate-400 text-[11px] font-medium">Pacing: 96.4%</span>
          </div>
        </Card>

        {/* Realized Cash Collections */}
        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5 hover:shadow-md hover:border-emerald-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-slate-500">Realized Cash</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-slate-900 leading-none font-mono">
            ৳1,82,40,000
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-700 font-semibold">93.6% Recovery Efficiency</span>
            <Link href="/finance/collections" className="text-[#0090FF] text-[11px] font-bold hover:underline">
              Ledger &gt;
            </Link>
          </div>
        </Card>

        {/* FEFO Stock Value & Expiry Alert */}
        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5 hover:shadow-md hover:border-rose-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-slate-500">Expiry Exposure</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-rose-600 leading-none font-mono">
            ৳2,48,725
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-rose-700 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-md">
              2 Critical Batches (&lt;30d)
            </span>
            <Link href="/inventory/expiry" className="text-[#0090FF] text-[11px] font-bold hover:underline">
              Quarantine &gt;
            </Link>
          </div>
        </Card>

        {/* Corporate Liquid Liquidity */}
        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5 hover:shadow-md hover:border-purple-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-slate-500">Liquid Vault & Banks</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-slate-900 leading-none font-mono">
            ৳2,03,90,000
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500 text-[11px] font-medium">5 Reconciled Accounts</span>
            <Link href="/finance/bank-ledger" className="text-[#0090FF] text-[11px] font-bold hover:underline">
              Balances &gt;
            </Link>
          </div>
        </Card>
      </div>

      {/* 3. Core Operational Charting Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Six-Month Commercial Inflow vs Outflow */}
        <Card className="lg:col-span-8 rounded-2xl border border-slate-200/90 shadow-sm bg-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Commercial Cash Flow Run-Rate</h2>
                <Badge className="bg-blue-50 text-[#0090FF] border-blue-200 text-[10px] font-bold">
                  In Lakh ৳
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Gross billed revenue versus realized collections against operational burn rate
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0090FF]" />
                <span>Billed Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Realized Cash</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span>Burn</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRunRateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0090FF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0090FF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717A" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717A" }} />
                <Tooltip
                  cursor={{ stroke: "#e2e8f0" }}
                  contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "11px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  formatter={(val) => [`৳${val} Lakh`, ""]}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#0090FF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBilled)" />
                <Area type="monotone" dataKey="Collections" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCash)" />
                <Area type="monotone" dataKey="Burn" stroke="#cbd5e1" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Therapeutic Segment Share Breakdown */}
        <Card className="lg:col-span-4 rounded-2xl border border-slate-200/90 shadow-sm bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Therapeutic Share</h3>
                <p className="text-[11px] text-slate-400">Prescription yield distribution</p>
              </div>
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-[#0090FF] border-blue-200 font-bold">
                Q3 Pareto
              </Badge>
            </div>

            <div className="mt-4 space-y-3.5">
              {categorySalesShare.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-semibold">{cat.category}</span>
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="text-slate-400">{cat.value}</span>
                      <span className="font-bold text-slate-900">({cat.share}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.share > 25
                          ? "bg-[#0090FF]"
                          : cat.share > 15
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                      }`}
                      style={{ width: `${cat.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/60 to-slate-50 border border-blue-100 text-xs mt-4">
            <span className="text-slate-500 block text-[11px] font-medium">Core Brand Anchor:</span>
            <span className="font-bold text-slate-900 block mt-0.5">Cardiology & Antibiotic Therapeutics</span>
            <span className="text-[10px] text-emerald-600 font-bold">60.0% Aggregate Gross Margin Contribution</span>
          </div>
        </Card>
      </div>

      {/* 4. Real-Time Operational Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Module: Critical FEFO Expiry Surveillance */}
        <Card className="rounded-2xl border border-slate-200/90 shadow-sm bg-white p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  FEFO Batch Expiry Surveillance
                </h3>
                <p className="text-[11px] text-slate-400">Batches approaching shelf-life thresholds</p>
              </div>
            </div>
            <Link href="/inventory/expiry">
              <Button size="sm" variant="ghost" className="h-7 text-xs text-[#0090FF] gap-1 px-2 font-semibold">
                Quarantine Hub <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-3.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Ciprocin 500mg</span>
                <span className="text-[10px] font-mono text-slate-400">BX-2025-412 • Bay 01 - Shelf A</span>
              </div>
              <div className="text-center">
                <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                  23 Days Left
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Exp: 10 Oct 2026</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 block">৳26,825</span>
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">Priority Dispatch</span>
              </div>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Cef-3 200mg/5ml Susp</span>
                <span className="text-[10px] font-mono text-slate-400">BX-2026-039 • Cold Room A</span>
              </div>
              <div className="text-center">
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                  54 Days Left
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Exp: 10 Nov 2026</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 block">৳1,81,300</span>
                <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">Discount Clear</span>
              </div>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Clavroc 625mg Tab</span>
                <span className="text-[10px] font-mono text-slate-400">BX-2025-119 • Quarantine Bay Q-01</span>
              </div>
              <div className="text-center">
                <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                  Locked
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Exp: 28 Sep 2026</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 block">৳18,900</span>
                <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">Destruction Protocol</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Module: Active Road Logistics & Orders Dispatch */}
        <Card className="rounded-2xl border border-slate-200/90 shadow-sm bg-white p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Logistics Dispatch & Challan Stream
                </h3>
                <p className="text-[11px] text-slate-400">Real-time consignments and route fulfillment</p>
              </div>
            </div>
            <Link href="/logistics/orders">
              <Button size="sm" variant="ghost" className="h-7 text-xs text-[#0090FF] gap-1 px-2 font-semibold">
                Dispatch Hub <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-3.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Popular Pharmacy (Dhanmondi)</span>
                <span className="text-[10px] font-mono text-[#0090FF]">SO-2026-4401 • DC-2026-1082</span>
              </div>
              <div>
                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-bold">
                  Out for Delivery
                </Badge>
                <span className="text-[10px] text-slate-400 block text-center mt-0.5">35 Cartons</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 block">৳84,500</span>
                <span className="text-[10px] text-slate-500 font-medium">Company Van</span>
              </div>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Labaid Specialized Chemist</span>
                <span className="text-[10px] font-mono text-purple-700">SO-2026-4402 • Cold Chain</span>
              </div>
              <div>
                <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 font-bold">
                  FEFO Allocated
                </Badge>
                <span className="text-[10px] text-slate-400 block text-center mt-0.5">22 Cartons</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 block">৳1,42,000</span>
                <span className="text-[10px] text-[#0090FF] font-semibold">Cold Box (2-8°C)</span>
              </div>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Chevron Clinical Lab & Chemist</span>
                <span className="text-[10px] font-mono text-emerald-700">SO-2026-4403 • INV-2026-9017</span>
              </div>
              <div>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                  Delivered & Invoiced
                </Badge>
                <span className="text-[10px] text-slate-400 block text-center mt-0.5">48 Cartons</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 block">৳98,000</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Billed to A/R</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 5. Bottom Multi-Deck: Liquid Banks & Key Opinion Leader Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Liquid Bank Accounts Overview */}
        <Card className="lg:col-span-6 rounded-2xl border border-slate-200/90 shadow-sm bg-white p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Bank Balances & Vault Liquidity
                </h3>
                <p className="text-[11px] text-slate-400">Real-time ledger reconciled with statements</p>
              </div>
            </div>
            <Link href="/finance/bank-ledger">
              <Button size="sm" variant="ghost" className="h-7 text-xs text-[#0090FF] gap-1 px-2 font-semibold">
                All Accounts <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="space-y-2.5 pt-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Eastern Bank PLC</span>
                <span className="text-[10px] text-slate-400 font-mono">104-102-994821 • Gulshan Corporate</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-extrabold text-slate-900 text-sm block">৳84,50,000</span>
                <span className="text-[10px] text-emerald-600 font-bold">Corporate Ops</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Islami Bank Bangladesh PLC</span>
                <span className="text-[10px] text-slate-400 font-mono">205-019-338104 • Motijheel Branch</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-extrabold text-slate-900 text-sm block">৳52,10,000</span>
                <span className="text-[10px] text-emerald-600 font-bold">Wholesale Clearing</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Standard Chartered Bank</span>
                <span className="text-[10px] text-slate-400 font-mono">01-8849201-01 • Dhanmondi Branch</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-extrabold text-slate-900 text-sm block">৳39,40,000</span>
                <span className="text-[10px] text-blue-600 font-bold">LC / Sourcing Escrow</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-sm">Central Vault Petty Cash</span>
                <span className="text-[10px] text-slate-400 font-mono">CASH-VAULT-01 • Dhaka HQ</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-extrabold text-slate-900 text-sm block">৳6,40,000</span>
                <span className="text-[10px] text-slate-600 font-medium">Outstation Travel</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Clinical Engagement & Top Prescribers */}
        <Card className="lg:col-span-6 rounded-2xl border border-slate-200/90 shadow-sm bg-white p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Key Opinion Leaders (Tier A+ Physicians)
                </h3>
                <p className="text-[11px] text-slate-400">High-yield prescribers with bi-weekly visit cycles</p>
              </div>
            </div>
            <Link href="/doctors/ranking">
              <Button size="sm" variant="ghost" className="h-7 text-xs text-[#0090FF] gap-1 px-2 font-semibold">
                Rankings <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-sm">Dr. Anwarul Azim</span>
                  <Badge className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 font-extrabold">
                    Tier A+
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Cardiology • NICVD & Popular Dhanmondi
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 block">৳2,40,000/mo</span>
                <span className="text-[10px] text-emerald-600 font-bold">94% Adherence</span>
              </div>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-sm">Dr. Farhana Yasmin</span>
                  <Badge className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 font-extrabold">
                    Tier A+
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Gynecology • DMCH & Labaid Uttara
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 block">৳1,95,000/mo</span>
                <span className="text-[10px] text-emerald-600 font-bold">91% Adherence</span>
              </div>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-sm">Dr. S. K. Roy</span>
                  <Badge className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                    Tier A
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Internal Medicine • SSMC & Medinova Mirpur
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 block">৳1,60,000/mo</span>
                <span className="text-[10px] text-emerald-600 font-bold">86% Adherence</span>
              </div>
            </div>

            <div className="py-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-sm">Dr. Mehedi Hasan</span>
                  <Badge className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                    Tier A
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Pediatrics • CMC & Chevron Chittagong
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 block">৳1,25,000/mo</span>
                <span className="text-[10px] text-emerald-600 font-bold">82% Adherence</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 6. Institutional Footer Banner */}
      <div className="p-4 rounded-xl border border-slate-200/80 bg-white flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0090FF]" />
          <span>
            Enterprise Security Policy: <strong>21 CFR Part 11 & DGDA Statutory Logging Active</strong>
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-medium">
          <Link href="/settings/rbac" className="hover:text-[#0090FF] transition-colors">
            RBAC Policies
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/settings/audit-logs" className="hover:text-[#0090FF] transition-colors">
            Audit Ledger
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/hr/staff-directory" className="hover:text-[#0090FF] transition-colors">
            Staff Directory
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/hr/salary" className="hover:text-[#0090FF] transition-colors">
            Payroll Engine
          </Link>
        </div>
      </div>
    </div>
  );
}