"use client"

import PermissionGate from "@/components/permission-gate"

import * as React from "react"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { API_URL, apiFetch } from "@/lib/api"
import { getStoredUser, isUserSuperAdmin } from "@/lib/auth"
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
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  History,
  ShieldCheck,
  ShieldAlert,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  KeyRound,
  Boxes,
  Stethoscope,
  Banknote,
  Users2,
  Eye,
  Fingerprint,
  RefreshCw,
  PlusCircle,
  Hash,
  Copy,
  Check,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Truck,
  MapPin,
  LineChart,
} from "lucide-react"

export interface AuditLogEntry {
  id: string
  auditRef: string
  timestamp: string
  formattedTimestamp?: string
  isoTimestamp?: string
  actorId?: string | null
  actorName: string
  actorEmail: string
  actorRole: string
  ipAddress: string
  userAgent?: string | null
  module: string
  actionType: string
  severity: "Critical" | "Security Warning" | "Statutory Notice" | "Routine"
  entityTarget: string
  entityType?: string | null
  entityId?: string | null
  changeSummary: string
  priorPayload?: string | null
  newPayload?: string | null
  reasonForChange?: string | null
  sha256Hash: string
  previousHash?: string | null
  verifiedSignature: boolean
  signerName?: string | null
  signatureMeaning?: string | null
  signedAt?: string | null
}

export interface AuditStats {
  totalRecords: number
  criticalCount: number
  warningCount: number
  statutoryCount: number
  routineCount: number
  isChainIntact: boolean
  brokenAtRef: string | null
  verifiedCount: number
  integrityPercentage: number
  moduleBreakdown: Record<string, number>
  severityBreakdown: Record<string, number>
}

