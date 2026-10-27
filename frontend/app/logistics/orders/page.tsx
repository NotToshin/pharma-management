"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { API_URL } from "@/lib/api"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Wallet,
} from "lucide-react"
import { OrderInvoiceSheet } from "@/components/logistics/order-invoice"

interface InvoiceItem {
  no: number
  description: string
  quantity: number
  unitCost: number
  total: number
}

interface SalesOrder {
  id: string
  orderNumber: string
  orderDate: string
  pharmacyName: string
  territory: string
  assignedMio: string
  itemsSummary: string
  itemsDetail: InvoiceItem[]
  totalBoxes: number
  orderValue: number
  paidAmount?: number
  paymentStatus?: string
  discountPercent: number
  discountAmount: number
  comments: string
  deliveryMethod:
    | "Sales Representative"
    | "Medical Information Officer"
    | "Third Party Courier"
  status:
    | "Pending Credit Check"
    | "FEFO Allocated"
    | "Out for Delivery"
    | "Delivered & Invoiced"
    | "Cancelled"
  invoiceNumber: string
}

interface ClientOption {
  id: string
  clientCode: string
  pharmacyName: string
  territory: string
  assignedMio: string
  status: string
  creditLimitBDT: number
  outstandingBalanceBDT: number
  address?: string
  phone?: string
}

interface StaffOption {
  id: string
  fullName: string
  department: string
  designation: string
}

interface StockProduct {
  id: string
  name: string
  stockQty: number
  unitPrice: number
}

function parseSummaryToRows(
  summary: string,
  totalVal: number,
  totalBoxes: number
): InvoiceItem[] {
  if (!summary)
    return [
      {
        no: 1,
        description: "Pharmaceutical Products",
        quantity: 1,
        unitCost: totalVal,
        total: totalVal,
      },
    ]

  const parts = summary
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length <= 1 && !summary.includes("(")) {
    return [
      {
        no: 1,
        description: summary,
        quantity: totalBoxes || 1,
        unitCost: totalBoxes ? Math.round(totalVal / totalBoxes) : totalVal,
        total: totalVal,
      },
    ]
  }

  const parsed: InvoiceItem[] = []
  let remainingVal = totalVal

  parts.forEach((part, index) => {
    const match = part.match(/^(.*?)(?:\s*\((\d+)\))?$/)
    const desc = match ? match[1].trim() : part
    const qty = match && match[2] ? parseInt(match[2], 10) : 1
    const approxUnit = Math.round(totalVal / (totalBoxes || parts.length || 1))
    const lineTotal =
      index === parts.length - 1 ? remainingVal : approxUnit * qty
    remainingVal -= lineTotal

    parsed.push({
      no: index + 1,
      description: desc,
      quantity: qty,
      unitCost: qty > 0 ? Math.round(lineTotal / qty) : 0,
      total: lineTotal,
    })
  })

  return parsed
}

function numberToWordsBDT(num: number): string {
  if (num === 0) return "Zero Taka Only"
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ]

  function inWords(n: number): string {
    if (n < 20) return a[n]
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "")
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + inWords(n % 100) : "")
      )
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + inWords(n % 1000) : "")
      )
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + inWords(n % 100000) : "")
      )
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "")
    )
  }

  const rounded = Math.round(Math.abs(num))
  return inWords(rounded).trim() + " Taka Only"
}

function LogisticsOrdersContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [orders, setOrders] = React.useState<SalesOrder[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [territoryFilter, setTerritoryFilter] = React.useState("all")

  const [clientList, setClientList] = React.useState<ClientOption[]>([])
  const [staffList, setStaffList] = React.useState<StaffOption[]>([])
  const [productCatalog, setProductCatalog] = React.useState<StockProduct[]>([])

  const [pharmacyInput, setPharmacyInput] = React.useState("")
  const [pharmacySuggestions, setPharmacySuggestions] = React.useState<
    ClientOption[]
  >([])
  const [activeSuggestionRow, setActiveSuggestionRow] = React.useState<
    number | null
  >(null)

  const [isNewOrderOpen, setIsNewOrderOpen] = React.useState(false)
  const [territory, setTerritory] = React.useState("Dhaka North")
  const [assignedMio, setAssignedMio] = React.useState("")
  const [deliveryMethod, setDeliveryMethod] = React.useState<
    SalesOrder["deliveryMethod"]
  >("Sales Representative")
  const [orderComments, setOrderComments] = React.useState("")
  const [discountPercent, setDiscountPercent] = React.useState<number>(0)

  const [lineItems, setLineItems] = React.useState<InvoiceItem[]>([
    { no: 1, description: "", quantity: 1, unitCost: 0, total: 0 },
  ])

  const [clientCreditNotice, setClientCreditNotice] = React.useState<{
    status: string
    avail: string
  } | null>(null)
  const [selectedOrder, setSelectedOrder] = React.useState<SalesOrder | null>(
    null
  )
  const [isInspectOpen, setIsInspectOpen] = React.useState(false)

  const fetchBackendData = React.useCallback(async () => {
    try {
      const [ordRes, clientRes, staffRes, invRes] = await Promise.all([
        fetch(`${API_URL}/orders`).catch(() => ({
          ok: false,
          json: async () => [],
        })),
        fetch(`${API_URL}/clients`).catch(() => ({
          ok: false,
          json: async () => [],
        })),
        fetch(`${API_URL}/staff`).catch(() => ({
          ok: false,
          json: async () => [],
        })),
        // Connected directly to the live inventory batch ledger
        fetch(`${API_URL}/inventory`).catch(() => ({
          ok: false,
          json: async () => [],
        })),
      ])

      // Dynamic Product Catalog mapped from live inventory batches
      if (invRes.ok) {
        const batchData = await invRes.json()
        const rawBatches = Array.isArray(batchData) ? batchData : batchData?.data || []
        if (Array.isArray(rawBatches) && rawBatches.length > 0) {
          // Group by medicine brand name and sum total available units
          const groupedMap = new Map<string, StockProduct>()

          rawBatches.forEach((b: any) => {
            const name = (b.brandName || b.name || "Medicine").trim()
            const units = Number(b.availableUnits ?? b.stockQty ?? 0)
            const price = Number(b.unitPrice ?? 0)

            if (!groupedMap.has(name)) {
              groupedMap.set(name, {
                id: b.id,
                name: name,
                stockQty: units,
                unitPrice: price,
              })
            } else {
              const current = groupedMap.get(name)!
              current.stockQty += units
              // Keep latest unit price if available
              if (price > 0) current.unitPrice = price
            }
          })

          setProductCatalog(Array.from(groupedMap.values()))
        } else {
          setProductCatalog([])
        }
      }

      if (ordRes.ok) {
        const ordData = await ordRes.json()
        const rawOrders = Array.isArray(ordData) ? ordData : ordData?.data || []
        setOrders(
          rawOrders.map((item: any, idx: number) => {
            let parsedItems: InvoiceItem[] = []
            if (
              Array.isArray(item.itemsDetail) &&
              item.itemsDetail.length > 0
            ) {
              parsedItems = item.itemsDetail.map((it: any) => ({
                no: Number(it.no) || 1,
                description: it.description,
                quantity: Number(it.quantity) || 1,
                unitCost: Number(it.unitCost) || 0,
                total: Number(it.total) || 0,
              }))
            } else if (typeof item.itemsDetail === "string") {
              try {
                parsedItems = JSON.parse(item.itemsDetail)
              } catch {
                parsedItems = parseSummaryToRows(
                  item.itemsSummary,
                  Number(item.orderValue) || 0,
                  Number(item.totalBoxes) || 1
                )
              }
            } else {
              parsedItems = parseSummaryToRows(
                item.itemsSummary,
                Number(item.orderValue) || 0,
                Number(item.totalBoxes) || 1
              )
            }

            const sequentialInvoiceNo =
              item.invoiceNumber ||
              `INV-2026-${String(idx + 1).padStart(4, "0")}`
            const rawDiscount = Number(
              item.discountPercent ?? item.discount ?? 0
            )
            const computedSubtotal = parsedItems.reduce(
              (acc, curr) => acc + (curr.total || 0),
              0
            )

            const pct =
              item.discountPercent !== undefined
                ? rawDiscount
                : computedSubtotal > 0 && rawDiscount <= 100
                  ? rawDiscount
                  : computedSubtotal > 0
                    ? Math.round((rawDiscount / computedSubtotal) * 100)
                    : 0

            const monetaryDiscount = Math.round((computedSubtotal * pct) / 100)

            return {
              id: item.id,
              orderNumber:
                item.orderNumber ||
                `SO-2026-${String(idx + 1).padStart(4, "0")}`,
              orderDate: item.orderDate || "28 Sep 2026",
              pharmacyName: item.pharmacyName,
              territory: item.territory || "Dhaka North",
              assignedMio: item.assignedMio || "General MIO",
              itemsSummary: item.itemsSummary || "General Formulations",
              itemsDetail: parsedItems,
              totalBoxes: Number(item.totalBoxes) || 1,
              orderValue:
                Number(item.orderValue) ||
                Math.max(0, computedSubtotal - monetaryDiscount),
              paidAmount: Number(item.paidAmount) || 0,
              paymentStatus: item.paymentStatus || "UNPAID",
              discountPercent: pct,
              discountAmount: monetaryDiscount,
              comments: item.comments || "",
              deliveryMethod: item.deliveryMethod || "Sales Representative",
              status: item.status || "FEFO Allocated",
              invoiceNumber: sequentialInvoiceNo,
            }
          })
        )
      }

      if (clientRes.ok) {
        const clientData = await clientRes.json()
        const rawClients = Array.isArray(clientData) ? clientData : clientData?.data || []
        setClientList(rawClients)
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json()
        const rawStaff = Array.isArray(staffData) ? staffData : staffData?.data || []
        setStaffList(rawStaff)
      }

      setLoading(false)
    } catch (err) {
      console.error("Error loading logistics records:", err)
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchBackendData()
  }, [fetchBackendData])

  React.useEffect(() => {
    const incomingPharmacy = searchParams.get("pharmacy")
    const incomingTerritory = searchParams.get("territory")
    const incomingMio = searchParams.get("mio")
    const incomingCredit = searchParams.get("creditStatus")
    const incomingAvail = searchParams.get("availableCredit")

    if (incomingPharmacy) {
      setPharmacyInput(incomingPharmacy)
      if (incomingTerritory) setTerritory(incomingTerritory)
      if (incomingMio) setAssignedMio(incomingMio)
      if (incomingCredit) {
        setClientCreditNotice({
          status: incomingCredit,
          avail: incomingAvail || "0",
        })
      }
      setIsNewOrderOpen(true)
    }
  }, [searchParams])

  const handlePharmacyTyping = (val: string) => {
    setPharmacyInput(val)
    if (!val.trim()) {
      setPharmacySuggestions([])
      return
    }
    const query = val.toLowerCase()
    const matches = clientList.filter(
      (c) =>
        c.pharmacyName.toLowerCase().includes(query) ||
        c.clientCode.toLowerCase().includes(query)
    )
    setPharmacySuggestions(matches)
  }

  const handleSelectPharmacy = (client: ClientOption) => {
    setPharmacyInput(client.pharmacyName)
    if (client.territory) setTerritory(client.territory)
    if (client.assignedMio && !assignedMio) {
      setAssignedMio(client.assignedMio)
    }
    const avail = Math.max(
      0,
      client.creditLimitBDT - client.outstandingBalanceBDT
    )
    setClientCreditNotice({
      status: client.status,
      avail: String(avail),
    })
    setPharmacySuggestions([])
  }

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) {
      setLineItems([
        { no: 1, description: "", quantity: 1, unitCost: 0, total: 0 },
      ])
      return
    }
    setLineItems((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((item, idx) => ({
          ...item,
          no: idx + 1,
        }))
    )
  }

  const handleUpdateLineItem = (
    index: number,
    field: keyof InvoiceItem,
    value: any
  ) => {
    setLineItems((prev) => {
      const isLastRow = index === prev.length - 1
      const isEnteringDescription =
        field === "description" &&
        typeof value === "string" &&
        value.trim() !== ""
      const wasPreviouslyEmpty = prev[index].description.trim() === ""

      const updatedList = prev.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value }
          if (field === "quantity" || field === "unitCost") {
            const qty =
              field === "quantity" ? Number(value) || 0 : item.quantity
            const cost =
              field === "unitCost" ? Number(value) || 0 : item.unitCost
            updated.total = qty * cost
          }
          return updated
        }
        return item
      })

      if (isLastRow && isEnteringDescription && wasPreviouslyEmpty) {
        updatedList.push({
          no: updatedList.length + 1,
          description: "",
          quantity: 1,
          unitCost: 0,
          total: 0,
        })
      }

      return updatedList.map((item, idx) => ({
        ...item,
        no: idx + 1,
      }))
    })
  }

  const handleSelectStockProduct = (index: number, prod: StockProduct) => {
    setLineItems((prev) => {
      const isLastRow = index === prev.length - 1
      const wasEmpty = prev[index].description.trim() === ""

      const updatedList = prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            description: prod.name,
            unitCost: prod.unitPrice,
            total: (item.quantity || 1) * prod.unitPrice,
          }
        }
        return item
      })

      if (isLastRow && wasEmpty) {
        updatedList.push({
          no: updatedList.length + 1,
          description: "",
          quantity: 1,
          unitCost: 0,
          total: 0,
        })
      }

      return updatedList.map((item, idx) => ({
        ...item,
        no: idx + 1,
      }))
    })
    setActiveSuggestionRow(null)
  }

  const validLineItems = React.useMemo(
    () => lineItems.filter((item) => item.description.trim() !== ""),
    [lineItems]
  )

  const calculatedSubtotal = React.useMemo(
    () => validLineItems.reduce((acc, curr) => acc + curr.total, 0),
    [validLineItems]
  )

  // Global Delete Modal State
  const [orderToDelete, setOrderToDelete] = React.useState<SalesOrder | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [isDeletingOrder, setIsDeletingOrder] = React.useState(false)

  const calculatedDiscountAmount = Math.round(
    (calculatedSubtotal * (discountPercent || 0)) / 100
  )
  const calculatedGrandTotal = Math.max(
    0,
    calculatedSubtotal - calculatedDiscountAmount
  )

  const totalBoxesCalculated = React.useMemo(
    () =>
      validLineItems.reduce(
        (acc, curr) => acc + (Number(curr.quantity) || 0),
        0
      ),
    [validLineItems]
  )

  const itemsSummaryString = React.useMemo(
    () =>
      validLineItems
        .map((i) => `${i.description} (${i.quantity})`)
        .join(", ") || "General Pharmaceuticals",
    [validLineItems]
  )

  const nextSerialInvoiceNo = `INV-2026-${String(orders.length + 1).padStart(4, "0")}`

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pharmacyInput.trim()) {
      toast.error("Please specify a pharmacy or chemist name.")
      return
    }
    if (validLineItems.length === 0) {
      toast.error("Please specify at least one product description.")
      return
    }

    const toastId = toast.loading("Submitting sales order to warehouse...")
    try {
      const isHold = clientCreditNotice?.status === "Credit Hold"

      const payload = {
        orderNumber: `SO-2026-${String(orders.length + 1).padStart(4, "0")}`,
        orderDate: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        pharmacyName: pharmacyInput.trim(),
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
      }

      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || "Failed to submit sales order")
      }

      toast.success("Sales order submitted successfully!", { id: toastId })
      setIsNewOrderOpen(false)
      setPharmacyInput("")
      setAssignedMio("")
      setTerritory("Dhaka North")
      setLineItems([
        { no: 1, description: "", quantity: 1, unitCost: 0, total: 0 },
      ])
      setDiscountPercent(0)
      setOrderComments("")
      setClientCreditNotice(null)
      fetchBackendData()
    } catch (error: any) {
      console.error("Error creating sales order:", error)
      toast.error(error.message || "Failed to submit order to warehouse.", { id: toastId })
    }
  }

  const handleUpdateStatus = async (
    id: string,
    newStatus: SalesOrder["status"]
  ) => {
    const toastId = toast.loading(`Updating order status to ${newStatus}...`)
    try {
      const res = await fetch(`${API_URL}/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || "Failed to update status")
      }

      toast.success(`Order status updated to ${newStatus}`, { id: toastId })
      fetchBackendData()
    } catch (error: any) {
      console.error("Error updating order status:", error)
      toast.error(error.message || "Failed to update order status.", { id: toastId })
    }
  }

  const handleUpdateOrderMio = async (id: string, newMio: string) => {
    setSelectedOrder((prev) => (prev && prev.id === id ? { ...prev, assignedMio: newMio } : prev))
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, assignedMio: newMio } : o))
    )

    try {
      const res = await fetch(`${API_URL}/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedMio: newMio }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || "Failed to update sales representative")
      }

      toast.success(`Sales representative updated to ${newMio}`)
    } catch (error: any) {
      console.error("Error updating sales representative:", error)
      toast.error(error.message || "Failed to update sales rep on server.")
      fetchBackendData()
    }
  }

  const handleOpenDeleteModal = (order: SalesOrder) => {
    setOrderToDelete(order)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return
    const toastId = toast.loading(`Deleting sales order ${orderToDelete.orderNumber}...`)
    try {
      setIsDeletingOrder(true)
      const res = await fetch(`${API_URL}/orders/${orderToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to delete order")
      }

      toast.success(`Sales order ${orderToDelete.orderNumber} deleted successfully.`, { id: toastId })
      setIsDeleteModalOpen(false)
      setOrderToDelete(null)
      fetchBackendData()
    } catch (error: any) {
      console.error("Error deleting order:", error)
      toast.error(error.message || "Failed to delete order record.", { id: toastId })
    } finally {
      setIsDeletingOrder(false)
    }
  }

  const handleExportExcel = () => {
    const exportData = orders.map((o) => ({
      "Order Number": o.orderNumber,
      "Order Date": o.orderDate,
      "Chemist / Pharmacy": o.pharmacyName,
      Territory: o.territory,
      "Assigned MIO": o.assignedMio,
      "Item Breakdown": o.itemsSummary,
      Boxes: o.totalBoxes,
      "Discount (%)": `${o.discountPercent}%`,
      "Discount Value (৳)": o.discountAmount,
      "Total Amount (৳)": o.orderValue,
      "Logistics Method": o.deliveryMethod,
      "Fulfillment Status": o.status,
      "Invoice Number": o.invoiceNumber,
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logistics Orders")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Logistics_Orders_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
  }

  const filteredOrders = React.useMemo(() => {
    const q = searchQuery.toLowerCase()
    const sf = statusFilter.toLowerCase()
    const tf = territoryFilter.toLowerCase()

    return orders.filter((ord) => {
      const matchesSearch =
        !q ||
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.pharmacyName.toLowerCase().includes(q) ||
        ord.itemsSummary.toLowerCase().includes(q) ||
        ord.assignedMio.toLowerCase().includes(q) ||
        Boolean(
          ord.invoiceNumber && ord.invoiceNumber.toLowerCase().includes(q)
        )

      const matchesStatus = sf === "all" || ord.status.toLowerCase() === sf
      const matchesTerritory =
        tf === "all" || ord.territory.toLowerCase() === tf

      return matchesSearch && matchesStatus && matchesTerritory
    })
  }, [orders, searchQuery, statusFilter, territoryFilter])

  const totalRevenue = React.useMemo(
    () => orders.reduce((acc, curr) => acc + curr.orderValue, 0),
    [orders]
  )

  const activeRepsCount = React.useMemo(() => {
    const reps = new Set(
      orders.map((o) => o.assignedMio).filter((m) => m && m !== "Unassigned")
    )
    return reps.size
  }, [orders])

  const pendingCreditCount = React.useMemo(
    () => orders.filter((o) => o.status === "Pending Credit Check").length,
    [orders]
  )

  // Dynamic OTIF Calculation (Delivered & Invoiced / Total non-cancelled orders)
  const otifMetrics = React.useMemo(() => {
    const nonCancelled = orders.filter((o) => o.status !== "Cancelled")
    if (nonCancelled.length === 0) {
      return { percentage: "100.0%", isTargetMet: true }
    }
    const delivered = nonCancelled.filter(
      (o) => o.status === "Delivered & Invoiced"
    ).length
    const rate = ((delivered / nonCancelled.length) * 100).toFixed(1)
    return {
      percentage: `${rate}%`,
      isTargetMet: parseFloat(rate) >= 95,
    }
  }, [orders])

  const matchedClient = React.useMemo(
    () =>
      selectedOrder
        ? clientList.find((c) => c.pharmacyName === selectedOrder.pharmacyName)
        : null,
    [clientList, selectedOrder]
  )

  const activeInvoiceRows = React.useMemo(() => {
    if (!selectedOrder) return []
    if (
      selectedOrder.itemsDetail &&
      Array.isArray(selectedOrder.itemsDetail) &&
      selectedOrder.itemsDetail.length > 0
    ) {
      const valid = selectedOrder.itemsDetail.filter(
        (i) => i.description && i.description.trim() !== ""
      )
      if (valid.length > 0) return valid
    }
    return parseSummaryToRows(
      selectedOrder.itemsSummary,
      selectedOrder.orderValue,
      selectedOrder.totalBoxes
    )
  }, [selectedOrder])

  const inspectSubtotal = React.useMemo(
    () => activeInvoiceRows.reduce((sum, item) => sum + item.total, 0),
    [activeInvoiceRows]
  )

  const inspectDiscountPercent = selectedOrder?.discountPercent || 0
  const inspectDiscountAmount =
    selectedOrder?.discountAmount ??
    Math.round((inspectSubtotal * inspectDiscountPercent) / 100)
  const inspectGrandTotal =
    selectedOrder?.orderValue ||
    Math.max(0, inspectSubtotal - inspectDiscountAmount)

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-10">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          [data-slot="dialog-portal"],
          [data-slot="dialog-overlay"],
          [data-slot="dialog-content"],
          [data-sidebar="sidebar"],
          aside,
          header,
          nav,
          button,
          .print\\:hidden {
            display: none !important;
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
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            z-index: 999999 !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Order Fulfillment & Logistics Dispatch
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Process pharmacy orders, allocate warehouse FEFO batches, and
            trigger serial invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Order Roster
          </Button>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Link href="/finance/buyer-payments">
              <Wallet className="h-3.5 w-3.5 text-emerald-600" />
              Buyer Payments
            </Link>
          </Button>

          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
              >
                <Plus className="h-4 w-4" />
                Create Sales Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Book New Commercial Order & Invoice
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Select destination chemist, pick formulations from inventory,
                  and generate sequential invoice.
                </DialogDescription>
              </DialogHeader>

              {clientCreditNotice && (
                <div
                  className={`my-1 flex items-center justify-between rounded-xl border p-3 text-xs ${
                    clientCreditNotice.status === "Credit Hold"
                      ? "border-rose-200 bg-rose-50 text-rose-800"
                      : "border-blue-200 bg-blue-50 text-blue-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {clientCreditNotice.status === "Credit Hold" ? (
                      <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                    ) : (
                      <Store className="h-4 w-4 shrink-0 text-[#0090FF]" />
                    )}
                    <div>
                      <span className="block font-bold">
                        Linked from Client Master:
                      </span>
                      <span className="text-[11px]">
                        Available Headroom: ৳
                        {Number(clientCreditNotice.avail).toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      clientCreditNotice.status === "Credit Hold"
                        ? "border-rose-300 bg-white font-bold text-rose-700"
                        : "border-blue-300 bg-white font-bold text-blue-700"
                    }
                  >
                    {clientCreditNotice.status}
                  </Badge>
                </div>
              )}

              <form onSubmit={handleCreateOrder} className="space-y-4 py-2">
                <div className="relative space-y-1.5">
                  <Label
                    htmlFor="pharmacy"
                    className="text-xs font-medium text-slate-700"
                  >
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
                    <div className="absolute right-0 left-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                      {pharmacySuggestions.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectPharmacy(c)}
                          className="flex cursor-pointer items-center justify-between border-b border-slate-50 px-3 py-2 text-xs last:border-0 hover:bg-blue-50"
                        >
                          <div>
                            <strong className="block text-slate-900">
                              {c.pharmacyName}
                            </strong>
                            <span className="text-[10px] text-slate-400">
                              {c.territory} • Code: {c.clientCode}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[9px]">
                            {c.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="ter"
                      className="text-xs font-medium text-slate-700"
                    >
                      Territory Hub
                    </Label>
                    <Select value={territory} onValueChange={setTerritory}>
                      <SelectTrigger className="h-8 bg-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Dhaka North">Dhaka North</SelectItem>
                        <SelectItem value="Dhaka South">Dhaka South</SelectItem>
                        <SelectItem value="Chittagong Central">
                          Chittagong Central
                        </SelectItem>
                        <SelectItem value="Sylhet Sadar">
                          Sylhet Sadar
                        </SelectItem>
                        <SelectItem value="Rajshahi Metro">
                          Rajshahi Metro
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="mio"
                      className="text-xs font-medium text-slate-700"
                    >
                      Sales Representative
                    </Label>
                    <Select value={assignedMio} onValueChange={setAssignedMio}>
                      <SelectTrigger className="h-8 bg-white text-xs">
                        <SelectValue placeholder="Select Sales Rep" />
                      </SelectTrigger>
                      <SelectContent className="max-h-40 text-xs">
                        {staffList.map((staff) => (
                          <SelectItem key={staff.id} value={staff.fullName}>
                            {staff.fullName} (
                            {staff.designation ||
                              staff.department ||
                              "Field Force"}
                            )
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="delivery-method"
                      className="text-xs font-medium text-slate-700"
                    >
                      Logistics Fleet
                    </Label>
                    <Select
                      value={deliveryMethod}
                      onValueChange={(val) =>
                        setDeliveryMethod(val as SalesOrder["deliveryMethod"])
                      }
                    >
                      <SelectTrigger className="h-8 bg-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="Sales Representative">
                          Sales Representative
                        </SelectItem>
                        <SelectItem value="Medical Information Officer">
                          Medical Information Officer
                        </SelectItem>
                        <SelectItem value="Third Party Courier">
                          Third Party Courier
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                      Invoice Line Items & Products (Connected with Stock
                      Management)
                    </Label>
                    <span className="text-[10px] text-slate-500 italic">
                      * Auto-creates consecutive rows & automatically updates
                      inventory
                    </span>
                  </div>

                  <div className="overflow-visible rounded-lg border border-black">
                    <table className="w-full border-collapse text-center text-xs">
                      <thead>
                        <tr className="bg-black text-[10px] font-bold tracking-wider text-white uppercase">
                          <th className="w-10 border-r border-neutral-700 py-2">
                            No.
                          </th>
                          <th className="border-r border-neutral-700 px-3 py-2 text-left">
                            Product / Medicine
                          </th>
                          <th className="w-20 border-r border-neutral-700 py-2">
                            Boxes
                          </th>
                          <th className="w-28 border-r border-neutral-700 py-2">
                            Unit Price (৳)
                          </th>
                          <th className="w-28 border-r border-neutral-700 py-2">
                            Total (৳)
                          </th>
                          <th className="w-10 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, idx) => (
                          <tr
                            key={idx}
                            className="relative border-b border-slate-200 last:border-0"
                          >
                            <td className="border-r border-slate-200 py-1.5 font-mono font-bold text-slate-600">
                              {item.no}
                            </td>
                            <td className="relative border-r border-slate-200 px-2 py-1.5 text-left">
                              <Input
                                placeholder="Choose or search stock product..."
                                value={item.description}
                                onChange={(e) => {
                                  handleUpdateLineItem(
                                    idx,
                                    "description",
                                    e.target.value
                                  )
                                  setActiveSuggestionRow(idx)
                                }}
                                onFocus={() => setActiveSuggestionRow(idx)}
                                className="h-7 border-slate-200 text-xs font-medium"
                              />
                              {activeSuggestionRow === idx && (
                                <div className="absolute right-2 left-2 z-50 mt-0.5 max-h-48 overflow-y-auto rounded border border-slate-300 bg-white shadow-lg">
                                  {productCatalog
                                    .filter((p) =>
                                      p.name
                                        .toLowerCase()
                                        .includes(
                                          (item.description || "").toLowerCase()
                                        )
                                    )
                                    .map((prod) => (
                                      <div
                                        key={prod.id}
                                        onClick={() =>
                                          handleSelectStockProduct(idx, prod)
                                        }
                                        className="flex cursor-pointer items-center justify-between border-b border-slate-100 px-3 py-2 text-xs last:border-0 hover:bg-blue-50"
                                      >
                                        <div>
                                          <span className="block font-bold text-slate-900">
                                            {prod.name}
                                          </span>
                                          <span className="font-mono text-[11px] font-semibold text-emerald-600">
                                            Stock: {prod.stockQty} boxes
                                          </span>
                                        </div>
                                        <span className="font-mono text-xs font-bold text-slate-700">
                                          ৳
                                          {prod.unitPrice.toLocaleString(
                                            "en-IN"
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  {productCatalog.filter((p) =>
                                    p.name
                                      .toLowerCase()
                                      .includes(
                                        (item.description || "").toLowerCase()
                                      )
                                  ).length === 0 && (
                                    <div className="px-3 py-2 text-xs text-slate-400 italic">
                                      No matching inventory products found
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="border-r border-slate-200 px-2 py-1.5">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateLineItem(
                                    idx,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                className="h-7 border-slate-200 text-center font-mono text-xs"
                              />
                            </td>
                            <td className="border-r border-slate-200 px-2 py-1.5">
                              <Input
                                type="number"
                                min="0"
                                value={item.unitCost}
                                onChange={(e) =>
                                  handleUpdateLineItem(
                                    idx,
                                    "unitCost",
                                    e.target.value
                                  )
                                }
                                className="h-7 border-slate-200 text-right font-mono text-xs"
                              />
                            </td>
                            <td className="border-r border-slate-200 px-2 py-1.5 text-right font-mono font-bold text-slate-900">
                              ৳{item.total.toLocaleString("en-IN")}
                            </td>
                            <td className="px-1 py-1.5">
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

                <div className="grid grid-cols-2 items-start gap-4 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-700">
                      Comments / Logistics Notes
                    </Label>
                    <Input
                      placeholder="Special delivery instructions or comments..."
                      value={orderComments}
                      onChange={(e) => setOrderComments(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="overflow-hidden rounded-lg border border-black text-xs">
                    <div className="flex border-b border-black">
                      <div className="flex w-28 items-center bg-black px-2 py-1.5 text-[10px] font-bold text-white uppercase">
                        SUBTOTAL
                      </div>
                      <div className="flex-1 p-1.5 text-right font-mono font-bold">
                        ৳{calculatedSubtotal.toLocaleString("en-IN")}
                      </div>
                    </div>

                    {/* Discount in % */}
                    <div className="flex items-center border-b border-black">
                      <div className="flex w-28 items-center bg-black px-2 py-1.5 text-[10px] font-bold text-white uppercase">
                        DISCOUNT (%)
                      </div>
                      <div className="flex flex-1 items-center justify-end gap-2 px-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={discountPercent}
                            onChange={(e) =>
                              setDiscountPercent(
                                Math.min(
                                  100,
                                  Math.max(0, Number(e.target.value) || 0)
                                )
                              )
                            }
                            className="h-6 w-16 border-slate-200 bg-white px-1.5 py-0 text-right font-mono text-xs"
                          />
                          <span className="font-bold text-slate-700">%</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500">
                          (-৳{calculatedDiscountAmount.toLocaleString("en-IN")})
                        </span>
                      </div>
                    </div>

                    <div className="flex bg-slate-50">
                      <div className="flex w-28 items-center bg-black px-2 py-1.5 text-[10px] font-bold text-white uppercase">
                        GRAND TOTAL
                      </div>
                      <div className="flex-1 p-1.5 text-right font-mono text-sm font-extrabold text-[#0090FF]">
                        ৳{calculatedGrandTotal.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewOrderOpen(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
                  >
                    Submit Order & Deduct Stock
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Pipeline Order Volume
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {orders.length} Orders
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            ৳{totalRevenue.toLocaleString("en-IN")} Gross Billed Value
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Sales Representative
            </span>
            <div className="rounded-lg bg-blue-50 p-1.5 text-[#0090FF]">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {activeRepsCount} Active
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Assigned across territorial field routes
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Credit Hold Approvals
            </span>
            <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {pendingCreditCount} Orders
          </div>
          <p className="mt-3 text-[11px] font-medium text-amber-600">
            Awaiting credit clearance from Finance
          </p>
        </Card>

        {/* Dynamic Fulfillment Efficiency (OTIF) */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Fulfillment Efficiency (OTIF)
            </span>
            <Badge
              variant="outline"
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                otifMetrics.isTargetMet
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              Target: 95%
            </Badge>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {otifMetrics.percentage}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            On-Time & In-Full delivery index
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search order #, pharmacy, invoice #, or MIO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[170px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Order Stages" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="pending credit check">
                Pending Credit Check
              </SelectItem>
              <SelectItem value="fefo allocated">FEFO Allocated</SelectItem>
              <SelectItem value="out for delivery">Out for Delivery</SelectItem>
              <SelectItem value="delivered & invoiced">
                Delivered & Invoiced
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
            <SelectTrigger className="h-8 w-[150px] border-slate-200 bg-white text-xs">
              <SelectValue placeholder="All Territories" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Territories</SelectItem>
              <SelectItem value="dhaka north">Dhaka North</SelectItem>
              <SelectItem value="dhaka south">Dhaka South</SelectItem>
              <SelectItem value="chittagong central">
                Chittagong Central
              </SelectItem>
              <SelectItem value="sylhet sadar">Sylhet Sadar</SelectItem>
              <SelectItem value="rajshahi metro">Rajshahi Metro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Main Order Ledger Table */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none print:hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              COMMERCIAL SALES ORDER REGISTER
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Live batch picking and sequential commercial sales invoice
              generation
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredOrders.length} Orders
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0 text-xs font-medium text-slate-600">
                Order Ref & Date
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Destination Chemist
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Items / Formulations
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Delivery Fleet
              </TableHead>
              <TableHead className="text-center text-xs font-medium text-slate-600">
                Boxes
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-slate-600">
                Order Value
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Invoice No.
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Fulfillment Status
              </TableHead>
              <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-8 text-center text-xs text-slate-400"
                >
                  Loading order register from database...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-8 text-center text-xs text-slate-400"
                >
                  No sales orders found. Click "Create Sales Order" to book a
                  dispatch.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((ord) => (
                <TableRow
                  key={ord.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50"
                >
                  <TableCell className="py-3 pl-0">
                    <div className="leading-tight">
                      <span className="block font-mono text-xs font-bold text-[#0090FF]">
                        {ord.orderNumber}
                      </span>
                      <span className="mt-0.5 text-[10px] text-slate-400">
                        {ord.orderDate}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-800">
                    <div>
                      <span className="block font-semibold text-slate-900">
                        {ord.pharmacyName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {ord.territory} • MIO: {ord.assignedMio}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="max-w-[210px] truncate py-3 text-xs text-slate-600">
                    {ord.itemsSummary}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="max-w-[140px] truncate font-medium">
                        {ord.deliveryMethod}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-center font-mono text-xs font-medium text-slate-700">
                    {ord.totalBoxes}
                  </TableCell>

                  <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-900">
                    <div>
                      <span>৳{ord.orderValue.toLocaleString("en-IN")}</span>
                      {ord.paymentStatus && ord.paymentStatus !== "UNPAID" && (
                        <span className="block text-[10px] font-normal text-slate-400">
                          {ord.paymentStatus.replace("_", " ")} · ৳{(ord.paidAmount || 0).toLocaleString("en-IN")}
                        </span>
                      )}
                      {ord.discountPercent > 0 && (
                        <span className="block text-[10px] font-normal text-emerald-600">
                          {ord.discountPercent}% OFF
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrder(ord)
                        setIsInspectOpen(true)
                      }}
                      className="block font-mono text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer text-left"
                      title="Click to view / print invoice"
                    >
                      {ord.invoiceNumber}
                    </button>
                  </TableCell>

                  <TableCell className="py-3 text-xs">
                    <Badge
                      variant="outline"
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        ord.status === "Delivered & Invoiced"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : ord.status === "Out for Delivery"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : ord.status === "FEFO Allocated"
                              ? "border-purple-200 bg-purple-50 text-purple-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {ord.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3 pr-0 text-right text-xs">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-52 bg-white"
                      >
                        <DropdownMenuLabel className="text-[10px] tracking-wider text-slate-400 uppercase">
                          Workflow Transitions
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedOrder(ord)
                            setIsInspectOpen(true)
                          }}
                          className="cursor-pointer text-xs font-semibold text-slate-700"
                        >
                          <FileText className="mr-2 h-3.5 w-3.5 text-slate-500" />
                          View / Print Invoice
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />

                        {ord.status !== "Cancelled" && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/finance/buyer-payments?orderId=${ord.id}`)}
                            className="cursor-pointer text-xs font-semibold text-emerald-700"
                          >
                            <Wallet className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                            Collect Buyer Payment
                          </DropdownMenuItem>
                        )}

                        {ord.status === "Pending Credit Check" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(ord.id, "FEFO Allocated")
                            }
                            className="cursor-pointer text-xs text-emerald-600"
                          >
                            <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                            Approve Credit & Allocate Batches
                          </DropdownMenuItem>
                        )}

                        {ord.status === "FEFO Allocated" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(ord.id, "Out for Delivery")
                            }
                            className="cursor-pointer text-xs text-[#0090FF]"
                          >
                            <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                            Dispatch on Route
                          </DropdownMenuItem>
                        )}

                        {ord.status === "Out for Delivery" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(ord.id, "Delivered & Invoiced")
                            }
                            className="cursor-pointer text-xs font-semibold text-emerald-600"
                          >
                            <PackageCheck className="mr-2 h-3.5 w-3.5" />
                            Mark Delivered & Invoiced
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateStatus(ord.id, "Cancelled")
                          }
                          className="cursor-pointer text-xs text-amber-600"
                        >
                          <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                          Cancel Order
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleOpenDeleteModal(ord)}
                          className="cursor-pointer text-xs text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5 text-rose-600" />
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
        <DialogContent className="flex max-h-[96vh] flex-col overflow-hidden rounded-2xl bg-white p-0 sm:max-w-[840px]">
          {selectedOrder && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 p-4 print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#0090FF]" />
                  <span className="text-xs font-bold text-slate-800">
                    Invoice Preview — {selectedOrder.invoiceNumber}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                      Sales Rep (MIO):
                    </span>
                    <Select
                      value={selectedOrder.assignedMio || ""}
                      onValueChange={(val) => handleUpdateOrderMio(selectedOrder.id, val)}
                    >
                      <SelectTrigger className="h-8 w-44 border-slate-300 bg-white text-xs font-semibold text-slate-800">
                        <SelectValue placeholder="Select Sales Rep" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 text-xs">
                        {staffList.map((staff) => (
                          <SelectItem key={staff.id} value={staff.fullName}>
                            {staff.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => window.print()}
                    className="h-8 gap-1.5 bg-[#0090FF] text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print / Save PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsInspectOpen(false)}
                    className="h-8 text-xs font-semibold text-slate-700"
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* On-screen Preview */}
              <div className="flex max-h-[78vh] justify-center overflow-y-auto bg-slate-100/90 p-6">
                <div className="w-full max-w-[760px] border border-slate-300 bg-white p-8 text-black shadow-md">
                  <OrderInvoiceSheet
                    order={selectedOrder}
                    client={matchedClient}
                    items={activeInvoiceRows}
                    subtotal={inspectSubtotal}
                    discountAmount={inspectDiscountAmount}
                    grandTotal={inspectGrandTotal}
                  />
                </div>
              </div>

              {selectedOrder.status !== "Delivered & Invoiced" && (
                <div className="flex justify-end border-t border-slate-200 bg-slate-50 p-3 print:hidden">
                  <Button
                    size="sm"
                    onClick={() => {
                      handleUpdateStatus(
                        selectedOrder.id,
                        "Delivered & Invoiced"
                      )
                      setIsInspectOpen(false)
                    }}
                    className="h-8 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
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
        <div
          id="print-standalone-invoice"
          className="hidden bg-white p-0 font-sans text-black"
        >
          <div className="mx-auto w-full max-w-[760px] bg-white p-6 text-xs">
            <OrderInvoiceSheet
              order={selectedOrder}
              client={matchedClient}
              items={activeInvoiceRows}
              subtotal={inspectSubtotal}
              discountAmount={inspectDiscountAmount}
              grandTotal={inspectGrandTotal}
            />
          </div>
        </div>
      )}

      {/* Global Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDeleteOrder}
        title="Delete Sales Order"
        description="Are you sure you want to delete this commercial sales order? This database operation will remove the order record."
        itemName={orderToDelete ? `Order ${orderToDelete.orderNumber} - ${orderToDelete.pharmacyName} (৳${orderToDelete.orderValue.toLocaleString("en-IN")})` : undefined}
        confirmText="Delete Sales Order"
        cancelText="Cancel"
        isDeleting={isDeletingOrder}
      />
    </div>
  )
}

export default function LogisticsOrdersPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Loading Logistics Dispatch...
        </div>
      }
    >
      <LogisticsOrdersContent />
    </React.Suspense>
  )
}
