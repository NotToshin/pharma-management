import { Request, Response } from "express";
import { staffService } from "../services/staffService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getAllStaff = catchAsync(async (req: Request, res: Response) => {
  const staffList = await staffService.getAllStaff();
  sendResponse(res, 200, "Staff list retrieved successfully", staffList);
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