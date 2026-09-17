"use client";

import * as React from "react";
import Link from "next/link";
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
import {
  Wallet,
  Landmark,
  Banknote,
  ArrowRight,
  Search,
  Building2,
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

interface DetailedFinancialAccount {
  id: string;
  accountName: string;
  accountType: "Bank Account" | "Cash on Hand" | "Credit Card" | "Corporate Escrow";
  currency: string;
  currentBalance: number;
  accountNumber: string;
  institution: string;
  branchLocation: string;
  lastReconciled: string;
  status: "Active" | "Pending Audit" | "Frozen";
}

const detailedMockAccounts: DetailedFinancialAccount[] = [
  {
    id: "acc-101",
    accountName: "AK Pharma Corporate Ops",
    accountType: "Bank Account",
    currency: "BDT (৳)",
    currentBalance: 8450000,
    accountNumber: "104-102-994821",
    institution: "Eastern Bank PLC",
    branchLocation: "Gulshan-2 Corporate Branch",
    lastReconciled: "17 Sep 2026, 02:30 PM",
    status: "Active",
  },
  {
    id: "acc-102",
    accountName: "AK Pharma Wholesale Collection",
    accountType: "Bank Account",
    currency: "BDT (৳)",
    currentBalance: 5210000,
    accountNumber: "205-019-338104",
    institution: "Islami Bank Bangladesh PLC",
    branchLocation: "Motijheel Commercial Branch",
    lastReconciled: "16 Sep 2026, 04:15 PM",
    status: "Active",
  },
  {
    id: "acc-103",
    accountName: "AK Pharma LC & Sourcing Escrow",
    accountType: "Corporate Escrow",
    currency: "BDT (৳)",
    currentBalance: 3940000,
    accountNumber: "01-8849201-01",
    institution: "Standard Chartered Bank",
    branchLocation: "Dhanmondi Branch",
    lastReconciled: "15 Sep 2026, 11:00 AM",
    status: "Active",
  },
  {
    id: "acc-104",
    accountName: "Central Vault Petty Cash",
    accountType: "Cash on Hand",
    currency: "BDT (৳)",
    currentBalance: 640000,
    accountNumber: "CASH-VAULT-01",
    institution: "Head Office Operations",
    branchLocation: "Tejgaon Industrial Area, Dhaka",
    lastReconciled: "17 Sep 2026, 09:00 AM",
    status: "Active",
  },
  {
    id: "acc-105",
    accountName: "Corporate Procurement Card",
    accountType: "Credit Card",
    currency: "BDT (৳)",
    currentBalance: -180000,
    accountNumber: "CC-9941-8821",
    institution: "City Bank PLC",
    branchLocation: "Gulshan Branch",
    lastReconciled: "14 Sep 2026, 05:45 PM",
    status: "Active",
  },
];

export default function DetailedFinancialOverviewDashboard() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");

  const totalBankBalances = detailedMockAccounts
    .filter((acc) => acc.accountType === "Bank Account" || acc.accountType === "Corporate Escrow")
    .reduce((acc, curr) => acc + curr.currentBalance, 0);

  const totalCashOnHand = detailedMockAccounts
    .filter((acc) => acc.accountType === "Cash on Hand")
    .reduce((acc, curr) => acc + curr.currentBalance, 0);

  const totalCreditUtilized = detailedMockAccounts
    .filter((acc) => acc.accountType === "Credit Card")
    .reduce((acc, curr) => acc + curr.currentBalance, 0);

  const totalLiquidity = totalBankBalances + totalCashOnHand + totalCreditUtilized;

  const filteredAccounts = detailedMockAccounts.filter((acc) => {
    const matchesSearch =
      acc.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.branchLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === "all" || acc.accountType.toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-16 font-sans text-neutral-900">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-neutral-200 p-5 rounded-lg shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-500 font-bold">
              AK Pharma Enterprise Node • Financial Overview (Step 1 Detailed)
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Treasury & Liquidity Overview
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/finance/bank-ledger">
            <Button
              size="sm"
              className="h-8 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-md shadow-none gap-1.5"
            >
              <span>View Master Ledger</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Detailed Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div className="bg-white border border-neutral-200 p-5 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Total Liquidity</span>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            ৳{totalLiquidity.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> 100% Reconciled Headroom
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Total Bank Balances</span>
            <Landmark className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            ৳{totalBankBalances.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium">
            3 Active Institutional Accounts
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Total Cash on Hand</span>
            <Banknote className="h-4 w-4 text-neutral-700" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            ৳{totalCashOnHand.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium">
            Tejgaon Central Vault Register
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Credit Line Utilized</span>
            <ArrowUpRight className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            ৳{Math.abs(totalCreditUtilized).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">
            City Bank Corporate Card
          </div>
        </div>

      </div>

      {/* 3. Detailed Account Breakdown Table */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Detailed Financial Account Breakdown & Status
            </h3>
            <p className="text-xs text-neutral-500">Roster of banking channels, branch locations, and last reconciliation stamps</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <Input
                placeholder="Search account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs w-[200px] border-neutral-200"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-[150px] text-xs border-neutral-200 bg-white">
                <SelectValue placeholder="Account Type" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bank account">Bank Account</SelectItem>
                <SelectItem value="corporate escrow">Corporate Escrow</SelectItem>
                <SelectItem value="cash on hand">Cash on Hand</SelectItem>
                <SelectItem value="credit card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-neutral-200 text-xs text-neutral-600">
              <TableHead className="pl-0">Account Name & Institution</TableHead>
              <TableHead>Account Type</TableHead>
              <TableHead>Branch & Location</TableHead>
              <TableHead>Last Reconciled</TableHead>
              <TableHead className="text-right">Current Balance</TableHead>
              <TableHead className="text-right pr-0">Actions (Step 2)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.map((acc) => {
              const isNegative = acc.currentBalance < 0;
              return (
                <TableRow key={acc.id} className="border-b border-neutral-100 text-xs hover:bg-neutral-50">
                  <TableCell className="py-3.5 pl-0">
                    <span className="font-bold block text-neutral-900">{acc.accountName}</span>
                    <span className="font-mono text-[10px] text-neutral-500">
                      {acc.institution} • {acc.accountNumber}
                    </span>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      acc.accountType === "Bank Account" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                      acc.accountType === "Corporate Escrow" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                      acc.accountType === "Cash on Hand" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {acc.accountType}
                    </span>
                  </TableCell>

                  <TableCell className="py-3.5 text-neutral-600">
                    {acc.branchLocation}
                  </TableCell>

                  <TableCell className="py-3.5 text-neutral-500 font-mono text-[11px]">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-neutral-400" />
                      <span>{acc.lastReconciled}</span>
                    </div>
                  </TableCell>

                  <TableCell className={`py-3.5 text-right font-mono font-bold ${isNegative ? "text-rose-600" : "text-neutral-900"}`}>
                    {isNegative ? `-৳${Math.abs(acc.currentBalance).toLocaleString("en-IN")}` : `৳${acc.currentBalance.toLocaleString("en-IN")}`}
                  </TableCell>

                  <TableCell className="py-3.5 text-right pr-0">
                    <Link href={`/finance/bank-ledger?account=${encodeURIComponent(acc.bankName)}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs font-medium border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-md gap-1"
                      >
                        <span>View Ledger</span>
                        <ExternalLink className="h-3 w-3 text-neutral-400" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}