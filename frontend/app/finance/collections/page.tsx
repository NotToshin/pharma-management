"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
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
  Search,
  Filter,
  Download,
  UserCheck,
  Wallet,
} from "lucide-react";

interface CollectionItem {
  id: string;
  invoiceNo: string;
  chemistName: string;
  territory: string;
  salesRepName: string;
  totalInvoiceAmount: number;
  currentCollection: number;
  status: "Realized" | "Partial" | "Pending";
}

export default function CollectionsPage() {
  const [collections, setCollections] = React.useState<CollectionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Settlement Modal State
  const [isSettlementOpen, setIsSettlementOpen] = React.useState(false);
  const [destinationType, setDestinationType] = React.useState<"Cash Drawer" | "Bank Account">("Cash Drawer");
  const [targetBank, setTargetBank] = React.useState("Eastern Bank PLC (Corporate Ops)");
  const [cashSafeName, setCashSafeName] = React.useState("Head Office Cash Safe");

  // Fetch live orders connected from clients & logistics
  const fetchCollections = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/orders`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();

      const mapped = data.map((ord: any, idx: number) => {
        const val = Number(ord.orderValue) || 25000;
        const isDelivered = ord.status === "Delivered & Invoiced";
        return {
          id: ord.id || `col-${idx}`,
          invoiceNo: ord.invoiceNumber || `INV-2026-${9010 + idx}`,
          chemistName: ord.pharmacyName || "Registered Chemist",
          territory: ord.territory || "Dhaka North",
          salesRepName: ord.assignedMio || "Unassigned MIO",
          totalInvoiceAmount: val,
          currentCollection: isDelivered ? val : 0,
          status: isDelivered ? "Realized" : "Pending",
        };
      });

      setCollections(mapped);
      setLoading(false);
    } catch (err) {
      console.error("Error loading collections:", err);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCollections();
  }, []);

  const handleUpdateAmount = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setCollections((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const status =
            num >= item.totalInvoiceAmount
              ? "Realized"
              : num > 0
              ? "Partial"
              : "Pending";
          return {
            ...item,
            currentCollection: num,
            status: status as CollectionItem["status"],
          };
        }
        return item;
      })
    );
  };

  const totalCollected = collections.reduce((acc, curr) => acc + curr.currentCollection, 0);

  const handleSettleAndPost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const destination = destinationType === "Cash Drawer" ? cashSafeName : targetBank;

      await fetch(`${API_URL}/treasury/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationType,
          destinationName: destination,
          amount: totalCollected,
        }),
      });

      setIsSettlementOpen(false);
      alert(`Successfully posted ৳${totalCollected.toLocaleString("en-IN")} to [${destinationType}] -> ${destination}.`);
    } catch (error) {
      console.error("Error posting settlement:", error);
      alert("Failed to post settlement to treasury ledger.");
    }
  };

  const handleExportExcel = () => {
    const data = collections.map((c) => ({
      "Invoice #": c.invoiceNo,
      "Chemist / Pharmacy": c.chemistName,
      Territory: c.territory,
      "Sales Rep (MIO)": c.salesRepName,
      "Invoice Amount (৳)": c.totalInvoiceAmount,
      "Collected Amount (৳)": c.currentCollection,
      "Status": c.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Collections");
    XLSX.writeFile(workbook, `AK_Pharma_Collections_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredCollections = collections.filter((item) => {
    const matchesSearch =
      item.chemistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.salesRepName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-16 font-sans text-neutral-900">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-neutral-200 p-5 rounded-xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400 font-bold">
              FINANCE & TREASURY • CASH & BANK REALIZATION
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Collections & Safe / Bank Settlement
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Realize payments from delivered logistics orders and post funds to physical cash safes or corporate bank accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg gap-1.5 shadow-none"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" /> Export Sheet
          </Button>

          <Button
            size="sm"
            onClick={() => setIsSettlementOpen(true)}
            className="h-9 text-xs font-semibold bg-[#0090FF] hover:bg-[#0080e5] text-white rounded-lg shadow-none gap-1.5"
          >
            <Wallet className="h-3.5 w-3.5" /> Settle Realized Funds (৳{totalCollected.toLocaleString("en-IN")})
          </Button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search chemist, invoice #, or sales rep..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[160px] text-xs bg-white border-slate-200">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="text-xs">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="realized">Realized</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 3. Collections Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Active Logistics Invoices & Collections
            </h3>
            <p className="text-xs text-slate-400">Live orders linked from client master & logistics dispatch</p>
          </div>
          <span className="text-xs text-slate-400 font-medium font-mono">
            Total Realized: <strong className="text-emerald-700">৳{totalCollected.toLocaleString("en-IN")}</strong>
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 font-semibold">
              <TableHead className="pl-0">Invoice & Chemist</TableHead>
              <TableHead>Territory</TableHead>
              <TableHead>Assigned Sales Rep (MIO)</TableHead>
              <TableHead className="text-right">Total Invoice (৳)</TableHead>
              <TableHead className="text-right">Collected Amount (৳)</TableHead>
              <TableHead className="text-right pr-0">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                  Loading collections from logistics orders...
                </TableCell>
              </TableRow>
            ) : filteredCollections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                  No collection records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCollections.map((item) => (
                <TableRow key={item.id} className="border-b border-slate-50 text-xs hover:bg-slate-50/50">
                  <TableCell className="py-3.5 pl-0">
                    <strong className="text-slate-900 block">{item.chemistName}</strong>
                    <span className="font-mono text-[10px] text-[#0090FF]">{item.invoiceNo}</span>
                  </TableCell>

                  <TableCell className="py-3.5 text-slate-700">
                    {item.territory}
                  </TableCell>

                  <TableCell className="py-3.5 text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <UserCheck className="h-3 w-3 text-slate-400" />
                      <span>{item.salesRepName}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5 text-right font-mono text-slate-700">
                    ৳{item.totalInvoiceAmount.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="py-3.5 text-right font-mono">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-slate-400">৳</span>
                      <Input
                        type="number"
                        value={item.currentCollection}
                        onChange={(e) => handleUpdateAmount(item.id, e.target.value)}
                        className="h-7 w-28 text-xs font-mono font-bold text-right bg-white border-slate-200"
                      />
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5 text-right pr-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        item.status === "Realized"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : item.status === "Partial"
                          ? "text-blue-700 bg-blue-50 border-blue-200"
                          : "text-amber-700 bg-amber-50 border-amber-200"
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Settle to Safe or Bank Modal */}
      <Dialog open={isSettlementOpen} onOpenChange={setIsSettlementOpen}>
        <DialogContent className="sm:max-w-[440px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Settle & Post Realized Funds</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Choose whether funds are retained as physical cash in office safe or deposited into bank.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSettleAndPost} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Destination Type</Label>
              <Select value={destinationType} onValueChange={(v: any) => setDestinationType(v)}>
                <SelectTrigger className="h-8 text-xs bg-white font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="Cash Drawer">Physical Cash Safe</SelectItem>
                  <SelectItem value="Bank Account">Corporate Bank Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {destinationType === "Cash Drawer" ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Select Cash Safe</Label>
                <Select value={cashSafeName} onValueChange={setCashSafeName}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Head Office Cash Safe">Head Office Cash Safe</SelectItem>
                    <SelectItem value="CEO Cash Safe">CEO Cash Safe</SelectItem>
                    <SelectItem value="Chairman Cash Safe">Chairman Cash Safe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Select Corporate Bank Account</Label>
                <Select value={targetBank} onValueChange={setTargetBank}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Eastern Bank PLC (Corporate Ops)">Eastern Bank PLC (Corporate Ops)</SelectItem>
                    <SelectItem value="Islami Bank Bangladesh PLC (Wholesale)">Islami Bank Bangladesh PLC (Wholesale)</SelectItem>
                    <SelectItem value="Standard Chartered Bank (LC Escrow)">Standard Chartered Bank (LC Escrow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs flex justify-between items-center">
              <span className="text-slate-600 font-sans">Total Realized Amount:</span>
              <strong className="text-emerald-700 text-sm">৳{totalCollected.toLocaleString("en-IN")}</strong>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSettlementOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white font-semibold">
                Confirm & Post to Ledger
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}