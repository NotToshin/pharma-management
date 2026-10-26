import { Request, Response } from "express";
import { territoryAnalyticsService } from "../services/territoryAnalyticsService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getTerritoryAnalytics = catchAsync(async (req: Request, res: Response) => {
  const options = {
    division: req.query.division as string | undefined,
    searchTerm: (req.query.searchTerm || req.query.search || req.query.q) as string | undefined,
    status: req.query.status as string | undefined,
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: (req.query.sortOrder || "desc") as "asc" | "desc",
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10,
  };
  const analytics = await territoryAnalyticsService.getTerritoryAnalytics(options);
  sendResponse(
    res,
    200,
    "Territory sales analytics retrieved successfully",
    analytics,
    analytics.pagination
  );
});

export const syncRealisticBaseline = catchAsync(async (req: Request, res: Response) => {
  const result = await territoryAnalyticsService.syncRealisticBaseline();
  sendResponse(res, 200, "Territory baseline synced successfully", result);
});
