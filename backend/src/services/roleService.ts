import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { overviewGrantMap, packOverviewGrants } from "../constants/moduleCatalog";
import { ALL_SYSTEM_MODULES, generateCode } from "./rbacService";
import { auditLogService } from "./auditLogService";

export const roleService = {
  async getAllRoles() {
    let roles = await prisma.role.findMany({
      include: {
        _count: { select: { staff: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return roles;
  },

  async createRole(data: { name: string; permissions?: string[] }) {
    if (!data.name || !data.name.trim()) {
      throw new AppError("Role name is required", 400);
    }

    const trimmedName = data.name.trim();

    let existing = await prisma.role.findFirst({
      where: {
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (!existing) {
      existing = await prisma.role.create({
        data: {
          name: trimmedName,
          permissions: data.permissions || ["VIEW_DASHBOARD"],
        },
      });
    }

    // Ensure corresponding SystemRole and 29 module permissions exist for RBAC
    const cleanCode = generateCode(trimmedName);
    let sysRole = await prisma.systemRole.findFirst({
      where: {
        OR: [
          { name: { equals: trimmedName, mode: "insensitive" } },
          { code: cleanCode },
        ],
      },
    });

    if (!sysRole) {
      const isSuper = cleanCode === "SUPERADMIN" || cleanCode === "SUPER_ADMIN";
      sysRole = await prisma.systemRole.create({
        data: {
          name: trimmedName,
          code: cleanCode,
          description: `Corporate operational role for ${trimmedName}`,
          isSystemDefault: isSuper,
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
    }

    await auditLogService.recordAuditEvent({
      module: "RBAC Security",
      actionType: "Corporate Role Created",
      severity: "Routine",
      entityTarget: existing.name,
      entityType: "Role",
      entityId: existing.id,
      changeSummary: `Created corporate role '${existing.name}' with initial permissions.`,
      newPayload: existing,
      reasonForChange: "Corporate role structure definition and permission provisioning.",
    });

    return existing;
  },

  async deleteRole(id: string) {
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Role not found", 404);
    }

    // Delete associated SystemRole permissions and SystemRole if exists and not default
    const sysRole = await prisma.systemRole.findFirst({
      where: {
        OR: [
          { name: { equals: existing.name, mode: "insensitive" } },
          { code: generateCode(existing.name) },
        ],
      },
    });

    if (sysRole && !sysRole.isSystemDefault) {
      await prisma.rolePermission.deleteMany({ where: { roleId: sysRole.id } });
      await prisma.systemRole.delete({ where: { id: sysRole.id } }).catch(() => null);
    }

    const deleted = await prisma.role.delete({ where: { id } });

    await auditLogService.recordAuditEvent({
      module: "RBAC Security",
      actionType: "Corporate Role Removed",
      severity: "Critical",
      entityTarget: existing.name,
      entityType: "Role",
      entityId: existing.id,
      changeSummary: `Corporate role '${existing.name}' revoked and purged from access matrix.`,
      priorPayload: existing,
      reasonForChange: "Administrative access governance revocation.",
    });

    return deleted;
  },
};
