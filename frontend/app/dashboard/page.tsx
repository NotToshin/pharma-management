"use client"

import * as React from "react"
import Link from "next/link"
import * as XLSX from "xlsx"
import { API_URL } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
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
} from "lucide-react"
import { AKLogo } from "@/components/ui/ak-logo"

export default function MasterExecutiveDashboardPage() {
  const [loading, setLoading] = React.useState(true)
  const [activeDate, setActiveDate] = React.useState("")

  const [dashboardData, setDashboardData] = React.useState<{
    kpis: {
      grossTurnover: number
      realizedCash: number
      recoveryRate: string
      expiryExposureValue: number
      criticalBatchCount: number
      liquidBalance: number
      totalStockValuation: number
      reconciledAccountsCount: number
      staffCount: number
    }
    monthlyRunRate: Array<{
      month: string
      Revenue: number
      Collections: number
      Burn: number
    }>
    categorySalesShare: Array<{
      category: string
      share: number
      value: string
    }>
    criticalSurveillance: Array<any>
    logisticsStream: Array<any>
    accountsList: Array<any>
    keyOpinionLeaders: Array<any>
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
  })

  const fetchDashboardTelemetry = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/dashboard/telemetry`)
      if (res.ok) {
        const json = await res.json()
        const payload = json.data || json
        if (payload && payload.kpis) {
          setDashboardData(payload)
        }
      }
    } catch (err) {
      console.error("Telemetry fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [API_URL])

  React.useEffect(() => {
    setActiveDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    )
    fetchDashboardTelemetry()
  }, [fetchDashboardTelemetry])

  const handleExportExecutiveSummary = () => {
    const kpis = dashboardData?.kpis || {
      grossTurnover: 0,
      realizedCash: 0,
      recoveryRate: "0.0",
      expiryExposureValue: 0,
      criticalBatchCount: 0,
      liquidBalance: 0,
      totalStockValuation: 0,
      reconciledAccountsCount: 0,
      staffCount: 0,
    }

    const summaryData = [
      {
        Metric: "Gross Billed Turnover",
        Value: `৳${(kpis.grossTurnover || 0).toLocaleString("en-IN")}`,
      },
      {
        Metric: "Realized Cash Collections",
        Value: `৳${(kpis.realizedCash || 0).toLocaleString("en-IN")}`,
      },
      {
        Metric: "Collection Recovery Efficiency",
        Value: `${kpis.recoveryRate || "0.0"}%`,
      },
      {
        Metric: "Critical Expiry Value at Risk",
        Value: `৳${(kpis.expiryExposureValue || 0).toLocaleString("en-IN")}`,
      },
      {
        Metric: "Liquid Bank & Safe Liquidity",
        Value: `৳${(kpis.liquidBalance || 0).toLocaleString("en-IN")}`,
      },
      {
        Metric: "Total Warehouse Stock Valuation",
        Value: `৳${(kpis.totalStockValuation || 0).toLocaleString("en-IN")}`,
      },
      {
        Metric: "Reconciled Treasury Accounts",
        Value: `${kpis.reconciledAccountsCount || 0} Accounts`,
      },
      {
        Metric: "Active Personnel Roster",
        Value: `${kpis.staffCount || 0} Enrolled Staff`,
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(summaryData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "AK Pharma Executive Summary"
    )
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Executive_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
  }

  return (
    <div className="mx-auto max-w-[1380px] space-y-6 pb-16 font-sans text-slate-900">
      {/* 1. EXECUTIVE BRAND HEADER */}
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-r from-white via-slate-50/70 to-blue-50/30 p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Brand Identity & Title */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <AKLogo className="h-9" showTagline={true} />
              </div>

              <span className="hidden h-7 w-px bg-slate-200 lg:block" />

              <Badge variant="outline" className="gap-1.5 border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                LIVE GATEWAY ONLINE
              </Badge>
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-[#23496D] sm:text-2xl">
                Executive Operations & Commercial Dashboard
              </h1>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Real-time operational synchronization across warehousing, commercial detailing, financial accounts, and workforce operations.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3B799B]" />
              <span>{activeDate}</span>
              <span>•</span>
              <span>Dhaka Central HQ</span>
            </div>
          </div>

          {/* Action Controls & Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Chips */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 shadow-2xs">
              <div className="rounded-lg bg-blue-50 p-1.5 text-[#3B799B]">
                <Snowflake className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  Cold Chain
                </span>
                <span className="font-mono text-xs font-bold text-emerald-700">
                  4.2°C Normal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 shadow-2xs">
              <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  DGDA / GMP
                </span>
                <span className="font-mono text-xs font-bold text-emerald-700">
                  Audit Compliant
                </span>
              </div>
            </div>

            {/* Sync & Export */}
            <Button
              onClick={fetchDashboardTelemetry}
              variant="outline"
              className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#3B799B] ${loading ? "animate-spin" : ""}`}
              />
              <span>Sync</span>
            </Button>

            <Button
              onClick={handleExportExecutiveSummary}
              className="h-10 gap-2 rounded-xl bg-[#23496D] px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#1C3A57]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Brief</span>
            </Button>
          </div>
        </div>

        {/* Quick Action Ribbon */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 border-t border-slate-200/70 pt-4 text-xs sm:grid-cols-4">
          <Link
            href="/logistics/orders"
            className="flex items-center gap-2.5 rounded-xl border border-slate-200/60 bg-white p-2.5 font-medium text-slate-700 transition-all hover:border-[#23496D]/40 hover:bg-slate-50 hover:shadow-2xs"
          >
            <div className="rounded-lg bg-blue-50 p-1 text-[#23496D]">
              <Plus className="h-3.5 w-3.5" />
            </div>
            <span>Book Sales Order</span>
          </Link>
          <Link
            href="/doctors/database"
            className="flex items-center gap-2.5 rounded-xl border border-slate-200/60 bg-white p-2.5 font-medium text-slate-700 transition-all hover:border-emerald-500/40 hover:bg-slate-50 hover:shadow-2xs"
          >
            <div className="rounded-lg bg-emerald-50 p-1 text-emerald-600">
              <Stethoscope className="h-3.5 w-3.5" />
            </div>
            <span>Doctor Registry</span>
          </Link>
          <Link
            href="/finance/payments"
            className="flex items-center gap-2.5 rounded-xl border border-slate-200/60 bg-white p-2.5 font-medium text-slate-700 transition-all hover:border-purple-500/40 hover:bg-slate-50 hover:shadow-2xs"
          >
            <div className="rounded-lg bg-purple-50 p-1 text-purple-600">
              <Receipt className="h-3.5 w-3.5" />
            </div>
            <span>Issue Payment</span>
          </Link>
          <Link
            href="/hr/salary"
            className="flex items-center gap-2.5 rounded-xl border border-slate-200/60 bg-white p-2.5 font-medium text-slate-700 transition-all hover:border-amber-500/40 hover:bg-slate-50 hover:shadow-2xs"
          >
            <div className="rounded-lg bg-amber-50 p-1 text-amber-600">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span>Process Payroll</span>
          </Link>
        </div>
      </div>

      {/* 2. Top-Level Operational KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-[#23496D]/30 hover:shadow-md">
          <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-[#23496D]/5 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">
              Gross Turnover
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-[#23496D]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-slate-900">
            ৳{(dashboardData?.kpis?.grossTurnover ?? 0).toLocaleString("en-IN")}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span className="flex items-center gap-0.5 font-bold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" /> Live Invoices
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Pipeline Total
            </span>
          </div>
        </Card>

        <Card className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md">
          <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-emerald-500/5 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">
              Realized Cash
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-slate-900">
            ৳{(dashboardData?.kpis?.realizedCash ?? 0).toLocaleString("en-IN")}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span className="font-semibold text-slate-700">
              {dashboardData?.kpis?.recoveryRate ?? "0.0"}% Recovery Rate
            </span>
            <Link
              href="/finance/overview"
              className="text-[11px] font-bold text-[#23496D] hover:underline"
            >
              Ledger &gt;
            </Link>
          </div>
        </Card>

        <Card className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-rose-300 hover:shadow-md">
          <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-rose-500/5 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">
              Expiry Exposure
            </span>
            <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-rose-600">
            ৳{(dashboardData?.kpis?.expiryExposureValue ?? 0).toLocaleString("en-IN")}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
              {dashboardData?.kpis?.criticalBatchCount ?? 0} Critical Batches (&le;90d)
            </span>
            <Link
              href="/inventory/ledger"
              className="text-[11px] font-bold text-[#23496D] hover:underline"
            >
              Stock &gt;
            </Link>
          </div>
        </Card>

        <Card className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-purple-300 hover:shadow-md">
          <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-purple-500/5 transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">
              Liquid Vault & Banks
            </span>
            <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-slate-900">
            ৳{(dashboardData?.kpis?.liquidBalance ?? 0).toLocaleString("en-IN")}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <span className="text-[11px] font-medium text-slate-500">
              {dashboardData?.kpis?.reconciledAccountsCount ?? 0} Reconciled Accounts
            </span>
            <Link
              href="/finance/bank-ledger"
              className="text-[11px] font-bold text-[#23496D] hover:underline"
            >
              Balances &gt;
            </Link>
          </div>
        </Card>
      </div>

      {/* 3. Core Operational Charting Suite */}
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Commercial Cash Flow Run-Rate
                </h2>
                <Badge className="border-blue-200 bg-blue-50 text-[10px] font-bold text-[#23496D]">
                  In Lakh ৳
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Gross billed revenue versus realized collections against
                operational burn rate
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#23496D]" />
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
              <AreaChart
                data={dashboardData.monthlyRunRate}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#23496D" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#23496D" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#71717A" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#71717A" }}
                />
                <Tooltip
                  cursor={{ stroke: "#e2e8f0" }}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: "11px",
                  }}
                  formatter={(val: any) => [`৳${val} Lakh`, ""]}
                />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#23496D"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorBilled)"
                />
                <Area
                  type="monotone"
                  dataKey="Collections"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCash)"
                />
                <Area
                  type="monotone"
                  dataKey="Burn"
                  stroke="#cbd5e1"
                  strokeWidth={1.5}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Dynamic Therapeutic Segment Share */}
        <Card className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Therapeutic Share
                </h3>
                <p className="text-[11px] text-slate-400">
                  Inventory valuation distribution
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-[10px] font-bold text-[#23496D]"
              >
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
                      <span className="max-w-[150px] truncate font-semibold text-slate-700">
                        {cat.category}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-slate-400">{cat.value}</span>
                        <span className="font-bold text-slate-900">
                          ({cat.share}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#23496D] transition-all duration-500"
                        style={{ width: `${cat.share}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/60 to-slate-50 p-3.5 text-xs">
            <span className="block text-[11px] font-medium text-slate-500">
              Gross Inventory Value:
            </span>
            <span className="mt-0.5 block font-mono text-sm font-bold text-slate-900">
              ৳{(dashboardData?.kpis?.totalStockValuation ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
        </Card>
      </div>

      {/* 4. Real-Time Operational Activity Feeds */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                  FEFO Batch Expiry Surveillance
                </h3>
                <p className="text-[11px] text-slate-400">
                  Live batches approaching shelf-life limits
                </p>
              </div>
            </div>
            <Link href="/inventory/ledger">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs font-semibold text-[#23496D] hover:text-[#1C3A57]"
              >
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
                <div
                  key={batch.id}
                  className="flex items-center justify-between py-3.5"
                >
                  <div>
                    <span className="block text-sm font-bold text-slate-900">
                      {batch.brandName}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {batch.batchNumber} • {batch.warehouseBin}
                    </span>
                  </div>
                  <div className="text-center">
                    <span
                      className={`rounded-md border px-2.5 py-0.5 font-mono text-xs font-bold ${
                        batch.daysToExpiry <= 60
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {batch.daysToExpiry} Days Left
                    </span>
                    <span className="mt-0.5 block text-[10px] text-slate-400">
                      Exp: {batch.expiryDate}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono font-bold text-slate-900">
                      ৳{Number(batch.valuation || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {batch.availableUnits} Units
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-blue-50 p-1.5 text-[#23496D]">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                  Logistics Dispatch &amp; Challan Stream
                </h3>
                <p className="text-[11px] text-slate-400">
                  Live consignments and commercial orders
                </p>
              </div>
            </div>
            <Link href="/logistics/orders">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs font-semibold text-[#23496D] hover:text-[#1C3A57]"
              >
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
                <div
                  key={ord.id}
                  className="flex items-center justify-between py-3.5"
                >
                  <div>
                    <span className="block text-sm font-bold text-slate-900">
                      {ord.pharmacyName}
                    </span>
                    <span className="font-mono text-[10px] text-[#23496D]">
                      {ord.orderNumber} •{" "}
                      {ord.challanNumber || ord.invoiceNumber}
                    </span>
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        ord.status === "Delivered & Invoiced"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : ord.status === "Out for Delivery"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-purple-200 bg-purple-50 text-purple-700"
                      }`}
                    >
                      {ord.status}
                    </Badge>
                    <span className="mt-0.5 block text-center text-[10px] text-slate-400">
                      {ord.totalBoxes} Boxes
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono font-bold text-slate-900">
                      ৳{ord.orderValue.toLocaleString("en-IN")}
                    </span>
                    <span className="block max-w-[120px] truncate text-[10px] font-medium text-slate-500">
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
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Dynamic Bank Accounts Linking to /finance/bank-ledger */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-purple-50 p-1.5 text-purple-600">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                  Bank Balances & Vault Liquidity
                </h3>
                <p className="text-[11px] text-slate-400">
                  Live ledger accounts from Treasury
                </p>
              </div>
            </div>
            <Link href="/finance/bank-ledger">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs font-semibold text-[#23496D] hover:text-[#1C3A57]"
              >
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
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition-colors hover:bg-slate-50"
                >
                  <div>
                    <span className="block text-sm font-bold text-slate-900">
                      {acc.accountTitle}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {acc.accountNumber} • {acc.institution}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono text-sm font-extrabold text-slate-900">
                      ৳{Number(acc.balance || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">
                      {acc.accountClass}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Dynamic Key Opinion Leaders */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                  Key Opinion Leaders (Tier A+ Physicians)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Enrolled physicians from Clinical Master
                </p>
              </div>
            </div>
            <Link href="/doctors/database">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs font-semibold text-[#23496D] hover:text-[#1C3A57]"
              >
                Doctors <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {dashboardData.keyOpinionLeaders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No physicians enrolled yet. Visit Doctors Master to add
                prescribers.
              </div>
            ) : (
              dashboardData.keyOpinionLeaders.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-3.5"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">
                        {doc.name}
                      </span>
                      <Badge className="border-blue-200 bg-blue-50 text-[9px] font-extrabold text-blue-700">
                        {doc.tier}
                      </Badge>
                    </div>
                    <span className="mt-0.5 block text-[10px] text-slate-500">
                      {doc.specialty} • {doc.chamber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono font-bold text-slate-900">
                      ৳{doc.estimatedPrescriptionYield.toLocaleString("en-IN")}
                      /mo
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">
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
      <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#23496D]" />
          <span>
            Enterprise Security Policy:{" "}
            <strong>21 CFR Part 11 &amp; DGDA Statutory Logging Active</strong>
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-medium">
          <Link
            href="/settings/rbac"
            className="transition-colors hover:text-[#23496D]"
          >
            RBAC Policies
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            href="/settings/audit-logs"
            className="transition-colors hover:text-[#23496D]"
          >
            Audit Ledger
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            href="/hr/staff-directory"
            className="transition-colors hover:text-[#23496D]"
          >
            Staff Directory
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            href="/hr/salary"
            className="transition-colors hover:text-[#23496D]"
          >
            Payroll Engine
          </Link>
        </div>
      </div>
    </div>
  )
}
