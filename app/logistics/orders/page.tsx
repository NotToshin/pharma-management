"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { useSearchParams } from "next/navigation";
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
  Truck,
  PackageCheck,
  Search,
  Filter,
  Plus,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Boxes,
  Snowflake,
  MoreHorizontal,
  Store,
  Printer,
  ShieldAlert,
} from "lucide-react";

interface SalesOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  pharmacyName: string;
  territory: string;
  assignedMio: string;
  itemsSummary: string;
  totalBoxes: number;
  orderValue: number;
  deliveryMethod: "Company Van (Cold Chain)" | "Company Van (Ambient)" | "Courier Dispatch";
  status: "Pending Credit Check" | "FEFO Allocated" | "Out for Delivery" | "Delivered & Invoiced" | "Cancelled";
  challanNumber?: string;
  invoiceNumber?: string;
}

const initialOrders: SalesOrder[] = [
  {
    id: "ord-1",
    orderNumber: "SO-2026-4401",
    orderDate: "16 Sep 2026",
    pharmacyName: "Popular Pharmacy (Dhanmondi)",
    territory: "Dhaka North",
    assignedMio: "Rafiqul Islam",
    itemsSummary: "Rosuvastatin 10mg (2000), Cardiloc 5mg (1500)",
    totalBoxes: 35,
    orderValue: 84500,
    deliveryMethod: "Company Van (Ambient)",
    status: "Out for Delivery",
    challanNumber: "DC-2026-1082",
  },
  {
    id: "ord-2",
    orderNumber: "SO-2026-4402",
    orderDate: "16 Sep 2026",
    pharmacyName: "Labaid Specialized Hospital Chemist",
    territory: "Dhaka North",
    assignedMio: "Rafiqul Islam",
    itemsSummary: "Cef-3 200mg Susp (500), Fefol-Z (1200)",
    totalBoxes: 22,
    orderValue: 142000,
    deliveryMethod: "Company Van (Cold Chain)",
    status: "FEFO Allocated",
    challanNumber: "DC-2026-1083",
  },
  {
    id: "ord-3",
    orderNumber: "SO-2026-4403",
    orderDate: "15 Sep 2026",
    pharmacyName: "Chevron Clinical Lab & Pharmacy",
    territory: "Chittagong Central",
    assignedMio: "Kamrul Hasan",
    itemsSummary: "Napa Extra 500mg (5000), Maxpro 20mg (3000)",
    totalBoxes: 48,
    orderValue: 98000,
    deliveryMethod: "Company Van (Ambient)",
    status: "Delivered & Invoiced",
    challanNumber: "DC-2026-1079",
    invoiceNumber: "INV-2026-9017",
  },
  {
    id: "ord-4",
    orderNumber: "SO-2026-4404",
    orderDate: "15 Sep 2026",
    pharmacyName: "Medinova Medical Chemist",
    territory: "Dhaka South",
    assignedMio: "Tanvir Ahmed",
    itemsSummary: "Azithromycin 500mg (800), Omeprazole 20mg (2500)",
    totalBoxes: 18,
    orderValue: 64200,
    deliveryMethod: "Courier Dispatch",
    status: "Pending Credit Check",
  },
  {
    id: "ord-5",
    orderNumber: "SO-2026-4405",
    orderDate: "14 Sep 2026",
    pharmacyName: "Ibn Sina Pharma Outlet",
    territory: "Sylhet Sadar",
    assignedMio: "Enamul Haque",
    itemsSummary: "Aceclofenac 100mg (1500), Diacerein (600)",
    totalBoxes: 16,
    orderValue: 51800,
    deliveryMethod: "Company Van (Ambient)",
    status: "Delivered & Invoiced",
    challanNumber: "DC-2026-1075",
    invoiceNumber: "INV-2026-9018",
  },
];

