"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { apiFetch } from "@/lib/api"
import { PurchaseOrderSheet } from "@/components/procurement/purchase-order-sheet"
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
  FileText,
  Printer,
  Boxes,
  Truck,
  CreditCard,
  Send,
  Eye,
  Copy,
  XCircle,
  Check,
  Star,
  X,
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
  paidAmountBDT?: number
  paymentStatus?: string
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

export interface FinancialAccount {
  id: string
  accountTitle: string
  category: "BANK" | "CASH"
  institution: string
  accountNumber: string
  branch: string
  balance: number
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
  const router = useRouter()
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
    territory: "Dhaka Central",
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

  // Direct Finance & Treasury Payment Disbursement State
  const [financialAccounts, setFinancialAccounts] = React.useState<FinancialAccount[]>([])
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false)
  const [payingOrder, setPayingOrder] = React.useState<PurchaseOrder | null>(null)
  const [isDisbursingPayment, setIsDisbursingPayment] = React.useState(false)
  const [paymentForm, setPaymentForm] = React.useState({
    fundingSource: "Bank Account" as "Bank Account" | "Cash Safe",
    financialAccountId: "",
    sourceDetail: "",
    paymentMethod: "BEFTN / RTGS",
    chequeNumber: "",
    amount: 0,
    paymentDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    notes: "",
  })

  // Fetch all data
  const loadData = React.useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true)
      else setLoading(true)

      const [ordersRes, metricsRes, wholesalersRes, inventoryRes, accRes] = await Promise.all([
        apiFetch("/procurement/orders"),
        apiFetch("/procurement/orders/metrics"),
        apiFetch("/wholesalers"),
        apiFetch("/inventory").catch(() => null),
        apiFetch("/account-ledger/accounts").catch(() => null),
      ])

      if (ordersRes.ok) {
        const json = await ordersRes.json()
        setOrders(json.data || [])
      }

      if (accRes && accRes.ok) {
        const json = await accRes.json()
        setFinancialAccounts(json.data || [])
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
      if (wholesalerFilter !== "all") {
        const selectedWholesaler = wholesalers.find((w) => w.id === wholesalerFilter)
        if (selectedWholesaler && order.wholesalerName !== selectedWholesaler.name) {
          return false
        }
      }

      return true
    })
  }, [orders, searchQuery, statusFilter, priorityFilter, wholesalerFilter, wholesalers])

  // Status counts for filters
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
  const handleWholesalerSelect = (wholesalerId: string) => {
    const found = wholesalers.find((w) => w.id === wholesalerId)
    if (!found) return

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
  }

  const selectedOrderWholesalerId = React.useMemo(() => {
    if (!formData.wholesalerName) return ""
    const exact = wholesalers.find(
      (w) =>
        w.name === formData.wholesalerName &&
        formData.wholesalerCode &&
        w.wholesalerCode === formData.wholesalerCode
    )
    return exact?.id || wholesalers.find((w) => w.name === formData.wholesalerName)?.id || ""
  }, [formData.wholesalerName, formData.wholesalerCode, wholesalers])

  // Item row change in Create/Edit Form
  const handleItemChange = (
    index: number,
    field: keyof PurchaseOrderItem,
    value: any
  ) => {
    setFormData((prev) => {
      const items = [...prev.items]
      const current = { ...items[index], [field]: value }

      if (field === "skuCode") {
        const matched = inventoryItems.find((inv) => inv.skuCode === value)
        if (matched) {
          current.drugName = matched.brandName
          current.genericName = matched.genericName
          current.unitCostBDT = matched.unitPrice || current.unitCostBDT
          current.storageRequirement = matched.storageCondition || current.storageRequirement
        }
      }

      if (field === "drugName") {
        const linked = inventoryItems.find((inv) => inv.skuCode && inv.skuCode === current.skuCode)
        const typed = String(value).trim().toLowerCase()
        if (linked && linked.brandName.trim().toLowerCase() !== typed) {
          current.skuCode = ""
          if (
            (current.genericName || "").trim().toLowerCase() ===
            (linked.genericName || "").trim().toLowerCase()
          ) {
            current.genericName = ""
          }
        }
      }

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
      items:
        order.items && order.items.length > 0
          ? order.items.map((it, i) => ({
              ...it,
              no: i + 1,
            }))
          : [
              {
                no: 1,
                skuCode: "",
                drugName: "Pharmaceutical Formulation",
                quantityOrdered: 100,
                quantityReceived: 0,
                unitCostBDT: 100,
                totalCostBDT: 10000,
                storageRequirement: "Controlled Ambient (<25°C)",
              },
            ],
    })
    setIsOrderModalOpen(true)
  }

  // Save / Update Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.wholesalerName.trim()) {
      toast.error("Please select a licensed wholesaler")
      return
    }

    const hasInvalidItem = formData.items.some(
      (it) => !it.drugName.trim() || Number(it.quantityOrdered) <= 0
    )
    if (hasInvalidItem) {
      toast.error("Please ensure all items have valid drug names and quantities greater than zero")
      return
    }

    const toastId = toast.loading(editingOrder ? "Updating purchase order..." : "Creating purchase order...")
    setIsSavingOrder(true)

    try {
      const payload = {
        ...formData,
        items: formData.items.map((it) => ({
          skuCode: it.skuCode || null,
          drugName: it.drugName,
          genericName: it.genericName || null,
          packSize: it.packSize || null,
          quantityOrdered: Number(it.quantityOrdered),
          quantityReceived: Number(it.quantityReceived) || 0,
          unitCostBDT: Number(it.unitCostBDT),
          totalCostBDT: Number(it.totalCostBDT),
          storageRequirement: it.storageRequirement || "Controlled Ambient (<25°C)",
        })),
        subtotalBDT: formSubtotal,
        discountBDT: Number(formData.discountBDT) || 0,
        taxBDT: Number(formData.taxBDT) || 0,
        totalAmountBDT: formGrandTotal,
      }

      const url = editingOrder ? `/procurement/orders/${editingOrder.id}` : "/procurement/orders"
      const method = editingOrder ? "PUT" : "POST"

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
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
      console.error("Save purchase order error:", err)
      toast.error(err.message || "Failed to save purchase order", { id: toastId })
    } finally {
      setIsSavingOrder(false)
    }
  }

  // Open Approval Modal
  const handleOpenApprovalModal = (order: PurchaseOrder) => {
    setApprovingOrder(order)
    setApprovalNote("")
    setApproverName("Mahbubur Rashid (Procurement Director)")
    setIsApprovalModalOpen(true)
  }

  // Confirm Multi-Tier Approval
  const handleConfirmApproval = async () => {
    if (!approvingOrder) return

    const toastId = toast.loading(`Authorizing Purchase Order ${approvingOrder.poNumber}...`)
    setIsApproving(true)

    try {
      const res = await apiFetch(`/procurement/orders/${approvingOrder.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedBy: approverName,
          approvalNote: approvalNote || "Multi-tier regulatory procurement approval cleared.",
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || "Failed to approve purchase order")
      }

      toast.success(`Purchase Order ${approvingOrder.poNumber} approved under statutory authorization`, {
        id: toastId,
      })
      setIsApprovalModalOpen(false)
      loadData()
    } catch (err: any) {
      console.error("Approve order error:", err)
      toast.error(err.message || "Failed to approve purchase order", { id: toastId })
    } finally {
      setIsApproving(false)
    }
  }

  // Open Receive Stock Modal
  const handleOpenReceiveModal = (order: PurchaseOrder) => {
    setReceivingOrder(order)
    setReceiveChallan(`CHL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
    setReceiveNotes("Physical dock intake completed with batch verification")

    const rows = (order.items || []).map((it, idx) => {
      const remaining = Math.max(0, it.quantityOrdered - (it.quantityReceived || 0))
      const expiry = new Date()
      expiry.setFullYear(expiry.getFullYear() + 2)

      return {
        no: idx + 1,
        skuCode: it.skuCode || undefined,
        drugName: it.drugName,
        quantityOrdered: it.quantityOrdered,
        alreadyReceived: it.quantityReceived || 0,
        quantityToReceive: remaining,
        batchNumber: `B-${new Date().getFullYear().toString().slice(2)}${String(idx + 1).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`,
        mfgDate: new Date().toISOString().split("T")[0],
        expiryDate: expiry.toISOString().split("T")[0],
        warehouseBin: "BAY-CENTRAL-01",
        storageCondition: it.storageRequirement || "Controlled Ambient (<25°C)",
        unitPrice: it.unitCostBDT,
      }
    })

    setReceiveFormItems(rows)
    setIsReceiveModalOpen(true)
  }

  const handleAutoFillRemaining = () => {
    setReceiveFormItems((prev) =>
      prev.map((it) => ({
        ...it,
        quantityToReceive: Math.max(0, it.quantityOrdered - it.alreadyReceived),
      }))
    )
    toast.info("Auto-filled remaining quantities for all lines")
  }

  // Submit Receive Stock
  const handleSubmitReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!receivingOrder) return

    const totalIntake = receiveFormItems.reduce((acc, it) => acc + (Number(it.quantityToReceive) || 0), 0)
    if (totalIntake <= 0) {
      toast.warning("Please specify intake units greater than zero")
      return
    }

    const toastId = toast.loading(`Processing dock intake for PO ${receivingOrder.poNumber}...`)
    setIsReceivingStock(true)

    try {
      const formattedItems = receiveFormItems
        .filter((it) => Number(it.quantityToReceive) > 0)
        .map((it) => ({
          drugName: it.drugName,
          skuCode: it.skuCode,
          quantityToReceive: Number(it.quantityToReceive),
          quantityReceived: Number(it.quantityToReceive),
          batchNumber: it.batchNumber || `BX-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          mfgDate: it.mfgDate,
          expiryDate: it.expiryDate,
          warehouseBin: it.warehouseBin,
          storageCondition: it.storageCondition,
          unitPrice: Number(it.unitPrice) || 0,
        }))

      const payload = {
        challanNumber: receiveChallan,
        deliveryChallan: receiveChallan,
        notes: receiveNotes,
        updateInventoryBatches: true,
        syncWithInventory: true,
        receivedItems: formattedItems,
        items: formattedItems,
      }

      const res = await apiFetch(`/procurement/orders/${receivingOrder.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || "Failed to receive goods")
      }

      toast.success(
        `Dock intake logged! ${totalIntake.toLocaleString()} units credited to inventory for PO ${receivingOrder.poNumber}`,
        { id: toastId }
      )
      setIsReceiveModalOpen(false)
      loadData()
    } catch (err: any) {
      console.error("Receive goods error:", err)
      toast.error(err.message || "Failed to process stock intake", { id: toastId })
    } finally {
      setIsReceivingStock(false)
    }
  }

  // Open Direct Payment Disbursement Modal
  const handleOpenPaymentModal = (order: PurchaseOrder) => {
    setPayingOrder(order)
    const defaultBank = financialAccounts.find((a) => a.category === "BANK") || financialAccounts[0]
    setPaymentForm({
      fundingSource: defaultBank?.category === "CASH" ? "Cash Safe" : "Bank Account",
      financialAccountId: defaultBank?.id || "",
      sourceDetail: defaultBank?.accountTitle || "",
      paymentMethod: defaultBank?.category === "CASH" ? "Cash" : "BEFTN / RTGS",
      chequeNumber: "",
      amount: order.totalAmountBDT,
      paymentDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      notes: `Wholesaler consignment settlement for PO #${order.poNumber} (${order.wholesalerName})`,
    })
    setIsPaymentModalOpen(true)
  }

  // Submit Payment Disbursement to Finance & Treasury
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payingOrder) return
    const numAmt = Number(paymentForm.amount)
    if (!numAmt || numAmt <= 0) {
      toast.warning("Please specify a valid payment amount")
      return
    }

    const toastId = toast.loading(`Disbursing payment for PO ${payingOrder.poNumber}...`)
    setIsDisbursingPayment(true)

    try {
      const selectedAcc = financialAccounts.find((a) => a.id === paymentForm.financialAccountId)
      const payload = {
        payeeName: payingOrder.wholesalerName,
        payeeType: "Wholesaler / Vendor",
        wholesalerId: payingOrder.wholesalerCode || null,
        poNumber: payingOrder.poNumber,
        category: "Wholesaler Settlement",
        fundingSource: paymentForm.fundingSource,
        sourceDetail: selectedAcc?.accountTitle || paymentForm.sourceDetail || "",
        financialAccountId: paymentForm.financialAccountId || null,
        paymentMethod: paymentForm.paymentMethod,
        chequeNumber: paymentForm.chequeNumber ? paymentForm.chequeNumber.trim() : null,
        grossAmount: numAmt,
        amount: numAmt,
        paymentDate: paymentForm.paymentDate,
        status: "Disbursed",
        notes: paymentForm.notes || `Direct settlement for PO #${payingOrder.poNumber}`,
        lineItems: (payingOrder.items || []).map((it) => ({
          itemName: it.drugName,
          quantity: it.quantityOrdered,
          unitCostBDT: it.unitCostBDT,
          lineTotalBDT: it.totalCostBDT,
        })),
      }

      const res = await apiFetch("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || "Failed to disburse payment")
      }

      toast.success(
        `Payment voucher ${json.data?.voucherNo || ""} disbursed! ৳${numAmt.toLocaleString("en-IN")} deducted from ${payload.sourceDetail} in Finance & Treasury.`,
        { id: toastId }
      )
      setIsPaymentModalOpen(false)
      loadData()
    } catch (err: any) {
      console.error("Payment disburse error:", err)
      toast.error(err.message || "Failed to disburse payment", { id: toastId })
    } finally {
      setIsDisbursingPayment(false)
    }
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
      console.error("Delete purchase order error:", err)
      toast.error(err.message || "Failed to delete purchase order", { id: toastId })
    } finally {
      setIsDeleting(false)
    }
  }

  // Submit Draft for Approval
  const handleSubmitForApproval = async (order: PurchaseOrder) => {
    const toastId = toast.loading(`Submitting Purchase Order ${order.poNumber} for review...`)
    try {
      const res = await apiFetch(`/procurement/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Submitted",
          approvalStage: "Departmental Verification",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to submit purchase order")
      toast.success(`Purchase Order ${order.poNumber} submitted for approval`, { id: toastId })
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to submit purchase order", { id: toastId })
    }
  }

  // Open Cancel Modal
  const handleOpenCancelModal = (order: PurchaseOrder) => {
    setCancellingOrder(order)
    setCancelReason("")
    setIsCancelModalOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return

    const toastId = toast.loading(`Cancelling Purchase Order ${cancellingOrder.poNumber}...`)
    setIsCancelling(true)

    try {
      const res = await apiFetch(`/procurement/orders/${cancellingOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Cancelled",
          notes: `${cancellingOrder.notes ? cancellingOrder.notes + " | " : ""}CANCELLED: ${cancelReason}`,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to cancel purchase order")
      toast.success(`Purchase Order ${cancellingOrder.poNumber} marked as Cancelled`, { id: toastId })
      setIsCancelModalOpen(false)
      setCancellingOrder(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel purchase order", { id: toastId })
    } finally {
      setIsCancelling(false)
    }
  }

  // Duplicate / Clone PO into new form
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
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      priority: order.priority,
      status: "Draft",
      requisitionRef: `REQ-CLONE-${Math.floor(100 + Math.random() * 900)}`,
      shippingTerms: order.shippingTerms || "FOB Central Depot",
      notes: `Reorder cloned from ${order.poNumber}.`,
      discountBDT: order.discountBDT,
      taxBDT: order.taxBDT,
      items: order.items.map((it, i) => ({
        ...it,
        no: i + 1,
        quantityReceived: 0,
      })),
    })
    setIsOrderModalOpen(true)
    toast.info(`Cloned items from ${order.poNumber} into a new draft purchase order`)
  }

  // Open Voucher Modal
  const handleOpenVoucherModal = (order: PurchaseOrder) => {
    setVoucherOrder(order)
    setIsVoucherModalOpen(true)
  }

  // Open Inspector Modal
  const handleOpenDetailsModal = (order: PurchaseOrder) => {
    setDetailsOrder(order)
    setIsDetailsModalOpen(true)
  }

  // Wholesaler Handlers
  const handleOpenNewWholesaler = () => {
    setEditingWholesaler(null)
    setNewWholesalerForm({
      wholesalerCode: `WHL-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      contactPerson: "",
      phone: "+880 ",
      email: "",
      drugLicenseNo: "",
      tradeLicense: "",
      address: "",
      territory: "Dhaka Central",
      paymentTerms: "Net 30 Days",
      rating: 5.0,
      leadTimeDays: 2,
      status: "Active",
      suppliedCategories: ["Antibiotic", "Analgesic"],
    })
    setIsNewWholesalerOpen(true)
  }

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
      territory: w.territory || "Dhaka Central",
      paymentTerms: w.paymentTerms || "Net 30 Days",
      rating: w.rating || 5.0,
      leadTimeDays: w.leadTimeDays || 2,
      status: w.status,
      suppliedCategories: w.suppliedCategories || [],
    })
    setIsNewWholesalerOpen(true)
  }

  const handleSaveWholesaler = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newWholesalerForm.name.trim() || !newWholesalerForm.drugLicenseNo.trim()) {
      toast.error("Wholesaler name and DGDA drug license number are mandatory")
      return
    }

    const toastId = toast.loading(editingWholesaler ? "Updating wholesaler profile..." : "Registering new wholesaler...")
    setIsSavingWholesaler(true)

    try {
      const url = editingWholesaler ? `/wholesalers/${editingWholesaler.id}` : "/wholesalers"
      const method = editingWholesaler ? "PUT" : "POST"

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWholesalerForm),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to save wholesaler")

      toast.success(
        editingWholesaler
          ? `Wholesaler ${newWholesalerForm.name} updated successfully`
          : `Wholesaler ${newWholesalerForm.name} registered to approved vendor directory`,
        { id: toastId }
      )

      setIsNewWholesalerOpen(false)
      setEditingWholesaler(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to save wholesaler", { id: toastId })
    } finally {
      setIsSavingWholesaler(false)
    }
  }

  const handleOpenDeleteWholesaler = (w: Wholesaler) => {
    setDeleteWholesalerTarget(w)
    setIsDeleteWholesalerModalOpen(true)
  }

  const handleConfirmDeleteWholesaler = async () => {
    if (!deleteWholesalerTarget) return

    const toastId = toast.loading(`Removing wholesaler ${deleteWholesalerTarget.name}...`)
    setIsDeletingWholesaler(true)

    try {
      const res = await apiFetch(`/wholesalers/${deleteWholesalerTarget.id}`, {
        method: "DELETE",
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Failed to delete wholesaler")

      toast.success(`Wholesaler ${deleteWholesalerTarget.name} removed from approved list`, { id: toastId })
      setIsDeleteWholesalerModalOpen(false)
      setDeleteWholesalerTarget(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete wholesaler", { id: toastId })
    } finally {
      setIsDeletingWholesaler(false)
    }
  }

  const handleFilterByWholesaler = (wholesalerName: string) => {
    setWholesalerFilter(wholesalerName)
    setIsWholesalersModalOpen(false)
    toast.info(`Filtered purchase orders for: ${wholesalerName}`)
  }

  // Export Excel
  const handleExportExcel = () => {
    if (orders.length === 0) {
      toast.warning("No purchase order records available to export")
      return
    }

    const dataToExport = filteredOrders.map((o) => ({
      "PO Number": o.poNumber,
      "Order Date": o.poDate,
      "Wholesaler Name": o.wholesalerName,
      "Vendor Code": o.wholesalerCode || "N/A",
      "Contact Person": o.contactPerson || "N/A",
      Phone: o.phone || "N/A",
      "Delivery Warehouse": o.deliveryWarehouse,
      "Payment Terms": o.paymentTerms,
      "Product Names": o.items?.map((i) => i.drugName).join(", ") || "N/A",
      "Total Line Items": o.items?.length || 0,
      "Total Units": o.totalUnits,
      "Subtotal (BDT)": o.subtotalBDT,
      "Discount (BDT)": o.discountBDT,
      "Tax (BDT)": o.taxBDT,
      "Grand Total (BDT)": o.totalAmountBDT,
      Priority: o.priority,
      Status: o.status,
      "Approval Stage": o.approvalStage || "N/A",
      "Expected Delivery": o.expectedDeliveryDate || "N/A",
      "Requisition Ref": o.requisitionRef || "N/A",
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Wholesaler POs")

    XLSX.writeFile(
      workbook,
      `AK_Pharma_Wholesaler_Purchase_Orders_${new Date().toISOString().split("T")[0]}.xlsx`
    )

    toast.success("Purchase order register exported to Excel file")
  }

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-10">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #print-standalone-voucher,
          #print-standalone-voucher * {
            visibility: visible !important;
          }
          #print-standalone-voucher {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Wholesaler Purchase Orders
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Commercial pharmaceutical procurement, multi-tier approvals, and vendor intake ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsWholesalersModalOpen(true)}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Building2 className="h-3.5 w-3.5 text-slate-500" />
            Wholesalers ({wholesalers.length})
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Order Register
          </Button>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Link href="/finance/supplier-payments">
              <CreditCard className="h-3.5 w-3.5 text-blue-600" />
              Supplier Payments
            </Link>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
          >
            <Plus className="h-4 w-4" />
            Create Purchase Order
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Pipeline Procurement Volume
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {orders.length} Orders
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            ৳{(metrics?.totalSpendBDT || 0).toLocaleString("en-IN")} Gross Procurement Value
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Pending Multi-Tier Approval
            </span>
            <div className="rounded-lg bg-purple-50 p-1.5 text-purple-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {metrics?.pendingApprovalCount || 0} Orders
          </div>
          <p className="mt-3 text-[11px] font-medium text-purple-600">
            ৳{(metrics?.pendingApprovalValueBDT || 0).toLocaleString("en-IN")} awaiting clearance
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Approved & Inbound Fleet
            </span>
            <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {metrics?.inTransitCount || 0} Orders
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            ৳{(metrics?.inTransitValueBDT || 0).toLocaleString("en-IN")} transit intake
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Fulfillment Efficiency (OTIF)
            </span>
            <Badge
              variant="outline"
              className="rounded-md border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
            >
              Target: 95%
            </Badge>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {metrics?.fulfillmentRate || 100}%
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            {metrics?.coldChainPOCount || 0} cold-chain sensitive (2-8°C)
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search PO #, wholesaler, drug name, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute top-2 right-2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[170px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Order Stages" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Stages ({statusCounts.all})</SelectItem>
              <SelectItem value="Submitted">Pending Approval ({statusCounts.Submitted})</SelectItem>
              <SelectItem value="Approved">Approved & Inbound ({statusCounts.Approved})</SelectItem>
              <SelectItem value="Partially Received">Partially Received ({statusCounts["Partially Received"]})</SelectItem>
              <SelectItem value="Received">Delivered & Invoiced ({statusCounts.Received})</SelectItem>
              <SelectItem value="Draft">Drafts ({statusCounts.Draft})</SelectItem>
              <SelectItem value="Cancelled">Cancelled ({statusCounts.Cancelled})</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 w-[160px] border-slate-200 bg-white text-xs">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="Routine">Routine</SelectItem>
              <SelectItem value="Urgent / Stockout Risk">Urgent / Stockout</SelectItem>
              <SelectItem value="Emergency Cold-Chain">Emergency Cold-Chain</SelectItem>
            </SelectContent>
          </Select>

          {/* Wholesaler Filter */}
          <Select value={wholesalerFilter} onValueChange={setWholesalerFilter}>
            <SelectTrigger className="h-8 w-[170px] border-slate-200 bg-white text-xs">
              <SelectValue placeholder="All Wholesalers" />
            </SelectTrigger>
            <SelectContent className="text-xs max-h-56">
              <SelectItem value="all">All Wholesalers</SelectItem>
              {wholesalers.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                  {w.wholesalerCode ? ` (${w.wholesalerCode})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Main Order Ledger Table */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none print:hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              COMMERCIAL WHOLESALER PURCHASE ORDER REGISTER
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Commercial procurement ledger, multi-tier approvals, and physical dock intake verification
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredOrders.length} Orders
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0 text-xs font-medium text-slate-600">PO Ref & Date</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Wholesaler / Supplier</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Product Name</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Delivery Warehouse</TableHead>
              <TableHead className="text-center text-xs font-medium text-slate-600">Total Units</TableHead>
              <TableHead className="text-right text-xs font-medium text-slate-600">Order Value</TableHead>
              <TableHead className="text-center text-xs font-medium text-slate-600">Priority</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Fulfillment Status</TableHead>
              <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-xs text-slate-400">
                  Loading wholesaler purchase orders from database...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-xs text-slate-400">
                  No purchase orders found matching current criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((ord) => (
                <TableRow
                  key={ord.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer"
                  onClick={() => handleOpenDetailsModal(ord)}
                >
                  <TableCell className="py-3 pl-0">
                    <div className="leading-tight">
                      <span className="block font-mono text-xs font-bold text-[#0090FF]">
                        {ord.poNumber}
                      </span>
                      <span className="mt-0.5 text-[10px] text-slate-400">
                        {ord.poDate}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-800">
                    <div>
                      <span className="block font-semibold text-slate-900">
                        {ord.wholesalerName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {ord.contactPerson || ord.phone || ord.wholesalerCode || "Licensed Wholesaler"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="max-w-[240px] py-3 text-xs text-slate-700">
                    {ord.items && ord.items.length > 0 ? (
                      <div className="flex flex-col">
                        <span className="block font-semibold text-slate-900 truncate" title={ord.items[0].drugName}>
                          {ord.items[0].drugName}
                        </span>
                        {ord.items.length > 1 ? (
                          <span
                            className="text-[10px] text-[#0090FF] font-medium truncate mt-0.5"
                            title={ord.items.slice(1).map((i) => i.drugName).join(", ")}
                          >
                            +{ord.items.length - 1} more: {ord.items.slice(1).map((i) => i.drugName).join(", ")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 truncate mt-0.5">
                            {ord.items[0].genericName ? `${ord.items[0].genericName} • ` : ""}{ord.items[0].packSize || `${ord.items[0].quantityOrdered} units`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No products</span>
                    )}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="max-w-[150px] truncate font-medium text-slate-800">
                        {ord.deliveryWarehouse.replace("Main Distribution Bay - ", "")}
                      </span>
                    </div>
                    {ord.expectedDeliveryDate && (
                      <span className="text-[10px] text-slate-400 block">
                        Exp: {ord.expectedDeliveryDate}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="py-3 text-center font-mono text-xs font-medium text-slate-700">
                    {ord.totalUnits.toLocaleString()}
                  </TableCell>

                  <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-900">
                    <div>
                      <span>৳{ord.totalAmountBDT.toLocaleString("en-IN")}</span>
                      <span className="block text-[10px] font-normal text-slate-400">
                        {ord.paymentStatus && ord.paymentStatus !== "UNPAID"
                          ? `${ord.paymentStatus.replace("_", " ")} · ৳${(ord.paidAmountBDT || 0).toLocaleString("en-IN")}`
                          : ord.paymentTerms || "Net 30"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-center text-xs">
                    <Badge
                      variant="outline"
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        ord.priority === "Emergency Cold-Chain"
                          ? "border-sky-200 bg-sky-50 text-sky-700"
                          : ord.priority === "Urgent / Stockout Risk"
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {ord.priority === "Emergency Cold-Chain"
                        ? "Cold-Chain"
                        : ord.priority === "Urgent / Stockout Risk"
                          ? "Urgent"
                          : "Routine"}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3 text-xs">
                    <Badge
                      variant="outline"
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        ord.status === "Approved"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : ord.status === "Received"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : ord.status === "Partially Received"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : ord.status === "Submitted"
                                ? "border-purple-200 bg-purple-50 text-purple-700"
                                : ord.status === "Cancelled"
                                  ? "border-rose-200 bg-rose-50 text-rose-700"
                                  : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {ord.status === "Received" ? "Delivered & Invoiced" : ord.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3 pr-0 text-right text-xs" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-white">
                        <DropdownMenuLabel className="text-[10px] tracking-wider text-slate-400 uppercase">
                          Workflow Transitions
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleOpenDetailsModal(ord)}
                          className="cursor-pointer text-xs font-semibold text-slate-700"
                        >
                          <Eye className="mr-2 h-3.5 w-3.5 text-slate-500" />
                          Inspect Details
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleOpenVoucherModal(ord)}
                          className="cursor-pointer text-xs font-semibold text-blue-600"
                        >
                          <Printer className="mr-2 h-3.5 w-3.5 text-blue-600" />
                          View & Print Voucher
                        </DropdownMenuItem>

                        {ord.status === "Draft" && (
                          <DropdownMenuItem
                            onClick={() => handleSubmitForApproval(ord)}
                            className="cursor-pointer text-xs font-semibold text-purple-600"
                          >
                            <Send className="mr-2 h-3.5 w-3.5 text-purple-600" />
                            Submit for Review
                          </DropdownMenuItem>
                        )}

                        {ord.status !== "Approved" && ord.status !== "Received" && ord.status !== "Cancelled" && (
                          <DropdownMenuItem
                            onClick={() => handleOpenApprovalModal(ord)}
                            className="cursor-pointer text-xs font-semibold text-purple-700"
                          >
                            <ShieldCheck className="mr-2 h-3.5 w-3.5 text-purple-600" />
                            Authorize PO
                          </DropdownMenuItem>
                        )}

                        {(ord.status === "Approved" || ord.status === "Partially Received") && (
                          <DropdownMenuItem
                            onClick={() => handleOpenReceiveModal(ord)}
                            className="cursor-pointer text-xs font-semibold text-emerald-700"
                          >
                            <PackageCheck className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                            Dock Intake & Receive
                          </DropdownMenuItem>
                        )}

                        {ord.status !== "Cancelled" && ord.status !== "Draft" && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/finance/supplier-payments?poId=${ord.id}`)}
                            className="cursor-pointer text-xs font-semibold text-blue-700"
                          >
                            <CreditCard className="mr-2 h-3.5 w-3.5 text-blue-600" />
                            Pay Supplier
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => handleDuplicateOrder(ord)}
                          className="cursor-pointer text-xs text-slate-700"
                        >
                          <Copy className="mr-2 h-3.5 w-3.5 text-slate-500" />
                          Duplicate / Reorder
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {ord.status !== "Cancelled" && ord.status !== "Received" && (
                          <DropdownMenuItem
                            onClick={() => handleOpenCancelModal(ord)}
                            className="cursor-pointer text-xs font-semibold text-amber-700"
                          >
                            <XCircle className="mr-2 h-3.5 w-3.5 text-amber-600" />
                            Cancel Order
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => handleOpenEditModal(ord)}
                          className="cursor-pointer text-xs text-slate-700"
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5 text-slate-500" />
                          Edit Order
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleDeleteOrder(ord)}
                          className="cursor-pointer text-xs font-semibold text-rose-600 focus:text-rose-600"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5 text-rose-600" />
                          Delete Order
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

      {/* ─────────────────────────────────────────────
          MODAL 1: Create / Edit Purchase Order Dialog
      ───────────────────────────────────────────── */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="w-full sm:max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0090FF]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  {editingOrder ? `Edit Purchase Order (${editingOrder.poNumber})` : "Book New Purchase Order & Intake"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Select licensed wholesaler, specify formulations from catalog, and dispatch sequential purchase order.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmitOrder} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {/* Wholesaler Select */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Wholesaler / Distributor *</Label>
                <Select value={selectedOrderWholesalerId} onValueChange={handleWholesalerSelect}>
                  <SelectTrigger className="h-8 border-slate-200 bg-white text-xs">
                    <SelectValue placeholder="Select licensed wholesaler" />
                  </SelectTrigger>
                  <SelectContent className="text-xs max-h-56">
                    {wholesalers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.wholesalerCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Warehouse */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Delivery Warehouse Bay *</Label>
                <Select
                  value={formData.deliveryWarehouse}
                  onValueChange={(val) => setFormData((p) => ({ ...p, deliveryWarehouse: val }))}
                >
                  <SelectTrigger className="h-8 border-slate-200 bg-white text-xs">
                    <SelectValue placeholder="Select warehouse bay" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {DEFAULT_WAREHOUSES.map((wh) => (
                      <SelectItem key={wh} value={wh}>
                        {wh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Priority Level *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val: any) => setFormData((p) => ({ ...p, priority: val }))}
                >
                  <SelectTrigger className="h-8 border-slate-200 bg-white text-xs">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Routine">Routine</SelectItem>
                    <SelectItem value="Urgent / Stockout Risk">Urgent / Stockout Risk</SelectItem>
                    <SelectItem value="Emergency Cold-Chain">Emergency Cold-Chain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Terms */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Payment Terms</Label>
                <Select
                  value={formData.paymentTerms}
                  onValueChange={(val) => setFormData((p) => ({ ...p, paymentTerms: val }))}
                >
                  <SelectTrigger className="h-8 border-slate-200 bg-white text-xs">
                    <SelectValue placeholder="Payment Terms" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {PAYMENT_TERMS_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Expected Delivery Date */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => setFormData((p) => ({ ...p, expectedDeliveryDate: e.target.value }))}
                  className="h-8 border-slate-200 bg-white text-xs"
                />
              </div>

              {/* Requisition Ref */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Requisition / Memo Ref</Label>
                <Input
                  value={formData.requisitionRef}
                  onChange={(e) => setFormData((p) => ({ ...p, requisitionRef: e.target.value }))}
                  placeholder="e.g. REQ-2026-109"
                  className="h-8 border-slate-200 bg-white text-xs"
                />
              </div>
            </div>

            {/* Line Items Section */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-slate-800">
                    Line Items & Ordered Products
                  </Label>
                  <p className="text-[10px] text-slate-400">Specify ordered product names, pack sizes, quantities, and storage parameters.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItemRow}
                  className="h-7 gap-1 border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-3.5 w-3.5 text-[#0090FF]" />
                  Add Product Row
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[700px] text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="w-8 py-2 text-center text-[10px] font-bold">#</th>
                      <th className="py-2 text-left text-[10px] font-bold">Product Name (e.g. Napa) *</th>
                      <th className="w-28 py-2 text-left text-[10px] font-bold">Pack Size</th>
                      <th className="w-32 py-2 text-left text-[10px] font-bold">Storage Temp</th>
                      <th className="w-20 py-2 text-right text-[10px] font-bold">Quantity *</th>
                      <th className="w-24 py-2 text-right text-[10px] font-bold">Cost (৳) *</th>
                      <th className="w-24 py-2 text-right text-[10px] font-bold">Total (৳)</th>
                      <th className="w-8 py-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="text-center font-mono text-[10px] text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-1.5">
                          <Input
                            placeholder="Product name (e.g. Napa 500mg, Seclo 20mg)..."
                            value={item.drugName}
                            onChange={(e) => handleItemChange(idx, "drugName", e.target.value)}
                            className="h-7 border-slate-200 bg-white text-xs font-semibold"
                            required
                          />
                        </td>
                        <td className="p-1.5">
                          <Input
                            placeholder="e.g. Box of 100"
                            value={item.packSize || ""}
                            onChange={(e) => handleItemChange(idx, "packSize", e.target.value)}
                            className="h-7 border-slate-200 bg-white text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <Select
                            value={item.storageRequirement || "Controlled Ambient (<25°C)"}
                            onValueChange={(val) => handleItemChange(idx, "storageRequirement", val)}
                          >
                            <SelectTrigger className="h-7 border-slate-200 bg-white text-[11px]">
                              <SelectValue placeholder="Storage" />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                              <SelectItem value="Controlled Ambient (<25°C)">Ambient (&lt;25°C)</SelectItem>
                              <SelectItem value="Cold Chain (2-8°C)">Cold Chain (2-8°C)</SelectItem>
                              <SelectItem value="Deep Freeze (-20°C)">Deep Freeze (-20°C)</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-1.5">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantityOrdered}
                            onChange={(e) => handleItemChange(idx, "quantityOrdered", e.target.value)}
                            className="h-7 border-slate-200 bg-white text-right font-mono text-xs font-semibold"
                            required
                          />
                        </td>
                        <td className="p-1.5">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCostBDT}
                            onChange={(e) => handleItemChange(idx, "unitCostBDT", e.target.value)}
                            className="h-7 border-slate-200 bg-white text-right font-mono text-xs"
                            required
                          />
                        </td>
                        <td className="p-1.5 text-right font-mono text-xs font-bold text-slate-800">
                          ৳{item.totalCostBDT.toLocaleString("en-IN")}
                        </td>
                        <td className="p-1.5 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItemRow(idx)}
                            disabled={formData.items.length === 1}
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

            {/* Financial Summary & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Procurement Notes / Handling Directives</Label>
                <Input
                  placeholder="Special storage requirements or logistics instructions..."
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  className="h-8 border-slate-200 bg-white text-xs"
                />
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 text-xs">
                <div className="flex border-b border-slate-100 p-2 justify-between">
                  <span className="font-medium text-slate-600">Subtotal ({formData.items.length} items)</span>
                  <span className="font-mono font-bold text-slate-900">৳{formSubtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 p-2">
                  <span className="font-medium text-slate-600">Trade Discount (৳)</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discountBDT}
                    onChange={(e) => setFormData((p) => ({ ...p, discountBDT: Number(e.target.value) || 0 }))}
                    className="h-6 w-24 text-right font-mono text-xs border-slate-200"
                  />
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 p-2">
                  <span className="font-medium text-slate-600">Tax / VAT (৳)</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.taxBDT}
                    onChange={(e) => setFormData((p) => ({ ...p, taxBDT: Number(e.target.value) || 0 }))}
                    className="h-6 w-24 text-right font-mono text-xs border-slate-200"
                  />
                </div>
                <div className="flex bg-slate-50 p-2 justify-between items-center">
                  <span className="font-bold text-slate-900 uppercase">Grand Total</span>
                  <span className="font-mono text-sm font-extrabold text-[#0090FF]">
                    ৳{formGrandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOrderModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingOrder}
                className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
              >
                {isSavingOrder ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
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
        <DialogContent className="w-full sm:max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 pt-1">
              Statutory Multi-Tier Approval
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Digital authorization under multi-tier procurement guidelines.
            </DialogDescription>
          </DialogHeader>

          {approvingOrder && (
            <div className="space-y-3 pt-2">
              <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">PO Number:</span>
                  <span className="font-mono font-bold text-purple-900">{approvingOrder.poNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wholesaler:</span>
                  <span className="font-semibold text-slate-800">{approvingOrder.wholesalerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Commercial Valuation:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ৳{approvingOrder.totalAmountBDT.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Units:</span>
                  <span className="font-mono font-semibold text-slate-800">{approvingOrder.totalUnits} units</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Authorizing Official</Label>
                <Input
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="e.g. Mahbubur Rashid (Procurement Director)"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Statutory Authorization Note</Label>
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

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApprovalModalOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmApproval}
              disabled={isApproving}
              className="h-8 bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white"
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
        <DialogContent className="w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
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
                  <p className="font-mono font-bold text-slate-900">{receivingOrder.poNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500">Supplier / Wholesaler:</span>
                  <p className="font-semibold text-slate-800">{receivingOrder.wholesalerName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Delivery Challan / Gate Pass #</Label>
                  <Input
                    value={receiveChallan}
                    onChange={(e) => setReceiveChallan(e.target.value)}
                    placeholder="e.g. DC-2026-4091"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Receiving Note</Label>
                  <Input
                    value={receiveNotes}
                    onChange={(e) => setReceiveNotes(e.target.value)}
                    placeholder="Visual inspection passed, temperature logged"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Items Intake Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Received Consignments Specification</Label>
                    <p className="text-[10px] text-slate-400">Specify batch numbers, expiry dates, and intake quantities.</p>
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
                <div className="rounded-xl border border-slate-200 overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="text-xs font-bold">Product Name</TableHead>
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
                            <span className="block text-[10px] text-slate-400">{item.storageCondition}</span>
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-slate-600">
                            {item.quantityOrdered}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-emerald-600 font-semibold">
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
                              className="h-7 w-20 text-right font-mono text-xs font-bold text-emerald-700 ml-auto"
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
                              className="h-7 text-xs font-mono font-semibold"
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
                              className="h-7 text-xs"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitReceiveStock}
                  disabled={isReceivingStock}
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white"
                >
                  {isReceivingStock ? "Processing Intake..." : "Confirm Dock Intake & Credit Stock"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────
          MODAL 4: Official Printable Purchase Order Voucher
      ───────────────────────────────────────────── */}
      <Dialog open={isVoucherModalOpen} onOpenChange={setIsVoucherModalOpen}>
        <DialogContent className="w-full sm:max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 print:p-0 shadow-2xl">
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-black" />
                  Official Purchase Order
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Commercial Purchase Order #{voucherOrder?.poNumber} ({voucherOrder?.wholesalerName})
                </DialogDescription>
              </div>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="h-8 gap-1.5 bg-black hover:bg-neutral-800 text-xs font-semibold text-white"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Order
              </Button>
            </div>
          </DialogHeader>

          {voucherOrder && (
            <div className="space-y-6 pt-2">
              <div id="print-standalone-voucher">
                <PurchaseOrderSheet order={voucherOrder} />
              </div>

              <div className="flex justify-end gap-2 pb-2 print:hidden pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="gap-1.5 bg-black hover:bg-neutral-800 text-xs font-semibold text-white"
                >
                  <Printer className="h-4 w-4" /> Print Purchase Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────
          MODAL 5: Wholesalers Directory Modal
      ───────────────────────────────────────────── */}
      <Dialog open={isWholesalersModalOpen} onOpenChange={setIsWholesalersModalOpen}>
        <DialogContent className="w-full sm:max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
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
                className="h-8 gap-1 bg-[#0090FF] hover:bg-[#0080e5] text-xs font-semibold text-white self-start sm:self-auto"
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
                  <span className="h-2 w-2 rounded-full bg-[#0090FF]" />
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
                  <Label className="text-xs font-medium text-slate-700">Wholesaler / Distributor Name *</Label>
                  <Input
                    value={newWholesalerForm.name}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Beximco Pharma Distribution"
                    className="h-8 text-xs bg-white font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Wholesaler Code</Label>
                  <Input
                    value={newWholesalerForm.wholesalerCode}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, wholesalerCode: e.target.value }))}
                    placeholder="e.g. WHL-BEX-02"
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Contact Person *</Label>
                  <Input
                    value={newWholesalerForm.contactPerson}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, contactPerson: e.target.value }))}
                    placeholder="e.g. Kazi Rafiqul Islam (Depot Lead)"
                    className="h-8 text-xs bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Phone Number *</Label>
                  <Input
                    value={newWholesalerForm.phone}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+880 1711-000000"
                    className="h-8 text-xs bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Email Address</Label>
                  <Input
                    type="email"
                    value={newWholesalerForm.email}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="depot.orders@supplier.com"
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">DGDA Drug License # *</Label>
                  <Input
                    value={newWholesalerForm.drugLicenseNo}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, drugLicenseNo: e.target.value }))}
                    placeholder="DA-DL-2023-XXXX"
                    className="h-8 text-xs bg-white font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Trade License #</Label>
                  <Input
                    value={newWholesalerForm.tradeLicense}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, tradeLicense: e.target.value }))}
                    placeholder="TRAD-DNCC-XXXXXX"
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Commercial Territory</Label>
                  <Select
                    value={newWholesalerForm.territory}
                    onValueChange={(val) => setNewWholesalerForm((p) => ({ ...p, territory: val }))}
                  >
                    <SelectTrigger className="h-8 border-slate-200 bg-white text-xs">
                      <SelectValue placeholder="Territory" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Dhaka Central">Dhaka Central</SelectItem>
                      <SelectItem value="Dhaka North">Dhaka North</SelectItem>
                      <SelectItem value="Dhaka South">Dhaka South</SelectItem>
                      <SelectItem value="Dhaka Suburb">Dhaka Suburb / Savar</SelectItem>
                      <SelectItem value="Dhaka West">Dhaka West / Mirpur</SelectItem>
                      <SelectItem value="Chittagong Metro">Chittagong Metro</SelectItem>
                      <SelectItem value="Sylhet Division">Sylhet Division</SelectItem>
                      <SelectItem value="Rajshahi Division">Rajshahi Division</SelectItem>
                      <SelectItem value="Khulna Division">Khulna Division</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Default Payment Terms</Label>
                  <Select
                    value={newWholesalerForm.paymentTerms}
                    onValueChange={(val) => setNewWholesalerForm((p) => ({ ...p, paymentTerms: val }))}
                  >
                    <SelectTrigger className="h-8 border-slate-200 bg-white text-xs">
                      <SelectValue placeholder="Payment Terms" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {PAYMENT_TERMS_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Lead Time (Days)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={newWholesalerForm.leadTimeDays}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, leadTimeDays: Number(e.target.value) || 1 }))}
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Vendor Rating (1.0 - 5.0)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={newWholesalerForm.rating}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, rating: Number(e.target.value) || 5.0 }))}
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">Compliance Status</Label>
                  <Select
                    value={newWholesalerForm.status}
                    onValueChange={(val: any) => setNewWholesalerForm((p) => ({ ...p, status: val }))}
                  >
                    <SelectTrigger className="h-8 border-slate-200 bg-white text-xs">
                      <SelectValue placeholder="Compliance Status" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Active">Active (Approved)</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="Blacklisted">Blacklisted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-medium text-slate-700">Physical Depot / Warehouse Address *</Label>
                  <Input
                    value={newWholesalerForm.address}
                    onChange={(e) => setNewWholesalerForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Plot 48, Tejgaon Industrial Area, Dhaka 1208"
                    className="h-8 text-xs bg-white"
                    required
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-xs font-medium text-slate-700">Supplied Categories</Label>
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
                  className="h-8 bg-[#0090FF] hover:bg-[#0080e5] text-xs font-semibold text-white"
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
                className="h-8 pl-9 text-xs border-slate-200 bg-slate-50/50"
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
              <Select value={wholesalerStatusFilter} onValueChange={setWholesalerStatusFilter}>
                <SelectTrigger className="h-8 w-[170px] border-slate-200 bg-white text-xs">
                  <SelectValue placeholder="All Vendor Statuses" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="all">All Vendor Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Blacklisted">Blacklisted</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {filteredWholesalers.length} of {wholesalers.length}
              </span>
            </div>
          </div>

          {/* Wholesalers Table */}
          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <Table className="min-w-[900px]">
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
                      <TableCell className="font-bold text-xs text-[#0090FF] font-mono">
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
                            <span className="text-[10px] text-slate-500">{w.territory || "Dhaka Central"}</span>
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
                        <span className="font-mono font-medium text-slate-900">{w.leadTimeDays || 3} Days</span>
                        <span className="block text-[10px] text-slate-400">{w.paymentTerms || "Net 30"}</span>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold rounded-md ${
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
        <DialogContent className="w-full sm:max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          {detailsOrder && (
            <div className="space-y-5">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0090FF]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-mono font-bold text-slate-900">{detailsOrder.poNumber}</h2>
                      <Badge
                        variant="outline"
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          detailsOrder.priority === "Emergency Cold-Chain"
                            ? "border-sky-200 bg-sky-50 text-sky-700"
                            : detailsOrder.priority === "Urgent / Stockout Risk"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        {detailsOrder.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Issued on {detailsOrder.poDate} • Requisition Ref: {detailsOrder.requisitionRef || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      detailsOrder.status === "Approved"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : detailsOrder.status === "Received"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : detailsOrder.status === "Partially Received"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : detailsOrder.status === "Submitted"
                              ? "border-purple-200 bg-purple-50 text-purple-700"
                              : detailsOrder.status === "Cancelled"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {detailsOrder.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsDetailsModalOpen(false)
                      handleOpenVoucherModal(detailsOrder)
                    }}
                    className="h-8 gap-1.5 text-xs text-[#0090FF] border-slate-200 hover:bg-blue-50"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Voucher
                  </Button>
                </div>
              </div>

              {/* Stepper Progress Bar */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/75 p-3.5">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2.5">
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
                    <span className="text-[10px] text-slate-500 block mt-0.5">Order Prepared</span>
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
                    <span className="text-[10px] text-slate-500 block mt-0.5">
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
                    <span className="text-[10px] text-slate-500 block mt-0.5">
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
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {detailsOrder.status === "Received"
                        ? "100% Fulfilled & Batched"
                        : detailsOrder.status === "Partially Received"
                        ? "Partial Intake Synced"
                        : "Awaiting Arrival"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vendor & Logistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vendor Details */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
                    <Building2 className="h-4 w-4 text-[#0090FF]" />
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
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Vendor Code: {detailsOrder.wholesalerCode || "N/A"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Logistics & Delivery Destination */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
                    <Truck className="h-4 w-4 text-[#0090FF]" />
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
                    Line Items & Fulfillment Status ({detailsOrder.items?.length || 0} Products)
                  </h4>
                  <span className="font-mono text-xs text-slate-500">
                    Total: {detailsOrder.totalUnits.toLocaleString()} Units
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-x-auto">
                  <Table className="min-w-[780px]">
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="w-10 text-center text-xs font-bold">#</TableHead>
                        <TableHead className="text-xs font-bold">Product Name</TableHead>
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
                            <TableCell className="text-center font-mono text-xs text-slate-500 font-bold">
                              {idx + 1}
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs text-slate-900">{it.drugName}</span>
                                {it.genericName && (
                                  <span className="text-[10px] text-slate-500">{it.genericName}</span>
                                )}
                                {it.skuCode && (
                                  <span className="text-[9px] text-[#0090FF] font-mono mt-0.5">{it.skuCode}</span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-xs text-slate-600">
                              {it.packSize || "Standard"}
                            </TableCell>

                            <TableCell>
                              {isCold ? (
                                <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] flex items-center gap-1 font-semibold">
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
                                <div className="flex justify-between text-[11px] font-mono font-medium">
                                  <span className="text-slate-800">{rec.toLocaleString()} / {it.quantityOrdered.toLocaleString()}</span>
                                  <span className={pct >= 100 ? "text-emerald-600 font-bold" : pct > 0 ? "text-amber-600 font-bold" : "text-slate-400"}>
                                    {pct}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
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

                            <TableCell className="text-right font-mono text-xs text-slate-700 font-medium">
                              ৳{it.unitCostBDT.toLocaleString("en-IN")}
                            </TableCell>

                            <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                              ৳{it.totalCostBDT.toLocaleString("en-IN")}
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
                    <span className="font-mono font-semibold text-slate-800">
                      ৳{detailsOrder.subtotalBDT.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {detailsOrder.discountBDT > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Trade Discount:</span>
                      <span className="font-mono font-semibold text-rose-600">
                        - ৳{detailsOrder.discountBDT.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {detailsOrder.taxBDT > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>VAT / Statutory Tax:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        + ৳{detailsOrder.taxBDT.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-extrabold text-slate-900">
                    <span>Net Total Payable:</span>
                    <span className="font-mono text-[#0090FF]">
                      ৳{detailsOrder.totalAmountBDT.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statutory Audit & Notes Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  <span>Statutory Procurement Audit Log</span>
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
              <DialogFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
                <div className="flex flex-wrap items-center gap-2">
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

                <div className="flex flex-wrap items-center gap-2">
                  {detailsOrder.status === "Draft" && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSubmitForApproval(detailsOrder)}
                      className="h-8 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-xs font-semibold text-white"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Submit for Approval
                    </Button>
                  )}

                  {detailsOrder.status === "Submitted" && (
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

                  {detailsOrder.status !== "Cancelled" && detailsOrder.status !== "Draft" && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setIsDetailsModalOpen(false)
                        router.push(`/finance/supplier-payments?poId=${detailsOrder.id}`)
                      }}
                      className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Pay Supplier
                    </Button>
                  )}

                  {detailsOrder.status !== "Cancelled" && detailsOrder.status !== "Received" && (
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
                  )}

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
        <DialogContent className="w-full sm:max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <XCircle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 pt-1">
              Cancel Purchase Order
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {cancellingOrder ? (
                <>
                  Voiding Purchase Order <strong className="text-slate-800">{cancellingOrder.poNumber}</strong> ({cancellingOrder.wholesalerName}).
                  This action is logged in the statutory audit register.
                </>
              ) : (
                "Provide cancellation justification."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">Cancellation Reason *</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Commercial procurement cancelled due to supplier lead time breach..."
                rows={3}
                className="text-xs"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
              className="h-8 text-xs"
            >
              Keep Order Active
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmCancel}
              disabled={isCancelling || !cancelReason.trim()}
              className="h-8 bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white"
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────
          MODAL 10: Disburse Payment (Finance & Treasury)
      ───────────────────────────────────────────── */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="w-full sm:max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 pt-1">
              Disburse Payment to Wholesaler
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Post an official disbursement voucher. Financial account balances and journal outflow will be synchronized immediately in Finance & Treasury.
            </DialogDescription>
          </DialogHeader>

          {payingOrder && (
            <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Purchase Order:</span>
                  <span className="font-mono font-bold text-slate-900">{payingOrder.poNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wholesaler:</span>
                  <span className="font-semibold text-slate-900">{payingOrder.wholesalerName}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span className="text-slate-500">Total Valuation:</span>
                  <span className="font-bold text-blue-700">৳{payingOrder.totalAmountBDT.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Funding Source</Label>
                  <Select
                    value={paymentForm.fundingSource}
                    onValueChange={(val: "Bank Account" | "Cash Safe") => {
                      const matched = financialAccounts.find((a) =>
                        val === "Cash Safe" ? a.category === "CASH" : a.category === "BANK"
                      )
                      setPaymentForm({
                        ...paymentForm,
                        fundingSource: val,
                        financialAccountId: matched?.id || "",
                        sourceDetail: matched?.accountTitle || "",
                        paymentMethod: val === "Cash Safe" ? "Cash" : "BEFTN / RTGS",
                      })
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select funding source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Account">Bank Account</SelectItem>
                      <SelectItem value="Cash Safe">Cash Safe / Counter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Treasury Account</Label>
                  <Select
                    value={paymentForm.financialAccountId}
                    onValueChange={(val) => {
                      const acc = financialAccounts.find((a) => a.id === val)
                      setPaymentForm({
                        ...paymentForm,
                        financialAccountId: val,
                        sourceDetail: acc?.accountTitle || "",
                      })
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {financialAccounts
                        .filter((a) =>
                          paymentForm.fundingSource === "Cash Safe"
                            ? a.category === "CASH"
                            : a.category === "BANK"
                        )
                        .map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.accountTitle} (৳{acc.balance.toLocaleString("en-IN")})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Payment Method</Label>
                  <Select
                    value={paymentForm.paymentMethod}
                    onValueChange={(val) => setPaymentForm({ ...paymentForm, paymentMethod: val })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEFTN / RTGS">BEFTN / RTGS</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Cash">Cash Handover</SelectItem>
                      <SelectItem value="Pay Order">Bank Pay Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Cheque / Trx No.</Label>
                  <Input
                    value={paymentForm.chequeNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, chequeNumber: e.target.value })}
                    placeholder="e.g. EBL-FT-99120"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Payment Amount (BDT)</Label>
                  <Input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="h-8 text-xs font-bold text-slate-900"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">Payment Date</Label>
                  <Input
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="h-8 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">Disbursement Notes</Label>
                <Input
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Optional notes or consignment voucher memo"
                  className="h-8 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isDisbursingPayment || !paymentForm.amount}
                  className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  {isDisbursingPayment ? "Disbursing..." : `Confirm Payment (৳${Number(paymentForm.amount).toLocaleString("en-IN")})`}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
