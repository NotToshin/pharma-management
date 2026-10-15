import { Request, Response } from "express";
import { stockAdjustmentService } from "../services/stockAdjustmentService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getAllAdjustments = catchAsync(async (req: Request, res: Response) => {
  const { search, type, status } = req.query as { search?: string; type?: string; status?: string };
  const adjustments = await stockAdjustmentService.getAllAdjustments({ search, type, status });
  sendResponse(res, 200, "Stock adjustments retrieved successfully", adjustments);
});

export const getAdjustmentMetrics = catchAsync(async (req: Request, res: Response) => {
  const metrics = await stockAdjustmentService.getSummaryMetrics();
  sendResponse(res, 200, "Stock adjustments metrics retrieved successfully", metrics);
});

export const getAdjustmentById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adjustment = await stockAdjustmentService.getAdjustmentById(id);
  sendResponse(res, 200, "Stock adjustment details retrieved successfully", adjustment);
});

export const createAdjustment = catchAsync(async (req: Request, res: Response) => {
  const newAdjustment = await stockAdjustmentService.createAdjustment(req.body);
  sendResponse(res, 201, "Stock adjustment recorded successfully", newAdjustment);
});

export const updateAdjustment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedAdjustment = await stockAdjustmentService.updateAdjustment(id, req.body);
  sendResponse(res, 200, "Stock adjustment updated successfully", updatedAdjustment);
});

export const updateAdjustmentStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approvalStatus } = req.body;
  const updatedAdjustment = await stockAdjustmentService.updateStatus(id, approvalStatus);
  sendResponse(res, 200, "Stock adjustment status updated successfully", updatedAdjustment);
});

export const deleteAdjustment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deletedAdjustment = await stockAdjustmentService.deleteAdjustment(id);
  sendResponse(res, 200, "Stock adjustment deleted successfully", deletedAdjustment);
});
