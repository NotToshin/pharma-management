"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  Download,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building,
  Filter,
  CheckCircle2,
  Clock,
} from "lucide-react";

// Cash Flow & Monthly Run-Rate Trend (in Lakhs BDT)
const revenueTrendData = [
  { month: "Apr", Revenue: 142.5, Collections: 130.2, Expenses: 38.4 },
  { month: "May", Revenue: 158.0, Collections: 145.0, Expenses: 41.2 },
  { month: "Jun", Revenue: 165.4, Collections: 159.8, Expenses: 44.0 },
  { month: "Jul", Revenue: 178.2, Collections: 164.5, Expenses: 46.5 },
  { month: "Aug", Revenue: 189.6, Collections: 178.0, Expenses: 49.0 },
  { month: "Sep", Revenue: 194.7, Collections: 182.4, Expenses: 51.2 },
];

interface FinancialTransaction {
  id: string;
  trxCode: string;
  partyName: string;
  type: "Pharmacy Invoice" | "Wholesale Deposit" | "MIO Field Allowance" | "Batch Procurement";
  territory: string;
  amount: number;
  date: string;
  status: "Settled" | "Pending Clearance" | "Overdue";
}

const recentTransactions: FinancialTransaction[] = [
  {
    id: "tx-1",
    trxCode: "INV-2026-8841",
    partyName: "Popular Pharmacy (Dhanmondi Branch)",
    type: "Pharmacy Invoice",
    territory: "Dhaka North",
    amount: 142500,
    date: "16 Sep 2026",
    status: "Settled",
  },
  {
    id: "tx-2",
    trxCode: "EXP-2026-0312",
    partyName: "Rafiqul Islam (MIO Field Conveyance)",
    type: "MIO Field Allowance",
    territory: "Dhaka North",
    amount: 18400,
    date: "16 Sep 2026",
    status: "Settled",
  },
  {
    id: "tx-3",
    trxCode: "INV-2026-8842",
    partyName: "Chevron Hospital Chemist Hub",
    type: "Pharmacy Invoice",
    territory: "Chittagong Central",
    amount: 98200,
    date: "15 Sep 2026",
    status: "Pending Clearance",
  },
  {
    id: "tx-4",
    trxCode: "PRC-2026-0094",
    partyName: "Square Raw Pharma Ingredients Ltd.",
    type: "Batch Procurement",
    territory: "Central Warehouse",
    amount: 420000,
    date: "14 Sep 2026",
    status: "Settled",
  },
  {
    id: "tx-5",
    trxCode: "INV-2026-8843",
    partyName: "Medinova Chemist Corner (Mirpur)",
    type: "Pharmacy Invoice",
    territory: "Dhaka South",
    amount: 67500,
    date: "12 Sep 2026",
    status: "Overdue",
  },
  {
    id: "tx-6",
    trxCode: "DEP-2026-0129",
    partyName: "Sylhet Central Medicine Wholesalers",
    type: "Wholesale Deposit",
    territory: "Sylhet Sadar",
    amount: 210000,
    date: "11 Sep 2026",
    status: "Settled",
  },
];

