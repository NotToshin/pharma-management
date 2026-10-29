import { Request, Response } from "express";
import { settlementService, SettlementDirection } from "../services/settlementService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

const actorNameFrom = (req: Request) =>
  (req as Request & { user?: { name?: string } }).user?.name ||
  (req.headers["x-user-name"] as string) ||
  "Finance Controller";

export const getOpenBills = catchAsync(async (req: Request, res: Response) => {
  const direction = req.query.direction as SettlementDirection;
  const partyName = typeof req.query.partyName === "string" ? req.query.partyName : undefined;
  const result = await settlementService.getOpenBills(direction, partyName);
  sendResponse(res, 200, "Open bills retrieved successfully", result);
});

export const getSettlements = catchAsync(async (req: Request, res: Response) => {
  const result = await settlementService.getSettlements({
    direction: req.query.direction as SettlementDirection,
    page: typeof req.query.page === "string" ? req.query.page : undefined,
    limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    partyName: typeof req.query.partyName === "string" ? req.query.partyName : undefined,
  });
  sendResponse(res, 200, "Payments retrieved successfully", result.settlements, {
    ...result.meta,
    summary: result.summary,
  });
});

export const createSettlement = catchAsync(async (req: Request, res: Response) => {
  const created = await settlementService.createSettlement(req.body, actorNameFrom(req));
  const label = req.body.direction === "OUTGOING" ? "Supplier payment recorded" : "Payment recorded";
  sendResponse(res, 201, label, created);
});

export const reverseSettlement = catchAsync(async (req: Request, res: Response) => {
  const updated = await settlementService.reverseSettlement(req.params.id, actorNameFrom(req));
  sendResponse(res, 200, "Payment reversed and balances restored", updated);
});

export const deleteSettlement = catchAsync(async (req: Request, res: Response) => {
  await settlementService.deleteSettlement(req.params.id, actorNameFrom(req));
  sendResponse(res, 200, "Payment deleted successfully");
});
