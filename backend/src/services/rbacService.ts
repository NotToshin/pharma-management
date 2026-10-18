import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../errors";
import config from "../config";
import prisma from "../utils/prisma";
import { generateAccessToken } from "../middlewares/token";


export const ALL_SYSTEM_MODULES = [
  // 1. Overview & Analytics
  { module: "Executive Dashboard", route: "/dashboard", category: "Overview & Analytics", specialAction: "View Real-Time Financials" },
  { module: "Target vs. Achievement", route: "/analytics/targets", category: "Overview & Analytics", specialAction: "Re-allocate Quotas" },
  { module: "Territory Sales Breakdown", route: "/analytics/territories", category: "Overview & Analytics", specialAction: "Export Analytical Raw Data" },

  // 2. Field Force (MIO)
  { module: "MIO Zone Allocations", route: "/field-force/zones", category: "Field Force", specialAction: "Re-assign Territory Boundaries" },
  { module: "Doctor Visit Logs", route: "/field-force/visit-logs", category: "Field Force", specialAction: "Audit MIO Geo-stamp" },
  { module: "All Tour Plans", route: "/field-force/tour-plans", category: "Field Force", specialAction: "Approve Tour Programme" },
  { module: "Pending Approvals", route: "/field-force/approvals", category: "Field Force", specialAction: "Batch Sign-off Approvals" },
  { module: "Sample & Gift Distribution", route: "/field-force/samples", category: "Field Force", specialAction: "Authorize High-Value Samples" },
  { module: "Route Optimization", route: "/field-force/routes", category: "Field Force", specialAction: "Modify Beat Sequence" },

  // 3. Doctor Registry
  { module: "Master Doctor Database", route: "/doctors/database", category: "Doctor Registry", specialAction: "BMDC Verification Bypass" },
  { module: "Add New Doctor", route: "/doctors/new", category: "Doctor Registry", specialAction: "Fast-track Registration" },
  { module: "Prescription Category Ranking", route: "/doctors/ranking", category: "Doctor Registry", specialAction: "Re-rank Category Tiers" },
  { module: "Visit History Timeline", route: "/doctors/timeline", category: "Doctor Registry", specialAction: "Purge Inactive Profiles" },

  // 4. Inventory & Warehouse
  { module: "Active Inventory Ledger (FEFO)", route: "/inventory/ledger", category: "Inventory & Warehouse", specialAction: "Quarantine / Write-off Batch" },
  { module: "Wholesaler Purchase Orders", route: "/procurement/orders", category: "Inventory & Warehouse", specialAction: "Approve Multi-tier PO" },
  { module: "Stock Adjustments", route: "/inventory/adjustments", category: "Inventory & Warehouse", specialAction: "Authorize Discrepancy Write-offs" },
  { module: "Expiry Watchlist", route: "/inventory/expiry", category: "Inventory & Warehouse", specialAction: "Authorize Early-Dump Return" },
  { module: "Receive Stock Batch Log", route: "/procurement/batch-logs", category: "Inventory & Warehouse", specialAction: "Override Quality Inspection" },

  // 5. Sales & Deliveries
  { module: "Delivery Logistics & Orders", route: "/logistics/orders", category: "Sales & Deliveries", specialAction: "Override Credit Hold" },
  { module: "Receive Stock Delivery Log", route: "/logistics/batch-log", category: "Sales & Deliveries", specialAction: "Bypass Dispatch Gate Pass" },
  { module: "Pharmacy Clients", route: "/sales/clients", category: "Sales & Deliveries", specialAction: "Approve Credit Line Expansion" },

  // 6. Finance & Treasury
  { module: "Treasury & Finance Overview", route: "/finance/overview", category: "Finance & Treasury", specialAction: "Authorize Bank Release" },
  { module: "Bank Accounts Ledger", route: "/finance/bank-ledger", category: "Finance & Treasury", specialAction: "Electronic Fund Transfer" },
  { module: "Delivery Cash Collections", route: "/finance/collections", category: "Finance & Treasury", specialAction: "Force Cash Vault Clearance" },
  { module: "Expense & Vendor Payments", route: "/finance/payments", category: "Finance & Treasury", specialAction: "Authorize Cheque Sign-off" },

  // 7. HR & System Control
  { module: "Staff Directory & Roles", route: "/hr/staff-directory", category: "HR & System Control", specialAction: "Issue Appointment Letters" },
  { module: "Payroll & Salary", route: "/hr/salary", category: "HR & System Control", specialAction: "Authorize Salary Advice" },
  { module: "Role Permissions (RBAC)", route: "/settings/rbac", category: "HR & System Control", specialAction: "Modify Master Security Matrix" },
  { module: "Audit Logs (21 CFR Part 11)", route: "/settings/audit-logs", category: "HR & System Control", specialAction: "Cryptographic Ledger Export" },
];

