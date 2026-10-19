"use client"

import * as React from "react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { API_URL, apiFetch } from "@/lib/api"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Snowflake,
  ShieldCheck,
  PackageCheck,
  TrendingUp,
  FileText,
  Printer,
  Boxes,
  Truck,
  CreditCard,
  FileCheck,
  Send,
  Eye,
  BadgeAlert,
  Calendar,
  Layers,
  Sparkles,
  X,
  ExternalLink,
  Info,
  Copy,
  XCircle,
  Check,
  Star,
  SlidersHorizontal,
  Phone,
  Mail,
  MapPin,
  RotateCcw,
} from "lucide-react"

export interface PurchaseOrderItem {
  no?: number
  skuCode?: string | null
  drugName: string
  genericName?: string | null
  packSize?: string | null
  quantityOrdered: number
  quantityReceived?: number
  unitCostBDT: number
  totalCostBDT: number
  storageRequirement?: string
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  poDate: string
  expectedDeliveryDate?: string | null
  wholesalerName: string
  wholesalerCode?: string | null
  contactPerson?: string | null
  phone?: string | null
  email?: string | null
  wholesalerAddress?: string | null
  deliveryWarehouse: string
  paymentTerms: string
  items: PurchaseOrderItem[]
  totalUnits: number
  subtotalBDT: number
  discountBDT: number
  taxBDT: number
  totalAmountBDT: number
  status: "Draft" | "Submitted" | "Approved" | "Partially Received" | "Received" | "Cancelled"
  approvalStage?: string | null
  priority: "Routine" | "Urgent / Stockout Risk" | "Emergency Cold-Chain"
  requisitionRef?: string | null
  shippingTerms?: string | null
  notes?: string | null
  createdBy?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  receivedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Wholesaler {
  id: string
  wholesalerCode: string
  name: string
  contactPerson: string
  phone: string
  email?: string | null
  drugLicenseNo: string
  tradeLicense?: string | null
  address: string
  territory: string
  paymentTerms: string
  rating: number
  status: "Active" | "Under Review" | "Blacklisted"
  leadTimeDays: number
  suppliedCategories: string[]
}

export interface ProcurementMetrics {
  totalOrdersCount: number
  totalSpendBDT: number
  pendingApprovalCount: number
  pendingApprovalValueBDT: number
  inTransitCount: number
  inTransitValueBDT: number
  completedCount: number
  completedValueBDT: number
  coldChainPOCount: number
  fulfillmentRate: number
  totalOrderedUnits: number
  totalReceivedUnits: number
}

export interface InventoryBatchOption {
  id: string
  skuCode: string
  brandName: string
  genericName: string
  unitPrice: number
  storageCondition: string
}

const DEFAULT_WAREHOUSES = [
  "Main Distribution Bay - Tejgaon Central",
  "Central Cold Storage - Tongi HQ",
  "Regional Transit Depot - Chittagong",
  "Quarantine Bay Q-01 - Mirpur",
]

const PAYMENT_TERMS_OPTIONS = [
  "Net 15 Days",
  "Net 30 Days",
  "Net 60 Days",
  "Immediate / COD",
  "Advance Payment",
]

export default function WholesalerPurchaseOrdersPage() {
  const [orders, setOrders] = React.useState<PurchaseOrder[]>([])
  const [wholesalers, setWholesalers] = React.useState<Wholesaler[]>([])
  const [inventoryItems, setInventoryItems] = React.useState<InventoryBatchOption[]>([])
  const [metrics, setMetrics] = React.useState<ProcurementMetrics | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [priorityFilter, setPriorityFilter] = React.useState("all")
  const [wholesalerFilter, setWholesalerFilter] = React.useState("all")

  // Create / Edit Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = React.useState(false)
  const [editingOrder, setEditingOrder] = React.useState<PurchaseOrder | null>(null)
  const [isSavingOrder, setIsSavingOrder] = React.useState(false)

  // Order Form State
  const [formData, setFormData] = React.useState<{
    wholesalerName: string
    wholesalerCode: string
    contactPerson: string
    phone: string
    email: string
    wholesalerAddress: string
    deliveryWarehouse: string
    paymentTerms: string
    expectedDeliveryDate: string
    priority: "Routine" | "Urgent / Stockout Risk" | "Emergency Cold-Chain"
    status: "Draft" | "Submitted" | "Approved" | "Partially Received" | "Received" | "Cancelled"
    requisitionRef: string
    shippingTerms: string
    notes: string
    discountBDT: number
    taxBDT: number
    items: PurchaseOrderItem[]
  }>({
    wholesalerName: "",
    wholesalerCode: "",
    contactPerson: "",
    phone: "",
    email: "",
    wholesalerAddress: "",
    deliveryWarehouse: "Main Distribution Bay - Tejgaon Central",
    paymentTerms: "Net 30 Days",
    expectedDeliveryDate: "",
    priority: "Routine",
    status: "Draft",
    requisitionRef: "",
    shippingTerms: "FOB Central Depot",
    notes: "",
    discountBDT: 0,
    taxBDT: 0,
    items: [
      {
        no: 1,
        skuCode: "",
        drugName: "",
        genericName: "",
        packSize: "",
        quantityOrdered: 100,
        quantityReceived: 0,
        unitCostBDT: 0,
        totalCostBDT: 0,
        storageRequirement: "Controlled Ambient (<25°C)",
      },
    ],
  })

  // Multi-tier Approval Modal State
  const [isApprovalModalOpen, setIsApprovalModalOpen] = React.useState(false)
  const [approvingOrder, setApprovingOrder] = React.useState<PurchaseOrder | null>(null)
  const [approvalNote, setApprovalNote] = React.useState("")
  const [approverName, setApproverName] = React.useState("Mahbubur Rashid (Procurement Director)")
  const [isApproving, setIsApproving] = React.useState(false)

  // Stock Receiving / Dock Intake Modal State
  const [isReceiveModalOpen, setIsReceiveModalOpen] = React.useState(false)
  const [receivingOrder, setReceivingOrder] = React.useState<PurchaseOrder | null>(null)
  const [receiveFormItems, setReceiveFormItems] = React.useState<
    Array<{
      no: number
      skuCode?: string
      drugName: string
      quantityOrdered: number
      alreadyReceived: number
      quantityToReceive: number
      batchNumber: string
      mfgDate: string
      expiryDate: string
      warehouseBin: string
      storageCondition: string
      unitPrice: number
    }>
  >([])
  const [receiveChallan, setReceiveChallan] = React.useState("")
  const [receiveNotes, setReceiveNotes] = React.useState("")
  const [syncWithInventory, setSyncWithInventory] = React.useState(true)
  const [isReceivingStock, setIsReceivingStock] = React.useState(false)

  // Official Printable Voucher Modal State
  const [isVoucherModalOpen, setIsVoucherModalOpen] = React.useState(false)
  const [voucherOrder, setVoucherOrder] = React.useState<PurchaseOrder | null>(null)

  // Order Details / Inspector Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false)
  const [detailsOrder, setDetailsOrder] = React.useState<PurchaseOrder | null>(null)

  // Order Cancellation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false)
  const [cancellingOrder, setCancellingOrder] = React.useState<PurchaseOrder | null>(null)
  const [cancelReason, setCancelReason] = React.useState("")
  const [isCancelling, setIsCancelling] = React.useState(false)

  // Wholesalers Management Modal State
  const [isWholesalersModalOpen, setIsWholesalersModalOpen] = React.useState(false)
  const [isNewWholesalerOpen, setIsNewWholesalerOpen] = React.useState(false)
  const [editingWholesaler, setEditingWholesaler] = React.useState<Wholesaler | null>(null)
  const [wholesalerSearchQuery, setWholesalerSearchQuery] = React.useState("")
  const [wholesalerStatusFilter, setWholesalerStatusFilter] = React.useState("all")
  const [newWholesalerForm, setNewWholesalerForm] = React.useState<{
    wholesalerCode: string
    name: string
    contactPerson: string
    phone: string
    email: string
    drugLicenseNo: string
    tradeLicense: string
    address: string
    territory: string
    paymentTerms: string
    rating: number
    leadTimeDays: number
    status: "Active" | "Under Review" | "Blacklisted"
    suppliedCategories: string[]
  }>({
    wholesalerCode: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    drugLicenseNo: "",
    tradeLicense: "",
    address: "",
    territory: "Dhaka Metro",
    paymentTerms: "Net 30 Days",
    rating: 5.0,
    leadTimeDays: 2,
    status: "Active",
    suppliedCategories: [],
  })
  const [isSavingWholesaler, setIsSavingWholesaler] = React.useState(false)

  // Wholesaler Delete Confirmation State
  const [deleteWholesalerTarget, setDeleteWholesalerTarget] = React.useState<Wholesaler | null>(null)
  const [isDeleteWholesalerModalOpen, setIsDeleteWholesalerModalOpen] = React.useState(false)
  const [isDeletingWholesaler, setIsDeletingWholesaler] = React.useState(false)

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = React.useState<PurchaseOrder | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Fetch all data
  const loadData = React.useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true)
      else setLoading(true)

      const [ordersRes, metricsRes, wholesalersRes, inventoryRes] = await Promise.all([
        apiFetch("/procurement/orders"),
        apiFetch("/procurement/orders/metrics"),
        apiFetch("/wholesalers"),
        apiFetch("/inventory").catch(() => null),
      ])

      if (ordersRes.ok) {
        const json = await ordersRes.json()
        setOrders(json.data || [])
      }

      if (metricsRes.ok) {
        const json = await metricsRes.json()
        setMetrics(json.data || null)
      }

      if (wholesalersRes.ok) {
        const json = await wholesalersRes.json()
        setWholesalers(json.data || [])
      }

      if (inventoryRes && inventoryRes.ok) {
        const json = await inventoryRes.json()
        const items = (json.data || []).map((b: any) => ({
          id: b.id,
          skuCode: b.skuCode,
          brandName: b.brandName,
          genericName: b.genericName,
          unitPrice: b.unitPrice,
          storageCondition: b.storageCondition,
        }))
        setInventoryItems(items)
      }

