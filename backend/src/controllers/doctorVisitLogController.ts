import { Request, Response } from "express";
import {
  doctorVisitLogService,
  visitLogFilterableFields,
} from "../services/doctorVisitLogService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";
import { pick } from "../utils/pick";
import { paginationFields } from "../utils/paginationHelper";

export const getAllVisitLogs = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, visitLogFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);

  const result = await doctorVisitLogService.getAllVisitLogs(
    filters as any,
    paginationOptions as any
  );
  sendResponse(
    res,
    200,
    "Doctor visit logs retrieved successfully",
    result.data,
    result.meta
  );
});

export const getVisitLogById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const log = await doctorVisitLogService.getVisitLogById(id);
  sendResponse(res, 200, "Doctor visit log retrieved successfully", log);
});

export const createVisitLog = catchAsync(async (req: Request, res: Response) => {
  const newLog = await doctorVisitLogService.createVisitLog(req.body);
  sendResponse(res, 201, "Doctor visit log created successfully", newLog);
});

export const updateVisitLog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedLog = await doctorVisitLogService.updateVisitLog(id, req.body);
  sendResponse(res, 200, "Doctor visit log updated successfully", updatedLog);
});

export const deleteVisitLog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await doctorVisitLogService.deleteVisitLog(id);
  sendResponse(res, 200, "Doctor visit log deleted successfully");
});