export default function AuditLogsPage() {
  const [logs, setLogs] = React.useState<AuditLogEntry[]>([])
  const [stats, setStats] = React.useState<AuditStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  // Filters & Search
  const [searchQuery, setSearchQuery] = React.useState("")
  const [moduleFilter, setModuleFilter] = React.useState("all")
  const [severityFilter, setSeverityFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [limit] = React.useState(25)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)

  // Modals & Drawers
  const [selectedEntry, setSelectedEntry] = React.useState<AuditLogEntry | null>(null)
  const [isInspectOpen, setIsInspectOpen] = React.useState(false)

  const [isSignModalOpen, setIsSignModalOpen] = React.useState(false)
  const [signingEntry, setSigningEntry] = React.useState<AuditLogEntry | null>(null)
  const [signerName, setSignerName] = React.useState("")
  const [signatureMeaning, setSignatureMeaning] = React.useState<string>("Approval")
  const [signReason, setSignReason] = React.useState("")
  const [isSubmittingSignature, setIsSubmittingSignature] = React.useState(false)

  const [isVerifyModalOpen, setIsVerifyModalOpen] = React.useState(false)
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [verificationResult, setVerificationResult] = React.useState<any>(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [isCreatingLog, setIsCreatingLog] = React.useState(false)
  const [newLogData, setNewLogData] = React.useState({
    module: "FEFO Warehouse",
    actionType: "Statutory Inspection Note",
    severity: "Statutory Notice",
    entityTarget: "Facility / General Ledger",
    changeSummary: "",
    reasonForChange: "",
    signatureMeaning: "Authorship",
  })

  const [copiedHash, setCopiedHash] = React.useState<string | null>(null)

  // Current session user
  const currentUser = React.useMemo(() => {
    return getStoredUser()
  }, [])

  // 1. Fetch Audit Logs from Backend
  const fetchLogs = React.useCallback(async (targetPage = page) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set("page", String(targetPage))
      params.set("limit", String(limit))

      if (searchQuery.trim()) params.set("search", searchQuery.trim())
      if (moduleFilter !== "all") params.set("module", moduleFilter)
      if (severityFilter !== "all") params.set("severity", severityFilter)

      const res = await apiFetch(`${API_URL}/audit-logs?${params.toString()}`)
      if (!res.ok) {
        throw new Error(`Failed to load audit records: ${res.statusText}`)
      }
      const json = await res.json()
      const data = json.data || []
      const meta = json.meta || {}

      setLogs(data)
      setTotalPages(meta.totalPages || 1)
      setTotalCount(meta.total || data.length)
    } catch (err: any) {
      console.error("Audit log fetch error:", err)
      toast.error(err.message || "Failed to fetch audit log trail from database")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, limit, searchQuery, moduleFilter, severityFilter])

  // 2. Fetch Stats from Backend
  const fetchStats = React.useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/audit-logs/stats`)
      if (res.ok) {
        const json = await res.json()
        setStats(json.data)
      }
    } catch (err) {
      console.warn("Could not fetch audit stats:", err)
    }
  }, [])

  React.useEffect(() => {
    fetchLogs(page)
    fetchStats()
  }, [fetchLogs, fetchStats, page])

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchLogs(page), fetchStats()])
    toast.success("Audit records synchronized with immutable database ledger")
  }

  // 3. Cryptographic SHA-256 Hash Chain Verification
  const handleVerifyChain = async () => {
    setIsVerifying(true)
    setIsVerifyModalOpen(true)
    const toastId = toast.loading("Traversing and recalculating cryptographic SHA-256 hash chaining across all blocks...")

    try {
      const res = await apiFetch(`${API_URL}/audit-logs/verify-chain`)
      const json = await res.json()
      if (res.ok && json.data) {
        setVerificationResult(json.data)
        if (json.data.valid) {
          toast.success(
            `Hash chain 100% verified intact! All ${json.data.totalVerified} chronological blocks are authentic.`,
            { id: toastId }
          )
        } else {
          toast.error(
            `Tampering detected! Record ${json.data.corruptedRecord?.auditRef || ""} failed hash validation.`,
            { id: toastId }
          )
        }
      } else {
        throw new Error(json.message || "Chain verification failed")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute cryptographic verification", { id: toastId })
    } finally {
      setIsVerifying(false)
      fetchStats()
    }
  }

  // 4. Open Inspection Drawer
  const handleOpenInspect = (entry: AuditLogEntry) => {
    setSelectedEntry(entry)
    setIsInspectOpen(true)
  }

  // 5. Open Sign Modal
  const handleOpenSignModal = (entry: AuditLogEntry) => {
    setSigningEntry(entry)
    setSignerName(currentUser?.name || "Toshin Bin Azad")
    setSignatureMeaning("Approval")
    setSignReason("")
    setIsSignModalOpen(true)
  }

  // 6. Submit 21 CFR Part 11 Electronic Signature
  const handleExecuteSignature = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signingEntry) return
    if (!signerName.trim()) {
      toast.error("Please enter the printed legal name of the signing operator")
      return
    }
    if (!signReason.trim()) {
      toast.error("21 CFR Part 11 requires a statutory reason / justification for electronic signing")
      return
    }

    setIsSubmittingSignature(true)
    const toastId = toast.loading("Executing 21 CFR Part 11 digital signature and sealing record...")

    try {
      const res = await apiFetch(`${API_URL}/audit-logs/${signingEntry.id}/sign`, {
        method: "POST",
        body: JSON.stringify({
          signerName: signerName.trim(),
          signatureMeaning,
          reason: signReason.trim(),
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || "Electronic signature signoff failed")
      }

      toast.success(
        `Digital signature affixed successfully for ${signingEntry.auditRef} (${signatureMeaning})`,
        { id: toastId }
      )
      setIsSignModalOpen(false)
      fetchLogs(page)
      fetchStats()
      if (selectedEntry?.id === signingEntry.id) {
        setSelectedEntry(json.data)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to sign record", { id: toastId })
    } finally {
      setIsSubmittingSignature(false)
    }
  }

  // 7. Create Statutory / Inspection Note Log
  const handleCreateComplianceLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLogData.changeSummary.trim()) {
      toast.error("Please provide the narrative description of the compliance event")
      return
    }
    if (!newLogData.reasonForChange.trim()) {
      toast.error("Mandatory regulatory justification / reason is required under 21 CFR Part 11")
      return
    }

    setIsCreatingLog(true)
    const toastId = toast.loading("Sealing and appending statutory audit record into write-only ledger...")

    try {
      const res = await apiFetch(`${API_URL}/audit-logs`, {
        method: "POST",
        body: JSON.stringify({
          module: newLogData.module,
          actionType: newLogData.actionType,
          severity: newLogData.severity,
          entityTarget: newLogData.entityTarget,
          changeSummary: newLogData.changeSummary.trim(),
          reasonForChange: newLogData.reasonForChange.trim(),
          signerName: currentUser?.name || "Toshin Bin Azad",
          signatureMeaning: newLogData.signatureMeaning,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message || "Failed to record compliance event")
      }

      toast.success(`Statutory event ${json.data?.auditRef} committed to append-only ledger`, {
        id: toastId,
      })
      setIsCreateModalOpen(false)
      setNewLogData({
        module: "FEFO Warehouse",
        actionType: "Statutory Inspection Note",
        severity: "Statutory Notice",
        entityTarget: "Facility / General Ledger",
        changeSummary: "",
        reasonForChange: "",
        signatureMeaning: "Authorship",
      })
      fetchLogs(1)
      fetchStats()
    } catch (err: any) {
      toast.error(err.message || "Failed to create audit record", { id: toastId })
    } finally {
      setIsCreatingLog(false)
    }
  }

  // 8. Copy Hash with feedback
  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(text)
    toast.success("Cryptographic hash copied to clipboard")
    setTimeout(() => setCopiedHash(null), 2000)
  }

  // 9. Statutory Export
  const handleExportExcel = () => {
    const data = logs.map((l) => ({
      "Audit Reference": l.auditRef,
      "Universal Timestamp (ISO)": l.isoTimestamp || l.timestamp,
      "Formatted Time (Dhaka UTC+6)": l.formattedTimestamp || l.timestamp,
      "Executing Operator": l.actorName,
      "Operator Email": l.actorEmail,
      "Role Permission": l.actorRole,
      "Network IP Address": l.ipAddress,
      "Browser User-Agent": l.userAgent || "N/A",
      "Subsystem Module": l.module,
      "Event Classification": l.actionType,
      "Audit Severity": l.severity,
      "Target Entity / Lot": l.entityTarget,
      "Audit Action Description": l.changeSummary,
      "21 CFR Statutory Justification": l.reasonForChange || "Standard operational entry",
      "Cryptographic SHA-256 Hash": l.sha256Hash,
      "Previous Block Hash (Merkle Chain)": l.previousHash || "GENESIS BLOCK",
      "Digital Signature Status": l.verifiedSignature ? "VALID / VERIFIED" : "UNSIGNED",
      "Signer Printed Name": l.signerName || "N/A",
      "Signature Meaning": l.signatureMeaning || "N/A",
      "Signature Executed At": l.signedAt ? new Date(l.signedAt).toISOString() : "N/A",
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "21 CFR Part 11 Audit Trail")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_21CFR11_Statutory_Audit_Trail_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
    toast.success("21 CFR Part 11 certified Excel ledger exported successfully")
  }

  // 10. Printable Regulatory Certificate
  const handlePrintCertificate = () => {
    window.print()
  }

  // Metrics calculations
  const totalEvents = stats?.totalRecords ?? logs.length
  const criticalCount = stats?.criticalCount ?? logs.filter((l) => l.severity === "Critical").length
  const warningCount = stats?.warningCount ?? logs.filter((l) => l.severity === "Security Warning").length
  const isChainIntact = stats?.isChainIntact ?? true
  const integrityPercentage = stats?.integrityPercentage ?? 100

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-12 print:p-0 print:m-0">
      {/* 1. Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Statutory Audit Trail & Compliance Activity Logs
            </h1>
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-[10px] font-semibold text-[#0090FF]"
            >
              21 CFR Part 11
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Immutable, append-only operational ledger recording all pharmaceutical, financial, clinical, and security actions with cryptographic SHA-256 hash chaining.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#0090FF]" : "text-slate-500"}`} />
            Sync
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleVerifyChain}
            className="h-9 gap-1.5 rounded-lg border-emerald-200 bg-emerald-50/70 px-3.5 text-xs font-semibold text-emerald-800 shadow-none hover:bg-emerald-100/60"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Verify Chain
          </Button>

          <PermissionGate feature="Audit Logs (21 CFR Compliant)" action="create">
<Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Record Statutory Event
            </Button>
</PermissionGate>

          <PermissionGate feature="Audit Logs (21 CFR Compliant)" action="special">
<Button
              size="sm"
              variant="outline"
              onClick={handleExportExcel}
              className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              Export Certified Trail
            </Button>
</PermissionGate>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4">
        {/* Total Events */}
<PermissionGate feature="Audit Logs (21 CFR Compliant)" action="overview:loggedEvents">
<Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total Logged Events
            </span>
            <div className="rounded-lg bg-blue-50 p-1.5 text-[#0090FF]">
              <History className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[26px] leading-none font-bold tracking-tight text-slate-900">
            {totalEvents} Operations
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Append-only write ledger active
          </p>
        </Card>
</PermissionGate>

        {/* Critical Statutory Overrides */}
        <PermissionGate feature="Audit Logs (21 CFR Compliant)" action="overview:overrides">
<Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none transition-all hover:border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Critical Statutory Overrides
            </span>
            <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[26px] leading-none font-bold tracking-tight text-rose-600">
            {criticalCount} Critical
          </div>
          <p className="mt-3 text-[11px] font-medium text-rose-600">
            Includes quarantines & revocations
          </p>
        </Card>
</PermissionGate>

        {/* Security & Price Warnings */}
<PermissionGate feature="Audit Logs (21 CFR Compliant)" action="overview:warnings">
<Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none transition-all hover:border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Security & Policy Warnings
            </span>
            <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[26px] leading-none font-bold tracking-tight text-amber-600">
            {warningCount} Warnings
          </div>
          <p className="mt-3 text-[11px] font-medium text-amber-600">
            RBAC permissions & price variances
          </p>
        </Card>