      if (showToast) {
        toast.success("Procurement ledger synced with live database")
      }
    } catch (err: any) {
      console.error("Error loading procurement data:", err)
      toast.error("Failed to load purchase orders. Please verify backend connection.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Filtered orders list
  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchPo = order.poNumber?.toLowerCase().includes(q)
        const matchWholesaler = order.wholesalerName?.toLowerCase().includes(q)
        const matchRef = order.requisitionRef?.toLowerCase().includes(q)
        const matchItems = order.items?.some(
          (it) =>
            it.drugName?.toLowerCase().includes(q) ||
            it.genericName?.toLowerCase().includes(q) ||
            it.skuCode?.toLowerCase().includes(q)
        )
        if (!matchPo && !matchWholesaler && !matchRef && !matchItems) {
          return false
        }
      }

      // Status
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false
      }

      // Priority
      if (priorityFilter !== "all" && order.priority !== priorityFilter) {
        return false
      }

      // Wholesaler
      if (wholesalerFilter !== "all" && order.wholesalerName !== wholesalerFilter) {
        return false
      }

      return true
    })
  }, [orders, searchQuery, statusFilter, priorityFilter, wholesalerFilter])

  // Status counts for tabs
  const statusCounts = React.useMemo(() => {
    const counts = {
      all: orders.length,
      Submitted: 0,
      Approved: 0,
      "Partially Received": 0,
      Received: 0,
      Draft: 0,
      Cancelled: 0,
    }
    for (const o of orders) {
      if (o.status in counts) {
        counts[o.status as keyof typeof counts]++
      }
    }
    return counts
  }, [orders])

  // Filtered wholesalers list for directory modal
  const filteredWholesalers = React.useMemo(() => {
    return wholesalers.filter((w) => {
      if (wholesalerSearchQuery.trim()) {
        const q = wholesalerSearchQuery.toLowerCase().trim()
        const matchName = w.name?.toLowerCase().includes(q)
        const matchCode = w.wholesalerCode?.toLowerCase().includes(q)
        const matchContact = w.contactPerson?.toLowerCase().includes(q)
        const matchPhone = w.phone?.toLowerCase().includes(q)
        const matchLicense = w.drugLicenseNo?.toLowerCase().includes(q)
        const matchTerritory = w.territory?.toLowerCase().includes(q)
        if (!matchName && !matchCode && !matchContact && !matchPhone && !matchLicense && !matchTerritory) {
          return false
        }
      }
      if (wholesalerStatusFilter !== "all" && w.status !== wholesalerStatusFilter) {
        return false
      }
      return true
    })
  }, [wholesalers, wholesalerSearchQuery, wholesalerStatusFilter])

  // Wholesaler change in Create/Edit Form
  const handleWholesalerSelect = (wholesalerName: string) => {
    const found = wholesalers.find((w) => w.name === wholesalerName)
    if (found) {
      setFormData((prev) => ({
        ...prev,
        wholesalerName: found.name,
        wholesalerCode: found.wholesalerCode,
        contactPerson: found.contactPerson,
        phone: found.phone,
        email: found.email || "",
        wholesalerAddress: found.address,
        paymentTerms: found.paymentTerms || prev.paymentTerms,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        wholesalerName,
      }))
    }
  }

  // Item row change in Create/Edit Form
  const handleItemChange = (
    index: number,
    field: keyof PurchaseOrderItem,
    value: any
  ) => {
    setFormData((prev) => {
      const items = [...prev.items]
      const current = { ...items[index], [field]: value }

      // If SKU was selected, prefill details from active inventory catalog
      if (field === "skuCode") {
        const matched = inventoryItems.find((inv) => inv.skuCode === value)
        if (matched) {
          current.drugName = matched.brandName
          current.genericName = matched.genericName
          current.unitCostBDT = matched.unitPrice || current.unitCostBDT
          current.storageRequirement = matched.storageCondition || current.storageRequirement
        }
      }

      // Recompute line total
      const qty = Number(current.quantityOrdered) || 0
      const cost = Number(current.unitCostBDT) || 0
      current.totalCostBDT = Math.round(qty * cost * 100) / 100

      items[index] = current
      return { ...prev, items }
    })
  }

  const handleAddItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          no: prev.items.length + 1,
          skuCode: "",
          drugName: "",
          genericName: "",
          packSize: "",
          quantityOrdered: 100,
          quantityReceived: 0,
          unitCostBDT: 0,
          totalCostBDT: 0,
          storageRequirement: "Controlled Ambient (<25°C)",
        },
      ],
    }))
  }

  const handleRemoveItemRow = (index: number) => {
    if (formData.items.length <= 1) {
      toast.warning("A purchase order must contain at least one line item")
      return
    }
    setFormData((prev) => {
      const items = prev.items.filter((_, idx) => idx !== index)
      // re-index
      items.forEach((it, i) => {
        it.no = i + 1
      })
      return { ...prev, items }
    })
  }

  // Computed totals for modal form
  const formSubtotal = React.useMemo(() => {
    return formData.items.reduce((acc, it) => acc + (Number(it.totalCostBDT) || 0), 0)
  }, [formData.items])

  const formGrandTotal = React.useMemo(() => {
    return Math.max(0, formSubtotal - (Number(formData.discountBDT) || 0) + (Number(formData.taxBDT) || 0))
  }, [formSubtotal, formData.discountBDT, formData.taxBDT])

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingOrder(null)
    setFormData({
      wholesalerName: wholesalers[0]?.name || "",
      wholesalerCode: wholesalers[0]?.wholesalerCode || "",
      contactPerson: wholesalers[0]?.contactPerson || "",
      phone: wholesalers[0]?.phone || "",
      email: wholesalers[0]?.email || "",
      wholesalerAddress: wholesalers[0]?.address || "",
      deliveryWarehouse: "Main Distribution Bay - Tejgaon Central",
      paymentTerms: wholesalers[0]?.paymentTerms || "Net 30 Days",
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      priority: "Routine",
      status: "Submitted",
      requisitionRef: `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      shippingTerms: "FOB Central Depot",
      notes: "Commercial wholesale replenishment order generated via Procurement Console.",
      discountBDT: 0,
      taxBDT: 0,
      items: [
        {
          no: 1,
          skuCode: inventoryItems[0]?.skuCode || "",
          drugName: inventoryItems[0]?.brandName || "Cef-3 200mg/5ml Susp",
          genericName: inventoryItems[0]?.genericName || "Cefixime Trihydrate",
          packSize: "Bottle of 70ml",
          quantityOrdered: 500,
          quantityReceived: 0,
          unitCostBDT: inventoryItems[0]?.unitPrice || 185,
          totalCostBDT: (inventoryItems[0]?.unitPrice || 185) * 500,
          storageRequirement: inventoryItems[0]?.storageCondition || "Cold Chain (2-8°C)",
        },
      ],
    })
    setIsOrderModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = (order: PurchaseOrder) => {
    setEditingOrder(order)
    setFormData({
      wholesalerName: order.wholesalerName,
      wholesalerCode: order.wholesalerCode || "",
      contactPerson: order.contactPerson || "",
      phone: order.phone || "",
      email: order.email || "",
      wholesalerAddress: order.wholesalerAddress || "",
      deliveryWarehouse: order.deliveryWarehouse,
      paymentTerms: order.paymentTerms,
      expectedDeliveryDate: order.expectedDeliveryDate || "",
      priority: order.priority,
      status: order.status,
      requisitionRef: order.requisitionRef || "",
      shippingTerms: order.shippingTerms || "FOB Central Depot",
      notes: order.notes || "",
      discountBDT: order.discountBDT,
      taxBDT: order.taxBDT,
      items: (order.items || []).map((it, idx) => ({
        no: it.no || idx + 1,
        skuCode: it.skuCode || "",
        drugName: it.drugName,
        genericName: it.genericName || "",
        packSize: it.packSize || "",
        quantityOrdered: it.quantityOrdered,
        quantityReceived: it.quantityReceived || 0,
        unitCostBDT: it.unitCostBDT,
        totalCostBDT: it.totalCostBDT,
        storageRequirement: it.storageRequirement || "Controlled Ambient (<25°C)",
      })),
    })
    setIsOrderModalOpen(true)
  }

  // Submit Order (Create / Update)
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.wholesalerName?.trim()) {
      toast.error("Please specify a licensed wholesaler name")
      return
    }

    if (!formData.items.length || formData.items.some((it) => !it.drugName?.trim() || it.quantityOrdered <= 0)) {
      toast.error("Please ensure all line items have valid formulation names and quantities")
      return
    }

    const toastId = toast.loading(editingOrder ? "Updating purchase order..." : "Creating purchase order...")
    setIsSavingOrder(true)

    try {
      const payload = {
        ...formData,
        items: formData.items.map((it) => ({
          ...it,
          quantityOrdered: Number(it.quantityOrdered),
          unitCostBDT: Number(it.unitCostBDT),
          totalCostBDT: Number(it.totalCostBDT) || Number(it.quantityOrdered) * Number(it.unitCostBDT),
        })),
        discountBDT: Number(formData.discountBDT) || 0,
        taxBDT: Number(formData.taxBDT) || 0,
      }

      const url = editingOrder ? `/procurement/orders/${editingOrder.id}` : "/procurement/orders"
      const method = editingOrder ? "PUT" : "POST"

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.message || "Failed to save purchase order")
      }

      toast.success(
        editingOrder
          ? `Purchase Order ${json.data?.poNumber || ""} updated successfully`
          : `Purchase Order ${json.data?.poNumber || ""} issued successfully`,
        { id: toastId }
      )

      setIsOrderModalOpen(false)
      loadData()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Operation failed", { id: toastId })
    } finally {
      setIsSavingOrder(false)
    }
  }

  // Open Multi-tier Approval Modal
  const handleOpenApprovalModal = (order: PurchaseOrder) => {
    setApprovingOrder(order)
    setApprovalNote(`Reviewed quality specs and commercial pricing for ${order.totalUnits} units. Approved for dock intake.`)
    setIsApprovalModalOpen(true)
  }

  // Confirm Multi-tier Approval
  const handleConfirmApproval = async () => {
    if (!approvingOrder) return

    const toastId = toast.loading(`Authorizing Purchase Order ${approvingOrder.poNumber}...`)
    setIsApproving(true)

    try {
      const res = await apiFetch(`/procurement/orders/${approvingOrder.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "Approved",
          approvalStage: "Final Approved",
          approvedBy: approverName,
          notes: approvalNote,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || "Failed to approve purchase order")
      }

      toast.success(`Purchase Order ${approvingOrder.poNumber} approved under statutory multi-tier authorization`, {
        id: toastId,
      })

      setIsApprovalModalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Approval failed", { id: toastId })
    } finally {
      setIsApproving(false)
    }
  }

  // Open Stock Receiving / Dock Intake Modal
  const handleOpenReceiveModal = (order: PurchaseOrder) => {
    setReceivingOrder(order)
    setReceiveChallan(`DC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
    setReceiveNotes("Goods delivered in good temperature conditions. Visual seal check intact.")

    const items = (order.items || []).map((it, idx) => {
      const already = it.quantityReceived || 0
      const remaining = Math.max(0, it.quantityOrdered - already)
      return {
        no: it.no || idx + 1,
        skuCode: it.skuCode || undefined,
        drugName: it.drugName,
        quantityOrdered: it.quantityOrdered,
        alreadyReceived: already,
        quantityToReceive: remaining,
        batchNumber: `BX-2026-${Math.floor(500 + Math.random() * 499)}`,
        mfgDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2).toISOString().split("T")[0],
        warehouseBin: it.storageRequirement?.includes("Cold Chain") ? "Cold Room A (2-8°C)" : "Bay 02 - Shelf B",
        storageCondition: it.storageRequirement || "Controlled Ambient (<25°C)",
        unitPrice: it.unitCostBDT,
      }
    })

    setReceiveFormItems(items)
    setIsReceiveModalOpen(true)
  }

  // Submit Stock Receiving
  const handleConfirmReceive = async () => {
    if (!receivingOrder) return

    const validItems = receiveFormItems.filter((it) => it.quantityToReceive > 0)
    if (!validItems.length) {
      toast.error("Please specify positive receiving quantities for at least one item")
      return
    }

    const toastId = toast.loading("Processing warehouse dock intake & inventory credit...")
    setIsReceivingStock(true)

    try {
      const res = await apiFetch(`/procurement/orders/${receivingOrder.id}/receive`, {
        method: "POST",
        body: JSON.stringify({
          receivedItems: validItems,
          challanNumber: receiveChallan,
          notes: receiveNotes,
          updateInventoryBatches: syncWithInventory,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || "Failed to receive goods")
      }

      toast.success(
        syncWithInventory
          ? `Goods intake complete! ${validItems.length} batch(es) credited into Active Inventory Ledger.`
          : `Goods intake recorded against ${receivingOrder.poNumber}.`,
        { id: toastId }
      )

      setIsReceiveModalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Stock intake failed", { id: toastId })
    } finally {
      setIsReceivingStock(false)
    }
  }

  // Open Official Printable PO Voucher
  const handleOpenVoucherModal = (order: PurchaseOrder) => {
    setVoucherOrder(order)
    setIsVoucherModalOpen(true)
  }

  // Delete Purchase Order
  const handleDeleteOrder = (order: PurchaseOrder) => {
    setDeleteTarget(order)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    const toastId = toast.loading(`Deleting Purchase Order ${deleteTarget.poNumber}...`)
    setIsDeleting(true)

    try {
      const res = await apiFetch(`/procurement/orders/${deleteTarget.id}`, {
        method: "DELETE",
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || "Failed to delete purchase order")
      }

      toast.success(`Purchase Order ${deleteTarget.poNumber} deleted from registry`, { id: toastId })
      setIsDeleteModalOpen(false)
      setDeleteTarget(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete purchase order", { id: toastId })
    } finally {
      setIsDeleting(false)
    }
  }

  // Auto-fill Remaining in Stock Intake
  const handleAutoFillRemaining = () => {
    setReceiveFormItems((prev) =>
      prev.map((it) => {
        const remaining = Math.max(0, it.quantityOrdered - (it.alreadyReceived || 0))
        return {
          ...it,
          quantityToReceive: remaining,
        }
      })
    )
    toast.info("Auto-filled remaining consignment balances")
  }

  // Open Details / Inspector Modal
  const handleOpenDetailsModal = (order: PurchaseOrder) => {
    setDetailsOrder(order)
    setIsDetailsModalOpen(true)
  }

  // Submit for Approval (Draft -> Submitted)
  const handleSubmitForApproval = async (order: PurchaseOrder) => {
    const toastId = toast.loading(`Submitting Purchase Order ${order.poNumber} for review...`)
    try {
      const res = await apiFetch(`/procurement/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "Submitted",
          approvalStage: "Procurement Officer Review",
          notes: "Commercial PO submitted for statutory multi-tier authorization",
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to submit purchase order")
      toast.success(`Purchase Order ${order.poNumber} submitted for approval`, { id: toastId })
      loadData()
      if (detailsOrder?.id === order.id) {
        setDetailsOrder(json.data)
      }
    } catch (err: any) {
      toast.error(err.message || "Submission failed", { id: toastId })
    }
  }

  // Open Cancel Modal
  const handleOpenCancelModal = (order: PurchaseOrder) => {
    setCancellingOrder(order)
    setCancelReason("Commercial procurement canceled due to supplier constraint / revision")
    setIsCancelModalOpen(true)
  }

  // Confirm Cancellation
  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return
    const toastId = toast.loading(`Cancelling Purchase Order ${cancellingOrder.poNumber}...`)
    setIsCancelling(true)
    try {
      const res = await apiFetch(`/procurement/orders/${cancellingOrder.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "Cancelled",
          approvalStage: "Procurement Voided",
          notes: cancelReason,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to cancel purchase order")
      toast.success(`Purchase Order ${cancellingOrder.poNumber} marked as Cancelled`, { id: toastId })
      setIsCancelModalOpen(false)
      setCancellingOrder(null)
      loadData()
      if (detailsOrder?.id === cancellingOrder.id) {
        setDetailsOrder(json.data)
      }
    } catch (err: any) {
      toast.error(err.message || "Cancellation failed", { id: toastId })
    } finally {
      setIsCancelling(false)
    }
  }

  // Duplicate / Clone PO as new Draft
  const handleDuplicateOrder = (order: PurchaseOrder) => {
    setEditingOrder(null)
    setFormData({
      wholesalerName: order.wholesalerName,
      wholesalerCode: order.wholesalerCode || "",
      contactPerson: order.contactPerson || "",
      phone: order.phone || "",
      email: order.email || "",
      wholesalerAddress: order.wholesalerAddress || "",
      deliveryWarehouse: order.deliveryWarehouse,
      paymentTerms: order.paymentTerms,
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      priority: order.priority,
      status: "Draft",
      requisitionRef: `REQ-2026-${Math.floor(100 + Math.random() * 900)} (Repeat)`,
      shippingTerms: order.shippingTerms || "FOB Central Depot",
      notes: `Cloned repeat procurement requisition based on ${order.poNumber}.`,
      discountBDT: order.discountBDT,
      taxBDT: order.taxBDT,
      items: (order.items || []).map((it, idx) => ({
        no: idx + 1,
        skuCode: it.skuCode || "",
        drugName: it.drugName,
        genericName: it.genericName || "",
        packSize: it.packSize || "",
        quantityOrdered: it.quantityOrdered,
        quantityReceived: 0,
        unitCostBDT: it.unitCostBDT,
        totalCostBDT: it.totalCostBDT,
        storageRequirement: it.storageRequirement || "Controlled Ambient (<25°C)",
      })),
    })
    setIsDetailsModalOpen(false)
    setIsOrderModalOpen(true)
    toast.info(`Cloned items from ${order.poNumber} into a new draft purchase order`)
  }

  // Open Wholesaler Create Form
  const handleOpenNewWholesaler = () => {
    setEditingWholesaler(null)
    setNewWholesalerForm({
      wholesalerCode: "",
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      drugLicenseNo: "",
      tradeLicense: "",
      address: "",
      territory: "Dhaka Metro",
      paymentTerms: "Net 30 Days",
      rating: 5.0,
      leadTimeDays: 2,
      status: "Active",
      suppliedCategories: ["Antibiotic", "Analgesic / Antipyretic"],
    })
    setIsNewWholesalerOpen(true)
  }

  // Open Wholesaler Edit Form
  const handleOpenEditWholesaler = (w: Wholesaler) => {
    setEditingWholesaler(w)
    setNewWholesalerForm({
      wholesalerCode: w.wholesalerCode,
      name: w.name,
      contactPerson: w.contactPerson,
      phone: w.phone,
      email: w.email || "",
      drugLicenseNo: w.drugLicenseNo,
      tradeLicense: w.tradeLicense || "",
      address: w.address,
      territory: w.territory || "Dhaka Metro",
      paymentTerms: w.paymentTerms || "Net 30 Days",
      rating: w.rating || 5.0,
      leadTimeDays: w.leadTimeDays || 3,
      status: w.status || "Active",
      suppliedCategories: w.suppliedCategories || [],
    })
    setIsNewWholesalerOpen(true)
  }

  // Save Wholesaler (Create or Update)
  const handleSaveWholesaler = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newWholesalerForm.name?.trim() || !newWholesalerForm.drugLicenseNo?.trim() || !newWholesalerForm.phone?.trim()) {
      toast.error("Please fill in Wholesaler Name, Drug License #, and Phone")
      return
    }

    const isEdit = Boolean(editingWholesaler)
    const toastId = toast.loading(isEdit ? "Updating wholesaler profile..." : "Registering approved wholesaler...")
    setIsSavingWholesaler(true)

    try {
      const url = isEdit ? `/wholesalers/${editingWholesaler!.id}` : "/wholesalers"
      const method = isEdit ? "PUT" : "POST"

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(newWholesalerForm),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || "Failed to save wholesaler")
      }

      toast.success(
        isEdit
          ? `Wholesaler '${json.data?.name || ""}' updated successfully`
          : `Wholesaler '${json.data?.name || ""}' registered successfully`,
        { id: toastId }
      )

      setIsNewWholesalerOpen(false)
      setEditingWholesaler(null)

      // Refresh wholesalers
      const refRes = await apiFetch("/wholesalers")
      if (refRes.ok) {
        const refJson = await refRes.json()
        setWholesalers(refJson.data || [])
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save wholesaler", { id: toastId })
    } finally {
      setIsSavingWholesaler(false)
    }
  }

  // Open Delete Wholesaler Modal
  const handleOpenDeleteWholesaler = (w: Wholesaler) => {
    setDeleteWholesalerTarget(w)
    setIsDeleteWholesalerModalOpen(true)
  }

  // Confirm Delete Wholesaler
  const handleConfirmDeleteWholesaler = async () => {
    if (!deleteWholesalerTarget) return
    const toastId = toast.loading(`Deregistering wholesaler ${deleteWholesalerTarget.name}...`)
    setIsDeletingWholesaler(true)
    try {
      const res = await apiFetch(`/wholesalers/${deleteWholesalerTarget.id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || "Failed to deregister wholesaler")
      }
      toast.success(`Wholesaler '${deleteWholesalerTarget.name}' removed from approved vendor registry`, { id: toastId })
      setIsDeleteWholesalerModalOpen(false)
      setDeleteWholesalerTarget(null)

      // Refresh wholesalers
      const refRes = await apiFetch("/wholesalers")
      if (refRes.ok) {
        const refJson = await refRes.json()
        setWholesalers(refJson.data || [])
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to deregister wholesaler", { id: toastId })
    } finally {
      setIsDeletingWholesaler(false)
    }
  }

  // Filter main table by Wholesaler
  const handleFilterByWholesaler = (wholesalerName: string) => {
    setWholesalerFilter(wholesalerName)
    setIsWholesalersModalOpen(false)
    toast.info(`Filtered purchase orders for: ${wholesalerName}`)
  }

  // Export to Excel
  const handleExportExcel = () => {
    if (!orders.length) {
      toast.warning("No purchase order records available to export")
      return
    }

    const exportRows: Record<string, any>[] = orders.flatMap((po) => {
      if (!po.items?.length) {
        return [
          {
            "PO Number": po.poNumber,
            "Order Date": po.poDate,
            "Expected Delivery": po.expectedDeliveryDate || "N/A",
            "Wholesaler Name": po.wholesalerName,
            "Formulation": "General Order",
            "Generic Name": "N/A",
            "SKU Code": "N/A",
            "Pack Size": "N/A",
            "Quantity Ordered": po.totalUnits,
            "Quantity Received": 0,
            "Unit Cost (BDT)": 0,
            "Line Total (BDT)": po.subtotalBDT,
            "Storage Condition": "Ambient",
            "Warehouse Bay": po.deliveryWarehouse,
            "Payment Terms": po.paymentTerms,
            "Priority": po.priority,
            "Lifecycle Status": po.status,
            "Approval Stage": po.approvalStage || "N/A",
            "Grand Total (BDT)": po.totalAmountBDT,
          },
        ]
      }

      return po.items.map((it) => ({
        "PO Number": po.poNumber,
        "Order Date": po.poDate,
        "Expected Delivery": po.expectedDeliveryDate || "N/A",
        "Wholesaler Name": po.wholesalerName,
        "Formulation": it.drugName,
        "Generic Name": it.genericName || "N/A",
        "SKU Code": it.skuCode || "N/A",
        "Pack Size": it.packSize || "N/A",
        "Quantity Ordered": it.quantityOrdered,
        "Quantity Received": it.quantityReceived || 0,
        "Unit Cost (BDT)": it.unitCostBDT,
        "Line Total (BDT)": it.totalCostBDT,
        "Storage Condition": it.storageRequirement || "Controlled Ambient",
        "Warehouse Bay": po.deliveryWarehouse,
        "Payment Terms": po.paymentTerms,
        "Priority": po.priority,
        "Lifecycle Status": po.status,
        "Approval Stage": po.approvalStage || "N/A",
        "Grand Total (BDT)": po.totalAmountBDT,
      }))
    })

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "PurchaseOrders")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Wholesaler_Purchase_Orders_${new Date().toISOString().split("T")[0]}.xlsx`
    )

    toast.success("Purchase order register exported to Excel file")
  }

  // Priority badge styling
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Emergency Cold-Chain":
        return (
          <Badge className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 flex items-center gap-1 font-semibold text-[11px]">
            <Snowflake className="h-3 w-3 animate-spin text-sky-600" />
            Cold-Chain Emergency
          </Badge>
        )
      case "Urgent / Stockout Risk":
        return (
          <Badge className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center gap-1 font-semibold text-[11px]">
            <AlertTriangle className="h-3 w-3 text-rose-600" />
            Stockout Urgent
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 font-medium text-[11px]">
            Routine
          </Badge>
        )
    }
  }

  // Status badge styling
  const renderStatusBadge = (status: string, stage?: string | null) => {
    switch (status) {
      case "Approved":
        return (
          <div className="flex flex-col items-start gap-0.5">
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold text-[11px] flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Approved & Inbound
            </Badge>
            {stage && <span className="text-[10px] text-emerald-600/80 font-medium">{stage}</span>}
          </div>
        )
      case "Partially Received":
        return (
          <div className="flex flex-col items-start gap-0.5">
            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-semibold text-[11px] flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-600" />
              Partially Received
            </Badge>
            {stage && <span className="text-[10px] text-amber-600/80 font-medium">{stage}</span>}
          </div>
        )
      case "Received":
        return (
          <div className="flex flex-col items-start gap-0.5">
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold text-[11px] flex items-center gap-1">
              <PackageCheck className="h-3 w-3 text-blue-600" />
              Fully Received
            </Badge>
            {stage && <span className="text-[10px] text-blue-600/80 font-medium">{stage}</span>}
          </div>
        )
      case "Submitted":
        return (
          <div className="flex flex-col items-start gap-0.5">
            <Badge className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-semibold text-[11px] flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-purple-600" />
              Pending Multi-tier Approval
            </Badge>
            {stage && <span className="text-[10px] text-purple-600/80 font-medium">{stage}</span>}
          </div>
        )
      case "Draft":
        return (
          <Badge className="bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 font-medium text-[11px]">
            Draft
          </Badge>
        )
      case "Cancelled":
        return (
          <Badge className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-medium text-[11px]">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/50 pb-16">
      {/* ─────────────────────────────────────────────
          Top Header Banner
      ───────────────────────────────────────────── */}
      <div className="border-b border-slate-200/80 bg-white shadow-xs">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Wholesaler Purchase Orders
                  </h1>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Commercial pharma procurement, multi-tier regulatory approval, and dock intake ledger
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData(true)}
                disabled={refreshing || loading}
                className="h-9 gap-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsWholesalersModalOpen(true)}
                className="h-9 gap-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                Wholesalers ({wholesalers.length})
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="h-9 gap-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 border-emerald-200"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                Export Excel
              </Button>

              <Button
                size="sm"
                onClick={handleOpenCreateModal}
                className="h-9 gap-1.5 bg-blue-600 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                New Purchase Order
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 space-y-6">
        {/* ─────────────────────────────────────────────
            Executive KPI Metric Cards
        ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Spend */}
          <Card className="relative overflow-hidden border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Procurement Value
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  BDT {(metrics?.totalSpendBDT || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}
                </h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>{metrics?.totalOrdersCount || 0} commercial orders issued</span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
          </Card>

          {/* Pending Approval */}
          <Card className="relative overflow-hidden border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pending Multi-Tier Approval
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-purple-700">
                  {metrics?.pendingApprovalCount || 0} Orders
                </h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-600 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>
                    BDT {(metrics?.pendingApprovalValueBDT || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })} awaiting sign-off
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                <BadgeAlert className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-500 to-violet-600" />
          </Card>

          {/* In Transit / Approved */}
          <Card className="relative overflow-hidden border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Approved & In-Transit
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-amber-700">
                  {metrics?.inTransitCount || 0} Orders
                </h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                  <Truck className="h-3.5 w-3.5" />
                  <span>
                    BDT {(metrics?.inTransitValueBDT || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })} inbound
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          </Card>

          {/* Cold-Chain Watch */}
          <Card className="relative overflow-hidden border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Cold-Chain Sensitive (2-8°C)
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-sky-700">
                  {metrics?.coldChainPOCount || 0} Orders
                </h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-sky-600 font-medium">
                  <Snowflake className="h-3.5 w-3.5" />
                  <span>Fulfillment rate: {metrics?.fulfillmentRate || 0}% overall</span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <Snowflake className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-sky-400 to-blue-600" />
          </Card>
        </div>

        {/* ─────────────────────────────────────────────
            Filters and Status Tabs
        ───────────────────────────────────────────── */}
        <Card className="border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-4">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
              {[
                { key: "all", label: "All Orders", count: statusCounts.all },
                { key: "Submitted", label: "Pending Approval", count: statusCounts.Submitted },
                { key: "Approved", label: "Approved & Inbound", count: statusCounts.Approved },
                { key: "Partially Received", label: "Partially Received", count: statusCounts["Partially Received"] },
                { key: "Received", label: "Fully Received", count: statusCounts.Received },
                { key: "Draft", label: "Drafts", count: statusCounts.Draft },
                { key: "Cancelled", label: "Cancelled", count: statusCounts.Cancelled },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === tab.key
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      statusFilter === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search and Dropdown Controls */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by PO #, Wholesaler, Drug name, or SKU..."
                  className="h-9 pl-9 text-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Priority Filter */}
              <div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Priority: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="Routine">Routine</SelectItem>
                    <SelectItem value="Urgent / Stockout Risk">Urgent / Stockout Risk</SelectItem>
                    <SelectItem value="Emergency Cold-Chain">Emergency Cold-Chain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Wholesaler Filter */}
              <div>
                <Select value={wholesalerFilter} onValueChange={setWholesalerFilter}>
                  <SelectTrigger className="h-9 text-xs truncate">
                    <SelectValue placeholder="Wholesaler: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wholesalers</SelectItem>
                    {wholesalers.map((w) => (
                      <SelectItem key={w.id} value={w.name}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        {/* ─────────────────────────────────────────────
            Orders Table
        ───────────────────────────────────────────── */}
        <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/75">
                <TableRow className="border-b border-slate-200/80">
                  <TableHead className="w-[140px] text-xs font-bold text-slate-700">PO Number</TableHead>
                  <TableHead className="min-w-[190px] text-xs font-bold text-slate-700">Wholesaler / Supplier</TableHead>
                  <TableHead className="min-w-[210px] text-xs font-bold text-slate-700">Line Items & Dosage</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-700">Valuation (BDT)</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-700">Priority</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Lifecycle Status</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Delivery Warehouse</TableHead>
                  <TableHead className="w-[70px] text-center text-xs font-bold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center text-xs text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                        <span>Loading commercial purchase orders...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center text-xs text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Building2 className="h-8 w-8 text-slate-300" />
                        <p className="font-semibold text-slate-700">No purchase orders found</p>
                        <p className="text-slate-400">Try adjusting your search criteria or register a new purchase order</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleOpenCreateModal}
                          className="mt-2 text-xs"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          New Purchase Order
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      onClick={() => handleOpenDetailsModal(order)}
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* PO Number & Date */}
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-bold text-blue-600 text-xs flex items-center gap-1 group-hover:underline">
                            {order.poNumber}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {order.poDate}
                          </span>
                        </div>
                      </TableCell>

                      {/* Wholesaler Details */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-slate-900">{order.wholesalerName}</span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {order.contactPerson || order.phone || order.wholesalerCode || "Licensed Wholesaler"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Line Items Summary */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-slate-800">
                              {order.items?.length || 0} Item{order.items?.length === 1 ? "" : "s"}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({order.totalUnits.toLocaleString()} units)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                            {order.items?.map((i) => i.drugName).join(", ") || "General Formulations"}
                          </p>
                        </div>
                      </TableCell>

                      {/* Valuation */}
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-xs text-slate-900">
                            BDT {order.totalAmountBDT.toLocaleString("en-BD", { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {order.paymentTerms || "Net 30"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Priority */}
                      <TableCell className="text-center">
                        {renderPriorityBadge(order.priority)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {renderStatusBadge(order.status, order.approvalStage)}
                      </TableCell>

                      {/* Warehouse */}
                      <TableCell>
                        <div className="flex flex-col text-[11px]">
                          <span className="font-medium text-slate-800 truncate max-w-[160px]">
                            {order.deliveryWarehouse.replace("Main Distribution Bay - ", "")}
                          </span>
                          {order.expectedDeliveryDate && (
                            <span className="text-slate-400 text-[10px]">
                              Exp: {order.expectedDeliveryDate}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="text-xs">Order Actions</DropdownMenuLabel>
                            
                            {/* Inspect Order Details */}
                            <DropdownMenuItem
                              onClick={() => handleOpenDetailsModal(order)}
                              className="text-xs cursor-pointer gap-2"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-600" />
                              Inspect Order Details
                            </DropdownMenuItem>

                            {/* View & Print PO Voucher */}
                            <DropdownMenuItem
                              onClick={() => handleOpenVoucherModal(order)}
                              className="text-xs cursor-pointer gap-2"
                            >
                              <Printer className="h-3.5 w-3.5 text-blue-600" />
                              View & Print PO Voucher
                            </DropdownMenuItem>

                            {/* Submit for Approval (If Draft) */}
                            {order.status === "Draft" && (
                              <DropdownMenuItem
                                onClick={() => handleSubmitForApproval(order)}
                                className="text-xs cursor-pointer gap-2 text-blue-700 font-medium focus:text-blue-700"
                              >
                                <Send className="h-3.5 w-3.5 text-blue-600" />
                                Submit for Review
                              </DropdownMenuItem>
                            )}

                            {/* Multi-tier Approval (If Submitted or Draft) */}
                            {order.status !== "Approved" && order.status !== "Received" && order.status !== "Cancelled" && (
                              <DropdownMenuItem
                                onClick={() => handleOpenApprovalModal(order)}
                                className="text-xs cursor-pointer gap-2 text-purple-700 font-medium focus:text-purple-700"
                              >
                                <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                                Multi-Tier Approval
                              </DropdownMenuItem>
                            )}

                            {/* Receive Goods / Dock Intake (If Approved or Partially Received) */}
                            {(order.status === "Approved" || order.status === "Partially Received") && (
                              <DropdownMenuItem
                                onClick={() => handleOpenReceiveModal(order)}
                                className="text-xs cursor-pointer gap-2 text-emerald-700 font-medium focus:text-emerald-700"
                              >
                                <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
                                Dock Intake & Receive
                              </DropdownMenuItem>
                            )}

                            {/* Duplicate / Reorder */}
                            <DropdownMenuItem
                              onClick={() => handleDuplicateOrder(order)}
                              className="text-xs cursor-pointer gap-2 text-slate-700"
                            >
                              <Copy className="h-3.5 w-3.5 text-slate-500" />
                              Duplicate / Reorder
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Cancel Order (If active) */}
                            {order.status !== "Cancelled" && order.status !== "Received" && (
                              <DropdownMenuItem
                                onClick={() => handleOpenCancelModal(order)}
                                className="text-xs cursor-pointer gap-2 text-amber-700 focus:text-amber-700"
                              >
                                <XCircle className="h-3.5 w-3.5 text-amber-600" />
                                Cancel Purchase Order
                              </DropdownMenuItem>
                            )}

                            {/* Edit */}
                            <DropdownMenuItem
                              onClick={() => handleOpenEditModal(order)}
                              className="text-xs cursor-pointer gap-2"
                            >
                              <Pencil className="h-3.5 w-3.5 text-slate-500" />
                              Edit Order Details
                            </DropdownMenuItem>

                            {/* Delete */}
                            <DropdownMenuItem
                              onClick={() => handleDeleteOrder(order)}
                              className="text-xs cursor-pointer gap-2 text-rose-600 focus:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                              Delete Purchase Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────
          MODAL 1: Create / Edit Purchase Order Dialog
      ───────────────────────────────────────────── */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Building2 className="h-5 w-5 text-blue-600" />
              {editingOrder ? `Edit Purchase Order (${editingOrder.poNumber})` : "Create Wholesaler Purchase Order"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Issue commercial replenishment order with multi-item batch specification and statutory audit logging.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitOrder} className="space-y-6 pt-2">
            {/* Wholesaler & Order Header */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* Wholesaler Select */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Wholesaler / Distributor *</Label>
                <Select value={formData.wholesalerName} onValueChange={handleWholesalerSelect}>
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Select licensed wholesaler" />
                  </SelectTrigger>
                  <SelectContent>
                    {wholesalers.map((w) => (
                      <SelectItem key={w.id} value={w.name}>
                        {w.name} ({w.wholesalerCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Warehouse */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Delivery Warehouse Bay *</Label>
                <Select
                  value={formData.deliveryWarehouse}
                  onValueChange={(val) => setFormData((p) => ({ ...p, deliveryWarehouse: val }))}
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_WAREHOUSES.map((wh) => (
                      <SelectItem key={wh} value={wh}>
                        {wh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Priority Level *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val: any) => setFormData((p) => ({ ...p, priority: val }))}
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Routine">Routine</SelectItem>
                    <SelectItem value="Urgent / Stockout Risk">Urgent / Stockout Risk</SelectItem>
                    <SelectItem value="Emergency Cold-Chain">Emergency Cold-Chain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Terms */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Payment Terms</Label>
                <Select
                  value={formData.paymentTerms}
                  onValueChange={(val) => setFormData((p) => ({ ...p, paymentTerms: val }))}
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Payment Terms" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expected Delivery Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => setFormData((p) => ({ ...p, expectedDeliveryDate: e.target.value }))}
                  className="h-9 text-xs bg-white"
                />
              </div>

              {/* Requisition Ref */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Requisition / Memo Ref</Label>
                <Input
                  value={formData.requisitionRef}
                  onChange={(e) => setFormData((p) => ({ ...p, requisitionRef: e.target.value }))}
                  placeholder="e.g. REQ-2026-109"
                  className="h-9 text-xs bg-white"
                />
              </div>
            </div>

            {/* Line Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Line Items & Pharmaceutical Formulations</h4>
                  <p className="text-[11px] text-slate-500">Specify ordered dosages, quantities, and storage parameters.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItemRow}
                  className="h-8 gap-1 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Formulation Row
                </Button>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-b border-slate-200">
                      <TableHead className="w-10 text-center text-[11px] font-bold">#</TableHead>
                      <TableHead className="min-w-[170px] text-[11px] font-bold">Formulation / Brand *</TableHead>
                      <TableHead className="w-32 text-[11px] font-bold">Pack Size</TableHead>
                      <TableHead className="w-36 text-[11px] font-bold">Storage Temp</TableHead>
                      <TableHead className="w-24 text-right text-[11px] font-bold">Quantity *</TableHead>
                      <TableHead className="w-28 text-right text-[11px] font-bold">Unit Cost (BDT) *</TableHead>
                      <TableHead className="w-32 text-right text-[11px] font-bold">Line Total (BDT)</TableHead>
                      <TableHead className="w-10 text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, idx) => (
                      <TableRow key={idx} className="border-b border-slate-100">
                        <TableCell className="text-center font-bold text-xs text-slate-500">
                          {idx + 1}
                        </TableCell>

                        {/* Drug Name with fast SKU selector */}
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              value={item.drugName}
                              onChange={(e) => handleItemChange(idx, "drugName", e.target.value)}
                              placeholder="e.g. Cef-3 200mg Susp"
                              className="h-8 text-xs font-semibold"
                              required
                            />
                            {inventoryItems.length > 0 && (
                              <select
                                value={item.skuCode || ""}
                                onChange={(e) => handleItemChange(idx, "skuCode", e.target.value)}
                                className="w-full h-6 text-[10px] rounded border border-slate-200 bg-slate-50 px-1 text-slate-600"
                              >
                                <option value="">Or select from warehouse SKU catalog...</option>
                                {inventoryItems.map((inv) => (
                                  <option key={inv.id} value={inv.skuCode}>
                                    {inv.skuCode} - {inv.brandName} (BDT {inv.unitPrice})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </TableCell>

                        {/* Pack Size */}
                        <TableCell>
                          <Input
                            value={item.packSize || ""}
                            onChange={(e) => handleItemChange(idx, "packSize", e.target.value)}
                            placeholder="e.g. Box of 100s"
                            className="h-8 text-xs"
                          />
                        </TableCell>

                        {/* Storage Requirement */}
                        <TableCell>
                          <select
                            value={item.storageRequirement || "Controlled Ambient (<25°C)"}
                            onChange={(e) => handleItemChange(idx, "storageRequirement", e.target.value)}
                            className="h-8 w-full text-xs rounded-md border border-slate-200 bg-white px-2"
                          >
                            <option value="Controlled Ambient (<25°C)">Ambient (&lt;25°C)</option>
                            <option value="Cold Chain (2-8°C)">Cold Chain (2-8°C)</option>
                            <option value="Dry & Cool Space">Dry & Cool</option>
                          </select>
                        </TableCell>

                        {/* Quantity */}
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantityOrdered}
                            onChange={(e) => handleItemChange(idx, "quantityOrdered", Number(e.target.value))}
                            className="h-8 text-xs text-right font-semibold"
                            required
                          />
                        </TableCell>

                        {/* Unit Cost */}
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitCostBDT}
                            onChange={(e) => handleItemChange(idx, "unitCostBDT", Number(e.target.value))}
                            className="h-8 text-xs text-right font-semibold"
                            required
                          />
                        </TableCell>

                        {/* Line Total */}
                        <TableCell className="text-right font-bold text-xs text-slate-800">
                          BDT {item.totalCostBDT?.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                        </TableCell>

                        {/* Delete row */}
                        <TableCell className="text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Financial Summary & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Special Instructions & Terms */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Procurement Notes / Handling Directives</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Ensure cold-chain data loggers are activated during transit..."
                  rows={4}
                  className="text-xs"
                />
              </div>

              {/* Financial Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal ({formData.items.length} items):</span>
                  <span className="font-semibold text-slate-800">
                    BDT {formSubtotal.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Trade Discount (BDT):</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discountBDT}
                    onChange={(e) => setFormData((p) => ({ ...p, discountBDT: Number(e.target.value) }))}
                    className="h-7 w-28 text-right text-xs"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Tax / VAT (BDT):</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.taxBDT}
                    onChange={(e) => setFormData((p) => ({ ...p, taxBDT: Number(e.target.value) }))}
                    className="h-7 w-28 text-right text-xs"
                  />
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Grand Total Payable:</span>
                  <span className="text-base font-extrabold text-blue-700">
                    BDT {formGrandTotal.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOrderModalOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingOrder}
                className="h-9 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white"
              >
                {isSavingOrder ? (
                  <>
                    <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Saving Order...
                  </>
                ) : editingOrder ? (
                  "Update Purchase Order"
                ) : (
                  "Issue Purchase Order"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────
          MODAL 2: Multi-Tier Approval Dialog
      ───────────────────────────────────────────── */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-4 ring-purple-50/50">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 pt-2">
              Statutory Multi-Tier Approval
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              21 CFR Part 11 compliant digital authorization for commercial wholesale procurement.
            </DialogDescription>
          </DialogHeader>

          {approvingOrder && (
            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">PO Number:</span>
                  <span className="font-bold text-purple-900">{approvingOrder.poNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wholesaler:</span>
                  <span className="font-semibold text-slate-800">{approvingOrder.wholesalerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Commercial Valuation:</span>
                  <span className="font-bold text-slate-900">
                    BDT {approvingOrder.totalAmountBDT.toLocaleString("en-BD", { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Units:</span>
                  <span className="font-semibold text-slate-800">{approvingOrder.totalUnits} units</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Authorizing Official</Label>
                <Input
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="e.g. Mahbubur Rashid (Procurement Director)"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Statutory Justification & Verification Note</Label>
                <Textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Verify batch stability thresholds, pricing, and storage feasibility..."
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApprovalModalOpen(false)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmApproval}
              disabled={isApproving}
              className="h-9 bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white"
            >
              {isApproving ? "Authorizing..." : "Sign & Authorize PO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────
          MODAL 3: Stock Dock Intake & Receiving Dialog
      ───────────────────────────────────────────── */}
      <Dialog open={isReceiveModalOpen} onOpenChange={setIsReceiveModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <PackageCheck className="h-5 w-5 text-emerald-600" />
              Dock Intake & Stock Verification
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Log received physical stock consignments and directly credit into Active FEFO Inventory ledger.
            </DialogDescription>
          </DialogHeader>

          {receivingOrder && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs">
                <div>
                  <span className="text-slate-500">Purchase Order:</span>
                  <p className="font-bold text-slate-900">{receivingOrder.poNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500">Supplier / Wholesaler:</span>
                  <p className="font-semibold text-slate-800">{receivingOrder.wholesalerName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Delivery Challan / Gate Pass #</Label>
                  <Input
                    value={receiveChallan}
                    onChange={(e) => setReceiveChallan(e.target.value)}
                    placeholder="e.g. DC-2026-4091"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Receiving Note</Label>
                  <Input
                    value={receiveNotes}
                    onChange={(e) => setReceiveNotes(e.target.value)}
                    placeholder="Visual inspection passed, temperature logged"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Items Intake Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Received Consignments Specification</Label>
                    <p className="text-[10px] text-slate-500">Specify batch numbers, expiry dates, and intake quantities.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoFillRemaining}
                    className="h-7 gap-1 text-[11px] font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <Check className="h-3 w-3" />
                    Auto-Fill Remaining Balances
                  </Button>
                </div>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="text-xs font-bold">Formulation</TableHead>
                        <TableHead className="w-20 text-center text-xs font-bold">Ordered</TableHead>
                        <TableHead className="w-20 text-center text-xs font-bold">Rec'd</TableHead>
                        <TableHead className="w-24 text-right text-xs font-bold">Intake Units</TableHead>
                        <TableHead className="w-32 text-xs font-bold">Assigned Batch #</TableHead>
                        <TableHead className="w-32 text-xs font-bold">Expiry Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receiveFormItems.map((item, idx) => (
                        <TableRow key={idx} className="border-b border-slate-100">
                          <TableCell className="text-xs font-medium text-slate-900">
                            {item.drugName}
                            <span className="block text-[10px] text-slate-500">{item.storageCondition}</span>
                          </TableCell>
                          <TableCell className="text-center text-xs text-slate-600">
                            {item.quantityOrdered}
                          </TableCell>
                          <TableCell className="text-center text-xs text-emerald-600 font-semibold">
                            {item.alreadyReceived}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              value={item.quantityToReceive}
                              onChange={(e) => {
                                const val = Number(e.target.value)
                                setReceiveFormItems((prev) => {
                                  const copy = [...prev]
                                  copy[idx].quantityToReceive = val
                                  return copy
                                })
                              }}
                              className="h-8 w-20 text-right text-xs font-bold text-emerald-700 ml-auto"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.batchNumber}
                              onChange={(e) => {
                                const val = e.target.value
                                setReceiveFormItems((prev) => {
                                  const copy = [...prev]
                                  copy[idx].batchNumber = val
                                  return copy
                                })
                              }}
                              className="h-8 text-xs font-semibold"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={item.expiryDate}
                              onChange={(e) => {
                                const val = e.target.value
                                setReceiveFormItems((prev) => {
                                  const copy = [...prev]
                                  copy[idx].expiryDate = val
                                  return copy
                                })
                              }}
                              className="h-8 text-xs"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Direct Sync Option */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
                <input
                  type="checkbox"
                  id="syncInventoryCheckbox"
                  checked={syncWithInventory}
                  onChange={(e) => setSyncWithInventory(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="syncInventoryCheckbox" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Synchronize and immediately inject received batches into the Active FEFO Warehouse Ledger
                </Label>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReceiveModalOpen(false)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmReceive}
              disabled={isReceivingStock}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white"
            >
              {isReceivingStock ? "Processing Intake..." : "Complete Dock Intake"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────
          MODAL 4: Official Printable Purchase Order Voucher
      ───────────────────────────────────────────── */}
      <Dialog open={isVoucherModalOpen} onOpenChange={setIsVoucherModalOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto print:p-0">
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Formal Purchase Order Voucher
              </DialogTitle>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Voucher
              </Button>
            </div>
          </DialogHeader>

          {voucherOrder && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-6 text-slate-900 font-sans print:border-none print:p-0">
              {/* Header Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                    AK PHARMACEUTICALS LTD.
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Central Distribution & Supply Chain Operations
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Plot 48, Tejgaon Industrial Area, Dhaka 1208, Bangladesh | Tel: +880 2-8878901
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Drug License: DA-DL-1998-00412 | 21 CFR Part 11 Regulated
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded">
                    PURCHASE ORDER
                  </span>
                  <p className="text-base font-extrabold text-blue-700 mt-1.5">{voucherOrder.poNumber}</p>
                  <p className="text-xs text-slate-500">Date: {voucherOrder.poDate}</p>
                </div>
              </div>

              {/* Vendor & Delivery Details */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Vendor / Wholesaler:
                  </span>
                  <p className="font-bold text-sm text-slate-900">{voucherOrder.wholesalerName}</p>
                  <p className="text-slate-600">{voucherOrder.wholesalerAddress || "Tejgaon Commercial Depot"}</p>
                  <p className="text-slate-600">Contact: {voucherOrder.contactPerson || "Commercial Sales Manager"}</p>
                  <p className="text-slate-600">Phone: {voucherOrder.phone || "+880 1711-000000"}</p>
                  <p className="text-slate-600">Supplier Code: {voucherOrder.wholesalerCode || "N/A"}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Shipping & Delivery Destination:
                  </span>
                  <p className="font-bold text-sm text-slate-900">{voucherOrder.deliveryWarehouse}</p>
                  <p className="text-slate-600">Payment Terms: {voucherOrder.paymentTerms}</p>
                  <p className="text-slate-600">Expected Delivery: {voucherOrder.expectedDeliveryDate || "Immediate"}</p>
                  <p className="text-slate-600">Shipping Terms: {voucherOrder.shippingTerms || "FOB Central Depot"}</p>
                  <p className="text-slate-600">Requisition Ref: {voucherOrder.requisitionRef || "N/A"}</p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2 text-center w-10">S/N</th>
                      <th className="py-2 px-3 text-left">Drug Formulation & Generic</th>
                      <th className="py-2 px-2 text-left">Pack Size</th>
                      <th className="py-2 px-2 text-left">Storage</th>
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Rate (BDT)</th>
                      <th className="py-2 px-3 text-right">Total (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {voucherOrder.items?.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2 px-2 text-center text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {it.drugName}
                          {it.genericName && (
                            <span className="block text-[10px] text-slate-500 font-normal">{it.genericName}</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-slate-600">{it.packSize || "Standard"}</td>
                        <td className="py-2 px-2 text-slate-600">{it.storageRequirement || "Ambient"}</td>
                        <td className="py-2 px-2 text-right font-bold text-slate-900">
                          {it.quantityOrdered.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-700">
                          {it.unitCostBDT.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {it.totalCostBDT.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800">
                      BDT {voucherOrder.subtotalBDT.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {voucherOrder.discountBDT > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Trade Discount:</span>
                      <span className="text-rose-600 font-semibold">
                        - BDT {voucherOrder.discountBDT.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {voucherOrder.taxBDT > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>VAT / Statutory Tax:</span>
                      <span className="font-semibold text-slate-800">
                        + BDT {voucherOrder.taxBDT.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between font-extrabold text-sm text-slate-900">
                    <span>Net Amount:</span>
                    <span className="text-blue-700">
                      BDT {voucherOrder.totalAmountBDT.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Commercial Terms & Notes */}
              <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Special Instructions & Standard Pharma Terms:
                </span>
                <p>1. Consignments must carry certificates of analysis (CoA) with minimum 75% remaining shelf life.</p>
                <p>2. Cold-chain items must be shipped with calibrated data loggers. Temp breaches will void acceptance.</p>
                {voucherOrder.notes && <p className="font-medium text-slate-800 mt-1">Note: {voucherOrder.notes}</p>}
              </div>

              {/* Statutory Signature Blocks */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 pt-1">
                    <p className="font-bold text-slate-800">{voucherOrder.createdBy || "Procurement Officer"}</p>
                    <p className="text-[10px] text-slate-500">Prepared By</p>
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1">
                    <p className="font-bold text-slate-800">QA Pharmacist</p>
                    <p className="text-[10px] text-slate-500">Verified & Inspected</p>
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1">
                    <p className="font-bold text-slate-800">
                      {voucherOrder.approvedBy || "Mahbubur Rashid (Director)"}
                    </p>
                    <p className="text-[10px] text-slate-500">Authorized & Signed</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────
          MODAL 5: Wholesalers Registry Management
      ───────────────────────────────────────────── */}
      <Dialog open={isWholesalersModalOpen} onOpenChange={setIsWholesalersModalOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Licensed Wholesalers & Distributors Registry
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Approved commercial pharmaceutical suppliers, DGDA drug licenses, lead times, and credit terms.
                </DialogDescription>
              </div>
              <Button
                size="sm"
                onClick={handleOpenNewWholesaler}
                className="h-8 gap-1 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white self-start sm:self-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                Register Wholesaler
              </Button>
            </div>
          </DialogHeader>

          {/* New / Edit Wholesaler Inline Form */}
          {isNewWholesalerOpen && (
            <form onSubmit={handleSaveWholesaler} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {editingWholesaler ? `Edit Wholesaler: ${editingWholesaler.name}` : "Register New Wholesaler Profile"}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewWholesalerOpen(false)
                    setEditingWholesaler(null)
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Wholesaler / Distributor Name *</Label>
                  <Input
                    value={newWholesalerForm.name}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Beximco Pharma Distribution"
                    className="h-8 text-xs bg-white font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Wholesaler Code</Label>
                  <Input
                    value={newWholesalerForm.wholesalerCode}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, wholesalerCode: e.target.value }))}
                    placeholder="e.g. WHL-BEX-02 (Auto-generated if blank)"
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Contact Person *</Label>
                  <Input
                    value={newWholesalerForm.contactPerson}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, contactPerson: e.target.value }))}
                    placeholder="e.g. Kazi Rafiqul Islam (Depot Lead)"
                    className="h-8 text-xs bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Phone Number *</Label>
                  <Input
                    value={newWholesalerForm.phone}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+880 1711-000000"
                    className="h-8 text-xs bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                  <Input
                    type="email"
                    value={newWholesalerForm.email}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="depot.orders@supplier.com"
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">DGDA Drug License # *</Label>
                  <Input
                    value={newWholesalerForm.drugLicenseNo}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, drugLicenseNo: e.target.value }))}
                    placeholder="DA-DL-2023-XXXX"
                    className="h-8 text-xs bg-white font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Trade License #</Label>
                  <Input
                    value={newWholesalerForm.tradeLicense}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, tradeLicense: e.target.value }))}
                    placeholder="TRAD-DNCC-XXXXXX"
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Commercial Territory</Label>
                  <select
                    value={newWholesalerForm.territory}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, territory: e.target.value }))}
                    className="h-8 w-full text-xs rounded-md border border-slate-200 bg-white px-2"
                  >
                    <option value="Dhaka Central">Dhaka Central</option>
                    <option value="Dhaka North">Dhaka North</option>
                    <option value="Dhaka South">Dhaka South</option>
                    <option value="Dhaka Suburb">Dhaka Suburb / Savar</option>
                    <option value="Dhaka West">Dhaka West / Mirpur</option>
                    <option value="Chittagong Metro">Chittagong Metro</option>
                    <option value="Sylhet Division">Sylhet Division</option>
                    <option value="Rajshahi Division">Rajshahi Division</option>
                    <option value="Khulna Division">Khulna Division</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Default Payment Terms</Label>
                  <select
                    value={newWholesalerForm.paymentTerms}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, paymentTerms: e.target.value }))}
                    className="h-8 w-full text-xs rounded-md border border-slate-200 bg-white px-2"
                  >
                    {PAYMENT_TERMS_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Lead Time (Days)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={newWholesalerForm.leadTimeDays}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, leadTimeDays: Number(e.target.value) || 1 }))}
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Vendor Rating (1.0 - 5.0)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={newWholesalerForm.rating}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, rating: Number(e.target.value) || 5.0 }))}
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Compliance Status</Label>
                  <select
                    value={newWholesalerForm.status}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, status: e.target.value as any }))}
                    className="h-8 w-full text-xs rounded-md border border-slate-200 bg-white px-2"
                  >
                    <option value="Active">Active (Approved)</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Blacklisted">Blacklisted</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold text-slate-700">Physical Depot / Warehouse Address *</Label>
                  <Input
                    value={newWholesalerForm.address}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Plot 48, Tejgaon Industrial Area, Dhaka 1208"
                    className="h-8 text-xs bg-white"
                    required
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-xs font-semibold text-slate-700">Supplied Categories (comma separated)</Label>
                  <Input
                    value={newWholesalerForm.suppliedCategories.join(", ")}
                    onChange={(e) =>
                      setNewWholesalerForm((p) => ({
                        ...p,
                        suppliedCategories: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      }))
                    }
                    placeholder="Antibiotic, Cold Chain, Cardiovascular"
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsNewWholesalerOpen(false)
                    setEditingWholesaler(null)
                  }}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingWholesaler}
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white"
                >
                  {isSavingWholesaler ? "Saving Wholesaler..." : editingWholesaler ? "Update Profile" : "Register Wholesaler"}
                </Button>
              </div>
            </form>
          )}

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={wholesalerSearchQuery}
                onChange={(e) => setWholesalerSearchQuery(e.target.value)}
                placeholder="Search by distributor name, code, contact person, or drug license..."
                className="h-8 pl-9 text-xs"
              />
              {wholesalerSearchQuery && (
                <button
                  onClick={() => setWholesalerSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={wholesalerStatusFilter}
                onChange={(e) => setWholesalerStatusFilter(e.target.value)}
                className="h-8 text-xs rounded-md border border-slate-200 bg-white px-2.5"
              >
                <option value="all">All Vendor Statuses</option>
                <option value="Active">Active</option>
                <option value="Under Review">Under Review</option>
                <option value="Blacklisted">Blacklisted</option>
              </select>
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {filteredWholesalers.length} of {wholesalers.length}
              </span>
            </div>
          </div>

          {/* Wholesalers Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="w-28 text-xs font-bold text-slate-700">Code</TableHead>
                  <TableHead className="min-w-[180px] text-xs font-bold text-slate-700">Distributor / Depot</TableHead>
                  <TableHead className="min-w-[170px] text-xs font-bold text-slate-700">Contact & Address</TableHead>
                  <TableHead className="w-36 text-xs font-bold text-slate-700">Drug License #</TableHead>
                  <TableHead className="w-24 text-xs font-bold text-slate-700">Lead Time</TableHead>
                  <TableHead className="w-24 text-center text-xs font-bold text-slate-700">Status</TableHead>
                  <TableHead className="w-28 text-right text-xs font-bold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWholesalers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Building2 className="h-6 w-6 text-slate-300" />
                        <p className="font-semibold text-slate-700">No wholesalers match your search</p>
                        <p className="text-slate-400 text-[11px]">Try adjusting the search criteria or add a new wholesaler</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWholesalers.map((w) => (
                    <TableRow key={w.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                      <TableCell className="font-bold text-xs text-blue-600 font-mono">
                        {w.wholesalerCode}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-slate-900">{w.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="flex items-center text-[10px] text-amber-600 font-bold">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-0.5" />
                              {w.rating?.toFixed(1) || "5.0"}
                            </span>
                            <span className="text-[10px] text-slate-400">•</span>
                            <span className="text-[10px] text-slate-500">{w.territory || "Dhaka Metro"}</span>
                          </div>
                          {w.suppliedCategories && w.suppliedCategories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {w.suppliedCategories.slice(0, 2).map((cat, i) => (
                                <span
                                  key={i}
                                  className="rounded px-1.5 py-0.2 text-[9px] font-medium bg-slate-100 text-slate-600"
                                >
                                  {cat}
                                </span>
                              ))}
                              {w.suppliedCategories.length > 2 && (
                                <span className="text-[9px] text-slate-400">+{w.suppliedCategories.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="text-slate-800 font-medium">{w.contactPerson}</span>
                          <span className="text-[11px] text-slate-500">{w.phone}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[180px]">{w.address}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-xs font-mono">
                          <span className="text-slate-800 font-semibold">{w.drugLicenseNo}</span>
                          {w.tradeLicense && (
                            <span className="text-[10px] text-slate-400">{w.tradeLicense}</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-600">
                        <span className="font-medium text-slate-900">{w.leadTimeDays || 3} Days</span>
                        <span className="block text-[10px] text-slate-400">{w.paymentTerms || "Net 30"}</span>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          className={`text-[10px] font-semibold ${
                            w.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : w.status === "Under Review"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {w.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Filter Main PO Table */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleFilterByWholesaler(w.name)}
                            title="Filter orders by this wholesaler"
                            className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Filter className="h-3.5 w-3.5" />
                          </Button>

                          {/* Edit Wholesaler */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditWholesaler(w)}
                            title="Edit wholesaler profile"
                            className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          {/* Delete Wholesaler */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDeleteWholesaler(w)}
                            title="Deregister wholesaler"
                            className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────
          MODAL 6: Global Delete Purchase Order Modal
      ───────────────────────────────────────────── */}
      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Purchase Order"
        description="Are you sure you want to permanently delete this purchase order from the registry? This statutory record will be purged from the procurement ledger."
        itemName={deleteTarget ? `${deleteTarget.poNumber} (${deleteTarget.wholesalerName})` : undefined}
        confirmText="Delete Order"
        isDeleting={isDeleting}
      />

      {/* ─────────────────────────────────────────────
          MODAL 7: Global Delete Wholesaler Modal
      ───────────────────────────────────────────── */}
      <DeleteConfirmationModal
        open={isDeleteWholesalerModalOpen}
        onOpenChange={setIsDeleteWholesalerModalOpen}
        onConfirm={handleConfirmDeleteWholesaler}
        title="Deregister Licensed Wholesaler"
        description="Are you sure you want to remove this licensed wholesaler from the approved vendor directory? They will no longer be available for commercial purchase orders."
        itemName={deleteWholesalerTarget ? `${deleteWholesalerTarget.name} (${deleteWholesalerTarget.wholesalerCode})` : undefined}
        confirmText="Deregister Wholesaler"
        isDeleting={isDeletingWholesaler}
      />

      {/* ─────────────────────────────────────────────
          MODAL 8: Interactive Purchase Order Inspector
      ───────────────────────────────────────────── */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          {detailsOrder && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{detailsOrder.poNumber}</h2>
                      {renderPriorityBadge(detailsOrder.priority)}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Issued on {detailsOrder.poDate} • Requisition Ref: {detailsOrder.requisitionRef || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {renderStatusBadge(detailsOrder.status, detailsOrder.approvalStage)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsDetailsModalOpen(false)
                      handleOpenVoucherModal(detailsOrder)
                    }}
                    className="h-8 gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Voucher
                  </Button>
                </div>
              </div>

              {/* Stepper Progress Bar */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/75 p-4">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Procurement Lifecycle Progress
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Step 1: Draft */}
                  <div className={`p-2.5 rounded-lg border text-xs ${
                    detailsOrder.status !== "Cancelled"
                      ? "bg-white border-blue-200 text-blue-900 shadow-xs"
                      : "bg-slate-100 border-slate-200 text-slate-400"
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                      <span>1. Requisition</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">Order Prepared</span>
                  </div>

                  {/* Step 2: Submitted */}
                  <div className={`p-2.5 rounded-lg border text-xs ${
                    detailsOrder.status === "Submitted" ||
                    detailsOrder.status === "Approved" ||
                    detailsOrder.status === "Partially Received" ||
                    detailsOrder.status === "Received"
                      ? "bg-white border-purple-200 text-purple-900 shadow-xs"
                      : "bg-slate-100 border-slate-200 text-slate-400"
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                      <span>2. Multi-tier Review</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {detailsOrder.status === "Draft" ? "Pending Submission" : "Review Cleared"}
                    </span>
                  </div>

                  {/* Step 3: Approved / Inbound */}
                  <div className={`p-2.5 rounded-lg border text-xs ${
                    detailsOrder.status === "Approved" ||
                    detailsOrder.status === "Partially Received" ||
                    detailsOrder.status === "Received"
                      ? "bg-white border-emerald-200 text-emerald-900 shadow-xs"
                      : "bg-slate-100 border-slate-200 text-slate-400"
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      <Truck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>3. Authorized Inbound</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {detailsOrder.approvedBy ? `By ${detailsOrder.approvedBy.split(" ")[0]}` : "Awaiting Sign-off"}
                    </span>
                  </div>

                  {/* Step 4: Warehouse Intake */}
                  <div className={`p-2.5 rounded-lg border text-xs ${
                    detailsOrder.status === "Received"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs"
                      : detailsOrder.status === "Partially Received"
                      ? "bg-amber-50 border-amber-300 text-amber-900 shadow-xs"
                      : "bg-slate-100 border-slate-200 text-slate-400"
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>4. Dock Intake</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {detailsOrder.status === "Received"
                        ? "100% Fulfilled & Batched"
                        : detailsOrder.status === "Partially Received"
                        ? "Partial Intake Synced"
                        : "Awaiting Delivery"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vendor & Logistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vendor Details */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span>Wholesaler / Supplier</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    <p className="font-bold text-sm text-slate-900">{detailsOrder.wholesalerName}</p>
                    <p className="text-slate-600">{detailsOrder.wholesalerAddress || "Plot 48, Tejgaon Industrial Area, Dhaka"}</p>
                    <div className="flex items-center gap-2 pt-1 text-slate-600">
                      <span className="font-semibold">Contact:</span>
                      <span>{detailsOrder.contactPerson || "Sales Depot Officer"}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-600">
                      <span>Phone: {detailsOrder.phone || "+880 1711-000000"}</span>
                      {detailsOrder.email && <span>Email: {detailsOrder.email}</span>}
                    </div>
                    <div className="pt-1">
                      <Badge variant="outline" className="text-[10px]">
                        Vendor Code: {detailsOrder.wholesalerCode || "N/A"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Logistics & Delivery Destination */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span>Delivery Bay & Terms</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Destination Warehouse Bay:</span>
                      <p className="font-semibold text-slate-900">{detailsOrder.deliveryWarehouse}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Payment Terms:</span>
                        <p className="font-medium text-slate-800">{detailsOrder.paymentTerms}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Expected Delivery:</span>
                        <p className="font-medium text-slate-800">{detailsOrder.expectedDeliveryDate || "Immediate"}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Shipping Terms:</span>
                        <p className="font-medium text-slate-800">{detailsOrder.shippingTerms || "FOB Central Depot"}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Requisition Ref:</span>
                        <p className="font-medium text-slate-800">{detailsOrder.requisitionRef || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items & Consignment Fulfillment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Line Items & Fulfillment Status ({detailsOrder.items?.length || 0} Formulations)
                  </h4>
                  <span className="text-xs text-slate-500">
                    Total: {detailsOrder.totalUnits.toLocaleString()} Units
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="w-10 text-center text-xs font-bold">#</TableHead>
                        <TableHead className="text-xs font-bold">Drug Formulation</TableHead>
                        <TableHead className="w-28 text-xs font-bold">Pack Size</TableHead>
                        <TableHead className="w-32 text-xs font-bold">Storage Temp</TableHead>
                        <TableHead className="w-40 text-center text-xs font-bold">Fulfillment Progress</TableHead>
                        <TableHead className="w-28 text-right text-xs font-bold">Unit Cost</TableHead>
                        <TableHead className="w-32 text-right text-xs font-bold">Line Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailsOrder.items?.map((it, idx) => {
                        const rec = it.quantityReceived || 0
                        const pct = it.quantityOrdered > 0 ? Math.round((rec / it.quantityOrdered) * 100) : 0
                        const isCold = it.storageRequirement?.includes("Cold Chain")
                        return (
                          <TableRow key={idx} className="border-b border-slate-100">
                            <TableCell className="text-center text-xs text-slate-500 font-bold">
                              {idx + 1}
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs text-slate-900">{it.drugName}</span>
                                {it.genericName && (
                                  <span className="text-[10px] text-slate-500">{it.genericName}</span>
                                )}
                                {it.skuCode && (
                                  <span className="text-[9px] text-blue-600 font-mono mt-0.5">{it.skuCode}</span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-xs text-slate-600">
                              {it.packSize || "Standard"}
                            </TableCell>

                            <TableCell>
                              {isCold ? (
                                <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] flex items-center gap-1 font-semibold">
                                  <Snowflake className="h-3 w-3" />
                                  2-8°C Cold Chain
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-slate-600">
                                  Ambient (&lt;25°C)
                                </Badge>
                              )}
                            </TableCell>

                            {/* Fulfillment progress */}
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[11px] font-medium">
                                  <span className="text-slate-800">{rec.toLocaleString()} / {it.quantityOrdered.toLocaleString()}</span>
                                  <span className={pct >= 100 ? "text-emerald-600 font-bold" : pct > 0 ? "text-amber-600 font-bold" : "text-slate-400"}>
                                    {pct}%
                                  </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className={`h-full transition-all rounded-full ${
                                      pct >= 100
                                        ? "bg-emerald-500"
                                        : pct > 0
                                        ? "bg-amber-500"
                                        : "bg-slate-300"
                                    }`}
                                    style={{ width: `${Math.min(100, pct)}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="text-right text-xs text-slate-700 font-medium">
                              BDT {it.unitCostBDT.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                            </TableCell>

                            <TableCell className="text-right text-xs font-bold text-slate-900">
                              BDT {it.totalCostBDT.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Financial Calculation Box */}
              <div className="flex justify-end">
                <div className="w-full sm:w-80 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800">
                      BDT {detailsOrder.subtotalBDT.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {detailsOrder.discountBDT > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Trade Discount:</span>
                      <span className="font-semibold text-rose-600">
                        - BDT {detailsOrder.discountBDT.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {detailsOrder.taxBDT > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>VAT / Statutory Tax:</span>
                      <span className="font-semibold text-slate-800">
                        + BDT {detailsOrder.taxBDT.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-extrabold text-slate-900">
                    <span>Net Total Payable:</span>
                    <span className="text-blue-700">
                      BDT {detailsOrder.totalAmountBDT.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statutory Audit & Notes Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  <span>21 CFR Part 11 Audit Trail & Operator Log</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Created By:</span>
                    <span className="font-semibold text-slate-800">{detailsOrder.createdBy || "Procurement Officer"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Approved By:</span>
                    <span className="font-semibold text-slate-800">{detailsOrder.approvedBy || "Pending Sign-off"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Dock Intake Status:</span>
                    <span className="font-semibold text-slate-800">
                      {detailsOrder.status === "Received"
                        ? "Consignment Complete"
                        : detailsOrder.status === "Partially Received"
                        ? "In Progress"
                        : "Awaiting Arrival"}
                    </span>
                  </div>
                </div>
                {detailsOrder.notes && (
                  <p className="text-[11px] text-slate-700 border-t border-slate-200 pt-1.5 mt-1">
                    <span className="font-semibold">Handling Directives:</span> {detailsOrder.notes}
                  </p>
                )}
              </div>

              {/* Modal Footer Actions */}
              <DialogFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2">
                  {/* Clone / Duplicate */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicateOrder(detailsOrder)}
                    className="h-8 gap-1.5 text-xs text-slate-700"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Duplicate PO
                  </Button>

                  {/* Cancel PO */}
                  {detailsOrder.status !== "Cancelled" && detailsOrder.status !== "Received" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDetailsModalOpen(false)
                        handleOpenCancelModal(detailsOrder)
                      }}
                      className="h-8 gap-1.5 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                    >
                      <XCircle className="h-3.5 w-3.5 text-amber-600" />
                      Cancel Order
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* If Draft: Submit */}
                  {detailsOrder.status === "Draft" && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSubmitForApproval(detailsOrder)}
                      className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Submit for Approval
                    </Button>
                  )}

                  {/* If Submitted: Authorize */}
                  {(detailsOrder.status === "Submitted" || detailsOrder.status === "Draft") && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setIsDetailsModalOpen(false)
                        handleOpenApprovalModal(detailsOrder)
                      }}
                      className="h-8 gap-1.5 bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Authorize PO
                    </Button>
                  )}

                  {/* If Approved or Partially Received: Dock Intake */}
                  {(detailsOrder.status === "Approved" || detailsOrder.status === "Partially Received") && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setIsDetailsModalOpen(false)
                        handleOpenReceiveModal(detailsOrder)
                      }}
                      className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white"
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      Dock Intake & Receive
                    </Button>
                  )}

                  {/* Edit */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDetailsModalOpen(false)
                      handleOpenEditModal(detailsOrder)
                    }}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="h-8 text-xs"
                  >
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────
          MODAL 9: Cancel Purchase Order Modal
      ───────────────────────────────────────────── */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-4 ring-amber-50/50">
              <XCircle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 pt-2">
              Cancel Purchase Order
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {cancellingOrder ? (
                <>
                  Voiding Purchase Order <strong className="text-slate-800">{cancellingOrder.poNumber}</strong> ({cancellingOrder.wholesalerName}).
                  This action is recorded in the statutory 21 CFR Part 11 audit log.
                </>
              ) : (
                "Provide cancellation justification."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Statutory Cancellation Reason *</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Commercial procurement cancelled due to supplier price increase / unresolvable lead time breach..."
                rows={3}
                className="text-xs"
                required
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
              className="h-9 text-xs"
            >
              Keep Order Active
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmCancel}
              disabled={isCancelling || !cancelReason.trim()}
              className="h-9 bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white"
            >
              {isCancelling ? "Cancelling..." : "Confirm Order Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
