"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Store,
  Plus,
  Download,
  Search,
  Filter,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Printer,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  Building2,
  ShieldCheck,
  Truck,
  Receipt,
  Clock,
} from "lucide-react";

export interface ClientProfile {
  id: string;
  clientCode: string;
  pharmacyName: string;
  proprietor: string;
  phone: string;
  drugLicenseNo: string;
  tradeLicenseNo: string;
  address: string;
  territory: string;
  assignedMio: string;
  creditLimitBDT: number;
  outstandingBalanceBDT: number;
  creditTermDays: number;
  status: "Active / Healthy" | "Credit Hold" | "Watchlist";
  lastBilledDate: string;
}

const initialClients: ClientProfile[] = [
  {
    id: "cl-1",
    clientCode: "AKP-CL-101",
    pharmacyName: "Popular Pharmacy (Dhanmondi)",
    proprietor: "Kazi Motahar Hossain",
    phone: "+880 1711-223344",
    drugLicenseNo: "DL-DH-48210",
    tradeLicenseNo: "TRAD/DSCC/01928",
    address: "House 16, Road 2, Dhanmondi, Dhaka",
    territory: "Dhaka North",
    assignedMio: "Rafiqul Islam",
    creditLimitBDT: 250000,
    outstandingBalanceBDT: 40000,
    creditTermDays: 30,
    status: "Active / Healthy",
    lastBilledDate: "10 Aug 2026",
  },
  {
    id: "cl-2",
    clientCode: "AKP-CL-102",
    pharmacyName: "Labaid In-House Chemist (Uttara)",
    proprietor: "Mahbubur Rahman",
    phone: "+880 1819-334455",
    drugLicenseNo: "DL-DH-99104",
    tradeLicenseNo: "TRAD/DNCC/44910",
    address: "Sector 3, Uttara Model Town, Dhaka",
    territory: "Dhaka North",
    assignedMio: "Rafiqul Islam",
    creditLimitBDT: 500000,
    outstandingBalanceBDT: 0,
    creditTermDays: 45,
    status: "Active / Healthy",
    lastBilledDate: "20 Aug 2026",
  },
  {
    id: "cl-3",
    clientCode: "AKP-CL-103",
    pharmacyName: "Medinova Chemist Corner",
    proprietor: "Dr. Ashfaqul Haque",
    phone: "+880 1912-445566",
    drugLicenseNo: "DL-DH-33019",
    tradeLicenseNo: "TRAD/DSCC/88219",
    address: "Plot 12, Mirpur Road, Dhaka",
    territory: "Dhaka South",
    assignedMio: "Tanvir Ahmed",
    creditLimitBDT: 150000,
    outstandingBalanceBDT: 115000,
    creditTermDays: 30,
    status: "Watchlist",
    lastBilledDate: "12 Jul 2026",
  },
  {
    id: "cl-4",
    clientCode: "AKP-CL-104",
    pharmacyName: "Chevron Model Drug House",
    proprietor: "S. M. Jamaluddin",
    phone: "+880 1613-556677",
    drugLicenseNo: "DL-CTG-77210",
    tradeLicenseNo: "TRAD/CCC/11092",
    address: "12/A O.R. Nizam Road, Chittagong",
    territory: "Chittagong Central",
    assignedMio: "Kamrul Hasan",
    creditLimitBDT: 100000,
    outstandingBalanceBDT: 65000,
    creditTermDays: 21,
    status: "Credit Hold",
    lastBilledDate: "05 Jun 2026",
  },
  {
    id: "cl-5",
    clientCode: "AKP-CL-105",
    pharmacyName: "Ibn Sina Pharma Outlet (Sylhet)",
    proprietor: "A. K. M. Shamsuddin",
    phone: "+880 1715-667788",
    drugLicenseNo: "DL-SYL-10928",
    tradeLicenseNo: "TRAD/SCC/09812",
    address: "Subidbazar Point, Sylhet Sadar",
    territory: "Sylhet Sadar",
    assignedMio: "Enamul Haque",
    creditLimitBDT: 300000,
    outstandingBalanceBDT: 65000,
    creditTermDays: 30,
    status: "Active / Healthy",
    lastBilledDate: "02 Sep 2026",
  },
  {
    id: "cl-6",
    clientCode: "AKP-CL-106",
    pharmacyName: "Apollo Medical Hall (Rajshahi)",
    proprietor: "Shahidul Alam",
    phone: "+880 1518-778899",
    drugLicenseNo: "DL-RAJ-44912",
    tradeLicenseNo: "TRAD/RCC/88102",
    address: "Shaheb Bazar, Rajshahi Metro",
    territory: "Rajshahi Metro",
    assignedMio: "Sabbir Hossain",
    creditLimitBDT: 100000,
    outstandingBalanceBDT: 85000,
    creditTermDays: 15,
    status: "Credit Hold",
    lastBilledDate: "15 Jun 2026",
  },
];

