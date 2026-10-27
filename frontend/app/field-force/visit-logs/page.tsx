"use client"

import * as React from "react"
import * as XLSX from "xlsx"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Clock,
  MapPin,
  Plus,
  Stethoscope,
  Filter,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  Search,
  Download,
  Upload,
  Printer,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"

/* ------------------------------------------------------------------ */
/* Optimized Print stylesheet for DCR Ledger (Clean, Professional)     */
/* ------------------------------------------------------------------ */
const PRINT_STYLES = `
@page {
  size: A4 landscape;
  margin: 10mm;
}

@media print {
  html,
  body {
    height: auto !important;
    overflow: visible !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body * {
    visibility: hidden !important;
  }

  .print-visit-node,
  .print-visit-node * {
    visibility: visible !important;
  }

  .print-visit-node {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    right: auto !important;
    bottom: auto !important;
    transform: none !important;
    translate: none !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: visible !important;
    display: block !important;
    background: #ffffff !important;
  }

  [data-radix-popper-content-wrapper],
  .print-visit-node > button[type="button"][class*="absolute"] {
    display: none !important;
  }

  .print\\:hidden,
  button {
    display: none !important;
  }

  table {
    width: 100% !important;
    border-collapse: collapse !important;
  }

  th, td {
    padding: 6px 8px !important;
    font-size: 10.5px !important;
    border-bottom: 1px solid #cbd5e1 !important;
  }

  tr {
    page-break-inside: avoid;
  }
}
`

interface VisitLog {
  id: string
  dcrCode: string
  doctorName: string
  specialty: string
  chamber: string
  mioName: string
  territory: string
  visitDate: string
  visitTime: string
  promotedDrugs: string
  samplesGiven: string
  feedback: "High Potential" | "Positive" | "Neutral" | "Needs Follow-up"
}

interface RegisteredDoctor {
  id: string
  doctorName: string
  specialtyAndInstitute?: string
  specialty?: string
  chamber?: string
  territoryAndMio?: string
  territory?: string
  assignedMio?: string
  bmdcRegNumber?: string
}

import { getEndpoint, apiFetch } from "@/lib/api"
import { visitLogFormSchema } from "@/lib/validations/doctorVisitLogValidation"

