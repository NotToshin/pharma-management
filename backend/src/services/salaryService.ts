import { PaymentStatus } from "@prisma/client";
import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";
import { GetSalariesQueryInput } from "../validations/salaryValidation";

interface SalaryInput {
  empId: string;
  payPeriod: string;
  baseSalary?: number;
  basicSalary?: number;
  houseRent?: number;
  medicalAllowance?: number;
  conveyanceTaDa?: number;
  salesIncentive?: number;
  specialBonus?: number;
  providentFund?: number;
  taxDeduction?: number;
  otherDeductions?: number;
  leaveDays?: number;
  paymentStatus?: PaymentStatus;
  status?: string;
}

interface SalaryUpdateInput {
  baseSalary?: number;
  basicSalary?: number;
  houseRent?: number;
  medicalAllowance?: number;
  conveyanceTaDa?: number;
  salesIncentive?: number;
  specialBonus?: number;
  providentFund?: number;
  taxDeduction?: number;
  otherDeductions?: number;
  leaveDays?: number;
  paymentStatus?: PaymentStatus;
  status?: string;
}

const resolvePaymentStatus = (statusStr?: string): PaymentStatus | undefined => {
  if (!statusStr) return undefined;
  const s = statusStr.trim().toUpperCase();
  if (s === "PAID" || s === "DISBURSED") return PaymentStatus.PAID;
  if (s === "PROCESSING") return PaymentStatus.PROCESSING;
  if (s === "PENDING" || s === "DRAFT") return PaymentStatus.PENDING;
  return undefined;
};

const SALARY_SORT_FIELDS = [
  "effectiveDate",
  "createdAt",
  "baseSalary",
  "netPay",
  "payPeriod",
  "houseRent",
  "medicalAllowance",
  "conveyanceTaDa",
  "paymentStatus",
] as const;

/**
 * Maps the UI status filter ("all" | "Draft" | "Disbursed" | "Processing") onto
 * paymentStatus conditions. The old client-side "Draft" tab kept Processing rows too.
 */
const resolveSalaryListStatusFilter = (value?: string) => {
  if (!value || value.trim().toLowerCase() === "all") return undefined;
  const v = value.trim().toUpperCase();
  if (v === "PAID" || v === "DISBURSED") {
    return { paymentStatus: PaymentStatus.PAID };
  }
  if (v === "PENDING" || v === "DRAFT") {
    return { paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] } };
  }
  if (v === "PROCESSING") {
    return { paymentStatus: PaymentStatus.PROCESSING };
  }
  return undefined;
};

const calculateNetPay = (data: Partial<SalaryInput>) => {
  const numericBase = Number(data.baseSalary ?? data.basicSalary) || 0;
  const numericRent = Number(data.houseRent) || 0;
  const numericMed = Number(data.medicalAllowance) || 0;
  const numericTaDa = Number(data.conveyanceTaDa) || 0;
  const numericInc = Number(data.salesIncentive) || 0;
  const numericBonus = Number(data.specialBonus) || 0;
  const numericPf = Number(data.providentFund) || 0;
  const numericTax = Number(data.taxDeduction) || 0;
  const numericOther = Number(data.otherDeductions) || 0;
  const numericLeaveDays = Number(data.leaveDays) || 0;

  const gross = numericBase + numericRent + numericMed + numericTaDa + numericInc + numericBonus;
  const deductions = numericPf + numericTax + numericOther;
  const netPay = gross - deductions;

  return {
    baseSalary: numericBase,
    houseRent: numericRent,
    medicalAllowance: numericMed,
    conveyanceTaDa: numericTaDa,
    salesIncentive: numericInc,
    specialBonus: numericBonus,
    providentFund: numericPf,
    taxDeduction: numericTax,
    otherDeductions: numericOther,
    leaveDays: numericLeaveDays,
    netPay,
  };
};

