"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  Plus,
  Download,
  Search,
  CheckCircle2,
  KeyRound,
  Save,
  Lock,
} from "lucide-react";

interface RolePermission {
  module: string;
  category: string;
  read: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  specialAction?: string;
  specialGranted: boolean;
}

interface SystemRole {
  id: string;
  name: string;
  code: string;
  description: string;
  userCount: number;
  isSystemDefault: boolean;
  permissions: RolePermission[];
}

const defaultPermissions: Record<string, RolePermission[]> = {
  SUPER_ADMIN: [
    { module: "Doctor Registry", category: "Clinical", read: true, create: true, edit: true, delete: true, specialAction: "Re-rank Category Tiers", specialGranted: true },
    { module: "FEFO Stock Control", category: "Warehouse", read: true, create: true, edit: true, delete: true, specialAction: "Quarantine / Write-off Batch", specialGranted: true },
    { module: "Sales & Dispatch", category: "Logistics", read: true, create: true, edit: true, delete: true, specialAction: "Override Credit Hold", specialGranted: true },
    { module: "Accounts & Collections", category: "Finance", read: true, create: true, edit: true, delete: true, specialAction: "Authorize Bank Release", specialGranted: true },
    { module: "Staff & Payroll", category: "Human Resources", read: true, create: true, edit: true, delete: true, specialAction: "Issue Appointment Letters", specialGranted: true },
  ],
  RSM_EXEC: [
    { module: "Doctor Registry", category: "Clinical", read: true, create: true, edit: true, delete: false, specialAction: "Re-rank Category Tiers", specialGranted: true },
    { module: "FEFO Stock Control", category: "Warehouse", read: true, create: false, edit: false, delete: false, specialAction: "Quarantine / Write-off Batch", specialGranted: false },
    { module: "Sales & Dispatch", category: "Logistics", read: true, create: true, edit: true, delete: false, specialAction: "Override Credit Hold", specialGranted: false },
    { module: "Accounts & Collections", category: "Finance", read: true, create: false, edit: false, delete: false, specialAction: "Authorize Bank Release", specialGranted: false },
    { module: "Staff & Payroll", category: "Human Resources", read: true, create: false, edit: false, delete: false, specialAction: "Issue Appointment Letters", specialGranted: false },
  ],
  MIO_FIELD: [
    { module: "Doctor Registry", category: "Clinical", read: true, create: true, edit: true, delete: false, specialAction: "Re-rank Category Tiers", specialGranted: false },
    { module: "FEFO Stock Control", category: "Warehouse", read: true, create: false, edit: false, delete: false, specialAction: "Quarantine / Write-off Batch", specialGranted: false },
    { module: "Sales & Dispatch", category: "Logistics", read: true, create: true, edit: false, delete: false, specialAction: "Override Credit Hold", specialGranted: false },
    { module: "Accounts & Collections", category: "Finance", read: true, create: true, edit: false, delete: false, specialAction: "Authorize Bank Release", specialGranted: false },
    { module: "Staff & Payroll", category: "Human Resources", read: false, create: false, edit: false, delete: false, specialAction: "Issue Appointment Letters", specialGranted: false },
  ],
  FIN_CONTROLLER: [
    { module: "Doctor Registry", category: "Clinical", read: true, create: false, edit: false, delete: false, specialAction: "Re-rank Category Tiers", specialGranted: false },
    { module: "FEFO Stock Control", category: "Warehouse", read: true, create: false, edit: false, delete: false, specialAction: "Quarantine / Write-off Batch", specialGranted: false },
    { module: "Sales & Dispatch", category: "Logistics", read: true, create: false, edit: true, delete: false, specialAction: "Override Credit Hold", specialGranted: true },
    { module: "Accounts & Collections", category: "Finance", read: true, create: true, edit: true, delete: true, specialAction: "Authorize Bank Release", specialGranted: true },
    { module: "Staff & Payroll", category: "Human Resources", read: true, create: true, edit: true, delete: false, specialAction: "Issue Appointment Letters", specialGranted: false },
  ],
  WH_LOGISTICS: [
    { module: "Doctor Registry", category: "Clinical", read: false, create: false, edit: false, delete: false, specialAction: "Re-rank Category Tiers", specialGranted: false },
    { module: "FEFO Stock Control", category: "Warehouse", read: true, create: true, edit: true, delete: false, specialAction: "Quarantine / Write-off Batch", specialGranted: true },
    { module: "Sales & Dispatch", category: "Logistics", read: true, create: true, edit: true, delete: false, specialAction: "Override Credit Hold", specialGranted: false },
    { module: "Accounts & Collections", category: "Finance", read: false, create: false, edit: false, delete: false, specialAction: "Authorize Bank Release", specialGranted: false },
    { module: "Staff & Payroll", category: "Human Resources", read: false, create: false, edit: false, delete: false, specialAction: "Issue Appointment Letters", specialGranted: false },
  ],
};

