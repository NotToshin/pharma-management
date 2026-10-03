import { PrismaClient, StaffStatus } from "@prisma/client";

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
    empId: string;
    fullName: string;
    phone: string;
    email?: string;
    nidNumber?: string;
    fathersName?: string;
    mothersName?: string;
    address?: string;
    department?: string;
    designation?: string;
    employmentStatus?: string;
    supervisor?: string;
    salary?: number;
  }) {
    const defaultRole = await getOrCreateRole(data.designation || data.department || "General Staff");
    const numericSalary = Number(data.salary) || 20000;
    const dbStatus = mapStatusToDb(data.employmentStatus);

    return prisma.staff.create({
      data: {
        empId: data.empId,
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
        territory: "Dhaka",
        role: { connect: { id: defaultRole.id } },
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
    employmentStatus?: string;
    supervisor?: string;
    status?: string;
  }) {
    const resolvedStatus = mapStatusToDb(data.status || data.employmentStatus);

    let roleConnect = undefined;
    if (data.designation) {
      const foundRole = await getOrCreateRole(data.designation);
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
    return prisma.staff.delete({ where: { id } });
  },
};