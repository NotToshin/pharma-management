import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "ak_pharma_secure_jwt_secret_2026";

// Initial default role definitions if database is empty
const SEED_ROLES = [
  {
    name: "Super Administrator / Management",
    code: "SUPER_ADMIN",
    description: "Unrestricted master operational rights across statutory audits, financial releases, and user provisioning.",
    isSystemDefault: true,
    permissions: [
      { module: "Doctor Registry", category: "Clinical", read: true, create: true, edit: true, delete: true, specialAction: "Re-rank Category Tiers", specialGranted: true },
      { module: "FEFO Stock Control", category: "Warehouse", read: true, create: true, edit: true, delete: true, specialAction: "Quarantine / Write-off Batch", specialGranted: true },
      { module: "Sales & Dispatch", category: "Logistics", read: true, create: true, edit: true, delete: true, specialAction: "Override Credit Hold", specialGranted: true },
      { module: "Accounts & Collections", category: "Finance", read: true, create: true, edit: true, delete: true, specialAction: "Authorize Bank Release", specialGranted: true },
      { module: "Staff & Payroll", category: "Human Resources", read: true, create: true, edit: true, delete: true, specialAction: "Issue Appointment Letters", specialGranted: true },
    ],
  },
  {
    name: "Regional Sales Manager (RSM)",
    code: "RSM_EXEC",
    description: "Division-level field force governance, target allocations, and doctor engagement monitoring.",
    isSystemDefault: true,
    permissions: [
      { module: "Doctor Registry", category: "Clinical", read: true, create: true, edit: true, delete: false, specialAction: "Re-rank Category Tiers", specialGranted: true },
      { module: "FEFO Stock Control", category: "Warehouse", read: true, create: false, edit: false, delete: false, specialAction: "Quarantine / Write-off Batch", specialGranted: false },
      { module: "Sales & Dispatch", category: "Logistics", read: true, create: true, edit: true, delete: false, specialAction: "Override Credit Hold", specialGranted: false },
      { module: "Accounts & Collections", category: "Finance", read: true, create: false, edit: false, delete: false, specialAction: "Authorize Bank Release", specialGranted: false },
      { module: "Staff & Payroll", category: "Human Resources", read: true, create: false, edit: false, delete: false, specialAction: "Issue Appointment Letters", specialGranted: false },
    ],
  },
  {
    name: "Medical Information Officer (MIO)",
    code: "MIO_FIELD",
    description: "Prescription detailing logs, territory doctor calls, order booking, and field payment realization entries.",
    isSystemDefault: true,
    permissions: [
      { module: "Doctor Registry", category: "Clinical", read: true, create: true, edit: true, delete: false, specialAction: "Re-rank Category Tiers", specialGranted: false },
      { module: "FEFO Stock Control", category: "Warehouse", read: true, create: false, edit: false, delete: false, specialAction: "Quarantine / Write-off Batch", specialGranted: false },
      { module: "Sales & Dispatch", category: "Logistics", read: true, create: true, edit: false, delete: false, specialAction: "Override Credit Hold", specialGranted: false },
      { module: "Accounts & Collections", category: "Finance", read: true, create: true, edit: false, delete: false, specialAction: "Authorize Bank Release", specialGranted: false },
      { module: "Staff & Payroll", category: "Human Resources", read: false, create: false, edit: false, delete: false, specialAction: "Issue Appointment Letters", specialGranted: false },
    ],
  },
  {
    name: "Accounts & Finance Controller",
    code: "FIN_CONTROLLER",
    description: "Bank reconciliations, payment vouchers, A/R collections, and payroll electronic advice authorization.",
    isSystemDefault: true,
    permissions: [
      { module: "Doctor Registry", category: "Clinical", read: true, create: false, edit: false, delete: false, specialAction: "Re-rank Category Tiers", specialGranted: false },
      { module: "FEFO Stock Control", category: "Warehouse", read: true, create: false, edit: false, delete: false, specialAction: "Quarantine / Write-off Batch", specialGranted: false },
      { module: "Sales & Dispatch", category: "Logistics", read: true, create: false, edit: true, delete: false, specialAction: "Override Credit Hold", specialGranted: true },
      { module: "Accounts & Collections", category: "Finance", read: true, create: true, edit: true, delete: true, specialAction: "Authorize Bank Release", specialGranted: true },
      { module: "Staff & Payroll", category: "Human Resources", read: true, create: true, edit: true, delete: false, specialAction: "Issue Appointment Letters", specialGranted: false },
    ],
  },
  {
    name: "Warehouse & Cold-Chain Lead",
    code: "WH_LOGISTICS",
    description: "FEFO bin tracking, batch quarantine locks, delivery challan verification, and temperature audits.",
    isSystemDefault: true,
    permissions: [
      { module: "Doctor Registry", category: "Clinical", read: false, create: false, edit: false, delete: false, specialAction: "Re-rank Category Tiers", specialGranted: false },
      { module: "FEFO Stock Control", category: "Warehouse", read: true, create: true, edit: true, delete: false, specialAction: "Quarantine / Write-off Batch", specialGranted: true },
      { module: "Sales & Dispatch", category: "Logistics", read: true, create: true, edit: true, delete: false, specialAction: "Override Credit Hold", specialGranted: false },
      { module: "Accounts & Collections", category: "Finance", read: false, create: false, edit: false, delete: false, specialAction: "Authorize Bank Release", specialGranted: false },
      { module: "Staff & Payroll", category: "Human Resources", read: false, create: false, edit: false, delete: false, specialAction: "Issue Appointment Letters", specialGranted: false },
    ],
  },
];

