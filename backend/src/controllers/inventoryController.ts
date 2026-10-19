import { Request, Response } from "express";
import { inventoryService } from "../services/inventoryService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";
import { getActorContext } from "../utils/requestContext";

function resolveActorContext(req: Request) {
  const asyncContext = getActorContext();
  const headerEmail = req.headers["x-user-email"] as string | undefined;
  const headerName = req.headers["x-user-name"] as string | undefined;
  const headerRole = req.headers["x-user-role"] as string | undefined;

  return {
    name: headerName || asyncContext?.name || "Warehouse Lead",
    email: headerEmail || asyncContext?.email || "warehouse@akpharma.com",
    role: headerRole || asyncContext?.role || "Inventory Control Officer",
  };
}

export const getAllBatches = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as {
    search?: string;
    category?: string;
    fefoStatus?: string;
    storageCondition?: string;
    sort?: string;
  };
  const batches = await inventoryService.getAllBatches(query);
  sendResponse(res, 200, "Inventory batches retrieved successfully", batches, {
    total: batches.length,
  });
});

export const getInventoryStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await inventoryService.getInventoryStats();
  sendResponse(res, 200, "Inventory summary metrics computed successfully", stats);
});

export const getBatchById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const batch = await inventoryService.getBatchById(id);
  sendResponse(res, 200, "Inventory batch details retrieved successfully", batch);
});

export const createBatch = catchAsync(async (req: Request, res: Response) => {
  const actor = resolveActorContext(req);
  const newBatch = await inventoryService.createBatch(req.body, actor);
  sendResponse(res, 201, "Inventory batch received and registered successfully", newBatch);
});

export const updateBatch = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const actor = resolveActorContext(req);
  const updated = await inventoryService.updateBatch(id, req.body, actor);
  sendResponse(res, 200, "Inventory batch details updated successfully", updated);
});

export const adjustStock = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, quantity, reason, authorizedBy } = req.body;
  const actor = resolveActorContext(req);

  const updated = await inventoryService.adjustStock(
    id,
    type,
    Number(quantity),
    reason,
    authorizedBy,
    actor
  );
  sendResponse(res, 200, `Stock adjustment (${type}) applied successfully`, updated);
});

export const quarantineBatch = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, reason, targetBin, authorizedBy } = req.body;
  const actor = resolveActorContext(req);

  const updated = await inventoryService.quarantineBatch(
    id,
    action,
    reason,
    targetBin,
    authorizedBy,
    actor
  );

  const message =
    action === "QUARANTINE"
      ? "Batch quarantined and removed from active pick orders successfully"
      : "Batch released from quarantine and restored to active pick bay";

  sendResponse(res, 200, message, updated);
});

export const deleteBatch = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const actor = resolveActorContext(req);
  const deletedBatch = await inventoryService.deleteBatch(id, actor);
  sendResponse(res, 200, "Inventory batch removed permanently from ledger", deletedBatch);
});