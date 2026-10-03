import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
}

const calculateNetPay = (data: SalaryInput) => {
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
  async getSalariesByMonth(month: string) {
    return prisma.salary.findMany({
      where: { payPeriod: month },
      include: { staff: { include: { role: true } } },
      orderBy: { effectiveDate: "desc" },
    });
  },

  async upsertSalary(data: SalaryInput) {
    const staffMember = await prisma.staff.findUnique({ where: { empId: data.empId } });
    if (!staffMember) {
      throw new Error("Staff member not found");
    }

    const calculated = calculateNetPay(data);
    const payPeriod = data.payPeriod || "September 2026";

    return prisma.salary.upsert({
      where: {
        staffId_payPeriod: {
          staffId: staffMember.id,
          payPeriod,
        },
      },
      update: {
        ...calculated,
        effectiveDate: new Date(),
      },
      create: {
        staffId: staffMember.id,
        payPeriod,
        ...calculated,
        effectiveDate: new Date(),
      },
      include: { staff: { include: { role: true } } },
    });
  },

  async updateSalary(id: string, data: SalaryUpdateInput) {
    const calculated = calculateNetPay(data as SalaryInput);

    return prisma.salary.update({
      where: { id },
      data: {
        ...calculated,
      },
      include: { staff: { include: { role: true } } },
    });
  },

  async deleteSalary(id: string) {
    return prisma.salary.delete({ where: { id } });
  },
};