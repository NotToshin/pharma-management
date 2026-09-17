"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
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
  FileSpreadsheet,
  Upload,
  Download,
  UserPlus,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

export default function NewDoctorPage() {
  const router = useRouter();

  // Manual Form States
  const [fullName, setFullName] = React.useState("");
  const [specialization, setSpecialization] = React.useState("Chief Medicine Specialist");
  const [chamberHospital, setChamberHospital] = React.useState("");
  const [territory, setTerritory] = React.useState("Dhaka North");
  const [assignedMio, setAssignedMio] = React.useState("Rafiqul Islam");
  const [monthlyPotential, setMonthlyPotential] = React.useState("");
  const [rankingTier, setRankingTier] = React.useState<"Tier A+ (High Rx)" | "Tier A (Primary)" | "Tier B (Moderate)" | "Tier C (Standard)">("Tier A+ (High Rx)");

  // Success Notification State
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Excel Import States
  const [importedFile, setImportedFile] = React.useState<File | null>(null);
  const [importStats, setImportStats] = React.useState<{ total: number; filename: string } | null>(null);
  const [, setIsImporting] = React.useState(false);

  // Handle Manual Form Submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !chamberHospital || !monthlyPotential) return;

    setSuccessMessage(`Successfully registered Dr. ${fullName} into the Master Doctor Database!`);
    
    // Reset form
    setFullName("");
    setChamberHospital("");
    setMonthlyPotential("");

    setTimeout(() => {
      router.push("/doctors/database");
    }, 1500);
  };

  // Download Excel Import Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Doctor Code": "AKP-DOC-901",
        "Full Name": "Dr. Example Physician",
        "Specialization": "Cardiology",
        "Chamber / Hospital": "Example Medical Center, Dhaka",
        "Territory": "Dhaka North",
        "Assigned MIO": "Rafiqul Islam",
        "Monthly Potential (Units)": 2500,
        "Ranking Tier": "Tier A+ (High Rx)",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Doctor Import Template");
    XLSX.writeFile(workbook, "AK_Pharma_Doctor_Import_Template.xlsx");
  };

  // Handle Excel File Upload & Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportedFile(file);
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        setImportStats({
          total: jsonData.length,
          filename: file.name,
        });
      } catch (err) {
        console.error("Error parsing excel:", err);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (!importStats) return;
    setSuccessMessage(`Successfully imported ${importStats.total} physician records from ${importStats.filename}!`);
    setTimeout(() => {
      router.push("/doctors/database");
    }, 1500);
  };

  return (
    <div className="space-y-6 w-full max-w-[1200px] mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0090FF] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              PHYSICIAN ONBOARDING & MASTER REGISTRY
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
            Add New Doctor / Bulk Excel Import
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register individual medical practitioners manually or upload bulk territorial database spreadsheets.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push("/doctors/database")}
          className="h-9 gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3.5 rounded-lg shadow-none"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Database
        </Button>
      </div>

      {/* Success Banner Alert */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-xs font-bold">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Left Card: Bulk Excel Import (1 Column on Desktop) */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6 space-y-4 lg:col-span-1">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                Bulk Excel Import
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Upload multiple physician entries simultaneously using a structured Excel spreadsheet.
            </p>
          </div>

          {/* Step 1: Download Template */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 block">1. Download Template</span>
            <p className="text-[11px] text-slate-500 leading-tight">
              Get the correct column headers format (Doctor Code, Name, Specialization, Territory, etc.).
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadTemplate}
              className="w-full h-8 text-xs font-semibold border-slate-300 bg-white text-slate-700 hover:bg-slate-100 gap-1.5 shadow-none"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              Download .XLSX Template
            </Button>
          </div>

          {/* Step 2: Upload File */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-800">2. Upload Filled Spreadsheet</Label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50/50 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
              <span className="text-xs font-semibold text-slate-700 block">
                Click to browse or drop file here
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Supports .XLSX, .XLS, .CSV</span>
            </div>
          </div>

          {/* Import Stats Preview */}
          {importStats && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="truncate max-w-[180px]">{importStats.filename}</span>
                <span className="text-[#0090FF]">{importStats.total} Records Found</span>
              </div>
              <Button
                size="sm"
                onClick={handleConfirmImport}
                className="w-full h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white font-semibold shadow-none"
              >
                Confirm & Import {importStats.total} Doctors
              </Button>
            </div>
          )}
        </Card>

        {/* 3. Right Card: Manual Individual Registration Form (2 Columns on Desktop) */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6 lg:col-span-2">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#0090FF]" />
              <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                Manual Physician Registration
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Enter individual doctor credentials, primary chamber, territory, and prescription potential targets.
            </p>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Physician Full Name *</Label>
                <Input
                  placeholder="e.g. Prof. Dr. ABM Abdullah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-8 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Specialization *</Label>
                <Select value={specialization} onValueChange={setSpecialization}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Chief Medicine Specialist">Chief Medicine Specialist</SelectItem>
                    <SelectItem value="Internal Medicine & Cardiology">Internal Medicine & Cardiology</SelectItem>
                    <SelectItem value="Pediatrics & Neonatology">Pediatrics & Neonatology</SelectItem>
                    <SelectItem value="Gastroenterology">Gastroenterology & Hepatology</SelectItem>
                    <SelectItem value="Psychiatry & Mental Health">Psychiatry & Mental Health</SelectItem>
                    <SelectItem value="Orthopedic Surgery">Orthopedic Surgery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">Primary Chamber / Hospital Suite *</Label>
              <Input
                placeholder="e.g. Popular Diagnostic & Consultation Centre, Dhanmondi"
                value={chamberHospital}
                onChange={(e) => setChamberHospital(e.target.value)}
                required
                className="h-8 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Assigned Territory Hub *</Label>
                <Select value={territory} onValueChange={setTerritory}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Dhaka North">Dhaka North Hub</SelectItem>
                    <SelectItem value="Dhaka South">Dhaka South Hub</SelectItem>
                    <SelectItem value="Chittagong Central">Chittagong Central Hub</SelectItem>
                    <SelectItem value="Sylhet Region">Sylhet Region</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Assigned Field MIO *</Label>
                <Select value={assignedMio} onValueChange={setAssignedMio}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Rafiqul Islam">Rafiqul Islam</SelectItem>
                    <SelectItem value="Tanvir Ahmed">Tanvir Ahmed</SelectItem>
                    <SelectItem value="Fardin Khan">Fardin Khan</SelectItem>
                    <SelectItem value="Sabi Rahman">Sabi Rahman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Monthly Prescription Potential (Units) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 3000"
                  value={monthlyPotential}
                  onChange={(e) => setMonthlyPotential(e.target.value)}
                  required
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">Initial Ranking Tier *</Label>
                <Select value={rankingTier} onValueChange={(val) => setRankingTier(val as any)}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Tier A+ (High Rx)">Tier A+ (High Rx Volume)</SelectItem>
                    <SelectItem value="Tier A (Primary)">Tier A (Primary Prescriber)</SelectItem>
                    <SelectItem value="Tier B (Moderate)">Tier B (Moderate Potential)</SelectItem>
                    <SelectItem value="Tier C (Standard)">Tier C (Standard)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/doctors/database")}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white font-semibold px-4 shadow-none"
              >
                Register & Save Doctor
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}