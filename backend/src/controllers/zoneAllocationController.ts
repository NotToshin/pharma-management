import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendResponse } from "../utils/response";
import { pick } from "../utils/pick";
import { paginationFields } from "../utils/paginationHelper";
import {
  zoneAllocationService,
  zoneAllocationFilterableFields,
} from "../services/zoneAllocationService";

export const getAllAllocations = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, zoneAllocationFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);

  const result = await zoneAllocationService.getAllAllocations(
    filters as any,
    paginationOptions as any
  );

  sendResponse(
    res,
    200,
    "MIO zone allocations retrieved successfully",
    result.data,
    result.meta
  );
});

export const getStaffMios = catchAsync(async (req: Request, res: Response) => {
  const staffMios = await zoneAllocationService.getAllStaffMios();
  sendResponse(
    res,
    200,
    "Staff MIO directory retrieved successfully",
    staffMios
  );
});

export const createAllocation = catchAsync(async (req: Request, res: Response) => {
  const allocation = await zoneAllocationService.createAllocation(req.body);
  sendResponse(
    res,
    201,
    "MIO zone allocation created successfully",
    allocation
  );
});

export const updateAllocation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await zoneAllocationService.updateAllocation(id, req.body);
  sendResponse(
    res,
    200,
    "MIO zone allocation updated successfully",
    updated
  );
});

export const deleteAllocation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await zoneAllocationService.deleteAllocation(id);
  sendResponse(
    res,
    200,
    "MIO zone allocation deleted successfully",
    deleted
  );
});
