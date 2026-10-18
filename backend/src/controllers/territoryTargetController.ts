import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendResponse } from "../utils/response";
import { territoryTargetService } from "../services/territoryTargetService";

export const getAllTargets = catchAsync(async (req: Request, res: Response) => {
  const { fiscalYear, territory } = req.query as { fiscalYear?: string; territory?: string };
  const data = await territoryTargetService.getAllTargets({ fiscalYear, territory });
  sendResponse(res, 200, "Territory targets retrieved successfully", data);
});

export const getTargetOptions = catchAsync(async (_req: Request, res: Response) => {
  const options = await territoryTargetService.getTargetOptions();
  sendResponse(res, 200, "Territory target options retrieved successfully", options);
});

export const createTarget = catchAsync(async (req: Request, res: Response) => {
  const newTarget = await territoryTargetService.createTarget(req.body);
  sendResponse(res, 201, "Territory target created successfully", newTarget);
});

export const updateTarget = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedTarget = await territoryTargetService.updateTarget(id, req.body);
  sendResponse(res, 200, "Territory target updated successfully", updatedTarget);
});

export const deleteTarget = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await territoryTargetService.deleteTarget(id);
  sendResponse(res, 200, "Territory target deleted successfully", result);
});
