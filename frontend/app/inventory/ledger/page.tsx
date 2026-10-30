"use client"

import PermissionGate from "@/components/permission-gate"

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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  Boxes,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Clock,
  Snowflake,
  MoreHorizontal,
  Pencil,
  Trash2,
  Barcode,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Info,
  Calendar,
  Layers,
  ThermometerSnowflake,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"

export interface InventoryBatch {
  id: string
  skuCode: string
  brandName: string
  genericName: string
  category: string
  batchNumber: string
  mfgDate: string
  expiryDate: string
  daysToExpiry: number
  availableUnits: number
  unitPrice: number
  warehouseBin: string
  storageCondition: "Cold Chain (2-8°C)" | "Controlled Ambient (<25°C)"
  fefoStatus: "Expired" | "Near Expiry" | "Priority Out" | "Healthy"
  isQuarantined: boolean
  isExpired: boolean
  totalValuation: number
  createdAt?: string
  updatedAt?: string
}

export interface InventoryStats {
  grossValuation: number
  totalStockUnits: number
  activeBatchCount: number
  coldChainBatches: number
  coldChainUnits: number
  ambientUnits: number
  priorityOutCount: number
  nearExpiryCount: number
  expiredCount: number
  quarantinedCount: number
  healthyCount: number
}

export const PHARMA_CATEGORIES = {
  generalInfectious: [
    "Antibiotic",
    "Antiviral",
    "Antifungal",
    "Antiparasitic / Anthelmintic",
  ],
  systemicTherapies: [
    "Analgesic & Antipyretic",
    "Cardiovascular (Hypertension & Lipid)",
    "Gastroenterology (Anti-ulcerant & Antacid)",
    "Antidiabetic (Oral & Insulin)",
    "Respiratory (Bronchodilator & Anti-asthma)",
    "Antihistamine & Anti-allergic",
  ],
  specialtyClinicals: [
    "Neurology & CNS",
    "Psychiatry & Sedatives",
    "Hematology & Hematinics",
    "Dermatology & Topicals",
    "Ophthalmology & ENT",
    "Musculoskeletal & Anti-inflammatory",
    "Urology & Nephrology",
    "Gynecology & Hormonal",
  ],
  nutritionAndSupplements: [
    "Vitamins, Minerals & Supplements",
    "Electrolytes & IV Fluids",
    "Immunology & Vaccines",
    "Oncology & Antineoplastic",
  ],
}

export const ALL_CATEGORIES = [
  ...PHARMA_CATEGORIES.generalInfectious,
  ...PHARMA_CATEGORIES.systemicTherapies,
  ...PHARMA_CATEGORIES.specialtyClinicals,
  ...PHARMA_CATEGORIES.nutritionAndSupplements,
]

function calculateFefoMeta(expiryDateStr: string, warehouseBin = ""): {
  days: number
  status: InventoryBatch["fefoStatus"]
  isQuarantined: boolean
  isExpired: boolean
} {
  const parsedTime = Date.parse(expiryDateStr)
  const targetDate = isNaN(parsedTime)
    ? new Date(2027, 11, 31).getTime()
    : parsedTime
  const now = Date.now()
  const diffTime = targetDate - now
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const isQuarantined =
    warehouseBin.toLowerCase().includes("quarantine") ||
    warehouseBin.toUpperCase().includes("[QUARANTINE]") ||
    warehouseBin.toUpperCase().startsWith("Q-")

  let status: InventoryBatch["fefoStatus"] = "Healthy"
  if (days <= 0) {
    status = "Expired"
  } else if (days <= 60) {
    status = "Near Expiry"
  } else if (days <= 180) {
    status = "Priority Out"
  }

  return {
    days,
    status,
    isQuarantined,
    isExpired: days <= 0,
  }
}

function getShelfLifePercent(mfgDate: string, expiryDate: string, daysToExpiry: number) {
  const mfg = Date.parse(mfgDate)
  const exp = Date.parse(expiryDate)
  if (isNaN(mfg) || isNaN(exp) || exp <= mfg) return 50
  const totalDays = Math.max(1, (exp - mfg) / (1000 * 60 * 60 * 24))
  const remaining = Math.max(0, daysToExpiry)
  return Math.min(100, Math.max(0, Math.round((remaining / totalDays) * 100)))
}

