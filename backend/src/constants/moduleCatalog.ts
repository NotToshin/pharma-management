export type MatrixAction = "read" | "create" | "edit" | "delete";

export interface ModuleOverview {
  key: string;
  label: string;
}

export interface SystemModule {
  module: string;
  route: string;
  category: string;
  specialAction: string | null;
  /** CRUD columns shown in the matrix. Empty means the page is overview-only. */
  actions: MatrixAction[];
  overviews: ModuleOverview[];
}

const CRUD: MatrixAction[] = ["read", "create", "edit", "delete"];

export const ALL_SYSTEM_MODULES: SystemModule[] = [
  {
    module: "Dashboard",
    route: "/dashboard",
    category: "Overview & Analytics",
    specialAction: null,
    actions: [],
    overviews: [
      { key: "grossTurnover", label: "Gross Turnover" },
      { key: "realizedCash", label: "Realized Cash" },
      { key: "expiryExposure", label: "Expiry Exposure" },
      { key: "liquidVault", label: "Liquid Vault & Banks" },
      { key: "cashFlow", label: "Commercial Cash Flow Run-Rate" },
      { key: "therapeuticShare", label: "Therapeutic Share" },
      { key: "fefoSurveillance", label: "FEFO Batch Expiry Surveillance" },
      { key: "logisticsStream", label: "Logistics Dispatch & Challan Stream" },
      { key: "bankBalances", label: "Bank Balances & Vault Liquidity" },
      { key: "keyOpinionLeaders", label: "Key Opinion Leaders" },
    ],
  },
  {
    module: "Target Vs Achievement",
    route: "/analytics/targets",
    category: "Overview & Analytics",
    specialAction: "Re-allocate Quotas",
    actions: CRUD,
    overviews: [
      { key: "grossQuota", label: "Gross Quota Target" },
      { key: "realizedAchieved", label: "Total Realized Achieved" },
      { key: "topMio", label: "Top Performing MIO" },
      { key: "behindQuota", label: "Behind Quota Target" },
      { key: "varianceChart", label: "MIO Quota vs Achievement" },
    ],
  },
  {
    module: "Territory Sales Breakdown",
    route: "/analytics/territories",
    category: "Overview & Analytics",
    specialAction: "Export Analytical Raw Data",
    actions: ["read"],
    overviews: [
      { key: "grossRegional", label: "Gross Regional Sales" },
      { key: "activeHubs", label: "Active Operational Hubs" },
      { key: "pharmacies", label: "Subscribed Pharmacies" },
      { key: "fieldForce", label: "Field Force (MIOs)" },
      { key: "regionalVolume", label: "Regional Sales Volume" },
      { key: "marketShare", label: "Territory Market Share" },
    ],
  },
  {
    module: "MIO Zone Allocation",
    route: "/field-force/zones",
    category: "Overview & Analytics",
    specialAction: "Re-assign Territory Boundaries",
    actions: CRUD,
    overviews: [
      { key: "allocations", label: "Total Allocations" },
      { key: "activeCoverage", label: "Active Coverage" },
      { key: "connectedDoctors", label: "Connected Doctors" },
      { key: "coveredStores", label: "Covered Stores" },
    ],
  },
  {
    module: "Doctors List",
    route: "/doctors/database",
    category: "Doctor Management",
    specialAction: "BMDC Verification Bypass",
    actions: CRUD,
    overviews: [
      { key: "registered", label: "Total Registered Doctors" },
      { key: "tierA", label: "Tier A & A+ High Yield" },
      { key: "footfall", label: "Daily Patient Footfall" },
      { key: "exportBackup", label: "Export & Backup" },
    ],
  },
  {
    module: "Doctor Visit Logs",
    route: "/field-force/visit-logs",
    category: "Doctor Management",
    specialAction: "Audit MIO Geo-stamp",
    actions: CRUD,
    overviews: [
      { key: "visits", label: "Total Visits Logged" },
      { key: "highPotential", label: "High Potential Calls" },
      { key: "successRate", label: "Call Success Rate" },
      { key: "samples", label: "Samples Handed Out" },
    ],
  },
  {
    module: "Stock Inventory",
    route: "/inventory/ledger",
    category: "Inventory & Warehouse",
    specialAction: "Quarantine / Write-off Batch",
    actions: CRUD,
    overviews: [
      { key: "valuation", label: "Gross Batch Valuation" },
      { key: "volume", label: "Available Stock Volume" },
      { key: "fefoPriority", label: "FEFO Priority Dispatch" },
      { key: "quarantineAlert", label: "Quarantine & Expiry Alert" },
    ],
  },
  {
    module: "Stock Adjustments",
    route: "/inventory/adjustments",
    category: "Inventory & Warehouse",
    specialAction: "Authorize Discrepancy Write-offs",
    actions: ["read", "create", "delete"],
    overviews: [
      { key: "netImpact", label: "Net Adjustments Impact" },
      { key: "writeOffs", label: "Physical Write-Offs" },
      { key: "auditCompliance", label: "Audit Compliance" },
      { key: "quarantineValue", label: "Quarantined Stock Value" },
    ],
  },
  {
    module: "Sales Orders",
    route: "/logistics/orders",
    category: "Sales & Deliveries",
    specialAction: "Override Credit Hold",
    actions: ["read", "create", "delete"],
    overviews: [
      { key: "pipeline", label: "Pipeline Order Volume" },
      { key: "salesReps", label: "Sales Representative" },
      { key: "creditHold", label: "Credit Hold Approvals" },
      { key: "otif", label: "Fulfillment Efficiency (OTIF)" },
    ],
  },
  {
    module: "Pharmacy Clients",
    route: "/sales/clients",
    category: "Sales & Deliveries",
    specialAction: "Approve Credit Line Expansion",
    actions: CRUD,
    overviews: [
      { key: "enrolled", label: "Total Enrolled Chemists" },
      { key: "creditHealth", label: "Credit Health Rate" },
      { key: "creditLimit", label: "Extended Credit Limit" },
      { key: "receivable", label: "Outstanding Receivable" },
    ],
  },
  {
    module: "Treasury Overview",
    route: "/finance/overview",
    category: "Finance & Treasury",
    specialAction: "Authorize Bank Release",
    actions: ["read"],
    overviews: [
      { key: "billedTurnover", label: "Gross Billed Turnover" },
      { key: "collections", label: "Realized Collections" },
      { key: "receivable", label: "Accounts Receivable (A/R)" },
      { key: "burn", label: "TA/DA & Operational Burn" },
      { key: "cashFlow", label: "Cash Flow Run-Rate" },
      { key: "margin", label: "Commercial Margin Breakdown" },
    ],
  },
  {
    module: "Bank Accounts Ledger",
    route: "/finance/bank-ledger",
    category: "Finance & Treasury",
    specialAction: "Electronic Fund Transfer",
    actions: CRUD,
    overviews: [
      { key: "liquidity", label: "Total Central Liquidity" },
      { key: "bankBalances", label: "Corporate Bank Balances" },
      { key: "cashDrawers", label: "Physical Cash Drawers" },
      { key: "flows", label: "Total Inflows vs Outflows" },
    ],
  },
  {
    module: "Delivery Cash Collections",
    route: "/finance/collections",
    category: "Finance & Treasury",
    specialAction: "Force Cash Vault Clearance",
    actions: CRUD,
    overviews: [
      { key: "realized", label: "Realized & Deposited" },
      { key: "pending", label: "Pending Clearance" },
      { key: "invoiced", label: "Total Invoiced BDT" },
      { key: "dues", label: "Chemist Dues Uncollected" },
      { key: "destinations", label: "Deposit Destinations" },
    ],
  },
  {
    module: "Supplier Payments",
    route: "/finance/supplier-payments",
    category: "Finance & Treasury",
    specialAction: "Disburse Supplier Settlement",
    actions: ["read", "create", "delete"],
    overviews: [
      { key: "openBills", label: "Open Bills" },
      { key: "payable", label: "Accounts Payable" },
      { key: "paid", label: "Paid to Suppliers" },
    ],
  },
  {
    module: "Wholesale Purchase Orders",
    route: "/procurement/orders",
    category: "Finance & Treasury",
    specialAction: "Approve Multi-tier PO",
    actions: CRUD,
    overviews: [
      { key: "pipeline", label: "Pipeline Procurement Volume" },
      { key: "pendingApproval", label: "Pending Multi-Tier Approval" },
      { key: "inbound", label: "Approved & Inbound Fleet" },
      { key: "otif", label: "Fulfillment Efficiency (OTIF)" },
    ],
  },
  {
    module: "Payments",
    route: "/finance/payments",
    category: "Finance & Treasury",
    specialAction: "Authorize Cheque Sign-off",
    actions: CRUD,
    overviews: [
      { key: "grossBill", label: "Total Gross Bill" },
      { key: "disbursed", label: "Disbursed & Settled" },
      { key: "pending", label: "Pending Clearance" },
      { key: "withheld", label: "Statutory Withheld" },
      { key: "safes", label: "Active Funding Safes" },
    ],
  },
  {
    module: "Staff Directory & Roles",
    route: "/hr/staff-directory",
    category: "HR & System Control",
    specialAction: "Issue Appointment Letters",
    actions: CRUD,
    overviews: [
      { key: "headcount", label: "Total Enrolled Headcount" },
      { key: "activeRatio", label: "Active Operational Ratio" },
      { key: "payrollLiability", label: "Monthly Payroll Liability" },
      { key: "roles", label: "Configured DB Roles" },
    ],
  },
  {
    module: "Salary",
    route: "/hr/salary",
    category: "HR & System Control",
    specialAction: "Authorize Salary Advice",
    actions: CRUD,
    overviews: [
      { key: "netPay", label: "Total Net Remuneration" },
      { key: "coverage", label: "Payroll Staff Coverage" },
      { key: "disbursed", label: "Treasury Disbursed" },
      { key: "withholdings", label: "Provident & Tax Withholdings" },
    ],
  },
  {
    module: "Role Permissions (RBAC)",
    route: "/settings/rbac",
    category: "HR & System Control",
    specialAction: "Modify Master Security Matrix",
    actions: CRUD,
    overviews: [
      { key: "roleClasses", label: "Configured Role Classes" },
      { key: "accounts", label: "Provisioned Accounts" },
      { key: "clearance", label: "Master Clearance" },
      { key: "credentialSecurity", label: "Credential Security" },
    ],
  },
  {
    module: "Audit Logs (21 CFR Compliant)",
    route: "/settings/audit-logs",
    category: "HR & System Control",
    specialAction: "Cryptographic Ledger Export",
    actions: ["read", "create"],
    overviews: [
      { key: "loggedEvents", label: "Total Logged Events" },
      { key: "overrides", label: "Critical Statutory Overrides" },
      { key: "warnings", label: "Security & Policy Warnings" },
      { key: "integrity", label: "Cryptographic Integrity" },
    ],
  },
];