export default function ClientsDirectoryPage() {
  const router = useRouter();
  const [clients, setClients] = React.useState<ClientProfile[]>(initialClients);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [territoryFilter, setTerritoryFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Create & Edit State
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<Omit<ClientProfile, "id">>({
    clientCode: "",
    pharmacyName: "",
    proprietor: "",
    phone: "",
    drugLicenseNo: "",
    tradeLicenseNo: "",
    address: "",
    territory: "Dhaka North",
    assignedMio: "Rafiqul Islam",
    creditLimitBDT: 150000,
    outstandingBalanceBDT: 0,
    creditTermDays: 30,
    status: "Active / Healthy",
    lastBilledDate: "17 Sep 2026",
  });

  // Statement / Profile Modal State
  const [activeClient, setActiveClient] = React.useState<ClientProfile | null>(null);
  const [isStatementOpen, setIsStatementOpen] = React.useState(false);

  // Direct connection to /logistics/orders
  const handleRedirectToOrder = (client: ClientProfile) => {
    const availableCredit = Math.max(0, client.creditLimitBDT - client.outstandingBalanceBDT);
    const params = new URLSearchParams({
      clientCode: client.clientCode,
      pharmacy: client.pharmacyName,
      territory: client.territory,
      mio: client.assignedMio,
      creditStatus: client.status,
      availableCredit: String(availableCredit),
    });
    router.push(`/logistics/orders?${params.toString()}`);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      clientCode: `AKP-CL-${100 + clients.length + 1}`,
      pharmacyName: "",
      proprietor: "",
      phone: "",
      drugLicenseNo: "",
      tradeLicenseNo: "",
      address: "",
      territory: "Dhaka North",
      assignedMio: "Rafiqul Islam",
      creditLimitBDT: 150000,
      outstandingBalanceBDT: 0,
      creditTermDays: 30,
      status: "Active / Healthy",
      lastBilledDate: "17 Sep 2026",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: ClientProfile) => {
    setEditingId(client.id);
    setFormData({
      clientCode: client.clientCode,
      pharmacyName: client.pharmacyName,
      proprietor: client.proprietor,
      phone: client.phone,
      drugLicenseNo: client.drugLicenseNo,
      tradeLicenseNo: client.tradeLicenseNo,
      address: client.address,
      territory: client.territory,
      assignedMio: client.assignedMio,
      creditLimitBDT: client.creditLimitBDT,
      outstandingBalanceBDT: client.outstandingBalanceBDT,
      creditTermDays: client.creditTermDays,
      status: client.status,
      lastBilledDate: client.lastBilledDate,
    });
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setClients((prev) =>
        prev.map((c) => (c.id === editingId ? { ...formData, id: editingId } : c))
      );
      if (activeClient && activeClient.id === editingId) {
        setActiveClient({ ...formData, id: editingId });
      }
    } else {
      const newClient: ClientProfile = {
        ...formData,
        id: `cl-${Date.now()}`,
      };
      setClients((prev) => [newClient, ...prev]);
    }
    setIsFormOpen(false);
  };

  const handleOpenStatement = (client: ClientProfile) => {
    setActiveClient(client);
    setIsStatementOpen(true);
  };

  const handleExportExcel = () => {
    const data = clients.map((c) => ({
      "Client Code": c.clientCode,
      "Pharmacy / Chemist": c.pharmacyName,
      Proprietor: c.proprietor,
      Phone: c.phone,
      "Drug License #": c.drugLicenseNo,
      "Trade License #": c.tradeLicenseNo,
      Address: c.address,
      Territory: c.territory,
      "Assigned MIO": c.assignedMio,
      "Credit Limit (BDT)": c.creditLimitBDT,
      "Outstanding Balance (BDT)": c.outstandingBalanceBDT,
      "Credit Available (BDT)": Math.max(0, c.creditLimitBDT - c.outstandingBalanceBDT),
      "Credit Terms (Days)": c.creditTermDays,
      "Account Status": c.status,
      "Last Billed Date": c.lastBilledDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Client Directory");
    XLSX.writeFile(workbook, `AK_Pharma_Client_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.pharmacyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.clientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.proprietor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.drugLicenseNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assignedMio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTerritory =
      territoryFilter === "all" || c.territory.toLowerCase() === territoryFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" || c.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesTerritory && matchesStatus;
  });

  const totalCreditAllocated = clients.reduce((acc, curr) => acc + curr.creditLimitBDT, 0);
  const totalOutstanding = clients.reduce((acc, curr) => acc + curr.outstandingBalanceBDT, 0);
  const totalAvailableHeadroom = Math.max(0, totalCreditAllocated - totalOutstanding);
  const creditHoldCount = clients.filter((c) => c.status === "Credit Hold").length;

  return (
    <div className="space-y-6 max-w-[1380px] mx-auto pb-16">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0090FF] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              COMMERCIAL SALES & DISTRIBUTION
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
            Pharmacy & Wholesale Client Master
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Licensed chemist accounts, statutory DGDA drug licenses, territorial assignments, and credit limit governance.
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
            Export Directory
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none"
          >
            <Plus className="h-4 w-4" />
            Onboard New Pharmacy
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 print:hidden">
        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Enrolled Accounts</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#0090FF]">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-slate-900 leading-none font-mono">
            {clients.length} Chemist Outlets
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-medium">
            Across 5 regional sales territories
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Floating Credit (A/R)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-slate-900 leading-none font-mono">
            ৳{totalOutstanding.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-medium">
            Active receivables linked to Collections
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Credit Headroom</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-emerald-600 leading-none font-mono">
            ৳{totalAvailableHeadroom.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-3">
            Safe limit capacity for new deliveries
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-sm bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Credit Hold Risk</span>
            <Badge variant="outline" className="text-[10px] font-bold text-rose-700 bg-rose-50 border-rose-200">
              {creditHoldCount} Accounts
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-extrabold tracking-tight text-rose-600 leading-none font-mono">
            {creditHoldCount} Blocked
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-3">
            Dispatch locked pending payment clearance
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 print:hidden">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search pharmacy, code, proprietor, phone, DL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
            <SelectTrigger className="h-8 w-[170px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="All Territories" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Territories</SelectItem>
              <SelectItem value="dhaka north">Dhaka North</SelectItem>
              <SelectItem value="dhaka south">Dhaka South</SelectItem>
              <SelectItem value="chittagong central">Chittagong Central</SelectItem>
              <SelectItem value="sylhet sadar">Sylhet Sadar</SelectItem>
              <SelectItem value="rajshahi metro">Rajshahi Metro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs bg-white border-slate-200">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active / healthy">Active / Healthy</SelectItem>
              <SelectItem value="credit hold">Credit Hold</SelectItem>
              <SelectItem value="watchlist">Watchlist</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Client Master Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              REGISTERED PHARMACY & CHEMIST ACCOUNTS
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click "Create Order" to auto-dispatch consignments, "Statement" for account confirmation, or "Edit" to modify limits
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredClients.length} Accounts
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Pharmacy & Code</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Proprietor & Phone</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Drug License #</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Territory & MIO</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Credit Limit</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Dues (A/R)</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Status</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => {
              const availableHeadroom = Math.max(0, client.creditLimitBDT - client.outstandingBalanceBDT);

              return (
                <TableRow key={client.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  {/* Pharmacy Name & Code */}
                  <TableCell className="py-3 pl-0">
                    <div className="leading-tight">
                      <span className="text-xs font-bold text-slate-900 block">{client.pharmacyName}</span>
                      <span className="text-[10px] font-mono text-[#0090FF] block mt-0.5">{client.clientCode}</span>
                    </div>
                  </TableCell>

                  {/* Proprietor & Phone */}
                  <TableCell className="py-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 block">{client.proprietor}</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Phone className="h-2.5 w-2.5 text-slate-400" />
                        <span className="font-mono text-slate-600">{client.phone}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Drug License */}
                  <TableCell className="py-3 text-xs font-mono text-slate-700">
                    <div>
                      <span className="block font-medium">{client.drugLicenseNo}</span>
                      <span className="text-[10px] text-slate-400 block">{client.tradeLicenseNo}</span>
                    </div>
                  </TableCell>

                  {/* Territory & MIO */}
                  <TableCell className="py-3 text-xs text-slate-700">
                    <div>
                      <span className="font-medium text-slate-900 block">{client.territory}</span>
                      <span className="text-[10px] text-slate-400 block">MIO: {client.assignedMio}</span>
                    </div>
                  </TableCell>

                  {/* Credit Limit */}
                  <TableCell className="py-3 text-xs text-right font-mono text-slate-700">
                    ৳{client.creditLimitBDT.toLocaleString("en-IN")}
                    <span className="text-[10px] text-slate-400 block">{client.creditTermDays} Days Term</span>
                  </TableCell>

                  {/* Dues */}
                  <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                    {client.outstandingBalanceBDT > 0 ? (
                      <span className={client.status === "Credit Hold" ? "text-rose-600" : "text-amber-600"}>
                        ৳{client.outstandingBalanceBDT.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-normal">৳0 (Clear)</span>
                    )}
                    <span className="text-[10px] text-slate-400 block font-normal">
                      Avail: ৳{availableHeadroom.toLocaleString("en-IN")}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3 text-xs">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        client.status === "Active / Healthy"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : client.status === "Watchlist"
                          ? "text-amber-700 bg-amber-50 border-amber-200"
                          : "text-rose-700 bg-rose-50 border-rose-200"
                      }`}
                    >
                      {client.status}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3 text-xs text-right pr-0">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Direct Order Connection Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRedirectToOrder(client)}
                        className="h-7 px-2.5 text-xs text-[#0090FF] border-blue-200 hover:bg-blue-50 gap-1 font-semibold"
                      >
                        <Truck className="h-3 w-3" />
                        Create Order
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(client)}
                        className="h-7 px-2 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 gap-1"
                      >
                        <Pencil className="h-3 w-3 text-slate-400" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenStatement(client)}
                        className="h-7 px-2 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 gap-1 font-medium"
                      >
                        <FileText className="h-3 w-3" />
                        Statement
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-800">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 bg-white">
                          <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-wider">
                            Direct Workflows
                          </DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleRedirectToOrder(client)} className="text-xs cursor-pointer">
                            <Truck className="h-3.5 w-3.5 mr-2 text-[#0090FF]" />
                            Book Delivery Order
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="text-xs cursor-pointer">
                            <Link href="/finance/collections">
                              <Receipt className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                              Record Collection Receipt
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleOpenStatement(client)}
                            className="text-xs cursor-pointer text-slate-700"
                          >
                            <Printer className="h-3.5 w-3.5 mr-2 text-slate-500" />
                            Print Account Statement
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Create & Edit Pharmacy Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[620px] bg-white rounded-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingId ? "Edit Pharmacy Client Particulars" : "Enroll New Chemist Client"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure business licenses, territorial field assignment, and credit limits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Client Code *</Label>
                <Input
                  value={formData.clientCode}
                  onChange={(e) => setFormData({ ...formData, clientCode: e.target.value })}
                  required
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Pharmacy / Chemist Name *</Label>
                <Input
                  placeholder="e.g. Al-Madina Model Pharmacy"
                  value={formData.pharmacyName}
                  onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                  required
                  className="h-8 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Proprietor Name *</Label>
                <Input
                  placeholder="e.g. Rafiq Ahmed"
                  value={formData.proprietor}
                  onChange={(e) => setFormData({ ...formData, proprietor: e.target.value })}
                  required
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Official Contact Phone *</Label>
                <Input
                  placeholder="+880 1711-000000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">DGDA Drug License # *</Label>
                <Input
                  placeholder="DL-DH-00000"
                  value={formData.drugLicenseNo}
                  onChange={(e) => setFormData({ ...formData, drugLicenseNo: e.target.value })}
                  required
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">City Trade License #</Label>
                <Input
                  placeholder="TRAD/DNCC/00000"
                  value={formData.tradeLicenseNo}
                  onChange={(e) => setFormData({ ...formData, tradeLicenseNo: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Outlet Address *</Label>
              <Input
                placeholder="Shop 12, Market Point, Road 4, Dhaka"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Territory</Label>
                <Select
                  value={formData.territory}
                  onValueChange={(val) => setFormData({ ...formData, territory: val })}
                >
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Dhaka North">Dhaka North</SelectItem>
                    <SelectItem value="Dhaka South">Dhaka South</SelectItem>
                    <SelectItem value="Chittagong Central">Chittagong Central</SelectItem>
                    <SelectItem value="Sylhet Sadar">Sylhet Sadar</SelectItem>
                    <SelectItem value="Rajshahi Metro">Rajshahi Metro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Assigned MIO</Label>
                <Input
                  placeholder="Rafiqul Islam"
                  value={formData.assignedMio}
                  onChange={(e) => setFormData({ ...formData, assignedMio: e.target.value })}
                  required
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                Credit Line & Governance
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Credit Limit (৳)</Label>
                  <Input
                    type="number"
                    value={formData.creditLimitBDT}
                    onChange={(e) => setFormData({ ...formData, creditLimitBDT: Number(e.target.value) || 0 })}
                    required
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Current Dues (৳)</Label>
                  <Input
                    type="number"
                    value={formData.outstandingBalanceBDT}
                    onChange={(e) => setFormData({ ...formData, outstandingBalanceBDT: Number(e.target.value) || 0 })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Credit Term (Days)</Label>
                  <Input
                    type="number"
                    value={formData.creditTermDays}
                    onChange={(e) => setFormData({ ...formData, creditTermDays: Number(e.target.value) || 0 })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Account Health Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val as ClientProfile["status"] })}
                >
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Active / Healthy">Active / Healthy</SelectItem>
                    <SelectItem value="Watchlist">Watchlist</SelectItem>
                    <SelectItem value="Credit Hold">Credit Hold (Dispatch Blocked)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                {editingId ? "Save Changes" : "Enroll Pharmacy"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Printable Account Statement & Health Slip */}
      <Dialog open={isStatementOpen} onOpenChange={setIsStatementOpen}>
        <DialogContent className="sm:max-w-[760px] bg-white rounded-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col">
          {activeClient && (
            <>
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-[#0090FF]" />
                  <span className="text-xs font-bold text-slate-800">
                    Chemist Ledger Certificate — {activeClient.pharmacyName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white gap-1.5 shadow-none"
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
                className="p-8 sm:p-10 text-slate-900 font-sans leading-relaxed text-xs overflow-y-auto print:overflow-visible print:p-0 print:m-0"
                id="printable-client-statement"
              >
                <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase text-slate-900">
                      AK PHARMA LIMITED
                    </h1>
                    <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                      Commercial Distribution & Credit Management
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Plot 14, Sector 7, Uttara Commercial Zone, Dhaka • DGDA Lic: DL-PH-2026-88
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold uppercase tracking-wider block text-slate-900 border border-slate-900 px-2 py-0.5 inline-block">
                      CLIENT ACCOUNT STATEMENT
                    </span>
                    <span className="text-xs font-mono font-bold text-[#0090FF] block mt-1.5">
                      {activeClient.clientCode}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Date: {new Date().toISOString().slice(0, 10)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 py-4 border-b border-slate-300 text-xs">
                  <div className="space-y-1">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Chemist Outlet:</span>
                      <strong className="text-sm text-slate-900 block">{activeClient.pharmacyName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Proprietor / Signatory:</span>
                      <span className="font-semibold text-slate-800">{activeClient.proprietor}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Outlet Address:</span>
                      <span className="text-slate-800">{activeClient.address}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-right sm:text-left">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">DGDA Drug License #:</span>
                      <strong className="text-slate-900 font-mono block">{activeClient.drugLicenseNo}</strong>
                      <span className="text-[10px] font-mono text-slate-500">{activeClient.tradeLicenseNo}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Territory & Assigned Field Officer:</span>
                      <span className="font-medium text-slate-800">
                        {activeClient.territory} • MIO: {activeClient.assignedMio}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Account Standing:</span>
                      <strong className={activeClient.status === "Credit Hold" ? "text-rose-600" : "text-emerald-700"}>
                        {activeClient.status}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Credit Matrix */}
                <div className="my-4 p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800 block">
                    Credit Position & Balance Summary
                  </span>
                  <div className="grid grid-cols-3 gap-4 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Approved Limit:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        ৳{activeClient.creditLimitBDT.toLocaleString("en-IN")}/-
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Term: {activeClient.creditTermDays} Days</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Outstanding Receivable:</span>
                      <span className="font-mono font-bold text-rose-600 text-sm">
                        ৳{activeClient.outstandingBalanceBDT.toLocaleString("en-IN")}/-
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Last Billed: {activeClient.lastBilledDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Available Headroom:</span>
                      <span className="font-mono font-bold text-emerald-600 text-sm">
                        ৳{Math.max(0, activeClient.creditLimitBDT - activeClient.outstandingBalanceBDT).toLocaleString("en-IN")}/-
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Eligible for Dispatch</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed mt-4">
                  This confirmation certificate is generated from the central enterprise ledger of AK PHARMA LIMITED. All shipments dispatched under commercial Delivery Challans remain subject to verified payment realization according to agreed terms.
                </p>

                {/* Sign-off Blocks */}
                <div className="mt-14 pt-8 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-[11px] text-center">
                  <div>
                    <div className="w-36 border-b border-slate-400 mx-auto mb-1.5" />
                    <span className="font-bold text-slate-900 block">{activeClient.assignedMio}</span>
                    <span className="text-[10px] text-slate-500">Territory MIO</span>
                  </div>
                  <div>
                    <div className="w-36 border-b border-slate-400 mx-auto mb-1.5" />
                    <span className="font-bold text-slate-900 block">Territory Credit Auditor</span>
                    <span className="text-[10px] text-slate-500">Accounts & Receivables</span>
                  </div>
                  <div>
                    <div className="w-36 border-b border-slate-400 mx-auto mb-1.5" />
                    <span className="font-bold text-slate-900 block">Authorized Signatory</span>
                    <span className="text-[10px] text-slate-500">Commercial Operations</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}