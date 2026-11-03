import { Request, Response } from "express";
import { financeOverviewService } from "../services/financeOverviewService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getFinancialOverview = catchAsync(async (req: Request, res: Response) => {
  const { transactionsMeta, ...overview } = await financeOverviewService.getFinancialOverview(
    req.query as { year?: string; month?: string; page?: string; limit?: string; sortBy?: string; sortOrder?: "asc" | "desc"; search?: string; searchTerm?: string; type?: string }
  );

  sendResponse(res, 200, "Financial overview retrieved successfully", overview, transactionsMeta);
});