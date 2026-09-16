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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Stethoscope,
  Search,
  Filter,
  Plus,
  Download,
  MapPin,
  Building2,
  Sparkles,
  MoreHorizontal,
  Pencil,
  Trash2,
  Phone,
  Calendar,
  Users,
  Pill,
  Award,
  Clock,
  CheckCircle2,
  FileText,
  ExternalLink,
} from "lucide-react";

interface DoctorRecord {
  id: string;
  docCode: string;
  name: string;
  bmdcReg: string;
  specialty: string;
  designation: string;
  institute: string;
  chamberAddress: string;
  territory: string;
  contactNumber: string;
  potentialCategory: "A+" | "A" | "B" | "C";
  patientVolumeDaily: number;
  assignedMio: string;
  status: "Active" | "Inactive";
  // Portfolio enrichment fields
  email?: string;
  keyProducts?: string[];
  lastVisited?: string;
  monthlyRevenueEst?: string;
  visitFrequency?: string;
}

const initialDoctors: DoctorRecord[] = [
  {
    id: "1",
    docCode: "DOC-20401",
    name: "Dr. Anwarul Azim",
    bmdcReg: "A-45892",
    specialty: "Cardiology",
    designation: "Associate Professor",
    institute: "National Institute of Cardiovascular Diseases (NICVD)",
    chamberAddress: "Popular Diagnostic Center, Room 402, Dhanmondi",
    territory: "Dhaka North",
    contactNumber: "+880 1711-445566",
    email: "anwarul.azim@nicvd.gov.bd",
    potentialCategory: "A+",
    patientVolumeDaily: 45,
    assignedMio: "Rafiqul Islam",
    status: "Active",
    keyProducts: ["Rosuvastatin 10mg", "Cardiloc 5mg", "Clopidogrel 75mg"],
    lastVisited: "16 Sep 2026",
    monthlyRevenueEst: "৳2,40,000",
    visitFrequency: "Twice a Month (P1)",
  },
  {
    id: "2",
    docCode: "DOC-20402",
    name: "Dr. Farhana Yasmin",
    bmdcReg: "A-51203",
    specialty: "Gynecology & Obstetrics",
    designation: "Consultant",
    institute: "Dhaka Medical College Hospital",
    chamberAddress: "Labaid Specialized Hospital, Sector 4, Uttara",
    territory: "Dhaka North",
    contactNumber: "+880 1819-223344",
    email: "farhana.yasmin@labaid.com.bd",
    potentialCategory: "A+",
    patientVolumeDaily: 40,
    assignedMio: "Rafiqul Islam",
    status: "Active",
    keyProducts: ["Fefol-Z Capsules", "Calcium D3 Tablets", "Isoxsuprine"],
    lastVisited: "16 Sep 2026",
    monthlyRevenueEst: "৳1,95,000",
    visitFrequency: "Twice a Month (P1)",
  },
  {
    id: "3",
    docCode: "DOC-20403",
    name: "Dr. S. K. Roy",
    bmdcReg: "A-38914",
    specialty: "Internal Medicine",
    designation: "Professor & Head",
    institute: "Sir Salimullah Medical College",
    chamberAddress: "Medinova Medical Services, Mirpur 10",
    territory: "Dhaka South",
    contactNumber: "+880 1912-778899",
    email: "skroy.med@ssmc.edu.bd",
    potentialCategory: "A",
    patientVolumeDaily: 35,
    assignedMio: "Tanvir Ahmed",
    status: "Active",
    keyProducts: ["Azithromycin 500mg", "Omeprazole 20mg", "Paracetamol IV"],
    lastVisited: "15 Sep 2026",
    monthlyRevenueEst: "৳1,60,000",
    visitFrequency: "Monthly (P2)",
  },
  {
    id: "4",
    docCode: "DOC-20404",
    name: "Dr. Mehedi Hasan",
    bmdcReg: "A-62410",
    specialty: "Pediatrics",
    designation: "Assistant Professor",
    institute: "Chittagong Medical College",
    chamberAddress: "Chevron Clinical Lab, GEC Circle, Chittagong",
    territory: "Chittagong Central",
    contactNumber: "+880 1613-889900",
    email: "mehedi.ped@cmc.gov.bd",
    potentialCategory: "A",
    patientVolumeDaily: 30,
    assignedMio: "Kamrul Hasan",
    status: "Active",
    keyProducts: ["Cef-3 Pediatric Drops", "Montelukast 4mg", "Zinc Syrup"],
    lastVisited: "14 Sep 2026",
    monthlyRevenueEst: "৳1,25,000",
    visitFrequency: "Monthly (P2)",
  },
  {
    id: "5",
    docCode: "DOC-20405",
    name: "Dr. Mustafizur Rahman",
    bmdcReg: "A-33109",
    specialty: "Orthopedic Surgery",
    designation: "Senior Consultant",
    institute: "Sylhet MAG Osmani Medical College",
    chamberAddress: "Ibn Sina Hospital, Subidbazar, Sylhet",
    territory: "Sylhet Sadar",
    contactNumber: "+880 1715-112233",
    email: "m.rahman@ibnsina.com.bd",
    potentialCategory: "B",
    patientVolumeDaily: 25,
    assignedMio: "Enamul Haque",
    status: "Active",
    keyProducts: ["Aceclofenac 100mg", "Diacerein 50mg", "Calcium Orotate"],
    lastVisited: "12 Sep 2026",
    monthlyRevenueEst: "৳90,000",
    visitFrequency: "Monthly (P2)",
  },
  {
    id: "6",
    docCode: "DOC-20406",
    name: "Dr. Nadia Islam",
    bmdcReg: "A-58904",
    specialty: "General Physician",
    designation: "Medical Officer",
    institute: "Rajshahi Medical College Hospital",
    chamberAddress: "Apollo Clinic, Shaheb Bazar, Rajshahi",
    territory: "Rajshahi Metro",
    contactNumber: "+880 1518-667788",
    email: "nadia.islam@rmch.gov.bd",
    potentialCategory: "B",
    patientVolumeDaily: 20,
    assignedMio: "Sabbir Hossain",
    status: "Active",
    keyProducts: ["Pantoprazole 20mg", "Antacid Suspension", "Multivitamins"],
    lastVisited: "10 Sep 2026",
    monthlyRevenueEst: "৳75,000",
    visitFrequency: "Bi-monthly (P3)",
  },
  {
    id: "7",
    docCode: "DOC-20407",
    name: "Dr. Tareq Mahmud",
    bmdcReg: "A-49811",
    specialty: "Dermatology",
    designation: "Consultant",
    institute: "Khulna Medical College",
    chamberAddress: "Care Point Consultation, Shibbari, Khulna",
    territory: "Khulna Zone",
    contactNumber: "+880 1720-334455",
    email: "tareq.skin@kmc.edu.bd",
    potentialCategory: "C",
    patientVolumeDaily: 18,
    assignedMio: "Mahmudul Hasan",
    status: "Active",
    keyProducts: ["Ketoconazole Cream", "Mupirocin Ointment", "Fexofenadine 120mg"],
    lastVisited: "08 Sep 2026",
    monthlyRevenueEst: "৳50,000",
    visitFrequency: "Quarterly (P4)",
  },
];

