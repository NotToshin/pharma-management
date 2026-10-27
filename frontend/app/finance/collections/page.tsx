"use client"

import * as React from "react"
import { API_URL, apiFetch } from "@/lib/api"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
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
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import {
  Search,
  Filter,
  Download,
  UserCheck,
  Wallet,
  CheckCircle2,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Printer,
  Receipt,
  Landmark,
  Clock,
  AlertCircle,
  Building2,
  Layers,
  ShieldCheck,
  CheckSquare,
  Square,
  XCircle,
  Banknote,
  FileText,
} from "lucide-react"

import { MoneyReceiptSheet } from "@/components/finance/money-receipt-sheet"

const PRINT_STYLES = `
@page { size: A4 portrait; margin: 10mm; }
@media print {
  html, body { height: auto !important; overflow: visible !important; background: #ffffff !important; }
  body * { visibility: hidden !important; }
  #print-standalone-money-receipt, #print-standalone-money-receipt * { visibility: visible !important; }
  #print-standalone-money-receipt {
    position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; background: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .print\\:hidden, button { display: none !important; }
}
`

export interface DeliveryCollection {
  id: string
  receiptNo: string
  invoiceNo: string
  orderId?: string | null
  clientCode?: string | null
  chemistName: string
  territory: string
  salesRepName: string
  totalInvoiceAmount: number
  amountCollected: number
  dueAmountRemaining: number
  collectionDate: string
  paymentMethod: "Cash" | "Cheque" | "BEFTN / RTGS" | "bKash / Nagad"
  chequeNumber?: string | null
  status: "Pending Vault Clearance" | "Cleared & Deposited" | "Bounced / Rejected"
  destinationType?: "Cash Drawer" | "Bank Account" | null
  destinationName?: string | null
  financialAccountId?: string | null
  clearedBy?: string | null
  clearedAt?: string | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CollectionMetrics {
  totalReceipts: number
  totalRealizedBDT: number
  totalPendingClearanceBDT: number
  totalInvoicedBDT: number
  outstandingDueBDT: number
  realizedCount: number
  pendingCount: number
  territoryBreakdown: Array<{ territory: string; count: number; amount: number }>
  paymentMethodBreakdown: Array<{ method: string; count: number; amount: number }>
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

export interface DeliveredOrder {
  id: string
  orderNumber: string
  invoiceNumber?: string | null
  pharmacyName: string
  territory: string
  assignedMio: string
  orderValue: number
  status: string
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
        " Lac" +
        (n % 100000 !== 0 ? " " + inWords(n % 100000) : "")
      )
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "")
    )
  }

  return inWords(Math.floor(num)).trim() + " Taka Only"
}

