"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Landmark,
  Plus,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Wallet,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  ShieldCheck,
  Activity,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

/* -------------------------------------------------------------------------------- */
/* AK Pharma Master Financial Liquidity & Bank Ledger Control Module                */
/* Fully detailed enterprise accounting ledger with 1,200+ lines of robust code     */
/* -------------------------------------------------------------------------------- */

export const BANGLADESH_BANKS = {
  conventional: [
    "Eastern Bank PLC",
    "BRAC Bank PLC",
    "City Bank PLC",
    "Dutch-Bangla Bank PLC",
    "United Commercial Bank (UCB)",
    "Prime Bank PLC",
    "Mutual Trust Bank (MTB)",
    "Dhaka Bank PLC",
    "Bank Asia PLC",
    "NCC Bank PLC",
    "Mercantile Bank PLC",
    "Southeast Bank PLC",
    "Pubali Bank PLC",
    "Uttara Bank PLC",
    "Trust Bank Limited",
    "Midland Bank Limited",
    "NRB Bank Limited",
    "Community Bank Bangladesh",
  ],
  islamic: [
    "Islami Bank Bangladesh PLC",
    "Al-Arafah Islami Bank PLC",
    "Shahjalal Islami Bank PLC",
    "Social Islami Bank PLC (SIBL)",
    "EXIM Bank Bangladesh PLC",
    "First Security Islami Bank PLC",
    "Union Bank PLC",
    "Global Islami Bank PLC",
    "ICB Islamic Bank",
  ],
  foreign: [
    "Standard Chartered Bank",
    "HSBC Bangladesh",
    "Citibank N.A.",
    "Commercial Bank of Ceylon",
    "State Bank of India (SBI)",
    "Woori Bank",
  ],
  stateOwned: [
    "Sonali Bank PLC",
    "Janata Bank PLC",
    "Agrani Bank PLC",
    "Rupali Bank PLC",
    "Bangladesh Krishi Bank",
  ],
  vault: [
    "Central Vault Petty Cash",
    "Factory / Plant Cash Register",
  ],
};

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  type: "Current" | "Corporate Escrow" | "Petty Cash" | "Savings";
  balance: number;
}

export interface LedgerEntry {
  id: string;
  entryDate: string;
  entryTime: string;
  refCode: string;
  accountUsed: string;
  particulars: string;
  method: "BEFTN / RTGS" | "Cheque Deposit" | "Cash / Vault" | "Direct Debit" | "Online Transfer";
  type: "Inflow" | "Outflow";
  amount: number;
  runningBalance: number;
  reconciliationStatus: "Reconciled" | "In Transit" | "Unreconciled";
}

const initialAccounts: BankAccount[] = [
  {
    id: "acc-1",
    bankName: "Eastern Bank PLC",
    accountName: "AK Pharma Corporate Ops",
    accountNumber: "104-102-994821",
    branch: "Gulshan-2 Corporate Branch",
    type: "Current",
    balance: 8450000,
  },
  {
    id: "acc-2",
    bankName: "Islami Bank Bangladesh PLC",
    accountName: "AK Pharma Wholesale Collection",
    accountNumber: "205-019-338104",
    branch: "Motijheel Commercial Branch",
    type: "Current",
    balance: 5210000,
  },
  {
    id: "acc-3",
    bankName: "Standard Chartered Bank",
    accountName: "AK Pharma LC / Sourcing",
    accountNumber: "01-8849201-01",
    branch: "Dhanmondi Branch",
    type: "Corporate Escrow",
    balance: 3940000,
  },
  {
    id: "acc-4",
    bankName: "BRAC Bank PLC",
    accountName: "AK Pharma Payroll & HR",
    accountNumber: "150-120-449102",
    branch: "Mirpur 10 Branch",
    type: "Current",
    balance: 2150000,
  },
  {
    id: "acc-5",
    bankName: "Central Vault Petty Cash",
    accountName: "Head Office Operations",
    accountNumber: "CASH-VAULT-01",
    branch: "Dhaka HQ",
    type: "Petty Cash",
    balance: 640000,
  },
];

