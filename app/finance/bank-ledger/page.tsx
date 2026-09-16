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
} from "lucide-react";

// Master Directory of Operational Banks in Bangladesh
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

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  type: "Current" | "Corporate Escrow" | "Petty Cash" | "Savings";
  balance: number;
}

interface LedgerEntry {
  id: string;
  entryDate: string;
  refCode: string;
  accountUsed: string;
  particulars: string;
  method: "BEFTN / RTGS" | "Cheque Deposit" | "Cash / Vault" | "Direct Debit";
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
    entryDate: "16 Sep 2026",
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
    refCode: "TX-BBL-5501",
    accountUsed: "BRAC Bank PLC",
    particulars: "Mid-month Field Officer Travel Advance Settlement",
    method: "BEFTN / RTGS",
    type: "Outflow",
    amount: 85000,
    runningBalance: 2150000,
    reconciliationStatus: "Reconciled",
  },
];

export default function BankLedgerPage() {
  const [accounts, setAccounts] = React.useState<BankAccount[]>(initialAccounts);
  const [ledger, setLedger] = React.useState<LedgerEntry[]>(initialLedger);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [accountFilter, setAccountFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");

  // Post Transaction Modal State
  const [isTxOpen, setIsTxOpen] = React.useState(false);
  const [txAccount, setTxAccount] = React.useState(initialAccounts[0].bankName);
  const [particulars, setParticulars] = React.useState("");
  const [method, setMethod] = React.useState<LedgerEntry["method"]>("BEFTN / RTGS");
  const [txType, setTxType] = React.useState<LedgerEntry["type"]>("Inflow");
  const [amount, setAmount] = React.useState("");
  const [reconciliationStatus, setReconciliationStatus] = React.useState<LedgerEntry["reconciliationStatus"]>("Reconciled");

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

    const newEntry: LedgerEntry = {
      id: `led-${Date.now()}`,
      entryDate: "17 Sep 2026",
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

  const handleExportExcel = () => {
    const exportRows = ledger.map((item) => ({
      "Entry Date": item.entryDate,
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bank & Cash Ledger");
    XLSX.writeFile(workbook, `AK_Pharma_Bank_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
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

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Bank & Cash Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational liquidity across commercial, Islamic, foreign corporate accounts, and factory vaults.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3.5 rounded-lg shadow-none"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Ledger
          </Button>

          {/* Add Account Modal */}
          <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-9 gap-1.5 border-slate-200 bg-white text-slate-800 text-xs font-semibold px-3 rounded-lg shadow-none">
                <Building2 className="h-3.5 w-3.5 text-slate-600" />
                Add Bank Account
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
                  <Label htmlFor="bank-select" className="text-xs font-medium text-slate-700">Financial Institution</Label>
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
                  <Label htmlFor="acc-title" className="text-xs font-medium text-slate-700">Account Title</Label>
                  <Input
                    id="acc-title"
                    placeholder="e.g. AK Pharma Secondary Clearing"
                    value={newAccountTitle}
                    onChange={(e) => setNewAccountTitle(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="acc-num" className="text-xs font-medium text-slate-700">Account / IBAN Number</Label>
                    <Input
                      id="acc-num"
                      placeholder="e.g. 104-102-00981"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="branch" className="text-xs font-medium text-slate-700">Branch Name</Label>
                    <Input
                      id="branch"
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
                    <Label htmlFor="acc-type" className="text-xs font-medium text-slate-700">Account Class</Label>
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
                    <Label htmlFor="opening-bal" className="text-xs font-medium text-slate-700">Opening Balance (৳)</Label>
                    <Input
                      id="opening-bal"
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
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                    Link Account
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Post Transaction Modal */}
          <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none">
                <Plus className="h-4 w-4" />
                Record Transaction
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
                    <Label htmlFor="bank" className="text-xs font-medium text-slate-700">Account / Vault</Label>
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
                    <Label htmlFor="flow" className="text-xs font-medium text-slate-700">Flow Type</Label>
                    <Select value={txType} onValueChange={(val) => setTxType(val as LedgerEntry["type"])}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Inflow">Inflow (Deposit / Credit)</SelectItem>
                        <SelectItem value="Outflow">Outflow (Disbursed / Debit)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="particulars" className="text-xs font-medium text-slate-700">Particulars / Beneficiary</Label>
                  <Input
                    id="particulars"
                    placeholder="e.g. Popular Chemist Settlement"
                    value={particulars}
                    onChange={(e) => setParticulars(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-xs font-medium text-slate-700">Amount (৳)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="50000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="method" className="text-xs font-medium text-slate-700">Channel</Label>
                    <Select value={method} onValueChange={(val) => setMethod(val as LedgerEntry["method"])}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="BEFTN / RTGS">BEFTN / RTGS</SelectItem>
                        <SelectItem value="Cheque Deposit">Cheque Deposit</SelectItem>
                        <SelectItem value="Direct Debit">Direct Debit</SelectItem>
                        <SelectItem value="Cash / Vault">Cash / Vault</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="recon-status" className="text-xs font-medium text-slate-700">Reconciliation Match</Label>
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
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
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
          <Card key={acc.id} className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px]">
                {acc.bankName}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                {acc.type === "Petty Cash" ? <Wallet className="h-4 w-4" /> : <Landmark className="h-4 w-4" />}
              </div>
            </div>
            <div className="mt-3 text-[24px] font-bold tracking-tight text-slate-900 leading-none font-mono">
              ৳{acc.balance.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 truncate">
              {acc.accountNumber}
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
              <span className="text-slate-500 font-medium">{acc.type}</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Active
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search voucher, particulars, or bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="h-8 w-[170px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
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

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs bg-white border-slate-200">
              <SelectValue placeholder="Flow Type" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Flows</SelectItem>
              <SelectItem value="inflow">Inflow (Deposit)</SelectItem>
              <SelectItem value="outflow">Outflow (Debit)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Main Running Bank Ledger Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              BANK & CASH JOURNAL LEDGER
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cumulative cash journal with sequential debit/credit reconciliation balances
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total Available Liquidity: <strong className="text-slate-900 font-mono">৳{totalLiquidCash.toLocaleString("en-IN")}</strong>
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Date / Voucher</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Account / Vault</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Particulars</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Channel</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Inflow (Deposit)</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Outflow (Disbursed)</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Running Balance</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Recon Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLedger.map((row) => (
              <TableRow key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <TableCell className="py-3 pl-0">
                  <span className="text-xs font-semibold text-slate-900 block">{row.entryDate}</span>
                  <span className="text-[10px] font-mono text-[#0090FF]">{row.refCode}</span>
                </TableCell>
                <TableCell className="py-3 text-xs font-medium text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>{row.accountUsed}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-700 max-w-[280px]">
                  {row.particulars}
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-600">
                  <Badge variant="outline" className="text-[10px] font-normal bg-slate-50 text-slate-600 border-slate-200">
                    {row.method}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-xs text-right font-mono font-semibold text-emerald-600">
                  {row.type === "Inflow" ? `+৳${row.amount.toLocaleString("en-IN")}` : "—"}
                </TableCell>
                <TableCell className="py-3 text-xs text-right font-mono font-semibold text-rose-600">
                  {row.type === "Outflow" ? `-৳${row.amount.toLocaleString("en-IN")}` : "—"}
                </TableCell>
                <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                  ৳{row.runningBalance.toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="py-3 text-xs text-right pr-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      row.reconciliationStatus === "Reconciled"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : row.reconciliationStatus === "In Transit"
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-rose-700 bg-rose-50 border-rose-200"
                    }`}
                  >
                    {row.reconciliationStatus}
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