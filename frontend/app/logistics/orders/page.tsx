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
  Search,
  Filter,
  Plus,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Boxes,
  MoreHorizontal,
  Store,
  Printer,
  ShieldAlert,
  Trash2,
  UserCheck,
  PackageCheck,
} from "lucide-react";

interface InvoiceItem {
  no: number;
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  pharmacyName: string;
  territory: string;
  assignedMio: string;
  itemsSummary: string;
  itemsDetail: InvoiceItem[];
  totalBoxes: number;
  orderValue: number;
  discountPercent: number;
  discountAmount: number;
  comments: string;
  deliveryMethod: "Sales Representative" | "Medical Information Officer" | "Third Party Courier";
  status: "Pending Credit Check" | "FEFO Allocated" | "Out for Delivery" | "Delivered & Invoiced" | "Cancelled";
  invoiceNumber: string;
}

interface ClientOption {
  id: string;
  clientCode: string;
  pharmacyName: string;
  territory: string;
  assignedMio: string;
  status: string;
  creditLimitBDT: number;
  outstandingBalanceBDT: number;
  address?: string;
  phone?: string;
}

interface StaffOption {
  id: string;
  fullName: string;
  department: string;
  designation: string;
}

interface StockProduct {
  id: string;
  name: string;
  stockQty: number;
  unitPrice: number;
}

function parseSummaryToRows(summary: string, totalVal: number, totalBoxes: number): InvoiceItem[] {
  if (!summary) return [{ no: 1, description: "Pharmaceutical Products", quantity: 1, unitCost: totalVal, total: totalVal }];

  const parts = summary.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1 && !summary.includes("(")) {
    return [{ no: 1, description: summary, quantity: totalBoxes || 1, unitCost: totalBoxes ? Math.round(totalVal / totalBoxes) : totalVal, total: totalVal }];
  }

  const parsed: InvoiceItem[] = [];
  let remainingVal = totalVal;

  parts.forEach((part, index) => {
    const match = part.match(/^(.*?)(?:\s*\((\d+)\))?$/);
    const desc = match ? match[1].trim() : part;
    const qty = match && match[2] ? parseInt(match[2], 10) : 1;
    const approxUnit = Math.round(totalVal / (totalBoxes || parts.length || 1));
    const lineTotal = index === parts.length - 1 ? remainingVal : approxUnit * qty;
    remainingVal -= lineTotal;

    parsed.push({
      no: index + 1,
      description: desc,
      quantity: qty,
      unitCost: qty > 0 ? Math.round(lineTotal / qty) : 0,
      total: lineTotal,
    });
  });

  return parsed;
}

