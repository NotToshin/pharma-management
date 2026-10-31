import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../errors";
import config from "../config";
import { Prisma } from "@prisma/client";
import {
  paginationHelper,
  IPaginationOptions,
  IPaginatedResult,
} from "../utils/paginationHelper";
import prisma from "../utils/prisma";
import { generateAccessToken } from "../middlewares/token";
import { auditLogService } from "./auditLogService";
import {
  ALL_SYSTEM_MODULES,
  normalizeOverviewGrants,
  overviewGrantMap,
  packOverviewGrants,
  unpackOverviewGrants,
  type SystemModule,
} from "../constants/moduleCatalog";

export { ALL_SYSTEM_MODULES };

export interface IUserFilterOptions {
  searchTerm?: string;
  search?: string;
  q?: string;
  role?: string;
  roleCode?: string;
  status?: string;
  territory?: string;
  [key: string]: any;
}

export const userSearchableFields = [
  "name",
  "email",
  "territory",
] as const;

export const userFilterableFields = [
  "searchTerm",
  "search",
  "q",
  "role",
  "roleCode",
  "status",
  "territory",
] as const;

function moduleByName(name: string): SystemModule | undefined {
  return ALL_SYSTEM_MODULES.find((mod) => mod.module === name);
}

function enrichPermission(row: any) {
  const mod = moduleByName(row.module);
  const fallback = Boolean(row.read || row.specialGranted);
  const unpacked = unpackOverviewGrants(row.specialAction);
  return {
    ...row,
    category: mod?.category || row.category,
    specialAction: mod ? mod.specialAction : unpacked ? null : row.specialAction,
    actions: mod?.actions ?? ["read", "create", "edit", "delete"],
    overviews: mod?.overviews ?? [],
    overviewGrants: normalizeOverviewGrants(mod, unpacked ?? row.overviewGrants, fallback),
  };
}

const MODULE_RENAMES: Record<string, string> = {
  "Executive Dashboard": "Dashboard",
  "Target vs. Achievement": "Target Vs Achievement",
  "MIO Zone Allocations": "MIO Zone Allocation",
  "Master Doctor Database": "Doctors List",
  "Active Inventory Ledger (FEFO)": "Stock Inventory",
  "Wholesaler Purchase Orders": "Wholesale Purchase Orders",
  "Delivery Logistics & Orders": "Sales Orders",
  "Treasury & Finance Overview": "Treasury Overview",
  "Expense & Vendor Payments": "Payments",
  "Payroll & Salary": "Salary",
  "Audit Logs (21 CFR Part 11)": "Audit Logs (21 CFR Compliant)",
};

const DEPRECATED_MODULES = [
  "Buyer Payments",
  "Receive Stock Batch Log",
  "Receive Stock Delivery Log",
  "Route Optimization",
  "Sample & Gift Distribution",
  "Expiry Watchlist",
  "Add New Doctor",
  "Prescription Category Ranking",
  "All Tour Plans",
  "Pending Approvals",
  "Visit History Timeline",
];

const MODULE_ORDER = new Map(ALL_SYSTEM_MODULES.map((mod, index) => [mod.module, index]));

function sortModules<T extends { module: string }>(permissions: T[]) {
  return [...permissions].sort(
    (a, b) => (MODULE_ORDER.get(a.module) ?? 999) - (MODULE_ORDER.get(b.module) ?? 999)
  );
}

