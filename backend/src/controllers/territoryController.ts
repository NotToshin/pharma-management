import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendResponse } from "../utils/response";
import { territoryService } from "../services/territoryService";

export const getAllTerritories = catchAsync(async (req: Request, res: Response) => {
  const territories = await territoryService.getAllTerritories();
  sendResponse(res, 200, "Territories retrieved successfully", territories);
});

export const createTerritory = catchAsync(async (req: Request, res: Response) => {
  const newTerritory = await territoryService.createTerritory(req.body);
  sendResponse(res, 201, "Territory created successfully", newTerritory);
});