function LogisticsOrdersContent() {
  const searchParams = useSearchParams();

  const [orders, setOrders] = React.useState<SalesOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [territoryFilter, setTerritoryFilter] = React.useState("all");

  const [clientList, setClientList] = React.useState<ClientOption[]>([]);
  const [staffList, setStaffList] = React.useState<StaffOption[]>([]);
  const [productCatalog, setProductCatalog] = React.useState<StockProduct[]>([]);

  const [pharmacyInput, setPharmacyInput] = React.useState("");
  const [pharmacySuggestions, setPharmacySuggestions] = React.useState<ClientOption[]>([]);
  const [activeSuggestionRow, setActiveSuggestionRow] = React.useState<number | null>(null);

  const [isNewOrderOpen, setIsNewOrderOpen] = React.useState(false);
  const [territory, setTerritory] = React.useState("Dhaka North");
  const [assignedMio, setAssignedMio] = React.useState("");
  const [deliveryMethod, setDeliveryMethod] = React.useState<SalesOrder["deliveryMethod"]>("Sales Representative");
  const [orderComments, setOrderComments] = React.useState("");
  const [discountPercent, setDiscountPercent] = React.useState<number>(0);

  const [lineItems, setLineItems] = React.useState<InvoiceItem[]>([
    { no: 1, description: "", quantity: 1, unitCost: 0, total: 0 },
  ]);

  const [clientCreditNotice, setClientCreditNotice] = React.useState<{ status: string; avail: string } | null>(null);
  const [selectedOrder, setSelectedOrder] = React.useState<SalesOrder | null>(null);
  const [isInspectOpen, setIsInspectOpen] = React.useState(false);

  const fetchBackendData = React.useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://pharma-management-b7fk.onrender.com/api";
      
      const [ordRes, clientRes, staffRes, invRes] = await Promise.all([
        fetch(`${API_URL}/orders`).catch(() => ({ ok: false, json: async () => [] })),
        fetch(`${API_URL}/clients`).catch(() => ({ ok: false, json: async () => [] })),
        fetch(`${API_URL}/staff`).catch(() => ({ ok: false, json: async () => [] })),
        // Connected directly to the live inventory batch ledger
        fetch(`${API_URL}/inventory`).catch(() => ({ ok: false, json: async () => [] })),
      ]);

      // Dynamic Product Catalog mapped from live inventory batches
      if (invRes.ok) {
        const batchData = await invRes.json();
        if (Array.isArray(batchData) && batchData.length > 0) {
          // Group by medicine brand name and sum total available units
          const groupedMap = new Map<string, StockProduct>();

          batchData.forEach((b: any) => {
            const name = (b.brandName || b.name || "Medicine").trim();
            const units = Number(b.availableUnits ?? b.stockQty ?? 0);
            const price = Number(b.unitPrice ?? 0);

            if (!groupedMap.has(name)) {
              groupedMap.set(name, {
                id: b.id,
                name: name,
                stockQty: units,
                unitPrice: price,
              });
            } else {
              const current = groupedMap.get(name)!;
              current.stockQty += units;
              // Keep latest unit price if available
              if (price > 0) current.unitPrice = price;
            }
          });

          setProductCatalog(Array.from(groupedMap.values()));
        } else {
          setProductCatalog([]);
        }
      }

      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData.map((item: any, idx: number) => {
          let parsedItems: InvoiceItem[] = [];
          if (Array.isArray(item.itemsDetail) && item.itemsDetail.length > 0) {
            parsedItems = item.itemsDetail;
          } else if (typeof item.itemsDetail === "string") {
            try {
              parsedItems = JSON.parse(item.itemsDetail);
            } catch {
              parsedItems = parseSummaryToRows(item.itemsSummary, Number(item.orderValue) || 0, Number(item.totalBoxes) || 1);
            }
          } else {
            parsedItems = parseSummaryToRows(item.itemsSummary, Number(item.orderValue) || 0, Number(item.totalBoxes) || 1);
          }

          const sequentialInvoiceNo = item.invoiceNumber || `INV-2026-${String(idx + 1).padStart(4, "0")}`;
          const rawDiscount = Number(item.discountPercent ?? item.discount ?? 0);
          const computedSubtotal = parsedItems.reduce((acc, curr) => acc + (curr.total || 0), 0);
          
          const pct = item.discountPercent !== undefined 
            ? rawDiscount 
            : computedSubtotal > 0 && rawDiscount <= 100 
              ? rawDiscount 
              : computedSubtotal > 0 
                ? Math.round((rawDiscount / computedSubtotal) * 100) 
                : 0;
                
          const monetaryDiscount = Math.round((computedSubtotal * pct) / 100);

          return {
            id: item.id,
            orderNumber: item.orderNumber || `SO-2026-${String(idx + 1).padStart(4, "0")}`,
            orderDate: item.orderDate || "28 Sep 2026",
            pharmacyName: item.pharmacyName,
            territory: item.territory || "Dhaka North",
            assignedMio: item.assignedMio || "General MIO",
            itemsSummary: item.itemsSummary || "General Formulations",
            itemsDetail: parsedItems,
            totalBoxes: Number(item.totalBoxes) || 1,
            orderValue: Number(item.orderValue) || Math.max(0, computedSubtotal - monetaryDiscount),
            discountPercent: pct,
            discountAmount: monetaryDiscount,
            comments: item.comments || "",
            deliveryMethod: item.deliveryMethod || "Sales Representative",
            status: item.status || "FEFO Allocated",
            invoiceNumber: sequentialInvoiceNo,
          };
        }));
      }

      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClientList(clientData);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaffList(staffData);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading logistics records:", err);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

  React.useEffect(() => {
    const incomingPharmacy = searchParams.get("pharmacy");
    const incomingTerritory = searchParams.get("territory");
    const incomingMio = searchParams.get("mio");
    const incomingCredit = searchParams.get("creditStatus");
    const incomingAvail = searchParams.get("availableCredit");

    if (incomingPharmacy) {
      setPharmacyInput(incomingPharmacy);
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

  const handlePharmacyTyping = (val: string) => {
    setPharmacyInput(val);
    if (!val.trim()) {
      setPharmacySuggestions([]);
      return;
    }
    const query = val.toLowerCase();
    const matches = clientList.filter(
      (c) =>
        c.pharmacyName.toLowerCase().includes(query) ||
        c.clientCode.toLowerCase().includes(query)
    );
    setPharmacySuggestions(matches);
  };

  const handleSelectPharmacy = (client: ClientOption) => {
    setPharmacyInput(client.pharmacyName);
    setTerritory(client.territory || territory);
    setAssignedMio(client.assignedMio || assignedMio);
    const avail = Math.max(0, client.creditLimitBDT - client.outstandingBalanceBDT);
    setClientCreditNotice({
      status: client.status,
      avail: String(avail),
    });
    setPharmacySuggestions([]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) {
      setLineItems([{ no: 1, description: "", quantity: 1, unitCost: 0, total: 0 }]);
      return;
    }
    setLineItems((prev) =>
      prev.filter((_, i) => i !== index).map((item, idx) => ({
        ...item,
        no: idx + 1,
      }))
    );
  };

  const handleUpdateLineItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setLineItems((prev) => {
      const isLastRow = index === prev.length - 1;
      const isEnteringDescription = field === "description" && typeof value === "string" && value.trim() !== "";
      const wasPreviouslyEmpty = prev[index].description.trim() === "";

      const updatedList = prev.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "unitCost") {
            const qty = field === "quantity" ? Number(value) || 0 : item.quantity;
            const cost = field === "unitCost" ? Number(value) || 0 : item.unitCost;
            updated.total = qty * cost;
          }
          return updated;
        }
        return item;
      });

      if (isLastRow && isEnteringDescription && wasPreviouslyEmpty) {
        updatedList.push({
          no: updatedList.length + 1,
          description: "",
          quantity: 1,
          unitCost: 0,
          total: 0,
        });
      }

      return updatedList.map((item, idx) => ({
        ...item,
        no: idx + 1,
      }));
    });
  };

  const handleSelectStockProduct = (index: number, prod: StockProduct) => {
    setLineItems((prev) => {
      const isLastRow = index === prev.length - 1;
      const wasEmpty = prev[index].description.trim() === "";

      const updatedList = prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            description: prod.name,
            unitCost: prod.unitPrice,
            total: (item.quantity || 1) * prod.unitPrice,
          };
        }
        return item;
      });

      if (isLastRow && wasEmpty) {
        updatedList.push({
          no: updatedList.length + 1,
          description: "",
          quantity: 1,
          unitCost: 0,
          total: 0,
        });
      }

      return updatedList.map((item, idx) => ({
        ...item,
        no: idx + 1,
      }));
    });
    setActiveSuggestionRow(null);
  };

  const validLineItems = React.useMemo(
    () => lineItems.filter((item) => item.description.trim() !== ""),
    [lineItems]
  );

  const calculatedSubtotal = React.useMemo(
    () => validLineItems.reduce((acc, curr) => acc + curr.total, 0),
    [validLineItems]
  );

  const calculatedDiscountAmount = Math.round((calculatedSubtotal * (discountPercent || 0)) / 100);
  const calculatedGrandTotal = Math.max(0, calculatedSubtotal - calculatedDiscountAmount);

  const totalBoxesCalculated = React.useMemo(
    () => validLineItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0),
    [validLineItems]
  );

  const itemsSummaryString = React.useMemo(
    () =>
      validLineItems
        .map((i) => `${i.description} (${i.quantity})`)
        .join(", ") || "General Pharmaceuticals",
    [validLineItems]
  );

  const nextSerialInvoiceNo = `INV-2026-${String(orders.length + 1).padStart(4, "0")}`;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validLineItems.length === 0) {
      alert("Please specify at least one product description.");
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://pharma-management-b7fk.onrender.com/api";
      const isHold = clientCreditNotice?.status === "Credit Hold";

      const payload = {
        orderNumber: `SO-2026-${String(orders.length + 1).padStart(4, "0")}`,
        orderDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        pharmacyName: pharmacyInput,
        territory,
        assignedMio: assignedMio || "General MIO",
        itemsSummary: itemsSummaryString,
        itemsDetail: validLineItems,
        totalBoxes: totalBoxesCalculated,
        orderValue: calculatedGrandTotal,
        discountPercent: discountPercent,
        discountAmount: calculatedDiscountAmount,
        comments: orderComments,
        deliveryMethod,
        status: isHold ? "Pending Credit Check" : "FEFO Allocated",
        invoiceNumber: nextSerialInvoiceNo,
      };

      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit sales order");

      setIsNewOrderOpen(false);
      setPharmacyInput("");
      setLineItems([{ no: 1, description: "", quantity: 1, unitCost: 0, total: 0 }]);
      setDiscountPercent(0);
      setOrderComments("");
      setClientCreditNotice(null);
      fetchBackendData();
    } catch (error) {
      console.error("Error creating sales order:", error);
      alert("Failed to submit order to warehouse.");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: SalesOrder["status"]) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://pharma-management-b7fk.onrender.com/api";
      const res = await fetch(`${API_URL}/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      fetchBackendData();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sales order?")) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://pharma-management-b7fk.onrender.com/api";
      const res = await fetch(`${API_URL}/orders/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete order");
      fetchBackendData();
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Failed to delete order record.");
    }
  };

  const handleExportExcel = () => {
    const exportData = orders.map((o) => ({
      "Order Number": o.orderNumber,
      "Order Date": o.orderDate,
      "Chemist / Pharmacy": o.pharmacyName,
      Territory: o.territory,
      "Assigned MIO": o.assignedMio,
      "Item Breakdown": o.itemsSummary,
      "Boxes": o.totalBoxes,
      "Discount (%)": `${o.discountPercent}%`,
      "Discount Value (৳)": o.discountAmount,
      "Total Amount (৳)": o.orderValue,
      "Logistics Method": o.deliveryMethod,
      "Fulfillment Status": o.status,
      "Invoice Number": o.invoiceNumber,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logistics Orders");
    XLSX.writeFile(workbook, `AK_Pharma_Logistics_Orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredOrders = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    const sf = statusFilter.toLowerCase();
    const tf = territoryFilter.toLowerCase();

    return orders.filter((ord) => {
      const matchesSearch =
        !q ||
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.pharmacyName.toLowerCase().includes(q) ||
        ord.itemsSummary.toLowerCase().includes(q) ||
        ord.assignedMio.toLowerCase().includes(q) ||
        Boolean(ord.invoiceNumber && ord.invoiceNumber.toLowerCase().includes(q));

      const matchesStatus = sf === "all" || ord.status.toLowerCase() === sf;
      const matchesTerritory = tf === "all" || ord.territory.toLowerCase() === tf;

      return matchesSearch && matchesStatus && matchesTerritory;
    });
  }, [orders, searchQuery, statusFilter, territoryFilter]);

  const totalRevenue = React.useMemo(() => orders.reduce((acc, curr) => acc + curr.orderValue, 0), [orders]);
  
  const activeRepsCount = React.useMemo(() => {
    const reps = new Set(orders.map((o) => o.assignedMio).filter((m) => m && m !== "Unassigned"));
    return reps.size;
  }, [orders]);

  const pendingCreditCount = React.useMemo(() => orders.filter((o) => o.status === "Pending Credit Check").length, [orders]);

  // Dynamic OTIF Calculation (Delivered & Invoiced / Total non-cancelled orders)
  const otifMetrics = React.useMemo(() => {
    const nonCancelled = orders.filter((o) => o.status !== "Cancelled");
    if (nonCancelled.length === 0) {
      return { percentage: "100.0%", isTargetMet: true };
    }
    const delivered = nonCancelled.filter((o) => o.status === "Delivered & Invoiced").length;
    const rate = ((delivered / nonCancelled.length) * 100).toFixed(1);
    return {
      percentage: `${rate}%`,
      isTargetMet: parseFloat(rate) >= 95,
    };
  }, [orders]);

  const matchedClient = React.useMemo(
    () => (selectedOrder ? clientList.find((c) => c.pharmacyName === selectedOrder.pharmacyName) : null),
    [clientList, selectedOrder]
  );

  const activeInvoiceRows = React.useMemo(() => {
    if (!selectedOrder) return [];
    if (selectedOrder.itemsDetail && Array.isArray(selectedOrder.itemsDetail) && selectedOrder.itemsDetail.length > 0) {
      const valid = selectedOrder.itemsDetail.filter((i) => i.description && i.description.trim() !== "");
      if (valid.length > 0) return valid;
    }
    return parseSummaryToRows(selectedOrder.itemsSummary, selectedOrder.orderValue, selectedOrder.totalBoxes);
  }, [selectedOrder]);

  const inspectSubtotal = React.useMemo(
    () => activeInvoiceRows.reduce((sum, item) => sum + item.total, 0),
    [activeInvoiceRows]
  );

  const inspectDiscountPercent = selectedOrder?.discountPercent || 0;
  const inspectDiscountAmount = selectedOrder?.discountAmount ?? Math.round((inspectSubtotal * inspectDiscountPercent) / 100);
  const inspectGrandTotal = selectedOrder?.orderValue || Math.max(0, inspectSubtotal - inspectDiscountAmount);

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #print-standalone-invoice,
          #print-standalone-invoice * {
            visibility: visible !important;
          }
          #print-standalone-invoice {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 10px !important;
            background: white !important;
          }
        }
      `}</style>

      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Order Fulfillment & Logistics Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process pharmacy orders, allocate warehouse FEFO batches, and trigger serial invoices.
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

          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none">
                <Plus className="h-4 w-4" />
                Create Sales Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] bg-white rounded-2xl max-h-[92vh] overflow-y-auto p-6">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Book New Commercial Order & Invoice</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Select destination chemist, pick formulations from inventory, and generate sequential invoice.
                </DialogDescription>
              </DialogHeader>

              {clientCreditNotice && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs my-1 ${
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

              <form onSubmit={handleCreateOrder} className="space-y-4 py-2">
                <div className="space-y-1.5 relative">
                  <Label htmlFor="pharmacy" className="text-xs font-medium text-slate-700">
                    Chemist / Pharmacy Outlet (Type to search) *
                  </Label>
                  <Input
                    id="pharmacy"
                    placeholder="Type pharmacy name or code (e.g. Al-Madina)..."
                    value={pharmacyInput}
                    onChange={(e) => handlePharmacyTyping(e.target.value)}
                    required
                    className="h-8 text-xs font-semibold"
                    autoComplete="off"
                  />
                  {pharmacySuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {pharmacySuggestions.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectPharmacy(c)}
                          className="px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0"
                        >
                          <div>
                            <strong className="text-slate-900 block">{c.pharmacyName}</strong>
                            <span className="text-[10px] text-slate-400">{c.territory} • Code: {c.clientCode}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px]">{c.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
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
                    <Label htmlFor="mio" className="text-xs font-medium text-slate-700">Sales Representative</Label>
                    <Select value={assignedMio} onValueChange={setAssignedMio}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue placeholder="Select Sales Rep" />
                      </SelectTrigger>
                      <SelectContent className="text-xs max-h-40">
                        {staffList.map((staff) => (
                          <SelectItem key={staff.id} value={staff.fullName}>
                            {staff.fullName} ({staff.designation || staff.department || "Field Force"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="delivery-method" className="text-xs font-medium text-slate-700">Logistics Fleet</Label>
                    <Select
                      value={deliveryMethod}
                      onValueChange={(val) => setDeliveryMethod(val as SalesOrder["deliveryMethod"])}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Sales Representative">Sales Representative</SelectItem>
                        <SelectItem value="Medical Information Officer">Medical Information Officer</SelectItem>
                        <SelectItem value="Third Party Courier">Third Party Courier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Invoice Line Items & Products (Connected with Stock Management)
                    </Label>
                    <span className="text-[10px] text-slate-500 italic">
                      * Auto-creates consecutive rows & automatically updates inventory
                    </span>
                  </div>

                  <div className="border border-black rounded-lg overflow-visible">
                    <table className="w-full text-xs text-center border-collapse">
                      <thead>
                        <tr className="bg-black text-white font-bold text-[10px] uppercase tracking-wider">
                          <th className="py-2 w-10 border-r border-neutral-700">No.</th>
                          <th className="py-2 text-left px-3 border-r border-neutral-700">Product / Medicine</th>
                          <th className="py-2 w-20 border-r border-neutral-700">Boxes</th>
                          <th className="py-2 w-28 border-r border-neutral-700">Unit Price (৳)</th>
                          <th className="py-2 w-28 border-r border-neutral-700">Total (৳)</th>
                          <th className="py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-200 last:border-0 relative">
                            <td className="py-1.5 border-r border-slate-200 font-mono font-bold text-slate-600">
                              {item.no}
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-200 text-left relative">
                              <Input
                                placeholder="Choose or search stock product..."
                                value={item.description}
                                onChange={(e) => {
                                  handleUpdateLineItem(idx, "description", e.target.value);
                                  setActiveSuggestionRow(idx);
                                }}
                                onFocus={() => setActiveSuggestionRow(idx)}
                                className="h-7 text-xs border-slate-200 font-medium"
                              />
                              {activeSuggestionRow === idx && (
                                <div className="absolute z-50 left-2 right-2 bg-white border border-slate-300 rounded shadow-lg max-h-48 overflow-y-auto mt-0.5">
                                  {productCatalog
                                    .filter((p) => p.name.toLowerCase().includes((item.description || "").toLowerCase()))
                                    .map((prod) => (
                                      <div
                                        key={prod.id}
                                        onClick={() => handleSelectStockProduct(idx, prod)}
                                        className="px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0"
                                      >
                                        <div>
                                          <span className="font-bold text-slate-900 block">{prod.name}</span>
                                          <span className="text-[11px] text-emerald-600 font-mono font-semibold">
                                            Stock: {prod.stockQty} boxes
                                          </span>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-slate-700">
                                          ৳{prod.unitPrice.toLocaleString("en-IN")}
                                        </span>
                                      </div>
                                    ))}
                                  {productCatalog.filter((p) => p.name.toLowerCase().includes((item.description || "").toLowerCase())).length === 0 && (
                                    <div className="px-3 py-2 text-xs text-slate-400 italic">
                                      No matching inventory products found
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-200">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateLineItem(idx, "quantity", e.target.value)}
                                className="h-7 text-xs font-mono text-center border-slate-200"
                              />
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-200">
                              <Input
                                type="number"
                                min="0"
                                value={item.unitCost}
                                onChange={(e) => handleUpdateLineItem(idx, "unitCost", e.target.value)}
                                className="h-7 text-xs font-mono text-right border-slate-200"
                              />
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-200 font-mono font-bold text-right text-slate-900">
                              ৳{item.total.toLocaleString("en-IN")}
                            </td>
                            <td className="py-1.5 px-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveLineItem(idx)}
                                disabled={lineItems.length === 1}
                                className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-start pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-700">Comments / Logistics Notes</Label>
                    <Input
                      placeholder="Special delivery instructions or comments..."
                      value={orderComments}
                      onChange={(e) => setOrderComments(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="border border-black rounded-lg overflow-hidden text-xs">
                    <div className="flex border-b border-black">
                      <div className="w-28 bg-black text-white px-2 py-1.5 font-bold uppercase text-[10px] flex items-center">
                        SUBTOTAL
                      </div>
                      <div className="flex-1 p-1.5 text-right font-mono font-bold">
                        ৳{calculatedSubtotal.toLocaleString("en-IN")}
                      </div>
                    </div>
                    
                    {/* Discount in % */}
                    <div className="flex border-b border-black items-center">
                      <div className="w-28 bg-black text-white px-2 py-1.5 font-bold uppercase text-[10px] flex items-center">
                        DISCOUNT (%)
                      </div>
                      <div className="flex-1 flex items-center justify-end px-2 gap-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                            className="h-6 w-16 text-xs font-mono text-right border-slate-200 bg-white px-1.5 py-0"
                          />
                          <span className="font-bold text-slate-700">%</span>
                        </div>
                        <span className="font-mono text-slate-500 text-[11px]">
                          (-৳{calculatedDiscountAmount.toLocaleString("en-IN")})
                        </span>
                      </div>
                    </div>

                    <div className="flex bg-slate-50">
                      <div className="w-28 bg-black text-white px-2 py-1.5 font-bold uppercase text-[10px] flex items-center">
                        GRAND TOTAL
                      </div>
                      <div className="flex-1 p-1.5 text-right font-mono font-extrabold text-sm text-[#0090FF]">
                        ৳{calculatedGrandTotal.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsNewOrderOpen(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                    Submit Order & Deduct Stock
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
            <span className="text-xs font-medium text-slate-500">Sales Representative</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {activeRepsCount} Active
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Assigned across territorial field routes
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

        {/* Dynamic Fulfillment Efficiency (OTIF) */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Fulfillment Efficiency (OTIF)</span>
            <Badge
              variant="outline"
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                otifMetrics.isTargetMet
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-amber-700 bg-amber-50 border-amber-200"
              }`}
            >
              Target: 95%
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {otifMetrics.percentage}
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
            placeholder="Search order #, pharmacy, invoice #, or MIO..."
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
              Live batch picking and sequential commercial sales invoice generation
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
              <TableHead className="text-xs font-medium text-slate-600 text-center">Boxes</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right">Order Value</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Invoice No.</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Fulfillment Status</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-slate-400 text-xs">
                  Loading order register from database...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-slate-400 text-xs">
                  No sales orders found. Click "Create Sales Order" to book a dispatch.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((ord) => (
                <TableRow key={ord.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <TableCell className="py-3 pl-0">
                    <div className="leading-tight">
                      <span className="text-xs font-mono font-bold text-[#0090FF] block">{ord.orderNumber}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{ord.orderDate}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-800">
                    <div>
                      <span className="font-semibold text-slate-900 block">{ord.pharmacyName}</span>
                      <span className="text-[10px] text-slate-400">{ord.territory} • MIO: {ord.assignedMio}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-600 max-w-[210px] truncate">
                    {ord.itemsSummary}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[140px] font-medium">{ord.deliveryMethod}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-center font-mono font-medium text-slate-700">
                    {ord.totalBoxes}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right font-mono font-bold text-slate-900">
                    <div>
                      <span>৳{ord.orderValue.toLocaleString("en-IN")}</span>
                      {ord.discountPercent > 0 && (
                        <span className="block text-[10px] text-emerald-600 font-normal">
                          {ord.discountPercent}% OFF
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs">
                    <span className="font-mono text-xs font-bold text-emerald-700 block">
                      {ord.invoiceNumber}
                    </span>
                  </TableCell>

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
                          className="text-xs cursor-pointer text-slate-700 font-semibold"
                        >
                          <FileText className="h-3.5 w-3.5 mr-2 text-slate-500" />
                          View / Print Invoice
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
                            <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                            Dispatch on Route
                          </DropdownMenuItem>
                        )}

                        {ord.status === "Out for Delivery" && (
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(ord.id, "Delivered & Invoiced")}
                            className="text-xs cursor-pointer text-emerald-600 font-semibold"
                          >
                            <PackageCheck className="h-3.5 w-3.5 mr-2" />
                            Mark Delivered & Invoiced
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(ord.id, "Cancelled")}
                          className="text-xs cursor-pointer text-amber-600"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 mr-2" />
                          Cancel Order
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteOrder(ord.id)}
                          className="text-xs cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2 text-rose-600" />
                          Delete Order Record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Invoice Preview & Actions Dialog */}
      <Dialog open={isInspectOpen} onOpenChange={setIsInspectOpen}>
        <DialogContent className="sm:max-w-[760px] bg-white rounded-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col">
          {selectedOrder && (
            <div>
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#0090FF]" />
                  <span className="text-xs font-bold text-slate-800">
                    Invoice Preview — {selectedOrder.invoiceNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white gap-1.5 shadow-none"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Invoice
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

              {/* On-screen Preview */}
              <div className="p-8 overflow-y-auto max-h-[75vh] bg-neutral-100 flex justify-center">
                <div className="bg-white border-2 border-black p-6 w-full max-w-[620px] text-black font-sans text-xs">
                  <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-black tracking-wider uppercase font-serif">INVOICE</h1>
                    <div className="text-right text-[11px] leading-tight space-y-0.5 font-medium">
                      <strong className="text-sm font-black uppercase tracking-wide block font-serif">AK Pharma</strong>
                      <p>10/26, Rupnagar R/A, Mirpur, Dhaka 1216</p>
                      <p>01712611074, 01798112763</p>
                      <p>akpharmabd@gmail.com</p>
                    </div>
                  </div>

                  <div className="mt-6 border border-black w-64 text-left">
                    <div className="bg-black text-white px-2 py-0.5 font-bold uppercase text-[10px] tracking-wider">
                      BILL TO:
                    </div>
                    <div className="p-2 space-y-0.5 text-[11px]">
                      <strong className="block font-bold">{selectedOrder.pharmacyName}</strong>
                      <p className="text-neutral-700">{matchedClient?.address || selectedOrder.territory}</p>
                      <p className="text-neutral-700">{matchedClient?.phone || "Phone: On File"}</p>
                      <p className="text-neutral-500 text-[10px]">Territory: {selectedOrder.territory}</p>
                    </div>
                  </div>

                  <table className="w-full mt-6 border-collapse border border-black text-xs text-center">
                    <thead>
                      <tr className="bg-black text-white font-bold text-[10px] uppercase tracking-wider">
                        <th className="border border-black py-1.5 w-10">No.</th>
                        <th className="border border-black py-1.5 text-left px-2">Description</th>
                        <th className="border border-black py-1.5 w-16">Boxes</th>
                        <th className="border border-black py-1.5 w-24">Unit Cost</th>
                        <th className="border border-black py-1.5 w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeInvoiceRows.map((row, idx) => (
                        <tr key={idx} className="border-b border-black">
                          <td className="border-r border-black py-2 font-mono font-medium">{row.no || idx + 1}</td>
                          <td className="border-r border-black py-2 px-2 text-left font-medium">{row.description}</td>
                          <td className="border-r border-black py-2 font-mono">{row.quantity}</td>
                          <td className="border-r border-black py-2 font-mono">৳{row.unitCost.toLocaleString("en-IN")}</td>
                          <td className="py-2 font-mono font-bold">৳{row.total.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 flex gap-4 items-start">
                    <div className="flex-1 border border-black min-h-[90px]">
                      <div className="bg-black text-white px-2 py-0.5 font-bold uppercase text-[10px] tracking-wider text-center">
                        COMMENTS
                      </div>
                      <div className="p-2 text-[11px] text-neutral-700 space-y-1">
                        <p>• Invoice No: <strong>{selectedOrder.invoiceNumber}</strong></p>
                        <p>• Assigned MIO: {selectedOrder.assignedMio}</p>
                        <p>• Delivery Fleet: {selectedOrder.deliveryMethod}</p>
                        {selectedOrder.comments && <p>• Notes: {selectedOrder.comments}</p>}
                      </div>
                    </div>

                    <div className="w-64 border border-black">
                      <div className="flex border-b border-black">
                        <div className="w-28 bg-black text-white px-2 py-1 font-bold text-[10px] uppercase flex items-center">
                          SUBTOTAL
                        </div>
                        <div className="flex-1 p-1 text-right font-mono font-medium">
                          ৳{inspectSubtotal.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="flex border-b border-black">
                        <div className="w-28 bg-black text-white px-2 py-1 font-bold text-[10px] uppercase flex items-center">
                          DISCOUNT ({inspectDiscountPercent}%)
                        </div>
                        <div className="flex-1 p-1 text-right font-mono">
                          -৳{inspectDiscountAmount.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="flex bg-neutral-50">
                        <div className="w-28 bg-black text-white px-2 py-1 font-bold text-[10px] uppercase flex items-center">
                          GRAND TOTAL
                        </div>
                        <div className="flex-1 p-1 text-right font-mono font-bold text-sm text-[#0090FF]">
                          ৳{inspectGrandTotal.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-[10px] text-center border-t-2 border-slate-200">
                    <div>
                      <div className="w-32 border-b border-slate-400 mx-auto mb-1" />
                      <strong className="text-slate-900 block text-[11px]">Chief Executive Officer</strong>
                      <span className="text-slate-500">Authorized Signature</span>
                    </div>
                    <div>
                      <div className="w-32 border-b border-slate-400 mx-auto mb-1" />
                      <strong className="text-slate-900 block text-[11px]">Managing Director</strong>
                      <span className="text-slate-500">Authorized Signature</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center font-bold text-xs uppercase tracking-wider font-serif">
                    THANK YOU FOR YOUR BUSINESS
                  </div>
                </div>
              </div>

              {selectedOrder.status !== "Delivered & Invoiced" && (
                <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end print:hidden">
                  <Button
                    size="sm"
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, "Delivered & Invoiced");
                      setIsInspectOpen(false);
                    }}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    Confirm Delivery & Complete Invoice
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. Isolated Standalone Printable Invoice Sheet */}
      {selectedOrder && (
        <div id="print-standalone-invoice" className="hidden font-sans text-black bg-white">
          <div className="border-2 border-black p-8 w-full max-w-[760px] mx-auto text-xs">
            <div className="flex justify-between items-start">
              <h1 className="text-4xl font-black tracking-wider uppercase font-serif">INVOICE</h1>
              <div className="text-right text-xs leading-snug space-y-0.5">
                <strong className="text-base font-black uppercase tracking-wide block font-serif">AK Pharma</strong>
                <p>10/26, Rupnagar R/A, Mirpur, Dhaka 1216</p>
                <p>01712611074, 01798112763</p>
                <p>akpharmabd@gmail.com</p>
              </div>
            </div>

            <div className="mt-8 border border-black w-72 text-left">
              <div className="bg-black text-white px-2.5 py-1 font-bold uppercase text-[11px] tracking-wider">
                BILL TO:
              </div>
              <div className="p-2.5 space-y-1 text-xs">
                <strong className="block font-bold text-sm">{selectedOrder.pharmacyName}</strong>
                <p>{matchedClient?.address || selectedOrder.territory}</p>
                <p>{matchedClient?.phone || "Phone: On Record"}</p>
                <p className="text-neutral-600 text-[10px]">Territory: {selectedOrder.territory}</p>
              </div>
            </div>

            <table className="w-full mt-8 border-collapse border border-black text-xs text-center">
              <thead>
                <tr className="bg-black text-white font-bold text-[11px] uppercase tracking-wider">
                  <th className="border border-black py-2 w-12">No.</th>
                  <th className="border border-black py-2 text-left px-3">Description</th>
                  <th className="border border-black py-2 w-20">Boxes</th>
                  <th className="border border-black py-2 w-28">Unit Cost</th>
                  <th className="border border-black py-2 w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {activeInvoiceRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="border-r border-black py-2.5 font-mono font-medium">{row.no || idx + 1}</td>
                    <td className="border-r border-black py-2.5 px-3 text-left font-medium">{row.description}</td>
                    <td className="border-r border-black py-2.5 font-mono">{row.quantity}</td>
                    <td className="border-r border-black py-2.5 font-mono">৳{row.unitCost.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 font-mono font-bold">৳{row.total.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 flex gap-6 items-start">
              <div className="flex-1 border border-black min-h-[110px]">
                <div className="bg-black text-white px-3 py-1 font-bold uppercase text-[11px] tracking-wider text-center">
                  COMMENTS
                </div>
                <div className="p-3 text-xs text-neutral-800 space-y-1">
                  <p>• Invoice No: <strong>{selectedOrder.invoiceNumber}</strong></p>
                  <p>• Assigned MIO: {selectedOrder.assignedMio}</p>
                  <p>• Delivery Fleet: {selectedOrder.deliveryMethod}</p>
                  {selectedOrder.comments && <p>• Notes: {selectedOrder.comments}</p>}
                </div>
              </div>

              <div className="w-72 border border-black">
                <div className="flex border-b border-black">
                  <div className="w-32 bg-black text-white px-2.5 py-1.5 font-bold text-[11px] uppercase flex items-center">
                    SUBTOTAL
                  </div>
                  <div className="flex-1 p-1.5 text-right font-mono font-medium text-xs">
                    ৳{inspectSubtotal.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="flex border-b border-black">
                  <div className="w-32 bg-black text-white px-2.5 py-1.5 font-bold text-[11px] uppercase flex items-center">
                    DISCOUNT ({inspectDiscountPercent}%)
                  </div>
                  <div className="flex-1 p-1.5 text-right font-mono text-xs">
                    -৳{inspectDiscountAmount.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-32 bg-black text-white px-2.5 py-1.5 font-bold text-[11px] uppercase flex items-center">
                    GRAND TOTAL
                  </div>
                  <div className="flex-1 p-1.5 text-right font-mono font-bold text-sm">
                    ৳{inspectGrandTotal.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 pt-8 border-t-2 border-slate-200 grid grid-cols-2 gap-12 text-[10px] text-center">
              <div>
                <div className="w-48 border-b border-slate-400 mx-auto mb-1.5" />
                <strong className="text-slate-900 block text-xs">Chief Executive Officer (CEO)</strong>
                <span className="text-slate-500">Authorized Signature</span>
              </div>
              <div>
                <div className="w-48 border-b border-slate-400 mx-auto mb-1.5" />
                <strong className="text-slate-900 block text-xs">Managing Director (MD)</strong>
                <span className="text-slate-500">Authorized Signature</span>
              </div>
            </div>

            <div className="mt-10 text-center font-bold text-sm uppercase tracking-widest font-serif">
              THANK YOU FOR YOUR BUSINESS
            </div>
          </div>
        </div>
      )}
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
