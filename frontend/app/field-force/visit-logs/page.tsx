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

const initialLogs: VisitLog[] = [
  {
    id: "1",
    dcrCode: "DCR-2026-101",
    doctorName: "Dr. Anwarul Azim",
    specialty: "Cardiologist",
    chamber: "Popular Diagnostic Center, Dhanmondi",
    mioName: "Rafiqul Islam",
    territory: "Dhaka North",
    visitDate: "2026-09-17",
    visitTime: "10:30 AM",
    promotedDrugs: "Rosuvastatin 10mg, Cardiloc 5mg",
    samplesGiven: "4 Strips",
    feedback: "High Potential",
  },
  {
    id: "2",
    dcrCode: "DCR-2026-102",
    doctorName: "Dr. Farhana Yasmin",
    specialty: "Gynecologist",
    chamber: "Labaid Specialized Hospital",
    mioName: "Rafiqul Islam",
    territory: "Dhaka North",
    visitDate: "2026-09-17",
    visitTime: "11:45 AM",
    promotedDrugs: "Fefol-Z, Calcium D3",
    samplesGiven: "6 Strips",
    feedback: "Positive",
  },
  {
    id: "3",
    dcrCode: "DCR-2026-103",
    doctorName: "Dr. S. K. Roy",
    specialty: "Internal Medicine",
    chamber: "Medinova Medical Services, Mirpur",
    mioName: "Tanvir Ahmed",
    territory: "Dhaka South",
    visitDate: "2026-09-17",
    visitTime: "01:15 PM",
    promotedDrugs: "Azithromycin 500mg, Omeprazole",
    samplesGiven: "2 Strips",
    feedback: "High Potential",
  },
  {
    id: "4",
    dcrCode: "DCR-2026-104",
    doctorName: "Dr. Mehedi Hasan",
    specialty: "Pediatrician",
    chamber: "Chevron Clinical Lab, Chittagong",
    mioName: "Kamrul Hasan",
    territory: "Chittagong Central",
    visitDate: "2026-09-16",
    visitTime: "03:40 PM",
    promotedDrugs: "Cef-3 Drops, Paracetamol Susp.",
    samplesGiven: "5 Vials",
    feedback: "Neutral",
  },
  {
    id: "5",
    dcrCode: "DCR-2026-105",
    doctorName: "Dr. Mustafizur Rahman",
    specialty: "Orthopedics",
    chamber: "Ibn Sina Hospital, Sylhet",
    mioName: "Enamul Haque",
    territory: "Sylhet Sadar",
    visitDate: "2026-09-16",
    visitTime: "05:10 PM",
    promotedDrugs: "Aceclofenac 100mg, Diacerein",
    samplesGiven: "3 Strips",
    feedback: "Needs Follow-up",
  },
  {
    id: "6",
    dcrCode: "DCR-2026-106",
    doctorName: "Dr. Nadia Islam",
    specialty: "General Physician",
    chamber: "Apollo Clinic, Rajshahi",
    mioName: "Sabbir Hossain",
    territory: "Rajshahi Metro",
    visitDate: "2026-09-15",
    visitTime: "06:30 PM",
    promotedDrugs: "Pantoprazole 20mg, Antacid Susp.",
    samplesGiven: "4 Strips",
    feedback: "Positive",
  },
]

export default function DoctorVisitLogsPage() {
  const [logs, setLogs] = React.useState<VisitLog[]>(initialLogs)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [feedbackFilter, setFeedbackFilter] = React.useState("all")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  // Edit Log Dialog State
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingLog, setEditingLog] = React.useState<VisitLog | null>(null)

  const [successToast, setSuccessToast] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const showNotification = (msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(null), 3500)
  }

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

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault()
    const newLog: VisitLog = {
      id: Date.now().toString(),
      dcrCode: `DCR-2026-10${logs.length + 7}`,
      doctorName,
      specialty,
      chamber,
      mioName,
      territory,
      visitDate: visitDate || new Date().toISOString().slice(0, 10),
      visitTime: visitTime || "12:00 PM",
      promotedDrugs,
      samplesGiven: samplesGiven || "None",
      feedback,
    }

    setLogs((prev) => [newLog, ...prev])
    setDoctorName("")
    setSpecialty("")
    setChamber("")
    setMioName("")
    setTerritory("")
    setPromotedDrugs("")
    setSamplesGiven("")
    setIsDialogOpen(false)
    showNotification(`Successfully recorded call log for ${newLog.doctorName}.`)
  }

  const handleOpenEdit = (item: VisitLog) => {
    setEditingLog({ ...item })
    setIsEditOpen(true)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLog) return

    setLogs((prev) =>
      prev.map((l) => (l.id === editingLog.id ? editingLog : l))
    )
    setIsEditOpen(false)
    setEditingLog(null)
    showNotification("Call log updated successfully.")
  }

  const handleDeleteLog = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id))
    showNotification("Call log deleted.")
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
    showNotification("Doctor Visit Logs exported to Excel successfully.")
  }

  // Import Visit Logs from Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: "binary" })
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json<any>(ws)

        const importedLogs: VisitLog[] = data.map((row, index) => ({
          id: `imported-${Date.now()}-${index}`,
          dcrCode:
            row["Call Ref"] || row["DCR Code"] || `DCR-2026-${200 + index}`,
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
        }))

        setLogs((prev) => [...importedLogs, ...prev])
        showNotification(
          `Successfully imported ${importedLogs.length} visit logs from Excel.`
        )
      } catch (err) {
        console.error(err)
        alert(
          "Failed to parse Excel file. Please ensure columns match standard headings."
        )
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
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="doc"
                      className="text-xs font-medium text-slate-700"
                    >
                      Doctor Name
                    </Label>
                    <Input
                      id="doc"
                      placeholder="e.g. Dr. Tareq Mahmud"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
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
            24 Units
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
            {filteredLogs.map((item) => (
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
                            onClick={() => handleDeleteLog(item.id)}
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
            ))}
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
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Doctor Name
                  </Label>
                  <Input
                    value={editingLog.doctorName}
                    onChange={(e) =>
                      setEditingLog({
                        ...editingLog,
                        doctorName: e.target.value,
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
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
    </div>
  )
}
