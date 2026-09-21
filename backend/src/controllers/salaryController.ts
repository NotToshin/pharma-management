import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getSalariesByMonth = async (req: Request, res: Response): Promise<void> => {
  try {
    const month = (req.query.month as string) || "September 2026";
    const salaries = await prisma.salary.findMany({
      where: { payPeriod: month },
      include: { staff: { include: { role: true } } },
      orderBy: { effectiveDate: "desc" },
    });
    res.status(200).json(salaries);
  } catch (error: any) {
    console.error("Error fetching salaries:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

export const upsertSalary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      empId, 
      payPeriod, 
      baseSalary, 
      basicSalary, 
      houseRent, 
      medicalAllowance, 
      conveyanceTaDa, 
      salesIncentive, 
      specialBonus, 
      providentFund, 
      taxDeduction, 
      otherDeductions,
      leaveDays // <--- Correctly destructured here
    } = req.body;

    const staffMember = await prisma.staff.findUnique({ where: { empId } });
    if (!staffMember) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }

    const numericBase = Number(baseSalary ?? basicSalary) || 0;
    const numericRent = Number(houseRent) || 0;
    const numericMed = Number(medicalAllowance) || 0;
    const numericTaDa = Number(conveyanceTaDa) || 0;
    const numericInc = Number(salesIncentive) || 0;
    const numericBonus = Number(specialBonus) || 0;
    const numericPf = Number(providentFund) || 0;
    const numericTax = Number(taxDeduction) || 0;
    const numericOther = Number(otherDeductions) || 0;
    const numericLeaveDays = Number(leaveDays) || 0; // <--- Safely converted

    const gross = numericBase + numericRent + numericMed + numericTaDa + numericInc + numericBonus;
    const deductions = numericPf + numericTax + numericOther;
    const netPay = gross - deductions;

    const salaryRecord = await prisma.salary.upsert({
      where: {
        staffId_payPeriod: {
          staffId: staffMember.id,
          payPeriod: payPeriod || "September 2026",
        },
      },
      update: {
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
        effectiveDate: new Date(),
      },
      create: {
        staffId: staffMember.id,
        payPeriod: payPeriod || "September 2026",
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
        effectiveDate: new Date(),
      },
      include: { staff: { include: { role: true } } },
    });

    res.status(201).json(salaryRecord);
  } catch (error: any) {
    console.error("Error saving salary structure:", error);
    res.status(400).json({ error: error.message || "Failed to save salary record." });
  }
};

export const updateSalary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      baseSalary, 
      basicSalary, 
      houseRent, 
      medicalAllowance, 
      conveyanceTaDa, 
      salesIncentive, 
      specialBonus, 
      providentFund, 
      taxDeduction, 
      otherDeductions,
      leaveDays 
    } = req.body;
    
    const numericBase = Number(baseSalary ?? basicSalary) || 0;
    const numericRent = Number(houseRent) || 0;
    const numericMed = Number(medicalAllowance) || 0;
    const numericTaDa = Number(conveyanceTaDa) || 0;
    const numericInc = Number(salesIncentive) || 0;
    const numericBonus = Number(specialBonus) || 0;
    const numericPf = Number(providentFund) || 0;
    const numericTax = Number(taxDeduction) || 0;
    const numericOther = Number(otherDeductions) || 0;
    const numericLeaveDays = Number(leaveDays) || 0;

    const gross = numericBase + numericRent + numericMed + numericTaDa + numericInc + numericBonus;
    const deductions = numericPf + numericTax + numericOther;
    const netPay = gross - deductions;

    const updated = await prisma.salary.update({
      where: { id },
      data: {
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
      },
      include: { staff: { include: { role: true } } },
    });

    res.status(200).json(updated);
  } catch (error: any) {
    console.error("Error updating salary:", error);
    res.status(400).json({ error: error.message || "Failed to update salary" });
  }
};

export const deleteSalary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.salary.delete({ where: { id } });
    res.status(200).json({ message: "Salary record deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting salary:", error);
    res.status(500).json({ error: "Failed to delete salary record" });
  }
};