export default function DoctorMasterDatabasePage() {
  const [doctors, setDoctors] = React.useState<DoctorRecord[]>(initialDoctors);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [specialtyFilter, setSpecialtyFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");

  // Portfolio Sheet State
  const [selectedDoctor, setSelectedDoctor] = React.useState<DoctorRecord | null>(null);
  const [isPortfolioOpen, setIsPortfolioOpen] = React.useState(false);

  // Add Dialog State
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [bmdcReg, setBmdcReg] = React.useState("");
  const [specialty, setSpecialty] = React.useState("Cardiology");
  const [designation, setDesignation] = React.useState("");
  const [institute, setInstitute] = React.useState("");
  const [chamberAddress, setChamberAddress] = React.useState("");
  const [territory, setTerritory] = React.useState("Dhaka North");
  const [contactNumber, setContactNumber] = React.useState("");
  const [potentialCategory, setPotentialCategory] = React.useState<DoctorRecord["potentialCategory"]>("A");
  const [patientVolumeDaily, setPatientVolumeDaily] = React.useState("");
  const [assignedMio, setAssignedMio] = React.useState("");

  // Edit Dialog State
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingDoctor, setEditingDoctor] = React.useState<DoctorRecord | null>(null);

  const handleOpenPortfolio = (doc: DoctorRecord) => {
    setSelectedDoctor(doc);
    setIsPortfolioOpen(true);
  };

  const handleExportExcel = () => {
    const excelData = doctors.map((doc) => ({
      "Doctor ID": doc.docCode,
      "Doctor Name": doc.name,
      "BMDC Reg #": doc.bmdcReg,
      Specialty: doc.specialty,
      Designation: doc.designation,
      Institute: doc.institute,
      "Chamber Address": doc.chamberAddress,
      Territory: doc.territory,
      Contact: doc.contactNumber,
      "Rx Potential": doc.potentialCategory,
      "Daily Patients": doc.patientVolumeDaily,
      "Assigned MIO": doc.assignedMio,
      Status: doc.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Doctor Master Database");
    XLSX.writeFile(workbook, `AK_Pharma_Doctor_Database_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc: DoctorRecord = {
      id: Date.now().toString(),
      docCode: `DOC-2040${doctors.length + 8}`,
      name,
      bmdcReg: bmdcReg || "A-XXXXX",
      specialty,
      designation: designation || "Consultant",
      institute,
      chamberAddress,
      territory,
      contactNumber,
      potentialCategory,
      patientVolumeDaily: Number(patientVolumeDaily) || 20,
      assignedMio,
      status: "Active",
      keyProducts: ["Standard Line Products"],
      lastVisited: "Not visited yet",
      monthlyRevenueEst: "৳75,000",
      visitFrequency: "Monthly (P2)",
    };

    setDoctors((prev) => [newDoc, ...prev]);
    setName("");
    setBmdcReg("");
    setDesignation("");
    setInstitute("");
    setChamberAddress("");
    setContactNumber("");
    setPatientVolumeDaily("");
    setAssignedMio("");
    setIsAddOpen(false);
  };

  const handleOpenEdit = (doc: DoctorRecord) => {
    setEditingDoctor({ ...doc });
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    setDoctors((prev) =>
      prev.map((doc) => (doc.id === editingDoctor.id ? editingDoctor : doc))
    );
    if (selectedDoctor && selectedDoctor.id === editingDoctor.id) {
      setSelectedDoctor(editingDoctor);
    }
    setIsEditOpen(false);
    setEditingDoctor(null);
  };

  const handleDeleteDoctor = (id: string) => {
    setDoctors((prev) => prev.filter((doc) => doc.id !== id));
    if (selectedDoctor && selectedDoctor.id === id) {
      setIsPortfolioOpen(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.bmdcReg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.contactNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.territory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.assignedMio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.chamberAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialty =
      specialtyFilter === "all" || doc.specialty.toLowerCase().includes(specialtyFilter.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || doc.potentialCategory === categoryFilter;

    return matchesSearch && matchesSpecialty && matchesCategory;
  });

  const categoryACount = doctors.filter((d) => d.potentialCategory === "A+" || d.potentialCategory === "A").length;
  const totalPatientReach = doctors.reduce((acc, curr) => acc + curr.patientVolumeDaily, 0);

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Doctor Registry — Master Database
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of licensed practitioners, BMDC numbers, direct contacts, and clinical portfolios.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-9 gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3.5 rounded-lg shadow-none"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export to Excel
          </Button>

          {/* Add Doctor Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none">
                <Plus className="h-4 w-4" />
                Add New Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px] bg-white rounded-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">Register Medical Practitioner</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Enter physician credentials, BMDC number, contact phone, and chamber details.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddDoctor} className="space-y-3.5 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-name" className="text-xs font-medium text-slate-700">Doctor Full Name</Label>
                    <Input
                      id="doc-name"
                      placeholder="e.g. Dr. K. M. Saifullah"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bmdc" className="text-xs font-medium text-slate-700">BMDC Reg. Number</Label>
                    <Input
                      id="bmdc"
                      placeholder="e.g. A-49821"
                      value={bmdcReg}
                      onChange={(e) => setBmdcReg(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="specialty" className="text-xs font-medium text-slate-700">Specialty</Label>
                    <Input
                      id="specialty"
                      placeholder="e.g. Cardiology"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="designation" className="text-xs font-medium text-slate-700">Designation</Label>
                    <Input
                      id="designation"
                      placeholder="e.g. Associate Professor"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="institute" className="text-xs font-medium text-slate-700">Affiliated Hospital / Medical College</Label>
                  <Input
                    id="institute"
                    placeholder="e.g. Dhaka Medical College Hospital"
                    value={institute}
                    onChange={(e) => setInstitute(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="chamber" className="text-xs font-medium text-slate-700">Primary Chamber Address</Label>
                  <Input
                    id="chamber"
                    placeholder="e.g. Room 302, Popular Diagnostic Center, Mirpur"
                    value={chamberAddress}
                    onChange={(e) => setChamberAddress(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact" className="text-xs font-medium text-slate-700">Phone Number</Label>
                    <Input
                      id="contact"
                      placeholder="+880 1700-000000"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="territory" className="text-xs font-medium text-slate-700">Territory Hub</Label>
                    <Input
                      id="territory"
                      placeholder="e.g. Dhaka North"
                      value={territory}
                      onChange={(e) => setTerritory(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="cat" className="text-xs font-medium text-slate-700">Rx Tier</Label>
                    <Select
                      value={potentialCategory}
                      onValueChange={(val) => setPotentialCategory(val as DoctorRecord["potentialCategory"])}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="A+">Category A+</SelectItem>
                        <SelectItem value="A">Category A</SelectItem>
                        <SelectItem value="B">Category B</SelectItem>
                        <SelectItem value="C">Category C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="patients" className="text-xs font-medium text-slate-700">Daily Patients</Label>
                    <Input
                      id="patients"
                      type="number"
                      placeholder="35"
                      value={patientVolumeDaily}
                      onChange={(e) => setPatientVolumeDaily(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mio" className="text-xs font-medium text-slate-700">Assigned MIO</Label>
                    <Input
                      id="mio"
                      placeholder="MIO Officer"
                      value={assignedMio}
                      onChange={(e) => setAssignedMio(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddOpen(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                    Save to Directory
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Registered Doctors</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Stethoscope className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {doctors.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Click any doctor row to view full portfolio
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tier A & A+ High Yield</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            {categoryACount} Specialists
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Priority call targets for field force
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Daily Patient Footfall</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            ~{totalPatientReach} / day
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Cumulative consultation reach
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Export & Backup</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-md">
              Synchronized
            </Badge>
          </div>
          <div className="mt-3 text-[28px] font-bold tracking-tight text-slate-900 leading-none">
            Excel / XLSX
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Direct table export ready
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search doctor, phone, BMDC, or chamber..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="All Specialties" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Specialties</SelectItem>
              <SelectItem value="cardiology">Cardiology</SelectItem>
              <SelectItem value="gynecology">Gynecology</SelectItem>
              <SelectItem value="medicine">Medicine</SelectItem>
              <SelectItem value="pediatrics">Pediatrics</SelectItem>
              <SelectItem value="orthopedic">Orthopedics</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs bg-white border-slate-200">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="A+">Category A+</SelectItem>
              <SelectItem value="A">Category A</SelectItem>
              <SelectItem value="B">Category B</SelectItem>
              <SelectItem value="C">Category C</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Table with Clickable Doctor Name & Visible Phone */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              DOCTOR MASTER DIRECTORY
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click a physician's name to inspect their full institutional portfolio and prescription metrics
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredDoctors.length} Registered Practitioners
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Doctor & Direct Phone</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">BMDC Reg #</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Specialty & Institute</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Chamber Address</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Territory / MIO</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-center">Patients/day</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Potential Tier</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDoctors.map((doc) => (
              <TableRow key={doc.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                {/* Doctor Name, Designation & Phone Number */}
                <TableCell className="py-3 pl-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      onClick={() => handleOpenPortfolio(doc)}
                      className="h-8 w-8 rounded-full border border-slate-200 cursor-pointer hover:border-[#0090FF] transition-colors"
                    >
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">
                        {doc.name.replace("Dr. ", "").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                      <button
                        onClick={() => handleOpenPortfolio(doc)}
                        className="text-xs font-bold text-slate-900 block hover:text-[#0090FF] hover:underline text-left"
                      >
                        {doc.name}
                      </button>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        <Phone className="h-2.5 w-2.5 text-slate-400" />
                        <span className="font-mono text-slate-600 font-medium">{doc.contactNumber}</span>
                        <span>•</span>
                        <span className="text-slate-400">{doc.designation}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* BMDC */}
                <TableCell className="py-3 text-xs font-mono font-medium text-slate-600">
                  {doc.bmdcReg}
                </TableCell>

                {/* Specialty & Hospital */}
                <TableCell className="py-3 text-xs text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-900 block">{doc.specialty}</span>
                    <span className="text-[10px] text-slate-400 max-w-[190px] truncate block">
                      {doc.institute}
                    </span>
                  </div>
                </TableCell>

                {/* Chamber Address */}
                <TableCell className="py-3 text-xs text-slate-600 max-w-[210px] truncate">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.chamberAddress}</span>
                  </div>
                </TableCell>

                {/* Territory / MIO */}
                <TableCell className="py-3 text-xs text-slate-700">
                  <div>
                    <span className="font-medium text-slate-900 block">{doc.territory}</span>
                    <span className="text-[10px] text-slate-400">MIO: {doc.assignedMio}</span>
                  </div>
                </TableCell>

                {/* Patient Volume */}
                <TableCell className="py-3 text-xs text-center font-bold text-slate-900 font-mono">
                  {doc.patientVolumeDaily}
                </TableCell>

                {/* Potential Tier */}
                <TableCell className="py-3 text-xs">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                      doc.potentialCategory === "A+"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : doc.potentialCategory === "A"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : doc.potentialCategory === "B"
                        ? "text-slate-700 bg-slate-50 border-slate-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                    }`}
                  >
                    Category {doc.potentialCategory}
                  </Badge>
                </TableCell>

                {/* Actions Dropdown */}
                <TableCell className="py-3 text-xs text-right pr-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-white">
                      <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Physician Options
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleOpenPortfolio(doc)}
                        className="text-xs cursor-pointer text-slate-700"
                      >
                        <FileText className="h-3.5 w-3.5 mr-2 text-blue-600" />
                        View Full Portfolio
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenEdit(doc)}
                        className="text-xs cursor-pointer text-slate-700"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-2 text-slate-500" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteDoctor(doc.id)}
                        className="text-xs cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete Doctor
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Doctor Portfolio Slide-Over (Sheet) */}
      <Sheet open={isPortfolioOpen} onOpenChange={setIsPortfolioOpen}>
        <SheetContent className="w-full sm:max-w-md bg-white p-0 overflow-y-auto border-l border-slate-200">
          {selectedDoctor && (
            <div className="flex flex-col h-full">
              {/* Profile Header Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between">
                  <Avatar className="h-14 w-14 rounded-xl border-2 border-white shadow-xs">
                    <AvatarFallback className="bg-blue-600 text-white font-bold text-base">
                      {selectedDoctor.name.replace("Dr. ", "").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold px-3 py-1 rounded-lg ${
                      selectedDoctor.potentialCategory === "A+"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    Category {selectedDoctor.potentialCategory} Tier
                  </Badge>
                </div>

                <div className="mt-4">
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    {selectedDoctor.name}
                  </h2>
                  <p className="text-xs font-semibold text-[#0090FF] mt-0.5">
                    {selectedDoctor.specialty}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedDoctor.designation} • {selectedDoctor.institute}
                  </p>
                </div>

                {/* Direct Action Contacts */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200/60">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs font-medium bg-[#0090FF] hover:bg-[#0080e5] text-white gap-1.5 shadow-none"
                    onClick={() => window.open(`tel:${selectedDoctor.contactNumber}`)}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call {selectedDoctor.contactNumber}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium border-slate-200 hover:bg-slate-100 text-slate-700"
                    onClick={() => handleOpenEdit(selectedDoctor)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Portfolio Body Details */}
              <div className="p-6 space-y-6 flex-1 text-xs">
                {/* 1. Official Credentials */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Registration & Affiliation
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                      <span className="text-[10px] text-slate-400 block font-medium">BMDC Reg #</span>
                      <span className="font-mono font-bold text-slate-800">{selectedDoctor.bmdcReg}</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                      <span className="text-[10px] text-slate-400 block font-medium">Doctor Internal ID</span>
                      <span className="font-mono font-bold text-slate-800">{selectedDoctor.docCode}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Prescription & Volume Metrics */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Prescription Capacity
                  </h4>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-center">
                      <span className="text-[10px] text-slate-400 block">Daily Footfall</span>
                      <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
                        {selectedDoctor.patientVolumeDaily}
                      </span>
                      <span className="text-[9px] text-slate-400">Patients/day</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-center">
                      <span className="text-[10px] text-slate-400 block">Est. Monthly Rx</span>
                      <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
                        {selectedDoctor.monthlyRevenueEst || "৳1,50,000"}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-semibold">+8% yield</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-center">
                      <span className="text-[10px] text-slate-400 block">Roster Priority</span>
                      <span className="text-base font-bold text-slate-900 mt-0.5 block">
                        {selectedDoctor.potentialCategory}
                      </span>
                      <span className="text-[9px] text-slate-400">High Yield</span>
                    </div>
                  </div>
                </div>

                {/* 3. Chamber & Field Logistics */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Chamber & Territory Assignment
                  </h4>
                  <div className="space-y-2 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800 block">Primary Chamber</span>
                        <span className="text-slate-500 text-[11px]">{selectedDoctor.chamberAddress}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Territory: <strong className="text-slate-800">{selectedDoctor.territory}</strong></span>
                      <span className="text-slate-500">Assigned MIO: <strong className="text-slate-800">{selectedDoctor.assignedMio}</strong></span>
                    </div>
                  </div>
                </div>

                {/* 4. Target Drug Formulations */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Key Promoted Formulations
                  </h4>
                  <div className="space-y-1.5">
                    {(selectedDoctor.keyProducts || ["Rosuvastatin 10mg", "Ciprocin 500mg"]).map((drug, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-white"
                      >
                        <div className="flex items-center gap-2">
                          <Pill className="h-3.5 w-3.5 text-[#0090FF]" />
                          <span className="font-medium text-slate-800">{drug}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] text-slate-500 bg-slate-50 border-slate-200">
                          Active Detailing
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Field Visit Audit Log */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Field Touchpoint History
                  </h4>
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Last Detailed Call:</span>
                      <span className="font-semibold text-slate-800">{selectedDoctor.lastVisited || "16 Sep 2026"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Planned Frequency:</span>
                      <span className="font-semibold text-slate-800">{selectedDoctor.visitFrequency || "Twice a Month (P1)"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sheet Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsPortfolioOpen(false)}
                  className="h-8 text-xs text-slate-600"
                >
                  Close Drawer
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleOpenEdit(selectedDoctor)}
                  className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white"
                >
                  Modify Portfolio
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 6. Edit Doctor Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[540px] bg-white rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Edit Doctor Profile</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update physician credentials, contact phone, and assigned territory.
            </DialogDescription>
          </DialogHeader>

          {editingDoctor && (
            <form onSubmit={handleSaveEdit} className="space-y-3.5 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="text-xs font-medium text-slate-700">Doctor Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editingDoctor.name}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-bmdc" className="text-xs font-medium text-slate-700">BMDC Reg. Number</Label>
                  <Input
                    id="edit-bmdc"
                    value={editingDoctor.bmdcReg}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, bmdcReg: e.target.value })}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-specialty" className="text-xs font-medium text-slate-700">Specialty</Label>
                  <Input
                    id="edit-specialty"
                    value={editingDoctor.specialty}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, specialty: e.target.value })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-designation" className="text-xs font-medium text-slate-700">Designation</Label>
                  <Input
                    id="edit-designation"
                    value={editingDoctor.designation}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, designation: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-institute" className="text-xs font-medium text-slate-700">Affiliated Hospital</Label>
                <Input
                  id="edit-institute"
                  value={editingDoctor.institute}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, institute: e.target.value })}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-chamber" className="text-xs font-medium text-slate-700">Chamber Address</Label>
                <Input
                  id="edit-chamber"
                  value={editingDoctor.chamberAddress}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, chamberAddress: e.target.value })}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-contact" className="text-xs font-medium text-slate-700">Contact Number</Label>
                  <Input
                    id="edit-contact"
                    value={editingDoctor.contactNumber}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, contactNumber: e.target.value })}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-territory" className="text-xs font-medium text-slate-700">Territory Hub</Label>
                  <Input
                    id="edit-territory"
                    value={editingDoctor.territory}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, territory: e.target.value })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-cat" className="text-xs font-medium text-slate-700">Rx Tier</Label>
                  <Select
                    value={editingDoctor.potentialCategory}
                    onValueChange={(val) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        potentialCategory: val as DoctorRecord["potentialCategory"],
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="A+">Category A+</SelectItem>
                      <SelectItem value="A">Category A</SelectItem>
                      <SelectItem value="B">Category B</SelectItem>
                      <SelectItem value="C">Category C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-patients" className="text-xs font-medium text-slate-700">Daily Patients</Label>
                  <Input
                    id="edit-patients"
                    type="number"
                    value={editingDoctor.patientVolumeDaily}
                    onChange={(e) =>
                      setEditingDoctor({
                        ...editingDoctor,
                        patientVolumeDaily: Number(e.target.value),
                      })
                    }
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-mio" className="text-xs font-medium text-slate-700">Assigned MIO</Label>
                  <Input
                    id="edit-mio"
                    value={editingDoctor.assignedMio}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, assignedMio: e.target.value })}
                    required
                    className="h-8 text-xs"
                  />
                </div>
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
                <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white">
                  Update Record
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}