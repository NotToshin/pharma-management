"use client"

import PermissionGate from "@/components/permission-gate"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { API_URL, apiFetch } from "@/lib/api"
import { getStoredUser, isUserSuperAdmin, AuthUser } from "@/lib/auth"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"
import { ServerListPagination } from "@/components/server-list-controls"
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
  ShieldAlert,
  Users,
  Plus,
  Download,
  Search,
  CheckCircle2,
  Save,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Ban,
  UserCheck,
  Edit2,
  ArrowLeft,
  KeyRound,
  Check,
  X,
  AlertTriangle,
} from "lucide-react"

interface ModuleOverview {
  key: string
  label: string
}

interface RolePermission {
  module: string
  category: string
  read: boolean
  create: boolean
  edit: boolean
  delete: boolean
  specialAction?: string | null
  specialGranted: boolean
  actions?: Array<"read" | "create" | "edit" | "delete">
  overviews?: ModuleOverview[]
  overviewGrants?: Record<string, boolean>
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
  roleId?: string
  territory: string
  status: "Active" | "Restricted"
  lastLogin: string
}

/**
 * Formats user's last login timestamp strictly in (UTC+06:00) Dhaka timezone
 */
function formatLastActiveSession(raw?: string | null): string {
  if (!raw || raw.trim().toLowerCase().includes("never")) {
    return "Never logged in"
  }

  try {
    const parsed = new Date(raw)
    if (!isNaN(parsed.getTime())) {
      const formatted = parsed.toLocaleString("en-GB", {
        timeZone: "Asia/Dhaka",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      return formatted.replace(/am|pm/i, (m) => m.toUpperCase())
    }
  } catch {
    // Keep fallback
  }

  return raw
}

export default function RBACManagementPage() {
  const router = useRouter()

  // Authorization state
  const [currentUser, setCurrentUser] = React.useState<AuthUser | null>(null)
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null)

  // Core Data state
  const [roles, setRoles] = React.useState<SystemRole[]>([])
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>("")
  const [assignments, setAssignments] = React.useState<UserAssignment[]>([])
  const [loading, setLoading] = React.useState(true)

  // Filtering states
  const [searchUserQuery, setSearchUserQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [matrixCategoryFilter, setMatrixCategoryFilter] = React.useState<string>("ALL")

  // Server-side Pagination & Stats for Provisioned Users
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [usersPage, setUsersPage] = React.useState(1)
  const [usersLimit, setUsersLimit] = React.useState(10)
  const [usersTotal, setUsersTotal] = React.useState(0)
  const [usersTotalPages, setUsersTotalPages] = React.useState(1)
  const [totalActiveCount, setTotalActiveCount] = React.useState(0)
  const [totalRestrictedCount, setTotalRestrictedCount] = React.useState(0)
  const [isUsersLoading, setIsUsersLoading] = React.useState(false)

  // Matrix edit tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Modals state
  const [isProvisionOpen, setIsProvisionOpen] = React.useState(false)
  const [isSubmittingProvision, setIsSubmittingProvision] = React.useState(false)
  const [provName, setProvName] = React.useState("")
  const [provEmail, setProvEmail] = React.useState("")
  const [provPassword, setProvPassword] = React.useState("")
  const [provRoleCode, setProvRoleCode] = React.useState("MIO_FIELD")
  const [provTerritory, setProvTerritory] = React.useState("Dhaka North Hub")
  const [showProvPassword, setShowProvPassword] = React.useState(false)

  // Edit / Reassign User Modal state
  const [isEditUserOpen, setIsEditUserOpen] = React.useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = React.useState(false)
  const [editingUserId, setEditingUserId] = React.useState("")
  const [editName, setEditName] = React.useState("")
  const [editEmail, setEditEmail] = React.useState("")
  const [editRoleCode, setEditRoleCode] = React.useState("")
  const [editTerritory, setEditTerritory] = React.useState("")
  const [editPassword, setEditPassword] = React.useState("")
  const [showEditPassword, setShowEditPassword] = React.useState(false)

  // Global Delete Modal state
  const [userToDelete, setUserToDelete] = React.useState<{ id: string; name: string } | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [isDeletingUser, setIsDeletingUser] = React.useState(false)

  // 1. Check user authorization on client mount
  React.useEffect(() => {
    const user = getStoredUser()
    setCurrentUser(user)
    if (!user) {
      setIsAuthorized(false)
    } else {
      const isSuper = isUserSuperAdmin(user)
      const rbacPerm = user.permissions?.find(
        (p: any) =>
          (p.module || "").toLowerCase().includes("role permission") ||
          (p.module || "").toLowerCase().includes("rbac")
      )
      const hasPerm = Boolean(rbacPerm && (rbacPerm.read || rbacPerm.create || rbacPerm.edit))
      setIsAuthorized(isSuper || hasPerm)
    }
  }, [])

  // Debounce search query to trigger backend filtering
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchUserQuery)
      setUsersPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchUserQuery])

  // 2. Data Fetching via apiFetch with unwrap
  const fetchRoles = React.useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/rbac/roles`)
      if (res && res.ok) {
        const raw = await res.json()
        const rolesData: SystemRole[] = Array.isArray(raw) ? raw : raw?.data || []
        if (Array.isArray(rolesData) && rolesData.length > 0) {
          setRoles(rolesData)
          setSelectedRoleId((curr) => {
            if (curr && rolesData.some((r) => r.id === curr)) return curr
            return rolesData[0].id
          })
        }
      } else if (res && res.status === 403) {
        setIsAuthorized(false)
      }
    } catch (err) {
      console.error("Error loading roles:", err)
    }
  }, [])

  const fetchUsers = React.useCallback(
    async (targetPage = usersPage, targetLimit = usersLimit) => {
      try {
        setIsUsersLoading(true)
        const params = new URLSearchParams()
        params.set("page", String(targetPage))
        params.set("limit", String(targetLimit))

        if (debouncedSearch.trim()) {
          params.set("searchTerm", debouncedSearch.trim())
        }
        if (roleFilter !== "ALL") {
          params.set("role", roleFilter)
        }
        if (statusFilter !== "ALL") {
          params.set("status", statusFilter)
        }

        const res = await apiFetch(`${API_URL}/rbac/users?${params.toString()}`)
        if (res && res.ok) {
          const json = await res.json()
          const usersData: UserAssignment[] = Array.isArray(json)
            ? json
            : json?.data || []
          setAssignments(usersData)

          const meta = json?.meta || {}
          const total = meta.total !== undefined ? meta.total : usersData.length
          setUsersTotal(total)
          setUsersTotalPages(
            meta.totalPage ||
              (targetLimit > 0 ? Math.max(1, Math.ceil(total / targetLimit)) : 1) ||
              1
          )

          if (meta.totalActive !== undefined) {
            setTotalActiveCount(meta.totalActive)
          } else {
            setTotalActiveCount(usersData.filter((u) => u.status === "Active").length)
          }

          if (meta.totalRestricted !== undefined) {
            setTotalRestrictedCount(meta.totalRestricted)
          } else {
            setTotalRestrictedCount(usersData.filter((u) => u.status === "Restricted").length)
          }
        }
      } catch (err) {
        console.error("Error loading provisioned users:", err)
      } finally {
        setIsUsersLoading(false)
      }
    },
    [usersPage, usersLimit, debouncedSearch, roleFilter, statusFilter]
  )

  const fetchRBACData = React.useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setLoading(true)
        await Promise.all([
          fetchRoles(),
          fetchUsers(usersPage, usersLimit),
        ])
      } finally {
        setLoading(false)
      }
    },
    [fetchRoles, fetchUsers, usersPage, usersLimit]
  )

  React.useEffect(() => {
    if (isAuthorized) {
      fetchRoles()
    } else if (isAuthorized === false) {
      setLoading(false)
    }
  }, [isAuthorized, fetchRoles])

  React.useEffect(() => {
    if (isAuthorized) {
      fetchUsers(usersPage, usersLimit)
    }
  }, [isAuthorized, fetchUsers, debouncedSearch, roleFilter, statusFilter, usersPage, usersLimit])

  const selectedRole = React.useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0] || null
  }, [roles, selectedRoleId])

  const matrixCategories = React.useMemo(() => {
    if (!selectedRole?.permissions) return []
    const set = new Set<string>()
    selectedRole.permissions.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set)
  }, [selectedRole])

  const visiblePermissions = React.useMemo(() => {
    if (!selectedRole || !selectedRole.permissions) return []
    if (matrixCategoryFilter === "ALL") return selectedRole.permissions
    return selectedRole.permissions.filter(
      (p) => p.category?.toLowerCase() === matrixCategoryFilter.toLowerCase()
    )
  }, [selectedRole, matrixCategoryFilter])

  // 3. Matrix Permission Handlers
  const allowsAction = (
    perm: RolePermission,
    action: "read" | "create" | "edit" | "delete"
  ) => {
    const actions = perm.actions ?? ["read", "create", "edit", "delete"]
    return actions.includes(action)
  }

  const moduleOverviewAllowed = (perm: RolePermission) => {
    const overviews = perm.overviews || []
    if (overviews.length === 0) return false
    return overviews.every((view) => Boolean(perm.overviewGrants?.[view.key]))
  }

  const handleToggleModuleOverview = (moduleName: string) => {
    if (!selectedRole) return
    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id !== selectedRole.id) return role
        return {
          ...role,
          permissions: (role.permissions || []).map((perm) => {
            if (perm.module !== moduleName) return perm
            const granted = !moduleOverviewAllowed(perm)
            const overviewGrants = Object.fromEntries(
              (perm.overviews || []).map((view) => [view.key, granted])
            )
            const actions = perm.actions ?? ["read", "create", "edit", "delete"]
            const read = actions.length === 0 ? granted : perm.read
            return { ...perm, overviewGrants, read }
          }),
        }
      })
    )
    setHasUnsavedChanges(true)
  }

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

  const handleGrantAll = () => {
    if (!selectedRole) return
    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id === selectedRole.id) {
          return {
            ...role,
            permissions: (role.permissions || []).map((p) => {
              const actions = p.actions ?? ["read", "create", "edit", "delete"]
              const overviewGrants = Object.fromEntries(
                (p.overviews || []).map((view) => [view.key, true])
              )
              return {
                ...p,
                read: actions.includes("read") || actions.length === 0,
                create: actions.includes("create"),
                edit: actions.includes("edit"),
                delete: actions.includes("delete"),
                specialGranted: Boolean(p.specialAction),
                overviewGrants,
              }
            }),
          }
        }
        return role
      })
    )
    setHasUnsavedChanges(true)
    toast.info("Granted all permissions for this role tier. Click 'Save Permissions' to persist.")
  }

  const handleRevokeAll = () => {
    if (!selectedRole) return
    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id === selectedRole.id) {
          return {
            ...role,
            permissions: (role.permissions || []).map((p) => ({
              ...p,
              read: true, // Keep read so operator can see system shell
              create: false,
              edit: false,
              delete: false,
              specialGranted: false,
            })),
          }
        }
        return role
      })
    )
    setHasUnsavedChanges(true)
    toast.warning("Revoked all write permissions. Click 'Save Permissions' to persist.")
  }

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return
    const toastId = toast.loading(`Saving permission matrix for "${selectedRole.name}"...`)
    try {
      setIsSaving(true)
      const res = await apiFetch(
        `${API_URL}/rbac/roles/${selectedRole.id}/permissions`,
        {
          method: "PUT",
          body: JSON.stringify({ permissions: selectedRole.permissions }),
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to persist permissions")
      }

      setHasUnsavedChanges(false)
      const stored = getStoredUser()
      const sameRole = Boolean(
        stored &&
          (stored.role === selectedRole.code ||
            stored.roleName === selectedRole.name ||
            (stored as { roleCode?: string }).roleCode === selectedRole.code)
      )
      if (sameRole && stored) {
        const nextUser = { ...stored, permissions: selectedRole.permissions }
        localStorage.setItem("user", JSON.stringify(nextUser))
        localStorage.setItem("ak_user", JSON.stringify(nextUser))
        window.dispatchEvent(new Event("ak-permissions-updated"))
      }
      toast.success(`Permission matrix for "${selectedRole.name}" persisted to database.`, {
        id: toastId,
      })
    } catch (error: any) {
      console.error("Save permissions error:", error)
      toast.error(error.message || "Failed to save permission matrix to database.", {
        id: toastId,
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 4. Provision Operator Account
  const handleProvisionOperator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!provEmail || !provPassword || !provName) {
      toast.error("Please fill in operator name, email, and password.")
      return
    }

    if (provPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.")
      return
    }

    const toastId = toast.loading(`Provisioning operator credentials for ${provEmail}...`)
    try {
      setIsSubmittingProvision(true)
      const res = await apiFetch(`${API_URL}/rbac/users`, {
        method: "POST",
        body: JSON.stringify({
          name: provName.trim(),
          email: provEmail.trim(),
          password: provPassword,
          roleCode: provRoleCode,
          territory: provTerritory.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || "Provisioning failed")
      }

      toast.success(`Operator "${provName}" provisioned successfully with role ${provRoleCode}.`, {
        id: toastId,
      })

      setProvName("")
      setProvEmail("")
      setProvPassword("")
      setShowProvPassword(false)
      setIsProvisionOpen(false)
      fetchUsers(usersPage, usersLimit)
    } catch (err: any) {
      toast.error(err.message || "Failed to provision user in database.", { id: toastId })
    } finally {
      setIsSubmittingProvision(false)
    }
  }

  // 5. Edit Operator & Reassign Role
  const handleOpenEditUser = (user: UserAssignment) => {
    const isTargetSuperAdminRole =
      user.roleCode === "SUPER_ADMIN" || user.roleCode === "SUPERADMIN"
    const isCurrentSuper = isUserSuperAdmin(currentUser)
    if (isTargetSuperAdminRole && !isCurrentSuper) {
      toast.error("Super Administrator credentials can only be modified by a Super Administrator.")
      return
    }
    setEditingUserId(user.id)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditRoleCode(user.roleCode)
    setEditTerritory(user.territory)
    setEditPassword("")
    setIsEditUserOpen(true)
  }

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUserId) return

    if (editPassword.trim() && editPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters long.")
      return
    }

    const toastId = toast.loading(`Updating operator credentials for "${editName}"...`)
    try {
      setIsSubmittingEdit(true)
      const payload: any = {
        name: editName,
        roleCode: editRoleCode,
        territory: editTerritory,
      }
      if (editPassword.trim()) {
        payload.password = editPassword.trim()
      }

      const res = await apiFetch(`${API_URL}/rbac/users/${editingUserId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || "Update failed")
      }

      toast.success(`Operator credentials & role updated for "${editName}".`, { id: toastId })
      setIsEditUserOpen(false)

      // If updating current logged in user, keep stored session in sync
      if (currentUser && editingUserId === currentUser.id) {
        const updatedUser = { ...currentUser, name: editName, territory: editTerritory }
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(updatedUser))
          localStorage.setItem("ak_user", JSON.stringify(updatedUser))
        }
        setCurrentUser(updatedUser)
      }

      fetchUsers(usersPage, usersLimit)
    } catch (err: any) {
      toast.error(err.message || "Could not update operator credentials.", { id: toastId })
    } finally {
      setIsSubmittingEdit(false)
    }
  }



  // 7. Toggle Account Status
  const handleToggleUserStatus = async (user: UserAssignment) => {
    const isSuperAdminRole =
      user.roleCode === "SUPER_ADMIN" || user.roleCode === "SUPERADMIN"
    if (isSuperAdminRole) {
      toast.error("Super Administrator account status cannot be altered.")
      return
    }

    const nextStatus = user.status === "Active" ? "Restricted" : "Active"
    const toastId = toast.loading(`Updating status for ${user.name} to ${nextStatus}...`)
    try {
      const res = await apiFetch(`${API_URL}/rbac/users/${user.id}/status`, {
        method: "PUT",
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to update status")
      }

      toast.success(`Operator ${user.name} is now ${nextStatus}.`, { id: toastId })
      fetchUsers(usersPage, usersLimit)
      setAssignments((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, status: nextStatus }
            : u
        )
      )
    } catch (error: any) {
      toast.error(error.message || "Could not update account status.", { id: toastId })
    }
  }

  // 8. Delete / Revoke Operator Account
  const handleOpenDeleteModal = (userId: string, name: string) => {
    const targetUser = assignments.find((u) => u.id === userId)
    if (
      targetUser &&
      (targetUser.roleCode === "SUPER_ADMIN" || targetUser.roleCode === "SUPERADMIN")
    ) {
      toast.error("Super Administrator account cannot be revoked or deleted.")
      return
    }
    setUserToDelete({ id: userId, name })
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return
    const toastId = toast.loading(`Revoking credentials for "${userToDelete.name}"...`)
    try {
      setIsDeletingUser(true)
      const res = await apiFetch(`${API_URL}/rbac/users/${userToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to delete user account")
      }

      toast.success(`Operator credentials for "${userToDelete.name}" permanently revoked.`, {
        id: toastId,
      })
      setAssignments((prev) => prev.filter((u) => u.id !== userToDelete.id))
      setIsDeleteModalOpen(false)
      setUserToDelete(null)
      fetchUsers(usersPage, usersLimit)
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast.error(error.message || "Could not revoke user account.", { id: toastId })
    } finally {
      setIsDeletingUser(false)
    }
  }

  // 9. Export Audit Ledger
  const handleExportAudit = async () => {
    const toastId = toast.loading("Preparing security audit ledger export...")
    try {
      const params = new URLSearchParams()
      params.set("limit", "0")
      if (debouncedSearch.trim()) params.set("searchTerm", debouncedSearch.trim())
      if (roleFilter !== "ALL") params.set("role", roleFilter)
      if (statusFilter !== "ALL") params.set("status", statusFilter)

      const res = await apiFetch(`${API_URL}/rbac/users?${params.toString()}`)
      const json = await res.json()
      const dataToExport: UserAssignment[] = Array.isArray(json?.data) ? json.data : assignments

      const data = dataToExport.map((u) => ({
        "Operator Name": u.name,
        "Database Email": u.email,
        "Role Code": u.roleCode,
        "Assigned Role": u.roleName,
        "Territory Station": u.territory,
        "Account Status": u.status,
        "Last Active Session (UTC+06:00 Dhaka)": formatLastActiveSession(u.lastLogin),
      }))

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "RBAC Security Audit")
      XLSX.writeFile(
        workbook,
        `AK_Pharma_RBAC_Audit_${new Date().toISOString().slice(0, 10)}.xlsx`
      )
      toast.success("Security audit ledger exported successfully.", { id: toastId })
    } catch (err: any) {
      console.error("Export audit error:", err)
      toast.error(err.message || "Failed to export audit ledger.", { id: toastId })
    }
  }

  const filteredUsers = assignments

  // Get color for role badges
  const getRoleBadgeStyle = (code: string) => {
    const normalized = (code || "").toUpperCase()
    if (normalized.includes("SUPER_ADMIN") || normalized.includes("SUPERADMIN")) {
      return "border-purple-200 bg-purple-50 text-purple-700"
    }
    if (normalized.includes("RSM")) {
      return "border-blue-200 bg-blue-50 text-blue-700"
    }
    if (normalized.includes("MIO")) {
      return "border-amber-200 bg-amber-50 text-amber-700"
    }
    if (normalized.includes("FIN")) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    }
    if (normalized.includes("WH")) {
      return "border-cyan-200 bg-cyan-50 text-cyan-700"
    }
    return "border-slate-200 bg-slate-100 text-slate-700"
  }

  // RENDER ACCESS RESTRICTED SCREEN IF NOT SUPER ADMIN
  if (isAuthorized === false) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-[700px] flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 p-8 shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 ring-8 ring-rose-50">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <Badge
            variant="outline"
            className="mt-6 border-rose-300 bg-white px-3 py-1 text-xs font-bold text-rose-700 uppercase"
          >
            Access Denied • 403 Forbidden
          </Badge>

          <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
            Super Administrator Authorization Required
          </h2>

          <p className="mt-3 text-xs leading-relaxed text-slate-600">
            The <strong>Role-Based Access Control (RBAC)</strong> and Security Matrix is
            strictly reserved for accounts with the <strong>SUPER_ADMIN</strong> credential tier.
            Your current logged-in account does not possess master clearance to view or alter
            statutory operational scopes or user role delegations.
          </p>

          {currentUser && (
            <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-rose-200/80 bg-white px-4 py-2.5 text-left text-xs shadow-2xs">
              <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                <AvatarFallback className="bg-slate-900 text-xs font-bold text-white">
                  {(currentUser.name || "US").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="block font-bold text-slate-900">{currentUser.name}</span>
                <span className="block font-mono text-[11px] text-slate-500">
                  {currentUser.email} • Tier:{" "}
                  <strong className="text-rose-600">
                    {currentUser.role || currentUser.roleName || "Standard Staff"}
                  </strong>
                </span>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="h-9 gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to Executive Dashboard
              </Link>
            </Button>

            <Button
              variant="outline"
              asChild
              className="h-9 gap-2 rounded-lg border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Link href="/login">
                <KeyRound className="h-3.5 w-3.5 text-blue-600" />
                Switch Operator Login
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 pb-12 font-sans text-slate-900">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              SECURITY & ACCESS CONTROL MATRIX • SUPER ADMIN PROTECTED
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Role Permissions (RBAC) & Credential Management
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Full governance suite: Configure role permission matrices, provision closed-door
            operator logins, and reassign user functional scopes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchRBACData(true)}
            disabled={loading}
            className="h-9 gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-none hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
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

          <PermissionGate feature="Role Permissions (RBAC)" action="create">
<Button
              size="sm"
              onClick={() => setIsProvisionOpen(true)}
              className="h-9 gap-1.5 rounded-lg bg-[#0090FF] px-4 text-xs font-semibold text-white shadow-none hover:bg-[#0080e5]"
            >
              <Plus className="h-4 w-4" />
              Provision Operator Account
            </Button>
</PermissionGate>
        </div>
      </div>

      {/* 2. Top Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
<PermissionGate feature="Role Permissions (RBAC)" action="overview:roleClasses">
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
            Database permission tiers with statutory limits
          </p>
        </Card>
</PermissionGate>

<PermissionGate feature="Role Permissions (RBAC)" action="overview:accounts">
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
            {assignments.filter((a) => a.status === "Active").length} active •{" "}
            {assignments.filter((a) => a.status === "Restricted").length} restricted
          </p>
        </Card>
</PermissionGate>

<PermissionGate feature="Role Permissions (RBAC)" action="overview:clearance">
<Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Master Clearance
            </span>
            <div className="rounded-lg bg-purple-50 p-1.5 text-purple-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-purple-700">
            SUPER_ADMIN
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            Elevated maker-checker bypass authorized
          </p>
        </Card>
</PermissionGate>

<PermissionGate feature="Role Permissions (RBAC)" action="overview:credentialSecurity">
<Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Credential Security
            </span>
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-700"
            >
              Bcrypt (12 Rounds)
            </Badge>
          </div>
          <div className="mt-3 font-mono text-[28px] leading-none font-extrabold tracking-tight text-slate-900">
            JWT / HttpOnly
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            21 CFR Part 11 compliant tamper logging
          </p>
        </Card>
</PermissionGate>
      </div>

      {/* 3. Role Selector & Scope Matrix */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold tracking-wider text-slate-600 uppercase">
              Security Role Templates
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {roles.length} Configured
            </span>
          </div>

          <div className="max-h-[850px] space-y-2 overflow-y-auto pr-1">
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
                      ? "border-[#0090FF] bg-blue-50/50 shadow-xs ring-1 ring-[#0090FF]/30"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
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
                      <span className="text-[#0090FF]">{selectedRole.name}</span>
                    </h3>
                    {selectedRole.isSystemDefault ? (
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-slate-50 text-[10px] text-slate-600"
                      >
                        System Default
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-blue-200 bg-blue-50 text-[10px] text-blue-700"
                      >
                        Custom Role Tier
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Fine-grained functional access controls across core pharmaceutical modules.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <PermissionGate feature="Role Permissions (RBAC)" action="special">
<Button
                      size="sm"
                      variant="outline"
                      onClick={handleGrantAll}
                      className="h-8 gap-1 rounded-md border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Check className="h-3 w-3 text-emerald-600" />
                      Grant All
                    </Button>
</PermissionGate>

                  <PermissionGate feature="Role Permissions (RBAC)" action="special">
<Button
                      size="sm"
                      variant="outline"
                      onClick={handleRevokeAll}
                      className="h-8 gap-1 rounded-md border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <X className="h-3 w-3 text-rose-600" />
                      Clear Write
                    </Button>
</PermissionGate>

                  <PermissionGate feature="Role Permissions (RBAC)" action="special">
<Button
                      size="sm"
                      disabled={!hasUnsavedChanges || isSaving}
                      onClick={handleSaveRolePermissions}
                      className="h-8 gap-1.5 rounded-md bg-[#0090FF] text-xs font-semibold text-white shadow-none hover:bg-[#0080e5] disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {isSaving ? "Saving..." : "Save Permissions"}
                    </Button>
</PermissionGate>
                </div>
              </div>

              {hasUnsavedChanges && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Unsaved permission matrix modifications detected.</span>
                  </div>
                  <span className="text-[11px] text-amber-700">Remember to save changes</span>
                </div>
              )}

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 py-3">
                <button
                  type="button"
                  onClick={() => setMatrixCategoryFilter("ALL")}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    matrixCategoryFilter === "ALL"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Modules ({(selectedRole.permissions || []).length})
                </button>
                {matrixCategories.map((cat) => {
                  const count = (selectedRole.permissions || []).filter((p) => p.category === cat).length
                  const isCatSelected = matrixCategoryFilter === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMatrixCategoryFilter(cat)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        isCatSelected
                          ? "bg-[#0090FF] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  )
                })}
              </div>

              <div className="max-h-[620px] overflow-y-auto pt-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
                      <TableHead className="pl-0">Functional Module</TableHead>
                      <TableHead className="w-14 text-center">View</TableHead>
                      <TableHead className="w-14 text-center">Create</TableHead>
                      <TableHead className="w-14 text-center">Edit</TableHead>
                      <TableHead className="w-14 text-center">Delete</TableHead>
                      <TableHead className="pr-0">Analytics View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(visiblePermissions || []).map((perm) => (
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

                        {(["read", "create", "edit", "delete"] as const).map((action) => (
                          <TableCell key={action} className="py-3 text-center">
                            {allowsAction(perm, action) ? (
                              <input
                                type="checkbox"
                                checked={Boolean(perm[action])}
                                onChange={() => handleTogglePermission(perm.module, action)}
                                className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-[#0090FF] focus:ring-0"
                              />
                            ) : (
                              <span className="text-[10px] text-slate-300">—</span>
                            )}
                          </TableCell>
                        ))}

                        <TableCell className="py-3 pr-0">
                          <div className="flex min-w-[220px] flex-col gap-1.5">
                            {(perm.overviews || []).length > 0 ? (
                              <div className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1">
                                <span className="text-[11px] font-medium text-slate-700">
                                  Page Overview
                                </span>
                                <Switch
                                  checked={moduleOverviewAllowed(perm)}
                                  onCheckedChange={() => handleToggleModuleOverview(perm.module)}
                                  className="scale-75"
                                />
                              </div>
                            ) : null}
                            {perm.specialAction ? (
                              <div className="flex items-center justify-between gap-2 rounded-md border border-amber-100 bg-amber-50/70 px-2.5 py-1">
                                <span className="text-[11px] font-medium text-slate-700">
                                  {perm.specialAction}
                                </span>
                                <Switch
                                  checked={Boolean(perm.specialGranted)}
                                  onCheckedChange={() =>
                                    handleTogglePermission(perm.module, "specialGranted")
                                  }
                                  className="scale-75"
                                />
                              </div>
                            ) : null}
                            {!perm.specialAction && (perm.overviews || []).length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">
                                Standard role tier
                              </span>
                            ) : null}
                          </div>
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
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                PROVISIONED DATABASE CREDENTIALS & OPERATOR DELEGATIONS
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold text-slate-600">
                {usersTotal} {usersTotal === 1 ? "Operator" : "Operators"}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Closed-access directory: Super admin can reassign roles, update territory stations,
              and manage operator credentials.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search operator, email, role..."
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                className="h-8 w-[220px] border-slate-200 bg-slate-50/50 pl-8 pr-7 text-xs"
              />
              {isUsersLoading && (
                <RefreshCw className="absolute top-2.5 right-2.5 h-3 w-3 animate-spin text-slate-400" />
              )}
            </div>

            {/* Role Filter */}
            <Select
              value={roleFilter}
              onValueChange={(val) => {
                setRoleFilter(val)
                setUsersPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[140px] bg-white text-xs">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="ALL">All Roles</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.code}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val)
                setUsersPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[120px] bg-white text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="Active">Active Only</SelectItem>
                <SelectItem value="Restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>


          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 text-xs text-slate-600 hover:bg-transparent">
              <TableHead className="pl-0">Operator & Login Email</TableHead>
              <TableHead>Assigned Security Role</TableHead>
              <TableHead>Territory Station</TableHead>
              <TableHead>
                <div className="flex items-center gap-1.5">
                  <span>Last Active Session</span>
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-50 px-1.5 py-0 font-mono text-[9px] font-normal text-slate-500"
                  >
                    UTC+06:00 Dhaka
                  </Badge>
                </div>
              </TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="pr-0 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isUsersLoading && assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-xs text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                    <span>Loading provisioned credentials...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-xs text-slate-400">
                  No provisioned users found matching current filters. Click{" "}
                  <strong>"Provision Operator Account"</strong> to create credentials.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const isUserSuperAdminRole =
                  user.roleCode === "SUPER_ADMIN" || user.roleCode === "SUPERADMIN"
                const isCurrentSuper = isUserSuperAdmin(currentUser)
                const canEditOperator = !isUserSuperAdminRole || isCurrentSuper
                return (
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
                          <div className="flex items-center gap-1.5">
                            <span className="block text-xs font-bold text-slate-900">
                              {user.name}
                            </span>
                            {isUserSuperAdminRole && (
                              <Badge
                                variant="outline"
                                className="border-purple-200 bg-purple-50 px-1.5 py-0 text-[9px] font-bold text-purple-700"
                              >
                                Master Admin
                              </Badge>
                            )}
                          </div>
                          <span className="block font-mono text-[10px] text-[#0090FF]">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${getRoleBadgeStyle(user.roleCode)}`}
                      >
                        {user.roleName || user.roleCode}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 text-xs text-slate-600">
                      {user.territory}
                    </TableCell>

                    <TableCell className="py-3 font-mono text-xs text-slate-600">
                      {formatLastActiveSession(user.lastLogin)}
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
                        {/* Edit & Reassign Role Button */}
                        <PermissionGate feature="Role Permissions (RBAC)" action="edit">
<Button
                            size="sm"
                            variant="ghost"
                            disabled={!canEditOperator}
                            onClick={() => canEditOperator && handleOpenEditUser(user)}
                            className="h-7 w-7 p-0 text-slate-500 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                            title={
                              !canEditOperator
                                ? "Super Administrator credentials can only be edited by a Super Administrator"
                                : "Edit Operator Credentials & Role"
                            }
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
</PermissionGate>

                        {/* Toggle Account Status */}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isUserSuperAdminRole}
                          onClick={() => !isUserSuperAdminRole && handleToggleUserStatus(user)}
                          className="h-7 w-7 p-0 text-slate-400 hover:bg-slate-100 hover:text-amber-600 disabled:opacity-30 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                          title={
                            isUserSuperAdminRole
                              ? "Super Administrator account status is permanent and cannot be restricted"
                              : user.status === "Active"
                              ? "Restrict Access"
                              : "Activate Access"
                          }
                        >
                          {user.status === "Active" ? (
                            <Ban className="h-3.5 w-3.5" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                        </Button>

                        {/* Delete / Revoke Account */}
                        <PermissionGate feature="Role Permissions (RBAC)" action="delete">
<Button
                            size="sm"
                            variant="ghost"
                            disabled={isUserSuperAdminRole}
                            onClick={() => !isUserSuperAdminRole && handleOpenDeleteModal(user.id, user.name)}
                            className="h-7 w-7 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                            title={
                              isUserSuperAdminRole
                                ? "Super Administrator credentials cannot be deleted or revoked"
                                : "Revoke Database Account"
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
</PermissionGate>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        <ServerListPagination
          page={usersPage}
          totalPages={usersTotalPages}
          total={usersTotal}
          limit={usersLimit}
          loading={isUsersLoading}
          onPageChange={setUsersPage}
          onLimitChange={(nextLimit) => {
            setUsersLimit(nextLimit)
            setUsersPage(1)
          }}
        />
      </Card>

      {/* 5. Provision Operator Modal */}
      <Dialog open={isProvisionOpen} onOpenChange={setIsProvisionOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Database Credential Provisioning
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Closed Registration: Set up authorized login email, database password, and assign
              security role privileges.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProvisionOperator} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="font-semibold text-slate-700">Operator Full Name *</Label>
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
                <Label className="font-semibold text-slate-700">Login Email (Username) *</Label>
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
                <Label className="font-semibold text-slate-700">Database Password *</Label>
                <div className="relative">
                  <Lock className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type={showProvPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={provPassword}
                    onChange={(e) => setProvPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-8 pl-8 pr-8 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowProvPassword(!showProvPassword)}
                    className="absolute top-2 right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                    tabIndex={-1}
                    aria-label={showProvPassword ? "Hide password" : "Show password"}
                  >
                    {showProvPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Assign Security Role *</Label>
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
                <Label className="font-semibold text-slate-700">Territory Station</Label>
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
                disabled={isSubmittingProvision}
                className="h-8 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
              >
                {isSubmittingProvision ? "Provisioning..." : "Save to Database & Grant Access"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Edit Operator & Reassign Role Modal */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="rounded-xl bg-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Operator & Reassign Role
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Super Admin Control: Modify operator identity details, reassign their operational
              security role, or reset password credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditUser} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="font-semibold text-slate-700">Operator Full Name *</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-slate-700">Login Email</Label>
                  <span className="text-[10px] font-medium text-slate-400">Cannot be edited</span>
                </div>
                <Input
                  type="email"
                  value={editEmail}
                  disabled
                  readOnly
                  tabIndex={-1}
                  className="h-8 font-mono text-xs bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 select-none focus-visible:ring-0"
                  title="Operator email address cannot be edited"
                />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold text-slate-700">Territory Station</Label>
                <Input
                  value={editTerritory}
                  onChange={(e) => setEditTerritory(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-slate-700">
                Reassign Security Role Tier *
              </Label>
              <Select value={editRoleCode} onValueChange={setEditRoleCode}>
                <SelectTrigger className="h-8 bg-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.code}>
                      {r.name} ({r.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-400">
                Reassigning role immediately updates functional privileges and module visibility.
              </p>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-slate-700">
                Reset Password <span className="font-normal text-slate-400">(Optional)</span>
              </Label>
              <div className="relative">
                <Lock className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type={showEditPassword ? "text" : "password"}
                  placeholder="Leave blank to keep existing password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  minLength={6}
                  className="h-8 pl-8 pr-8 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute top-2 right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  tabIndex={-1}
                  aria-label={showEditPassword ? "Hide password" : "Show password"}
                >
                  {showEditPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Minimum 6 characters. Leave blank if password remains unchanged.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditUserOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingEdit}
                className="h-8 bg-[#0090FF] text-xs font-semibold text-white hover:bg-[#0080e5]"
              >
                {isSubmittingEdit ? "Updating..." : "Save Operator Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 8. Global Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDeleteUser}
        title="Revoke Operator Credentials"
        description="Are you sure you want to permanently revoke database credentials for this operator account? The user will immediately be barred from logging into the AK Pharma system."
        itemName={userToDelete ? userToDelete.name : undefined}
        confirmText="Revoke & Delete Account"
        cancelText="Cancel"
        isDeleting={isDeletingUser}
      />
    </div>
  )
}
