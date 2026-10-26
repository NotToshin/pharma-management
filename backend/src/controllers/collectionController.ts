import { Request, Response } from "express";
import { collectionService } from "../services/collectionService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getNextReceiptNumber = catchAsync(async (req: Request, res: Response) => {
  const nextNumber = await collectionService.getNextReceiptNumber();
  sendResponse(res, 200, "Next collection receipt number generated", { nextReceiptNo: nextNumber });
});

export const getCollectionMetrics = catchAsync(async (req: Request, res: Response) => {
  const metrics = await collectionService.getCollectionMetrics();
  sendResponse(res, 200, "Collection metrics retrieved successfully", metrics);
});

export const getAllCollections = catchAsync(async (req: Request, res: Response) => {
  const result = await collectionService.getAllCollections(req.query);
  sendResponse(res, 200, "Delivery collections retrieved successfully", result.collections, result.meta);
});

export const getCollectionById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const collection = await collectionService.getCollectionById(id);
  sendResponse(res, 200, "Collection receipt retrieved successfully", collection);
});

export const createCollection = catchAsync(async (req: Request, res: Response) => {
  const actorName =
    (req as any).user?.name ||
    (req.headers["x-user-name"] as string) ||
    "Finance Controller";

  const created = await collectionService.createCollection(req.body, actorName);
  sendResponse(res, 201, "Delivery collection recorded successfully", created);
});

export const updateCollection = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const actorName =
    (req as any).user?.name ||
    (req.headers["x-user-name"] as string) ||
    "Finance Controller";

  const updated = await collectionService.updateCollection(id, req.body, actorName);
  sendResponse(res, 200, "Collection receipt updated successfully", updated);
});

export const settleCollections = catchAsync(async (req: Request, res: Response) => {
  const actorName =
    (req as any).user?.name ||
    (req.headers["x-user-name"] as string) ||
    "Finance Controller";

  const result = await collectionService.settleAndClearCollections(req.body, actorName);
  sendResponse(res, 200, "Collections cleared and deposited to ledger successfully", result);
});

export const deleteCollection = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const actorName =
    (req as any).user?.name ||
    (req.headers["x-user-name"] as string) ||
    "Finance Controller";

  await collectionService.deleteCollection(id, actorName);
  sendResponse(res, 200, "Collection receipt deleted successfully");
});