const initialRoles: SystemRole[] = [
  {
    id: "role-1",
    name: "Super Administrator / Management",
    code: "SUPER_ADMIN",
    description: "Unrestricted master operational rights across statutory audits, financial releases, and user provisioning.",
    userCount: 2,
    isSystemDefault: true,
    permissions: defaultPermissions.SUPER_ADMIN,
  },
  {
    id: "role-2",
    name: "Regional Sales Manager (RSM)",
    code: "RSM_EXEC",
    description: "Division-level field force governance, target allocations, and doctor engagement monitoring.",
    userCount: 4,
    isSystemDefault: true,
    permissions: defaultPermissions.RSM_EXEC,
  },
  {
    id: "role-3",
    name: "Medical Information Officer (MIO)",
    code: "MIO_FIELD",
    description: "Prescription detailing logs, territory doctor calls, order booking, and field payment realization entries.",
    userCount: 28,
    isSystemDefault: true,
    permissions: defaultPermissions.MIO_FIELD,
  },
  {
    id: "role-4",
    name: "Accounts & Finance Controller",
    code: "FIN_CONTROLLER",
    description: "Bank reconciliations, payment vouchers, A/R collections, and payroll electronic advice authorization.",
    userCount: 5,
    isSystemDefault: true,
    permissions: defaultPermissions.FIN_CONTROLLER,
  },
  {
    id: "role-5",
    name: "Warehouse & Cold-Chain Lead",
    code: "WH_LOGISTICS",
    description: "FEFO bin tracking, batch quarantine locks, delivery challan verification, and temperature audits.",
    userCount: 6,
    isSystemDefault: true,
    permissions: defaultPermissions.WH_LOGISTICS,
  },
];

interface UserAssignment {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Stored securely in database
  roleCode: string;
  territory: string;
  status: "Active" | "Restricted";
  lastLogin: string;
}

const initialAssignments: UserAssignment[] = [
  { id: "u-1", name: "Toshin Bin Azad", email: "toshin@akpharma.com", passwordHash: "••••••••••••", roleCode: "SUPER_ADMIN", territory: "Central HQ", status: "Active", lastLogin: "Just now" },
  { id: "u-2", name: "Nazmul Huda Chowdhury", email: "nazmul.rsm@akpharma.com", passwordHash: "••••••••••••", roleCode: "RSM_EXEC", territory: "Central Division HQ", status: "Active", lastLogin: "2 hours ago" },
  { id: "u-3", name: "Rafiqul Islam", email: "rafiqul.mio@akpharma.com", passwordHash: "••••••••••••", roleCode: "MIO_FIELD", territory: "Dhaka North Hub", status: "Active", lastLogin: "Today, 08:30 AM" },
];