// Helper to seed initial roles if table is empty
async function ensureRolesSeeded() {
  const count = await prisma.systemRole.count();
  if (count === 0) {
    for (const r of SEED_ROLES) {
      await prisma.systemRole.create({
        data: {
          name: r.name,
          code: r.code,
          description: r.description,
          isSystemDefault: r.isSystemDefault,
          permissions: {
            create: r.permissions,
          },
        },
      });
    }
  }
}

// Helper to seed initial Super Admin operator if no user exists
async function ensureAdminUserSeeded() {
  await ensureRolesSeeded();
  const userCount = await prisma.systemUser.count();
  if (userCount === 0) {
    const adminRole = await prisma.systemRole.findUnique({
      where: { code: "SUPER_ADMIN" },
    });
    if (adminRole) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash("admin123456", salt);

      await prisma.systemUser.create({
        data: {
          name: "Toshin Bin Azad (Super Admin)",
          email: "toshin@admin.com",
          passwordHash,
          roleId: adminRole.id,
          territory: "Dhaka Central HQ",
          status: "Active",
        },
      });
    }
  }
}

// 1. GET /api/rbac/roles — Fetch all roles & associated permissions
export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureRolesSeeded();
    const roles = await prisma.systemRole.findMany({
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const mapped = roles.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description,
      isSystemDefault: r.isSystemDefault,
      userCount: r._count.users,
      permissions: r.permissions,
    }));

    res.status(200).json(mapped);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

// 2. PUT /api/rbac/roles/:id/permissions — Update role permissions matrix
export const updateRolePermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      res.status(400).json({ error: "Permissions array required" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      for (const p of permissions) {
        await tx.rolePermission.upsert({
          where: {
            roleId_module: {
              roleId: id,
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
            roleId: id,
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
    });

    res.status(200).json({ message: "Role permissions saved successfully" });
  } catch (error: any) {
    console.error("Error updating role permissions:", error);
    res.status(500).json({ error: error.message || "Failed to update permissions" });
  }
};

// 3. GET /api/rbac/users — Fetch all provisioned database users
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureAdminUserSeeded();
    const users = await prisma.systemUser.findMany({
      include: {
        role: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const sanitized = users.map((u) => ({
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

    res.status(200).json(sanitized);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// 4. POST /api/rbac/users — Provision new operator user with Bcrypt hash
export const provisionUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, roleCode, territory } = req.body;

    if (!name || !email || !password || !roleCode) {
      res.status(400).json({ error: "Name, email, password, and role are required." });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    const existing = await prisma.systemUser.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      res.status(400).json({ error: "An operator with this email is already provisioned." });
      return;
    }

    const role = await prisma.systemRole.findUnique({ where: { code: roleCode } });
    if (!role) {
      res.status(404).json({ error: `Specified role '${roleCode}' does not exist.` });
      return;
    }

    // Secure password hashing using salt rounds = 12
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

    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      roleCode: newUser.role.code,
      roleName: newUser.role.name,
      territory: newUser.territory,
      status: newUser.status,
      lastLogin: newUser.lastLogin,
      message: "Operator account provisioned successfully.",
    });
  } catch (error: any) {
    console.error("Error provisioning user:", error);
    res.status(500).json({ error: error.message || "Failed to provision user" });
  }
};

// 5. DELETE /api/rbac/users/:id — Remove operator account
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.systemUser.deleteMany({ where: { id } });
    res.status(200).json({ message: "Operator deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete operator" });
  }
};

// 6. PUT /api/rbac/users/:id/status — Toggle Active / Restricted status
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.systemUser.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const nextStatus = user.status === "Active" ? "Restricted" : "Active";
    const updated = await prisma.systemUser.update({
      where: { id },
      data: { status: nextStatus },
    });

    res.status(200).json({ status: updated.status });
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle user status" });
  }
};

// 7. POST /api/auth/login — Enterprise Login Endpoint (Closed Registration)
export const loginOperator = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureAdminUserSeeded();

    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up by clean email OR match to toshin@admin.com if user types toshin@admin
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
      res.status(401).json({ error: "Invalid credentials. Contact IT for access." });
      return;
    }

    if (user.status === "Restricted") {
      res.status(403).json({ error: "This operator account is currently restricted. Contact management." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials. Contact IT for access." });
      return;
    }

    // Update session timestamp
    const nowStr = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    await prisma.systemUser.update({
      where: { id: user.id },
      data: { lastLogin: nowStr },
    });

    // Sign JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        roleCode: user.role.code,
        territory: user.territory,
      },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.status(200).json({
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
    });
  } catch (error: any) {
    console.error("Login authentication error:", error);
    res.status(500).json({ error: "Internal authentication error" });
  }
};
