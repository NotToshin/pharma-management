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
  Printer,
  Download,
  Search,
  Filter,
  Plus,
  Pencil,
  Receipt,
  Wallet,
  Landmark,
  Trash2,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  XCircle,
  Building2,
  Stethoscope,
  Users,
  Layers,
  ArrowUpRight,
  Calculator,
} from "lucide-react"

export interface ExpenseVoucher {
  id: string
  voucherNo: string
  payeeName: string
  payeeType?: string
  wholesalerId?: string | null
  poNumber?: string | null
  category: string
  fundingSource: "Cash Safe" | "Bank Account"
  sourceDetail: string
  financialAccountId?: string | null
  paymentMethod?: string
  chequeNumber?: string | null
  grossAmount?: number | null
  tdsRate?: number | null
  tdsAmount?: number | null
  vdsRate?: number | null
  vdsAmount?: number | null
  netAmount?: number | null
  amount: number
  paymentDate: string
  notes?: string | null
  lineItems?: ExpenseVoucherLineItem[]
  status: "Draft" | "Pending Approval" | "Approved" | "Disbursed" | "Rejected"
  rejectionReason?: string | null
  preparedBy?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  disbursedBy?: string | null
  disbursedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ExpenseVoucherLineItem {
  itemName: string
  quantity: number
  unitCostBDT?: number | null
  lineTotalBDT?: number | null
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatParticularsSummary(lineItems: ExpenseVoucherLineItem[]): string {
  return lineItems.map((i) => `${i.itemName} × ${i.quantity}`).join(", ")
}

function buildParticularsTableRows(
  record: ExpenseVoucher,
  lineItems: ExpenseVoucherLineItem[],
  gross: number
): string {
  if (lineItems.length > 0) {
    return lineItems
      .map((item) => {
        const lineAmt =
          item.lineTotalBDT != null
            ? item.lineTotalBDT
            : item.unitCostBDT != null
              ? item.unitCostBDT * item.quantity
              : null
        return `
                <tr>
                  <td>
                    <strong>${escapeHtml(item.itemName)}</strong>
                    <div style="color: #475569; margin-top: 4px;">Quantity: ${item.quantity}</div>
                  </td>
                  <td style="text-align: right; font-family: monospace; font-weight: 600;">
                    ${lineAmt != null ? `৳${lineAmt.toLocaleString("en-IN")}` : "—"}
                  </td>
                </tr>`
      })
      .join("")
  }

  return `
                <tr>
                  <td>
                    <strong>Disbursement to ${escapeHtml(record.payeeName)}</strong>
                    <div style="color: #475569; margin-top: 4px;">General operating expenditure</div>
                  </td>
                  <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 13px;">
                    ৳${gross.toLocaleString("en-IN")}/-
                  </td>
                </tr>`
}

export interface FinancialAccount {
  id: string
  accountTitle: string
  category: "BANK" | "CASH"
  institution: string
  accountNumber: string
  branch: string
  accountClass: string
  balance: number
  isActive: boolean
}

export interface Wholesaler {
  id: string
  wholesalerCode: string
  name: string
  contactPerson: string
  phone: string
  territory: string
}

export interface VoucherMetrics {
  totalVouchers: number
  totalDisbursedBDT: number
  totalPendingBDT: number
  totalGrossBDT: number
  totalTdsWithheldBDT: number
  totalVdsWithheldBDT: number
  disbursedCount: number
  pendingCount: number
  categoryBreakdown: Array<{ category: string; count: number; amount: number }>
  fundingSourceBreakdown: Array<{ source: string; count: number; amount: number }>
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

export default function GeneralPaymentsPage() {
  const [vouchers, setVouchers] = React.useState<ExpenseVoucher[]>([])
  const [accounts, setAccounts] = React.useState<FinancialAccount[]>([])
  const [wholesalers, setWholesalers] = React.useState<Wholesaler[]>([])
  const [metrics, setMetrics] = React.useState<VoucherMetrics | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Filters & Tabs
  const [activeTab, setActiveTab] = React.useState<"all" | "pending" | "disbursed" | "vendor" | "doctor" | "staff">("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [fundingSourceFilter, setFundingSourceFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeTab, categoryFilter, fundingSourceFilter, statusFilter])

  // Modal Form State
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [isSubmittingForm, setIsSubmittingForm] = React.useState(false)

  const [formData, setFormData] = React.useState({
    voucherNo: "",
    payeeName: "",
    payeeType: "General / Other",
    wholesalerId: "",
    poNumber: "",
    category: "General Operating Expense",
    fundingSource: "Bank Account" as "Cash Safe" | "Bank Account",
    sourceDetail: "",
    financialAccountId: "",
    paymentMethod: "BEFTN / RTGS",
    chequeNumber: "",
    grossAmount: 0,
    tdsRate: 0,
    vdsRate: 0,
    amount: 0,
    paymentDate: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    notes: "",
    status: "Disbursed" as "Draft" | "Pending Approval" | "Approved" | "Disbursed" | "Rejected",
    preparedBy: "Finance Officer",
  })

  // Authorization / Maker-Checker Modal
  const [authTarget, setAuthTarget] = React.useState<ExpenseVoucher | null>(null)
  const [isAuthOpen, setIsAuthOpen] = React.useState(false)
  const [authAction, setAuthAction] = React.useState<"approve" | "disburse" | "reject">("disburse")
  const [authChequeNo, setAuthChequeNo] = React.useState("")
  const [authAccountId, setAuthAccountId] = React.useState("")
  const [authRejectionReason, setAuthRejectionReason] = React.useState("")
  const [isAuthorizing, setIsAuthorizing] = React.useState(false)

  // Print Preview Modal State
  const [printTarget, setPrintTarget] = React.useState<ExpenseVoucher | null>(null)
  const [printParticulars, setPrintParticulars] = React.useState<ExpenseVoucherLineItem[]>([])
  const [isPrintOpen, setIsPrintOpen] = React.useState(false)

  // Global Delete Modal State
  const [voucherToDelete, setVoucherToDelete] = React.useState<ExpenseVoucher | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [isDeletingVoucher, setIsDeletingVoucher] = React.useState(false)

  // Fetch initial data
  const loadData = React.useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const [vouchersRes, metricsRes, accountsRes, wholesalersRes] = await Promise.all([
        apiFetch("/payments"),
        apiFetch("/payments/metrics"),
        apiFetch("/account-ledger/accounts"),
        apiFetch("/wholesalers"),
      ])

      if (vouchersRes.ok) {
        const json = await vouchersRes.json()
        setVouchers(json.data || [])
      }

      if (metricsRes.ok) {
        const json = await metricsRes.json()
        setMetrics(json.data || null)
      }

      if (accountsRes.ok) {
        const json = await accountsRes.json()
        setAccounts(json.data || [])
      }

      if (wholesalersRes.ok) {
        const json = await wholesalersRes.json()
        setWholesalers(json.data || [])
      }
    } catch (err) {
      console.error("Failed to load payment data:", err)
      toast.error("Failed to load expense and payment vouchers from database.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const resolveExpenditureParticulars = React.useCallback(
    async (record: ExpenseVoucher): Promise<ExpenseVoucherLineItem[]> => {
      if (record.lineItems && record.lineItems.length > 0) {
        return record.lineItems
      }

      const poRef = record.poNumber?.trim()
      if (!poRef) return []

      try {
        const res = await apiFetch(
          `/procurement/orders?search=${encodeURIComponent(poRef)}`
        )
        if (!res.ok) return []
        const json = await res.json()
        const orders: Array<{
          poNumber?: string
          items?: Array<{
            drugName: string
            quantityOrdered: number
            unitCostBDT?: number
            totalCostBDT?: number
          }>
        }> = json.data || []
        const po =
          orders.find((o) => o.poNumber === poRef) || orders[0]
        if (!po?.items?.length) return []

        return po.items.map((it) => ({
          itemName: it.drugName,
          quantity: it.quantityOrdered,
          unitCostBDT: it.unitCostBDT,
          lineTotalBDT: it.totalCostBDT,
        }))
      } catch {
        return []
      }
    },
    []
  )

  React.useEffect(() => {
    if (!isPrintOpen || !printTarget) {
      setPrintParticulars([])
      return
    }

    let cancelled = false
    resolveExpenditureParticulars(printTarget).then((items) => {
      if (!cancelled) setPrintParticulars(items)
    })

    return () => {
      cancelled = true
    }
  }, [isPrintOpen, printTarget, resolveExpenditureParticulars])

  // Recalculate TDS, VDS and Net Amount dynamically in Form
  const handleTaxCalculation = (
    gross: number,
    tdsR: number,
    vdsR: number
  ) => {
    const grossVal = Math.max(0, gross)
    const tdsAmt = Number(((grossVal * (tdsR || 0)) / 100).toFixed(2))
    const vdsAmt = Number(((grossVal * (vdsR || 0)) / 100).toFixed(2))
    const net = Number(Math.max(0, grossVal - tdsAmt - vdsAmt).toFixed(2))

    setFormData((prev) => ({
      ...prev,
      grossAmount: grossVal,
      tdsRate: tdsR,
      vdsRate: vdsR,
      amount: net > 0 ? net : grossVal,
    }))
  }

  // Hidden print iframe trigger
  const handlePrint = async (
    record: ExpenseVoucher,
    particularsOverride?: ExpenseVoucherLineItem[]
  ) => {
    const lineItems =
      particularsOverride ?? (await resolveExpenditureParticulars(record))

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

    const gross = record.grossAmount || record.amount
    const tds = record.tdsAmount || 0
    const vds = record.vdsAmount || 0
    const net = record.amount

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Voucher_${record.voucherNo}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            * {
              box-sizing: border-box;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            body {
              margin: 0;
              padding: 0;
              color: #0f172a;
              background: #fff;
              font-size: 13px;
              line-height: 1.5;
            }
            .voucher-box {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 24px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
            }
            .company-name {
              font-size: 20px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: -0.5px;
            }
            .sub-title {
              font-size: 11px;
              color: #64748b;
              margin-top: 2px;
            }
            .voucher-tag {
              text-align: right;
            }
            .tag-badge {
              display: inline-block;
              font-size: 11px;
              font-weight: 800;
              border: 1px solid #0f172a;
              padding: 2px 8px;
              text-transform: uppercase;
            }
            .voucher-num {
              font-family: monospace;
              font-weight: 700;
              color: #0090FF;
              margin-top: 4px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 14px;
              margin-top: 16px;
            }
            .meta-label {
              font-size: 10px;
              text-transform: uppercase;
              font-weight: 700;
              color: #64748b;
            }
            .meta-val {
              font-weight: 600;
              font-size: 13px;
              margin-top: 2px;
            }
            .particulars-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .particulars-table th {
              background: #f1f5f9;
              text-align: left;
              padding: 10px 12px;
              border: 1px solid #cbd5e1;
              font-size: 11px;
              text-transform: uppercase;
            }
            .particulars-table td {
              padding: 12px;
              border: 1px solid #cbd5e1;
              font-size: 12px;
            }
            .tax-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            .tax-table td {
              padding: 6px 12px;
              font-size: 12px;
              border-bottom: 1px dashed #e2e8f0;
            }
            .amount-box {
              margin-top: 16px;
              padding: 12px 16px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .signatures {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              padding: 0 20px;
            }
            .sig-block {
              text-align: center;
              width: 180px;
            }
            .sig-line {
              border-top: 1px solid #475569;
              margin-bottom: 6px;
            }
            .sig-title {
              font-weight: 700;
              font-size: 11px;
            }
            .sig-sub {
              font-size: 10px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="voucher-box">
            <div class="header">
              <div>
                <div class="company-name">AK PHARMA MANAGEMENT</div>
                <div class="sub-title">Corporate Treasury, Supplier Settlements & Operational Disbursements</div>
                <div class="sub-title">Plot 14, Sector 7, Uttara Commercial Area, Dhaka • DGDA Lic: DL-PH-2026-88</div>
              </div>
              <div class="voucher-tag">
                <div class="tag-badge">Official Disbursement Voucher</div>
                <div class="voucher-num">${record.voucherNo}</div>
                <div class="sub-title" style="font-family: monospace;">Date: ${record.paymentDate}</div>
              </div>
            </div>

            <div class="meta-grid">
              <div>
                <div class="meta-label">Payee / Beneficiary</div>
                <div class="meta-val">${record.payeeName}</div>
                <div class="meta-label" style="margin-top: 8px;">Classification / Payee Type</div>
                <div class="meta-val">${record.category} (${record.payeeType || "Vendor / General"})</div>
                ${record.poNumber ? `<div class="meta-label" style="margin-top: 8px;">Purchase Order Reference</div><div class="meta-val">${record.poNumber}</div>` : ""}
              </div>
              <div>
                <div class="meta-label">Funding Account / Source</div>
                <div class="meta-val">${record.sourceDetail} (${record.fundingSource})</div>
                <div class="meta-label" style="margin-top: 8px;">Payment Mode & Instrument #</div>
                <div class="meta-val">${record.paymentMethod || "Cash"} ${record.chequeNumber ? `• Cheque/Ref: ${record.chequeNumber}` : ""}</div>
                <div class="meta-label" style="margin-top: 8px;">Voucher Status</div>
                <div class="meta-val" style="color: ${record.status === "Disbursed" ? "#059669" : "#d97706"}; font-weight: 700;">
                  ${record.status === "Disbursed" ? "Settled & Disbursed" : record.status}
                </div>
              </div>
            </div>

            <table class="particulars-table">
              <thead>
                <tr>
                  <th>Item / Product Purchased</th>
                  ${lineItems.length > 0 ? `<th style="width: 90px; text-align: center;">Qty</th>` : ""}
                  <th style="width: 160px; text-align: right;">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody>
                ${
                  lineItems.length > 0
                    ? lineItems
                        .map((item) => {
                          const lineAmt =
                            item.lineTotalBDT != null
                              ? item.lineTotalBDT
                              : item.unitCostBDT != null
                                ? item.unitCostBDT * item.quantity
                                : null
                          return `
                <tr>
                  <td><strong>${escapeHtml(item.itemName)}</strong></td>
                  <td style="text-align: center; font-family: monospace; font-weight: 600;">${item.quantity}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 600;">
                    ${lineAmt != null ? `৳${lineAmt.toLocaleString("en-IN")}` : "—"}
                  </td>
                </tr>`
                        })
                        .join("")
                    : buildParticularsTableRows(record, lineItems, gross)
                }
              </tbody>
            </table>

            <table class="tax-table">
              <tbody>
                <tr>
                  <td style="color: #64748b;">Gross Bill Value</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 600;">৳${gross.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Less: Tax Deducted at Source (TDS ${record.tdsRate || 0}%)</td>
                  <td style="text-align: right; font-family: monospace; color: #dc2626;">- ৳${tds.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Less: VAT Deducted at Source (VDS ${record.vdsRate || 0}%)</td>
                  <td style="text-align: right; font-family: monospace; color: #dc2626;">- ৳${vds.toLocaleString("en-IN")}</td>
                </tr>
                <tr style="font-weight: 700; background: #f8fafc; font-size: 13px;">
                  <td>Net Disbursed Payable Amount</td>
                  <td style="text-align: right; font-family: monospace; color: #059669; font-size: 15px;">৳${net.toLocaleString("en-IN")}/-</td>
                </tr>
              </tbody>
            </table>

            <div class="amount-box">
              <span style="color: #64748b; font-size: 11px; font-weight: 600;">Net Amount in Words:</span>
              <span style="font-weight: 700; font-style: italic;">${numberToWordsBDT(net)}</span>
            </div>

            <div class="signatures">
              <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-title">${record.preparedBy || "Accounts Officer"}</div>
                <div class="sig-sub">Prepared By (Maker)</div>
              </div>
              <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-title">${record.approvedBy || "Finance Controller"}</div>
                <div class="sig-sub">Audit & Tax Check</div>
              </div>
              <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-title">${record.disbursedBy || "Managing Director / CEO"}</div>
                <div class="sig-sub">Final Cheque Sign-off</div>
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

  const handleOpenCreate = async () => {
    setEditingId(null)
    let nextSerial = "AKP-EXP-2026-0001"

    try {
      const res = await apiFetch("/payments/next-number")
      if (res.ok) {
        const data = await res.json()
        nextSerial = data.data?.nextVoucherNo || nextSerial
      }
    } catch {
      nextSerial = `AKP-EXP-2026-${String(vouchers.length + 1).padStart(4, "0")}`
    }

    // Default account if available
    const defaultAcc = accounts.find((a) => a.category === "BANK") || accounts[0]

    setFormData({
      voucherNo: nextSerial,
      payeeName: "",
      payeeType: "Wholesaler / Vendor",
      wholesalerId: "",
      poNumber: "",
      category: "Wholesaler Settlement",
      fundingSource: defaultAcc?.category === "CASH" ? "Cash Safe" : "Bank Account",
      sourceDetail: defaultAcc?.institution || defaultAcc?.accountTitle || "",
      financialAccountId: defaultAcc?.id || "",
      paymentMethod: defaultAcc?.category === "CASH" ? "Cash" : "BEFTN / RTGS",
      chequeNumber: "",
      grossAmount: 0,
      tdsRate: 0,
      vdsRate: 0,
      amount: 0,
      paymentDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      notes: "",
      status: "Disbursed",
      preparedBy: "Finance Officer",
    })

    setIsFormOpen(true)
  }

  const handleOpenEdit = (v: ExpenseVoucher) => {
    setEditingId(v.id)
    setFormData({
      voucherNo: v.voucherNo,
      payeeName: v.payeeName,
      payeeType: v.payeeType || "General / Other",
      wholesalerId: v.wholesalerId || "",
      poNumber: v.poNumber || "",
      category: v.category,
      fundingSource: v.fundingSource,
      sourceDetail: v.sourceDetail,
      financialAccountId: v.financialAccountId || "",
      paymentMethod: v.paymentMethod || "Cash",
      chequeNumber: v.chequeNumber || "",
      grossAmount: v.grossAmount || v.amount,
      tdsRate: v.tdsRate || 0,
      vdsRate: v.vdsRate || 0,
      amount: v.amount,
      paymentDate: v.paymentDate,
      notes: v.notes || "",
      status: v.status,
      preparedBy: v.preparedBy || "Finance Officer",
    })
    setIsFormOpen(true)
  }

  const handleSelectWholesaler = (wholesalerId: string) => {
    const found = wholesalers.find((w) => w.id === wholesalerId)
    if (found) {
      setFormData((prev) => ({
        ...prev,
        payeeName: found.name,
        wholesalerId: found.id,
        category: "Wholesaler Settlement",
        notes: `Procurement clearance for ${found.name} (${found.wholesalerCode}).`,
      }))
    }
  }

  const selectedWholesalerSelectValue =
    formData.wholesalerId ||
    wholesalers.find((w) => w.name === formData.payeeName)?.id ||
    ""

  const handleSelectFinancialAccount = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId)
    if (acc) {
      setFormData((prev) => ({
        ...prev,
        financialAccountId: acc.id,
        fundingSource: acc.category === "CASH" ? "Cash Safe" : "Bank Account",
        sourceDetail: `${acc.institution} (${acc.branch})`,
        paymentMethod: acc.category === "CASH" ? "Cash" : (prev.paymentMethod === "Cash" ? "BEFTN / RTGS" : prev.paymentMethod),
      }))
    }
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.payeeName.trim()) {
      toast.error("Payee / Beneficiary name is required")
      return
    }

    if (formData.amount <= 0) {
      toast.error("A valid positive amount is required")
      return
    }

    setIsSubmittingForm(true)
    const toastId = toast.loading(editingId ? "Updating payment voucher..." : "Creating payment voucher...")

    try {
      const payload = {
        voucherNo: formData.voucherNo,
        payeeName: formData.payeeName.trim(),
        payeeType: formData.payeeType,
        wholesalerId: formData.wholesalerId || undefined,
        poNumber: formData.poNumber ? formData.poNumber.trim() : undefined,
        category: formData.category,
        fundingSource: formData.fundingSource,
        sourceDetail: formData.sourceDetail,
        financialAccountId: formData.financialAccountId || undefined,
        paymentMethod: formData.paymentMethod,
        chequeNumber: formData.chequeNumber ? formData.chequeNumber.trim() : undefined,
        grossAmount: formData.grossAmount > 0 ? formData.grossAmount : formData.amount,
        tdsRate: Number(formData.tdsRate) || 0,
        vdsRate: Number(formData.vdsRate) || 0,
        amount: Number(formData.amount),
        paymentDate: formData.paymentDate,
        notes: formData.notes,
        status: formData.status,
        preparedBy: formData.preparedBy,
      }

      const res = await apiFetch(editingId ? `/payments/${editingId}` : "/payments", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || "Failed to save payment voucher")
      }

      toast.success(
        editingId
          ? `Voucher ${formData.voucherNo} updated successfully.`
          : `Payment voucher ${formData.voucherNo} created successfully.`,
        { id: toastId }
      )

      setIsFormOpen(false)
      loadData(true)
    } catch (err: any) {
      console.error("Save error:", err)
      toast.error(err.message || "Failed to save payment voucher.", { id: toastId })
    } finally {
      setIsSubmittingForm(false)
    }
  }

  const handleOpenAuthModal = (voucher: ExpenseVoucher) => {
    setAuthTarget(voucher)
    setAuthAction("disburse")
    setAuthChequeNo(voucher.chequeNumber || "")
    setAuthAccountId(voucher.financialAccountId || "")
    setAuthRejectionReason("")
    setIsAuthOpen(true)
  }

  const handleExecuteAuthorization = async () => {
    if (!authTarget) return

    setIsAuthorizing(true)
    const toastId = toast.loading(`Executing ${authAction} for voucher ${authTarget.voucherNo}...`)

    try {
      const res = await apiFetch(`/payments/${authTarget.id}/authorize`, {
        method: "POST",
        body: JSON.stringify({
          action: authAction,
          chequeNumber: authChequeNo || undefined,
          financialAccountId: authAccountId || undefined,
          rejectionReason: authAction === "reject" ? authRejectionReason : undefined,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || "Authorization action failed")
      }

      toast.success(
        authAction === "disburse"
          ? `Voucher ${authTarget.voucherNo} disbursed & debited successfully.`
          : authAction === "approve"
          ? `Voucher ${authTarget.voucherNo} approved for payout.`
          : `Voucher ${authTarget.voucherNo} rejected.`,
        { id: toastId }
      )

      setIsAuthOpen(false)
      setAuthTarget(null)
      loadData(true)
    } catch (err: any) {
      console.error("Authorization error:", err)
      toast.error(err.message || "Failed to execute authorization.", { id: toastId })
    } finally {
      setIsAuthorizing(false)
    }
  }

  const handleOpenDeleteModal = (voucher: ExpenseVoucher) => {
    setVoucherToDelete(voucher)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDeleteVoucher = async () => {
    if (!voucherToDelete) return
    const toastId = toast.loading(`Deleting voucher ${voucherToDelete.voucherNo}...`)
    try {
      setIsDeletingVoucher(true)
      const res = await apiFetch(`/payments/${voucherToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || "Failed to delete voucher")
      }

      toast.success(`Expense voucher ${voucherToDelete.voucherNo} deleted and ledger updated.`, { id: toastId })
      setIsDeleteModalOpen(false)
      setVoucherToDelete(null)
      loadData(true)
    } catch (error: any) {
      console.error("Error deleting voucher:", error)
      toast.error(error.message || "Failed to delete expense voucher.", { id: toastId })
    } finally {
      setIsDeletingVoucher(false)
    }
  }

  const handleExportExcel = () => {
    const data = vouchers.map((v) => ({
      "Voucher #": v.voucherNo,
      Date: v.paymentDate,
      "Payee / Beneficiary": v.payeeName,
      "Payee Classification": v.payeeType || "Vendor / General",
      "PO Reference": v.poNumber || "N/A",
      Category: v.category,
      Status: v.status,
      "Gross Amount (BDT)": v.grossAmount || v.amount,
      "TDS Rate (%)": v.tdsRate || 0,
      "TDS Amount (BDT)": v.tdsAmount || 0,
      "VDS Rate (%)": v.vdsRate || 0,
      "VDS Amount (BDT)": v.vdsAmount || 0,
      "Net Disbursed (BDT)": v.amount,
      "Funding Channel": v.fundingSource,
      "Source Detail": v.sourceDetail,
      "Payment Mode": v.paymentMethod || "Cash",
      "Cheque / Instrument #": v.chequeNumber || "N/A",
      "Approved By": v.approvedBy || "Pending",
      Notes: v.notes || "",
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expense & Vendor Payments")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Expense_Payments_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
    toast.success("Excel ledger exported successfully.")
  }

  // Filtered Vouchers List
  const filteredVouchers = React.useMemo(() => {
    return vouchers.filter((v) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim()
      if (q) {
        const matchNo = v.voucherNo.toLowerCase().includes(q)
        const matchPayee = v.payeeName.toLowerCase().includes(q)
        const matchNotes = (v.notes || "").toLowerCase().includes(q)
        const matchPo = (v.poNumber || "").toLowerCase().includes(q)
        const matchCheque = (v.chequeNumber || "").toLowerCase().includes(q)
        const matchSource = (v.sourceDetail || "").toLowerCase().includes(q)
        if (!matchNo && !matchPayee && !matchNotes && !matchPo && !matchCheque && !matchSource) {
          return false
        }
      }

      // 2. Tab filtering
      if (activeTab === "pending") {
        if (v.status !== "Pending Approval" && v.status !== "Approved") return false
      } else if (activeTab === "disbursed") {
        if (v.status !== "Disbursed") return false
      } else if (activeTab === "vendor") {
        if (v.category !== "Wholesaler Settlement" && v.payeeType !== "Wholesaler / Vendor") return false
      } else if (activeTab === "doctor") {
        if (v.category !== "Doctor Gifts & Promotional" && v.payeeType !== "Doctor / Clinical") return false
      } else if (activeTab === "staff") {
        if (v.category !== "Staff Welfare & Meals" && v.payeeType !== "Staff TA/DA") return false
      }

      // 3. Dropdown Filters
      if (categoryFilter !== "all" && v.category !== categoryFilter) return false
      if (fundingSourceFilter !== "all" && v.fundingSource !== fundingSourceFilter) return false
      if (statusFilter !== "all" && v.status !== statusFilter) return false

      return true
    })
  }, [vouchers, searchQuery, activeTab, categoryFilter, fundingSourceFilter, statusFilter])

  // Pagination derived variables
  const totalItems = filteredVouchers.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedVouchers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredVouchers.slice(startIndex, startIndex + pageSize)
  }, [filteredVouchers, currentPage, pageSize])

  // Count pending vouchers for badge
  const pendingCount = React.useMemo(() => {
    return vouchers.filter((v) => v.status === "Pending Approval" || v.status === "Approved").length
  }, [vouchers])

  const totalDisbursed = metrics?.totalDisbursedBDT ?? vouchers
    .filter((v) => v.status === "Disbursed")
    .reduce((acc, curr) => acc + curr.amount, 0)

  const totalPending = metrics?.totalPendingBDT ?? vouchers
    .filter((v) => v.status === "Pending Approval" || v.status === "Approved")
    .reduce((acc, curr) => acc + curr.amount, 0)

  const totalGross = metrics?.totalGrossBDT ?? vouchers
    .reduce((acc, curr) => acc + (curr.grossAmount || curr.amount), 0)

  const totalTds = metrics?.totalTdsWithheldBDT ?? vouchers
    .reduce((acc, curr) => acc + (curr.tdsAmount || 0), 0)

  const totalVds = metrics?.totalVdsWithheldBDT ?? vouchers
    .reduce((acc, curr) => acc + (curr.vdsAmount || 0), 0)

  return (
    <div className="mx-auto max-w-[1420px] space-y-6 pb-20 font-sans text-neutral-900">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#0090FF]" />
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              FINANCE & TREASURY DISBURSEMENTS
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Expense & Vendor Payments
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Complete disbursement ledger for wholesaler dues, doctor symposiums, staff TA/DA, with automated TDS/VDS and Maker-Checker authorization.
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
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
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
            <Plus className="h-4 w-4" /> Record Payment Voucher
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Total Gross Bill
            </span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold tracking-tight text-slate-900">
            ৳{totalGross.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {vouchers.length} Total vouchers recorded
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-emerald-600 uppercase">
              Disbursed & Settled
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold tracking-tight text-emerald-600">
            ৳{totalDisbursed.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Debited from Treasury accounts
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
            {pendingCount} Vouchers awaiting release
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Statutory Withheld
            </span>
            <Calculator className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-900">
            TDS: <span className="text-blue-600">৳{totalTds.toLocaleString("en-IN")}</span>
          </div>
          <div className="mt-0.5 font-mono text-xs font-semibold text-slate-600">
            VDS: <span className="text-purple-600">৳{totalVds.toLocaleString("en-IN")}</span> (NBR)
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Active Funding Safes
            </span>
            <Landmark className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 flex flex-col gap-1 text-[11px] font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1.5 text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Corporate Banks: {accounts.filter((a) => a.category === "BANK").length} Registered
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Cash Safes: {accounts.filter((a) => a.category === "CASH").length} Active
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Quick Tabs & Filter Bar */}
      <div className="space-y-3">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              activeTab === "all"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Vouchers ({vouchers.length})
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
            Pending Clearance
            {pendingCount > 0 && (
              <span className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "pending" ? "bg-white text-amber-700" : "bg-amber-100 text-amber-800"
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("disbursed")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
              activeTab === "disbursed"
                ? "bg-emerald-700 text-white"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            Disbursed & Settled
          </button>

          <button
            onClick={() => setActiveTab("vendor")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
              activeTab === "vendor"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Building2 className="h-3 w-3 text-blue-500" />
            Wholesaler / Vendor Settlements
          </button>

          <button
            onClick={() => setActiveTab("doctor")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
              activeTab === "doctor"
                ? "bg-purple-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Stethoscope className="h-3 w-3 text-purple-500" />
            Doctor & Clinical Gifts
          </button>

          <button
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
              activeTab === "staff"
                ? "bg-slate-700 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="h-3 w-3 text-slate-500" />
            Staff Welfare & TA/DA
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search voucher #, payee, PO #, cheque #, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-[190px] border-slate-200 bg-white text-xs">
                <Filter className="mr-1.5 h-3 w-3 text-slate-400" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Wholesaler Settlement">Wholesaler Settlement</SelectItem>
                <SelectItem value="Doctor Gifts & Promotional">Doctor Gifts & Promotional</SelectItem>
                <SelectItem value="Staff Welfare & Meals">Staff Welfare & Meals</SelectItem>
                <SelectItem value="Meetings & Events">Meetings & Events</SelectItem>
                <SelectItem value="General Operating Expense">General Operating Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={fundingSourceFilter} onValueChange={setFundingSourceFilter}>
              <SelectTrigger className="h-8 w-[150px] border-slate-200 bg-white text-xs">
                <SelectValue placeholder="All Funding" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Funding Sources</SelectItem>
                <SelectItem value="Bank Account">Corporate Bank</SelectItem>
                <SelectItem value="Cash Safe">Cash Drawer / Safe</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[140px] border-slate-200 bg-white text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Disbursed">Disbursed</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || categoryFilter !== "all" || fundingSourceFilter !== "all" || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setCategoryFilter("all")
                  setFundingSourceFilter("all")
                  setStatusFilter("all")
                }}
                className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Voucher Table */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-none">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Expense & Vendor Disbursement Register
            </h3>
            <Badge variant="secondary" className="text-[10px] font-bold">
              {totalItems} Records {totalPages > 1 ? `• Page ${currentPage} of ${totalPages}` : ""}
            </Badge>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Sorted by issuance date (Descending)
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-600">
                <TableHead className="py-3 pl-4">Voucher & Date</TableHead>
                <TableHead className="py-3">Payee & Particulars</TableHead>
                <TableHead className="py-3">Category & Channel</TableHead>
                <TableHead className="py-3 text-right">Gross & Withholdings</TableHead>
                <TableHead className="py-3 text-right">Net Disbursed (৳)</TableHead>
                <TableHead className="py-3 text-center">Status</TableHead>
                <TableHead className="py-3 pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    <RefreshCw className="mx-auto h-5 w-5 animate-spin text-[#0090FF] mb-2" />
                    Loading payment records from database...
                  </TableCell>
                </TableRow>
              ) : filteredVouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    <AlertCircle className="mx-auto h-6 w-6 text-slate-300 mb-2" />
                    No expense vouchers matching the current criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVouchers.map((v) => {
                  const gross = v.grossAmount || v.amount
                  const hasTax = (v.tdsAmount && v.tdsAmount > 0) || (v.vdsAmount && v.vdsAmount > 0)

                  return (
                    <TableRow
                      key={v.id}
                      className="border-b border-slate-50 text-xs hover:bg-slate-50/50 transition-colors"
                    >
                      {/* 1. Voucher # and Date */}
                      <TableCell className="py-3.5 pl-4 align-top">
                        <span className="block font-mono font-bold text-[#0090FF]">
                          {v.voucherNo}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {v.paymentDate}
                        </span>
                      </TableCell>

                      {/* 2. Payee & Particulars */}
                      <TableCell className="py-3.5 align-top max-w-[280px]">
                        <div className="flex items-center gap-1.5">
                          {v.payeeType === "Wholesaler / Vendor" ? (
                            <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          ) : v.payeeType === "Doctor / Clinical" ? (
                            <Stethoscope className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          ) : (
                            <Wallet className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          )}
                          <strong className="block truncate font-semibold text-slate-900">
                            {v.payeeName}
                          </strong>
                        </div>
                        {v.poNumber && (
                          <span className="inline-block mt-0.5 rounded bg-blue-50 px-1.5 py-0.2 font-mono text-[10px] font-bold text-blue-700">
                            PO: {v.poNumber}
                          </span>
                        )}
                        <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">
                          {v.lineItems?.length
                            ? formatParticularsSummary(v.lineItems)
                            : v.poNumber
                              ? `PO ${v.poNumber} — see memo for purchased items`
                              : v.notes || "General operating expense."}
                        </p>
                      </TableCell>

                      {/* 3. Category & Channel */}
                      <TableCell className="py-3.5 align-top">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold tracking-wide border-slate-200 bg-slate-50 text-slate-700"
                        >
                          {v.category}
                        </Badge>
                        <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-600">
                          {v.fundingSource === "Cash Safe" ? (
                            <Wallet className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Landmark className="h-3 w-3 text-blue-600" />
                          )}
                          <span className="truncate max-w-[170px]">{v.sourceDetail}</span>
                        </div>
                        {v.chequeNumber && (
                          <span className="font-mono text-[10px] text-slate-400">
                            Ref: {v.chequeNumber}
                          </span>
                        )}
                      </TableCell>

                      {/* 4. Gross & Withholdings */}
                      <TableCell className="py-3.5 text-right align-top font-mono">
                        <div className="text-xs font-semibold text-slate-700">
                          ৳{gross.toLocaleString("en-IN")}
                        </div>
                        {hasTax ? (
                          <div className="text-[10px] text-rose-600">
                            {v.tdsAmount ? `TDS: -৳${v.tdsAmount.toLocaleString("en-IN")}` : ""}
                            {v.vdsAmount ? ` • VDS: -৳${v.vdsAmount.toLocaleString("en-IN")}` : ""}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Zero Withholding</span>
                        )}
                      </TableCell>

                      {/* 5. Net Amount Disbursed */}
                      <TableCell className="py-3.5 text-right align-top">
                        <span className="font-mono text-sm font-extrabold text-slate-900">
                          ৳{v.amount.toLocaleString("en-IN")}
                        </span>
                        <div className="text-[10px] font-medium text-emerald-600">
                          {v.paymentMethod || "Settled"}
                        </div>
                      </TableCell>

                      {/* 6. Status Badge */}
                      <TableCell className="py-3.5 text-center align-top">
                        {v.status === "Disbursed" ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Disbursed
                          </Badge>
                        ) : v.status === "Approved" ? (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                            <ShieldCheck className="mr-1 h-3 w-3" /> Approved
                          </Badge>
                        ) : v.status === "Pending Approval" ? (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">
                            <Clock className="mr-1 h-3 w-3" /> Pending Review
                          </Badge>
                        ) : v.status === "Rejected" ? (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">
                            <XCircle className="mr-1 h-3 w-3" /> Rejected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-bold">
                            <FileText className="mr-1 h-3 w-3" /> Draft
                          </Badge>
                        )}
                      </TableCell>

                      {/* 7. Actions */}
                      <TableCell className="py-3.5 pr-4 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5">
                          {(v.status === "Pending Approval" || v.status === "Approved") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAuthModal(v)}
                              className="h-7 border-amber-300 bg-amber-50/50 px-2 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
                            >
                              <ShieldCheck className="mr-1 h-3 w-3 text-amber-600" /> Release
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPrintTarget(v)
                              setIsPrintOpen(true)
                            }}
                            className="h-7 border-slate-200 px-2 text-[11px] text-slate-700 hover:bg-slate-50"
                          >
                            <Receipt className="mr-1 h-3 w-3 text-[#0090FF]" /> View
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handlePrint(v)}
                            className="h-7 px-2 text-[11px] text-slate-700 hover:bg-slate-50"
                          >
                            <Printer className="mr-1 h-3 w-3 text-slate-500" /> Print
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(v)}
                            className="h-7 px-2 text-[11px] text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="h-3 w-3 text-slate-400" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDeleteModal(v)}
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
              of <span className="font-semibold text-slate-800">{totalItems}</span> vouchers
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

      {/* 5. Create / Edit Payment Voucher Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl bg-white sm:max-w-[620px] shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#0090FF]">
                <Receipt className="h-4 w-4" />
              </span>
              {editingId ? "Edit Payment Voucher" : "Record Expense & Vendor Payment"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Disburse payments to pharmaceutical vendors, doctors, and staff with automated statutory tax calculations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-4 py-2 text-xs">
            {/* Row 1: Voucher Number & Payment Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Voucher Serial # *
                </Label>
                <Input
                  value={formData.voucherNo}
                  onChange={(e) =>
                    setFormData({ ...formData, voucherNo: e.target.value })
                  }
                  required
                  className="h-8 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Disbursement Date *
                </Label>
                <Input
                  value={formData.paymentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentDate: e.target.value })
                  }
                  required
                  className="h-8 font-mono"
                />
              </div>
            </div>

            {/* Row 2: Payee Classification & Wholesaler Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Payee Classification *
                </Label>
                <Select
                  value={formData.payeeType}
                  onValueChange={(val) => {
                    setFormData((prev) => ({
                      ...prev,
                      payeeType: val,
                      category:
                        val === "Wholesaler / Vendor"
                          ? "Wholesaler Settlement"
                          : val === "Doctor / Clinical"
                          ? "Doctor Gifts & Promotional"
                          : val === "Staff TA/DA"
                          ? "Staff Welfare & Meals"
                          : prev.category,
                    }))
                  }}
                >
                  <SelectTrigger className="h-8 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Wholesaler / Vendor">Wholesaler / Vendor</SelectItem>
                    <SelectItem value="Doctor / Clinical">Doctor / Clinical KOL</SelectItem>
                    <SelectItem value="Staff TA/DA">Staff TA/DA & Welfare</SelectItem>
                    <SelectItem value="Facility & Utilities">Facility & Utilities</SelectItem>
                    <SelectItem value="Regulatory & DGDA">Regulatory & DGDA</SelectItem>
                    <SelectItem value="General / Other">General Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">
                  Expense Category *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="h-8 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Wholesaler Settlement">Wholesaler Settlement</SelectItem>
                    <SelectItem value="Doctor Gifts & Promotional">Doctor Gifts & Promotional</SelectItem>
                    <SelectItem value="Staff Welfare & Meals">Staff Welfare & Meals</SelectItem>
                    <SelectItem value="Meetings & Events">Meetings & Events</SelectItem>
                    <SelectItem value="General Operating Expense">General Operating Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payee Name & Quick Wholesaler Lookup */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-slate-700">
                  Payee / Beneficiary Name *
                </Label>
                {formData.payeeType === "Wholesaler / Vendor" && wholesalers.length > 0 && (
                  <span className="text-[10px] text-blue-600 font-semibold">
                    Select registered wholesaler or type custom:
                  </span>
                )}
              </div>

              {formData.payeeType === "Wholesaler / Vendor" && wholesalers.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={selectedWholesalerSelectValue}
                    onValueChange={handleSelectWholesaler}
                  >
                    <SelectTrigger className="h-8 bg-white text-xs">
                      <SelectValue placeholder="Pick Registered Wholesaler" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {wholesalers.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({w.wholesalerCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Or enter custom payee name..."
                    value={formData.payeeName}
                    onChange={(e) =>
                      setFormData({ ...formData, payeeName: e.target.value })
                    }
                    required
                    className="h-8 font-semibold"
                  />
                </div>
              ) : (
                <Input
                  placeholder="e.g. Enter payee, vendor, or clinician name"
                  value={formData.payeeName}
                  onChange={(e) =>
                    setFormData({ ...formData, payeeName: e.target.value })
                  }
                  required
                  className="h-8 font-semibold"
                />
              )}
            </div>

            {/* Optional Purchase Order Linking */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">
                Purchase Order / Requisition Ref (Optional)
              </Label>
              <Input
                placeholder="e.g. AKP-PO-2026-0101"
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                className="h-8 font-mono"
              />
            </div>

            {/* Automated TDS / VDS Tax Calculator Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                  <Calculator className="h-3.5 w-3.5 text-blue-600" />
                  Statutory Tax Withholding (TDS & VDS)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Auto-calculates Net Disbursement
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600">
                    Gross Amount (BDT) *
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.grossAmount || ""}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0
                      handleTaxCalculation(val, formData.tdsRate, formData.vdsRate)
                    }}
                    required
                    className="h-8 font-mono font-bold bg-white text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600">
                    TDS Rate (%)
                  </Label>
                  <Select
                    value={String(formData.tdsRate)}
                    onValueChange={(val) => {
                      const r = Number(val) || 0
                      handleTaxCalculation(formData.grossAmount, r, formData.vdsRate)
                    }}
                  >
                    <SelectTrigger className="h-8 bg-white font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs font-mono">
                      <SelectItem value="0">0% (Nil)</SelectItem>
                      <SelectItem value="2">2% (Goods supply)</SelectItem>
                      <SelectItem value="3">3% (Raw Materials)</SelectItem>
                      <SelectItem value="5">5% (Procurement)</SelectItem>
                      <SelectItem value="10">10% (Honorarium/Prof)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600">
                    VDS Rate (%)
                  </Label>
                  <Select
                    value={String(formData.vdsRate)}
                    onValueChange={(val) => {
                      const r = Number(val) || 0
                      handleTaxCalculation(formData.grossAmount, formData.tdsRate, r)
                    }}
                  >
                    <SelectTrigger className="h-8 bg-white font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs font-mono">
                      <SelectItem value="0">0% (Exempt)</SelectItem>
                      <SelectItem value="5">5% (Standard VDS)</SelectItem>
                      <SelectItem value="7.5">7.5% (Wholesale)</SelectItem>
                      <SelectItem value="15">15% (Standard VAT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dynamic Calculation Callout */}
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">TDS Deducted</span>
                    <span className="font-mono font-bold text-rose-600">
                      -৳{((formData.grossAmount * formData.tdsRate) / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">VDS Deducted</span>
                    <span className="font-mono font-bold text-purple-600">
                      -৳{((formData.grossAmount * formData.vdsRate) / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Net Payout (BDT)</span>
                  <span className="font-mono text-base font-extrabold text-emerald-700">
                    ৳{formData.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Funding Channel & Live Account Selection */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Disbursement Channel *
                  </Label>
                  <Select
                    value={formData.fundingSource}
                    onValueChange={(val: any) => {
                      const matchingAccount = accounts.find((a) =>
                        val === "Cash Safe" ? a.category === "CASH" : a.category === "BANK"
                      )
                      setFormData((prev) => ({
                        ...prev,
                        fundingSource: val,
                        financialAccountId: matchingAccount?.id || prev.financialAccountId,
                        sourceDetail: matchingAccount
                          ? `${matchingAccount.institution} (${matchingAccount.branch})`
                          : val === "Cash Safe"
                          ? "Cash Safe"
                          : "Bank Account",
                        paymentMethod: val === "Cash Safe" ? "Cash" : "BEFTN / RTGS",
                      }))
                    }}
                  >
                    <SelectTrigger className="h-8 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Bank Account">Corporate Bank Account</SelectItem>
                      <SelectItem value="Cash Safe">Physical Cash Drawer / Safe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Payment Method *
                  </Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(val) => setFormData({ ...formData, paymentMethod: val })}
                  >
                    <SelectTrigger className="h-8 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {formData.fundingSource === "Cash Safe" ? (
                        <>
                          <SelectItem value="Cash">Cash Handover</SelectItem>
                          <SelectItem value="Petty Cash Voucher">Petty Cash Voucher</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="BEFTN / RTGS">BEFTN / RTGS Online Transfer</SelectItem>
                          <SelectItem value="Cheque">Corporate Account Cheque</SelectItem>
                          <SelectItem value="Pay Order">Banker's Cheque / Pay Order</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Specific Financial Account Dropdown with Live Balance */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-slate-700">
                    Specific Treasury Account *
                  </Label>
                  <span className="text-[10px] text-slate-400">Live balance debited upon release</span>
                </div>

                <Select
                  value={formData.financialAccountId}
                  onValueChange={handleSelectFinancialAccount}
                >
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue placeholder="Select Source Account" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {accounts.length === 0 ? (
                      <SelectItem value="default">
                        {formData.sourceDetail}
                      </SelectItem>
                    ) : (
                      accounts
                        .filter((a) =>
                          formData.fundingSource === "Cash Safe"
                            ? a.category === "CASH"
                            : a.category === "BANK"
                        )
                        .map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.accountTitle} • ৳{acc.balance.toLocaleString("en-IN")} available
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Cheque / Instrument Reference */}
              {formData.paymentMethod !== "Cash" && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Cheque # / Bank Advice Reference
                  </Label>
                  <Input
                    placeholder="e.g. CQ-10021 or RTGS Ref"
                    value={formData.chequeNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, chequeNumber: e.target.value })
                    }
                    className="h-8 font-mono"
                  />
                </div>
              )}
            </div>

            {/* Voucher Lifecycle Status (Maker-Checker Release Option) */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">
                Voucher Authorization Stage *
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val: any) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="h-8 bg-white font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="Disbursed">
                    Disbursed & Settled (Immediate Treasury Debit)
                  </SelectItem>
                  <SelectItem value="Pending Approval">
                    Pending Clearance (Submit to Maker-Checker Queue)
                  </SelectItem>
                  <SelectItem value="Draft">Save as Draft (Unposted)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes / Particulars Description */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">
                Expenditure Particulars / Notes
              </Label>
              <Input
                placeholder="Brief justification, invoice #, or event details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-8"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
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
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  "Save Voucher Changes"
                ) : (
                  "Post Payment Voucher"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Maker-Checker Authorize Modal */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="rounded-2xl bg-white sm:max-w-[480px] shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              Authorize & Disburse Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Maker-checker sign-off for fund release and statutory journal debit.
            </DialogDescription>
          </DialogHeader>

          {authTarget && (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-[#0090FF]">
                      {authTarget.voucherNo}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                      {authTarget.payeeName}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {authTarget.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Net Payout</span>
                    <div className="font-mono text-base font-black text-emerald-700">
                      ৳{authTarget.amount.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200/80 pt-2 flex justify-between text-[11px] text-slate-600">
                  <span>Gross: ৳{(authTarget.grossAmount || authTarget.amount).toLocaleString("en-IN")}</span>
                  <span>TDS: ৳{(authTarget.tdsAmount || 0).toLocaleString("en-IN")}</span>
                  <span>VDS: ৳{(authTarget.vdsAmount || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Authorization Action Choice */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Select Action *
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthAction("disburse")}
                    className={`rounded-lg p-2 text-center border font-semibold text-xs transition-colors ${
                      authAction === "disburse"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    Disburse & Debit
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthAction("approve")}
                    className={`rounded-lg p-2 text-center border font-semibold text-xs transition-colors ${
                      authAction === "approve"
                        ? "border-blue-600 bg-blue-50 text-blue-800"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    Approve (Queue)
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthAction("reject")}
                    className={`rounded-lg p-2 text-center border font-semibold text-xs transition-colors ${
                      authAction === "reject"
                        ? "border-rose-600 bg-rose-50 text-rose-800"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    Reject / Return
                  </button>
                </div>
              </div>

              {authAction === "disburse" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-700">
                      Disbursement Instrument / Cheque #
                    </Label>
                    <Input
                      placeholder="e.g. CQ-90214 / EBL-FT-9912"
                      value={authChequeNo}
                      onChange={(e) => setAuthChequeNo(e.target.value)}
                      className="h-8 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-700">
                      Debit Account
                    </Label>
                    <Select
                      value={authAccountId}
                      onValueChange={setAuthAccountId}
                    >
                      <SelectTrigger className="h-8 bg-white text-xs">
                        <SelectValue placeholder={authTarget.sourceDetail} />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.accountTitle} • ৳{acc.balance.toLocaleString("en-IN")} avail
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {authAction === "reject" && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700">
                    Rejection / Correction Reason *
                  </Label>
                  <Input
                    placeholder="Enter reason for rejecting this voucher..."
                    value={authRejectionReason}
                    onChange={(e) => setAuthRejectionReason(e.target.value)}
                    required
                    className="h-8"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAuthOpen(false)}
              disabled={isAuthorizing}
              className="h-8 text-xs"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleExecuteAuthorization}
              disabled={isAuthorizing}
              className={`h-8 text-xs font-semibold text-white ${
                authAction === "disburse"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : authAction === "approve"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {isAuthorizing ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : authAction === "disburse" ? (
                "Release & Disburse Funds"
              ) : authAction === "approve" ? (
                "Confirm Approval"
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Screen Voucher Preview Modal */}
      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent className="max-h-[95vh] overflow-y-auto rounded-xl bg-white sm:max-w-[700px]">
          {printTarget && (
            <div className="space-y-6">
              <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 text-xs text-neutral-900">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 uppercase">
                      AK PHARMA
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Official Expense Payment Voucher / Disbursement Slip
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono text-xs font-bold text-[#0090FF]">
                      {printTarget.voucherNo}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Date: {printTarget.paymentDate}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-xs">
                  <div>
                    <p className="font-medium text-slate-500">Payee / Beneficiary:</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {printTarget.payeeName}
                    </p>
                    <p className="mt-3 font-medium text-slate-500">Classification:</p>
                    <p className="font-semibold text-slate-800">
                      {printTarget.category} ({printTarget.payeeType || "Vendor / General"})
                    </p>
                    {printTarget.poNumber && (
                      <>
                        <p className="mt-2 font-medium text-slate-500">PO Ref:</p>
                        <p className="font-mono font-bold text-blue-700">{printTarget.poNumber}</p>
                      </>
                    )}
                  </div>

                  <div>
                    <p className="font-medium text-slate-500">
                      Disbursed From ({printTarget.fundingSource}):
                    </p>
                    <p className="mt-0.5 font-semibold text-slate-800">
                      {printTarget.sourceDetail}
                    </p>
                    <p className="mt-3 font-medium text-slate-500">Mode & Cheque #:</p>
                    <p className="font-mono font-semibold text-slate-800">
                      {printTarget.paymentMethod || "Cash"} {printTarget.chequeNumber ? `• ${printTarget.chequeNumber}` : ""}
                    </p>
                    <p className="mt-3 font-medium text-slate-500">Status:</p>
                    <p className="font-bold text-emerald-600">
                      {printTarget.status === "Disbursed" ? "Settled & Disbursed" : printTarget.status}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-slate-200 p-4">
                  <p className="border-b border-slate-100 pb-2 font-bold text-slate-900">
                    Expenditure Particulars
                  </p>
                  {printParticulars.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-left text-[10px] uppercase text-slate-500">
                            <th className="pb-2 font-semibold">Item / Product</th>
                            <th className="pb-2 font-semibold text-center w-16">Qty</th>
                            <th className="pb-2 font-semibold text-right w-28">Amount (BDT)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printParticulars.map((item, idx) => {
                            const lineAmt =
                              item.lineTotalBDT != null
                                ? item.lineTotalBDT
                                : item.unitCostBDT != null
                                  ? item.unitCostBDT * item.quantity
                                  : null
                            return (
                              <tr key={`particular-${idx}`} className="border-b border-slate-50">
                                <td className="py-1.5 font-medium text-slate-800">{item.itemName}</td>
                                <td className="py-1.5 text-center font-mono text-slate-700">{item.quantity}</td>
                                <td className="py-1.5 text-right font-mono font-semibold text-slate-900">
                                  {lineAmt != null ? `৳${lineAmt.toLocaleString("en-IN")}` : "—"}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>General disbursement to {printTarget.payeeName}</span>
                      <span className="font-mono text-sm font-bold text-slate-900">
                        ৳{(printTarget.grossAmount || printTarget.amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-2 flex justify-between text-[11px] text-slate-500">
                    <span>TDS Withholding: -৳{(printTarget.tdsAmount || 0).toLocaleString("en-IN")}</span>
                    <span>VDS Withholding: -৳{(printTarget.vdsAmount || 0).toLocaleString("en-IN")}</span>
                    <strong className="text-emerald-700 font-mono text-xs">
                      Net: ৳{printTarget.amount.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                  <span className="font-medium text-slate-500">Net in Words:</span>
                  <strong className="text-slate-900 italic">
                    {numberToWordsBDT(printTarget.amount)}
                  </strong>
                </div>

                <div className="flex justify-between border-t border-slate-200 pt-10 text-[11px] text-slate-500">
                  <div className="text-center">
                    <div className="mx-auto mb-1 w-32 border-b border-slate-400" />
                    <strong className="block text-slate-900">
                      {printTarget.preparedBy || "Accounts Officer"}
                    </strong>
                    <span className="text-[9px]">Prepared By (Maker)</span>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-1 w-32 border-b border-slate-400" />
                    <strong className="block text-slate-900">
                      {printTarget.approvedBy || "Finance Controller"}
                    </strong>
                    <span className="text-[9px]">Audit Approval</span>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-1 w-32 border-b border-slate-400" />
                    <strong className="block text-slate-900">
                      {printTarget.disbursedBy || "Managing Director"}
                    </strong>
                    <span className="text-[9px]">Final Cheque Sign-off</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pb-2">
                <Button
                  variant="outline"
                  onClick={() => setIsPrintOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  onClick={() => void handlePrint(printTarget, printParticulars)}
                  className="gap-1.5 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
                >
                  <Printer className="h-4 w-4" /> Print Voucher
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
        onConfirm={handleConfirmDeleteVoucher}
        title="Delete Payment Voucher"
        description="Are you sure you want to delete this payment voucher? If this voucher was already disbursed, the associated treasury account balance will be automatically refunded."
        itemName={
          voucherToDelete
            ? `Voucher #${voucherToDelete.voucherNo} • Payee: ${voucherToDelete.payeeName} (৳${voucherToDelete.amount.toLocaleString("en-IN")})`
            : undefined
        }
        confirmText="Delete Voucher"
        cancelText="Cancel"
        isDeleting={isDeletingVoucher}
      />
    </div>
  )
}
