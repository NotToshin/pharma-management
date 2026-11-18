import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendResponse } from "../utils/response";
import { territoryService } from "../services/territoryService";
import type { TerritoryQuery } from "../validations/territoryValidation";

export const getAllTerritories = catchAsync(async (req: Request, res: Response) => {
  const result = await territoryService.listTerritories(req.query as TerritoryQuery);
  sendResponse(res, 200, "Territories retrieved successfully", result.data, result.meta);
});

export const updateTerritory = catchAsync(async (req: Request, res: Response) => {
  const territory = await territoryService.updateTerritory(req.params.id, req.body);
  sendResponse(res, 200, "Territory updated successfully", territory);
});

export const deleteTerritory = catchAsync(async (req: Request, res: Response) => {
  const territory = await territoryService.deleteTerritory(req.params.id);
  sendResponse(res, 200, "Territory deleted successfully", territory);
});

export const createTerritory = catchAsync(async (req: Request, res: Response) => {
  const newTerritory = await territoryService.createTerritory(req.body);
  sendResponse(res, 201, "Territory created successfully", newTerritory);
});
