import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";

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

    const existing = await prisma.role.findFirst({
      where: {
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.role.create({
      data: {
        name: trimmedName,
        permissions: data.permissions || ["VIEW_DASHBOARD"],
      },
    });
  },

  async deleteRole(id: string) {
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Role not found", 404);
    }
    return prisma.role.delete({ where: { id } });
  },
};