async function syncModuleCatalog() {
  for (const [oldName, newName] of Object.entries(MODULE_RENAMES)) {
    const canonical = ALL_SYSTEM_MODULES.find((mod) => mod.module === newName);
    const oldRows = await prisma.rolePermission.findMany({ where: { module: oldName } });
    for (const row of oldRows) {
      const existing = await prisma.rolePermission.findFirst({
        where: { roleId: row.roleId, module: newName },
      });
      if (existing) {
        await prisma.rolePermission.delete({ where: { id: row.id } });
      } else {
        await prisma.rolePermission.update({
          where: { id: row.id },
          data: {
            module: newName,
            category: canonical?.category || row.category,
            specialAction: canonical?.specialAction || row.specialAction,
          },
        });
      }
    }
  }

  for (const mod of ALL_SYSTEM_MODULES) {
    await prisma.rolePermission.updateMany({
      where: { module: mod.module },
      data: {
        category: mod.category,
      },
    });
  }

  const catalogRows = await prisma.rolePermission.findMany({
    where: { module: { in: ALL_SYSTEM_MODULES.map((mod) => mod.module) } },
  });
  for (const row of catalogRows) {
    const mod = moduleByName(row.module);
    if (!mod) continue;
    const stored = unpackOverviewGrants(row.specialAction);
    const storedEmpty = !stored || Object.keys(stored).length === 0;
    const grants =
      mod.module === "Dashboard" && storedEmpty
        ? {
            grossTurnover: Boolean(row.specialGranted),
            realizedCash: Boolean(row.specialGranted),
            expiryExposure: Boolean(row.specialGranted),
            liquidVault: Boolean(row.specialGranted),
            cashFlow: Boolean(row.specialGranted),
            therapeuticShare: Boolean(row.specialGranted),
            fefoSurveillance: Boolean(row.read || row.specialGranted),
            logisticsStream: Boolean(row.read || row.specialGranted),
            bankBalances: Boolean(row.read || row.specialGranted),
            keyOpinionLeaders: Boolean(row.read || row.specialGranted),
          }
        : normalizeOverviewGrants(mod, stored, Boolean(row.read || row.specialGranted));
    const packed = packOverviewGrants(grants);
    if (row.specialAction !== packed) {
      await prisma.rolePermission.update({
        where: { id: row.id },
        data: { specialAction: packed },
      });
    }
  }

  await prisma.rolePermission.deleteMany({
    where: { module: { in: DEPRECATED_MODULES } },
  }).catch(() => null);

  const roles = await prisma.systemRole.findMany({
    include: { permissions: { select: { module: true } } },
  });

  for (const role of roles) {
    const isSuper =
      role.code === "SUPERADMIN" ||
      role.code === "SUPER_ADMIN" ||
      role.name === "Super Administrator";
    const present = new Set(role.permissions.map((permission) => permission.module));
    for (const mod of ALL_SYSTEM_MODULES) {
      if (present.has(mod.module)) continue;
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          module: mod.module,
          category: mod.category,
          read: isSuper || mod.module === "Dashboard",
          create: isSuper && mod.actions.includes("create"),
          edit: isSuper && mod.actions.includes("edit"),
          delete: isSuper && mod.actions.includes("delete"),
          specialAction: packOverviewGrants(overviewGrantMap(mod, isSuper || mod.module === "Dashboard")),
          specialGranted: isSuper && Boolean(mod.specialAction),
        },
      });
    }
  }
}

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
    await syncModuleCatalog();

    // 1. Fetch ALL roles directly from the database Role collection
    const corporateRoles = await prisma.role.findMany({
      include: {
        _count: { select: { staff: true } },
      },
      orderBy: { createdAt: "asc" },
    });

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

        for (const mod of ALL_SYSTEM_MODULES) {
          await prisma.rolePermission.create({
            data: {
              roleId: newSysRole.id,
              module: mod.module,
              category: mod.category,
              read: isSuper || mod.module === "Dashboard",
              create: isSuper && mod.actions.includes("create"),
              edit: isSuper && mod.actions.includes("edit"),
              delete: isSuper && mod.actions.includes("delete"),
              specialAction: packOverviewGrants(overviewGrantMap(mod, isSuper || mod.module === "Dashboard")),
              specialGranted: isSuper && Boolean(mod.specialAction),
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
        permissions: sortModules(
          (sysRole.permissions || [])
            .filter((p) => !DEPRECATED_MODULES.includes(p.module) && MODULE_ORDER.has(p.module))
            .map(enrichPermission)
        ),
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
            read: isSuper || mod.module === "Dashboard",
            create: isSuper && mod.actions.includes("create"),
            edit: isSuper && mod.actions.includes("edit"),
            delete: isSuper && mod.actions.includes("delete"),
            specialAction: packOverviewGrants(overviewGrantMap(mod, isSuper || mod.module === "Dashboard")),
            specialGranted: isSuper && Boolean(mod.specialAction),
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
      permissions: sortModules(
        (sysRole.permissions || [])
          .filter((p) => !DEPRECATED_MODULES.includes(p.module) && MODULE_ORDER.has(p.module))
          .map(enrichPermission)
      ),
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

    // Purge any deprecated permissions
    await prisma.rolePermission.deleteMany({
      where: { module: { in: DEPRECATED_MODULES } },
    }).catch(() => null);

    const activePermissions = permissions.filter((p) => !DEPRECATED_MODULES.includes(p.module));

    for (const p of activePermissions) {
      const mod = moduleByName(p.module);
      const grants = normalizeOverviewGrants(
        mod,
        p.overviewGrants,
        Boolean(p.read || p.specialGranted)
      );
      const anyOverview = Object.values(grants).some(Boolean);
      const read = mod && mod.actions.length === 0 ? anyOverview : Boolean(p.read);
      await prisma.rolePermission.upsert({
        where: {
          roleId_module: {
            roleId: targetRoleId,
            module: p.module,
          },
        },
        update: {
          read,
          create: Boolean(p.create) && (!mod || mod.actions.includes("create")),
          edit: Boolean(p.edit) && (!mod || mod.actions.includes("edit")),
          delete: Boolean(p.delete) && (!mod || mod.actions.includes("delete")),
          specialAction: packOverviewGrants(grants),
          specialGranted: Boolean(p.specialGranted) && Boolean(mod ? mod.specialAction : p.specialAction),
        },
        create: {
          roleId: targetRoleId,
          module: p.module,
          category: mod?.category || p.category || "General",
          read,
          create: Boolean(p.create) && (!mod || mod.actions.includes("create")),
          edit: Boolean(p.edit) && (!mod || mod.actions.includes("edit")),
          delete: Boolean(p.delete) && (!mod || mod.actions.includes("delete")),
          specialAction: packOverviewGrants(grants),
          specialGranted: Boolean(p.specialGranted) && Boolean(mod ? mod.specialAction : p.specialAction),
        },
      });
    }

    // Sync to Role collection
    const grantedModules = activePermissions
      .filter((p: any) => {
        const mod = moduleByName(p.module);
        const grants = normalizeOverviewGrants(mod, p.overviewGrants, Boolean(p.read));
        return Boolean(p.read) || Object.values(grants).some(Boolean);
      })
      .map((p: any) => p.module);
    await prisma.role.updateMany({
      where: {
        name: { equals: sysRole.name, mode: "insensitive" },
      },
      data: {
        permissions: grantedModules.length > 0 ? grantedModules : ["VIEW_DASHBOARD"],
      },
    });

    await auditLogService.recordAuditEvent({
      module: "RBAC Security",
      actionType: "Permission Changed",
      severity: "Security Warning",
      entityTarget: `Role: ${sysRole.name} (${sysRole.code})`,
      entityType: "SystemRole",
      entityId: sysRole.id,
      changeSummary: `Security access matrix updated for role '${sysRole.name}' across ${permissions.length} modules.`,
      newPayload: permissions,
      reasonForChange: "System security policy revision and user privilege re-allocation.",
    });

    return { message: "Role permissions saved successfully" };
  },

  async getUsers(
    filters?: IUserFilterOptions,
    paginationOptions?: IPaginationOptions
  ): Promise<IPaginatedResult<any[]>> {
    if (
      !paginationOptions &&
      filters &&
      ("page" in filters ||
        "limit" in filters ||
        "sortBy" in filters ||
        "sortOrder" in filters)
    ) {
      paginationOptions = filters as IPaginationOptions;
      filters = {};
    }

    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper.calculatePagination(paginationOptions, {
        sortBy: "createdAt",
        sortOrder: "desc",
      });

    const {
      searchTerm,
      search,
      q,
      role,
      roleCode,
      status,
      territory,
      ...filterData
    } = filters || {};

    const effectiveSearch = (searchTerm || search || q || "").trim();
    const effectiveRole = (role || roleCode || "").trim();
    const effectiveStatus = (status || "").trim();
    const effectiveTerritory = (territory || "").trim();

    const andConditions: Prisma.SystemUserWhereInput[] = [];

    // Search across searchable fields + role relation
    if (effectiveSearch) {
      andConditions.push({
        OR: [
          ...userSearchableFields.map((field) => ({
            [field]: {
              contains: effectiveSearch,
              mode: "insensitive" as const,
            },
          })),
          {
            role: {
              is: {
                name: {
                  contains: effectiveSearch,
                  mode: "insensitive" as const,
                },
              },
            },
          },
          {
            role: {
              is: {
                code: {
                  contains: effectiveSearch,
                  mode: "insensitive" as const,
                },
              },
            },
          },
        ],
      });
    }

    // Role filter
    if (effectiveRole && effectiveRole !== "ALL") {
      const cleanRole = effectiveRole.toUpperCase();
      const roleCodes = [cleanRole, cleanRole.replace(/_/g, "")];
      const roleOrConditions: Prisma.SystemRoleWhereInput[] = [
        { code: { in: roleCodes } },
        { name: { equals: effectiveRole, mode: "insensitive" as const } },
      ];
      if (/^[0-9a-fA-F]{24}$/.test(effectiveRole)) {
        roleOrConditions.unshift({ id: effectiveRole });
      }

      andConditions.push({
        role: {
          is: {
            OR: roleOrConditions,
          },
        },
      });
    }

    // Status filter
    if (effectiveStatus && effectiveStatus !== "ALL") {
      andConditions.push({
        status: {
          equals: effectiveStatus,
          mode: "insensitive" as const,
        },
      });
    }

    // Territory filter
    if (effectiveTerritory && effectiveTerritory !== "ALL") {
      andConditions.push({
        territory: {
          contains: effectiveTerritory,
          mode: "insensitive" as const,
        },
      });
    }

    // Additional specific field filters if provided
    for (const [key, val] of Object.entries(filterData)) {
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        andConditions.push({
          [key]: {
            contains: String(val).trim(),
            mode: "insensitive" as const,
          },
        });
      }
    }

    const whereConditions: Prisma.SystemUserWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "name",
      "email",
      "territory",
      "status",
      "lastLogin",
    ];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const findArgs: Prisma.SystemUserFindManyArgs = {
      where: whereConditions,
      include: {
        role: { select: { name: true, code: true } },
      },
      orderBy: { [safeSortBy]: sortOrder },
    };

    if (limit > 0) {
      findArgs.skip = skip;
      findArgs.take = limit;
    }

    const [users, total, totalActive, totalRestricted] = await Promise.all([
      prisma.systemUser.findMany(findArgs),
      prisma.systemUser.count({ where: whereConditions }),
      prisma.systemUser.count({ where: { status: "Active" } }),
      prisma.systemUser.count({ where: { status: "Restricted" } }),
    ]);

    const baseMeta = paginationHelper.createPaginationMeta(total, { page, limit });
    const meta = {
      ...baseMeta,
      totalActive,
      totalRestricted,
    };

    const formattedUsers = (users as any[]).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roleCode: u.role?.code || "",
      roleName: u.role?.name || "",
      roleId: u.roleId,
      territory: u.territory,
      status: u.status,
      lastLogin: u.lastLogin,
      passwordHash: `${u.passwordHash.slice(0, 10)}...${u.passwordHash.slice(-5)}`,
    }));

    return {
      meta,
      data: formattedUsers,
    };
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
      if (cleanEmail !== user.email.toLowerCase()) {
        throw new AppError("Operator email address cannot be modified.", 400);
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
        permissions: (user.role.permissions || []).map(enrichPermission),
      },
    };
  },
};