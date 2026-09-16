"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Stethoscope,
  Building2,
  MapPin,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Phone,
  Mail,
  UserCheck,
  Save,
} from "lucide-react";

export default function AddNewDoctorPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState({
    name: "",
    bmdcReg: "",
    specialty: "Cardiology",
    designation: "",
    institute: "",
    phone: "",
    email: "",
    chamberAddress: "",
    territory: "Dhaka North",
    zone: "",
    patientVolumeDaily: "30",
    potentialCategory: "A",
    assignedMio: "Rafiqul Islam",
    primaryProducts: "",
    visitingDays: "Sat, Mon, Wed (5:00 PM - 9:00 PM)",
    consentForSamples: true,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API registration call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/doctors/database");
      }, 1200);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-[1080px] mx-auto pb-14">
      {/* 1. Header with Breadcrumb Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/doctors/database"
              className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Doctor Registry
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-800">New Onboarding</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Register Medical Practitioner
          </h1>
          <p className="text-xs text-slate-500">
            Enroll a licensed physician into AK Pharma's CRM and allocate territory visitation rights.
          </p>
        </div>

        {isSuccess && (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-1 px-3">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Practitioner successfully added! Redirecting...
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Professional & Legal Accreditation */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Professional Credentials & BMDC</h2>
              <p className="text-[11px] text-slate-400">Statutory verification details registered with the Medical Council</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="doc-name" className="text-xs font-medium text-slate-700">
                Doctor Full Name (with Title) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="doc-name"
                placeholder="e.g. Prof. Dr. K. M. Saifullah"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bmdc-reg" className="text-xs font-medium text-slate-700">
                BMDC Registration No. <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="bmdc-reg"
                placeholder="e.g. A-49821"
                value={formData.bmdcReg}
                onChange={(e) => handleChange("bmdcReg", e.target.value)}
                required
                className="h-8 text-xs font-mono font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specialty" className="text-xs font-medium text-slate-700">
                Medical Specialty <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={formData.specialty}
                onValueChange={(val) => handleChange("specialty", val)}
              >
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="Cardiology">Cardiology</SelectItem>
                  <SelectItem value="Internal Medicine">Internal Medicine</SelectItem>
                  <SelectItem value="Gynecology & Obstetrics">Gynecology & Obstetrics</SelectItem>
                  <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                  <SelectItem value="Orthopedic Surgery">Orthopedic Surgery</SelectItem>
                  <SelectItem value="Dermatology">Dermatology</SelectItem>
                  <SelectItem value="Neurology">Neurology</SelectItem>
                  <SelectItem value="General Physician">General Physician</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="designation" className="text-xs font-medium text-slate-700">Academic / Clinical Designation</Label>
              <Input
                id="designation"
                placeholder="e.g. Associate Professor & Consultant"
                value={formData.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="institute" className="text-xs font-medium text-slate-700">
                Affiliated Hospital / Medical College <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="institute"
                placeholder="e.g. Dhaka Medical College Hospital"
                value={formData.institute}
                onChange={(e) => handleChange("institute", e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Contact, Chamber & Field Location */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Chamber Logistics & Direct Contact</h2>
              <p className="text-[11px] text-slate-400">Physical address for MIO visits and communication</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium text-slate-700">
                Direct Phone Number <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="phone"
                  placeholder="+880 1711-000000"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                  className="pl-8 h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-slate-700">Official Email (Optional)</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@hospital.org"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="territory" className="text-xs font-medium text-slate-700">
                Assigned Territory Hub <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={formData.territory}
                onValueChange={(val) => handleChange("territory", val)}
              >
                <SelectTrigger className="h-8 text-xs bg-white">
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

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="chamber" className="text-xs font-medium text-slate-700">
                Primary Consultation Chamber Address <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="chamber"
                placeholder="e.g. Room 304, Popular Diagnostic Centre, Shantinagar"
                value={formData.chamberAddress}
                onChange={(e) => handleChange("chamberAddress", e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="visiting-days" className="text-xs font-medium text-slate-700">Consultation Timing & Days</Label>
              <Input
                id="visiting-days"
                placeholder="e.g. Sat - Wed (6:00 PM - 9:00 PM)"
                value={formData.visitingDays}
                onChange={(e) => handleChange("visitingDays", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Commercial Potential & Field Force Assignment */}
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Commercial Potential & Detailing Strategy</h2>
              <p className="text-[11px] text-slate-400">Classify prescription yield and assign dedicated Medical Information Officer</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="tier" className="text-xs font-medium text-slate-700">Prescription Potential Tier</Label>
              <Select
                value={formData.potentialCategory}
                onValueChange={(val) => handleChange("potentialCategory", val)}
              >
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="A+">Category A+ (40+ Patients/Day • Top Priority)</SelectItem>
                  <SelectItem value="A">Category A (25 - 40 Patients/Day • High Yield)</SelectItem>
                  <SelectItem value="B">Category B (15 - 25 Patients/Day • Stable Volume)</SelectItem>
                  <SelectItem value="C">Category C (&lt; 15 Patients/Day • Standard)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="daily-patients" className="text-xs font-medium text-slate-700">Est. Daily Patient Volume</Label>
              <Input
                id="daily-patients"
                type="number"
                placeholder="30"
                value={formData.patientVolumeDaily}
                onChange={(e) => handleChange("patientVolumeDaily", e.target.value)}
                required
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mio" className="text-xs font-medium text-slate-700">
                Designated Field Officer (MIO) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="mio"
                placeholder="e.g. Rafiqul Islam"
                value={formData.assignedMio}
                onChange={(e) => handleChange("assignedMio", e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-3">
              <Label htmlFor="products" className="text-xs font-medium text-slate-700">Target Promoted Products / Brands</Label>
              <Input
                id="products"
                placeholder="e.g. Napa Extra, Ciprocin 500mg, Rosuvastatin 10mg"
                value={formData.primaryProducts}
                onChange={(e) => handleChange("primaryProducts", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-5 mt-4 border-t border-slate-100">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 block">Sample & Trial Product Consent</span>
              <span className="text-[11px] text-slate-500">Enable field representative to disburse promotional starter strips</span>
            </div>
            <Switch
              checked={formData.consentForSamples}
              onCheckedChange={(val) => handleChange("consentForSamples", val)}
            />
          </div>
        </Card>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/doctors/database")}
            className="h-9 px-4 text-xs font-medium border-slate-200 hover:bg-slate-100 text-slate-700"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-9 px-5 text-xs font-semibold bg-[#0090FF] hover:bg-[#0080e5] text-white gap-2 shadow-none"
          >
            <Save className="h-3.5 w-3.5" />
            {isSubmitting ? "Enrolling Practitioner..." : "Save Doctor to Master Directory"}
          </Button>
        </div>
      </form>
    </div>
  );
}