export default function ActiveInventoryLedgerPage() {
  const [ledger, setLedger] = React.useState<InventoryBatch[]>([])
  const [stats, setStats] = React.useState<InventoryStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  // Filters & Search
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [fefoFilter, setFefoFilter] = React.useState("all")
  const [storageFilter, setStorageFilter] = React.useState("all")
  const [sortBy, setSortBy] = React.useState("fefo_asc")

  // Modals
  const [isAddBatchOpen, setIsAddBatchOpen] = React.useState(false)
  const [editingBatch, setEditingBatch] = React.useState<InventoryBatch | null>(null)
  const [isSavingBatch, setIsSavingBatch] = React.useState(false)

  // Form State
  const [formData, setFormData] = React.useState({
    brandName: "",
    genericName: "",
    category: "Analgesic & Antipyretic",
    batchNumber: "",
    mfgDate: "",
    expiryDate: "",
    availableUnits: "",
    unitPrice: "",
    warehouseBin: "Bay 01 - Shelf A",
    storageCondition: "Controlled Ambient (<25°C)" as InventoryBatch["storageCondition"],
  })
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

  // Quick Adjustment Modal
  const [stockAdjustTarget, setStockAdjustTarget] = React.useState<InventoryBatch | null>(null)
  const [adjustQty, setAdjustQty] = React.useState("")
  const [adjustType, setAdjustType] = React.useState<"IN" | "OUT" | "DAMAGE">("IN")
  const [adjustReason, setAdjustReason] = React.useState("")
  const [isAdjusting, setIsAdjusting] = React.useState(false)

  // Quarantine Modal (Special RBAC Action)
  const [quarantineTarget, setQuarantineTarget] = React.useState<InventoryBatch | null>(null)
  const [quarantineAction, setQuarantineAction] = React.useState<"QUARANTINE" | "RELEASE">("QUARANTINE")
  const [quarantineReason, setQuarantineReason] = React.useState("Quality defect inspection hold")
  const [quarantineCustomReason, setQuarantineCustomReason] = React.useState("")
  const [quarantineBay, setQuarantineBay] = React.useState("Quarantine Bay Q-01")
  const [isQuarantining, setIsQuarantining] = React.useState(false)

  // Batch Passport / Barcode Modal
  const [passportBatch, setPassportBatch] = React.useState<InventoryBatch | null>(null)

  // Global Delete Modal State
  const [batchToDelete, setBatchToDelete] = React.useState<InventoryBatch | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [isDeletingBatch, setIsDeletingBatch] = React.useState(false)

  // Bulk Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false)
  const [importJsonText, setImportJsonText] = React.useState("")
  const [isImporting, setIsImporting] = React.useState(false)

  // ─────────────────────────────────────────────
  // Fetch Data from Server
  // ─────────────────────────────────────────────
  const fetchInventory = React.useCallback(async (isSilent = false) => {
    try {
      if (isSilent) setRefreshing(true)
      else setLoading(true)

      const [batchesRes, statsRes] = await Promise.all([
        apiFetch(`${API_URL}/inventory`),
        apiFetch(`${API_URL}/inventory/stats`).catch(() => null),
      ])

      if (batchesRes.ok) {
        const json = await batchesRes.json()
        const rawBatches = Array.isArray(json) ? json : json?.data || []
        if (Array.isArray(rawBatches)) {
          setLedger(
            rawBatches.map((item: any) => {
              const { days, status, isQuarantined, isExpired } = calculateFefoMeta(
                item.expiryDate,
                item.warehouseBin
              )
              const units = Number(item.availableUnits) || 0
              const price = Number(item.unitPrice) || 0
              return {
                id: item.id,
                skuCode: item.skuCode || `SKU-${item.brandName?.slice(0, 2).toUpperCase()}-001`,
                brandName: item.brandName,
                genericName: item.genericName,
                category: item.category,
                batchNumber: item.batchNumber,
                mfgDate: item.mfgDate,
                expiryDate: item.expiryDate,
                daysToExpiry: days,
                availableUnits: units,
                unitPrice: price,
                warehouseBin: item.warehouseBin,
                storageCondition: item.storageCondition,
                fefoStatus: status,
                isQuarantined,
                isExpired,
                totalValuation: Math.round(units * price * 100) / 100,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              }
            })
          )
        }
      }

      if (statsRes && statsRes.ok) {
        const statsJson = await statsRes.json()
        if (statsJson?.data) {
          setStats(statsJson.data)
        }
      }
    } catch (err: any) {
      console.error("Error loading inventory from backend:", err)
      toast.error("Could not sync inventory ledger from server.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  // ─────────────────────────────────────────────
  // Add / Edit Handlers
  // ─────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingBatch(null)
    setFormErrors({})
    setFormData({
      brandName: "",
      genericName: "",
      category: "Analgesic & Antipyretic",
      batchNumber: `BX-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      mfgDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      availableUnits: "1000",
      unitPrice: "10.00",
      warehouseBin: "Bay 01 - Shelf A",
      storageCondition: "Controlled Ambient (<25°C)",
    })
    setIsAddBatchOpen(true)
  }

  const handleOpenEdit = (batch: InventoryBatch) => {
    setEditingBatch(batch)
    setFormErrors({})
    setFormData({
      brandName: batch.brandName,
      genericName: batch.genericName,
      category: batch.category,
      batchNumber: batch.batchNumber,
      mfgDate: batch.mfgDate,
      expiryDate: batch.expiryDate,
      availableUnits: String(batch.availableUnits),
      unitPrice: String(batch.unitPrice),
      warehouseBin: batch.warehouseBin,
      storageCondition: batch.storageCondition,
    })
    setIsAddBatchOpen(true)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.brandName.trim()) errors.brandName = "Commercial brand name is required"
    if (!formData.genericName.trim()) errors.genericName = "Generic composition is required"
    if (!formData.category.trim()) errors.category = "Therapeutic category is required"
    if (!formData.batchNumber.trim()) errors.batchNumber = "Batch number code is required"
    if (!formData.mfgDate) errors.mfgDate = "Manufacturing date is required"
    if (!formData.expiryDate) errors.expiryDate = "Expiry date is required"

    if (formData.mfgDate && formData.expiryDate) {
      if (Date.parse(formData.expiryDate) <= Date.parse(formData.mfgDate)) {
        errors.expiryDate = "Expiry date must be strictly after manufacturing date"
      }
    }

    const units = parseInt(formData.availableUnits, 10)
    if (isNaN(units) || units < 0) {
      errors.availableUnits = "Available stock must be a non-negative number"
    }

    const price = parseFloat(formData.unitPrice)
    if (isNaN(price) || price < 0) {
      errors.unitPrice = "Unit cost must be a valid non-negative figure"
    }

    if (!formData.warehouseBin.trim()) errors.warehouseBin = "Warehouse bin location is required"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error("Please resolve the highlighted validation errors before saving.")
      return
    }

    const payload = {
      brandName: formData.brandName.trim(),
      genericName: formData.genericName.trim(),
      category: formData.category,
      batchNumber: formData.batchNumber.trim(),
      mfgDate: formData.mfgDate,
      expiryDate: formData.expiryDate,
      availableUnits: Math.max(0, parseInt(formData.availableUnits, 10) || 0),
      unitPrice: Math.max(0, parseFloat(formData.unitPrice) || 0),
      warehouseBin: formData.warehouseBin.trim(),
      storageCondition: formData.storageCondition,
    }

    const toastId = toast.loading(
      editingBatch
        ? `Updating batch details for ${payload.brandName}...`
        : `Registering inward consignment for ${payload.brandName}...`
    )

    try {
      setIsSavingBatch(true)
      const endpoint = editingBatch
        ? `${API_URL}/inventory/${editingBatch.id}`
        : `${API_URL}/inventory`
      const method = editingBatch ? "PUT" : "POST"

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      })

      const resData = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(resData.message || "Failed to persist batch to inventory ledger.")
      }

      toast.success(
        editingBatch
          ? `Batch record for ${payload.brandName} (${payload.batchNumber}) updated successfully.`
          : `Batch ${payload.batchNumber} received and registered into FEFO ledger.`,
        { id: toastId }
      )

      setIsAddBatchOpen(false)
      fetchInventory(true)
    } catch (err: any) {
      console.error("Error saving batch:", err)
      toast.error(err.message || "Error saving batch. Backend check failed.", { id: toastId })
    } finally {
      setIsSavingBatch(false)
    }
  }

  // ─────────────────────────────────────────────
  // Quick Stock Adjustment Handler
  // ─────────────────────────────────────────────
  const handleOpenStockAdjust = (batch: InventoryBatch, defaultType: "IN" | "OUT" | "DAMAGE" = "IN") => {
    setStockAdjustTarget(batch)
    setAdjustType(defaultType)
    setAdjustQty("")
    setAdjustReason("")
  }

  const handleApplyStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stockAdjustTarget) return

    const delta = parseInt(adjustQty, 10)
    if (isNaN(delta) || delta <= 0) {
      toast.error("Please enter a valid positive quantity for adjustment.")
      return
    }

    if ((adjustType === "OUT" || adjustType === "DAMAGE") && delta > stockAdjustTarget.availableUnits) {
      toast.error(
        `Cannot deduct ${delta} units. Available stock is only ${stockAdjustTarget.availableUnits} units.`
      )
      return
    }

    const typeLabels = {
      IN: "Restock Inward (+)",
      OUT: "Sales Outward / Dispatch (-)",
      DAMAGE: "Damage / Spoilage Write-off (-)",
    }

    const toastId = toast.loading(
      `Applying stock adjustment (${typeLabels[adjustType]}) on batch ${stockAdjustTarget.batchNumber}...`
    )

    try {
      setIsAdjusting(true)
      const res = await apiFetch(`${API_URL}/inventory/${stockAdjustTarget.id}/adjust`, {
        method: "POST",
        body: JSON.stringify({
          type: adjustType,
          quantity: delta,
          reason: adjustReason.trim() || `FEFO stock adjustment: ${typeLabels[adjustType]} of ${delta} units.`,
        }),
      })

      const resData = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(resData.message || "Stock adjustment operation failed.")
      }

      toast.success(
        `Stock adjusted successfully. ${delta} units ${adjustType === "IN" ? "added to" : "deducted from"} batch ${stockAdjustTarget.batchNumber}.`,
        { id: toastId }
      )

      setStockAdjustTarget(null)
      setAdjustQty("")
      setAdjustReason("")
      fetchInventory(true)
    } catch (err: any) {
      console.error("Stock adjust failed:", err)
      toast.error(err.message || "Failed to adjust stock on server.", { id: toastId })
    } finally {
      setIsAdjusting(false)
    }
  }

  // ─────────────────────────────────────────────
  // Quarantine / Release Handler (RBAC Special Action)
  // ─────────────────────────────────────────────
  const handleOpenQuarantine = (batch: InventoryBatch) => {
    setQuarantineTarget(batch)
    setQuarantineAction(batch.isQuarantined ? "RELEASE" : "QUARANTINE")
    setQuarantineReason("Quality defect inspection hold")
    setQuarantineCustomReason("")
    setQuarantineBay(batch.isQuarantined ? "Bay 01 - Shelf A" : "Quarantine Bay Q-01")
  }

  const handleApplyQuarantine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quarantineTarget) return

    const effectiveReason =
      quarantineCustomReason.trim() ||
      quarantineReason ||
      (quarantineAction === "QUARANTINE" ? "Statutory Quarantine Hold" : "QA Release Clearance")

    const toastId = toast.loading(
      quarantineAction === "QUARANTINE"
        ? `Quarantining batch ${quarantineTarget.batchNumber}...`
        : `Releasing batch ${quarantineTarget.batchNumber} from quarantine...`
    )

    try {
      setIsQuarantining(true)
      const res = await apiFetch(`${API_URL}/inventory/${quarantineTarget.id}/quarantine`, {
        method: "POST",
        body: JSON.stringify({
          action: quarantineAction,
          reason: effectiveReason,
          targetBin: quarantineBay.trim(),
        }),
      })

      const resData = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(resData.message || "Quarantine action failed on server.")
      }

      toast.success(
        quarantineAction === "QUARANTINE"
          ? `Batch ${quarantineTarget.batchNumber} successfully placed under Quarantine Hold in ${quarantineBay}.`
          : `Batch ${quarantineTarget.batchNumber} cleared and restored to active pick bay ${quarantineBay}.`,
        { id: toastId }
      )

      setQuarantineTarget(null)
      fetchInventory(true)
    } catch (err: any) {
      console.error("Quarantine operation failed:", err)
      toast.error(err.message || "Failed to execute quarantine operation.", { id: toastId })
    } finally {
      setIsQuarantining(false)
    }
  }

  // ─────────────────────────────────────────────
  // Delete Batch Handler (Global Modal)
  // ─────────────────────────────────────────────
  const handleOpenDeleteModal = (batch: InventoryBatch) => {
    setBatchToDelete(batch)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDeleteBatch = async () => {
    if (!batchToDelete) return
    const toastId = toast.loading(`Deleting batch record for ${batchToDelete.brandName}...`)
    try {
      setIsDeletingBatch(true)
      const res = await apiFetch(`${API_URL}/inventory/${batchToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to remove batch")
      }

      toast.success(
        `Batch record for ${batchToDelete.brandName} (${batchToDelete.batchNumber}) permanently deleted.`,
        { id: toastId }
      )
      setIsDeleteModalOpen(false)
      setBatchToDelete(null)
      fetchInventory(true)
    } catch (error: any) {
      console.error("Error deleting batch:", error)
      toast.error(error.message || "Failed to delete inventory batch from server.", { id: toastId })
    } finally {
      setIsDeletingBatch(false)
    }
  }

  // ─────────────────────────────────────────────
  // Excel Export Handler
  // ─────────────────────────────────────────────
  const handleExportExcel = () => {
    if (ledger.length === 0) {
      toast.error("No inventory batches to export.")
      return
    }

    const toastId = toast.loading("Generating audited FEFO Excel ledger...")
    try {
      const exportData = filteredLedger.map((item, idx) => ({
        "SL #": idx + 1,
        "SKU Code": item.skuCode,
        "Commercial Brand": item.brandName,
        "Generic Formulation": item.genericName,
        "Therapeutic Category": item.category,
        "Batch Code": item.batchNumber,
        "Mfg Date": item.mfgDate,
        "Expiry Date": item.expiryDate,
        "Days to Expiry": item.daysToExpiry,
        "FEFO Dispatch Priority": item.fefoStatus,
        "Stock In Hand (Units)": item.availableUnits,
        "Unit Cost (৳)": item.unitPrice,
        "Batch Valuation (৳)": (item.availableUnits * item.unitPrice).toFixed(2),
        "Storage Bin Location": item.warehouseBin,
        "Storage Environment": item.storageCondition,
        "Quarantine Status": item.isQuarantined ? "QUARANTINED" : "ACTIVE",
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "FEFO Active Ledger")
      XLSX.writeFile(
        workbook,
        `AK_Pharma_FEFO_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`
      )
      toast.success(`Exported ${filteredLedger.length} batch records to Excel successfully.`, {
        id: toastId,
      })
    } catch (err: any) {
      console.error("Export failed:", err)
      toast.error("Failed to generate Excel ledger file.", { id: toastId })
    }
  }

  // ─────────────────────────────────────────────
  // Filter and Sort Pipeline
  // ─────────────────────────────────────────────
  const filteredLedger = React.useMemo(() => {
    return ledger
      .filter((item) => {
        const q = searchQuery.toLowerCase().trim()
        const matchesSearch =
          !q ||
          item.brandName.toLowerCase().includes(q) ||
          item.genericName.toLowerCase().includes(q) ||
          item.batchNumber.toLowerCase().includes(q) ||
          item.warehouseBin.toLowerCase().includes(q) ||
          item.skuCode.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)

        const matchesCategory =
          categoryFilter === "all" ||
          item.category.toLowerCase() === categoryFilter.toLowerCase()

        let matchesFefo = true
        if (fefoFilter === "quarantined") {
          matchesFefo = item.isQuarantined
        } else if (fefoFilter !== "all") {
          matchesFefo = item.fefoStatus.toLowerCase() === fefoFilter.toLowerCase()
        }

        const matchesStorage =
          storageFilter === "all" ||
          (storageFilter === "cold" && item.storageCondition.includes("Cold")) ||
          (storageFilter === "ambient" && item.storageCondition.includes("Ambient"))

        return matchesSearch && matchesCategory && matchesFefo && matchesStorage
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "fefo_asc":
            return a.daysToExpiry - b.daysToExpiry
          case "fefo_desc":
            return b.daysToExpiry - a.daysToExpiry
          case "units_desc":
            return b.availableUnits - a.availableUnits
          case "units_asc":
            return a.availableUnits - b.availableUnits
          case "val_desc":
            return b.totalValuation - a.totalValuation
          case "brand_asc":
            return a.brandName.localeCompare(b.brandName)
          default:
            return a.daysToExpiry - b.daysToExpiry
        }
      })
  }, [ledger, searchQuery, categoryFilter, fefoFilter, storageFilter, sortBy])

  // Computed metrics
  const totalValuation = React.useMemo(
    () => ledger.reduce((acc, curr) => acc + curr.availableUnits * curr.unitPrice, 0),
    [ledger]
  )
  const totalPacks = React.useMemo(
    () => ledger.reduce((acc, curr) => acc + curr.availableUnits, 0),
    [ledger]
  )
  const priorityOutCount = React.useMemo(
    () => ledger.filter((i) => i.fefoStatus === "Priority Out" || i.fefoStatus === "Near Expiry").length,
    [ledger]
  )
  const expiredCount = React.useMemo(
    () => ledger.filter((i) => i.fefoStatus === "Expired").length,
    [ledger]
  )
  const quarantinedCount = React.useMemo(
    () => ledger.filter((i) => i.isQuarantined).length,
    [ledger]
  )
  const coldChainUnits = React.useMemo(
    () =>
      ledger
        .filter((i) => i.storageCondition.includes("Cold"))
        .reduce((acc, curr) => acc + curr.availableUnits, 0),
    [ledger]
  )

  return (
    <div className="mx-auto max-w-[1380px] space-y-6 pb-14 font-sans text-slate-900">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0090FF] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#0090FF]" />
              </span>
              <span className="text-[11px] font-black tracking-widest text-[#0090FF] uppercase">
                PHARMACEUTICAL WAREHOUSE • FEFO PROTOCOL
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                21 CFR Part 11 Active
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              FEFO Stock Control — Active Inventory Ledger
            </h1>
            <p className="max-w-3xl text-xs leading-relaxed text-slate-500">
              Automated First-Expiry, First-Out picking sequence, temperature-controlled bay allocations,
              strict quarantine isolation, and batch-level stock reconciliations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchInventory(true)}
              disabled={refreshing || loading}
              className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleExportExcel}
              className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              Export Excel
            </Button>

            <PermissionGate feature="Stock Inventory" action="create">
<Button
                size="sm"
                onClick={handleOpenAdd}
                className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#0080e5] focus:ring-2 focus:ring-[#0090FF]/20"
              >
                <Plus className="h-4 w-4" />
                Receive New Batch
              </Button>
</PermissionGate>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Valuation */}
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Gross Batch Valuation
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-[#0090FF]">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] font-extrabold tracking-tight text-slate-900">
            ৳{totalValuation.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
            <span>{ledger.length} active registered batches</span>
            <span className="font-semibold text-emerald-600">Audited Basis</span>
          </div>
        </Card>

        {/* Card 2: Stock Units */}
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Available Stock Volume
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] font-extrabold tracking-tight text-slate-900">
            {totalPacks.toLocaleString("en-IN")} <span className="text-base font-medium text-slate-400">Units</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-[#0090FF]">
              <Snowflake className="h-3 w-3" /> {coldChainUnits.toLocaleString()} Cold Chain
            </span>
            <span>{(totalPacks - coldChainUnits).toLocaleString()} Ambient</span>
          </div>
        </Card>

        {/* Card 3: FEFO Dispatch Priority */}
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              FEFO Priority Dispatch
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-[28px] font-extrabold tracking-tight text-amber-600">
              {priorityOutCount}
            </span>
            <span className="text-xs font-bold text-slate-400">Batches (&le; 180 Days)</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
            <span className="font-semibold text-amber-600">Must pick & dispatch first</span>
            <span className="text-slate-400">FEFO #1 Priority</span>
          </div>
        </Card>

        {/* Card 4: Quality & Quarantine */}
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Quarantine & Expiry Alert
            </span>
            <div className={`rounded-lg p-2 ${quarantinedCount > 0 || expiredCount > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
              {quarantinedCount > 0 || expiredCount > 0 ? (
                <ShieldAlert className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`font-mono text-[28px] font-extrabold tracking-tight ${quarantinedCount > 0 || expiredCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {quarantinedCount + expiredCount}
            </span>
            <span className="text-xs font-semibold text-slate-400">Action Required</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
            <span className="text-purple-600 font-semibold">{quarantinedCount} Quarantined</span>
            <span className="text-rose-600 font-semibold">{expiredCount} Expired</span>
          </div>
        </Card>
      </div>

      {/* 3. Search & Comprehensive Filter Toolbars */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search brand, generic, batch #, shelf bin, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 border-slate-200 bg-slate-50/60 pl-8 text-xs font-medium focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-[190px] border-slate-200 bg-white text-xs font-medium">
              <Filter className="mr-1.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <SelectValue placeholder="Therapeutic Class" />
            </SelectTrigger>
            <SelectContent className="max-h-[340px] text-xs">
              <SelectItem value="all">All Categories ({ALL_CATEGORIES.length})</SelectItem>
              <SelectGroup>
                <SelectLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Infectious Diseases
                </SelectLabel>
                {PHARMA_CATEGORIES.generalInfectious.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Systemic & Chronic
                </SelectLabel>
                {PHARMA_CATEGORIES.systemicTherapies.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Specialty & Clinical
                </SelectLabel>
                {PHARMA_CATEGORIES.specialtyClinicals.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Nutrition & Hospital
                </SelectLabel>
                {PHARMA_CATEGORIES.nutritionAndSupplements.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* FEFO Status Filter */}
          <Select value={fefoFilter} onValueChange={setFefoFilter}>
            <SelectTrigger className="h-9 w-[165px] border-slate-200 bg-white text-xs font-medium">
              <SelectValue placeholder="FEFO Priority" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All FEFO Statuses</SelectItem>
              <SelectItem value="expired">Expired (&le; 0d)</SelectItem>
              <SelectItem value="near expiry">Near Expiry (&le; 60d)</SelectItem>
              <SelectItem value="priority out">Priority Out (61-180d)</SelectItem>
              <SelectItem value="healthy">Healthy Stock (&gt; 180d)</SelectItem>
              <SelectItem value="quarantined">Quarantine Hold (All)</SelectItem>
            </SelectContent>
          </Select>

          {/* Storage Filter */}
          <Select value={storageFilter} onValueChange={setStorageFilter}>
            <SelectTrigger className="h-9 w-[150px] border-slate-200 bg-white text-xs font-medium">
              <SelectValue placeholder="Storage Environment" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Storage</SelectItem>
              <SelectItem value="ambient">Ambient (&lt;25°C)</SelectItem>
              <SelectItem value="cold">Cold Chain (2-8°C)</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-[160px] border-slate-200 bg-white text-xs font-medium">
              <SelectValue placeholder="Sort Sequence" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="fefo_asc">FEFO: Earliest Expiry</SelectItem>
              <SelectItem value="fefo_desc">Expiry: Furthest Out</SelectItem>
              <SelectItem value="units_desc">Stock: High to Low</SelectItem>
              <SelectItem value="units_asc">Stock: Low to High</SelectItem>
              <SelectItem value="val_desc">Valuation: Highest</SelectItem>
              <SelectItem value="brand_asc">Brand: A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Active Inventory Table */}
      <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
              BATCH INVENTORY LEDGER & STORAGE ALLOCATIONS
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Audited stock units organized strictly by First-Expiry, First-Out (FEFO) dispensing precedence
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">
              Showing <strong className="text-slate-900">{filteredLedger.length}</strong> of{" "}
              {ledger.length} Active Batches
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-600 hover:bg-transparent">
                <TableHead className="py-3 pl-4 text-xs font-bold text-slate-700">Medicine & SKU</TableHead>
                <TableHead className="py-3 text-xs font-bold text-slate-700">Category</TableHead>
                <TableHead className="py-3 text-xs font-bold text-slate-700">Batch Code</TableHead>
                <TableHead className="py-3 text-xs font-bold text-slate-700">Mfg / Expiry (FEFO Timeline)</TableHead>
                <TableHead className="py-3 text-xs font-bold text-slate-700">Storage Location</TableHead>
                <TableHead className="py-3 text-right text-xs font-bold text-slate-700">Stock (Units)</TableHead>
                <TableHead className="py-3 text-right text-xs font-bold text-slate-700">Unit Cost</TableHead>
                <TableHead className="py-3 text-right text-xs font-bold text-slate-700">Valuation</TableHead>
                <TableHead className="py-3 text-center text-xs font-bold text-slate-700">FEFO Priority</TableHead>
                <TableHead className="py-3 pr-4 text-right text-xs font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-14 text-center text-xs text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-[#0090FF]" />
                      <span>Loading audited FEFO stock ledger from server...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLedger.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-14 text-center text-xs text-slate-400">
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center gap-2">
                      <Boxes className="h-8 w-8 text-slate-300" />
                      <span className="font-semibold text-slate-700">No matching batch records found</span>
                      <p className="text-slate-400">
                        Try adjusting your filters or click <strong>&ldquo;Receive New Batch&rdquo;</strong> to record incoming consignments.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLedger.map((batch) => {
                  const shelfLifePercent = getShelfLifePercent(
                    batch.mfgDate,
                    batch.expiryDate,
                    batch.daysToExpiry
                  )

                  return (
                    <TableRow
                      key={batch.id}
                      className={`border-b border-slate-100 transition hover:bg-slate-50/70 ${
                        batch.isQuarantined
                          ? "bg-purple-50/30"
                          : batch.isExpired
                          ? "bg-rose-50/30"
                          : ""
                      }`}
                    >
                      {/* 1. Medicine & SKU */}
                      <TableCell className="py-3 pl-4">
                        <div className="leading-tight">
                          <button
                            type="button"
                            onClick={() => setPassportBatch(batch)}
                            className="text-left font-bold text-xs text-slate-900 hover:text-[#0090FF] hover:underline"
                            title="Click to view Batch Passport & GS1 Barcode"
                          >
                            {batch.brandName}
                          </button>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span className="font-mono text-slate-500 font-semibold">{batch.skuCode}</span>
                            <span>•</span>
                            <span className="max-w-[150px] truncate" title={batch.genericName}>
                              {batch.genericName}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Category */}
                      <TableCell className="py-3 text-xs text-slate-700">
                        <span
                          className="inline-block max-w-[150px] truncate rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                          title={batch.category}
                        >
                          {batch.category}
                        </span>
                      </TableCell>

                      {/* 3. Batch Code */}
                      <TableCell className="py-3 font-mono text-xs font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Barcode className="h-3.5 w-3.5 text-slate-400" />
                          <span>{batch.batchNumber}</span>
                        </div>
                      </TableCell>

                      {/* 4. Mfg / Expiry with FEFO Timeline */}
                      <TableCell className="py-3 text-xs">
                        <div className="w-[170px] space-y-1">
                          <div className="flex items-center justify-between font-mono text-[11px]">
                            <span className="text-slate-400 text-[10px]">Exp: {batch.expiryDate}</span>
                            <span
                              className={`font-bold ${
                                batch.isExpired
                                  ? "text-rose-600"
                                  : batch.daysToExpiry <= 60
                                  ? "text-red-600"
                                  : batch.daysToExpiry <= 180
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              {batch.isExpired
                                ? `Expired (${Math.abs(batch.daysToExpiry)}d ago)`
                                : `${batch.daysToExpiry}d left`}
                            </span>
                          </div>
                          {/* Shelf Life Progress Bar */}
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full transition-all duration-300 ${
                                batch.isExpired
                                  ? "bg-rose-500 w-full"
                                  : batch.daysToExpiry <= 60
                                  ? "bg-red-500"
                                  : batch.daysToExpiry <= 180
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${batch.isExpired ? 100 : shelfLifePercent}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* 5. Storage Location */}
                      <TableCell className="py-3 text-xs text-slate-600">
                        <div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`font-semibold ${
                                batch.isQuarantined ? "text-purple-700 font-bold" : "text-slate-800"
                              }`}
                            >
                              {batch.warehouseBin}
                            </span>
                            {batch.isQuarantined && (
                              <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[9px] px-1 py-0 h-4">
                                HOLD
                              </Badge>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                            {batch.storageCondition.includes("Cold") ? (
                              <span className="flex items-center gap-0.5 font-semibold text-[#0090FF]">
                                <Snowflake className="h-2.5 w-2.5" /> Cold Chain (2-8°C)
                              </span>
                            ) : (
                              <span>Ambient (&lt;25°C)</span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* 6. Stock Units */}
                      <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-900">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={batch.availableUnits === 0 ? "text-rose-500 font-extrabold" : ""}>
                            {batch.availableUnits.toLocaleString()}
                          </span>
                          <PermissionGate feature="Stock Inventory" action="edit">
<Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenStockAdjust(batch, "IN")}
                              className="h-5 w-5 p-0 text-slate-400 hover:text-emerald-600"
                              title="Quick Stock Adjustment (+ / -)"
                            >
                              <Pencil className="h-2.5 w-2.5" />
                            </Button>
</PermissionGate>
                        </div>
                      </TableCell>

                      {/* 7. Unit Cost */}
                      <TableCell className="py-3 text-right font-mono text-xs text-slate-600">
                        ৳{batch.unitPrice.toFixed(2)}
                      </TableCell>

                      {/* 8. Valuation */}
                      <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-900">
                        ৳{batch.totalValuation.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </TableCell>

                      {/* 9. FEFO Priority Status */}
                      <TableCell className="py-3 text-center text-xs">
                        {batch.isQuarantined ? (
                          <Badge
                            variant="outline"
                            className="border-purple-300 bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5"
                          >
                            <ShieldAlert className="mr-1 h-3 w-3" />
                            QUARANTINE
                          </Badge>
                        ) : batch.fefoStatus === "Expired" ? (
                          <Badge
                            variant="outline"
                            className="border-rose-300 bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5"
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            EXPIRED
                          </Badge>
                        ) : batch.fefoStatus === "Near Expiry" ? (
                          <Badge
                            variant="outline"
                            className="border-red-300 bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5"
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            Near Expiry (&le;60d)
                          </Badge>
                        ) : batch.fefoStatus === "Priority Out" ? (
                          <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5"
                          >
                            Priority Out (61-180d)
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Healthy Stock
                          </Badge>
                        )}
                      </TableCell>

                      {/* 10. Actions Dropdown */}
                      <TableCell className="py-3 pr-4 text-right text-xs">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 bg-white shadow-lg border border-slate-200">
                            <DropdownMenuLabel className="text-[10px] tracking-wider text-slate-400 uppercase">
                              Batch Operations
                            </DropdownMenuLabel>

                            <DropdownMenuItem
                              onClick={() => setPassportBatch(batch)}
                              className="cursor-pointer text-xs text-slate-700"
                            >
                              <Barcode className="mr-2 h-3.5 w-3.5 text-blue-600" />
                              View Batch Passport & Label
                            </DropdownMenuItem>

                            <PermissionGate feature="Stock Inventory" action="edit">
<DropdownMenuItem
                                onClick={() => handleOpenEdit(batch)}
                                className="cursor-pointer text-xs text-slate-700"
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5 text-slate-500" />
                                Edit Batch Details
                              </DropdownMenuItem>
</PermissionGate>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => handleOpenStockAdjust(batch, "IN")}
                              className="cursor-pointer text-xs text-emerald-600 font-medium"
                            >
                              <ArrowDownRight className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                              Stock Inward (+)
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleOpenStockAdjust(batch, "OUT")}
                              className="cursor-pointer text-xs text-amber-600 font-medium"
                            >
                              <ArrowUpRight className="mr-2 h-3.5 w-3.5 text-amber-600" />
                              Stock Outward / Dispatch (-)
                            </DropdownMenuItem>

                            <PermissionGate feature="Stock Inventory" action="special">
<DropdownMenuItem
                                onClick={() => handleOpenStockAdjust(batch, "DAMAGE")}
                                className="cursor-pointer text-xs text-rose-600 font-medium"
                              >
                                <AlertTriangle className="mr-2 h-3.5 w-3.5 text-rose-600" />
                                Write-off (Damaged/Broken)
                              </DropdownMenuItem>
</PermissionGate>

                            <DropdownMenuSeparator />

                            <PermissionGate feature="Stock Inventory" action="special">
<DropdownMenuItem
                                onClick={() => handleOpenQuarantine(batch)}
                                className={`cursor-pointer text-xs font-semibold ${
                                  batch.isQuarantined ? "text-emerald-700" : "text-purple-700"
                                }`}
                              >
                                <ShieldAlert className="mr-2 h-3.5 w-3.5" />
                                {batch.isQuarantined ? "Release from Quarantine" : "Quarantine Batch (Hold)"}
                              </DropdownMenuItem>
</PermissionGate>

                            <DropdownMenuSeparator />

                            <PermissionGate feature="Stock Inventory" action="delete">
<DropdownMenuItem
                                onClick={() => handleOpenDeleteModal(batch)}
                                className="cursor-pointer text-xs text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5 text-rose-600" />
                                Delete Batch Record
                              </DropdownMenuItem>
</PermissionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* 5. Add / Edit Batch Dialog */}
      <Dialog open={isAddBatchOpen} onOpenChange={setIsAddBatchOpen}>
        <DialogContent className="rounded-2xl bg-white sm:max-w-[620px] shadow-xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900">
              {editingBatch ? "Edit Inventory Batch Record" : "Receive Inward Stock Batch"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Log pharmaceutical consignment with strict First-Expiry, First-Out (FEFO) audit compliance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBatch} className="space-y-4 py-2 text-xs">
            {/* Row 1: Brand & Generic */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Commercial Brand Name *</Label>
                <Input
                  placeholder="e.g. Ciprocin 500mg Tab"
                  value={formData.brandName}
                  onChange={(e) => {
                    setFormData({ ...formData, brandName: e.target.value })
                    if (formErrors.brandName) setFormErrors({ ...formErrors, brandName: "" })
                  }}
                  className={`h-8 text-xs font-semibold ${formErrors.brandName ? "border-rose-500" : ""}`}
                />
                {formErrors.brandName && (
                  <span className="text-[10px] text-rose-600">{formErrors.brandName}</span>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Generic Composition *</Label>
                <Input
                  placeholder="e.g. Ciprofloxacin HCl"
                  value={formData.genericName}
                  onChange={(e) => {
                    setFormData({ ...formData, genericName: e.target.value })
                    if (formErrors.genericName) setFormErrors({ ...formErrors, genericName: "" })
                  }}
                  className={`h-8 text-xs ${formErrors.genericName ? "border-rose-500" : ""}`}
                />
                {formErrors.genericName && (
                  <span className="text-[10px] text-rose-600">{formErrors.genericName}</span>
                )}
              </div>
            </div>

            {/* Row 2: Category, Batch Code */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Therapeutic Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] text-xs">
                    <SelectGroup>
                      <SelectLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Infectious Diseases
                      </SelectLabel>
                      {PHARMA_CATEGORIES.generalInfectious.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Systemic & Chronic
                      </SelectLabel>
                      {PHARMA_CATEGORIES.systemicTherapies.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Specialty & Organ Specific
                      </SelectLabel>
                      {PHARMA_CATEGORIES.specialtyClinicals.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Nutrition & Hospital
                      </SelectLabel>
                      {PHARMA_CATEGORIES.nutritionAndSupplements.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Batch Code Number *</Label>
                <Input
                  placeholder="e.g. BX-2026-412"
                  value={formData.batchNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, batchNumber: e.target.value })
                    if (formErrors.batchNumber) setFormErrors({ ...formErrors, batchNumber: "" })
                  }}
                  className={`h-8 font-mono text-xs font-bold ${formErrors.batchNumber ? "border-rose-500" : ""}`}
                />
                {formErrors.batchNumber && (
                  <span className="text-[10px] text-rose-600">{formErrors.batchNumber}</span>
                )}
              </div>
            </div>

            {/* Row 3: Dates (Mfg & Expiry) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Manufacturing Date *</Label>
                <Input
                  type="date"
                  value={formData.mfgDate}
                  onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                  className={`h-8 font-mono text-xs ${formErrors.mfgDate ? "border-rose-500" : ""}`}
                />
                {formErrors.mfgDate && (
                  <span className="text-[10px] text-rose-600">{formErrors.mfgDate}</span>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Expiry Date (FEFO Horizon) *</Label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => {
                    setFormData({ ...formData, expiryDate: e.target.value })
                    if (formErrors.expiryDate) setFormErrors({ ...formErrors, expiryDate: "" })
                  }}
                  className={`h-8 font-mono text-xs font-bold ${formErrors.expiryDate ? "border-rose-500 text-rose-600" : ""}`}
                />
                {formErrors.expiryDate && (
                  <span className="text-[10px] text-rose-600 font-medium">{formErrors.expiryDate}</span>
                )}
              </div>
            </div>

            {/* Row 4: Stock & Unit Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Available Inward Units *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="1000"
                  value={formData.availableUnits}
                  onChange={(e) => setFormData({ ...formData, availableUnits: e.target.value })}
                  className="h-8 font-mono text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Unit Cost Price (৳ BDT) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="25.50"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  className="h-8 font-mono text-xs font-bold"
                />
              </div>
            </div>

            {/* Row 5: Storage Bin & Environment */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Warehouse Storage Bay / Shelf *</Label>
                <Input
                  placeholder="e.g. Bay 01 - Shelf A or Cold Room A"
                  value={formData.warehouseBin}
                  onChange={(e) => setFormData({ ...formData, warehouseBin: e.target.value })}
                  className="h-8 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Storage Environment *</Label>
                <Select
                  value={formData.storageCondition}
                  onValueChange={(val: any) => setFormData({ ...formData, storageCondition: val })}
                >
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Controlled Ambient (<25°C)">
                      Controlled Ambient (&lt;25°C)
                    </SelectItem>
                    <SelectItem value="Cold Chain (2-8°C)">
                      Cold Chain (2-8°C) [Biologics/Vaccines]
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddBatchOpen(false)}
                disabled={isSavingBatch}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingBatch}
                className="h-9 bg-[#0090FF] text-xs font-bold text-white hover:bg-[#0080e5]"
              >
                {isSavingBatch
                  ? "Saving to Ledger..."
                  : editingBatch
                  ? "Update Batch Record"
                  : "Confirm Inward Consignment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Quick Stock Adjustment Dialog */}
      <Dialog
        open={Boolean(stockAdjustTarget)}
        onOpenChange={(open) => !open && setStockAdjustTarget(null)}
      >
        <DialogContent className="rounded-2xl bg-white sm:max-w-[440px] shadow-xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900">
              Stock Reconcile & Adjustment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {stockAdjustTarget?.brandName} ({stockAdjustTarget?.batchNumber})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplyStockAdjustment} className="space-y-3.5 py-2 text-xs">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <span className="text-slate-500 font-medium">Current Stock in Hand:</span>
              <strong className="font-mono text-sm font-extrabold text-slate-900">
                {stockAdjustTarget?.availableUnits.toLocaleString()} Units
              </strong>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Adjustment Type</Label>
              <Select
                value={adjustType}
                onValueChange={(val: any) => setAdjustType(val)}
              >
                <SelectTrigger className="h-9 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="IN" className="text-emerald-600 font-medium">
                    Stock Inward / Restock Correction (+)
                  </SelectItem>
                  <SelectItem value="OUT" className="text-amber-600 font-medium">
                    Stock Outward / Dispatch Deduction (-)
                  </SelectItem>
                  <SelectItem value="DAMAGE" className="text-rose-600 font-medium">
                    Damage / Spoilage Write-off (-)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Adjustment Quantity (Units) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                required
                className="h-9 font-mono text-sm font-bold"
              />
            </div>

            {/* Live New Stock Projection */}
            {adjustQty && Number(adjustQty) > 0 && stockAdjustTarget && (
              <div className="rounded-lg border border-slate-200 bg-blue-50/50 p-2.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Resulting Stock:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {adjustType === "IN"
                      ? (stockAdjustTarget.availableUnits + Number(adjustQty)).toLocaleString()
                      : Math.max(0, stockAdjustTarget.availableUnits - Number(adjustQty)).toLocaleString()}{" "}
                    Units
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Operator Justification Note (21 CFR Part 11)</Label>
              <Textarea
                placeholder="Specify reason: physical discrepancy, offloading breakage, sampling..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStockAdjustTarget(null)}
                disabled={isAdjusting}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAdjusting}
                className="h-9 bg-[#0090FF] text-xs font-bold text-white hover:bg-[#0080e5]"
              >
                {isAdjusting ? "Recording Adjustment..." : "Authorize Adjustment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. Quarantine / Release Modal (Special RBAC Action) */}
      <Dialog
        open={Boolean(quarantineTarget)}
        onOpenChange={(open) => !open && setQuarantineTarget(null)}
      >
        <DialogContent className="rounded-2xl bg-white sm:max-w-[480px] shadow-xl border border-slate-200">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-50 p-1.5 text-purple-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-extrabold text-slate-900">
                {quarantineAction === "QUARANTINE" ? "Quarantine Batch Hold" : "Release from Quarantine"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              {quarantineTarget?.brandName} (Batch: {quarantineTarget?.batchNumber} • {quarantineTarget?.availableUnits} units)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplyQuarantine} className="space-y-3.5 py-2 text-xs">
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-xs leading-relaxed text-purple-900">
              {quarantineAction === "QUARANTINE" ? (
                <>
                  <strong>Statutory Notice:</strong> Quarantining this batch immediately removes all{" "}
                  <strong>{quarantineTarget?.availableUnits} units</strong> from sales order dispatch and
                  flags the physical bin in warehouse pick routes.
                </>
              ) : (
                <>
                  <strong>QA Clearance Notice:</strong> Releasing this batch verifies quality compliance and
                  restores units back into FEFO active order dispatch.
                </>
              )}
            </div>

            {quarantineAction === "QUARANTINE" ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Quarantine Reason Category *</Label>
                  <Select value={quarantineReason} onValueChange={setQuarantineReason}>
                    <SelectTrigger className="h-9 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Packaging seal compromised during transport">
                        Packaging seal compromised during transport
                      </SelectItem>
                      <SelectItem value="Cold chain temperature excursion breach">
                        Cold chain temperature excursion breach (&gt; 8°C)
                      </SelectItem>
                      <SelectItem value="Batch stability threshold breach">
                        Batch stability threshold breach
                      </SelectItem>
                      <SelectItem value="Quality control inspection test hold">
                        Quality control inspection test hold
                      </SelectItem>
                      <SelectItem value="Statutory DGDA / Manufacturer recall notice">
                        Statutory DGDA / Manufacturer recall notice
                      </SelectItem>
                      <SelectItem value="Customer complaint / suspected defect">
                        Customer complaint / suspected defect
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Quarantine Bay Destination</Label>
                  <Input
                    value={quarantineBay}
                    onChange={(e) => setQuarantineBay(e.target.value)}
                    placeholder="Quarantine Bay Q-01"
                    className="h-9 font-medium"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Target Restored Pick Bay</Label>
                <Input
                  value={quarantineBay}
                  onChange={(e) => setQuarantineBay(e.target.value)}
                  placeholder="Bay 01 - Shelf A"
                  className="h-9 font-medium"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Detailed Quality Officer Justification *
              </Label>
              <Textarea
                placeholder="Enter mandatory 21 CFR Part 11 audit observation..."
                value={quarantineCustomReason}
                onChange={(e) => setQuarantineCustomReason(e.target.value)}
                rows={3}
                required
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQuarantineTarget(null)}
                  disabled={isQuarantining}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
              <PermissionGate feature="Stock Inventory" action="special">
<Button
                  type="submit"
                  disabled={isQuarantining}
                  className={`h-9 text-xs font-bold text-white ${
                    quarantineAction === "QUARANTINE"
                      ? "bg-purple-700 hover:bg-purple-800"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isQuarantining
                    ? "Processing..."
                    : quarantineAction === "QUARANTINE"
                    ? "Authorize Quarantine Hold"
                    : "Authorize QA Release"}
                </Button>
</PermissionGate>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 8. Batch Passport & GS1 Barcode Modal */}
      <Dialog
        open={Boolean(passportBatch)}
        onOpenChange={(open) => !open && setPassportBatch(null)}
      >
        <DialogContent className="rounded-2xl bg-white sm:max-w-[560px] shadow-2xl border border-slate-200">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-blue-50 p-2 text-[#0090FF]">
                  <Barcode className="h-5 w-5" />
                </span>
                <div>
                  <DialogTitle className="text-base font-extrabold text-slate-900">
                    Pharmaceutical Batch Passport
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    GS1 DataMatrix & Audited Consignment Passport
                  </DialogDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`font-mono text-[10px] font-bold ${
                  passportBatch?.isQuarantined
                    ? "border-purple-300 bg-purple-50 text-purple-700"
                    : passportBatch?.isExpired
                    ? "border-rose-300 bg-rose-50 text-rose-700"
                    : "border-emerald-300 bg-emerald-50 text-emerald-700"
                }`}
              >
                {passportBatch?.isQuarantined
                  ? "QUARANTINE"
                  : passportBatch?.fefoStatus}
              </Badge>
            </div>
          </DialogHeader>

          {passportBatch && (
            <div className="space-y-4 py-2 text-xs">
              {/* Barcode Simulated Strip */}
              <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-center text-white">
                <div className="flex items-center justify-center gap-1 py-1">
                  {Array.from({ length: 42 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-10 ${
                        i % 5 === 0 ? "w-1 bg-white" : i % 3 === 0 ? "w-1.5 bg-slate-300" : "w-0.5 bg-slate-400"
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-2 font-mono text-[11px] tracking-widest text-slate-300">
                  (01) {passportBatch.skuCode} (10) {passportBatch.batchNumber} (17){" "}
                  {passportBatch.expiryDate.replace(/-/g, "")}
                </div>
              </div>

              {/* Passport Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Commercial Brand
                  </span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{passportBatch.brandName}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Generic Formulation
                  </span>
                  <div className="font-medium text-slate-700 text-xs mt-0.5">{passportBatch.genericName}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Batch Code
                  </span>
                  <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">{passportBatch.batchNumber}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    SKU Code
                  </span>
                  <div className="font-mono text-slate-600 text-xs mt-0.5">{passportBatch.skuCode}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Manufacturing Date
                  </span>
                  <div className="font-mono text-slate-800 text-xs mt-0.5">{passportBatch.mfgDate}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Expiry Date
                  </span>
                  <div className="font-mono font-bold text-rose-600 text-xs mt-0.5">
                    {passportBatch.expiryDate} ({passportBatch.daysToExpiry} days left)
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Stock in Hand
                  </span>
                  <div className="font-mono font-extrabold text-slate-900 text-sm mt-0.5">
                    {passportBatch.availableUnits.toLocaleString()} Units
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Total Valuation
                  </span>
                  <div className="font-mono font-extrabold text-[#0090FF] text-sm mt-0.5">
                    ৳{passportBatch.totalValuation.toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Warehouse Bin
                  </span>
                  <div className="font-medium text-slate-800 text-xs mt-0.5">{passportBatch.warehouseBin}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Storage Condition
                  </span>
                  <div className="font-semibold text-slate-800 text-xs mt-0.5 flex items-center gap-1">
                    {passportBatch.storageCondition.includes("Cold") && (
                      <Snowflake className="h-3 w-3 text-[#0090FF]" />
                    )}
                    {passportBatch.storageCondition}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    window.print()
                  }}
                  className="h-8 gap-1.5 text-xs font-semibold"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  Print Label Tag
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPassportBatch(null)
                      handleOpenEdit(passportBatch)
                    }}
                    className="h-8 text-xs font-semibold"
                  >
                    Edit Batch
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setPassportBatch(null)}
                    className="h-8 bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Close Passport
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 9. Global Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDeleteBatch}
        title="Delete Inventory Batch Record"
        description="Are you sure you want to permanently delete this inventory batch record? This action will remove the stock record from the FEFO ledger and log a critical 21 CFR Part 11 audit event."
        itemName={
          batchToDelete
            ? `${batchToDelete.brandName} (Batch: ${batchToDelete.batchNumber} • ${batchToDelete.availableUnits} units)`
            : undefined
        }
        confirmText="Delete Batch"
        cancelText="Cancel"
        isDeleting={isDeletingBatch}
      />
    </div>
  )
}
