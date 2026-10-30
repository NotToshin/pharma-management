import { AuthUser, isUserSuperAdmin } from "./auth"

export type PermissionAction = "view" | "create" | "edit" | "delete" | "special"

const ACTION_FIELD: Record<string, string> = {
  view: "read",
  read: "read",
  create: "create",
  edit: "edit",
  update: "edit",
  delete: "delete",
  special: "specialGranted",
  specialgranted: "specialGranted",
}

/** Canonical matrix modules, longest route first when resolved. */
export const ROUTE_FEATURES: { prefix: string; feature: string }[] = [
  { prefix: "/settings/audit-logs", feature: "Audit Logs (21 CFR Compliant)" },
  { prefix: "/settings/rbac", feature: "Role Permissions (RBAC)" },
  { prefix: "/analytics/territories", feature: "Territory Sales Breakdown" },
  { prefix: "/analytics/targets", feature: "Target Vs Achievement" },
  { prefix: "/field-force/visit-logs", feature: "Doctor Visit Logs" },
  { prefix: "/field-force/zones", feature: "MIO Zone Allocation" },
  { prefix: "/doctors/database", feature: "Doctors List" },
  { prefix: "/inventory/adjustments", feature: "Stock Adjustments" },
  { prefix: "/inventory/ledger", feature: "Stock Inventory" },
  { prefix: "/procurement/orders", feature: "Wholesale Purchase Orders" },
  { prefix: "/logistics/orders", feature: "Sales Orders" },
  { prefix: "/sales/clients", feature: "Pharmacy Clients" },
  { prefix: "/finance/supplier-payments", feature: "Supplier Payments" },
  { prefix: "/finance/collections", feature: "Delivery Cash Collections" },
  { prefix: "/finance/bank-ledger", feature: "Bank Accounts Ledger" },
  { prefix: "/finance/payments", feature: "Payments" },
  { prefix: "/finance/overview", feature: "Treasury Overview" },
  { prefix: "/hr/staff-directory", feature: "Staff Directory & Roles" },
  { prefix: "/hr/salary", feature: "Salary" },
  { prefix: "/dashboard", feature: "Dashboard" },
]

const LEGACY_ALIASES: Record<string, string[]> = {
  dashboard: ["executive dashboard"],
  "target vs achievement": ["target vs achievement"],
  "mio zone allocation": ["mio zone allocations"],
  "doctors list": ["master doctor database"],
  "stock inventory": ["active inventory ledger fefo", "active inventory ledger"],
  "wholesale purchase orders": ["wholesaler purchase orders"],
  "sales orders": ["delivery logistics orders"],
  "treasury overview": ["treasury finance overview"],
  payments: ["expense vendor payments"],
  salary: ["payroll salary"],
  "audit logs 21 cfr compliant": ["audit logs 21 cfr part 11"],
}

export function normalizeModuleName(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

export function featureForPath(pathname: string): string | null {
  const match = ROUTE_FEATURES.find(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)
  )
  return match?.feature ?? null
}

function permissionMatches(moduleName: string, feature: string): boolean {
  const moduleKey = normalizeModuleName(moduleName)
  const featureKey = normalizeModuleName(feature)
  if (!moduleKey || !featureKey) return false
  if (moduleKey === featureKey) return true
  const aliases = LEGACY_ALIASES[featureKey] || []
  return aliases.some((alias) => normalizeModuleName(alias) === moduleKey)
}

/**
 * Role matrix check.
 * Super administrators always pass.
 * A session with no stored matrix stays usable.
 * Once a matrix exists, View / Create / Edit / Delete / Special follow that role.
 */
export function userCan(
  user: AuthUser | null | undefined,
  feature: string,
  action: PermissionAction | string
): boolean {
  if (!user) return false
  if (isUserSuperAdmin(user)) return true

  const permissions = Array.isArray(user.permissions) ? user.permissions : []
  if (permissions.length === 0) return true

  const row = permissions.find((permission) =>
    permissionMatches(permission?.module || "", feature)
  )
  if (!row) return false

  const field = ACTION_FIELD[String(action || "").toLowerCase()] || "read"
  return Boolean(row[field])
}
