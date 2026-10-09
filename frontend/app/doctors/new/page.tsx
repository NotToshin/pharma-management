"use client"

import * as React from "react"
import { getEndpoint } from "@/lib/api"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Stethoscope,
  Plus,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  UserPlus,
  Building,
  PhoneCall,
  IdCard,
  MapPin,
} from "lucide-react"

import { doctorFormSchema } from "@/lib/validations/doctorValidation"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"

export interface DoctorProfile {
  id: string
  doctorName: string
  phone: string
  bmdcRegNumber: string
  specialtyAndInstitute: string
  chamber: string
  territoryAndMio: string
  email: string
  tier: "Tier 1 (High Prescriber)" | "Tier 2 (Moderate)" | "Tier 3 (Potential)"
}

export default function AddDoctorDirectoryPage() {
  const [doctors, setDoctors] = React.useState<DoctorProfile[]>([])
  const [loading, setLoading] = React.useState(true)
  const [successToast, setSuccessToast] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Single Doctor Form State
  const [doctorName, setDoctorName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [bmdcRegNumber, setBmdcRegNumber] = React.useState("")
  const [specialty, setSpecialty] = React.useState("")
  const [institute, setInstitute] = React.useState("")
  const [chamber, setChamber] = React.useState("")
  const [territoryAndMio, setTerritoryAndMio] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [patientVolumeDaily, setPatientVolumeDaily] = React.useState("30")
  const [tier, setTier] = React.useState<DoctorProfile["tier"]>(
    "Tier 1 (High Prescriber)"
  )
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

  // Global Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = React.useState<{
    isOpen: boolean
    doctorId: string | null
    doctorName: string | null
    isDeleting: boolean
  }>({
    isOpen: false,
    doctorId: null,
    doctorName: null,
    isDeleting: false,
  })

  const showNotification = (msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(null), 3500)
  }

  // Fetch live doctors from backend database
  const fetchDoctors = async () => {
    try {
      const res = await fetch(getEndpoint("/doctors"))
      const result = await res.json()
      const rawData = Array.isArray(result) ? result : result.data || []

      const formatted: DoctorProfile[] = rawData.map(
        (doc: any, index: number) => ({
          id: doc.id || String(index),
          doctorName: doc.doctorName || doc.name,
          phone: doc.phone || "+880 1700-000000",
          bmdcRegNumber: doc.bmdcRegNumber || "BMDC-A-00000",
          specialtyAndInstitute:
            doc.specialtyAndInstitute || "General Physician",
          chamber: doc.chamber || "General Clinic",
          territoryAndMio: doc.territoryAndMio || "Central Hub",
          email: doc.email || "doctor@akpharma.com",
          tier: doc.tier || "Tier 2 (Moderate)",
        })
      )

      setDoctors(formatted)
    } catch (err) {
      console.error("Failed to fetch doctors from backend:", err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchDoctors()
  }, [])

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    const cleanSpecialty = specialty.split("(")[0].trim()
    const cleanInstitute = institute.split("(")[0].trim()
    const specialtyAndInstitute = cleanInstitute
      ? `${cleanSpecialty} (${cleanInstitute})`
      : cleanSpecialty

    const newDocPayload = {
      doctorName,
      phone,
      bmdcRegNumber,
      specialtyAndInstitute,
      chamber,
      territoryAndMio,
      email,
      tier,
      patientVolumeDaily: Number(patientVolumeDaily),
    }

    const validationResult = doctorFormSchema.safeParse(newDocPayload)
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

    const toastId = toast.loading("Registering new doctor profile in database...")

    try {
      const res = await fetch(getEndpoint("/doctors"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationResult.data),
      })

      if (res.ok) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        setDoctorName("")
        setPhone("")
        setBmdcRegNumber("")
        setSpecialty("")
        setInstitute("")
        setChamber("")
        setTerritoryAndMio("")
        setEmail("")
        setPatientVolumeDaily("30")
        setFormErrors({})
        const formattedDocName = newDocPayload.doctorName.startsWith("Dr.") ? newDocPayload.doctorName : `Dr. ${newDocPayload.doctorName}`
        toast.success(`Successfully registered ${formattedDocName} into database!`, { id: toastId })
        fetchDoctors()
      } else {
        const errorData = await res.json().catch(() => null)
        toast.error(errorData?.message || "Server responded with an error.", { id: toastId })
      }
    } catch (err) {
      console.error("Error communicating with backend:", err)
      toast.error("Failed to connect to backend server.", { id: toastId })
    }
  }

  const promptDeleteDoctor = (doc: DoctorProfile) => {
    setDeleteModal({
      isOpen: true,
      doctorId: doc.id,
      doctorName: doc.doctorName,
      isDeleting: false,
    })
  }

  const handleConfirmDeleteDoctor = async () => {
    if (!deleteModal.doctorId) return
    const id = deleteModal.doctorId
    const targetName = deleteModal.doctorName || "Doctor"

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }))
    const toastId = toast.loading(`Deleting doctor profile for ${targetName}...`)

    try {
      const res = await fetch(getEndpoint(`/doctors/${id}`), {
        method: "DELETE",
      })
      if (res.ok) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        setDoctors((prev) => prev.filter((d) => d.id !== id))
        toast.success(`Doctor profile for ${targetName} removed from directory.`, { id: toastId })
        setDeleteModal({ isOpen: false, doctorId: null, doctorName: null, isDeleting: false })
        fetchDoctors()
      } else {
        const errorData = await res.json().catch(() => null)
        toast.error(errorData?.message || "Failed to delete doctor from database.", { id: toastId })
        setDeleteModal((prev) => ({ ...prev, isDeleting: false }))
      }
    } catch (err) {
      console.error("Failed to delete doctor:", err)
      toast.error("Network error: Failed to delete doctor.", { id: toastId })
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  // Excel Drop / Upload Handler
  const handleExcelDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: "binary" })
        const wsname = workbook.SheetNames[0]
        const ws = workbook.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json<any>(ws)

        const importedDocs = data.map((row) => ({
          doctorName: row["Doctor Name"] || row["Name"] || "Dr. Unknown",
          phone: row["Direct Phone"] || row["Phone"] || "+880 1700-000000",
          bmdcRegNumber:
            row["BMDC Reg #"] || row["BMDC Reg Number"] || "BMDC-A-00000",
          specialtyAndInstitute:
            row["Specialty & Institute"] ||
            row["Specialty"] ||
            "General Physician",
          chamber: row["Chamber Address"] || row["Chamber"] || "General Clinic",
          territoryAndMio:
            row["Territory / MIO Details"] || row["Territory"] || "Central Hub",
          email: row["Email"] || "doctor@akpharma.com",
          tier: (row["Prescriber Tier"] ||
            row["Tier"] ||
            "Tier 2 (Moderate)") as DoctorProfile["tier"],
        }))

        for (const doc of importedDocs) {
          await fetch(getEndpoint("/doctors"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(doc),
          })
        }

        showNotification(
          `Successfully bulk-imported and saved ${importedDocs.length} doctors to backend.`
        )
        fetchDoctors()
      } catch (err) {
        console.error(err)
        alert("Failed to parse or upload Excel file to backend.")
      }
    }
    reader.readAsBinaryString(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleExportTemplate = () => {
    const templateData = [
      {
        "Doctor Name": "Dr. Example Name",
        "Direct Phone": "+880 1700-000000",
        "BMDC Reg #": "BMDC-A-12345",
        "Specialty & Institute": "Cardiologist (NICVD)",
        "Chamber Address": "Diagnostic Center, Dhanmondi, Dhaka",
        "Territory / MIO Details": "Dhaka North / MIO: Rahim",
        Email: "doctor@example.com",
        "Prescriber Tier": "Tier 1 (High Prescriber)",
      },
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Doctor Import Template")
    XLSX.writeFile(wb, "AK_Pharma_Doctor_Import_Template.xlsx")
    showNotification("Downloaded Excel template successfully.")
  }

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-12">
      {successToast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Hidden file input for Excel drop */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleExcelDrop}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Physician Directory & Onboarding
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Register individual medical practitioners or bulk-upload prescribing
            networks via Excel sheets.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportTemplate}
          className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5 text-emerald-600" />
          Download Excel Template
        </Button>
      </div>

      {/* Main Grid Layout: Excel Drop Zone & Single Entry Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Card: Excel Bulk Drop Zone */}
        <Card className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                Bulk Excel Ingestion
              </h3>
            </div>
            <p className="mb-6 text-xs text-slate-400">
              Upload an Excel sheet containing Doctor Name, Direct Phone, BMDC
              Reg #, Specialty, Chamber, and Territory data.
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center space-y-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center transition-all hover:border-[#0090FF] hover:bg-blue-50/20"
          >
            <div className="rounded-full bg-blue-50 p-3 text-[#0090FF]">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800">
                Click to upload Excel file
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-400">
                Supports .xlsx, .xls, .csv formats
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] text-slate-400">
            <span>Template Columns:</span>
            <span className="font-mono text-slate-600">
              Name, Phone, BMDC, Specialty, Chamber
            </span>
          </div>
        </Card>

        {/* Right Card: Single Doctor Entry Form */}
        <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#0090FF]" />
            <div>
              <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                Single Physician Registration
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Fill out complete professional profile details to add a doctor
                to the active roster
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSingleSubmit}
            className="space-y-4 pt-2 text-xs"
          >
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Doctor Name *
                </Label>
                <Input
                  placeholder="e.g. Dr. Sabrina Rahman"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Direct Phone *
                </Label>
                <Input
                  placeholder="+880 1711..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  BMDC Reg # *
                </Label>
                <Input
                  placeholder="e.g. BMDC-A-99210"
                  value={bmdcRegNumber}
                  onChange={(e) => setBmdcRegNumber(e.target.value)}
                  required
                  className="h-8 font-mono text-xs"
                />
              </div>

              {/* Specialty with Autocomplete Dropdown + Writing support */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Specialty *
                </Label>
                <Input
                  list="bangladesh-specialties"
                  placeholder="e.g. Gynecologist"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                  className="h-8 bg-white text-xs"
                />
                <datalist id="bangladesh-specialties">
                  <option value="Gynecologist & Obstetrician" />
                  <option value="Cardiologist" />
                  <option value="Internal Medicine Specialist" />
                  <option value="Pediatrician" />
                  <option value="Orthopedic Surgeon" />
                  <option value="Dermatologist & Venereologist" />
                  <option value="Neurologist" />
                  <option value="Nephrologist" />
                  <option value="Endocrinologist & Diabetologist" />
                  <option value="Gastroenterologist" />
                  <option value="Psychiatrist" />
                  <option value="Ophthalmologist (Eye Specialist)" />
                  <option value="ENT Specialist & Head-Neck Surgeon" />
                  <option value="General Surgeon" />
                  <option value="Urologist" />
                  <option value="Oncologist (Cancer Specialist)" />
                  <option value="Pulmonologist (Chest Specialist)" />
                  <option value="Rheumatologist" />
                  <option value="Hematologist" />
                  <option value="Neurosurgeon" />
                  <option value="Plastic Surgeon" />
                  <option value="Physical Medicine & Rehabilitation Specialist" />
                  <option value="Radiologist & Imaging Specialist" />
                  <option value="Pathologist" />
                  <option value="Anesthesiologist" />
                  <option value="Dental Surgeon" />
                  <option value="General Physician" />
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Affiliated Hospital / Institute *
                </Label>
                <Input
                  placeholder="e.g. BSMMU"
                  value={institute}
                  onChange={(e) => setInstitute(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Chamber Address *
                </Label>
                <Input
                  placeholder="e.g. Square Hospital, Panthapath, Dhaka"
                  value={chamber}
                  onChange={(e) => setChamber(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Territory / MIO Details *
                </Label>
                <Input
                  placeholder="e.g. Dhaka North / MIO: Rafiqul"
                  value={territoryAndMio}
                  onChange={(e) => setTerritoryAndMio(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
                {formErrors.territoryAndMio && (
                  <p className="text-[11px] font-medium text-rose-500">{formErrors.territoryAndMio}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Email Address *
                </Label>
                <Input
                  type="email"
                  placeholder="e.g. doctor@akpharma.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
                {formErrors.email && (
                  <p className="text-[11px] font-medium text-rose-500">{formErrors.email}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Prescriber Tier *
                </Label>
                <Select
                  value={tier}
                  onValueChange={(v) => setTier(v as DoctorProfile["tier"])}
                >
                  <SelectTrigger className="h-8 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Tier 1 (High Prescriber)">
                      Tier 1 (High Prescriber)
                    </SelectItem>
                    <SelectItem value="Tier 2 (Moderate)">
                      Tier 2 (Moderate)
                    </SelectItem>
                    <SelectItem value="Tier 3 (Potential)">
                      Tier 3 (Potential)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.tier && (
                  <p className="text-[11px] font-medium text-rose-500">{formErrors.tier}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button
                type="submit"
                className="h-9 rounded-lg bg-[#0090FF] px-5 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
              >
                Register Doctor Profile
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Physician Roster Ledger */}
      <Card className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Registered Physician Directory
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Active medical professionals logged in the system database with
              full BMDC & territory details
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Total Doctors: {doctors.length}
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0 text-xs font-medium text-slate-600">
                Doctor & Direct Phone
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                BMDC Reg #
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Specialty & Institute
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Chamber Address
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Territory / MIO Details
              </TableHead>
              <TableHead className="text-xs font-medium text-slate-600">
                Prescriber Tier
              </TableHead>
              <TableHead className="pr-0 text-right text-xs font-medium text-slate-600">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-6 text-center text-xs text-slate-400"
                >
                  No doctors registered yet. Add one above or import via Excel.
                </TableCell>
              </TableRow>
            ) : (
              doctors.map((doc) => (
                <TableRow
                  key={doc.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50"
                >
                  <TableCell className="py-3.5 pl-0">
                    <div className="flex items-center gap-2.5">
                      <div className="shrink-0 rounded-lg bg-blue-50 p-2 text-[#0090FF]">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900">
                          {doc.doctorName}
                        </span>
                        <span className="mt-0.5 block flex items-center gap-1 font-mono text-[11px] text-slate-500">
                          <PhoneCall className="h-3 w-3 text-slate-400" />{" "}
                          {doc.phone}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5 font-mono text-xs font-bold text-blue-600">
                    {doc.bmdcRegNumber}
                  </TableCell>

                  <TableCell className="py-3.5 text-xs font-medium text-slate-700">
                    {doc.specialtyAndInstitute}
                  </TableCell>

                  <TableCell className="max-w-[200px] truncate py-3.5 text-xs text-slate-600">
                    {doc.chamber}
                  </TableCell>

                  <TableCell className="py-3.5 text-xs text-slate-600">
                    {doc.territoryAndMio}
                  </TableCell>

                  <TableCell className="py-3.5 text-xs">
                    <Badge
                      variant="outline"
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        doc.tier.includes("Tier 1")
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {doc.tier}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3.5 pr-0 text-right text-xs">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => promptDeleteDoctor(doc)}
                      className="h-7 w-7 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Global Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModal.isOpen}
        onOpenChange={(open) =>
          setDeleteModal((prev) => ({ ...prev, isOpen: open }))
        }
        onConfirm={handleConfirmDeleteDoctor}
        title="Delete Doctor Record"
        description="Are you sure you want to remove this doctor from the directory database? This action cannot be undone."
        itemName={deleteModal.doctorName || undefined}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  )
}