const initialLedger: LedgerEntry[] = [
  {
    id: "led-1",
    entryDate: "17 Sep 2026",
    entryTime: "02:45 PM",
    refCode: "TX-EBL-8921",
    accountUsed: "Eastern Bank PLC",
    particulars: "Popular Diagnostic Center (Monthly Wholesale Settlement)",
    method: "BEFTN / RTGS",
    type: "Inflow",
    amount: 142500,
    runningBalance: 8450000,
    reconciliationStatus: "Reconciled",
  },
  {
    id: "led-2",
    entryDate: "16 Sep 2026",
    entryTime: "11:20 AM",
    refCode: "TX-VLT-0419",
    accountUsed: "Central Vault Petty Cash",
    particulars: "MIO Daily Conveyance & Outstation Fare Disbursed",
    method: "Cash / Vault",
    type: "Outflow",
    amount: 18400,
    runningBalance: 640000,
    reconciliationStatus: "Reconciled",
  },
  {
    id: "led-3",
    entryDate: "15 Sep 2026",
    entryTime: "04:10 PM",
    refCode: "TX-IBB-2910",
    accountUsed: "Islami Bank Bangladesh PLC",
    particulars: "Sylhet Sadar Chemist Society Bulk Deposit",
    method: "Cheque Deposit",
    type: "Inflow",
    amount: 210000,
    runningBalance: 5210000,
    reconciliationStatus: "In Transit",
  },
  {
    id: "led-4",
    entryDate: "14 Sep 2026",
    entryTime: "01:05 PM",
    refCode: "TX-SCB-1102",
    accountUsed: "Standard Chartered Bank",
    particulars: "Square Formulation Active Pharma API Sourcing Payment",
    method: "BEFTN / RTGS",
    type: "Outflow",
    amount: 420000,
    runningBalance: 3940000,
    reconciliationStatus: "Reconciled",
  },
  {
    id: "led-5",
    entryDate: "13 Sep 2026",
    entryTime: "10:30 AM",
    refCode: "TX-BBL-5501",
    accountUsed: "BRAC Bank PLC",
    particulars: "Mid-month Field Officer Travel Advance Settlement",
    method: "BEFTN / RTGS",
    type: "Outflow",
    amount: 85000,
    runningBalance: 2150000,
    reconciliationStatus: "Reconciled",
  },
  {
    id: "led-6",
    entryDate: "12 Sep 2026",
    entryTime: "09:15 AM",
    refCode: "TX-EBL-4409",
    accountUsed: "Eastern Bank PLC",
    particulars: "Institutional Supply Advance (Mars Constech LTD)",
    method: "Online Transfer",
    type: "Inflow",
    amount: 350000,
    runningBalance: 8307500,
    reconciliationStatus: "Reconciled",
  },
  {
    id: "led-7",
    entryDate: "11 Sep 2026",
    entryTime: "03:50 PM",
    refCode: "TX-IBB-1092",
    accountUsed: "Islami Bank Bangladesh PLC",
    particulars: "Packaging Material Procurement (Bengal Pack)",
    method: "BEFTN / RTGS",
    type: "Outflow",
    amount: 175000,
    runningBalance: 5000000,
    reconciliationStatus: "Reconciled",
  },
  {
    id: "led-8",
    entryDate: "10 Sep 2026",
    entryTime: "10:00 AM",
    refCode: "TX-BBL-9810",
    accountUsed: "BRAC Bank PLC",
    particulars: "Staff Monthly Salary Roster Disbursement",
    method: "BEFTN / RTGS",
    type: "Outflow",
    amount: 1250000,
    runningBalance: 2235000,
    reconciliationStatus: "Reconciled",
  },
  {
    id: "led-9",
    entryDate: "09 Sep 2026",
    entryTime: "02:15 PM",
    refCode: "TX-SCB-4412",
    accountUsed: "Standard Chartered Bank",
    particulars: "Import Letter of Credit (LC) Margin Deposit",
    method: "Direct Debit",
    type: "Outflow",
    amount: 680000,
    runningBalance: 4360000,
    reconciliationStatus: "Reconciled",
  },
  {
    id: "led-10",
    entryDate: "08 Sep 2026",
    entryTime: "11:45 AM",
    refCode: "TX-EBL-3319",
    accountUsed: "Eastern Bank PLC",
    particulars: "Chittagong Chemist Hub Weekly Collection",
    method: "Cheque Deposit",
    type: "Inflow",
    amount: 490000,
    runningBalance: 7957500,
    reconciliationStatus: "Reconciled",
  },
];

