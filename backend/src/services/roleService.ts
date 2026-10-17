import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";
import { ALL_SYSTEM_MODULES, generateCode } from "./rbacService";

const prisma = new PrismaClient();

const DEFAULT_ROLES = [
  "Medical Information Officer",
  "Sales Representative",
  "Accountant",
  "Human Resource",
  "Area Manager",
  "Product Executive",
  "Regional Sales Manager",
  "Warehouse Officer",
  "Super Administrator",
];

export const roleService = {
  async getAllRoles() {
    let roles = await prisma.role.findMany({
      include: {
        _count: { select: { staff: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (roles.length === 0) {
      for (const name of DEFAULT_ROLES) {
        await prisma.role.create({
          data: {
            name,
            permissions: ["VIEW_DASHBOARD"],
          },
        });
      }
      roles = await prisma.role.findMany({
        include: {
          _count: { select: { staff: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }

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
            read: isSuper ? true : mod.module === "Executive Dashboard",
            create: isSuper,
            edit: isSuper,
            delete: isSuper,
            specialAction: mod.specialAction,
            specialGranted: isSuper,
          },
        });
      }
    }

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

    return prisma.role.delete({ where: { id } });
  },
};