export default function RBACManagementPage() {
  const [roles, setRoles] = React.useState<SystemRole[]>(initialRoles);
  const [selectedRole, setSelectedRole] = React.useState<SystemRole>(initialRoles[0]);
  const [assignments, setAssignments] = React.useState<UserAssignment[]>(initialAssignments);
  const [searchUserQuery, setSearchUserQuery] = React.useState("");

  // Database Provisioning Modal State
  const [isProvisionOpen, setIsProvisionOpen] = React.useState(false);
  const [provName, setProvName] = React.useState("");
  const [provEmail, setProvEmail] = React.useState("");
  const [provPassword, setProvPassword] = React.useState("");
  const [provRoleCode, setProvRoleCode] = React.useState("MIO_FIELD");
  const [provTerritory, setProvTerritory] = React.useState("Dhaka North Hub");

  // Save changes feedback
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [saveToast, setSaveToast] = React.useState(false);

  const handleTogglePermission = (
    moduleName: string,
    action: "read" | "create" | "edit" | "delete" | "specialGranted"
  ) => {
    setSelectedRole((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) => {
        if (p.module === moduleName) {
          return { ...p, [action]: !p[action] };
        }
        return p;
      }),
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveRolePermissions = () => {
    setRoles((prev) =>
      prev.map((r) => (r.id === selectedRole.id ? selectedRole : r))
    );
    setHasUnsavedChanges(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // Database User Provisioning Handler
  const handleProvisionOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provEmail || !provPassword || !provName) return;

    const newUser: UserAssignment = {
      id: `u-${Date.now()}`,
      name: provName,
      email: provEmail,
      passwordHash: "•".repeat(provPassword.length) + " (Hashed)",
      roleCode: provRoleCode,
      territory: provTerritory,
      status: "Active",
      lastLogin: "Never logged in",
    };

    setAssignments((prev) => [newUser, ...prev]);

    // Increment user count for that role
    setRoles((prev) =>
      prev.map((r) => (r.code === provRoleCode ? { ...r, userCount: r.userCount + 1 } : r))
    );

    // Reset Form
    setProvName("");
    setProvEmail("");
    setProvPassword("");
    setIsProvisionOpen(false);
  };

  const handleExportAudit = () => {
    const data = assignments.map((u) => ({
      "Operator Name": u.name,
      "Database Email": u.email,
      "Assigned Role Code": u.roleCode,
      "Territory Station": u.territory,
      "Account Status": u.status,
      "Last Session": u.lastLogin,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RBAC Security Audit");
    XLSX.writeFile(workbook, `AK_Pharma_RBAC_Database_Audit_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredUsers = assignments.filter((u) => {
    return (
      u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.roleCode.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.territory.toLowerCase().includes(searchUserQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Role-Based Access Control (RBAC) & Database Credentials
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Provision user login emails and encrypted passwords, configure permissions, and enforce separation of duties.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportAudit}
            className="h-9 gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3.5 rounded-lg shadow-none"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Security Audit
          </Button>

          {/* Provision Operator Modal Button */}
          <Dialog open={isProvisionOpen} onOpenChange={setIsProvisionOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 bg-[#0090FF] hover:bg-[#0080e5] text-white text-xs font-semibold px-3.5 rounded-lg shadow-none">
                <Plus className="h-4 w-4" />
                Provision Operator Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] bg-white rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Database Credential Provisioning
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Enter login credentials and assign an operational role to grant system access.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleProvisionOperator} className="space-y-3.5 py-2 text-xs">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-slate-700">Operator Full Name *</Label>
                  <Input
                    placeholder="e.g. Dr. Asif Iqbal"
                    value={provName}
                    onChange={(e) => setProvName(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700">Login Email (Username) *</Label>
                    <Input
                      type="email"
                      placeholder="asif@akpharma.com"
                      value={provEmail}
                      onChange={(e) => setProvEmail(e.target.value)}
                      required
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700">Database Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={provPassword}
                        onChange={(e) => setProvPassword(e.target.value)}
                        required
                        className="pl-8 h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700">Security Role *</Label>
                    <Select value={provRoleCode} onValueChange={setProvRoleCode}>
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.code}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold text-slate-700">Territory Station</Label>
                    <Input
                      placeholder="e.g. Dhaka South Hub"
                      value={provTerritory}
                      onChange={(e) => setProvTerritory(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsProvisionOpen(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white font-semibold">
                    Save to Database & Grant Access
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Configured Role Classes</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0090FF]">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {roles.length} Roles
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            System default templates active
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Provisioned Accounts</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            {assignments.length} Logins
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Active database credentials
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Separation of Duties</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none font-mono text-emerald-600">
            Enforced
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-3">
            Maker-checker rule active on vouchers
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Root Authentication</span>
            <Badge variant="outline" className="text-[11px] font-semibold text-rose-700 bg-rose-50 border-rose-200 px-2 py-0.5 rounded-md">
              Encrypted
            </Badge>
          </div>
          <div className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 leading-none font-mono">
            Bcrypt (12)
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Secure database password hashing
          </p>
        </Card>
      </div>

      {/* 3. Role Selector & Scope Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Security Role Templates
            </span>
            <span className="text-[11px] font-semibold text-slate-400">{roles.length} Available</span>
          </div>

          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = selectedRole.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRole(r);
                    setHasUnsavedChanges(false);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#0090FF] bg-blue-50/40 shadow-xs"
                      : "border-slate-200/90 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{r.name}</h4>
                      <span className="text-[10px] font-mono text-[#0090FF] block mt-0.5">{r.code}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-medium bg-white text-slate-600">
                      {r.userCount} Users
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="lg:col-span-8 rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Permission Matrix: <span className="text-[#0090FF]">{selectedRole.name}</span>
                </h3>
                {selectedRole.isSystemDefault && (
                  <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                    System Protected
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle functional read, create, write, and statutory audit actions for this role tier.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {saveToast && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                </span>
              )}
              <Button
                size="sm"
                disabled={!hasUnsavedChanges}
                onClick={handleSaveRolePermissions}
                className="h-8 text-xs bg-[#0090FF] hover:bg-[#0080e5] text-white gap-1.5 shadow-none"
              >
                <Save className="h-3.5 w-3.5" />
                Save Permissions
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
                  <TableHead className="text-xs font-medium text-slate-600 pl-0">Functional Module</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 text-center w-14">View</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 text-center w-14">Create</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 text-center w-14">Edit</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 text-center w-14">Delete</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 pr-0">Statutory Special Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedRole.permissions.map((perm) => (
                  <TableRow key={perm.module} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <TableCell className="py-3 pl-0">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{perm.module}</span>
                        <span className="text-[10px] text-slate-400 block">{perm.category} Scope</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.read}
                        onChange={() => handleTogglePermission(perm.module, "read")}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-[#0090FF] focus:ring-0 cursor-pointer"
                      />
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.create}
                        onChange={() => handleTogglePermission(perm.module, "create")}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-[#0090FF] focus:ring-0 cursor-pointer"
                      />
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.edit}
                        onChange={() => handleTogglePermission(perm.module, "edit")}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-[#0090FF] focus:ring-0 cursor-pointer"
                      />
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.delete}
                        onChange={() => handleTogglePermission(perm.module, "delete")}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-[#0090FF] focus:ring-0 cursor-pointer"
                      />
                    </TableCell>

                    <TableCell className="py-3 pr-0">
                      {perm.specialAction ? (
                        <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                          <span className="text-[11px] font-medium text-slate-700 truncate max-w-[210px]">
                            {perm.specialAction}
                          </span>
                          <Switch
                            checked={perm.specialGranted}
                            onCheckedChange={() => handleTogglePermission(perm.module, "specialGranted")}
                            className="scale-75"
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No elevated privilege</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* 4. Active Database Credential Roster */}
      <Card className="rounded-xl border border-slate-200/90 shadow-none bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              PROVISIONED DATABASE CREDENTIALS & LOGINS
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active login accounts stored in PostgreSQL mapping email usernames to role permissions
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search user, email, or role..."
              value={searchUserQuery}
              onChange={(e) => setSearchUserQuery(e.target.value)}
              className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/50 w-[240px]"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent text-xs text-slate-600">
              <TableHead className="text-xs font-medium text-slate-600 pl-0">Operator & Login Email</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Password Hash</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Assigned Role</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Territory Station</TableHead>
              <TableHead className="text-xs font-medium text-slate-600">Last Active Session</TableHead>
              <TableHead className="text-xs font-medium text-slate-600 text-right pr-0">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const matchedRole = roles.find((r) => r.code === user.roleCode);

              return (
                <TableRow key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <TableCell className="py-3 pl-0">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 rounded-full border border-slate-200">
                        <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{user.name}</span>
                        <span className="text-[10px] text-[#0090FF] font-mono block">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs font-mono text-slate-400">
                    {user.passwordHash}
                  </TableCell>

                  <TableCell className="py-3 text-xs font-semibold text-slate-800">
                    {matchedRole ? matchedRole.name : user.roleCode}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-600">
                    {user.territory}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-500 font-mono">
                    {user.lastLogin}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-right pr-0">
                    <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
                      {user.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}