export default function DeliveryCashCollectionsPage() {
  const [collections, setCollections] = React.useState<DeliveryCollection[]>([])
  const [metrics, setMetrics] = React.useState<CollectionMetrics | null>(null)
  const [accounts, setAccounts] = React.useState<FinancialAccount[]>([])
  const [deliveredOrders, setDeliveredOrders] = React.useState<DeliveredOrder[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Filters & Tabs
  const [activeTab, setActiveTab] = React.useState<"all" | "pending" | "cleared" | "cash" | "cheque" | "bank">("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [territoryFilter, setTerritoryFilter] = React.useState("all")
  const [methodFilter, setMethodFilter] = React.useState("all")

  // Multi-Selection State for Batch Vault Settlement
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeTab, statusFilter, territoryFilter, methodFilter])

  // Modals
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [isSubmittingForm, setIsSubmittingForm] = React.useState(false)

  // Create / Edit Form State
  const [formData, setFormData] = React.useState({
    receiptNo: "",
    invoiceNo: "",
    orderId: "",
    chemistName: "",
    territory: "Dhaka North",
    salesRepName: "",
    totalInvoiceAmount: 0,
    amountCollected: 0,
    dueAmountRemaining: 0,
    collectionDate: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    paymentMethod: "Cash" as "Cash" | "Cheque" | "BEFTN / RTGS" | "bKash / Nagad",
    chequeNumber: "",
    status: "Pending Vault Clearance" as "Pending Vault Clearance" | "Cleared & Deposited",
    destinationType: "Cash Drawer" as "Cash Drawer" | "Bank Account",
    destinationName: "Head Office Cash Safe",
    financialAccountId: "",
    notes: "",
  })

  // Bulk Settlement Modal State
  const [isSettlementOpen, setIsSettlementOpen] = React.useState(false)
  const [settlementType, setSettlementType] = React.useState<"Cash Drawer" | "Bank Account">("Cash Drawer")
  const [settlementAccountId, setSettlementAccountId] = React.useState("")
  const [settlementDestinationName, setSettlementDestinationName] = React.useState("Head Office Cash Safe")
  const [isSettling, setIsSettling] = React.useState(false)

  // Print Preview Modal
  const [printTarget, setPrintTarget] = React.useState<DeliveryCollection | null>(null)
  const [isPrintOpen, setIsPrintOpen] = React.useState(false)

  // Delete Confirmation Modal
  const [collectionToDelete, setCollectionToDelete] = React.useState<DeliveryCollection | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Load live data from database
  const loadData = React.useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const [colRes, metRes, accRes, ordRes] = await Promise.all([
        apiFetch("/collections?limit=all"),
        apiFetch("/collections/metrics"),
        apiFetch("/account-ledger/accounts"),
        apiFetch("/orders"),
      ])

      if (colRes.ok) {
        const json = await colRes.json()
        setCollections(json.data || [])
      }

      if (metRes.ok) {
        const json = await metRes.json()
        setMetrics(json.data || null)
      }

      if (accRes.ok) {
        const json = await accRes.json()
        setAccounts(json.data || [])
      }

      if (ordRes.ok) {
        const json = await ordRes.json()
        const raw = Array.isArray(json) ? json : json.data || []
        setDeliveredOrders(
          raw.filter((o: any) => o.status !== "Cancelled")
        )
      }
    } catch (err) {
      console.error("Error loading collections:", err)
      toast.error("Failed to load collection records from database.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Filtered collections
  const filteredCollections = React.useMemo(() => {
    return collections.filter((c) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim()
      if (q) {
        const matchReceipt = c.receiptNo.toLowerCase().includes(q)
        const matchInvoice = c.invoiceNo.toLowerCase().includes(q)
        const matchChemist = c.chemistName.toLowerCase().includes(q)
        const matchMio = c.salesRepName.toLowerCase().includes(q)
        const matchTerritory = c.territory.toLowerCase().includes(q)
        const matchCheque = (c.chequeNumber || "").toLowerCase().includes(q)
        const matchNotes = (c.notes || "").toLowerCase().includes(q)

        if (!matchReceipt && !matchInvoice && !matchChemist && !matchMio && !matchTerritory && !matchCheque && !matchNotes) {
          return false
        }
      }

      // 2. Tab Filter
      if (activeTab === "pending") {
        if (c.status !== "Pending Vault Clearance") return false
      } else if (activeTab === "cleared") {
        if (c.status !== "Cleared & Deposited") return false
      } else if (activeTab === "cash") {
        if (c.paymentMethod !== "Cash") return false
      } else if (activeTab === "cheque") {
        if (c.paymentMethod !== "Cheque") return false
      } else if (activeTab === "bank") {
        if (c.paymentMethod !== "BEFTN / RTGS" && c.paymentMethod !== "bKash / Nagad") return false
      }

      // 3. Dropdown Filters
      if (statusFilter !== "all" && c.status !== statusFilter) return false
      if (territoryFilter !== "all" && c.territory !== territoryFilter) return false
      if (methodFilter !== "all" && c.paymentMethod !== methodFilter) return false

      return true
    })
  }, [collections, searchQuery, activeTab, statusFilter, territoryFilter, methodFilter])

  // Pagination derived variables
  const totalItems = filteredCollections.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedCollections = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredCollections.slice(startIndex, startIndex + pageSize)
  }, [filteredCollections, currentPage, pageSize])

  // Selection helpers
  const pendingCollections = React.useMemo(() => {
    return filteredCollections.filter((c) => c.status === "Pending Vault Clearance")
  }, [filteredCollections])

  const isAllPendingSelected =
    pendingCollections.length > 0 &&
    pendingCollections.every((c) => selectedIds.includes(c.id))

  const handleToggleSelectAll = () => {
    if (isAllPendingSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(pendingCollections.map((c) => c.id))
    }
  }

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Selected Total Amount
  const selectedTotalBDT = React.useMemo(() => {
    return collections
      .filter((c) => selectedIds.includes(c.id))
      .reduce((sum, item) => sum + (item.amountCollected || 0), 0)
  }, [collections, selectedIds])

  // Open Create Modal
  const handleOpenCreate = async () => {
    setEditingId(null)
    let nextNum = "AKP-COL-2026-0001"

    try {
      const res = await apiFetch("/collections/next-number")
      if (res.ok) {
        const json = await res.json()
        nextNum = json.data?.nextReceiptNo || nextNum
      }
    } catch {
      nextNum = `AKP-COL-2026-${String(collections.length + 1).padStart(4, "0")}`
    }

    const defaultAcc = accounts.find((a) => a.category === "CASH") || accounts[0]

    setFormData({
      receiptNo: nextNum,
      invoiceNo: "",
      orderId: "",
      chemistName: "",
      territory: "Dhaka North",
      salesRepName: "",
      totalInvoiceAmount: 0,
      amountCollected: 0,
      dueAmountRemaining: 0,
      collectionDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      paymentMethod: "Cash",
      chequeNumber: "",
      status: "Pending Vault Clearance",
      destinationType: defaultAcc?.category === "BANK" ? "Bank Account" : "Cash Drawer",
      destinationName: defaultAcc?.accountTitle || "Head Office Cash Safe",
      financialAccountId: defaultAcc?.id || "",
      notes: "",
    })

    setIsCreateOpen(true)
  }

  // Auto-populate when picking a delivered order
  const handleSelectOrder = (orderId: string) => {
    const ord = deliveredOrders.find((o) => o.id === orderId)
    if (ord) {
      const val = Number(ord.orderValue) || 0
      setFormData((prev) => ({
        ...prev,
        orderId: ord.id,
        invoiceNo: ord.invoiceNumber || ord.orderNumber,
        chemistName: ord.pharmacyName,
        territory: ord.territory || "Dhaka North",
        salesRepName: ord.assignedMio || "General MIO",
        totalInvoiceAmount: val,
        amountCollected: val,
        dueAmountRemaining: 0,
        notes: `Delivery collection against order #${ord.orderNumber}.`,
      }))
    }
  }

  const handleOpenEdit = (c: DeliveryCollection) => {
    setEditingId(c.id)
    setFormData({
      receiptNo: c.receiptNo,
      invoiceNo: c.invoiceNo,
      orderId: c.orderId || "",
      chemistName: c.chemistName,
      territory: c.territory,
      salesRepName: c.salesRepName,
      totalInvoiceAmount: c.totalInvoiceAmount,
      amountCollected: c.amountCollected,
      dueAmountRemaining: c.dueAmountRemaining,
      collectionDate: c.collectionDate,
      paymentMethod: c.paymentMethod,
      chequeNumber: c.chequeNumber || "",
      status: c.status as any,
      destinationType: c.destinationType || "Cash Drawer",
      destinationName: c.destinationName || "Head Office Cash Safe",
      financialAccountId: c.financialAccountId || "",
      notes: c.notes || "",
    })
    setIsCreateOpen(true)
  }

  // Save / Update Collection Form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.chemistName.trim() || !formData.invoiceNo.trim()) {
      toast.error("Chemist name and invoice number are required.")
      return
    }

    if (formData.amountCollected <= 0) {
      toast.error("Valid positive collection amount is required.")
      return
    }

    setIsSubmittingForm(true)
    const toastId = toast.loading(
      editingId ? "Updating collection receipt..." : "Recording collection receipt..."
    )

    try {
      const payload = {
        receiptNo: formData.receiptNo,
        invoiceNo: formData.invoiceNo.trim(),
        orderId: formData.orderId || undefined,
        chemistName: formData.chemistName.trim(),
        territory: formData.territory.trim(),
        salesRepName: formData.salesRepName.trim(),
        totalInvoiceAmount: Number(formData.totalInvoiceAmount),
        amountCollected: Number(formData.amountCollected),
        dueAmountRemaining: Math.max(0, Number(formData.totalInvoiceAmount) - Number(formData.amountCollected)),
        collectionDate: formData.collectionDate,
        paymentMethod: formData.paymentMethod,
        chequeNumber: formData.chequeNumber ? formData.chequeNumber.trim() : undefined,
        status: formData.status,
        destinationType: formData.destinationType,
        destinationName: formData.destinationName,
        financialAccountId: formData.financialAccountId || undefined,
        notes: formData.notes,
      }

      const res = await apiFetch(editingId ? `/collections/${editingId}` : "/collections", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || "Failed to save collection receipt")
      }

      toast.success(
        editingId
          ? `Collection receipt ${formData.receiptNo} updated.`
          : `Collection receipt ${formData.receiptNo} logged into register.`,
        { id: toastId }
      )

      setIsCreateOpen(false)
      loadData(true)
    } catch (err: any) {
      console.error("Save error:", err)
      toast.error(err.message || "Failed to save collection receipt.", { id: toastId })
    } finally {
      setIsSubmittingForm(false)
    }
  }

  // Trigger Settle Dialog
  const handleOpenSettleModal = (singleCollectionId?: string) => {
    if (singleCollectionId) {
      setSelectedIds([singleCollectionId])
    } else if (selectedIds.length === 0) {
      // Settle all pending items if none checked
      const pendingIds = pendingCollections.map((c) => c.id)
      if (pendingIds.length === 0) {
        toast.error("No pending collections available to settle.")
        return
      }
      setSelectedIds(pendingIds)
    }

    const defaultAcc = accounts.find((a) => a.category === "CASH") || accounts[0]
    setSettlementType(defaultAcc?.category === "BANK" ? "Bank Account" : "Cash Drawer")
    setSettlementAccountId(defaultAcc?.id || "")
    setSettlementDestinationName(defaultAcc?.accountTitle || "Head Office Cash Safe")
    setIsSettlementOpen(true)
  }

  // Confirm and Execute Bulk Settle
  const handleConfirmSettlement = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedIds.length === 0) {
      toast.error("No collections selected for settlement.")
      return
    }

    setIsSettling(true)
    const toastId = toast.loading(
      `Clearing ${selectedIds.length} collection receipts into ${settlementDestinationName}...`
    )

    try {
      const res = await apiFetch("/collections/settle", {
        method: "POST",
        body: JSON.stringify({
          collectionIds: selectedIds,
          destinationType: settlementType,
          destinationName: settlementDestinationName,
          financialAccountId: settlementAccountId || undefined,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || "Settlement failed")
      }

      const json = await res.json()
      const totalAmount = json.data?.totalSettlementBDT || selectedTotalBDT

      toast.success(
        `Successfully cleared ৳${totalAmount.toLocaleString("en-IN")} into [${settlementType}] -> ${settlementDestinationName}.`,
        { id: toastId }
      )

      setIsSettlementOpen(false)
      setSelectedIds([])
      loadData(true)
    } catch (err: any) {
      console.error("Settlement error:", err)
      toast.error(err.message || "Settlement execution failed.", { id: toastId })
    } finally {
      setIsSettling(false)
    }
  }

  // Delete Receipt
  const handleOpenDelete = (c: DeliveryCollection) => {
    setCollectionToDelete(c)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!collectionToDelete) return
    setIsDeleting(true)
    const toastId = toast.loading(`Deleting collection receipt ${collectionToDelete.receiptNo}...`)

    try {
      const res = await apiFetch(`/collections/${collectionToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || "Failed to delete collection receipt")
      }

      toast.success(`Receipt ${collectionToDelete.receiptNo} deleted from ledger.`, { id: toastId })
      setIsDeleteModalOpen(false)
      setCollectionToDelete(null)
      loadData(true)
    } catch (err: any) {
      console.error("Delete error:", err)
      toast.error(err.message || "Failed to delete collection receipt.", { id: toastId })
    } finally {
      setIsDeleting(false)
    }
  }

  // Print voucher iframe trigger
  const handlePrint = (record: DeliveryCollection) => {
    const printFrame = document.createElement("iframe")
    printFrame.style.position = "fixed"
    printFrame.style.right = "0"
    printFrame.style.bottom = "0"
    printFrame.style.width = "0"
    printFrame.style.height = "0"
    printFrame.style.border = "0"
    document.body.appendChild(printFrame)

    const doc = printFrame.contentWindow?.document
    if (!doc) return

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CollectionReceipt_${record.receiptNo}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { margin: 0; padding: 0; color: #0f172a; background: #fff; font-size: 13px; line-height: 1.5; }
            .voucher-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 24px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; }
            .company-name { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px; }
            .sub-title { font-size: 11px; color: #64748b; margin-top: 2px; }
            .voucher-tag { text-align: right; }
            .tag-badge { display: inline-block; font-size: 11px; font-weight: 800; border: 1px solid #0f172a; padding: 2px 8px; text-transform: uppercase; }
            .voucher-num { font-family: monospace; font-weight: 700; color: #0090FF; margin-top: 4px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin-top: 16px; }
            .meta-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; }
            .meta-val { font-weight: 600; font-size: 13px; margin-top: 2px; }
            .particulars-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .particulars-table th { background: #f1f5f9; text-align: left; padding: 10px 12px; border: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; }
            .particulars-table td { padding: 12px; border: 1px solid #cbd5e1; font-size: 12px; }
            .amount-box { margin-top: 16px; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
            .signatures { margin-top: 60px; display: flex; justify-content: space-between; padding: 0 20px; }
            .sig-block { text-align: center; width: 180px; }
            .sig-line { border-top: 1px solid #475569; margin-bottom: 6px; }
            .sig-title { font-weight: 700; font-size: 11px; }
            .sig-sub { font-size: 10px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="voucher-box">
            <div class="header">
              <div>
                <div class="company-name">AK PHARMA MANAGEMENT</div>
                <div class="sub-title">Field Logistics Collection & Vault Deposit Slip</div>
                <div class="sub-title">Plot 14, Sector 7, Uttara Commercial Area, Dhaka • DGDA Lic: DL-PH-2026-88</div>
              </div>
              <div class="voucher-tag">
                <div class="tag-badge">Official Delivery Cash Receipt</div>
                <div class="voucher-num">${record.receiptNo}</div>
                <div class="sub-title" style="font-family: monospace;">Date: ${record.collectionDate}</div>
              </div>
            </div>

            <div class="meta-grid">
              <div>
                <div class="meta-label">Customer / Registered Chemist</div>
                <div class="meta-val">${record.chemistName}</div>
                <div class="meta-label" style="margin-top: 8px;">Territory & Invoice Ref</div>
                <div class="meta-val">${record.territory} • Invoice #${record.invoiceNo}</div>
              </div>
              <div>
                <div class="meta-label">Collection Channel / Destination</div>
                <div class="meta-val">${record.destinationName || "Head Office Cash Safe"} (${record.destinationType || "Cash Drawer"})</div>
                <div class="meta-label" style="margin-top: 8px;">Payment Instrument & Status</div>
                <div class="meta-val">${record.paymentMethod} ${record.chequeNumber ? `• Ref: ${record.chequeNumber}` : ""} • <strong style="color: ${record.status === "Cleared & Deposited" ? "#059669" : "#d97706"};">${record.status}</strong></div>
              </div>
            </div>

            <table class="particulars-table">
              <thead>
                <tr>
                  <th>Particulars / Description</th>
                  <th style="width: 140px; text-align: right;">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Logistics Delivery Payment from ${record.chemistName}</strong>
                    <div style="color: #475569; font-style: italic; margin-top: 4px;">
                      "${record.notes || "Official delivery collection receipt issued by field representative."}"
                    </div>
                  </td>
                  <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 14px;">
                    ৳${record.amountCollected.toLocaleString("en-IN")}/-
                  </td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Total Invoice Billing Value:</td>
                  <td style="text-align: right; font-family: monospace;">৳${record.totalInvoiceAmount.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Remaining Chemist Balance Due:</td>
                  <td style="text-align: right; font-family: monospace; color: #dc2626;">৳${record.dueAmountRemaining.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>

            <div class="amount-box">
              <span style="color: #64748b; font-size: 11px; font-weight: 600;">Collected Amount in Words:</span>
              <span style="font-weight: 700; font-style: italic;">${numberToWordsBDT(record.amountCollected)}</span>
            </div>

            <div class="signatures">
              <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-title">${record.salesRepName}</div>
                <div class="sig-sub">Field Representative (MIO)</div>
              </div>
              <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-title">${record.clearedBy || "Cashier & Vault Officer"}</div>
                <div class="sig-sub">Cashier / Treasury Verification</div>
              </div>
              <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-title">Finance Controller</div>
                <div class="sig-sub">Ledger Posting Authorization</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `)
    doc.close()

    setTimeout(() => {
      printFrame.contentWindow?.focus()
      printFrame.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(printFrame)
      }, 1000)
    }, 250)
  }

  // Export Excel
  const handleExportExcel = () => {
    const data = filteredCollections.map((c) => ({
      "Receipt #": c.receiptNo,
      "Invoice #": c.invoiceNo,
      "Chemist / Pharmacy": c.chemistName,
      Territory: c.territory,
      "MIO / Representative": c.salesRepName,
      "Invoice Amount (BDT)": c.totalInvoiceAmount,
      "Collected Amount (BDT)": c.amountCollected,
      "Due Balance (BDT)": c.dueAmountRemaining,
      "Payment Method": c.paymentMethod,
      "Cheque / Instrument #": c.chequeNumber || "N/A",
      Status: c.status,
      "Destination Safe / Bank": c.destinationName || "N/A",
      "Cleared By": c.clearedBy || "Pending",
      Notes: c.notes || "",
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Delivery Cash Collections")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Delivery_Collections_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
    toast.success("Collections ledger exported to Excel.")
  }

  const totalRealized = metrics?.totalRealizedBDT ?? collections
    .filter((c) => c.status === "Cleared & Deposited")
    .reduce((sum, item) => sum + (item.amountCollected || 0), 0)

  const totalPending = metrics?.totalPendingClearanceBDT ?? collections
    .filter((c) => c.status === "Pending Vault Clearance")
    .reduce((sum, item) => sum + (item.amountCollected || 0), 0)

  const totalInvoiced = metrics?.totalInvoicedBDT ?? collections
    .reduce((sum, item) => sum + (item.totalInvoiceAmount || 0), 0)

  const totalDueRemaining = metrics?.outstandingDueBDT ?? collections
    .reduce((sum, item) => sum + (item.dueAmountRemaining || 0), 0)

  return (
    <div className="mx-auto max-w-[1420px] space-y-6 pb-20 font-sans text-neutral-900">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              FINANCE & TREASURY • CASH & BANK REALIZATION
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Delivery Cash Collections
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Reconcile delivery payments from chemists, track MIO cash & cheque handovers, and clear funds into cash vaults or corporate bank accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
            Sync Ledger
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" /> Export Excel
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-4 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
          >
            <Plus className="h-4 w-4" /> Record New Collection
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
              Realized & Deposited
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold tracking-tight text-emerald-700">
            ৳{totalRealized.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {metrics?.realizedCount || collections.filter((c) => c.status === "Cleared & Deposited").length} Receipts cleared into vault
          </p>
        </Card>

        <Card className="rounded-xl border border-amber-200 bg-amber-50/30 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-amber-700 uppercase">
              Pending Clearance
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold tracking-tight text-amber-700">
            ৳{totalPending.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-[11px] text-amber-600/90 font-medium">
            {pendingCollections.length} Handover receipts ready for vault
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Total Invoiced BDT
            </span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold tracking-tight text-slate-900">
            ৳{totalInvoiced.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {collections.length} Delivery invoices tracked
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Chemist Dues Uncollected
            </span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold tracking-tight text-rose-600">
            ৳{totalDueRemaining.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Outstanding receivables across territories
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Deposit Destinations
            </span>
            <Landmark className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 flex flex-col gap-1 text-[11px] font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1.5 text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Corporate Banks: Active
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Head Office Cash Safe: Ready
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Tabs & Multi-Action Floating Bar */}
      <div className="space-y-3">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === "all"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Receipts ({collections.length})
            </button>

            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === "pending"
                  ? "bg-amber-600 text-white"
                  : "text-amber-700 hover:bg-amber-50"
              }`}
            >
              <Clock className="h-3 w-3" />
              Pending Vault Clearance
              {pendingCollections.length > 0 && (
                <span className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === "pending" ? "bg-white text-amber-700" : "bg-amber-100 text-amber-800"
                }`}>
                  {pendingCollections.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("cleared")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === "cleared"
                  ? "bg-emerald-700 text-white"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              Cleared & Deposited
            </button>

            <button
              onClick={() => setActiveTab("cash")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === "cash"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Banknote className="h-3 w-3 text-blue-500" />
              Cash Collections
            </button>

            <button
              onClick={() => setActiveTab("cheque")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === "cheque"
                  ? "bg-purple-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FileText className="h-3 w-3 text-purple-500" />
              Cheque Instruments
            </button>
          </div>

          {/* Quick Clear to Vault Button */}
          {selectedIds.length > 0 ? (
            <Button
              size="sm"
              onClick={() => handleOpenSettleModal()}
              className="h-8 gap-1.5 rounded-lg bg-emerald-600 text-xs font-semibold text-white shadow-none hover:bg-emerald-700 animate-pulse"
            >
              <Wallet className="h-3.5 w-3.5" />
              Clear & Deposit {selectedIds.length} Selected (৳{selectedTotalBDT.toLocaleString("en-IN")})
            </Button>
          ) : (
            pendingCollections.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenSettleModal()}
                className="h-8 gap-1.5 rounded-lg border-amber-300 bg-amber-50/50 text-xs font-semibold text-amber-800 hover:bg-amber-100"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                Clear All Pending ({pendingCollections.length})
              </Button>
            )
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search chemist, invoice #, receipt #, MIO, cheque..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[160px] border-slate-200 bg-white text-xs">
                <Filter className="mr-1.5 h-3 w-3 text-slate-400" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending Vault Clearance">Pending Clearance</SelectItem>
                <SelectItem value="Cleared & Deposited">Cleared & Deposited</SelectItem>
                <SelectItem value="Bounced / Rejected">Bounced / Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
              <SelectTrigger className="h-8 w-[150px] border-slate-200 bg-white text-xs">
                <SelectValue placeholder="All Territories" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Territories</SelectItem>
                <SelectItem value="Dhaka North">Dhaka North</SelectItem>
                <SelectItem value="Dhaka South">Dhaka South</SelectItem>
                <SelectItem value="Chittagong Central">Chittagong Central</SelectItem>
                <SelectItem value="Sylhet Sadar">Sylhet Sadar</SelectItem>
                <SelectItem value="Rajshahi Metro">Rajshahi Metro</SelectItem>
                <SelectItem value="Khulna Zone">Khulna Zone</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="h-8 w-[140px] border-slate-200 bg-white text-xs">
                <SelectValue placeholder="Payment Mode" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="Cash">Cash Handover</SelectItem>
                <SelectItem value="Cheque">Cheque Instrument</SelectItem>
                <SelectItem value="BEFTN / RTGS">BEFTN / RTGS</SelectItem>
                <SelectItem value="bKash / Nagad">Mobile Money</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== "all" || territoryFilter !== "all" || methodFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setTerritoryFilter("all")
                  setMethodFilter("all")
                }}
                className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Collections Register Table */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-none">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Field Cash & Bank Collections Register
            </h3>
            <Badge variant="secondary" className="text-[10px] font-bold">
              {totalItems} Records {totalPages > 1 ? `• Page ${currentPage} of ${totalPages}` : ""}
            </Badge>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Sorted by collection date (Descending)
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-600">
                <TableHead className="w-10 pl-4 py-3">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="flex items-center justify-center text-slate-500 hover:text-slate-900"
                    title={isAllPendingSelected ? "Deselect All" : "Select All Pending"}
                  >
                    {isAllPendingSelected ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="py-3">Receipt & Date</TableHead>
                <TableHead className="py-3">Chemist & Invoice</TableHead>
                <TableHead className="py-3">Territory & MIO</TableHead>
                <TableHead className="py-3 text-right">Invoice (৳)</TableHead>
                <TableHead className="py-3 text-right">Collected (৳)</TableHead>
                <TableHead className="py-3 text-right">Due (৳)</TableHead>
                <TableHead className="py-3">Mode & Ref</TableHead>
                <TableHead className="py-3 text-center">Status</TableHead>
                <TableHead className="py-3 pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-xs text-slate-400">
                    <RotateCcw className="mx-auto h-5 w-5 animate-spin text-[#0090FF] mb-2" />
                    Loading delivery collection records from database...
                  </TableCell>
                </TableRow>
              ) : filteredCollections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-xs text-slate-400">
                    <AlertCircle className="mx-auto h-6 w-6 text-slate-300 mb-2" />
                    No delivery collection records matching the filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCollections.map((c) => {
                  const isSelected = selectedIds.includes(c.id)
                  const isPending = c.status === "Pending Vault Clearance"

                  return (
                    <TableRow
                      key={c.id}
                      className={`border-b border-slate-50 text-xs transition-colors hover:bg-slate-50/50 ${
                        isSelected ? "bg-blue-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell className="pl-4 py-3.5 align-top">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => handleToggleSelectOne(c.id)}
                            className="flex items-center justify-center text-slate-500"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-300 hover:text-slate-600" />
                            )}
                          </button>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500/70" />
                        )}
                      </TableCell>

                      {/* Receipt & Date */}
                      <TableCell className="py-3.5 align-top">
                        <span className="block font-mono font-bold text-[#0090FF]">
                          {c.receiptNo}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {c.collectionDate}
                        </span>
                      </TableCell>

                      {/* Chemist & Invoice */}
                      <TableCell className="py-3.5 align-top max-w-[240px]">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <strong className="block truncate font-semibold text-slate-900">
                            {c.chemistName}
                          </strong>
                        </div>
                        <span className="inline-block mt-0.5 rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[10px] font-bold text-slate-700">
                          Inv: {c.invoiceNo}
                        </span>
                        {c.notes && (
                          <p className="mt-1 line-clamp-1 text-[11px] text-slate-500 italic">
                            "{c.notes}"
                          </p>
                        )}
                      </TableCell>

                      {/* Territory & MIO */}
                      <TableCell className="py-3.5 align-top">
                        <span className="block font-medium text-slate-800">
                          {c.territory}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <UserCheck className="h-3 w-3 text-slate-400" />
                          <span>{c.salesRepName}</span>
                        </div>
                      </TableCell>

                      {/* Invoice Amount */}
                      <TableCell className="py-3.5 text-right align-top font-mono text-slate-700">
                        ৳{c.totalInvoiceAmount.toLocaleString("en-IN")}
                      </TableCell>

                      {/* Collected Amount */}
                      <TableCell className="py-3.5 text-right align-top font-mono">
                        <span className="text-sm font-extrabold text-emerald-700">
                          ৳{c.amountCollected.toLocaleString("en-IN")}
                        </span>
                      </TableCell>

                      {/* Due Amount */}
                      <TableCell className="py-3.5 text-right align-top font-mono">
                        {c.dueAmountRemaining > 0 ? (
                          <span className="font-bold text-rose-600">
                            ৳{c.dueAmountRemaining.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">Settled</span>
                        )}
                      </TableCell>

                      {/* Payment Mode & Ref */}
                      <TableCell className="py-3.5 align-top">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold border-slate-200 bg-slate-50 text-slate-700"
                        >
                          {c.paymentMethod}
                        </Badge>
                        {c.chequeNumber && (
                          <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                            Ref: {c.chequeNumber}
                          </span>
                        )}
                        {c.destinationName && c.status === "Cleared & Deposited" && (
                          <span className="block text-[10px] text-slate-500 mt-0.5 truncate max-w-[130px]">
                            {c.destinationName}
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3.5 text-center align-top">
                        {c.status === "Cleared & Deposited" ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Deposited
                          </Badge>
                        ) : c.status === "Pending Vault Clearance" ? (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
                            <Clock className="mr-1 h-3 w-3" /> In Hand
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">
                            <XCircle className="mr-1 h-3 w-3" /> Bounced
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3.5 pr-4 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenSettleModal(c.id)}
                              className="h-7 border-emerald-300 bg-emerald-50/60 px-2 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                            >
                              <Wallet className="mr-1 h-3 w-3 text-emerald-600" /> Settle
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPrintTarget(c)
                              setIsPrintOpen(true)
                            }}
                            className="h-7 border-slate-200 px-2 text-[11px] text-slate-700 hover:bg-slate-50"
                          >
                            <Receipt className="mr-1 h-3 w-3 text-[#0090FF]" /> View
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrint(c)}
                            className="h-7 px-2 text-[11px] text-slate-700 hover:bg-slate-50"
                          >
                            <Printer className="mr-1 h-3 w-3 text-slate-500" /> Print
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(c)}
                            className="h-7 px-2 text-[11px] text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="h-3 w-3 text-slate-400" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDelete(c)}
                            className="h-7 w-7 border-rose-100 p-0 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 p-4 gap-3 bg-white rounded-b-xl">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * pageSize, totalItems)}
              </span>{" "}
              of <span className="font-semibold text-slate-800">{totalItems}</span> collection receipts
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px] text-slate-400">Per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-7 w-[68px] text-xs bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-40 text-xs" : "cursor-pointer text-xs"}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((pageNum, idx, arr) => {
                    const prev = arr[idx - 1]
                    return (
                      <React.Fragment key={pageNum}>
                        {prev && pageNum - prev > 1 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            isActive={currentPage === pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className="cursor-pointer text-xs h-7 w-7"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    )
                  })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages || totalPages === 0 ? "pointer-events-none opacity-40 text-xs" : "cursor-pointer text-xs"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </Card>

      {/* 5. Record New Collection Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl bg-white sm:max-w-155 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Receipt className="h-4 w-4" />
              </span>
              {editingId ? "Edit Collection Receipt" : "Record Delivery Cash Collection"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Log payments collected by field MIOs from delivered pharmacy invoices.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-4 py-2 text-xs">
            {/* Quick Pick Delivered Order */}
            {!editingId && deliveredOrders.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  Quick-Link Delivered Order / Invoice (Optional)
                </Label>
                <Select
                  value={formData.orderId}
                  onValueChange={handleSelectOrder}
                >
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue placeholder="Select delivered order to auto-populate..." />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {deliveredOrders.map((ord) => (
                      <SelectItem key={ord.id} value={ord.id}>
                        {ord.pharmacyName} • Inv #{ord.invoiceNumber || ord.orderNumber} (৳{Number(ord.orderValue).toLocaleString("en-IN")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Row 1: Receipt # & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Collection Receipt # *
                </Label>
                <Input
                  value={formData.receiptNo}
                  onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
                  required
                  className="h-8 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Collection Date *
                </Label>
                <Input
                  value={formData.collectionDate}
                  onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
                  required
                  className="h-8 font-mono"
                />
              </div>
            </div>

            {/* Row 2: Invoice # & Chemist */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Delivery Invoice # *
                </Label>
                <Input
                  placeholder="e.g. INV-2026-0042"
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                  required
                  className="h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Chemist / Pharmacy Name *
                </Label>
                <Input
                  placeholder="e.g. Labaid Pharmacy"
                  value={formData.chemistName}
                  onChange={(e) => setFormData({ ...formData, chemistName: e.target.value })}
                  required
                  className="h-8 font-semibold"
                />
              </div>
            </div>

            {/* Row 3: Territory & Sales Rep */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Territory *
                </Label>
                <Select
                  value={formData.territory}
                  onValueChange={(val) => setFormData({ ...formData, territory: val })}
                >
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Dhaka North">Dhaka North</SelectItem>
                    <SelectItem value="Dhaka South">Dhaka South</SelectItem>
                    <SelectItem value="Chittagong Central">Chittagong Central</SelectItem>
                    <SelectItem value="Sylhet Sadar">Sylhet Sadar</SelectItem>
                    <SelectItem value="Rajshahi Metro">Rajshahi Metro</SelectItem>
                    <SelectItem value="Khulna Zone">Khulna Zone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Collecting Sales Rep (MIO) *
                </Label>
                <Input
                  placeholder="e.g. Tanvir Ahmed (MIO)"
                  value={formData.salesRepName}
                  onChange={(e) => setFormData({ ...formData, salesRepName: e.target.value })}
                  required
                  className="h-8"
                />
              </div>
            </div>

            {/* Row 4: Invoice Amount & Amount Collected */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Total Invoice (৳) *
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.totalInvoiceAmount || ""}
                  onChange={(e) => {
                    const total = Number(e.target.value) || 0
                    setFormData((prev) => ({
                      ...prev,
                      totalInvoiceAmount: total,
                      dueAmountRemaining: Math.max(0, total - prev.amountCollected),
                    }))
                  }}
                  required
                  className="h-8 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Amount Collected (৳) *
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.amountCollected || ""}
                  onChange={(e) => {
                    const coll = Number(e.target.value) || 0
                    setFormData((prev) => ({
                      ...prev,
                      amountCollected: coll,
                      dueAmountRemaining: Math.max(0, prev.totalInvoiceAmount - coll),
                    }))
                  }}
                  required
                  className="h-8 font-mono font-bold text-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Remaining Due (৳)
                </Label>
                <Input
                  type="number"
                  readOnly
                  value={Math.max(0, formData.totalInvoiceAmount - formData.amountCollected)}
                  className="h-8 font-mono font-bold text-rose-600 bg-slate-50"
                />
              </div>
            </div>

            {/* Row 5: Payment Method & Instrument */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Payment Method *
                </Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(val: any) => setFormData({ ...formData, paymentMethod: val })}
                >
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Cash">Cash Handover</SelectItem>
                    <SelectItem value="Cheque">Bank Cheque</SelectItem>
                    <SelectItem value="BEFTN / RTGS">BEFTN / RTGS Online</SelectItem>
                    <SelectItem value="bKash / Nagad">Mobile Money (bKash/Nagad)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Cheque # / Trx Reference
                </Label>
                <Input
                  placeholder="e.g. CQ-IBBL-88120"
                  value={formData.chequeNumber}
                  onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>
            </div>

            {/* Row 6: Initial Status & Destination */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Clearance Status *
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="h-8 bg-white font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Pending Vault Clearance">
                      Pending Vault Clearance (In Hand)
                    </SelectItem>
                    <SelectItem value="Cleared & Deposited">
                      Cleared & Deposited (Immediate Credit)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === "Cleared & Deposited" && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Deposit Destination Safe / Bank
                  </Label>
                  <Select
                    value={formData.financialAccountId}
                    onValueChange={(accId) => {
                      const acc = accounts.find((a) => a.id === accId)
                      if (acc) {
                        setFormData((prev) => ({
                          ...prev,
                          financialAccountId: acc.id,
                          destinationType: acc.category === "CASH" ? "Cash Drawer" : "Bank Account",
                          destinationName: `${acc.institution} (${acc.branch})`,
                        }))
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 bg-white text-xs">
                      <SelectValue placeholder="Pick Safe / Account" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.accountTitle} (৳{acc.balance.toLocaleString("en-IN")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">
                Collection Remarks / Notes
              </Label>
              <Input
                placeholder="Field handover remarks, invoice details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-8"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmittingForm}
                className="h-8 text-xs"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmittingForm}
                className="h-8 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
              >
                {isSubmittingForm ? (
                  <>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  "Update Receipt"
                ) : (
                  "Save Collection Receipt"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Settle & Post to Vault Modal */}
      <Dialog open={isSettlementOpen} onOpenChange={setIsSettlementOpen}>
        <DialogContent className="rounded-2xl bg-white sm:max-w-[460px] shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              Clear & Deposit to Safe / Bank Ledger
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Clear selected delivery cash receipts from field handovers into the physical cash safe or corporate bank account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmSettlement} className="space-y-4 py-2 text-xs">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-1">
              <div className="flex justify-between items-center text-xs text-emerald-800">
                <span>Receipts to Clear:</span>
                <strong className="font-bold">{selectedIds.length} Vouchers</strong>
              </div>
              <div className="flex justify-between items-center text-xs text-emerald-900 pt-1 border-t border-emerald-200/60">
                <span>Total Realized Amount:</span>
                <strong className="font-mono text-base font-extrabold text-emerald-700">
                  ৳{selectedTotalBDT.toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Deposit Destination Channel *
              </Label>
              <Select
                value={settlementType}
                onValueChange={(val: any) => {
                  setSettlementType(val)
                  const matchingAcc = accounts.find((a) =>
                    val === "Cash Drawer" ? a.category === "CASH" : a.category === "BANK"
                  )
                  if (matchingAcc) {
                    setSettlementAccountId(matchingAcc.id)
                    setSettlementDestinationName(matchingAcc.accountTitle)
                  }
                }}
              >
                <SelectTrigger className="h-8 bg-white font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="Cash Drawer">Physical Cash Safe / Drawer</SelectItem>
                  <SelectItem value="Bank Account">Corporate Bank Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-slate-700">
                  Target Financial Account *
                </Label>
                <span className="text-[10px] text-slate-400">Live balance credited</span>
              </div>

              <Select
                value={settlementAccountId}
                onValueChange={(accId) => {
                  const acc = accounts.find((a) => a.id === accId)
                  if (acc) {
                    setSettlementAccountId(acc.id)
                    setSettlementDestinationName(acc.accountTitle)
                  }
                }}
              >
                <SelectTrigger className="h-8 bg-white text-xs">
                  <SelectValue placeholder={settlementDestinationName} />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {accounts
                    .filter((a) =>
                      settlementType === "Cash Drawer" ? a.category === "CASH" : a.category === "BANK"
                    )
                    .map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.accountTitle} (৳{acc.balance.toLocaleString("en-IN")} available)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettlementOpen(false)}
                disabled={isSettling}
                className="h-8 text-xs"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSettling}
                className="h-8 bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                {isSettling ? (
                  <>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  "Confirm & Deposit to Ledger"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. Screen Receipt Preview Modal */}
      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent className="max-h-[95vh] overflow-y-auto rounded-2xl bg-white sm:max-w-[760px] p-6 print:p-0">
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Official Delivery Money Receipt
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Money receipt for #{printTarget?.receiptNo} ({printTarget?.chemistName})
                </DialogDescription>
              </div>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="h-8 gap-1.5 bg-black hover:bg-neutral-800 text-xs font-semibold text-white"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Receipt
              </Button>
            </div>
          </DialogHeader>

          {printTarget && (
            <div className="space-y-6 pt-2">
              <div id="print-standalone-money-receipt">
                <MoneyReceiptSheet record={printTarget} />
              </div>

              <div className="flex justify-end gap-2 pb-2 print:hidden pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setIsPrintOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="gap-1.5 bg-black hover:bg-neutral-800 text-xs font-semibold text-white"
                >
                  <Printer className="h-4 w-4" /> Print Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 8. Global Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Collection Receipt"
        description="Are you sure you want to delete this delivery cash collection receipt? If this collection was already cleared into a safe or bank account, the balance will be automatically reversed."
        itemName={
          collectionToDelete
            ? `Receipt #${collectionToDelete.receiptNo} • Chemist: ${collectionToDelete.chemistName} (৳${collectionToDelete.amountCollected.toLocaleString("en-IN")})`
            : undefined
        }
        confirmText="Delete Receipt"
        cancelText="Cancel"
        isDeleting={isDeleting}
      />
    </div>
  )
}
