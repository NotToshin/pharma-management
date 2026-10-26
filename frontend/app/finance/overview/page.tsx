"use client"

import * as React from "react"
import { API_URL, apiFetch } from "@/lib/api"
import * as XLSX from "xlsx"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Receipt,
  Download,
  CalendarDays,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Filter,
  FileText,
  Printer,
  Calendar as CalendarIcon,
  RefreshCw,
} from "lucide-react"

interface MonthlyMetrics {
  month: string
  monthIndex: number
  year: number
  Revenue: number
  Collections: number
  Expenses: number
  rawRevenue: number
  rawCollections: number
  rawExpenses: number
}

interface FinancialTransaction {
  id: string
  trxCode: string
  partyName: string
  type: string
  territory: string
  amount: number
  date: string
  status: "Settled" | "Pending Clearance" | "Overdue"
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export default function FinanceOverviewPage() {
  const [loading, setLoading] = React.useState(true)
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = React.useState<number>(new Date().getMonth())
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
  const [isStatementOpen, setIsStatementOpen] = React.useState(false)
  const [filterType, setFilterType] = React.useState("all")

  const [metrics, setMetrics] = React.useState({
    currentEarnBDT: 0,
    currentCollectionsBDT: 0,
    currentBurnBDT: 0,
    currentArBDT: 0,
    currentNetProfitBDT: 0,
  })

  // Strict 4-metric commercial breakdown: COGS, TA/DA, Profit, Net Operating Margin
  const [marginBreakdown, setMarginBreakdown] = React.useState({
    cogsAmount: 0,
    cogsPercent: 0,
    tadaAmount: 0,
    tadaPercent: 0,
    profitAmount: 0,
    netMarginPercent: 0,
  })

  const [annualMetrics, setAnnualMetrics] = React.useState({
    annualEarnBDT: 0,
    annualCollectionsBDT: 0,
    annualBurnBDT: 0,
    annualNetProfitBDT: 0,
  })

  const [monthlyTrend, setMonthlyTrend] = React.useState<MonthlyMetrics[]>([])
  const [transactions, setTransactions] = React.useState<
    FinancialTransaction[]
  >([])

  const fetchOverviewData = React.useCallback(async () => {
    try {
      setLoading(true)

      // Primary: Single source of truth from backend finance overview service
      const overviewRes = await apiFetch(`/finance-overview/metrics?year=${selectedYear}&month=${selectedMonth}`).catch(() => null)
      if (overviewRes && overviewRes.ok) {
        const json = await overviewRes.json()
        const data = json.data
        if (data) {
          setMetrics(data.metrics || {
            currentEarnBDT: 0,
            currentCollectionsBDT: 0,
            currentBurnBDT: 0,
            currentArBDT: 0,
            currentNetProfitBDT: 0,
          })
          setMarginBreakdown(data.marginBreakdown || {
            cogsAmount: 0,
            cogsPercent: 0,
            tadaAmount: 0,
            tadaPercent: 0,
            profitAmount: 0,
            netMarginPercent: 0,
          })
          setAnnualMetrics(data.annualMetrics || {
            annualEarnBDT: 0,
            annualCollectionsBDT: 0,
            annualBurnBDT: 0,
            annualNetProfitBDT: 0,
          })
          setMonthlyTrend(data.monthlyTrend || [])
          setTransactions(data.transactions || [])
          setLoading(false)
          return
        }
      }

      const [ordRes, expRes, voucherRes, batchRes] = await Promise.all([
        apiFetch("/orders").catch(() => ({
          ok: false,
          json: async () => [],
        })),
        apiFetch("/payments").catch(() => ({
          ok: false,
          json: async () => [],
        })),
        apiFetch("/expense-vouchers").catch(() => ({
          ok: false,
          json: async () => [],
        })),
        apiFetch("/inventory").catch(() => ({
          ok: false,
          json: async () => [],
        })),
      ])

      const ordJson = ordRes.ok ? await ordRes.json() : []
      const rawOrders: any[] = Array.isArray(ordJson) ? ordJson : ordJson?.data || []

      const expJson = expRes.ok ? await expRes.json() : []
      const standardExpenses: any[] = Array.isArray(expJson) ? expJson : expJson?.data || []

      const voucherJson = voucherRes.ok ? await voucherRes.json() : []
      const voucherExpenses: any[] = Array.isArray(voucherJson)
        ? voucherJson
        : voucherJson?.data?.vouchers || voucherJson?.data || []

      const batchJson = batchRes.ok ? await batchRes.json() : []
      const inventoryBatches: any[] = Array.isArray(batchJson) ? batchJson : batchJson?.data || []

      const allExpenses: any[] = [
        ...(Array.isArray(standardExpenses) ? standardExpenses : []),
        ...(Array.isArray(voucherExpenses) ? voucherExpenses : []),
      ]

      const validOrders = (Array.isArray(rawOrders) ? rawOrders : []).filter(
        (o) => o.status !== "Cancelled"
      )

      // Create a batch cost lookup map
      const batchCostMap = new Map<string, number>()
      ;(Array.isArray(inventoryBatches) ? inventoryBatches : []).forEach(
        (b: any) => {
          const name = (b.brandName || "").trim().toLowerCase()
          if (name) batchCostMap.set(name, Number(b.unitPrice) || 0)
        }
      )

      // 1. Calculate Monthly Trends
      const trend: MonthlyMetrics[] = MONTH_NAMES.map((name, mIdx) => {
        const monthOrders = validOrders.filter((o) => {
          const dateStr = String(o.orderDate || o.createdAt || "")
          const d = new Date(dateStr)
          if (!isNaN(d.getTime())) {
            return d.getFullYear() === selectedYear && d.getMonth() === mIdx
          }
          return (
            dateStr.includes(name) && dateStr.includes(String(selectedYear))
          )
        })

        const rev = monthOrders.reduce(
          (sum, o) => sum + (Number(o.orderValue) || 0),
          0
        )
        const coll = monthOrders
          .filter(
            (o) => o.status === "Delivered & Invoiced" || o.status === "Settled"
          )
          .reduce((sum, o) => sum + (Number(o.orderValue) || 0), 0)

        const monthExpenses = allExpenses.filter((e) => {
          const expDate = String(e.expenseDate || e.date || e.createdAt || "")
          const d = new Date(expDate)
          if (!isNaN(d.getTime())) {
            return d.getFullYear() === selectedYear && d.getMonth() === mIdx
          }
          return (
            expDate.includes(name) && expDate.includes(String(selectedYear))
          )
        })

        const expTotal = monthExpenses.reduce(
          (sum, e) => sum + (Number(e.amount || e.totalAmount) || 0),
          0
        )

        return {
          month: name,
          monthIndex: mIdx,
          year: selectedYear,
          Revenue: Number((rev / 100000).toFixed(2)),
          Collections: Number((coll / 100000).toFixed(2)),
          Expenses: Number((expTotal / 100000).toFixed(2)),
          rawRevenue: rev,
          rawCollections: coll,
          rawExpenses: expTotal,
        }
      })

      setMonthlyTrend(trend)

      // 2. Target Month Data Calculation
      const targetMonthData = trend[selectedMonth] || {
        rawRevenue: 0,
        rawCollections: 0,
        rawExpenses: 0,
      }

      const monthOrders = validOrders.filter((o) => {
        const dateStr = String(o.orderDate || o.createdAt || "")
        const d = new Date(dateStr)
        if (!isNaN(d.getTime())) {
          return (
            d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
          )
        }
        return (
          dateStr.includes(MONTH_NAMES[selectedMonth]) &&
          dateStr.includes(String(selectedYear))
        )
      })

      const ordersToEvaluate =
        monthOrders.length > 0 ? monthOrders : validOrders

      const currentEarn =
        targetMonthData.rawRevenue > 0
          ? targetMonthData.rawRevenue
          : validOrders.reduce((sum, o) => sum + (Number(o.orderValue) || 0), 0)

      const currentColl =
        targetMonthData.rawCollections > 0
          ? targetMonthData.rawCollections
          : validOrders
              .filter(
                (o) =>
                  o.status === "Delivered & Invoiced" || o.status === "Settled"
              )
              .reduce((sum, o) => sum + (Number(o.orderValue) || 0), 0)

      // DA / TA (Operational Burn) pulled directly from Expense vouchers
      const selectedMonthExpenses = allExpenses.filter((e) => {
        const expDate = String(e.expenseDate || e.date || e.createdAt || "")
        const d = new Date(expDate)
        if (!isNaN(d.getTime())) {
          return (
            d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
          )
        }
        return (
          expDate.includes(MONTH_NAMES[selectedMonth]) &&
          expDate.includes(String(selectedYear))
        )
      })

      const tadaBurn =
        selectedMonthExpenses.length > 0
          ? selectedMonthExpenses.reduce(
              (sum, e) => sum + (Number(e.amount || e.totalAmount) || 0),
              0
            )
          : allExpenses.reduce(
              (sum, e) => sum + (Number(e.amount || e.totalAmount) || 0),
              0
            )

      // Dynamic COGS: calculated from line item quantities and batch procurement cost
      let dynamicCogs = 0
      ordersToEvaluate.forEach((ord) => {
        let items: any[] = []
        if (Array.isArray(ord.itemsDetail)) {
          items = ord.itemsDetail
        } else if (typeof ord.itemsDetail === "string") {
          try {
            items = JSON.parse(ord.itemsDetail)
          } catch {
            items = []
          }
        }

        if (items.length > 0) {
          items.forEach((item) => {
            const desc = (item.description || "").trim().toLowerCase()
            const qty = Number(item.quantity) || 1
            const cost = batchCostMap.get(desc) || Number(item.unitCost) || 0
            dynamicCogs += qty * cost
          })
        } else {
          // If no line items exist, default base manufacturing COGS is 50%
          dynamicCogs += Math.round((Number(ord.orderValue) || 0) * 0.5)
        }
      })

      // Avoid COGS exceeding revenue if retail price matches batch unit price directly
      if (dynamicCogs >= currentEarn && currentEarn > 0) {
        dynamicCogs = Math.round(currentEarn * 0.5)
      }

      // Exact Retained Profit and Margin calculation
      const calculatedProfit = Math.max(0, currentEarn - dynamicCogs - tadaBurn)
      const cogsPercent =
        currentEarn > 0
          ? Number(((dynamicCogs / currentEarn) * 100).toFixed(1))
          : 0
      const tadaPercent =
        currentEarn > 0
          ? Number(((tadaBurn / currentEarn) * 100).toFixed(1))
          : 0
      const netMarginPercent =
        currentEarn > 0
          ? Number(((calculatedProfit / currentEarn) * 100).toFixed(1))
          : 0

      setMarginBreakdown({
        cogsAmount: dynamicCogs,
        cogsPercent,
        tadaAmount: tadaBurn,
        tadaPercent,
        profitAmount: calculatedProfit,
        netMarginPercent,
      })

      const currentAr = Math.max(0, currentEarn - currentColl)

      setMetrics({
        currentEarnBDT: currentEarn,
        currentCollectionsBDT: currentColl,
        currentBurnBDT: tadaBurn,
        currentArBDT: currentAr,
        currentNetProfitBDT: calculatedProfit,
      })

      // Annual Totals
      const annualEarn =
        trend.reduce((sum, m) => sum + m.rawRevenue, 0) || currentEarn
      const annualColl =
        trend.reduce((sum, m) => sum + m.rawCollections, 0) || currentColl
      const annualBurn =
        trend.reduce((sum, m) => sum + m.rawExpenses, 0) || tadaBurn
      const annualNetProfit = Math.max(0, annualColl - annualBurn)

      setAnnualMetrics({
        annualEarnBDT: annualEarn,
        annualCollectionsBDT: annualColl,
        annualBurnBDT: annualBurn,
        annualNetProfitBDT: annualNetProfit,
      })

      // Transactions stream
      const liveTxList: FinancialTransaction[] = []

      validOrders.forEach((o, i) => {
        const isSettled =
          o.status === "Settled" || o.status === "Delivered & Invoiced"
        liveTxList.push({
          id: o.id || `tx-ord-${i}`,
          trxCode:
            o.invoiceNumber ||
            o.orderNumber ||
            `INV-2026-${String(i + 1).padStart(4, "0")}`,
          partyName: o.pharmacyName || "Registered Chemist",
          type: "Pharmacy Invoice",
          territory: o.territory || "Dhaka North",
          amount: Number(o.orderValue) || 0,
          date: o.orderDate || "28 Sep 2026",
          status: isSettled ? "Settled" : "Pending Clearance",
        })
      })

      allExpenses.forEach((e, i) => {
        liveTxList.push({
          id: e.id || `tx-exp-${i}`,
          trxCode:
            e.voucherNumber ||
            e.refNo ||
            `EXP-2026-${String(i + 1).padStart(4, "0")}`,
          partyName:
            e.recipient ||
            e.submittedBy ||
            e.description ||
            "Field DA/TA Disbursement",
          type: "TA/DA Disbursement",
          territory: e.territory || "Field Force",
          amount: Number(e.amount || e.totalAmount) || 0,
          date: e.expenseDate || e.date || "28 Sep 2026",
          status:
            e.status === "Approved" || e.status === "Paid"
              ? "Settled"
              : "Pending Clearance",
        })
      })

      setTransactions(liveTxList)
    } catch (err) {
      console.error("Failed to load live financial overview:", err)
    } finally {
      setLoading(false)
    }
  }, [API_URL, selectedYear, selectedMonth])

  React.useEffect(() => {
    fetchOverviewData()
  }, [fetchOverviewData])

  const handleExportExcel = () => {
    const data = transactions.map((t) => ({
      "Transaction Ref": t.trxCode,
      "Counterparty / Entity": t.partyName,
      "Transaction Type": t.type,
      "Associated Territory / Account": t.territory,
      "Amount (BDT)": t.amount,
      Date: t.date,
      "Settlement Status": t.status,
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `Finance_${MONTH_NAMES[selectedMonth]}_${selectedYear}`
    )
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Financial_Overview_${MONTH_NAMES[selectedMonth]}_${selectedYear}.xlsx`
    )
  }

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === "all") return true
    return t.type.toLowerCase().includes(filterType.toLowerCase())
  })

  const collectionRatio =
    metrics.currentEarnBDT > 0
      ? (
          (metrics.currentCollectionsBDT / metrics.currentEarnBDT) *
          100
        ).toFixed(1)
      : "0.0"

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-12 font-sans text-slate-900">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-annual-statement,
          #printable-annual-statement * {
            visibility: visible !important;
          }
          #printable-annual-statement {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            padding: 30px !important;
            background: white !important;
            z-index: 999999 !important;
          }
        }
      `}</style>

      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#0090FF]" />
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              COMMERCIAL PERFORMANCE & EXECUTIVE TREASURY
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Financial Health & Commercial Overview
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time turnover, live collection rates, operational burn, and
            fiscal period reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchOverviewData}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCalendarOpen(true)}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 shadow-none hover:border-slate-300"
          >
            <CalendarDays className="h-4 w-4 text-[#0090FF]" />
            <span>
              {MONTH_NAMES[selectedMonth]} {selectedYear} (Fiscal Q
              {Math.floor(selectedMonth / 3) + 1})
            </span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsStatementOpen(true)}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 shadow-none hover:border-slate-300"
          >
            <FileText className="h-3.5 w-3.5 text-slate-600" />
            Annual Statement
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Sheet
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Gross Billed Turnover
            </span>
            <div className="rounded-lg bg-blue-50 p-1.5 text-[#0090FF]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-slate-900">
            ৳{metrics.currentEarnBDT.toLocaleString("en-IN")}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>
              Active for {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Realized Collections
            </span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-emerald-700">
            ৳{metrics.currentCollectionsBDT.toLocaleString("en-IN")}
          </div>
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            {collectionRatio}% collection recovery rate
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Accounts Receivable (A/R)
            </span>
            <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-amber-700">
            ৳{metrics.currentArBDT.toLocaleString("en-IN")}
          </div>
          <p className="mt-3 text-[11px] font-medium text-amber-600">
            Outstanding chemist clearance for this period
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              TA/DA & Operational Burn
            </span>
            <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-rose-600">
            ৳{metrics.currentBurnBDT.toLocaleString("en-IN")}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Disbursed field force allowances & operational expenses
          </p>
        </Card>
      </div>

      {/* 3. Middle Area Chart & Clean 4-Item Margin Breakdown */}
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
        <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-none lg:col-span-8">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                FY {selectedYear} Cash Flow Run-Rate (in Lakh ৳)
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Dynamic revenue versus collections plotted against TA/DA burn
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#0090FF]" />
                <span>Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Collections</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>TA/DA Burn</span>
              </div>
            </div>
          </div>

          <div className="h-[270px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0090FF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0090FF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
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
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "11px",
                  }}
                  formatter={(val: any) => [`৳${val} Lakh`, ""]}
                />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#0090FF"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="Collections"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorColl)"
                />
                <Area
                  type="monotone"
                  dataKey="Expenses"
                  stroke="#f43f5e"
                  strokeWidth={1.5}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 100% Dynamic Commercial Margin Breakdown: COGS, TA/DA, Profit, Net Operating Margin */}
        <Card className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-none lg:col-span-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Commercial Margin Breakdown
              </h2>
              <Badge variant="outline" className="text-[10px] font-bold">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Realized net margins after operational allocations
            </p>

            <div className="mt-6 space-y-5">
              {/* 1. COGS */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">COGS</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-slate-400">
                      (৳{marginBreakdown.cogsAmount.toLocaleString("en-IN")})
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {marginBreakdown.cogsPercent}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, marginBreakdown.cogsPercent)}%`,
                    }}
                  />
                </div>
              </div>

              {/* 2. TA/DA */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">TA/DA</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-slate-400">
                      (৳{marginBreakdown.tadaAmount.toLocaleString("en-IN")})
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {marginBreakdown.tadaPercent}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#0090FF] transition-all duration-500"
                    style={{
                      width: `${Math.min(100, marginBreakdown.tadaPercent)}%`,
                    }}
                  />
                </div>
              </div>

              {/* 3. Net Operating Margin */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-700">
                    Net Operating Margin
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {marginBreakdown.netMarginPercent}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-50">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, marginBreakdown.netMarginPercent)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Profit */}
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs">
            <span className="block text-[10px] font-bold tracking-wider text-slate-700 uppercase">
              NET OPERATING PROFIT
            </span>
            <span className="mt-1 block font-mono text-2xl font-black text-slate-900">
              ৳{marginBreakdown.profitAmount.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-slate-400">
              For period: {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
          </div>
        </Card>
      </div>

      {/* 4. Live Transactions Ledger Table */}
      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-none">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              RECENT COMMERCIAL INVOICES & FIELD DISBURSEMENTS
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Live consolidated stream of invoices, disbursements, and treasury
              entries
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 w-[170px] border-slate-200 bg-white text-xs">
                <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                <SelectValue placeholder="All Operations" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Operations</SelectItem>
                <SelectItem value="pharmacy invoice">
                  Pharmacy Invoices
                </SelectItem>
                <SelectItem value="ta/da disbursement">
                  TA/DA Disbursements
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0 text-xs font-medium text-slate-600">
                Reference ID
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Counterparty / Description
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Transaction Type
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Territory / Account
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Date
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-slate-600">
                Amount (৳)
              </TableHead>
              <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-xs text-slate-400"
                >
                  Loading live financial records...
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-xs text-slate-400"
                >
                  No transaction records found for this period.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50"
                >
                  <TableCell className="py-3 pl-0 font-mono text-xs font-semibold text-[#0090FF]">
                    {tx.trxCode}
                  </TableCell>
                  <TableCell className="py-3 text-xs font-semibold text-slate-900">
                    {tx.partyName}
                  </TableCell>
                  <TableCell className="py-3 text-xs">
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-700"
                    >
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-slate-600">
                    {tx.territory}
                  </TableCell>
                  <TableCell className="py-3 font-mono text-xs text-slate-600">
                    {tx.date}
                  </TableCell>
                  <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-900">
                    ৳{tx.amount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="py-3 pr-0 text-right text-xs">
                    <Badge
                      variant="outline"
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        tx.status === "Settled"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : tx.status === "Pending Clearance"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Working Calendar Dialog Modal */}
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent className="rounded-2xl bg-white p-6 sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <CalendarIcon className="h-4 w-4 text-[#0090FF]" />
              Select Accounting Period & Fiscal Quarter
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pick any month to inspect live earned revenue, operational burn,
              and collections.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-semibold text-slate-700">
                Financial Year
              </span>
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="h-8 w-28 bg-white font-mono text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-mono text-xs">
                  <SelectItem value="2025">FY 2025</SelectItem>
                  <SelectItem value="2026">FY 2026</SelectItem>
                  <SelectItem value="2027">FY 2027</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {[
                { quarter: "Q1", months: [0, 1, 2] },
                { quarter: "Q2", months: [3, 4, 5] },
                { quarter: "Q3", months: [6, 7, 8] },
                { quarter: "Q4", months: [9, 10, 11] },
              ].map((q) => (
                <div
                  key={q.quarter}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <span className="mb-2 block text-[10px] font-black text-slate-400 uppercase">
                    Fiscal {q.quarter} {selectedYear}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {q.months.map((mIdx) => {
                      const isSelected = selectedMonth === mIdx
                      const monthData = monthlyTrend[mIdx] || { Revenue: 0 }
                      return (
                        <button
                          key={mIdx}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(mIdx)
                            setIsCalendarOpen(false)
                          }}
                          className={`rounded-lg border p-2.5 text-left transition-all ${
                            isSelected
                              ? "border-[#0090FF] bg-[#0090FF] text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <strong className="block text-xs font-bold">
                            {MONTH_NAMES[mIdx]}
                          </strong>
                          <span
                            className={`mt-0.5 block font-mono text-[10px] ${isSelected ? "text-blue-100" : "text-slate-400"}`}
                          >
                            Rev: ৳{monthData.Revenue}L
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCalendarOpen(false)}
              className="h-8 text-xs"
            >
              Close Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Annual Statement Modal */}
      <Dialog open={isStatementOpen} onOpenChange={setIsStatementOpen}>
        <DialogContent className="max-h-[95vh] overflow-y-auto rounded-2xl bg-white p-0 sm:max-w-[760px]">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-4 print:hidden">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#0090FF]" />
              <span className="text-xs font-bold text-slate-800">
                Annual Financial Statement — FY {selectedYear}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => window.print()}
                className="h-8 gap-1.5 bg-[#0090FF] text-xs text-white shadow-none hover:bg-[#0080e5]"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Statement
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsStatementOpen(false)}
                className="h-8 text-xs"
              >
                Close
              </Button>
            </div>
          </div>

          <div
            id="printable-annual-statement"
            className="bg-white p-8 font-sans text-xs text-slate-900"
          >
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex flex-col items-start gap-1.5 max-w-[340px]">
                <img
                  src="/logo-2.png"
                  alt="AK Pharma"
                  className="h-12 w-auto max-w-[320px] object-contain"
                />
                <div className="text-[11px] text-slate-700 leading-tight">
                  <p className="font-semibold text-slate-800">
                    Directorate of Finance & Commercial Operations
                  </p>
                  <p className="text-[10px] text-slate-500">
                    10/26, Rupnagar R/A, Mirpur, Dhaka 1216 • DGDA Lic: DL-PH-2026-88
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="block inline-block border border-slate-900 px-2 py-0.5 text-xs font-bold tracking-wider uppercase">
                  ANNUAL STATEMENT (FY {selectedYear})
                </span>
                <span className="mt-1 block font-mono text-[10px] text-slate-500">
                  Issued: 28 Sep 2026
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 border-b border-slate-200 py-4">
              <div className="rounded border border-slate-200 bg-slate-50 p-2.5">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">
                  Total Billed Turnover
                </span>
                <strong className="mt-1 block font-mono text-sm font-bold text-slate-900">
                  ৳{annualMetrics.annualEarnBDT.toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-2.5">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">
                  Realized Collections
                </span>
                <strong className="mt-1 block font-mono text-sm font-bold text-emerald-700">
                  ৳{annualMetrics.annualCollectionsBDT.toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-2.5">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">
                  TA/DA Burn
                </span>
                <strong className="mt-1 block font-mono text-sm font-bold text-rose-700">
                  ৳{annualMetrics.annualBurnBDT.toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-2.5">
                <span className="block text-[9px] font-bold text-slate-500 uppercase">
                  Audited Net Profit
                </span>
                <strong className="mt-1 block font-mono text-sm font-bold text-[#0090FF]">
                  ৳{annualMetrics.annualNetProfitBDT.toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            <div className="py-4">
              <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
                Monthly Commercial Performance Ledger (FY {selectedYear})
              </h3>
              <table className="w-full border border-slate-300 text-xs">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-100 font-bold text-slate-800">
                    <th className="p-2 text-left">Period</th>
                    <th className="p-2 text-right">Billed Revenue (৳)</th>
                    <th className="p-2 text-right">Collected (৳)</th>
                    <th className="p-2 text-right">Expenses / Burn (৳)</th>
                    <th className="p-2 text-right">Net Cash (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {monthlyTrend.map((m) => {
                    const net = m.rawCollections - m.rawExpenses
                    return (
                      <tr key={m.month}>
                        <td className="p-2 font-bold">
                          {m.month} {selectedYear}
                        </td>
                        <td className="p-2 text-right font-mono">
                          ৳{m.rawRevenue.toLocaleString("en-IN")}
                        </td>
                        <td className="p-2 text-right font-mono font-semibold text-emerald-700">
                          ৳{m.rawCollections.toLocaleString("en-IN")}
                        </td>
                        <td className="p-2 text-right font-mono text-rose-600">
                          ৳{m.rawExpenses.toLocaleString("en-IN")}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">
                          ৳{net.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-8 border-t-2 border-slate-200 pt-6 text-center text-[10px]">
              <div>
                <div className="mx-auto mb-1 w-40 border-b border-slate-400" />
                <strong className="block text-xs text-slate-900">
                  Chief Executive Officer (CEO)
                </strong>
                <span className="text-slate-500">
                  Executive Financial Authorization
                </span>
              </div>
              <div>
                <div className="mx-auto mb-1 w-40 border-b border-slate-400" />
                <strong className="block text-xs text-slate-900">
                  Managing Director (MD)
                </strong>
                <span className="text-slate-500">
                  Final Audit & Statutory Sign-off
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
