"use client";

import * as React from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  ShieldCheck,
  Download,
  ArrowUpRight,
  Flame,
  CheckCircle2,
  Plus,
  ArrowRight,
  Building2,
  Receipt,
  Snowflake,
  Zap,
  RefreshCw,
} from "lucide-react";

export default function MasterExecutiveDashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [activeDate, setActiveDate] = React.useState("");

  const [dashboardData, setDashboardData] = React.useState<{
    kpis: {
      grossTurnover: number;
      realizedCash: number;
      recoveryRate: string;
      expiryExposureValue: number;
      criticalBatchCount: number;
      liquidBalance: number;
      totalStockValuation: number;
      reconciledAccountsCount: number;
      staffCount: number;
    };
    monthlyRunRate: Array<{ month: string; Revenue: number; Collections: number; Burn: number }>;
    categorySalesShare: Array<{ category: string; share: number; value: string }>;
    criticalSurveillance: Array<any>;
    logisticsStream: Array<any>;
    accountsList: Array<any>;
    keyOpinionLeaders: Array<any>;
  }>({
    kpis: {
      grossTurnover: 0,
      realizedCash: 0,
      recoveryRate: "0.0",
      expiryExposureValue: 0,
      criticalBatchCount: 0,
      liquidBalance: 0,
      totalStockValuation: 0,
      reconciledAccountsCount: 0,
      staffCount: 0,
    },
    monthlyRunRate: [],
    categorySalesShare: [],
    criticalSurveillance: [],
    logisticsStream: [],
    accountsList: [],
    keyOpinionLeaders: [],
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://pharma-management-b7fk.onrender.com/api";

  const fetchDashboardTelemetry = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/dashboard/telemetry`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error("Telemetry fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  React.useEffect(() => {
    setActiveDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    );
    fetchDashboardTelemetry();
  }, [fetchDashboardTelemetry]);

  const handleExportExecutiveSummary = () => {
    const summaryData = [
      { Metric: "Gross Billed Turnover", Value: `৳${dashboardData.kpis.grossTurnover.toLocaleString("en-IN")}` },
      { Metric: "Realized Cash Collections", Value: `৳${dashboardData.kpis.realizedCash.toLocaleString("en-IN")}` },
      { Metric: "Collection Recovery Efficiency", Value: `${dashboardData.kpis.recoveryRate}%` },
      { Metric: "Critical Expiry Value at Risk", Value: `৳${dashboardData.kpis.expiryExposureValue.toLocaleString("en-IN")}` },
      { Metric: "Liquid Bank & Safe Liquidity", Value: `৳${dashboardData.kpis.liquidBalance.toLocaleString("en-IN")}` },
      { Metric: "Total Warehouse Stock Valuation", Value: `৳${dashboardData.kpis.totalStockValuation.toLocaleString("en-IN")}` },
      { Metric: "Reconciled Treasury Accounts", Value: `${dashboardData.kpis.reconciledAccountsCount} Accounts` },
      { Metric: "Active Personnel Roster", Value: `${dashboardData.kpis.staffCount} Enrolled Staff` },
    ];

    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AK Pharma Executive Summary");
    XLSX.writeFile(workbook, `AK_Pharma_Executive_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-[1380px] mx-auto pb-16 font-sans text-slate-900">
      {/* 1. HERO BANNER: Live Telemetry */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
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

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={fetchDashboardTelemetry}
              className="h-10 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 gap-2 px-3 rounded-xl shadow-none transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-blue-400 ${loading ? "animate-spin" : ""}`} />
              Sync
            </Button>

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
              className="h-10 text-xs font-semibold bg-[#0090FF] hover:bg-[#0080e5] text-white border-0 gap-2 px-4 rounded-xl shadow-none transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Export Brief
            </Button>
          </div>
        </div>

        {/* Action Command Ribbon */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <Link
            href="/orders"
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-200"
          >
            <Plus className="h-3.5 w-3.5 text-[#0090FF]" />
            <span>Book Sales Order</span>
          </Link>
          <Link
            href="/doctors"
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-200"
          >
            <Stethoscope className="h-3.5 w-3.5 text-emerald-400" />
            <span>Doctor Registry</span>
          </Link>
          <Link
            href="/finance/payments"
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-200"
          >
            <Receipt className="h-3.5 w-3.5 text-purple-400" />
            <span>Issue Payment</span>
          </Link>
          <Link
            href="/salary"
            className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-200"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Process Payroll</span>
          </Link>
        </div>
      </div>

      {/* 2. Top-Level Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-200 shadow-sm bg-white p-5 hover:shadow-md hover:border-blue-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-slate-500">Gross Turnover</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#0090FF]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-slate-900 leading-none font-mono">
            ৳{dashboardData.kpis.grossTurnover.toLocaleString("en-IN")}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="h-3.5 w-3.5" /> Live Invoices
            </span>
            <span className="text-slate-400 text-[11px] font-medium">Pipeline Total</span>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200 shadow-sm bg-white p-5 hover:shadow-md hover:border-emerald-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-slate-500">Realized Cash</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-slate-900 leading-none font-mono">
            ৳{dashboardData.kpis.realizedCash.toLocaleString("en-IN")}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-700 font-semibold">{dashboardData.kpis.recoveryRate}% Recovery Rate</span>
            <Link href="/finance/overview" className="text-[#0090FF] text-[11px] font-bold hover:underline">
              Ledger &gt;
            </Link>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200 shadow-sm bg-white p-5 hover:shadow-md hover:border-rose-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-slate-500">Expiry Exposure</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-rose-600 leading-none font-mono">
            ৳{dashboardData.kpis.expiryExposureValue.toLocaleString("en-IN")}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-rose-700 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-md">
              {dashboardData.kpis.criticalBatchCount} Critical Batches (&le;90d)
            </span>
            <Link href="/inventory/ledger" className="text-[#0090FF] text-[11px] font-bold hover:underline">
              Stock &gt;
            </Link>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200 shadow-sm bg-white p-5 hover:shadow-md hover:border-purple-300 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide uppercase text-slate-500">Liquid Vault & Banks</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-slate-900 leading-none font-mono">
            ৳{dashboardData.kpis.liquidBalance.toLocaleString("en-IN")}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500 text-[11px] font-medium">
              {dashboardData.kpis.reconciledAccountsCount} Reconciled Accounts
            </span>
            <Link href="/finance/bank-ledger" className="text-[#0090FF] text-[11px] font-bold hover:underline">
              Balances &gt;
            </Link>
          </div>
        </Card>
      </div>

      {/* 3. Core Operational Charting Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <Card className="lg:col-span-8 rounded-2xl border border-slate-200 shadow-sm bg-white p-6">
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
              <AreaChart data={dashboardData.monthlyRunRate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                  formatter={(val: any) => [`৳${val} Lakh`, ""]}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#0090FF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBilled)" />
                <Area type="monotone" dataKey="Collections" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCash)" />
                <Area type="monotone" dataKey="Burn" stroke="#cbd5e1" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Dynamic Therapeutic Segment Share */}
        <Card className="lg:col-span-4 rounded-2xl border border-slate-200 shadow-sm bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Therapeutic Share</h3>
                <p className="text-[11px] text-slate-400">Inventory valuation distribution</p>
              </div>
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-[#0090FF] border-blue-200 font-bold">
                Live Stock
              </Badge>
            </div>

            <div className="mt-4 space-y-3.5">
              {dashboardData.categorySalesShare.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No inventory categories stored yet.
                </div>
              ) : (
                dashboardData.categorySalesShare.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-semibold truncate max-w-[150px]">{cat.category}</span>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-slate-400">{cat.value}</span>
                        <span className="font-bold text-slate-900">({cat.share}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0090FF] rounded-full transition-all duration-500"
                        style={{ width: `${cat.share}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/60 to-slate-50 border border-blue-100 text-xs mt-4">
            <span className="text-slate-500 block text-[11px] font-medium">Gross Inventory Value:</span>
            <span className="font-bold text-slate-900 block mt-0.5 text-sm font-mono">
              ৳{dashboardData.kpis.totalStockValuation.toLocaleString("en-IN")}
            </span>
          </div>
        </Card>
      </div>

      {/* 4. Real-Time Operational Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  FEFO Batch Expiry Surveillance
                </h3>
                <p className="text-[11px] text-slate-400">Live batches approaching shelf-life limits</p>
              </div>
            </div>
            <Link href="/inventory/ledger">
              <Button size="sm" variant="ghost" className="h-7 text-xs text-[#0090FF] gap-1 px-2 font-semibold">
                Stock Ledger <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {dashboardData.criticalSurveillance.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active inventory batches found.
              </div>
            ) : (
              dashboardData.criticalSurveillance.map((batch) => (
                <div key={batch.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{batch.brandName}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {batch.batchNumber} • {batch.warehouseBin}
                    </span>
                  </div>
                  <div className="text-center">
                    <span
                      className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                        batch.daysToExpiry <= 60
                          ? "text-rose-700 bg-rose-50 border-rose-200"
                          : "text-amber-700 bg-amber-50 border-amber-200"
                      }`}
                    >
                      {batch.daysToExpiry} Days Left
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Exp: {batch.expiryDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">
                      ৳{Number(batch.valuation || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-500">{batch.availableUnits} Units</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Logistics Dispatch & Challan Stream
                </h3>
                <p className="text-[11px] text-slate-400">Live consignments and commercial orders</p>
              </div>
            </div>
            <Link href="/orders">
              <Button size="sm" variant="ghost" className="h-7 text-xs text-[#0090FF] gap-1 px-2 font-semibold">
                Dispatch Hub <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {dashboardData.logisticsStream.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active logistics orders.
              </div>
            ) : (
              dashboardData.logisticsStream.map((ord) => (
                <div key={ord.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{ord.pharmacyName}</span>
                    <span className="text-[10px] font-mono text-[#0090FF]">
                      {ord.orderNumber} • {ord.challanNumber || ord.invoiceNumber}
                    </span>
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        ord.status === "Delivered & Invoiced"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : ord.status === "Out for Delivery"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }`}
                    >
                      {ord.status}
                    </Badge>
                    <span className="text-[10px] text-slate-400 block text-center mt-0.5">
                      {ord.totalBoxes} Boxes
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">
                      ৳{ord.orderValue.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px] block">
                      {ord.deliveryMethod}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* 5. Bottom Multi-Deck: Dynamic Liquid Banks & Real Enrolled Doctors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Dynamic Bank Accounts Linking to /finance/bank-ledger */}
        <Card className="lg:col-span-6 rounded-2xl border border-slate-200 shadow-sm bg-white p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Bank Balances & Vault Liquidity
                </h3>
                <p className="text-[11px] text-slate-400">Live ledger accounts from Treasury</p>
              </div>
            </div>
            <Link href="/finance/bank-ledger">
              <Button size="sm" variant="ghost" className="h-7 text-xs text-[#0090FF] gap-1 px-2 font-semibold">
                Treasury <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="space-y-2.5 pt-3 text-xs">
            {dashboardData.accountsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No bank accounts or cash drawers linked yet.
              </div>
            ) : (
              dashboardData.accountsList.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{acc.accountTitle}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {acc.accountNumber} • {acc.institution}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-slate-900 text-sm block">
                      ৳{Number(acc.balance || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">{acc.accountClass}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Dynamic Key Opinion Leaders */}
        <Card className="lg:col-span-6 rounded-2xl border border-slate-200 shadow-sm bg-white p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Key Opinion Leaders (Tier A+ Physicians)
                </h3>
                <p className="text-[11px] text-slate-400">Enrolled physicians from Clinical Master</p>
              </div>
            </div>
            <Link href="/doctors">
              <Button size="sm" variant="ghost" className="h-7 text-xs text-[#0090FF] gap-1 px-2 font-semibold">
                Doctors <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {dashboardData.keyOpinionLeaders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No physicians enrolled yet. Visit Doctors Master to add prescribers.
              </div>
            ) : (
              dashboardData.keyOpinionLeaders.map((doc) => (
                <div key={doc.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm">{doc.name}</span>
                      <Badge className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 font-extrabold">
                        {doc.tier}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {doc.specialty} • {doc.chamber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">
                      ৳{doc.estimatedPrescriptionYield.toLocaleString("en-IN")}/mo
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      {doc.adherence}% Adherence
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* 6. Institutional Footer Banner */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
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
          <Link href="/staff" className="hover:text-[#0090FF] transition-colors">
            Staff Directory
          </Link>
          <span className="text-slate-300">•</span>
          <Link href="/salary" className="hover:text-[#0090FF] transition-colors">
            Payroll Engine
          </Link>
        </div>
      </div>
    </div>
  );
}
