"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Terminal,
  Lock,
  Boxes,
  Stethoscope,
  Banknote,
  Users2,
  ArrowRight,
  Eye,
  Fingerprint,
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  auditRef: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  ipAddress: string;
  module: "FEFO Warehouse" | "Clinical Registry" | "Finance & Accounts" | "Workforce & HR" | "RBAC Security";
  actionType: "Batch Quarantined" | "Price Override" | "Appointment Issued" | "Tier Re-ranked" | "Permission Changed" | "Voucher Approved";
  severity: "Critical" | "Security Warning" | "Statutory Notice" | "Routine";
  entityTarget: string;
  changeSummary: string;
  sha256Hash: string;
  priorPayload?: string;
  newPayload?: string;
  verifiedSignature: boolean;
}

const initialAuditLogs: AuditLogEntry[] = [
  {
    id: "log-101",
    auditRef: "AUD-2026-90412",
    timestamp: "17 Sep 2026, 01:14:22",
    actorName: "Toshin Bin Azad",
    actorEmail: "toshin@akpharma.com",
    actorRole: "Super Administrator",
    ipAddress: "103.145.118.42 (Dhaka HQ Gateway)",
    module: "FEFO Warehouse",
    actionType: "Batch Quarantined",
    severity: "Critical",
    entityTarget: "Batch # BX-2025-119 (Clavroc 625mg)",
    changeSummary: "Manual isolation from active picking bay into Quarantine Bay Q-01 due to 11-day threshold breach.",
    sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    priorPayload: '{"warehouseBin": "Bay 02 - Shelf B", "status": "Healthy", "saleable": true}',
    newPayload: '{"warehouseBin": "Quarantine Bay Q-01", "status": "Quarantined", "saleable": false}',
    verifiedSignature: true,
  },
  {
    id: "log-102",
    auditRef: "AUD-2026-90411",
    timestamp: "16 Sep 2026, 21:40:05",
    actorName: "Toshin Bin Azad",
    actorEmail: "toshin@akpharma.com",
    actorRole: "Super Administrator",
    ipAddress: "103.145.118.42 (Dhaka HQ Gateway)",
    module: "Workforce & HR",
    actionType: "Appointment Issued",
    severity: "Statutory Notice",
    entityTarget: "Employee # AKP-25001 (Mr. Ruhul Amin Redoy)",
    changeSummary: "Executed formal statutory Appointment Letter with BDT 20,000/- gross compensation structure.",
    sha256Hash: "8f4811b9a27c73b0f02388c3f4e2401fcf2ba8a6b107e3240e4f8d55ff2b7a91",
    priorPayload: '{"empId": "AKP-25001", "status": "Candidate"}',
    newPayload: '{"empId": "AKP-25001", "status": "Probationary", "gross": 20000, "territory": "Savar"}',
    verifiedSignature: true,
  },
  {
    id: "log-103",
    auditRef: "AUD-2026-90410",
    timestamp: "16 Sep 2026, 18:22:19",
    actorName: "Nazmul Huda Chowdhury",
    actorEmail: "nazmul.rsm@akpharma.com",
    actorRole: "Regional Sales Manager",
    ipAddress: "119.30.38.10 (Mirpur Sub-Hub)",
    module: "Clinical Registry",
    actionType: "Tier Re-ranked",
    severity: "Routine",
    entityTarget: "Practitioner BMDC: A-49821 (Dr. Anwarul Azim)",
    changeSummary: "Elevated prescriber category from Category A to Tier A+ based on verified monthly prescription run-rate.",
    sha256Hash: "3a52ce780950d4d969792a2559cd519d7ee8c727",
    priorPayload: '{"tier": "A", "dailyFootfall": 35}',
    newPayload: '{"tier": "A+", "dailyFootfall": 45}',
    verifiedSignature: true,
  },
  {
    id: "log-104",
    auditRef: "AUD-2026-90409",
    timestamp: "16 Sep 2026, 15:05:44",
    actorName: "Toshin Bin Azad",
    actorEmail: "toshin@akpharma.com",
    actorRole: "Super Administrator",
    ipAddress: "103.145.118.42 (Dhaka HQ Gateway)",
    module: "RBAC Security",
    actionType: "Permission Changed",
    severity: "Security Warning",
    entityTarget: "Role: MIO_FIELD (Medical Information Officer)",
    changeSummary: "Disabled global sales discount override privilege for standard territorial field representatives.",
    sha256Hash: "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
    priorPayload: '{"role": "MIO_FIELD", "canDiscountOverride": true}',
    newPayload: '{"role": "MIO_FIELD", "canDiscountOverride": false}',
    verifiedSignature: true,
  },
  {
    id: "log-105",
    auditRef: "AUD-2026-90408",
    timestamp: "16 Sep 2026, 12:30:11",
    actorName: "Finance Controller",
    actorEmail: "accounts@akpharma.com",
    actorRole: "Finance Controller",
    ipAddress: "103.145.118.45 (Finance Subnet)",
    module: "Finance & Accounts",
    actionType: "Voucher Approved",
    severity: "Statutory Notice",
    entityTarget: "Voucher # PV-2026-1041 (Square Raw Pharma)",
    changeSummary: "Authorized BDT 4,20,000/- BEFTN outward disbursal for API active ingredient consignment lot.",
    sha256Hash: "c282684949b291a2688006b51034f77c8e9b6278",
    priorPayload: '{"voucherNo": "PV-2026-1041", "state": "Pending Signoff"}',
    newPayload: '{"voucherNo": "PV-2026-1041", "state": "Approved & Settled"}',
    verifiedSignature: true,
  },
  {
    id: "log-106",
    auditRef: "AUD-2026-90407",
    timestamp: "15 Sep 2026, 17:15:30",
    actorName: "Mahbubur Rashid",
    actorEmail: "mahbub.warehouse@akpharma.com",
    actorRole: "Warehouse Lead",
    ipAddress: "192.168.10.88 (Tejgaon Depot Terminal)",
    module: "FEFO Warehouse",
    actionType: "Price Override",
    severity: "Security Warning",
    entityTarget: "SKU-CF-200 (Cef-3 200mg/5ml)",
    changeSummary: "Flagged bulk institutional consignment trade price variance from ৳185.00 to ৳178.50 under tender agreement.",
    sha256Hash: "b6589fc6ab0dc82cf12099d1c2d40ab994e8410c",
    priorPayload: '{"unitPrice": 185.00}',
    newPayload: '{"unitPrice": 178.50, "authorizedBy": "Sales Director"}',
    verifiedSignature: true,
  },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = React.useState<AuditLogEntry[]>(initialAuditLogs);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [moduleFilter, setModuleFilter] = React.useState("all");
  const [severityFilter, setSeverityFilter] = React.useState("all");

  // Inspection Drawer State
  const [selectedEntry, setSelectedEntry] = React.useState<AuditLogEntry | null>(null);
  const [isInspectOpen, setIsInspectOpen] = React.useState(false);

  const handleOpenInspect = (entry: AuditLogEntry) => {
    setSelectedEntry(entry);
    setIsInspectOpen(true);
  };

  const handleExportExcel = () => {
    const data = logs.map((l) => ({
      "Audit Reference": l.auditRef,
      "Timestamp (UTC+6)": l.timestamp,
      "Executing Operator": l.actorName,
      "Operator Email": l.actorEmail,
      "Role Permission": l.actorRole,
      "Network IP Address": l.ipAddress,
      "Subsystem Module": l.module,
      "Event Classification": l.actionType,
      "Audit Severity": l.severity,
      "Target Entity / Lot": l.entityTarget,
      "Audit Action Description": l.changeSummary,
      "Cryptographic SHA-256 Hash": l.sha256Hash,
      "21 CFR Digital Signature": l.verifiedSignature ? "VERIFIED VALID" : "INVALID",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "21 CFR Audit Trail");
    XLSX.writeFile(
      workbook,
      `AK_Pharma_Statutory_Audit_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.auditRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityTarget.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.changeSummary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModule =
      moduleFilter === "all" || log.module.toLowerCase() === moduleFilter.toLowerCase();

    const matchesSeverity =
      severityFilter === "all" || log.severity.toLowerCase() === severityFilter.toLowerCase();

    return matchesSearch && matchesModule && matchesSeverity;
  });

  const criticalCount = logs.filter((l) => l.severity === "Critical").length;
  const warningCount = logs.filter((l) => l.severity === "Security Warning").length;

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Statutory Audit Trail & Compliance Activity Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable 21 CFR Part 11 and GMP-certified operational logging tracking all clinical, financial, inventory, and role revisions.
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
            Export Certified Audit Log
          </Button>

          <Badge variant="outline" className="text-xs font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 inline text-emerald-600" />
            Hash Chaining: Intact
          </Badge>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Logged Events</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
              <History className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {logs.length} Operations
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Append-only write ledger active
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Critical Statutory Overrides</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none font-mono text-rose-600">
            {criticalCount} Critical
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-3">
            Includes batch quarantines & write-offs
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Security & Price Warnings</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none font-mono text-amber-600">
            {warningCount} Warnings
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-3">
            Policy modifications & price variance
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cryptographic Integrity</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-md">
              SHA-256
            </Badge>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            100% Valid
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Zero tampering detected across blocks
          </p>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search ref #, operator, lot, action, or payload..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="h-8 w-[170px] text-xs bg-white border-slate-200">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <SelectValue placeholder="All Subsystems" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Subsystems</SelectItem>
              <SelectItem value="fefo warehouse">FEFO Warehouse</SelectItem>
              <SelectItem value="clinical registry">Clinical Registry</SelectItem>
              <SelectItem value="finance & accounts">Finance & Accounts</SelectItem>
              <SelectItem value="workforce & hr">Workforce & HR</SelectItem>
              <SelectItem value="rbac security">RBAC Security</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs bg-white border-slate-200">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical Only</SelectItem>
              <SelectItem value="security warning">Security Warnings</SelectItem>
              <SelectItem value="statutory notice">Statutory Notices</SelectItem>
              <SelectItem value="routine">Routine Actions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Main Audit Trail Register Table */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              CHRONOLOGICAL AUDIT EVENT JOURNAL
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any log entry to inspect cryptographic hashes, originating IP, and payload state transitions
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredLogs.length} Verified Entries
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Timestamp & Ref</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Operating Actor</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Subsystem Scope</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Action Type</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Affected Target</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Severity</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                {/* Timestamp & Audit Ref */}
                <TableCell className="py-3 pl-0">
                  <div className="leading-tight">
                    <span className="text-xs font-semibold text-slate-900 block">{log.timestamp}</span>
                    <span className="font-mono text-[10px] text-[#0090FF] block mt-0.5">{log.auditRef}</span>
                  </div>
                </TableCell>

                {/* Operating Actor */}
                <TableCell className="py-3 text-xs text-slate-800">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 rounded-full border border-slate-200">
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {log.actorName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                      <span className="font-semibold text-slate-900 block">{log.actorName}</span>
                      <span className="text-[10px] text-slate-400 block">{log.actorRole}</span>
                    </div>
                  </div>
                </TableCell>

                {/* Subsystem Scope */}
                <TableCell className="py-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    {log.module === "FEFO Warehouse" && <Boxes className="h-3.5 w-3.5 text-amber-600" />}
                    {log.module === "Clinical Registry" && <Stethoscope className="h-3.5 w-3.5 text-blue-600" />}
                    {log.module === "Finance & Accounts" && <Banknote className="h-3.5 w-3.5 text-emerald-600" />}
                    {log.module === "Workforce & HR" && <Users2 className="h-3.5 w-3.5 text-purple-600" />}
                    {log.module === "RBAC Security" && <KeyRound className="h-3.5 w-3.5 text-rose-600" />}
                    <span className="font-medium text-slate-800">{log.module}</span>
                  </div>
                </TableCell>

                {/* Action Type */}
                <TableCell className="py-3 text-xs font-semibold text-slate-900">
                  {log.actionType}
                </TableCell>

                {/* Affected Target */}
                <TableCell className="py-3 text-xs text-slate-600 max-w-[210px] truncate">
                  {log.entityTarget}
                </TableCell>

                {/* Severity Badge */}
                <TableCell className="py-3 text-xs">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      log.severity === "Critical"
                        ? "text-rose-700 bg-rose-50 border-rose-200"
                        : log.severity === "Security Warning"
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : log.severity === "Statutory Notice"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : "text-slate-700 bg-slate-50 border-slate-200"
                    }`}
                  >
                    {log.severity}
                  </Badge>
                </TableCell>

                {/* Inspect Action */}
                <TableCell className="py-3 text-xs text-right pr-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenInspect(log)}
                    className="h-7 px-2.5 text-xs text-[#0090FF] hover:bg-blue-50 gap-1 font-medium"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Inspect Payload
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Deep-Dive Audit Event Inspection Drawer (Sheet) */}
      <Sheet open={isInspectOpen} onOpenChange={setIsInspectOpen}>
        <SheetContent className="w-full sm:max-w-md bg-white p-0 overflow-y-auto border-l border-slate-200">
          {selectedEntry && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#0090FF] uppercase tracking-wider">
                      21 CFR PART 11 AUDIT RECORD
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      {selectedEntry.actionType}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {selectedEntry.auditRef}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                      selectedEntry.severity === "Critical"
                        ? "text-rose-700 bg-rose-50 border-rose-200"
                        : selectedEntry.severity === "Security Warning"
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-blue-700 bg-blue-50 border-blue-200"
                    }`}
                  >
                    {selectedEntry.severity}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                  <span>Timestamp: <strong>{selectedEntry.timestamp}</strong></span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                    <Fingerprint className="h-3.5 w-3.5" /> Signed
                  </span>
                </div>
              </div>

              {/* Event Metadata */}
              <div className="p-6 space-y-5 flex-1 text-xs">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Originating User & Network Context
                  </h4>
                  <div className="space-y-2 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Executing User:</span>
                      <span className="font-bold text-slate-900">{selectedEntry.actorName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Corporate Account:</span>
                      <span className="font-mono text-slate-800">{selectedEntry.actorEmail}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Security Role:</span>
                      <span className="font-medium text-slate-800">{selectedEntry.actorRole}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">Client Host IP:</span>
                      <span className="font-mono font-medium text-slate-800">{selectedEntry.ipAddress}</span>
                    </div>
                  </div>
                </div>

                {/* Target & Summary */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Target Entity & Action Summary
                  </h4>
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                    <div>
                      <span className="text-slate-500 block mb-0.5">Target Entity ID:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedEntry.entityTarget}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-slate-500 block mb-0.5">Audit Narrative:</span>
                      <p className="text-slate-800 leading-relaxed">{selectedEntry.changeSummary}</p>
                    </div>
                  </div>
                </div>

                {/* Pre vs Post Payload */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    State Payload Diff (Before vs. After)
                  </h4>
                  <div className="space-y-2">
                    {selectedEntry.priorPayload && (
                      <div className="p-2.5 rounded-lg bg-rose-50/40 border border-rose-100">
                        <span className="text-[10px] font-bold text-rose-700 uppercase block mb-1">
                          Previous State Payload
                        </span>
                        <pre className="font-mono text-[11px] text-rose-900 whitespace-pre-wrap break-all">
                          {selectedEntry.priorPayload}
                        </pre>
                      </div>
                    )}

                    {selectedEntry.newPayload && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">
                          Committed State Payload
                        </span>
                        <pre className="font-mono text-[11px] text-emerald-900 whitespace-pre-wrap break-all">
                          {selectedEntry.newPayload}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cryptographic SHA-256 Checksum */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Cryptographic Signature Hash (Immutable)
                  </h4>
                  <div className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[10px] break-all border border-slate-800">
                    {selectedEntry.sha256Hash}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsInspectOpen(false)}
                  className="h-8 text-xs text-slate-600"
                >
                  Close Inspection
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedEntry, null, 2));
                  }}
                  className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white"
                >
                  Copy JSON Log
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}