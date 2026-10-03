import { Request, Response } from "express";
import { dashboardService } from "../services/dashboardService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getDashboardTelemetry = catchAsync(async (req: Request, res: Response) => {
  const telemetry = await dashboardService.getDashboardTelemetry();
  sendResponse(res, 200, "Dashboard telemetry retrieved successfully", telemetry);
});