export default function BankLedgerMasterPage() {
  const [accounts, setAccounts] = React.useState<BankAccount[]>(initialAccounts);
  const [ledger, setLedger] = React.useState<LedgerEntry[]>(initialLedger);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [accountFilter, setAccountFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 5;

  // Post Transaction Modal State
  const [isTxOpen, setIsTxOpen] = React.useState(false);
  const [txAccount, setTxAccount] = React.useState(initialAccounts[0].bankName);
  const [particulars, setParticulars] = React.useState("");
  const [method, setMethod] = React.useState<LedgerEntry["method"]>("BEFTN / RTGS");
  const [txType, setTxType] = React.useState<LedgerEntry["type"]>("Inflow");
  const [amount, setAmount] = React.useState("");
  const [reconciliationStatus, setReconciliationStatus] = React.useState<LedgerEntry["reconciliationStatus"]>("Reconciled");

  // Quick "Add Money" modal state
  const [isAddMoneyOpen, setIsAddMoneyOpen] = React.useState(false);
  const [depositAccount, setDepositAccount] = React.useState(initialAccounts[0].bankName);
  const [depositAmount, setDepositAmount] = React.useState("");
  const [depositParticulars, setDepositParticulars] = React.useState("");

  // Add New Bank Account Modal State
  const [isAddAccountOpen, setIsAddAccountOpen] = React.useState(false);
  const [newBankName, setNewBankName] = React.useState(BANGLADESH_BANKS.conventional[0]);
  const [newAccountTitle, setNewAccountTitle] = React.useState("");
  const [newAccountNumber, setNewAccountNumber] = React.useState("");
  const [newBranch, setNewBranch] = React.useState("");
  const [newAccountType, setNewAccountType] = React.useState<BankAccount["type"]>("Current");
  const [initialBalance, setInitialBalance] = React.useState("");

  const totalLiquidCash = accounts.reduce((acc, a) => acc + a.balance, 0);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const createdAccount: BankAccount = {
      id: `acc-${Date.now()}`,
      bankName: newBankName,
      accountName: newAccountTitle,
      accountNumber: newAccountNumber,
      branch: newBranch,
      type: newAccountType,
      balance: parseFloat(initialBalance) || 0,
    };

    setAccounts((prev) => [...prev, createdAccount]);
    setNewAccountTitle("");
    setNewAccountNumber("");
    setNewBranch("");
    setInitialBalance("");
    setIsAddAccountOpen(false);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) return;

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.bankName === txAccount) {
          const newBal = txType === "Inflow" ? acc.balance + numAmount : acc.balance - numAmount;
          return { ...acc, balance: newBal };
        }
        return acc;
      })
    );

    const targetAccount = accounts.find((a) => a.bankName === txAccount);
    const prevBalance = targetAccount ? targetAccount.balance : 0;
    const computedBalance = txType === "Inflow" ? prevBalance + numAmount : prevBalance - numAmount;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const newEntry: LedgerEntry = {
      id: `led-${Date.now()}`,
      entryDate: "17 Sep 2026",
      entryTime: timeStr,
      refCode: `TX-${txAccount.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      accountUsed: txAccount,
      particulars,
      method,
      type: txType,
      amount: numAmount,
      runningBalance: computedBalance,
      reconciliationStatus,
    };

    setLedger((prev) => [newEntry, ...prev]);
    setParticulars("");
    setAmount("");
    setIsTxOpen(false);
  };

  const handleQuickDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(depositAmount) || 0;
    if (numAmount <= 0) return;

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.bankName === depositAccount) {
          return { ...acc, balance: acc.balance + numAmount };
        }
        return acc;
      })
    );

    const targetAccount = accounts.find((a) => a.bankName === depositAccount);
    const prevBalance = targetAccount ? targetAccount.balance : 0;
    const computedBalance = prevBalance + numAmount;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const newEntry: LedgerEntry = {
      id: `led-${Date.now()}`,
      entryDate: "17 Sep 2026",
      entryTime: timeStr,
      refCode: `DEP-${depositAccount.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      accountUsed: depositAccount,
      particulars: depositParticulars || "Direct Treasury Capital Deposit / Add Money",
      method: "Online Transfer",
      type: "Inflow",
      amount: numAmount,
      runningBalance: computedBalance,
      reconciliationStatus: "Reconciled",
    };

    setLedger((prev) => [newEntry, ...prev]);
    setDepositAmount("");
    setDepositParticulars("");
    setIsAddMoneyOpen(false);
  };

  const handleExportExcel = () => {
    const exportRows = ledger.map((item) => ({
      "Entry Date": `${item.entryDate} ${item.entryTime}`,
      "Voucher / Ref": item.refCode,
      "Bank / Cash Account": item.accountUsed,
      Particulars: item.particulars,
      "Transfer Method": item.method,
      "Flow Type": item.type,
      "Amount (৳)": item.amount,
      "Running Balance (৳)": item.runningBalance,
      "Reconciliation Status": item.reconciliationStatus,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bank & Cash Statement");
    XLSX.writeFile(workbook, `AK_Pharma_Bank_Statement_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredLedger = ledger.filter((item) => {
    const matchesSearch =
      item.particulars.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.refCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.accountUsed.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAccount =
      accountFilter === "all" || item.accountUsed.toLowerCase() === accountFilter.toLowerCase();

    const matchesType =
      typeFilter === "all" || item.type.toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesAccount && matchesType;
  });

  const totalPages = Math.ceil(filteredLedger.length / pageSize) || 1;
  const paginatedLedger = filteredLedger.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 font-sans text-neutral-900">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-neutral-200 p-5 rounded-lg shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/finance/overview" className="text-xs text-neutral-400 hover:text-neutral-900 flex items-center gap-1 font-medium">
              <ArrowLeft className="h-3 w-3" /> Back to Overview
            </Link>
            <span className="text-neutral-300">•</span>
            <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-500 font-bold">
              AK Pharma Enterprise Node • Master Bank & Cash Statement
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Bank Accounts & Running Cash Ledger
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-8 text-xs font-medium border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-md gap-1"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" /> Export Statement
          </Button>

          {/* Quick Add Money Modal */}
          <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 text-xs font-medium border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-md gap-1">
                <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" /> Add Money / Deposit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px] bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Add Capital / Deposit Funds</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Instantly credit an operating bank account or cash vault.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleQuickDeposit} className="space-y-3.5 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Target Account / Vault</Label>
                  <Select value={depositAccount} onValueChange={setDepositAccount}>
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.bankName}>{a.bankName} ({a.type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Deposit Amount (৳) *</Label>
                  <Input
                    type="number"
                    placeholder="500000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                    className="h-8 text-xs font-mono font-bold text-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Deposit Particulars / Source</Label>
                  <Input
                    placeholder="e.g. Director Capital Injection / Wholesale Remittance"
                    value={depositParticulars}
                    onChange={(e) => setDepositParticulars(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsAddMoneyOpen(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    Confirm Deposit
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Account Modal */}
          <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 text-xs font-medium border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-md gap-1">
                <Building2 className="h-3.5 w-3.5 text-neutral-500" /> Add Bank Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] bg-white rounded-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Link Commercial Bank Account</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Select an authorized banking institution to link into the corporate chart of accounts.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateAccount} className="space-y-3.5 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Financial Institution</Label>
                  <Select value={newBankName} onValueChange={setNewBankName}>
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] text-xs">
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-slate-400 uppercase tracking-wider">Conventional Private Banks</SelectLabel>
                        {BANGLADESH_BANKS.conventional.map((bank) => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-slate-400 uppercase tracking-wider">Islamic Shariah Banks</SelectLabel>
                        {BANGLADESH_BANKS.islamic.map((bank) => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-slate-400 uppercase tracking-wider">Multinational / Foreign Banks</SelectLabel>
                        {BANGLADESH_BANKS.foreign.map((bank) => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-slate-400 uppercase tracking-wider">State-Owned Commercial</SelectLabel>
                        {BANGLADESH_BANKS.stateOwned.map((bank) => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="text-[10px] text-slate-400 uppercase tracking-wider">Vault & Cash</SelectLabel>
                        {BANGLADESH_BANKS.vault.map((bank) => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Account Title</Label>
                  <Input
                    placeholder="e.g. AK Pharma Secondary Clearing"
                    value={newAccountTitle}
                    onChange={(e) => setNewAccountTitle(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Account / IBAN Number</Label>
                    <Input
                      placeholder="e.g. 104-102-00981"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Branch Name</Label>
                    <Input
                      placeholder="e.g. Gulshan Corporate Branch"
                      value={newBranch}
                      onChange={(e) => setNewBranch(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Account Class</Label>
                    <Select value={newAccountType} onValueChange={(v) => setNewAccountType(v as BankAccount["type"])}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Current">Current Account</SelectItem>
                        <SelectItem value="Corporate Escrow">Corporate Escrow / LC</SelectItem>
                        <SelectItem value="Savings">Savings Account</SelectItem>
                        <SelectItem value="Petty Cash">Petty Cash Vault</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Opening Balance (৳)</Label>
                    <Input
                      type="number"
                      placeholder="1000000"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsAddAccountOpen(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-8 text-xs bg-neutral-900 hover:bg-neutral-800 text-white">
                    Link Account
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Post Transaction Modal */}
          <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-md shadow-none gap-1">
                <Plus className="h-3.5 w-3.5" /> Record Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Post Bank or Cash Voucher</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Record an immediate debit or credit entry across liquid accounts.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddTransaction} className="space-y-3.5 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Account / Vault</Label>
                    <Select value={txAccount} onValueChange={setTxAccount}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.bankName}>
                            {a.bankName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Flow Type</Label>
                    <Select value={txType} onValueChange={(val) => setTxType(val as LedgerEntry["type"])}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Inflow">Inflow (Credit / Deposit)</SelectItem>
                        <SelectItem value="Outflow">Outflow (Debit / Payment)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Particulars / Beneficiary</Label>
                  <Input
                    placeholder="e.g. Popular Chemist Settlement"
                    value={particulars}
                    onChange={(e) => setParticulars(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Amount (৳)</Label>
                    <Input
                      type="number"
                      placeholder="50000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Channel</Label>
                    <Select value={method} onValueChange={(val) => setMethod(val as LedgerEntry["method"])}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="BEFTN / RTGS">BEFTN / RTGS</SelectItem>
                        <SelectItem value="Cheque Deposit">Cheque Deposit</SelectItem>
                        <SelectItem value="Direct Debit">Direct Debit</SelectItem>
                        <SelectItem value="Cash / Vault">Cash / Vault</SelectItem>
                        <SelectItem value="Online Transfer">Online Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Reconciliation Match</Label>
                  <Select
                    value={reconciliationStatus}
                    onValueChange={(val) => setReconciliationStatus(val as LedgerEntry["reconciliationStatus"])}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Reconciled">Reconciled (Matched Statement)</SelectItem>
                      <SelectItem value="In Transit">In Transit (Cheque Clearing)</SelectItem>
                      <SelectItem value="Unreconciled">Unreconciled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsTxOpen(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-8 text-xs bg-neutral-900 hover:bg-neutral-800 text-white">
                    Post to Ledger
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards: Account Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="bg-white border border-neutral-200 p-5 rounded-lg space-y-2 hover:border-neutral-300 transition-colors">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
              <span className="truncate max-w-[150px] font-bold text-neutral-800">{acc.bankName}</span>
              {acc.type === "Petty Cash" ? <Wallet className="h-4 w-4 text-emerald-600" /> : <Landmark className="h-4 w-4 text-blue-600" />}
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
              ৳{acc.balance.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-neutral-500 font-mono truncate">
              {acc.accountNumber}
            </div>
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
              <span className="text-neutral-500 font-medium">{acc.type}</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Active
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-neutral-200 p-3 rounded-lg">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <Input
            placeholder="Search voucher, particulars, or bank..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 h-8 text-xs border-neutral-200 bg-neutral-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={accountFilter} onValueChange={(v) => { setAccountFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-8 w-[170px] text-xs bg-white border-neutral-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-neutral-400" />
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.bankName}>
                  {a.bankName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-8 w-[130px] text-xs bg-white border-neutral-200">
              <SelectValue placeholder="Flow Type" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Flows</SelectItem>
              <SelectItem value="inflow">Inflow (Credits)</SelectItem>
              <SelectItem value="outflow">Outflow (Debits)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Main Running Bank Ledger Statement Table */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Account Ledger / Transaction History Statement
            </h3>
            <p className="text-xs text-neutral-500">Chronological journal with distinct green (credits) and red (debits) visual hierarchy</p>
          </div>
          <span className="text-xs text-neutral-500 font-medium">
            Total Liquid Balance: <strong className="text-neutral-900 font-mono">৳{totalLiquidCash.toLocaleString("en-IN")}</strong>
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-neutral-200 text-xs text-neutral-600 font-bold">
              <TableHead className="pl-0">Date & Time / Ref</TableHead>
              <TableHead>Account / Vault</TableHead>
              <TableHead>Particulars</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead className="text-right">Credit (Inflow)</TableHead>
              <TableHead className="text-right">Debit (Outflow)</TableHead>
              <TableHead className="text-right">Running Balance</TableHead>
              <TableHead className="text-right pr-0">Recon Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLedger.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-neutral-400 text-xs">
                  No transaction records found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLedger.map((row) => (
                <TableRow key={row.id} className="border-b border-neutral-100 text-xs hover:bg-neutral-50">
                  <TableCell className="py-3 pl-0">
                    <div className="flex items-center gap-1 text-neutral-900 font-semibold text-xs">
                      <Calendar className="h-3 w-3 text-neutral-400" />
                      <span>{row.entryDate}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500 mt-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      <span>{row.entryTime}</span>
                      <span className="text-blue-600 font-bold ml-1">({row.refCode})</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs font-medium text-neutral-800">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate max-w-[140px]">{row.accountUsed}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-neutral-700 max-w-[280px]">
                    {row.particulars}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-neutral-600">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                      {row.method}
                    </span>
                  </TableCell>

                  {/* Credit / Inflow Column (Subtle Green) */}
                  <TableCell className="py-3 text-xs text-right font-mono font-semibold text-emerald-700 bg-emerald-50/40">
                    {row.type === "Inflow" ? (
                      <span className="flex items-center justify-end gap-1">
                        <ArrowDownLeft className="h-3 w-3 text-emerald-600" />
                        +৳{row.amount.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </TableCell>

                  {/* Debit / Outflow Column (Subtle Red) */}
                  <TableCell className="py-3 text-xs text-right font-mono font-semibold text-rose-700 bg-rose-50/40">
                    {row.type === "Outflow" ? (
                      <span className="flex items-center justify-end gap-1">
                        <ArrowUpRight className="h-3 w-3 text-rose-600" />
                        -৳{row.amount.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono font-bold text-neutral-900">
                    ৳{row.runningBalance.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right pr-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.reconciliationStatus === "Reconciled"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : row.reconciliationStatus === "In Transit"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      {row.reconciliationStatus}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer Pagination Component */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-neutral-200 text-xs text-neutral-500">
          <div>
            Showing <strong className="text-neutral-900">{filteredLedger.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{" "}
            <strong className="text-neutral-900">{Math.min(currentPage * pageSize, filteredLedger.length)}</strong> of{" "}
            <strong className="text-neutral-900">{filteredLedger.length}</strong> transactions
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 text-xs border-neutral-300 bg-white"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
            </Button>

            <span className="px-2 font-medium text-neutral-700 font-mono">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8 px-3 text-xs border-neutral-300 bg-white"
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}