export function generateCode(name: string): string {
  const upper = name.trim().toUpperCase();
  if (upper.includes("SUPER ADMIN")) return "SUPERADMIN";
  if (upper.includes("REGIONAL SALES")) return "RSM_EXEC";
  if (upper.includes("MEDICAL INFORMATION")) return "MIO_FIELD";
  if (upper.includes("ACCOUNTANT") || upper.includes("FINANCE")) return "FIN_CONTROLLER";
  if (upper.includes("WAREHOUSE")) return "WH_LOGISTICS";
  return upper.replace(/[^A-Z0-9]/g, "_").replace(/_+/g, "_");
}

export const rbacService = {
  async getRoles() {
    // 1. Fetch ALL roles directly from the database Role collection
    const corporateRoles = await prisma.role.findMany({
      include: {
        _count: { select: { staff: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Fetch all system roles with permissions and system users
    const systemRoles = await prisma.systemRole.findMany({
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
    });

    const result = [];

    for (const corpRole of corporateRoles) {
      const code = generateCode(corpRole.name);
      let sysRole = systemRoles.find(
        (sr) =>
          sr.name.toLowerCase() === corpRole.name.toLowerCase() ||
          sr.code.toUpperCase() === code
      );

      // If SystemRole does not exist yet for this corporate role, create it on-demand
      if (!sysRole) {
        const isSuper = code === "SUPERADMIN" || code === "SUPER_ADMIN";
        const newSysRole = await prisma.systemRole.create({
          data: {
            name: corpRole.name,
            code: code,
            description: `Corporate operational role for ${corpRole.name}`,
            isSystemDefault: isSuper,
          },
        });

        // Initialize default permissions for all 29 modules
        for (const mod of ALL_SYSTEM_MODULES) {
          await prisma.rolePermission.create({
            data: {
              roleId: newSysRole.id,
              module: mod.module,
              category: mod.category,
              read: isSuper ? true : mod.module === "Executive Dashboard",
              create: isSuper,
              edit: isSuper,
              delete: isSuper,
              specialAction: mod.specialAction,
              specialGranted: isSuper,
            },
          });
        }

        sysRole = (await prisma.systemRole.findUnique({
          where: { id: newSysRole.id },
          include: {
            permissions: true,
            _count: { select: { users: true } },
          },
        }))!;
      }

      result.push({
        id: sysRole.id,
        roleId: corpRole.id,
        name: corpRole.name,
        code: sysRole.code,
        description: sysRole.description || `Corporate operational role: ${corpRole.name}`,
        isSystemDefault: sysRole.isSystemDefault || sysRole.code === "SUPERADMIN" || sysRole.name === "Super Administrator",
        userCount: (sysRole._count?.users || 0) + (corpRole._count?.staff || 0),
        staffCount: corpRole._count?.staff || 0,
        permissions: sysRole.permissions,
      });
    }

    return result;
  },

  async createRole(data: { name: string; code?: string; description?: string }) {
    const trimmedName = data.name.trim();
    const cleanCode = data.code ? data.code.trim().toUpperCase().replace(/\s+/g, "_") : generateCode(trimmedName);

    // Create or find in Role collection
    let corporateRole = await prisma.role.findFirst({
      where: { name: { equals: trimmedName, mode: "insensitive" } },
    });
    if (!corporateRole) {
      corporateRole = await prisma.role.create({
        data: {
          name: trimmedName,
          permissions: ["VIEW_DASHBOARD"],
        },
      });
    }

    let sysRole = await prisma.systemRole.findFirst({
      where: {
        OR: [
          { name: { equals: trimmedName, mode: "insensitive" } },
          { code: cleanCode },
        ],
      },
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
    });

    if (!sysRole) {
      const isSuper = cleanCode === "SUPERADMIN";
      sysRole = await prisma.systemRole.create({
        data: {
          name: trimmedName,
          code: cleanCode,
          description: data.description?.trim() || `Corporate operational role for ${trimmedName}`,
          isSystemDefault: isSuper,
        },
        include: {
          permissions: true,
          _count: { select: { users: true } },
        },
      });

      for (const mod of ALL_SYSTEM_MODULES) {
        await prisma.rolePermission.create({
          data: {
            roleId: sysRole.id,
            module: mod.module,
            category: mod.category,
            read: isSuper ? true : mod.module === "Executive Dashboard",
            create: isSuper,
            edit: isSuper,
            delete: isSuper,
            specialAction: mod.specialAction,
            specialGranted: isSuper,
          },
        });
      }

      sysRole = (await prisma.systemRole.findUnique({
        where: { id: sysRole.id },
        include: {
          permissions: true,
          _count: { select: { users: true } },
        },
      }))!;
    }

    return {
      id: sysRole.id,
      roleId: corporateRole.id,
      name: corporateRole.name,
      code: sysRole.code,
      description: sysRole.description,
      isSystemDefault: sysRole.isSystemDefault,
      userCount: sysRole._count.users,
      permissions: sysRole.permissions,
    };
  },

  async updateRolePermissions(id: string, permissions: any[]) {
    let sysRole = await prisma.systemRole.findUnique({ where: { id } });
    if (!sysRole) {
      const corpRole = await prisma.role.findUnique({ where: { id } });
      if (corpRole) {
        const code = generateCode(corpRole.name);
        sysRole = await prisma.systemRole.findFirst({
          where: {
            OR: [
              { name: { equals: corpRole.name, mode: "insensitive" } },
              { code: code },
            ],
          },
        });
      }
    }

    if (!sysRole) {
      throw new AppError("System role not found", 404);
    }

    const targetRoleId = sysRole.id;

    for (const p of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_module: {
            roleId: targetRoleId,
            module: p.module,
          },
        },
        update: {
          read: Boolean(p.read),
          create: Boolean(p.create),
          edit: Boolean(p.edit),
          delete: Boolean(p.delete),
          specialGranted: Boolean(p.specialGranted),
        },
        create: {
          roleId: targetRoleId,
          module: p.module,
          category: p.category || "General",
          read: Boolean(p.read),
          create: Boolean(p.create),
          edit: Boolean(p.edit),
          delete: Boolean(p.delete),
          specialAction: p.specialAction || null,
          specialGranted: Boolean(p.specialGranted),
        },
      });
    }

    // Sync to Role collection
    const grantedModules = permissions.filter((p: any) => p.read).map((p: any) => p.module);
    await prisma.role.updateMany({
      where: {
        name: { equals: sysRole.name, mode: "insensitive" },
      },
      data: {
        permissions: grantedModules.length > 0 ? grantedModules : ["VIEW_DASHBOARD"],
      },
    });

    return { message: "Role permissions saved successfully" };
  },

  async getUsers() {
    const users = await prisma.systemUser.findMany({
      include: {
        role: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roleCode: u.role.code,
      roleName: u.role.name,
      roleId: u.roleId,
      territory: u.territory,
      status: u.status,
      lastLogin: u.lastLogin,
      passwordHash: `${u.passwordHash.slice(0, 10)}...${u.passwordHash.slice(-5)}`,
    }));
  },

  async provisionUser(data: { name: string; email: string; password: string; roleCode: string; territory?: string }) {
    const { name, email, password, roleCode, territory } = data;

    const cleanEmail = email.trim().toLowerCase();

    const existing = await prisma.systemUser.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      throw new AppError("An operator with this email is already provisioned.", 400);
    }

    const cleanRoleCode = roleCode.trim().toUpperCase();
    const orConditions: any[] = [
      { code: cleanRoleCode },
      { code: cleanRoleCode.replace(/_/g, "") },
      { name: { equals: roleCode.trim(), mode: "insensitive" } },
    ];
    if (/^[0-9a-fA-F]{24}$/.test(roleCode.trim())) {
      orConditions.unshift({ id: roleCode.trim() });
    }

    const role = await prisma.systemRole.findFirst({
      where: {
        OR: orConditions,
      },
    });
    if (!role) {
      throw new AppError(`Specified role '${roleCode}' does not exist.`, 404);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.systemUser.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        roleId: role.id,
        territory: territory?.trim() || "Dhaka North Hub",
        status: "Active",
      },
      include: {
        role: { select: { name: true, code: true } },
      },
    });

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      roleCode: newUser.role.code,
      roleName: newUser.role.name,
      territory: newUser.territory,
      status: newUser.status,
      lastLogin: newUser.lastLogin,
      message: "Operator account provisioned successfully.",
    };
  },

  async updateUser(id: string, data: { name?: string; email?: string; roleCode?: string; territory?: string; password?: string }) {
    const user = await prisma.systemUser.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) {
      throw new AppError("Operator user not found", 404);
    }

    const updateData: any = {};
    if (data.name && data.name.trim().length > 0) {
      updateData.name = data.name.trim();
    }
    if (data.territory && data.territory.trim().length > 0) {
      updateData.territory = data.territory.trim();
    }
    if (data.email) {
      const cleanEmail = data.email.trim().toLowerCase();
      if (cleanEmail !== user.email) {
        const existing = await prisma.systemUser.findUnique({ where: { email: cleanEmail } });
        if (existing) {
          throw new AppError("An operator with this email is already provisioned.", 400);
        }
        updateData.email = cleanEmail;
      }
    }

    if (data.roleCode) {
      const cleanRoleCode = data.roleCode.trim().toUpperCase();
      const orConditions: any[] = [
        { code: cleanRoleCode },
        { code: cleanRoleCode.replace(/_/g, "") },
        { name: { equals: data.roleCode.trim(), mode: "insensitive" } },
      ];
      if (/^[0-9a-fA-F]{24}$/.test(data.roleCode.trim())) {
        orConditions.unshift({ id: data.roleCode.trim() });
      }

      const targetRole = await prisma.systemRole.findFirst({
        where: {
          OR: orConditions,
        },
      });
      if (!targetRole) {
        throw new AppError(`Specified role '${data.roleCode}' does not exist.`, 404);
      }
      const isUserSuperAdmin = user.role.code === "SUPER_ADMIN" || user.role.code === "SUPERADMIN";
      const isTargetSuperAdmin = targetRole.code === "SUPER_ADMIN" || targetRole.code === "SUPERADMIN";
      if (isUserSuperAdmin && !isTargetSuperAdmin) {
        const superAdminCount = await prisma.systemUser.count({
          where: {
            role: {
              OR: [{ code: "SUPER_ADMIN" }, { code: "SUPERADMIN" }],
            },
            status: "Active",
          },
        });
        if (superAdminCount <= 1) {
          throw new AppError("Cannot change role: System requires at least one active Super Administrator.", 400);
        }
      }
      updateData.roleId = targetRole.id;
    }

    if (data.password && data.password.trim().length > 0) {
      if (data.password.length < 6) {
        throw new AppError("Password must be at least 6 characters.", 400);
      }
      const salt = await bcrypt.genSalt(12);
      updateData.passwordHash = await bcrypt.hash(data.password, salt);
    }

    const updatedUser = await prisma.systemUser.update({
      where: { id },
      data: updateData,
      include: {
        role: { select: { name: true, code: true } },
      },
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      roleCode: updatedUser.role.code,
      roleName: updatedUser.role.name,
      territory: updatedUser.territory,
      status: updatedUser.status,
      lastLogin: updatedUser.lastLogin,
      message: "Operator credentials and role updated successfully.",
    };
  },

  async deleteUser(id: string) {
    const user = await prisma.systemUser.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const isUserSuperAdmin = user.role.code === "SUPER_ADMIN" || user.role.code === "SUPERADMIN";
    if (isUserSuperAdmin) {
      const superAdminCount = await prisma.systemUser.count({
        where: {
          role: {
            OR: [{ code: "SUPER_ADMIN" }, { code: "SUPERADMIN" }],
          },
        },
      });
      if (superAdminCount <= 1) {
        throw new AppError("Cannot delete the sole Super Administrator account.", 400);
      }
    }
    await prisma.systemUser.delete({ where: { id } });
    return { message: "Operator deleted successfully" };
  },

  async toggleUserStatus(id: string) {
    const user = await prisma.systemUser.findUnique({ where: { id } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const nextStatus = user.status === "Active" ? "Restricted" : "Active";
    const updated = await prisma.systemUser.update({
      where: { id },
      data: { status: nextStatus },
    });

    return { status: updated.status };
  },

  async loginOperator(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.systemUser.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { email: `${cleanEmail}.com` },
        ],
      },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    if (!user) {
      throw new AppError("Invalid credentials. Contact IT for access.", 401);
    }

    if (user.status === "Restricted") {
      throw new AppError("This operator account is currently restricted. Contact management.", 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid credentials. Contact IT for access.", 401);
    }

    const nowStr = new Date()
      .toLocaleString("en-GB", {
        timeZone: "Asia/Dhaka",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(/am|pm/i, (m) => m.toUpperCase());
    await prisma.systemUser.update({
      where: { id: user.id },
      data: { lastLogin: nowStr },
    });

    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.code,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleCode: user.role.code,
        roleName: user.role.name,
        territory: user.territory,
        permissions: user.role.permissions,
      },
    };
  },
};