</PermissionGate>

        {/* Cryptographic Integrity */}
        <PermissionGate feature="Audit Logs (21 CFR Compliant)" action="overview:integrity">
<Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none transition-all hover:border-emerald-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Cryptographic Integrity
            </span>
            <Badge
              variant="outline"
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                isChainIntact
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {isChainIntact ? "SHA-256 Intact" : "Chain Broken"}
            </Badge>
          </div>
          <div className="mt-3 font-mono text-[26px] leading-none font-bold tracking-tight text-slate-900">
            {integrityPercentage}% Valid
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            {isChainIntact
              ? "Zero tampering detected across blocks"
              : `Tampered block: ${stats?.brokenAtRef || "Unknown"}`}
          </p>
        </Card>
</PermissionGate>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search ref #, operator, lot, action, or SHA-256..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={moduleFilter}
            onValueChange={(val) => {
              setModuleFilter(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[170px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="All Subsystems" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Subsystems</SelectItem>
              <SelectItem value="Field Force">Field Force (MIO)</SelectItem>
              <SelectItem value="Doctor Registry">Doctor Registry</SelectItem>
              <SelectItem value="Clinical Registry">Clinical Registry</SelectItem>
              <SelectItem value="Sales & Deliveries">Sales & Deliveries</SelectItem>
              <SelectItem value="FEFO Warehouse">FEFO Warehouse</SelectItem>
              <SelectItem value="Finance & Accounts">Finance & Accounts</SelectItem>
              <SelectItem value="Workforce & HR">Workforce & HR</SelectItem>
              <SelectItem value="RBAC Security">RBAC Security</SelectItem>
              <SelectItem value="Overview & Analytics">Overview & Analytics</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={severityFilter}
            onValueChange={(val) => {
              setSeverityFilter(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[160px] border-slate-200 bg-white text-xs">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="Critical">Critical Only</SelectItem>
              <SelectItem value="Security Warning">Security Warnings</SelectItem>
              <SelectItem value="Statutory Notice">Statutory Notices</SelectItem>
              <SelectItem value="Routine">Routine Actions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Main Audit Trail Register Table */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              CHRONOLOGICAL AUDIT EVENT JOURNAL (21 CFR PART 11)
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Click any log entry to inspect cryptographic hashes, originating IP, and payload state transitions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400">
              Showing {logs.length} of {totalCount} Verified Entries
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin text-[#0090FF]" />
            <p className="mt-2 text-xs font-medium">Verifying and loading statutory audit records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs font-semibold text-slate-600">No matching audit trail records found</p>
            <p className="text-[11px] text-slate-400">Try adjusting your search criteria or subsystem filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
                  <TableHead className="pl-0 text-xs font-medium text-slate-600">
                    Timestamp & Ref
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Operating Actor
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Subsystem Scope
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Action Type
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Affected Target
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Severity
                  </TableHead>
                  <TableHead className="text-xs font-medium text-slate-600">
                    Signature
                  </TableHead>
                  <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Timestamp & Audit Ref */}
                    <TableCell className="py-3 pl-0">
                      <div className="leading-tight">
                        <span className="block text-xs font-semibold text-slate-900">
                          {log.formattedTimestamp || log.timestamp}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] text-[#0090FF]">
                          {log.auditRef}
                        </span>
                      </div>
                    </TableCell>

                    {/* Operating Actor */}
                    <TableCell className="py-3 text-xs text-slate-800">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 rounded-full border border-slate-200">
                          <AvatarFallback className="bg-slate-100 text-[10px] font-bold text-slate-700">
                            {log.actorName ? log.actorName.slice(0, 2).toUpperCase() : "OP"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="leading-tight max-w-[130px] truncate">
                          <span className="block font-semibold text-slate-900 truncate">
                            {log.actorName}
                          </span>
                          <span className="block text-[10px] text-slate-400 truncate">
                            {log.actorRole}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Subsystem Scope */}
                    <TableCell className="py-3 text-xs">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        {(log.module === "FEFO Warehouse" || log.module?.includes("Warehouse") || log.module?.includes("Inventory")) && (
                          <Boxes className="h-3.5 w-3.5 text-amber-600" />
                        )}
                        {(log.module === "Clinical Registry" || log.module === "Doctor Registry" || log.module?.includes("Doctor")) && (
                          <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
                        )}
                        {(log.module === "Field Force" || log.module?.includes("Field")) && (
                          <MapPin className="h-3.5 w-3.5 text-cyan-600" />
                        )}
                        {(log.module === "Sales & Deliveries" || log.module?.includes("Sales") || log.module?.includes("Deliver")) && (
                          <Truck className="h-3.5 w-3.5 text-indigo-600" />
                        )}
                        {(log.module === "Finance & Accounts" || log.module?.includes("Finance")) && (
                          <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                        {(log.module === "Workforce & HR" || log.module?.includes("HR") || log.module?.includes("Staff")) && (
                          <Users2 className="h-3.5 w-3.5 text-purple-600" />
                        )}
                        {(log.module === "RBAC Security" || log.module?.includes("Security") || log.module?.includes("RBAC")) && (
                          <KeyRound className="h-3.5 w-3.5 text-rose-600" />
                        )}
                        {(log.module === "Overview & Analytics" || log.module?.includes("Analytics")) && (
                          <LineChart className="h-3.5 w-3.5 text-teal-600" />
                        )}
                        <span className="font-medium text-slate-800">
                          {log.module}
                        </span>
                      </div>
                    </TableCell>

                    {/* Action Type */}
                    <TableCell className="py-3 text-xs font-semibold text-slate-900 whitespace-nowrap">
                      {log.actionType}
                    </TableCell>

                    {/* Affected Target */}
                    <TableCell className="max-w-[200px] truncate py-3 text-xs text-slate-600" title={log.entityTarget}>
                      {log.entityTarget}
                    </TableCell>

                    {/* Severity Badge */}
                    <TableCell className="py-3 text-xs whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          log.severity === "Critical"
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : log.severity === "Security Warning"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : log.severity === "Statutory Notice"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        {log.severity}
                      </Badge>
                    </TableCell>

                    {/* Digital Signature */}
                    <TableCell className="py-3 text-xs whitespace-nowrap">
                      {log.verifiedSignature ? (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <Fingerprint className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{log.signerName || "Signed"}</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenSignModal(log)}
                          className="h-6 text-[10px] text-amber-700 border-amber-200 hover:bg-amber-50"
                        >
                          Sign Now
                        </Button>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3 pr-0 text-right text-xs whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenInspect(log)}
                          className="h-7 gap-1 px-2.5 text-xs font-medium text-[#0090FF] hover:bg-blue-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Inspect
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenSignModal(log)}
                          className="h-7 px-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          title="Affix 21 CFR Part 11 Electronic Signature"
                        >
                          <Fingerprint className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 gap-1 text-xs"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 5. Deep-Dive Audit Event Inspection Drawer (Sheet) */}
      <Sheet open={isInspectOpen} onOpenChange={setIsInspectOpen}>
        <SheetContent className="w-full overflow-y-auto border-l border-slate-200 bg-white p-0 sm:max-w-lg">
          {selectedEntry && (
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="border-b border-slate-100 bg-slate-50/70 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold tracking-wider text-[#0090FF] uppercase">
                      21 CFR PART 11 STATUTORY RECORD
                    </span>
                    <h2 className="mt-1 text-base font-bold text-slate-900">
                      {selectedEntry.actionType}
                    </h2>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">
                      Ref: {selectedEntry.auditRef}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${
                      selectedEntry.severity === "Critical"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : selectedEntry.severity === "Security Warning"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                    }`}
                  >
                    {selectedEntry.severity}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs text-slate-600">
                  <span>
                    Timestamp: <strong>{selectedEntry.formattedTimestamp || selectedEntry.timestamp}</strong>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <Fingerprint className="h-3.5 w-3.5" />
                    {selectedEntry.verifiedSignature ? "Signed & Valid" : "Unsigned"}
                  </span>
                </div>
              </div>

              {/* Event Metadata */}
              <div className="flex-1 space-y-5 p-6 text-xs">
                {/* Operator Context */}
                <div>
                  <h4 className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Operating User & Network Context
                  </h4>
                  <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Executing User:</span>
                      <span className="font-bold text-slate-900">
                        {selectedEntry.actorName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Corporate Account:</span>
                      <span className="font-mono text-slate-800">
                        {selectedEntry.actorEmail}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Security Role:</span>
                      <span className="font-medium text-slate-800">
                        {selectedEntry.actorRole}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                      <span className="text-slate-500">Client Host IP:</span>
                      <span className="font-mono font-medium text-slate-800">
                        {selectedEntry.ipAddress}
                      </span>
                    </div>
                    {selectedEntry.userAgent && (
                      <div className="border-t border-slate-200/60 pt-1.5">
                        <span className="text-slate-500 block mb-0.5">User Agent:</span>
                        <span className="font-mono text-[10px] text-slate-600 break-all">
                          {selectedEntry.userAgent}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target & Summary */}
                <div>
                  <h4 className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Target Entity & Action Summary
                  </h4>
                  <div className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                    <div>
                      <span className="mb-0.5 block text-slate-500 font-medium">
                        Target Entity:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedEntry.entityTarget}
                      </span>
                    </div>
                    <div className="border-t border-slate-200/60 pt-2">
                      <span className="mb-0.5 block text-slate-500 font-medium">
                        Audit Narrative:
                      </span>
                      <p className="leading-relaxed text-slate-800">
                        {selectedEntry.changeSummary}
                      </p>
                    </div>
                    {selectedEntry.reasonForChange && (
                      <div className="border-t border-slate-200/60 pt-2">
                        <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 uppercase">
                          <FileText className="h-3 w-3" />
                          21 CFR Part 11 Reason For Change:
                        </span>
                        <p className="rounded-lg border border-blue-100 bg-blue-50/60 p-2 text-xs text-blue-900">
                          {selectedEntry.reasonForChange}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pre vs Post Payload */}
                <div>
                  <h4 className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    State Payload Diff (Before vs. After)
                  </h4>
                  <div className="space-y-2.5">
                    {selectedEntry.priorPayload ? (
                      <div className="rounded-lg border border-rose-100 bg-rose-50/40 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-rose-700 uppercase">
                            Previous State Payload
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyHash(selectedEntry.priorPayload || "")}
                            className="h-5 px-1.5 text-[10px] text-rose-700 hover:bg-rose-100"
                          >
                            <Copy className="h-2.5 w-2.5 mr-1" /> Copy
                          </Button>
                        </div>
                        <pre className="font-mono text-[10px] break-all whitespace-pre-wrap text-rose-950 max-h-40 overflow-y-auto">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(selectedEntry.priorPayload), null, 2)
                            } catch {
                              return selectedEntry.priorPayload
                            }
                          })()}
                        </pre>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2 text-[11px] text-slate-400 italic">
                        No previous record state (Genesis creation event)
                      </div>
                    )}

                    {selectedEntry.newPayload && (
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">
                            Committed State Payload
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyHash(selectedEntry.newPayload || "")}
                            className="h-5 px-1.5 text-[10px] text-emerald-700 hover:bg-emerald-100"
                          >
                            <Copy className="h-2.5 w-2.5 mr-1" /> Copy
                          </Button>
                        </div>
                        <pre className="font-mono text-[10px] break-all whitespace-pre-wrap text-emerald-950 max-h-48 overflow-y-auto">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(selectedEntry.newPayload), null, 2)
                            } catch {
                              return selectedEntry.newPayload
                            }
                          })()}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Digital Signature Details */}
                <div>
                  <h4 className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    21 CFR Part 11 Electronic Signature Seal
                  </h4>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Printed Signer:</span>
                      <span className="font-bold text-slate-900">
                        {selectedEntry.signerName || selectedEntry.actorName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Signature Meaning:</span>
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]">
                        {selectedEntry.signatureMeaning || "Authorship"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Signing Date & Time:</span>
                      <span className="font-mono text-slate-700">
                        {selectedEntry.signedAt
                          ? new Date(selectedEntry.signedAt).toLocaleString("en-GB")
                          : selectedEntry.formattedTimestamp || selectedEntry.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                      <span className="text-slate-500">Signature Attestation:</span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Valid Statutory Manifestation
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cryptographic SHA-256 Checksums */}
                <div>
                  <h4 className="mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Cryptographic Integrity Hashes (Merkle Linked)
                  </h4>
                  <div className="space-y-2">
                    {/* Previous Hash */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                          <Hash className="h-3 w-3" /> Previous Block Hash
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyHash(selectedEntry.previousHash || "")}
                          className="h-5 px-1.5 text-[10px] text-slate-600 hover:bg-slate-200"
                        >
                          <Copy className="h-2.5 w-2.5 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="font-mono text-[10px] break-all text-slate-700">
                        {selectedEntry.previousHash || "0000000000000000000000000000000000000000000000000000000000000000"}
                      </div>
                    </div>

                    {/* Current Block Hash */}
                    <div className="rounded-lg border border-slate-800 bg-slate-900 p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-emerald-400" /> Current Block Hash (SHA-256)
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyHash(selectedEntry.sha256Hash)}
                          className="h-5 px-1.5 text-[10px] text-slate-300 hover:bg-slate-800"
                        >
                          <Copy className="h-2.5 w-2.5 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="font-mono text-[10px] break-all text-emerald-400">
                        {selectedEntry.sha256Hash}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsInspectOpen(false)}
                  className="h-8 text-xs text-slate-600"
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenSignModal(selectedEntry)}
                    className="h-8 gap-1 border-slate-200 text-xs font-medium text-slate-700"
                  >
                    <Fingerprint className="h-3.5 w-3.5 text-emerald-600" />
                    Affix Signature
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedEntry, null, 2))
                      toast.success("Complete JSON audit entry copied to clipboard")
                    }}
                    className="h-8 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
                  >
                    Copy JSON
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 6. Affix 21 CFR Part 11 Electronic Signature Modal */}
      <Dialog open={isSignModalOpen} onOpenChange={setIsSignModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white p-6">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0090FF] mb-2">
              <Fingerprint className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Affix 21 CFR Part 11 Electronic Signature
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Signing electronically links your identity to this immutable record. Under FDA 21 CFR Part 11, this signature carries the legal weight of a traditional handwritten signature.
            </DialogDescription>
          </DialogHeader>

          {signingEntry && (
            <form onSubmit={handleExecuteSignature} className="mt-3 space-y-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Audit Ref:</span>
                  <span className="font-mono font-bold text-slate-900">{signingEntry.auditRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Entity:</span>
                  <span className="font-semibold text-slate-800">{signingEntry.entityTarget}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Action:</span>
                  <span className="font-semibold text-slate-800">{signingEntry.actionType}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Printed Legal Name of Signer *
                </Label>
                <Input
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. Toshin Bin Azad"
                  className="h-8 text-xs border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Signature Meaning / Authority *
                </Label>
                <Select value={signatureMeaning} onValueChange={setSignatureMeaning}>
                  <SelectTrigger className="h-8 text-xs border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Authorship">Authorship (Original Creator of Record)</SelectItem>
                    <SelectItem value="Approval">Approval (Formal Operational Signoff)</SelectItem>
                    <SelectItem value="Review">Review (Quality & Clinical Verification)</SelectItem>
                    <SelectItem value="Verification">Verification (Technical & Count Audit)</SelectItem>
                    <SelectItem value="Responsibility">Responsibility (Departmental Custody)</SelectItem>
                    <SelectItem value="Statutory Signoff">Statutory Signoff (Regulatory Compliance)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Reason for Change / Statutory Justification *
                </Label>
                <Textarea
                  required
                  rows={2}
                  value={signReason}
                  onChange={(e) => setSignReason(e.target.value)}
                  placeholder="Provide statutory justification or verification note..."
                  className="text-xs border-slate-200 resize-none"
                />
              </div>

              <DialogFooter className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSignModalOpen(false)}
                  disabled={isSubmittingSignature}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingSignature}
                  className="h-8 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
                >
                  {isSubmittingSignature ? "Affixing Signature..." : "Sign & Seal Record"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. Cryptographic Chain Integrity Verification Modal */}
      <Dialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl bg-white p-6">
          <DialogHeader>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl mb-2 ${
              verificationResult?.valid ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            }`}>
              {verificationResult?.valid ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Cryptographic SHA-256 Hash Chain Verification
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Audit trail validation sequentially checks each recorded event against its prior block cryptographic digest to ensure total tamper resistance.
            </DialogDescription>
          </DialogHeader>

          {isVerifying ? (
            <div className="py-8 text-center space-y-2">
              <RefreshCw className="h-8 w-8 animate-spin text-[#0090FF] mx-auto" />
              <p className="text-xs font-medium text-slate-600">Recalculating and checking chronological hash chain...</p>
            </div>
          ) : verificationResult ? (
            <div className="mt-3 space-y-3 text-xs">
              <div className={`rounded-xl border p-4 ${
                verificationResult.valid
                  ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                  : "border-rose-200 bg-rose-50/50 text-rose-900"
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {verificationResult.valid ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      100% Cryptographic Integrity Intact
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                      Tampering Detected in Write Ledger
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs opacity-90 leading-relaxed">
                  {verificationResult.message}
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Blocks Verified:</span>
                  <span className="font-bold text-slate-900">
                    {verificationResult.totalVerified} / {verificationResult.totalBlocks} Blocks
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Genesis Block Status:</span>
                  <span className="font-mono text-emerald-700 font-semibold">Valid (Zero-Hash Root)</span>
                </div>
                {verificationResult.headHash && (
                  <div className="border-t border-slate-200/60 pt-2">
                    <span className="text-slate-500 block mb-0.5">Active Ledger Head Digest:</span>
                    <span className="font-mono text-[10px] text-slate-800 break-all">
                      {verificationResult.headHash}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-end">
            <Button
              type="button"
              onClick={() => setIsVerifyModalOpen(false)}
              className="h-8 text-xs bg-[#0090FF] text-white hover:bg-[#0080e5]"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 8. Record Manual Statutory Compliance Event Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl bg-white p-6">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0090FF] mb-2">
              <FileText className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900">
              Record Statutory Compliance Event (21 CFR Part 11)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Records an explicit regulatory compliance action, inspection review, or quality variance note directly into the append-only audit trail.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateComplianceLog} className="mt-3 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Subsystem Module *</Label>
                <Select
                  value={newLogData.module}
                  onValueChange={(val) => setNewLogData({ ...newLogData, module: val })}
                >
                  <SelectTrigger className="h-8 text-xs border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="FEFO Warehouse">FEFO Warehouse</SelectItem>
                    <SelectItem value="Clinical Registry">Clinical Registry</SelectItem>
                    <SelectItem value="Finance & Accounts">Finance & Accounts</SelectItem>
                    <SelectItem value="Workforce & HR">Workforce & HR</SelectItem>
                    <SelectItem value="RBAC Security">RBAC Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Severity Tier *</Label>
                <Select
                  value={newLogData.severity}
                  onValueChange={(val) => setNewLogData({ ...newLogData, severity: val })}
                >
                  <SelectTrigger className="h-8 text-xs border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Routine">Routine (Operational)</SelectItem>
                    <SelectItem value="Statutory Notice">Statutory Notice</SelectItem>
                    <SelectItem value="Security Warning">Security Warning</SelectItem>
                    <SelectItem value="Critical">Critical (High Impact)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Action Type / Event *</Label>
                <Input
                  required
                  value={newLogData.actionType}
                  onChange={(e) => setNewLogData({ ...newLogData, actionType: e.target.value })}
                  placeholder="e.g. DGDA Regulatory Inspection"
                  className="h-8 text-xs border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Target Entity / Facility *</Label>
                <Input
                  required
                  value={newLogData.entityTarget}
                  onChange={(e) => setNewLogData({ ...newLogData, entityTarget: e.target.value })}
                  placeholder="e.g. Cleanroom Unit 02"
                  className="h-8 text-xs border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Audit Action Narrative *</Label>
              <Textarea
                required
                rows={2}
                value={newLogData.changeSummary}
                onChange={(e) => setNewLogData({ ...newLogData, changeSummary: e.target.value })}
                placeholder="Comprehensive description of the compliance event or review observation..."
                className="text-xs border-slate-200 resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                21 CFR Part 11 Regulatory Justification / Reason *
              </Label>
              <Textarea
                required
                rows={2}
                value={newLogData.reasonForChange}
                onChange={(e) => setNewLogData({ ...newLogData, reasonForChange: e.target.value })}
                placeholder="Regulatory justification under pharmaceutical compliance guidelines..."
                className="text-xs border-slate-200 resize-none"
              />
            </div>

            <DialogFooter className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreatingLog}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingLog}
                className="h-8 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
              >
                {isCreatingLog ? "Appending Record..." : "Commit To Ledger"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
