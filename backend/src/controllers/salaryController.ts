import { Request, Response } from "express";
import { salaryService } from "../services/salaryService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getSalariesByMonth = catchAsync(async (req: Request, res: Response) => {
  const month = (req.query.month as string) || "September 2026";
  const salaries = await salaryService.getSalariesByMonth(month);
  sendResponse(res, 200, "Salaries retrieved successfully", salaries);
});

export const upsertSalary = catchAsync(async (req: Request, res: Response) => {
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
    leaveDays,
  } = req.body;

  const salaryRecord = await salaryService.upsertSalary({
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
    leaveDays,
  });

  sendResponse(res, 201, "Salary record saved successfully", salaryRecord);
});

export const updateSalary = catchAsync(async (req: Request, res: Response) => {
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
    leaveDays,
  } = req.body;

  const updated = await salaryService.updateSalary(id, {
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
    leaveDays,
  });

  sendResponse(res, 200, "Salary updated successfully", updated);
});

export const deleteSalary = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await salaryService.deleteSalary(id);
  sendResponse(res, 200, "Salary record deleted successfully");
});