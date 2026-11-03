import { Request, Response } from "express";
import { staffService } from "../services/staffService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";
import { GetStaffQueryInput } from "../validations/staffValidation";

export const getAllStaff = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as GetStaffQueryInput;
  const result = await staffService.getAllStaff(query);
  sendResponse(res, 200, "Staff list retrieved successfully", result.rows, result.meta);
});

export const createStaff = catchAsync(async (req: Request, res: Response) => {
  const newStaff = await staffService.createStaff(req.body);
  sendResponse(res, 201, "Staff created successfully", newStaff);
});

export const updateStaff = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedStaff = await staffService.updateStaff(id, req.body);
  sendResponse(res, 200, "Staff updated successfully", updatedStaff);
});

export const deleteStaff = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await staffService.deleteStaff(id);
  sendResponse(res, 200, "Staff deleted successfully");
});
