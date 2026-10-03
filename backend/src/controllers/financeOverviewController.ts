import { Request, Response } from "express";
import { financeOverviewService } from "../services/financeOverviewService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getFinancialOverview = catchAsync(async (req: Request, res: Response) => {
  const yearParam = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
  const monthParam = req.query.month !== undefined ? parseInt(req.query.month as string, 10) : undefined;

  const overview = await financeOverviewService.getFinancialOverview({
    year: yearParam,
    month: monthParam,
  });

  sendResponse(res, 200, "Financial overview retrieved successfully", overview);
});