export default function DoctorVisitLogsPage() {
  const [logs, setLogs] = React.useState<VisitLog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [feedbackFilter, setFeedbackFilter] = React.useState("all")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  // Doctor collection registry search states
  const [registeredDoctors, setRegisteredDoctors] = React.useState<RegisteredDoctor[]>([])
  const [isAddDoctorDropdownOpen, setIsAddDoctorDropdownOpen] = React.useState(false)
  const [isEditDoctorDropdownOpen, setIsEditDoctorDropdownOpen] = React.useState(false)
  const [selectedDoctorBadge, setSelectedDoctorBadge] = React.useState<string | null>(null)
  const addDoctorContainerRef = React.useRef<HTMLDivElement | null>(null)
  const editDoctorContainerRef = React.useRef<HTMLDivElement | null>(null)

  // Edit Log Dialog State
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingLog, setEditingLog] = React.useState<VisitLog | null>(null)

  // Global Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = React.useState<{
    isOpen: boolean
    logId: string | null
    doctorName: string | null
    isDeleting: boolean
  }>({
    isOpen: false,
    logId: null,
    doctorName: null,
    isDeleting: false,
  })

  const [successToast, setSuccessToast] = React.useState<string | null>(null)
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Form states (Add)
  const [doctorName, setDoctorName] = React.useState("")
  const [specialty, setSpecialty] = React.useState("")
  const [chamber, setChamber] = React.useState("")
  const [mioName, setMioName] = React.useState("")
  const [territory, setTerritory] = React.useState("")
  const [visitDate, setVisitDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  )
  const [visitTime, setVisitTime] = React.useState("10:00 AM")
  const [promotedDrugs, setPromotedDrugs] = React.useState("")
  const [samplesGiven, setSamplesGiven] = React.useState("")
  const [feedback, setFeedback] =
    React.useState<VisitLog["feedback"]>("Positive")

  const showNotification = (msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(null), 3500)
  }

  // Fetch live logs from backend
  const fetchLogs = async () => {
    try {
      setLoading(true)
      const res = await apiFetch(getEndpoint("/visit-logs")).catch(() => null)
      if (res && res.ok) {
        const result = await res.json()
        const rawData = Array.isArray(result) ? result : result.data || []
        const formatted: VisitLog[] = rawData.map((item: any) => ({
          id: item.id || item._id,
          dcrCode: item.dcrCode || `DCR-${(item.id || item._id)?.slice(-4)}`,
          doctorName: item.doctorName || "",
          specialty: item.specialty || "",
          chamber: item.chamber || "",
          mioName: item.mioName || "",
          territory: item.territory || "",
          visitDate: item.visitDate || "",
          visitTime: item.visitTime || "",
          promotedDrugs: item.promotedDrugs || "",
          samplesGiven: item.samplesGiven || "None",
          feedback: (item.feedback || "Positive") as VisitLog["feedback"],
        }))
        setLogs(formatted)
      } else {
        setLogs([])
      }
    } catch (err) {
      console.error("Failed to fetch visit logs from backend:", err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch doctor collection from backend
  const fetchDoctors = async () => {
    try {
      const res = await apiFetch(getEndpoint("/doctors")).catch(() => null)
      if (res && res.ok) {
        const result = await res.json()
        const rawData = Array.isArray(result) ? result : result.data || []
        setRegisteredDoctors(rawData)
      }
    } catch (err) {
      console.error("Failed to fetch registered doctors collection:", err)
    }
  }

  React.useEffect(() => {
    fetchLogs()
    fetchDoctors()
  }, [])

  // Auto-close doctor search dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addDoctorContainerRef.current &&
        !addDoctorContainerRef.current.contains(event.target as Node)
      ) {
        setIsAddDoctorDropdownOpen(false)
      }
      if (
        editDoctorContainerRef.current &&
        !editDoctorContainerRef.current.contains(event.target as Node)
      ) {
        setIsEditDoctorDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Doctor Selection Handlers & Auto-fill Logic
  const selectDoctorForAdd = (doc: RegisteredDoctor) => {
    setDoctorName(doc.doctorName || "")
    const docSpecialty = doc.specialtyAndInstitute || doc.specialty || ""
    setSpecialty(docSpecialty)
    setChamber(doc.chamber || "")

    let pTerritory = doc.territory || ""
    let pMio = doc.assignedMio || ""

    if (doc.territoryAndMio) {
      const parts = doc.territoryAndMio.split(/[/|-]/).map((s) => s.trim())
      if (parts.length >= 2) {
        pTerritory = parts[0]
        pMio = parts[1].replace(/^MIO\s+/i, "")
      } else if (parts.length === 1 && parts[0]) {
        pTerritory = parts[0]
      }
    }

    if (pTerritory) setTerritory(pTerritory)
    if (pMio) setMioName(pMio)

    setSelectedDoctorBadge(doc.doctorName)
    setIsAddDoctorDropdownOpen(false)
  }

  const selectDoctorForEdit = (doc: RegisteredDoctor) => {
    if (!editingLog) return
    let pTerritory = doc.territory || ""
    let pMio = doc.assignedMio || ""

    if (doc.territoryAndMio) {
      const parts = doc.territoryAndMio.split(/[/|-]/).map((s) => s.trim())
      if (parts.length >= 2) {
        pTerritory = parts[0]
        pMio = parts[1].replace(/^MIO\s+/i, "")
      } else if (parts.length === 1 && parts[0]) {
        pTerritory = parts[0]
      }
    }

    setEditingLog({
      ...editingLog,
      doctorName: doc.doctorName || editingLog.doctorName,
      specialty: doc.specialtyAndInstitute || doc.specialty || editingLog.specialty,
      chamber: doc.chamber || editingLog.chamber,
      territory: pTerritory || editingLog.territory,
      mioName: pMio || editingLog.mioName,
    })

    setIsEditDoctorDropdownOpen(false)
  }

  const filteredDoctorsForAdd = React.useMemo(() => {
    if (!doctorName.trim()) return registeredDoctors.slice(0, 6)
    const q = doctorName.toLowerCase()
    return registeredDoctors.filter(
      (doc) =>
        doc.doctorName?.toLowerCase().includes(q) ||
        doc.specialtyAndInstitute?.toLowerCase().includes(q) ||
        doc.specialty?.toLowerCase().includes(q) ||
        doc.chamber?.toLowerCase().includes(q)
    )
  }, [registeredDoctors, doctorName])

  const filteredDoctorsForEdit = React.useMemo(() => {
    if (!editingLog?.doctorName?.trim()) return registeredDoctors.slice(0, 6)
    const q = editingLog.doctorName.toLowerCase()
    return registeredDoctors.filter(
      (doc) =>
        doc.doctorName?.toLowerCase().includes(q) ||
        doc.specialtyAndInstitute?.toLowerCase().includes(q) ||
        doc.specialty?.toLowerCase().includes(q) ||
        doc.chamber?.toLowerCase().includes(q)
    )
  }, [registeredDoctors, editingLog?.doctorName])


  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    const payload = {
      doctorName,
      specialty,
      chamber,
      mioName,
      territory,
      visitDate: visitDate || new Date().toISOString().slice(0, 10),
      visitTime: visitTime || "10:00 AM",
      promotedDrugs,
      samplesGiven: samplesGiven || "None",
      feedback,
    }

    const validationResult = visitLogFormSchema.safeParse(payload)
    if (!validationResult.success) {
      const errorsMap: Record<string, string> = {}
      validationResult.error.issues.forEach((issue) => {
        const pathKey = issue.path[0]?.toString() || "form"
        errorsMap[pathKey] = issue.message
      })
      setFormErrors(errorsMap)
      toast.error("Form validation failed. Please check the highlighted fields.")
      return
    }

    const toastId = toast.loading("Saving doctor visit log to database...")

    try {
      const res = await apiFetch(getEndpoint("/visit-logs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationResult.data),
      })

      if (res.ok) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        setDoctorName("")
        setSpecialty("")
        setChamber("")
        setMioName("")
        setTerritory("")
        setPromotedDrugs("")
        setSamplesGiven("")
        setFormErrors({})
        setIsDialogOpen(false)
        toast.success(`Visit log for ${payload.doctorName} recorded successfully!`, { id: toastId })
        fetchLogs()
      } else {
        const errorData = await res.json().catch(() => null)
        toast.error(errorData?.message || "Failed to save visit log.", { id: toastId })
      }
    } catch (err) {
      console.error("Error communicating with backend:", err)
      toast.error("Network error: Could not reach backend server.", { id: toastId })
    }
  }

  const handleOpenEdit = (item: VisitLog) => {
    setEditingLog({ ...item })
    setIsEditOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLog) return

    const validationResult = visitLogFormSchema.partial().safeParse(editingLog)
    if (!validationResult.success) {
      toast.error(validationResult.error.issues.map((i) => i.message).join("\n"))
      return
    }

    const toastId = toast.loading("Updating visit log in database...")

    try {
      const res = await apiFetch(getEndpoint(`/visit-logs/${editingLog.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationResult.data),
      })

      if (res.ok) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        setIsEditOpen(false)
        setEditingLog(null)
        toast.success(`Visit log for ${editingLog.doctorName} updated successfully!`, { id: toastId })
        fetchLogs()
      } else {
        const errorData = await res.json().catch(() => null)
        toast.error(errorData?.message || "Failed to update visit log.", { id: toastId })
      }
    } catch (err) {
      console.error("Failed to update call log:", err)
      toast.error("Network error: Failed to update visit log.", { id: toastId })
    }
  }

  const promptDeleteLog = (log: VisitLog) => {
    setDeleteModal({
      isOpen: true,
      logId: log.id,
      doctorName: log.doctorName,
      isDeleting: false,
    })
  }

  const handleConfirmDeleteLog = async () => {
    if (!deleteModal.logId) return
    const id = deleteModal.logId
    const targetDoctor = deleteModal.doctorName || "Doctor"

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }))
    const toastId = toast.loading(`Deleting visit log for ${targetDoctor}...`)

    try {
      const res = await apiFetch(getEndpoint(`/visit-logs/${id}`), {
        method: "DELETE",
      })
      if (res.ok) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        setLogs((prev) => prev.filter((l) => l.id !== id))
        toast.success(`Visit log for ${targetDoctor} deleted successfully.`, { id: toastId })
        setDeleteModal({ isOpen: false, logId: null, doctorName: null, isDeleting: false })
        fetchLogs()
      } else {
        const errorData = await res.json().catch(() => null)
        toast.error(errorData?.message || "Failed to delete visit log.", { id: toastId })
        setDeleteModal((prev) => ({ ...prev, isDeleting: false }))
      }
    } catch (err) {
      console.error("Failed to delete call log:", err)
      toast.error("Network error: Could not delete visit log.", { id: toastId })
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  const handleTriggerPrint = () => {
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 60)
    })
  }

  // Export Visit Logs to Excel
  const handleExportExcel = () => {
    const exportData = logs.map((item) => ({
      "Call Ref": item.dcrCode,
      "Doctor Name": item.doctorName,
      Specialty: item.specialty,
      "Chamber Location": item.chamber,
      "Field MIO": item.mioName,
      Territory: item.territory,
      "Visit Date": item.visitDate,
      "Visit Time": item.visitTime,
      "Promoted Drugs": item.promotedDrugs,
      "Samples Given": item.samplesGiven,
      "Commitment Sentiment": item.feedback,
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Doctor Visit Logs")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Doctor_Visit_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
    toast.success("Doctor Visit Logs exported to Excel successfully.")
  }

  // Import Visit Logs from Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const toastId = toast.loading("Processing Excel import...")

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: "binary" })
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json<any>(ws)

        let importedCount = 0
        for (const row of data) {
          const payload = {
            dcrCode:
              row["Call Ref"] || row["DCR Code"] || `DCR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            doctorName: row["Doctor Name"] || "Dr. Unknown",
            specialty: row["Specialty"] || "General Physician",
            chamber:
              row["Chamber Location"] || row["Chamber"] || "General Clinic",
            mioName:
              row["Field MIO"] || row["MIO Name"] || "Field Representative",
            territory: row["Territory"] || "Central Hub",
            visitDate: row["Visit Date"] || new Date().toISOString().slice(0, 10),
            visitTime: row["Visit Time"] || row["Time"] || "10:00 AM",
            promotedDrugs: row["Promoted Drugs"] || "Standard Formulations",
            samplesGiven: row["Samples Given"] || "None",
            feedback: (row["Commitment Sentiment"] ||
              row["Feedback"] ||
              "Positive") as VisitLog["feedback"],
          }

          const res = await apiFetch(getEndpoint("/visit-logs"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
          if (res.ok) importedCount++
        }

        toast.success(`Successfully imported ${importedCount} visit log(s) to database.`, { id: toastId })
        fetchLogs()
      } catch (err) {
        console.error(err)
        toast.error("Failed to process Excel file.", { id: toastId })
      }
    }
    reader.readAsBinaryString(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const filteredLogs = logs.filter((item) => {
    const matchesSearch =
      item.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.chamber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mioName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFeedback =
      feedbackFilter === "all" ||
      item.feedback.toLowerCase() === feedbackFilter.toLowerCase()

    return matchesSearch && matchesFeedback
  })

  const highPotentialCount = logs.filter(
    (l) => l.feedback === "High Potential"
  ).length

  const samplesHandedOut = React.useMemo(() => {
    return logs.reduce((sum, item) => {
      if (!item.samplesGiven || item.samplesGiven.toLowerCase() === "none") return sum
      const numbers = item.samplesGiven.match(/\d+/g)
      if (numbers) {
        return sum + numbers.reduce((a, b) => a + parseInt(b, 10), 0)
      }
      return sum + 1
    }, 0)
  }, [logs])

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-10">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {successToast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 print:hidden">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Hidden file input for Excel import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportExcel}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* 1. Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Daily Call Reports (DCR) — Doctor Visit Logs
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time field call entries, prescription commitment feedback, and
            drug sample records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Excel
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Upload className="h-3.5 w-3.5 text-blue-600" />
            Import Excel
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleTriggerPrint}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5 text-slate-600" />
            Print Ledger
          </Button>

          {/* New Call Log Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-3.5 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
              >
                <Plus className="h-4 w-4" />
                Log Doctor Call
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl bg-white sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Log Daily Doctor Call
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Record field engagement notes, sampled items, and commitment
                  feedback.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddLog} className="space-y-3.5 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div ref={addDoctorContainerRef} className="relative space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="doc"
                        className="text-xs font-medium text-slate-700"
                      >
                        Doctor Name
                      </Label>
                      {selectedDoctorBadge && (
                        <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                          Auto-filled from Registry
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="doc"
                        placeholder="Search & select doctor..."
                        value={doctorName}
                        onChange={(e) => {
                          setDoctorName(e.target.value)
                          setSelectedDoctorBadge(null)
                          setIsAddDoctorDropdownOpen(true)
                        }}
                        onFocus={() => setIsAddDoctorDropdownOpen(true)}
                        required
                        className="h-8 pr-7 text-xs"
                      />
                      <Stethoscope className="pointer-events-none absolute top-2 right-2 h-4 w-4 text-slate-400" />
                    </div>

                    {isAddDoctorDropdownOpen && registeredDoctors.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                        <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          Doctor Collection ({filteredDoctorsForAdd.length} found)
                        </div>
                        {filteredDoctorsForAdd.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-slate-400">
                            No matching doctor found. Type to enter custom doctor.
                          </div>
                        ) : (
                          filteredDoctorsForAdd.map((doc) => (
                            <div
                              key={doc.id}
                              onClick={() => selectDoctorForAdd(doc)}
                              className="group flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 transition-colors hover:bg-slate-100"
                            >
                              <div>
                                <p className="text-xs font-semibold text-slate-900 group-hover:text-[#0090FF]">
                                  {doc.doctorName}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {doc.specialtyAndInstitute || doc.specialty || "Specialist"} • {doc.chamber || "Chamber"}
                                </p>
                              </div>
                              {doc.territoryAndMio && (
                                <span className="rounded border border-slate-100 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                  {doc.territoryAndMio}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="specialty"
                      className="text-xs font-medium text-slate-700"
                    >
                      Specialty
                    </Label>
                    <Input
                      id="specialty"
                      placeholder="e.g. Cardiology"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="chamber"
                    className="text-xs font-medium text-slate-700"
                  >
                    Chamber / Hospital Address
                  </Label>
                  <Input
                    id="chamber"
                    placeholder="e.g. Popular Diagnostic, Mirpur"
                    value={chamber}
                    onChange={(e) => setChamber(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="mio"
                      className="text-xs font-medium text-slate-700"
                    >
                      Field MIO
                    </Label>
                    <Input
                      id="mio"
                      placeholder="MIO Name"
                      value={mioName}
                      onChange={(e) => setMioName(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="territory"
                      className="text-xs font-medium text-slate-700"
                    >
                      Territory
                    </Label>
                    <Input
                      id="territory"
                      placeholder="Territory Zone"
                      value={territory}
                      onChange={(e) => setTerritory(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="visitDate"
                      className="text-xs font-medium text-slate-700"
                    >
                      Visit Date
                    </Label>
                    <Input
                      id="visitDate"
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      required
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="time"
                      className="text-xs font-medium text-slate-700"
                    >
                      Call Time
                    </Label>
                    <Input
                      id="time"
                      placeholder="11:30 AM"
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      required
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="drugs"
                      className="text-xs font-medium text-slate-700"
                    >
                      Promoted Formulations
                    </Label>
                    <Input
                      id="drugs"
                      placeholder="e.g. Napa Extra, Ciprocin"
                      value={promotedDrugs}
                      onChange={(e) => setPromotedDrugs(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="samples"
                      className="text-xs font-medium text-slate-700"
                    >
                      Samples Handed Over
                    </Label>
                    <Input
                      id="samples"
                      placeholder="e.g. 4 Strips"
                      value={samplesGiven}
                      onChange={(e) => setSamplesGiven(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="feedback"
                    className="text-xs font-medium text-slate-700"
                  >
                    Doctor Feedback Sentiment
                  </Label>
                  <Select
                    value={feedback}
                    onValueChange={(val) =>
                      setFeedback(val as VisitLog["feedback"])
                    }
                  >
                    <SelectTrigger className="h-8 bg-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="High Potential">
                        High Potential (Committed to Prescribe)
                      </SelectItem>
                      <SelectItem value="Positive">
                        Positive (Interested in Trial)
                      </SelectItem>
                      <SelectItem value="Neutral">
                        Neutral (Standard Briefing)
                      </SelectItem>
                      <SelectItem value="Needs Follow-up">
                        Needs Follow-up (Stock Clarification)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
                  >
                    Save Call Log
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total Visits Logged
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <Stethoscope className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {logs.length}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Physicians visited across territories
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              High Potential Calls
            </span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {highPotentialCount}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Committed to active prescription
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Call Success Rate
            </span>
            <Badge
              variant="outline"
              className="rounded-md border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-800"
            >
              Target: 80%
            </Badge>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {Math.round((highPotentialCount / (logs.length || 1)) * 100)}%
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Positive conversion index
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Samples Handed Out
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] leading-none font-bold tracking-tight text-slate-900">
            {samplesHandedOut} Units
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Sample reconciliation verified
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search doctor, chamber, or MIO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-slate-200 bg-slate-50/50 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
            <SelectTrigger className="h-8 w-[160px] border-slate-200 bg-white text-xs">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="Filter Sentiment" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Sentiments</SelectItem>
              <SelectItem value="high potential">High Potential</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="needs follow-up">Needs Follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Doctor Visit Logs Ledger */}
      <Card className="print-visit-node rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              AK PHARMA — FIELD EXECUTION LEDGER (DCR)
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Verified doctor calls, promotional detailing, and physician
              feedback
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-slate-400 print:hidden">
              Showing {filteredLogs.length} Records
            </span>
            <span className="hidden font-mono text-xs text-slate-400 print:inline">
              Generated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0 text-xs font-medium text-slate-600">
                Call Ref
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Doctor / Specialty
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Chamber Location
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Field MIO
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Date & Time
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Promoted Drugs
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Samples
              </TableHead>
              <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                Commitment / Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-xs text-slate-500">
                  Loading doctor visit logs...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Stethoscope className="h-8 w-8 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-700">
                      {logs.length === 0
                        ? "No Doctor Visit Logs Recorded"
                        : "No matching logs found"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {logs.length === 0
                        ? "Click 'Log Doctor Call' or import an Excel file to populate real-time entries."
                        : "Try clearing your search query or feedback sentiment filter."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50"
                >
                  <TableCell className="py-3 pl-0 font-mono text-xs font-semibold text-[#0090FF]">
                    {item.dcrCode}
                  </TableCell>
                  <TableCell className="py-3 text-xs font-semibold text-slate-900">
                    <div>
                      <span>{item.doctorName}</span>
                      <span className="block text-[11px] font-normal text-slate-500">
                        {item.specialty}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate py-3 text-xs text-slate-600">
                    {item.chamber}
                  </TableCell>
                  <TableCell className="py-3 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span>{item.mioName}</span>
                      <span className="text-[10px] text-slate-400">
                        ({item.territory})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-xs whitespace-nowrap text-slate-600">
                    <div>
                      <span className="block font-mono text-[11px] text-slate-800">
                        {item.visitDate}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {item.visitTime}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate py-3 text-xs text-slate-700">
                    {item.promotedDrugs}
                  </TableCell>
                  <TableCell className="py-3 text-xs font-medium text-slate-600">
                    {item.samplesGiven}
                  </TableCell>
                  <TableCell className="py-3 pr-0 text-right text-xs">
                    <div className="flex items-center justify-end gap-2">
                      <Badge
                        variant="outline"
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          item.feedback === "High Potential"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : item.feedback === "Positive"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : item.feedback === "Neutral"
                                ? "border-slate-200 bg-slate-50 text-slate-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.feedback}
                      </Badge>

                      <div className="print:hidden">
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
                            className="w-36 bg-white"
                          >
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(item)}
                              className="cursor-pointer text-xs text-slate-700"
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5 text-slate-500" />
                              Edit Call
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => promptDeleteLog(item)}
                              className="cursor-pointer text-xs text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Edit Call Log Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Doctor Call Log
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Modify visit schedule, promoted formulations, or commitment
              feedback.
            </DialogDescription>
          </DialogHeader>

          {editingLog && (
            <form onSubmit={handleSaveEdit} className="space-y-3.5 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div ref={editDoctorContainerRef} className="relative space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Doctor Name
                  </Label>
                  <div className="relative">
                    <Input
                      value={editingLog.doctorName}
                      onChange={(e) => {
                        setEditingLog({
                          ...editingLog,
                          doctorName: e.target.value,
                        })
                        setIsEditDoctorDropdownOpen(true)
                      }}
                      onFocus={() => setIsEditDoctorDropdownOpen(true)}
                      required
                      className="h-8 pr-7 text-xs"
                    />
                    <Stethoscope className="pointer-events-none absolute top-2 right-2 h-4 w-4 text-slate-400" />
                  </div>

                  {isEditDoctorDropdownOpen && registeredDoctors.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                      <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Select Doctor to Update Details
                      </div>
                      {filteredDoctorsForEdit.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => selectDoctorForEdit(doc)}
                          className="group flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 transition-colors hover:bg-slate-100"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-900 group-hover:text-[#0090FF]">
                              {doc.doctorName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {doc.specialtyAndInstitute || doc.specialty || "Specialist"} • {doc.chamber || "Chamber"}
                            </p>
                          </div>
                          {doc.territoryAndMio && (
                            <span className="rounded border border-slate-100 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                              {doc.territoryAndMio}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Specialty
                  </Label>
                  <Input
                    value={editingLog.specialty}
                    onChange={(e) =>
                      setEditingLog({
                        ...editingLog,
                        specialty: e.target.value,
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Chamber / Hospital Address
                </Label>
                <Input
                  value={editingLog.chamber}
                  onChange={(e) =>
                    setEditingLog({ ...editingLog, chamber: e.target.value })
                  }
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Field MIO
                  </Label>
                  <Input
                    value={editingLog.mioName}
                    onChange={(e) =>
                      setEditingLog({ ...editingLog, mioName: e.target.value })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Territory
                  </Label>
                  <Input
                    value={editingLog.territory}
                    onChange={(e) =>
                      setEditingLog({
                        ...editingLog,
                        territory: e.target.value,
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Visit Date
                  </Label>
                  <Input
                    type="date"
                    value={editingLog.visitDate}
                    onChange={(e) =>
                      setEditingLog({
                        ...editingLog,
                        visitDate: e.target.value,
                      })
                    }
                    required
                    className="h-8 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Call Time
                  </Label>
                  <Input
                    value={editingLog.visitTime}
                    onChange={(e) =>
                      setEditingLog({
                        ...editingLog,
                        visitTime: e.target.value,
                      })
                    }
                    required
                    className="h-8 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Promoted Formulations
                  </Label>
                  <Input
                    value={editingLog.promotedDrugs}
                    onChange={(e) =>
                      setEditingLog({
                        ...editingLog,
                        promotedDrugs: e.target.value,
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Samples Handed Over
                  </Label>
                  <Input
                    value={editingLog.samplesGiven}
                    onChange={(e) =>
                      setEditingLog({
                        ...editingLog,
                        samplesGiven: e.target.value,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Doctor Feedback Sentiment
                </Label>
                <Select
                  value={editingLog.feedback}
                  onValueChange={(val) =>
                    setEditingLog({
                      ...editingLog,
                      feedback: val as VisitLog["feedback"],
                    })
                  }
                >
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="High Potential">
                      High Potential (Committed to Prescribe)
                    </SelectItem>
                    <SelectItem value="Positive">
                      Positive (Interested in Trial)
                    </SelectItem>
                    <SelectItem value="Neutral">
                      Neutral (Standard Briefing)
                    </SelectItem>
                    <SelectItem value="Needs Follow-up">
                      Needs Follow-up (Stock Clarification)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-8 bg-[#0090FF] text-xs text-white hover:bg-[#0080e5]"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* 6. Global Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModal.isOpen}
        onOpenChange={(open) =>
          setDeleteModal((prev) => ({ ...prev, isOpen: open }))
        }
        onConfirm={handleConfirmDeleteLog}
        title="Delete Doctor Visit Log"
        description="Are you sure you want to permanently delete this doctor visit log? This database record cannot be restored."
        itemName={deleteModal.doctorName ? `Call log for ${deleteModal.doctorName}` : undefined}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  )
}
