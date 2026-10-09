"use client"

import * as React from "react"
import { API_URL } from "@/lib/api"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  Shield,
  ShieldCheck,
  Users,
  Plus,
  Download,
  Search,
  CheckCircle2,
  Save,
  Lock,
  RefreshCw,
  Trash2,
  Ban,
} from "lucide-react"

interface RolePermission {
  module: string
  category: string
  read: boolean
  create: boolean
  edit: boolean
  delete: boolean
  specialAction?: string
  specialGranted: boolean
}

interface SystemRole {
  id: string
  name: string
  code: string
  description: string
  userCount: number
  isSystemDefault: boolean
  permissions: RolePermission[]
}

interface UserAssignment {
  id: string
  name: string
  email: string
  passwordHash: string
  roleCode: string
  roleName: string
  territory: string
  status: "Active" | "Restricted"
  lastLogin: string
}

export default function RBACManagementPage() {
  const [roles, setRoles] = React.useState<SystemRole[]>([])
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>("")
  const [assignments, setAssignments] = React.useState<UserAssignment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchUserQuery, setSearchUserQuery] = React.useState("")

  // Provisioning Modal State
  const [isProvisionOpen, setIsProvisionOpen] = React.useState(false)

  // Global Delete Modal State
  const [userToDelete, setUserToDelete] = React.useState<{ id: string; name: string } | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [isDeletingUser, setIsDeletingUser] = React.useState(false)
  const [provName, setProvName] = React.useState("")
  const [provEmail, setProvEmail] = React.useState("")
  const [provPassword, setProvPassword] = React.useState("")
  const [provRoleCode, setProvRoleCode] = React.useState("MIO_FIELD")
  const [provTerritory, setProvTerritory] = React.useState("Dhaka North Hub")

  // Feedback states
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  const [saveToast, setSaveToast] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)


  const getAuthHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken")
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
    }
    return headers
  }

  const fetchRBACData = React.useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setLoading(true)

        const [rolesRes, usersRes] = await Promise.all([
          fetch(`${API_URL}/rbac/roles`, {
            headers: getAuthHeaders(),
          }).catch(() => null),
          fetch(`${API_URL}/rbac/users`, {
            headers: getAuthHeaders(),
          }).catch(() => null),
        ])

        if (rolesRes && rolesRes.ok) {
          const rolesData: SystemRole[] = await rolesRes.json()
          if (Array.isArray(rolesData) && rolesData.length > 0) {
            setRoles(rolesData)
            setSelectedRoleId((curr) => {
              if (curr && rolesData.some((r) => r.id === curr)) return curr
              return rolesData[0].id
            })
          }
        }

        if (usersRes && usersRes.ok) {
          const usersData = await usersRes.json()
          if (Array.isArray(usersData)) {
            setAssignments(usersData)
          }
        }
      } catch (err) {
        console.error("Error loading RBAC settings:", err)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  React.useEffect(() => {
    fetchRBACData(false)
  }, [fetchRBACData])

  const selectedRole = React.useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0] || null
  }, [roles, selectedRoleId])

  const handleTogglePermission = (
    moduleName: string,
    action: "read" | "create" | "edit" | "delete" | "specialGranted"
  ) => {
    if (!selectedRole) return

    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id === selectedRole.id) {
          return {
            ...role,
            permissions: (role.permissions || []).map((p) => {
              if (p.module === moduleName) {
                return { ...p, [action]: !p[action] }
              }
              return p
            }),
          }
        }
        return role
      })
    )

    setHasUnsavedChanges(true)
  }

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return
    try {
      setIsSaving(true)
      const res = await fetch(
        `${API_URL}/rbac/roles/${selectedRole.id}/permissions`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ permissions: selectedRole.permissions }),
        }
      )

      if (!res.ok) throw new Error("Failed to save permissions")

      setHasUnsavedChanges(false)
      setSaveToast(true)
      setTimeout(() => setSaveToast(false), 2500)
    } catch {
      alert("Failed to save permission matrix to database.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleProvisionOperator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!provEmail || !provPassword || !provName) return

    try {
      const res = await fetch(`${API_URL}/rbac/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: provName,
          email: provEmail,
          password: provPassword,
          roleCode: provRoleCode,
          territory: provTerritory,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Provisioning failed")
        return
      }

      setProvName("")
      setProvEmail("")
      setProvPassword("")
      setIsProvisionOpen(false)
      fetchRBACData(false)
    } catch {
      alert("Network error: Failed to provision user in database.")
    }
  }

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const res = await fetch(`${API_URL}/rbac/users/${userId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error("Failed to update status")
      setAssignments((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status: u.status === "Active" ? "Restricted" : "Active" }
            : u
        )
      )
    } catch {
      alert("Could not update account status.")
    }
  }

  const handleOpenDeleteModal = (userId: string, name: string) => {
    setUserToDelete({ id: userId, name })
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return
    const toastId = toast.loading(`Revoking credentials for "${userToDelete.name}"...`)
    try {
      setIsDeletingUser(true)
      const res = await fetch(`${API_URL}/rbac/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to delete user")
      }

      toast.success(`Operator credentials for "${userToDelete.name}" revoked.`, { id: toastId })
      setAssignments((prev) => prev.filter((u) => u.id !== userToDelete.id))
      setIsDeleteModalOpen(false)
      setUserToDelete(null)
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast.error(error.message || "Could not delete user account.", { id: toastId })
    } finally {
      setIsDeletingUser(false)
    }
  }

  const handleExportAudit = () => {
    const data = assignments.map((u) => ({
      "Operator Name": u.name,
      "Database Email": u.email,
      "Assigned Role": u.roleName,
      "Territory Station": u.territory,
      "Account Status": u.status,
      "Last Session": u.lastLogin,
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "RBAC Security Audit")
    XLSX.writeFile(
      workbook,
      `AK_Pharma_RBAC_Audit_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
  }

  const filteredUsers = assignments.filter((u) => {
    const q = searchUserQuery.toLowerCase()
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.roleCode || "").toLowerCase().includes(q) ||
      (u.territory || "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-12 font-sans text-slate-900">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              SECURITY & ACCESS CONTROL MATRIX
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            RBAC & Credential Provisioning
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Closed-access registration: Provision operator logins, assign roles,
            and enforce permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchRBACData(true)}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`}
            />
            Sync
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportAudit}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export Audit
          </Button>

          <Button
            size="sm"
            onClick={() => setIsProvisionOpen(true)}
            className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-4 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
          >
            <Plus className="h-4 w-4" />
            Provision Operator Account
          </Button>
        </div>
      </div>

      {/* 2. Top Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Configured Role Classes
            </span>
            <div className="rounded-lg bg-blue-50 p-1.5 text-[#0090FF]">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-slate-900">
            {roles.length} Roles
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Active database permission templates
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Provisioned Accounts
            </span>
            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-slate-900">
            {assignments.length} Logins
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Closed-door database credentials
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Separation of Duties
            </span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-emerald-600">
            Enforced
          </div>
          <p className="mt-2 text-[11px] font-medium text-emerald-600">
            Audit maker-checker rules active
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Credential Encryption
            </span>
            <Badge
              variant="outline"
              className="border-rose-200 bg-rose-50 text-[10px] font-bold text-rose-700"
            >
              Bcrypt (12)
            </Badge>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-slate-900">
            SHA-256 / JWT
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Zero plaintext password persistence
          </p>
        </Card>
      </div>

      {/* 3. Role Selector & Scope Matrix */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold tracking-wider text-slate-600 uppercase">
              Security Role Templates
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {roles.length} Available
            </span>
          </div>

          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = selectedRoleId === r.id
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRoleId(r.id)
                    setHasUnsavedChanges(false)
                  }}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-[#0090FF] bg-blue-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs leading-tight font-bold text-slate-900">
                        {r.name}
                      </h4>
                      <span className="mt-0.5 block font-mono text-[10px] text-[#0090FF]">
                        {r.code}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-white text-[10px] font-medium text-slate-600"
                    >
                      {r.userCount ?? 0} Users
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                    {r.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-none lg:col-span-8">
          {selectedRole ? (
            <div>
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Permission Matrix:{" "}
                      <span className="text-[#0090FF]">
                        {selectedRole.name}
                      </span>
                    </h3>
                    {selectedRole.isSystemDefault && (
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-slate-50 text-[10px] text-slate-600"
                      >
                        Protected Template
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Toggle functional read, create, write, and elevated actions
                    for this role tier.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {saveToast && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Saved to Database
                    </span>
                  )}
                  <Button
                    size="sm"
                    disabled={!hasUnsavedChanges || isSaving}
                    onClick={handleSaveRolePermissions}
                    className="h-8 gap-1.5 bg-[#0090FF] text-xs text-white shadow-none hover:bg-[#0080e5] disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {isSaving ? "Saving..." : "Save Permissions"}
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
                      <TableHead className="pl-0">Functional Module</TableHead>
                      <TableHead className="w-14 text-center">View</TableHead>
                      <TableHead className="w-14 text-center">Create</TableHead>
                      <TableHead className="w-14 text-center">Edit</TableHead>
                      <TableHead className="w-14 text-center">Delete</TableHead>
                      <TableHead className="pr-0">
                        Statutory Special Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedRole.permissions || []).map((perm) => (
                      <TableRow
                        key={perm.module}
                        className="border-b border-slate-50 hover:bg-slate-50/50"
                      >
                        <TableCell className="py-3 pl-0">
                          <div>
                            <span className="block text-xs font-bold text-slate-900">
                              {perm.module}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {perm.category} Scope
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(perm.read)}
                            onChange={() =>
                              handleTogglePermission(perm.module, "read")
                            }
                            className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-[#0090FF] focus:ring-0"
                          />
                        </TableCell>

                        <TableCell className="py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(perm.create)}
                            onChange={() =>
                              handleTogglePermission(perm.module, "create")
                            }
                            className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-[#0090FF] focus:ring-0"
                          />
                        </TableCell>

                        <TableCell className="py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(perm.edit)}
                            onChange={() =>
                              handleTogglePermission(perm.module, "edit")
                            }
                            className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-[#0090FF] focus:ring-0"
                          />
                        </TableCell>

                        <TableCell className="py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(perm.delete)}
                            onChange={() =>
                              handleTogglePermission(perm.module, "delete")
                            }
                            className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-[#0090FF] focus:ring-0"
                          />
                        </TableCell>

                        <TableCell className="py-3 pr-0">
                          {perm.specialAction ? (
                            <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1">
                              <span className="max-w-[210px] truncate text-[11px] font-medium text-slate-700">
                                {perm.specialAction}
                              </span>
                              <Switch
                                checked={Boolean(perm.specialGranted)}
                                onCheckedChange={() =>
                                  handleTogglePermission(
                                    perm.module,
                                    "specialGranted"
                                  )
                                }
                                className="scale-75"
                              />
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              No elevated privilege
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Loading permission matrix...
            </div>
          )}
        </Card>
      </div>

      {/* 4. Active Database Credential Roster */}
      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-none">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-900 uppercase">
              PROVISIONED DATABASE CREDENTIALS & OPERATOR LOGINS
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Secure logins stored in PostgreSQL mapping email usernames to role
              permission levels
            </p>
          </div>

          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search user, email, or role..."
              value={searchUserQuery}
              onChange={(e) => setSearchUserQuery(e.target.value)}
              className="h-8 w-[240px] border-slate-200 bg-slate-50/50 pl-8 text-xs"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0">Operator & Login Email</TableHead>
              <TableHead>Password Hash</TableHead>
              <TableHead>Assigned Role</TableHead>
              <TableHead>Territory Station</TableHead>
              <TableHead>Last Active Session</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="pr-0 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-xs text-slate-400"
                >
                  No provisioned users found. Click{" "}
                  <strong>"Provision Operator Account"</strong> to create
                  credentials.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50"
                >
                  <TableCell className="py-3 pl-0">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 rounded-full border border-slate-200">
                        <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                          {(user.name || "OP").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="block text-xs font-bold text-slate-900">
                          {user.name}
                        </span>
                        <span className="block font-mono text-[10px] text-[#0090FF]">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 font-mono text-xs text-slate-400">
                    {user.passwordHash}
                  </TableCell>

                  <TableCell className="py-3 text-xs font-semibold text-slate-800">
                    {user.roleName || user.roleCode}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-slate-600">
                    {user.territory}
                  </TableCell>

                  <TableCell className="py-3 font-mono text-xs text-slate-500">
                    {user.lastLogin || "Never"}
                  </TableCell>

                  <TableCell className="py-3 text-center text-xs">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        user.status === "Active"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3 pr-0 text-right text-xs">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleUserStatus(user.id)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600"
                        title={
                          user.status === "Active"
                            ? "Restrict Access"
                            : "Activate Access"
                        }
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDeleteModal(user.id, user.name)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                        title="Delete Operator Account"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Provision Operator Modal */}
      <Dialog open={isProvisionOpen} onOpenChange={setIsProvisionOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Database Credential Provisioning
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Closed Registration: Set up authorized login email, password, and
              assign security role.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleProvisionOperator}
            className="space-y-3.5 py-2 text-xs"
          >
            <div className="space-y-1">
              <Label className="font-semibold text-slate-700">
                Operator Full Name *
              </Label>
              <Input
                placeholder="e.g. Toshin Bin Azad"
                value={provName}
                onChange={(e) => setProvName(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">
                  Login Email (Username) *
                </Label>
                <Input
                  type="email"
                  placeholder="name@akpharma.com"
                  value={provEmail}
                  onChange={(e) => setProvEmail(e.target.value)}
                  required
                  className="h-8 font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">
                  Database Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={provPassword}
                    onChange={(e) => setProvPassword(e.target.value)}
                    required
                    className="h-8 pl-8 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">
                  Security Role *
                </Label>
                <Select value={provRoleCode} onValueChange={setProvRoleCode}>
                  <SelectTrigger className="h-8 bg-white text-xs">
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

              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">
                  Territory Station
                </Label>
                <Input
                  placeholder="e.g. Dhaka North Hub"
                  value={provTerritory}
                  onChange={(e) => setProvTerritory(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProvisionOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-8 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
              >
                Save to Database & Grant Access
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Global Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDeleteUser}
        title="Revoke Operator Credentials"
        description="Are you sure you want to permanently revoke database credentials for this operator account?"
        itemName={userToDelete ? userToDelete.name : undefined}
        confirmText="Revoke & Delete Account"
        cancelText="Cancel"
        isDeleting={isDeletingUser}
      />
    </div>
  )
}
