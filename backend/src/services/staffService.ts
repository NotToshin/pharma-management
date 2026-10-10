import { PrismaClient, StaffStatus } from "@prisma/client";
import { AppError } from "../errors";

const prisma = new PrismaClient();

const mapStatusToDb = (status?: string): StaffStatus => {
  if (!status) return StaffStatus.ACTIVE;
  const inputStatus = status.toLowerCase();
  if (inputStatus === "probationary" || inputStatus === "probation") return StaffStatus.PROBATION;
  if (inputStatus === "on leave" || inputStatus === "on_leave") return StaffStatus.ON_LEAVE;
  if (inputStatus === "suspended") return StaffStatus.SUSPENDED;
  return StaffStatus.ACTIVE;
};

const getOrCreateRole = async (name: string) => {
  let role = await prisma.role.findFirst({ where: { name } });
  if (!role) {
    role = await prisma.role.create({
      data: { name, permissions: ["VIEW_DASHBOARD"] },
    });
  }
  return role;
};

const generateNextEmpId = async (): Promise<string> => {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const prefix = currentYear;

  const allStaff = await prisma.staff.findMany({
    select: { empId: true },
  });

  let maxSeq = 0;

  for (const s of allStaff) {
    if (s.empId && s.empId.startsWith(prefix)) {
      const numPart = s.empId.slice(prefix.length);
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const paddedSeq = nextSeq.toString().padStart(3, "0");
  return `${prefix}${paddedSeq}`;
};

export const staffService = {
  async getAllStaff() {
    return prisma.staff.findMany({
      include: {
        role: true,
        salaries: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async createStaff(data: {
    empId?: string;
    fullName: string;
    phone: string;
    email?: string;
    nidNumber?: string;
    fathersName?: string;
    mothersName?: string;
    address?: string;
    department?: string;
    designation?: string;
    roleId?: string;
    roleName?: string;
    employmentStatus?: string;
    supervisor?: string;
    territory?: string;
    joiningDate?: string | Date;
    salary?: number;
  }) {
    let finalEmpId = data.empId?.trim();
    if (!finalEmpId) {
      finalEmpId = await generateNextEmpId();
    } else {
      const existing = await prisma.staff.findUnique({ where: { empId: finalEmpId } });
      if (existing) {
        finalEmpId = await generateNextEmpId();
      }
    }

    let targetRole = null;
    if (data.roleId && data.roleId.trim()) {
      targetRole = await prisma.role.findUnique({ where: { id: data.roleId.trim() } });
    }
    if (!targetRole) {
      const nameToUse = data.roleName || data.designation || data.department || "General Staff";
      targetRole = await getOrCreateRole(nameToUse);
    }

    const numericSalary = Number(data.salary) || 20000;
    const dbStatus = mapStatusToDb(data.employmentStatus);

    return prisma.staff.create({
      data: {
        empId: finalEmpId,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        nidNumber: data.nidNumber || "N/A",
        fathersName: data.fathersName || "N/A",
        mothersName: data.mothersName || "N/A",
        address: data.address || "N/A",
        department: data.department || "General",
        supervisor: data.supervisor || "Toshin Bin Azad (Head of HR)",
        status: dbStatus,
        territory: data.territory || "Dhaka",
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
        role: { connect: { id: targetRole.id } },
        salaries: {
          create: {
            payPeriod: "September 2026",
            baseSalary: numericSalary,
            houseRent: numericSalary * 0.5,
            medicalAllowance: 3500,
            conveyanceTaDa: 15000,
            netPay: numericSalary,
            effectiveDate: new Date(),
          },
        },
      },
      include: {
        role: true,
        salaries: true,
      },
    });
  },

  async updateStaff(id: string, data: {
    fullName?: string;
    phone?: string;
    email?: string;
    nidNumber?: string;
    fathersName?: string;
    mothersName?: string;
    address?: string;
    department?: string;
    designation?: string;
    roleId?: string;
    roleName?: string;
    employmentStatus?: string;
    supervisor?: string;
    status?: string;
    territory?: string;
  }) {
    const existing = await prisma.staff.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Staff member not found", 404);
    }

    const resolvedStatus = mapStatusToDb(data.status || data.employmentStatus);

    let roleConnect = undefined;
    if (data.roleId && data.roleId.trim()) {
      roleConnect = { connect: { id: data.roleId.trim() } };
    } else if (data.roleName || data.designation) {
      const foundRole = await getOrCreateRole(data.roleName || data.designation!);
      roleConnect = { connect: { id: foundRole.id } };
    }

    return prisma.staff.update({
      where: { id },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        nidNumber: data.nidNumber,
        fathersName: data.fathersName,
        mothersName: data.mothersName,
        address: data.address,
        department: data.department,
        territory: data.territory,
        supervisor: data.supervisor || null,
        status: resolvedStatus,
        ...(roleConnect ? { role: roleConnect } : {}),
      },
      include: {
        role: true,
        salaries: true,
      },
    });
  },

  async deleteStaff(id: string) {
    const existing = await prisma.staff.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Staff member not found", 404);
    }
    await prisma.salary.deleteMany({ where: { staffId: id } });
    return prisma.staff.delete({ where: { id } });
  },
};