export const salaryService = {
  async getSalariesByMonth(query: GetSalariesQueryInput) {
    const month = query.month || "September 2026";
    const where: any = { payPeriod: month };

    const statusWhere = resolveSalaryListStatusFilter(query.status);
    if (statusWhere) {
      Object.assign(where, statusWhere);
    }

    const staffConditions: any[] = [];

    if (query.department && query.department.trim().toLowerCase() !== "all") {
      staffConditions.push({
        department: { equals: query.department, mode: "insensitive" },
      });
    }

    const searchValue = (query.search || query.searchTerm || "").trim();
    if (searchValue) {
      staffConditions.push({
        OR: [
          { fullName: { contains: searchValue, mode: "insensitive" } },
          { empId: { contains: searchValue, mode: "insensitive" } },
          { department: { contains: searchValue, mode: "insensitive" } },
          { territory: { contains: searchValue, mode: "insensitive" } },
          { role: { is: { name: { contains: searchValue, mode: "insensitive" } } } },
        ],
      });
    }

    if (staffConditions.length > 0) {
      where.staff = {
        is: staffConditions.length === 1 ? staffConditions[0] : { AND: staffConditions },
      };
    }

    const rawLimit = query.limit;
    const hasLimit =
      rawLimit !== undefined &&
      rawLimit.trim() !== "" &&
      rawLimit.trim().toLowerCase() !== "all" &&
      rawLimit.trim() !== "-1";
    const page = Math.max(1, parseInt(query.page || "1", 10) || 1);
    const parsedLimit = hasLimit ? parseInt(rawLimit, 10) : NaN;
    const limit =
      isNaN(parsedLimit) || parsedLimit <= 0 ? 0 : Math.min(200, parsedLimit);
    const skip = limit > 0 ? (page - 1) * limit : 0;

    const sortBy = (SALARY_SORT_FIELDS as readonly string[]).includes(query.sortBy || "")
      ? (query.sortBy as string)
      : "effectiveDate";
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

    const [total, rows] = await Promise.all([
      prisma.salary.count({ where }),
      prisma.salary.findMany({
        where,
        include: { staff: { include: { role: true } } },
        orderBy: { [sortBy]: sortOrder },
        ...(limit > 0 ? { skip, take: limit } : {}),
      }),
    ]);

    return {
      rows,
      meta: {
        total,
        page,
        limit: limit > 0 ? limit : total,
        totalPage: limit > 0 ? Math.ceil(total / limit) || 1 : 1,
      },
    };
  },

  async upsertSalary(data: SalaryInput) {
    const staffMember = await prisma.staff.findUnique({ where: { empId: data.empId } });
    if (!staffMember) {
      throw new AppError("Staff member not found", 404);
    }

    const calculated = calculateNetPay(data);
    const payPeriod = data.payPeriod || "September 2026";
    const statusEnum = resolvePaymentStatus(data.paymentStatus || data.status) || PaymentStatus.PENDING;

    const result = await prisma.salary.upsert({
      where: {
        staffId_payPeriod: {
          staffId: staffMember.id,
          payPeriod,
        },
      },
      update: {
        ...calculated,
        ...(data.paymentStatus || data.status ? { paymentStatus: statusEnum } : {}),
        effectiveDate: new Date(),
      },
      create: {
        staffId: staffMember.id,
        payPeriod,
        ...calculated,
        paymentStatus: statusEnum,
        effectiveDate: new Date(),
      },
      include: { staff: { include: { role: true } } },
    });

    await auditLogService.recordAuditEvent({
      module: "Workforce & HR",
      actionType: "Salary Structure Established",
      severity: "Routine",
      entityTarget: `${staffMember.fullName} (${staffMember.empId}) - ${payPeriod}`,
      entityType: "Salary",
      entityId: result.id,
      changeSummary: `Set salary pay structure for '${staffMember.fullName}' (${payPeriod}): Net ৳${result.netPay.toLocaleString()}.`,
      newPayload: result,
      reasonForChange: "Monthly payroll structure establishment and compensation review.",
    });

    return result;
  },

  async updateSalary(id: string, data: SalaryUpdateInput) {
    const existing = await prisma.salary.findUnique({
      where: { id },
      include: { staff: true },
    });
    if (!existing) {
      throw new AppError("Salary record not found", 404);
    }

    // Safely merge only provided fields to prevent overwriting with 0
    const mergedData: Partial<SalaryInput> = {
      baseSalary: data.baseSalary !== undefined ? data.baseSalary : (data.basicSalary !== undefined ? data.basicSalary : existing.baseSalary),
      houseRent: data.houseRent !== undefined ? data.houseRent : existing.houseRent,
      medicalAllowance: data.medicalAllowance !== undefined ? data.medicalAllowance : existing.medicalAllowance,
      conveyanceTaDa: data.conveyanceTaDa !== undefined ? data.conveyanceTaDa : existing.conveyanceTaDa,
      salesIncentive: data.salesIncentive !== undefined ? data.salesIncentive : existing.salesIncentive,
      specialBonus: data.specialBonus !== undefined ? data.specialBonus : existing.specialBonus,
      providentFund: data.providentFund !== undefined ? data.providentFund : existing.providentFund,
      taxDeduction: data.taxDeduction !== undefined ? data.taxDeduction : existing.taxDeduction,
      otherDeductions: data.otherDeductions !== undefined ? data.otherDeductions : existing.otherDeductions,
      leaveDays: data.leaveDays !== undefined ? data.leaveDays : existing.leaveDays,
    };

    const calculated = calculateNetPay(mergedData);
    const statusEnum = resolvePaymentStatus(data.paymentStatus || data.status);

    const updated = await prisma.salary.update({
      where: { id },
      data: {
        ...calculated,
        ...(statusEnum ? { paymentStatus: statusEnum } : {}),
      },
      include: { staff: { include: { role: true } } },
    });

    await auditLogService.recordAuditEvent({
      module: "Workforce & HR",
      actionType: "Salary Structure Revised",
      severity: "Routine",
      entityTarget: `${existing.staff?.fullName || "Staff"} (${existing.payPeriod})`,
      entityType: "Salary",
      entityId: updated.id,
      changeSummary: `Revised salary structure for '${existing.staff?.fullName || "Staff"}': Net changed to ৳${updated.netPay.toLocaleString()}.`,
      priorPayload: existing,
      newPayload: updated,
      reasonForChange: "Compensation adjustment / salary revision.",
    });

    return updated;
  },

  async generatePayrollForMonth(payPeriod: string) {
    const allStaff = await prisma.staff.findMany({
      where: { status: "ACTIVE" },
      include: {
        salaries: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        role: true,
      },
    });

    const createdRecords = [];

    for (const staff of allStaff) {
      const existing = await prisma.salary.findUnique({
        where: {
          staffId_payPeriod: {
            staffId: staff.id,
            payPeriod,
          },
        },
      });

      if (!existing) {
        const lastSalary = staff.salaries[0];
        const baseSalary = lastSalary ? lastSalary.baseSalary : 25000;
        const houseRent = lastSalary ? lastSalary.houseRent : baseSalary * 0.5;
        const medicalAllowance = lastSalary ? lastSalary.medicalAllowance : 3500;
        const conveyanceTaDa = lastSalary ? lastSalary.conveyanceTaDa : 15000;
        const providentFund = lastSalary ? lastSalary.providentFund : baseSalary * 0.1;
        const taxDeduction = lastSalary ? lastSalary.taxDeduction : 1000;

        const calculated = calculateNetPay({
          empId: staff.empId,
          payPeriod,
          baseSalary,
          houseRent,
          medicalAllowance,
          conveyanceTaDa,
          salesIncentive: 0,
          specialBonus: 0,
          providentFund,
          taxDeduction,
          otherDeductions: 0,
          leaveDays: 0,
        });

        const newSalary = await prisma.salary.create({
          data: {
            staffId: staff.id,
            payPeriod,
            ...calculated,
            paymentStatus: PaymentStatus.PENDING,
            effectiveDate: new Date(),
          },
          include: { staff: { include: { role: true } } },
        });

        createdRecords.push(newSalary);
      }
    }

    return createdRecords;
  },

  async deleteSalary(id: string) {
    const existing = await prisma.salary.findUnique({
      where: { id },
      include: { staff: true },
    });
    if (!existing) {
      throw new AppError("Salary record not found", 404);
    }
    const deleted = await prisma.salary.delete({ where: { id } });

    await auditLogService.recordAuditEvent({
      module: "Workforce & HR",
      actionType: "Salary Record Removed",
      severity: "Critical",
      entityTarget: `${existing.staff?.fullName || "Staff"} (${existing.payPeriod})`,
      entityType: "Salary",
      entityId: existing.id,
      changeSummary: `Deleted salary compensation record for '${existing.staff?.fullName || "Staff"}' (${existing.payPeriod}).`,
      priorPayload: existing,
      reasonForChange: "Salary record purge / payroll rectification.",
    });

    return deleted;
  },
};