export default function FinanceOverviewPage() {
  const [transactions, setTransactions] = React.useState<FinancialTransaction[]>(recentTransactions);
  const [filterType, setFilterType] = React.useState("all");

  const handleExportExcel = () => {
    const data = transactions.map((t) => ({
      "Transaction Ref": t.trxCode,
      "Counterparty / Entity": t.partyName,
      "Transaction Type": t.type,
      "Associated Territory": t.territory,
      "Amount (৳)": t.amount,
      Date: t.date,
      "Settlement Status": t.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Finance Overview");
    XLSX.writeFile(workbook, `AK_Pharma_Financial_Overview_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredTransactions =
    filterType === "all"
      ? transactions
      : transactions.filter((t) => t.type.toLowerCase().includes(filterType.toLowerCase()));

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Financial Health & Commercial Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Macro revenue performance, field expense burn rates, accounts receivable, and cash settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="text-xs font-semibold text-slate-800 bg-white border-slate-200 px-3 py-1.5 rounded-lg">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5 inline text-slate-600" />
            Fiscal Q3 2026
          </Badge>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3.5 rounded-lg shadow-none"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Finance Sheet
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Gross Revenue Billed */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Gross Billed Turnover</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            ৳1,94,70,000
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>+11.8% vs last month</span>
          </div>
        </Card>

        {/* Realized Cash Collections */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Realized Collections</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            ৳1,82,40,000
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            93.6% Collection recovery efficiency
          </p>
        </Card>

        {/* Accounts Receivable (A/R) */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Accounts Receivable (A/R)</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            ৳12,30,000
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-3">
            ৳67,500 currently past 45-day credit term
          </p>
        </Card>

        {/* Operational Burn & Field Allowances */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Operational Burn & DA/TA</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            ৳51,20,000
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Includes sample costs, MIO allowance & dispatch
          </p>
        </Card>
      </div>

      {/* 3. Middle Charts: Dual-Tone Cash Flow Area & Expense Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Six-Month Inflow vs Outflow */}
        <Card className="lg:col-span-8 rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Commercial Cash Flow Run-Rate (in Lakh ৳)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Billed sales revenue versus collected cash against operational burn
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
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <span>Burn</span>
              </div>
            </div>
          </div>

          <div className="h-[270px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717A" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717A" }} />
                <Tooltip
                  cursor={{ stroke: "#e2e8f0" }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                  formatter={(val) => [`৳${val} Lakh`, ""]}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#0090FF" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="Collections" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorColl)" />
                <Area type="monotone" dataKey="Expenses" stroke="#94a3b8" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Operating Margin Breakdown Card */}
        <Card className="lg:col-span-4 rounded-xl border border-slate-200/90 shadow-none bg-white p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Commercial Margin Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Realized net margins after operational allocations</p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">COGS & API Sourcing</span>
                  <span className="font-mono font-bold text-slate-900">54.2%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800 rounded-full" style={{ width: "54.2%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">Field Force & Sampling</span>
                  <span className="font-mono font-bold text-slate-900">18.4%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0090FF] rounded-full" style={{ width: "18.4%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">Warehouse & Logistics</span>
                  <span className="font-mono font-bold text-slate-900">7.8%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-300 rounded-full" style={{ width: "7.8%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-emerald-700 font-semibold">Net Operating Profit</span>
                  <span className="font-mono font-bold text-emerald-700">19.6%</span>
                </div>
                <div className="h-2 w-full bg-emerald-50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "19.6%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-xs mt-4">
            <span className="font-semibold text-slate-800 block">Audited Net Profit</span>
            <span className="text-lg font-bold text-slate-900 block font-mono mt-0.5">৳38,16,000</span>
            <span className="text-[10px] text-slate-400">Current active monthly period</span>
          </div>
        </Card>
      </div>

      {/* 4. Transactions Ledger Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Recent Commercial Invoices & Field Disbursements
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Audited payments, credit term disbursements, and chemist settlement receipts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 w-[160px] text-xs bg-white border-slate-200">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="pharmacy invoice">Pharmacy Invoice</SelectItem>
                <SelectItem value="mio field allowance">Field Allowance</SelectItem>
                <SelectItem value="wholesale deposit">Wholesale Deposit</SelectItem>
                <SelectItem value="batch procurement">Procurement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Reference ID</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Counterparty / Description</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Transaction Type</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Territory / Node</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Billing Date</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Amount (৳)</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((tx) => (
              <TableRow key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <TableCell className="py-3 text-xs font-mono font-semibold text-[#0090FF] pl-0">
                  {tx.trxCode}
                </TableCell>
                <TableCell className="py-3 text-xs font-semibold text-slate-900">
                  {tx.partyName}
                </TableCell>
                <TableCell className="py-3 text-xs">
                  <Badge variant="outline" className="text-[10px] font-medium bg-slate-50 text-slate-700 border-slate-200">
                    {tx.type}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-600">
                  {tx.territory}
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-600">
                  {tx.date}
                </TableCell>
                <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                  ৳{tx.amount.toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="py-3 text-xs text-right pr-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      tx.status === "Settled"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : tx.status === "Pending Clearance"
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-rose-700 bg-rose-50 border-rose-200"
                    }`}
                  >
                    {tx.status}
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