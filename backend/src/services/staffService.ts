import { StaffStatus } from "@prisma/client";
import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";

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
  const currentYear = new Date().getFullYear().toString();
  const prefix = `AKP-${currentYear}-`;
  const legacyPrefix = currentYear.slice(-2);
  const idPattern = new RegExp(`^(?:${prefix}|${legacyPrefix})(\\d{3,})$`);

  const allStaff = await prisma.staff.findMany({
    select: { empId: true },
  });

  let maxSeq = 0;

  for (const s of allStaff) {
    const match = s.empId?.match(idPattern);
    if (match) {
      const parsed = parseInt(match[1], 10);
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
    workSchedule?: string;
    emergencyName?: string;
    emergencyRelationship?: string;
    emergencyPhone?: string;
  }) {
    let finalEmpId = data.empId?.trim();
    const empIdPattern = new RegExp(`^AKP-${new Date().getFullYear()}-\\d{3,}$`);
    if (!finalEmpId || !empIdPattern.test(finalEmpId)) {
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
      if (!targetRole) {
        throw new AppError("Selected role not found", 400);
      }
    }
    if (!targetRole) {
      const nameToUse = data.roleName?.trim() || data.designation?.trim();
      if (!nameToUse) {
        throw new AppError("Please select a role", 400);
      }
      targetRole = await getOrCreateRole(nameToUse);
    }

    const numericSalary = Number(data.salary) || 20000;
    const dbStatus = mapStatusToDb(data.employmentStatus);

    const newStaff = await prisma.staff.create({
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
        workSchedule: data.workSchedule ?? null,
        emergencyName: data.emergencyName ?? null,
        emergencyRelationship: data.emergencyRelationship ?? null,
        emergencyPhone: data.emergencyPhone ?? null,
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

    await auditLogService.recordAuditEvent({
      module: "Workforce & HR",
      actionType: "Staff Member Onboarded",
      severity: "Routine",
      entityTarget: `${newStaff.fullName} (${newStaff.empId})`,
      entityType: "Staff",
      entityId: newStaff.id,
      changeSummary: `Onboarded personnel '${newStaff.fullName}' (ID: ${newStaff.empId}) into ${newStaff.department} department (${newStaff.territory}).`,
      newPayload: newStaff,
      reasonForChange: "Workforce personnel onboarding and compensation allocation.",
    });

    return newStaff;
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
    joiningDate?: string | Date;
    workSchedule?: string;
    emergencyName?: string;
    emergencyRelationship?: string;
    emergencyPhone?: string;
  }) {
    const existing = await prisma.staff.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Staff member not found", 404);
    }

    const resolvedStatus = data.status || data.employmentStatus
      ? mapStatusToDb(data.status || data.employmentStatus)
      : undefined;

    let roleConnect = undefined;
    if (data.roleId && data.roleId.trim()) {
      roleConnect = { connect: { id: data.roleId.trim() } };
    } else if (data.roleName || data.designation) {
      const foundRole = await getOrCreateRole(data.roleName || data.designation!);
      roleConnect = { connect: { id: foundRole.id } };
    }

    const updated = await prisma.staff.update({
      where: { id },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email === undefined ? undefined : data.email || null,
        nidNumber: data.nidNumber,
        fathersName: data.fathersName,
        mothersName: data.mothersName,
        address: data.address,
        department: data.department,
        territory: data.territory,
        supervisor: data.supervisor === undefined ? undefined : data.supervisor || null,
        workSchedule: data.workSchedule,
        emergencyName: data.emergencyName,
        emergencyRelationship: data.emergencyRelationship,
        emergencyPhone: data.emergencyPhone,
        status: resolvedStatus,
        ...(data.joiningDate ? { joiningDate: new Date(data.joiningDate) } : {}),
        ...(roleConnect ? { role: roleConnect } : {}),
      },
      include: {
        role: true,
        salaries: true,
      },
    });

    await auditLogService.recordAuditEvent({
      module: "Workforce & HR",
      actionType: "Staff Profile Updated",
      severity: "Routine",
      entityTarget: `${updated.fullName} (${updated.empId})`,
      entityType: "Staff",
      entityId: updated.id,
      changeSummary: `Updated profile details for '${updated.fullName}' (ID: ${updated.empId}). Status: ${updated.status}.`,
      priorPayload: existing,
      newPayload: updated,
      reasonForChange: "Workforce administrative record update.",
    });

    return updated;
  },

  async deleteStaff(id: string) {
    const existing = await prisma.staff.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Staff member not found", 404);
    }
    await prisma.salary.deleteMany({ where: { staffId: id } });
    const deleted = await prisma.staff.delete({ where: { id } });

    await auditLogService.recordAuditEvent({
      module: "Workforce & HR",
      actionType: "Staff Member Offboarded",
      severity: "Critical",
      entityTarget: `${existing.fullName} (${existing.empId})`,
      entityType: "Staff",
      entityId: existing.id,
      changeSummary: `Offboarded and purged personnel '${existing.fullName}' (ID: ${existing.empId}) and associated salary records.`,
      priorPayload: existing,
      reasonForChange: "Personnel separation and HR archive purge.",
    });

    return deleted;
  },
};