export function overviewGrantMap(mod: SystemModule, granted: boolean): Record<string, boolean> {
  return Object.fromEntries(mod.overviews.map((view) => [view.key, granted]));
}

/** Stored in specialAction so the current Prisma client can save card visibility. */
export function packOverviewGrants(grants: Record<string, boolean>): string {
  return JSON.stringify({ v: 1, grants });
}

export function unpackOverviewGrants(stored: unknown): Record<string, boolean> | null {
  if (typeof stored !== "string" || !stored.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(stored) as { v?: number; grants?: Record<string, boolean> };
    if (
      parsed?.v === 1 &&
      parsed.grants &&
      typeof parsed.grants === "object" &&
      !Array.isArray(parsed.grants)
    ) {
      return parsed.grants;
    }
  } catch {
    return null;
  }
  return null;
}

export function normalizeOverviewGrants(
  mod: SystemModule | undefined,
  stored: unknown,
  fallbackGranted: boolean
): Record<string, boolean> {
  const current =
    stored && typeof stored === "object" && !Array.isArray(stored)
      ? { ...(stored as Record<string, boolean>) }
      : {};
  if (!mod) return current;
  for (const view of mod.overviews) {
    if (typeof current[view.key] !== "boolean") {
      current[view.key] = fallbackGranted;
    }
  }
  return current;
}
