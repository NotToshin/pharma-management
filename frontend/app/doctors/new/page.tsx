"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";

export interface DoctorProfile {
  id: string;
  doctorName: string;
  phone: string;
  bmdcRegNumber: string;
  specialtyAndInstitute: string;
  chamber: string;
  territoryAndMio: string;
  email: string;
  tier: "Tier 1 (High Prescriber)" | "Tier 2 (Moderate)" | "Tier 3 (Potential)";
}

export default function AddDoctorDirectoryPage() {
  const [doctors, setDoctors] = React.useState<DoctorProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [successToast, setSuccessToast] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Single Doctor Form State
  const [doctorName, setDoctorName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [bmdcRegNumber, setBmdcRegNumber] = React.useState("");
  const [specialty, setSpecialty] = React.useState("");
  const [institute, setInstitute] = React.useState("");
  const [chamber, setChamber] = React.useState("");
  const [territoryAndMio, setTerritoryAndMio] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [tier, setTier] = React.useState<DoctorProfile["tier"]>("Tier 1 (High Prescriber)");

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Fetch live doctors from backend database
  const fetchDoctors = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/doctors");
      const result = await res.json();
      const rawData = Array.isArray(result) ? result : result.data || [];

      const formatted: DoctorProfile[] = rawData.map((doc: any, index: number) => ({
        id: doc.id || String(index),
        doctorName: doc.doctorName || doc.name,
        phone: doc.phone || "+880 1700-000000",
        bmdcRegNumber: doc.bmdcRegNumber || "BMDC-A-00000",
        specialtyAndInstitute: doc.specialtyAndInstitute || "General Physician",
        chamber: doc.chamber || "General Clinic",
        territoryAndMio: doc.territoryAndMio || "Central Hub",
        email: doc.email || "doctor@akpharma.com",
        tier: doc.tier || "Tier 2 (Moderate)",
      }));

      setDoctors(formatted);
    } catch (err) {
      console.error("Failed to fetch doctors from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSpecialty = specialty.split("(")[0].trim();
    const cleanInstitute = institute.split("(")[0].trim();

    const newDoc = {
      doctorName,
      phone: phone || "+880 1700-000000",
      bmdcRegNumber: bmdcRegNumber || "BMDC-A-00000",
      specialtyAndInstitute: `${cleanSpecialty} (${cleanInstitute})`,
      chamber,
      territoryAndMio: territoryAndMio || "Central Hub / Unassigned",
      email: email || "doctor@akpharma.com",
      tier,
    };

    try {
      const res = await fetch("http://localhost:5000/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDoc),
      });

      if (res.ok) {
        setDoctorName("");
        setPhone("");
        setBmdcRegNumber("");
        setSpecialty("");
        setInstitute("");
        setChamber("");
        setTerritoryAndMio("");
        setEmail("");
        showNotification(`Successfully registered ${newDoc.doctorName} into the database.`);
        fetchDoctors(); // Refresh table list dynamically
      } else {
        alert("Server responded with an error.");
      }
    } catch (err) {
      console.error("Error communicating with backend:", err);
      alert("Failed to connect to backend server. Make sure it's running on port 5000.");
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/doctors/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDoctors((prev) => prev.filter((d) => d.id !== id));
        showNotification("Doctor profile removed from directory.");
      }
    } catch (err) {
      console.error("Failed to delete doctor:", err);
      alert("Failed to delete doctor from database.");
    }
  };

  // Excel Drop / Upload Handler
  const handleExcelDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        const importedDocs = data.map((row) => ({
          doctorName: row["Doctor Name"] || row["Name"] || "Dr. Unknown",
          phone: row["Direct Phone"] || row["Phone"] || "+880 1700-000000",
          bmdcRegNumber: row["BMDC Reg #"] || row["BMDC Reg Number"] || "BMDC-A-00000",
          specialtyAndInstitute: row["Specialty & Institute"] || row["Specialty"] || "General Physician",
          chamber: row["Chamber Address"] || row["Chamber"] || "General Clinic",
          territoryAndMio: row["Territory / MIO Details"] || row["Territory"] || "Central Hub",
          email: row["Email"] || "doctor@akpharma.com",
          tier: (row["Prescriber Tier"] || row["Tier"] || "Tier 2 (Moderate)") as DoctorProfile["tier"],
        }));

        for (const doc of importedDocs) {
          await fetch("http://localhost:5000/api/doctors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(doc),
          });
        }

        showNotification(`Successfully bulk-imported and saved ${importedDocs.length} doctors to backend.`);
        fetchDoctors();
      } catch (err) {
        console.error(err);
        alert("Failed to parse or upload Excel file to backend.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExportTemplate = () => {
    const templateData = [
      {
        "Doctor Name": "Dr. Example Name",
        "Direct Phone": "+880 1700-000000",
        "BMDC Reg #": "BMDC-A-12345",
        "Specialty & Institute": "Cardiologist (NICVD)",
        "Chamber Address": "Diagnostic Center, Dhanmondi, Dhaka",
        "Territory / MIO Details": "Dhaka North / MIO: Rahim",
        "Email": "doctor@example.com",
        "Prescriber Tier": "Tier 1 (High Prescriber)",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doctor Import Template");
    XLSX.writeFile(wb, "AK_Pharma_Doctor_Import_Template.xlsx");
    showNotification("Downloaded Excel template successfully.");
  };

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-12">
      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Physician Directory & Onboarding
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register individual medical practitioners or bulk-upload prescribing networks via Excel sheets.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportTemplate}
          className="h-9 gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3.5 rounded-lg shadow-none"
        >
          <Download className="h-3.5 w-3.5 text-emerald-600" />
          Download Excel Template
        </Button>
      </div>

      {/* Main Grid Layout: Excel Drop Zone & Single Entry Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Excel Bulk Drop Zone */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                Bulk Excel Ingestion
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Upload an Excel sheet containing Doctor Name, Direct Phone, BMDC Reg #, Specialty, Chamber, and Territory data.
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-[#0090FF] bg-slate-50/50 hover:bg-blue-50/20 transition-all rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center space-y-3"
          >
            <div className="p-3 rounded-full bg-blue-50 text-[#0090FF]">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Click to upload Excel file</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Supports .xlsx, .xls, .csv formats</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Template Columns:</span>
            <span className="font-mono text-slate-600">Name, Phone, BMDC, Specialty, Chamber</span>
          </div>
        </Card>

        {/* Right Card: Single Doctor Entry Form */}
        <Card className="lg:col-span-2 rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-4 w-4 text-[#0090FF]" />
            <div>
              <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                Single Physician Registration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Fill out complete professional profile details to add a doctor to the active roster
              </p>
            </div>
          </div>

          <form onSubmit={handleSingleSubmit} className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Doctor Name *</Label>
                <Input
                  placeholder="e.g. Dr. Sabrina Rahman"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Direct Phone *</Label>
                <Input
                  placeholder="+880 1711..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">BMDC Reg # *</Label>
                <Input
                  placeholder="e.g. BMDC-A-99210"
                  value={bmdcRegNumber}
                  onChange={(e) => setBmdcRegNumber(e.target.value)}
                  required
                  className="h-8 text-xs font-mono"
                />
              </div>
              
              {/* Specialty with Autocomplete Dropdown + Writing support */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Specialty *</Label>
                <Input
                  list="bangladesh-specialties"
                  placeholder="e.g. Gynecologist"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                  className="h-8 text-xs bg-white"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Affiliated Hospital / Institute *</Label>
                <Input
                  placeholder="e.g. BSMMU"
                  value={institute}
                  onChange={(e) => setInstitute(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Chamber Address *</Label>
                <Input
                  placeholder="e.g. Square Hospital, Panthapath, Dhaka"
                  value={chamber}
                  onChange={(e) => setChamber(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Territory / MIO Details *</Label>
                <Input
                  placeholder="e.g. Dhaka North / MIO: Rafiqul"
                  value={territoryAndMio}
                  onChange={(e) => setTerritoryAndMio(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Prescriber Tier</Label>
                <Select value={tier} onValueChange={(v) => setTier(v as DoctorProfile["tier"])}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Tier 1 (High Prescriber)">Tier 1 (High Prescriber)</SelectItem>
                    <SelectItem value="Tier 2 (Moderate)">Tier 2 (Moderate)</SelectItem>
                    <SelectItem value="Tier 3 (Potential)">Tier 3 (Potential)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <Button type="submit" className="h-9 px-5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold rounded-lg shadow-none">
                Register Doctor Profile
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Physician Roster Ledger */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              Registered Physician Directory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active medical professionals logged in the system database with full BMDC & territory details
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total Doctors: {doctors.length}
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Doctor & Direct Phone</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">BMDC Reg #</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Specialty & Institute</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Chamber Address</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Territory / MIO Details</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Prescriber Tier</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-xs text-slate-400">
                  No doctors registered yet. Add one above or import via Excel.
                </TableCell>
              </TableRow>
            ) : (
              doctors.map((doc) => (
                <TableRow key={doc.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <TableCell className="py-3.5 pl-0">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-50 text-[#0090FF] shrink-0">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{doc.doctorName}</span>
                        <span className="text-[11px] font-mono text-slate-500 block flex items-center gap-1 mt-0.5">
                          <PhoneCall className="h-3 w-3 text-slate-400" /> {doc.phone}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3.5 text-xs font-mono font-bold text-blue-600">
                    {doc.bmdcRegNumber}
                  </TableCell>

                  <TableCell className="py-3.5 text-xs text-slate-700 font-medium">
                    {doc.specialtyAndInstitute}
                  </TableCell>

                  <TableCell className="py-3.5 text-xs text-slate-600 max-w-[200px] truncate">
                    {doc.chamber}
                  </TableCell>

                  <TableCell className="py-3.5 text-xs text-slate-600">
                    {doc.territoryAndMio}
                  </TableCell>

                  <TableCell className="py-3.5 text-xs">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        doc.tier.includes("Tier 1")
                          ? "text-blue-700 bg-blue-50 border-blue-200"
                          : "text-slate-700 bg-slate-50 border-slate-200"
                      }`}
                    >
                      {doc.tier}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3.5 text-xs text-right pr-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteDoctor(doc.id)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
    </div>
  );
}