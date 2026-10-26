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
  const salaryRecord = await salaryService.upsertSalary(req.body);
  sendResponse(res, 201, "Salary record saved successfully", salaryRecord);
});

export const updateSalary = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await salaryService.updateSalary(id, req.body);
  sendResponse(res, 200, "Salary updated successfully", updated);
});

export const generatePayrollForMonth = catchAsync(async (req: Request, res: Response) => {
  const { payPeriod } = req.body;
  const createdRecords = await salaryService.generatePayrollForMonth(payPeriod);
  sendResponse(
    res,
    201,
    `Payroll generated for ${createdRecords.length} staff member(s) for ${payPeriod}`,
    createdRecords
  );
});

export const deleteSalary = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await salaryService.deleteSalary(id);
  sendResponse(res, 200, "Salary record deleted successfully");
});