function LogisticsOrdersContent() {
  const searchParams = useSearchParams();

  const [orders, setOrders] = React.useState<SalesOrder[]>(initialOrders);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [territoryFilter, setTerritoryFilter] = React.useState("all");

  // New Sales Order Modal States
  const [isNewOrderOpen, setIsNewOrderOpen] = React.useState(false);
  const [pharmacyName, setPharmacyName] = React.useState("");
  const [territory, setTerritory] = React.useState("Dhaka North");
  const [assignedMio, setAssignedMio] = React.useState("Rafiqul Islam");
  const [itemsSummary, setItemsSummary] = React.useState("");
  const [totalBoxes, setTotalBoxes] = React.useState("");
  const [orderValue, setOrderValue] = React.useState("");
  const [deliveryMethod, setDeliveryMethod] = React.useState<SalesOrder["deliveryMethod"]>("Company Van (Ambient)");

  // Client link inspection state from URL
  const [clientCreditNotice, setClientCreditNotice] = React.useState<{ status: string; avail: string } | null>(null);

  // Inspect Modal State
  const [selectedOrder, setSelectedOrder] = React.useState<SalesOrder | null>(null);
  const [isInspectOpen, setIsInspectOpen] = React.useState(false);

  // Read URL query parameters passed from /sales/clients
  React.useEffect(() => {
    const incomingPharmacy = searchParams.get("pharmacy");
    const incomingTerritory = searchParams.get("territory");
    const incomingMio = searchParams.get("mio");
    const incomingCredit = searchParams.get("creditStatus");
    const incomingAvail = searchParams.get("availableCredit");

    if (incomingPharmacy) {
      setPharmacyName(incomingPharmacy);
      if (incomingTerritory) setTerritory(incomingTerritory);
      if (incomingMio) setAssignedMio(incomingMio);
      if (incomingCredit) {
        setClientCreditNotice({
          status: incomingCredit,
          avail: incomingAvail || "0",
        });
      }
      setIsNewOrderOpen(true);
    }
  }, [searchParams]);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const isHold = clientCreditNotice?.status === "Credit Hold";

    const newOrd: SalesOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `SO-2026-${Math.floor(4400 + orders.length + 6)}`,
      orderDate: "17 Sep 2026",
      pharmacyName,
      territory,
      assignedMio,
      itemsSummary,
      totalBoxes: Number(totalBoxes) || 10,
      orderValue: Number(orderValue) || 25000,
      deliveryMethod,
      status: isHold ? "Pending Credit Check" : "FEFO Allocated",
      challanNumber: `DC-2026-${Math.floor(1080 + orders.length + 5)}`,
    };

    setOrders((prev) => [newOrd, ...prev]);
    setPharmacyName("");
    setItemsSummary("");
    setTotalBoxes("");
    setOrderValue("");
    setClientCreditNotice(null);
    setIsNewOrderOpen(false);
  };

  const handleUpdateStatus = (id: string, newStatus: SalesOrder["status"]) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === id) {
          const isNowDelivered = newStatus === "Delivered & Invoiced";
          return {
            ...ord,
            status: newStatus,
            invoiceNumber: isNowDelivered ? ord.invoiceNumber || `INV-2026-${Math.floor(9020 + Math.random() * 80)}` : ord.invoiceNumber,
            challanNumber: ord.challanNumber || `DC-2026-${Math.floor(1090 + Math.random() * 50)}`,
          };
        }
        return ord;
      })
    );
  };

  const handleExportExcel = () => {
    const exportData = orders.map((o) => ({
      "Order Number": o.orderNumber,
      "Order Date": o.orderDate,
      "Chemist / Pharmacy": o.pharmacyName,
      Territory: o.territory,
      "Assigned MIO": o.assignedMio,
      "Item Breakdown": o.itemsSummary,
      "Carton Boxes": o.totalBoxes,
      "Total Amount (৳)": o.orderValue,
      "Logistics Method": o.deliveryMethod,
      "Fulfillment Status": o.status,
      "Delivery Challan": o.challanNumber || "Not Issued",
      "Sales Invoice": o.invoiceNumber || "Pending Delivery",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logistics Orders");
    XLSX.writeFile(workbook, `AK_Pharma_Logistics_Orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.pharmacyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.itemsSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.assignedMio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.challanNumber && ord.challanNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || ord.status.toLowerCase().includes(statusFilter.toLowerCase());

    const matchesTerritory =
      territoryFilter === "all" || ord.territory.toLowerCase().includes(territoryFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesTerritory;
  });

  const totalRevenue = orders.reduce((acc, curr) => acc + curr.orderValue, 0);
  const activeDispatchCount = orders.filter((o) => o.status === "Out for Delivery").length;
  const pendingCreditCount = orders.filter((o) => o.status === "Pending Credit Check").length;

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Order Fulfillment & Logistics Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process pharmacy orders, allocate warehouse FEFO batches, generate Delivery Challans, and trigger invoices.
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
            Export Order Roster
          </Button>

          {/* Create Order Modal */}
          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none">
                <Plus className="h-4 w-4" />
                Create Sales Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px] bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Book New Commercial Order</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Select destination chemist, ordered formulations, and delivery logistics route.
                </DialogDescription>
              </DialogHeader>

              {/* Client Credit Integration Notice */}
              {clientCreditNotice && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs mb-1 ${
                    clientCreditNotice.status === "Credit Hold"
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {clientCreditNotice.status === "Credit Hold" ? (
                      <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                    ) : (
                      <Store className="h-4 w-4 text-[#0090FF] shrink-0" />
                    )}
                    <div>
                      <span className="font-bold block">Linked from Client Master:</span>
                      <span className="text-[11px]">
                        Available Headroom: ৳{Number(clientCreditNotice.avail).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      clientCreditNotice.status === "Credit Hold"
                        ? "border-rose-300 bg-white text-rose-700 font-bold"
                        : "border-blue-300 bg-white text-blue-700 font-bold"
                    }
                  >
                    {clientCreditNotice.status}
                  </Badge>
                </div>
              )}

              <form onSubmit={handleCreateOrder} className="space-y-3.5 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pharmacy" className="text-xs font-medium text-slate-700">
                    Chemist / Pharmacy Outlet *
                  </Label>
                  <Input
                    id="pharmacy"
                    placeholder="e.g. Al-Madina Model Pharmacy"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    required
                    className="h-8 text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ter" className="text-xs font-medium text-slate-700">Territory Hub</Label>
                    <Select value={territory} onValueChange={setTerritory}>
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
                  <div className="space-y-1.5">
                    <Label htmlFor="mio" className="text-xs font-medium text-slate-700">Responsible MIO</Label>
                    <Input
                      id="mio"
                      placeholder="e.g. Rafiqul Islam"
                      value={assignedMio}
                      onChange={(e) => setAssignedMio(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="items" className="text-xs font-medium text-slate-700">Formulations & Quantity *</Label>
                  <Input
                    id="items"
                    placeholder="e.g. Napa Extra (2000 Strips), Ciprocin 500mg (800 Strips)"
                    value={itemsSummary}
                    onChange={(e) => setItemsSummary(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="boxes" className="text-xs font-medium text-slate-700">Carton Box Count *</Label>
                    <Input
                      id="boxes"
                      type="number"
                      placeholder="20"
                      value={totalBoxes}
                      onChange={(e) => setTotalBoxes(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="val" className="text-xs font-medium text-slate-700">Invoice Total (৳) *</Label>
                    <Input
                      id="val"
                      type="number"
                      placeholder="65000"
                      value={orderValue}
                      onChange={(e) => setOrderValue(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="delivery-method" className="text-xs font-medium text-slate-700">Logistics Fleet Channel</Label>
                  <Select
                    value={deliveryMethod}
                    onValueChange={(val) => setDeliveryMethod(val as SalesOrder["deliveryMethod"])}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Company Van (Ambient)">Company Van (Standard Ambient Delivery)</SelectItem>
                      <SelectItem value="Company Van (Cold Chain)">Company Van (Refrigerated Cold Chain 2-8°C)</SelectItem>
                      <SelectItem value="Courier Dispatch">Outstation Third-Party Courier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsNewOrderOpen(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                    Submit Order to Warehouse
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 print:hidden">
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pipeline Order Volume</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {orders.length} Orders
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            ৳{totalRevenue.toLocaleString("en-IN")} Gross Billed Value
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Road Deliveries</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {activeDispatchCount} Vans
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Dispatched on territorial delivery routes
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Credit Hold Approvals</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {pendingCreditCount} Orders
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-3">
            Awaiting credit clearance from Finance
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Fulfillment Efficiency (OTIF)</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-md">
              Target: 95%
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            97.2%
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            On-Time & In-Full delivery index
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 print:hidden">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search order #, pharmacy, challan, or MIO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[170px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="All Order Stages" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="pending credit check">Pending Credit Check</SelectItem>
              <SelectItem value="fefo allocated">FEFO Allocated</SelectItem>
              <SelectItem value="out for delivery">Out for Delivery</SelectItem>
              <SelectItem value="delivered & invoiced">Delivered & Invoiced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs bg-white border-slate-200">
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
        </div>
      </div>

      {/* 4. Main Order Ledger Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              COMMERCIAL SALES ORDER REGISTER
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live batch picking, Delivery Challan issuances, and automated invoice triggers
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredOrders.length} Orders
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Order Ref & Date</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Destination Chemist</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Items / Formulations</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Delivery Fleet</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-center">Cartons</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Order Value</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Challan / Invoice</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Fulfillment Status</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((ord) => (
              <TableRow key={ord.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                {/* Order Ref */}
                <TableCell className="py-3 pl-0">
                  <div className="leading-tight">
                    <span className="text-xs font-mono font-bold text-[#0090FF] block">{ord.orderNumber}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{ord.orderDate}</span>
                  </div>
                </TableCell>

                {/* Chemist / Pharmacy */}
                <TableCell className="py-3 text-xs text-slate-800">
                  <div>
                    <span className="font-semibold text-slate-900 block">{ord.pharmacyName}</span>
                    <span className="text-[10px] text-slate-400">{ord.territory} • MIO: {ord.assignedMio}</span>
                  </div>
                </TableCell>

                {/* Items Summary */}
                <TableCell className="py-3 text-xs text-slate-600 max-w-[210px] truncate">
                  {ord.itemsSummary}
                </TableCell>

                {/* Fleet / Delivery Method */}
                <TableCell className="py-3 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    {ord.deliveryMethod.includes("Cold") ? (
                      <Snowflake className="h-3 w-3 text-[#0090FF] shrink-0" />
                    ) : (
                      <Truck className="h-3 w-3 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate max-w-[140px]">{ord.deliveryMethod}</span>
                  </div>
                </TableCell>

                {/* Boxes */}
                <TableCell className="py-3 text-xs text-center font-mono font-medium text-slate-700">
                  {ord.totalBoxes}
                </TableCell>

                {/* Order Value */}
                <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                  ৳{ord.orderValue.toLocaleString("en-IN")}
                </TableCell>

                {/* Challan & Invoice Links */}
                <TableCell className="py-3 text-xs">
                  <div>
                    <span className="font-mono text-[10px] text-slate-700 block">
                      {ord.challanNumber ? ord.challanNumber : "Challan Pending"}
                    </span>
                    {ord.invoiceNumber ? (
                      <span className="font-mono text-[10px] font-semibold text-emerald-600 block">
                        {ord.invoiceNumber}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Not Invoiced</span>
                    )}
                  </div>
                </TableCell>

                {/* Status Badge */}
                <TableCell className="py-3 text-xs">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      ord.status === "Delivered & Invoiced"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : ord.status === "Out for Delivery"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : ord.status === "FEFO Allocated"
                        ? "text-purple-700 bg-purple-50 border-purple-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                    }`}
                  >
                    {ord.status}
                  </Badge>
                </TableCell>

                {/* Actions Dropdown */}
                <TableCell className="py-3 text-xs text-right pr-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 bg-white">
                      <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Workflow Transitions
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedOrder(ord);
                          setIsInspectOpen(true);
                        }}
                        className="text-xs cursor-pointer text-slate-700"
                      >
                        <FileText className="h-3.5 w-3.5 mr-2 text-slate-500" />
                        Inspect Delivery Challan
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />

                      {ord.status === "Pending Credit Check" && (
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(ord.id, "FEFO Allocated")}
                          className="text-xs cursor-pointer text-emerald-600"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                          Approve Credit & Allocate Batches
                        </DropdownMenuItem>
                      )}

                      {ord.status === "FEFO Allocated" && (
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(ord.id, "Out for Delivery")}
                          className="text-xs cursor-pointer text-[#0090FF]"
                        >
                          <Truck className="h-3.5 w-3.5 mr-2" />
                          Dispatch on Van Route
                        </DropdownMenuItem>
                      )}

                      {ord.status === "Out for Delivery" && (
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(ord.id, "Delivered & Invoiced")}
                          className="text-xs cursor-pointer text-emerald-600 font-semibold"
                        >
                          <PackageCheck className="h-3.5 w-3.5 mr-2" />
                          Mark Delivered & Generate Invoice
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => handleUpdateStatus(ord.id, "Cancelled")}
                        className="text-xs cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 mr-2" />
                        Cancel Order
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Delivery Challan Inspection Modal */}
      <Dialog open={isInspectOpen} onOpenChange={setIsInspectOpen}>
        <DialogContent className="sm:max-w-[620px] bg-white rounded-2xl p-0 overflow-hidden">
          {selectedOrder && (
            <div>
              {/* Header Toolbar (Hidden when printing) */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-[#0090FF]" />
                  <span className="text-xs font-bold text-slate-800">
                    Delivery Challan — {selectedOrder.challanNumber || "Draft"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white gap-1.5 shadow-none"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Challan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsInspectOpen(false)}
                    className="h-8 text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Printable Body Content */}
              <div className="p-8 text-slate-900 font-sans leading-relaxed text-xs">
                {/* Official Letterhead */}
                <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-black tracking-tight uppercase">AK PHARMA LIMITED</h2>
                    <p className="text-[11px] text-slate-600 font-medium">Warehouse & Logistics Dispatch Division</p>
                    <p className="text-[10px] text-slate-400">Tejgaon Central Depot, Dhaka • DGDA Lic: DL-PH-2026-88</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black uppercase tracking-wider block text-slate-900 border border-slate-900 px-2 py-0.5 inline-block">
                      DELIVERY CHALLAN
                    </span>
                    <span className="text-xs font-mono font-bold text-[#0090FF] block mt-1">
                      {selectedOrder.challanNumber || "DC-PENDING"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Date: {selectedOrder.orderDate}
                    </span>
                  </div>
                </div>

                {/* Primary Meta Strip */}
                <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                  <div className="space-y-1">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination Chemist:</span>
                      <strong className="text-sm text-slate-900 block">{selectedOrder.pharmacyName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Territory & Assigned Field Officer:</span>
                      <span className="font-medium text-slate-800">{selectedOrder.territory} • MIO: {selectedOrder.assignedMio}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-right sm:text-left">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Logistics Channel:</span>
                      <strong className="text-slate-900 block">{selectedOrder.deliveryMethod}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Sales Order Reference:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedOrder.orderNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Consignment Manifest */}
                <div className="py-4">
                  <table className="w-full text-xs border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                        <th className="text-left p-2.5">Dispatched Formulations / Products</th>
                        <th className="text-center p-2.5 w-24">Cartons</th>
                        <th className="text-right p-2.5 w-32">Value (BDT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{selectedOrder.itemsSummary}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            FEFO Verification: Checked & Batch Allocated
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-900">
                          {selectedOrder.totalBoxes} Boxes
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          ৳{selectedOrder.orderValue.toLocaleString("en-IN")}/-
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {selectedOrder.invoiceNumber && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 my-2">
                    <span className="font-medium">Commercial Sales Invoice Generated:</span>
                    <span className="font-mono font-bold">{selectedOrder.invoiceNumber}</span>
                  </div>
                )}

                {/* Sign-off Blocks */}
                <div className="mt-12 pt-6 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-[11px] text-center">
                  <div>
                    <div className="w-32 border-b border-slate-400 mx-auto mb-1.5" />
                    <span className="font-bold text-slate-900 block">Warehouse Dispatcher</span>
                    <span className="text-[10px] text-slate-500">Tejgaon Central Depot</span>
                  </div>
                  <div>
                    <div className="w-32 border-b border-slate-400 mx-auto mb-1.5" />
                    <span className="font-bold text-slate-900 block">Fleet Delivery Driver</span>
                    <span className="text-[10px] text-slate-500">Route Courier</span>
                  </div>
                  <div>
                    <div className="w-32 border-b border-slate-400 mx-auto mb-1.5" />
                    <span className="font-bold text-slate-900 block">Chemist Receiver</span>
                    <span className="text-[10px] text-slate-500">Official Pharmacy Stamp</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between print:hidden">
                <Button variant="outline" size="sm" onClick={() => setIsInspectOpen(false)} className="h-8 text-xs">
                  Close Preview
                </Button>
                {selectedOrder.status !== "Delivered & Invoiced" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, "Delivered & Invoiced");
                      setIsInspectOpen(false);
                    }}
                    className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white font-semibold"
                  >
                    Confirm Delivery & Trigger Invoice
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LogisticsOrdersPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Logistics Dispatch...</div>}>
      <LogisticsOrdersContent />
    </React.Suspense>
  );
}