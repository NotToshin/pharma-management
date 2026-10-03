import { Request, Response } from "express";
import { inventoryService } from "../services/inventoryService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getAllBatches = catchAsync(async (req: Request, res: Response) => {
  const batches = await inventoryService.getAllBatches();
  sendResponse(res, 200, "Inventory batches retrieved successfully", batches);
});

export const createBatch = catchAsync(async (req: Request, res: Response) => {
  const {
    brandName,
    genericName,
    category,
    batchNumber,
    mfgDate,
    expiryDate,
    availableUnits,
    unitPrice,
    warehouseBin,
    storageCondition,
  } = req.body;

  const newBatch = await inventoryService.createBatch({
    brandName,
    genericName,
    category,
    batchNumber,
    mfgDate,
    expiryDate,
    availableUnits: availableUnits ? Math.max(0, parseInt(availableUnits, 10) || 0) : undefined,
    unitPrice: unitPrice ? Number(unitPrice) || 0 : undefined,
    warehouseBin,
    storageCondition,
  });

  sendResponse(res, 201, "Inventory batch created successfully", newBatch);
});

export const updateBatch = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    brandName,
    genericName,
    category,
    batchNumber,
    mfgDate,
    expiryDate,
    availableUnits,
    unitPrice,
    warehouseBin,
    storageCondition,
  } = req.body;

  const updated = await inventoryService.updateBatch(id, {
    brandName,
    genericName,
    category,
    batchNumber,
    mfgDate,
    expiryDate,
    availableUnits: availableUnits !== undefined ? Math.max(0, parseInt(availableUnits, 10) || 0) : undefined,
    unitPrice: unitPrice !== undefined ? Number(unitPrice) || 0 : undefined,
    warehouseBin,
    storageCondition,
  });

  sendResponse(res, 200, "Inventory batch updated successfully", updated);
});

export const adjustStock = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, quantity } = req.body;
  const qty = parseInt(quantity, 10);

  if (isNaN(qty) || qty <= 0) {
    return sendResponse(res, 400, "Valid adjustment quantity is required");
  }

  if (!["IN", "OUT"].includes(type)) {
    return sendResponse(res, 400, "Invalid adjustment type. Must be 'IN' or 'OUT'");
  }

  const updated = await inventoryService.adjustStock(id, type, qty);
  sendResponse(res, 200, "Stock adjusted successfully", updated);
});

export const deleteBatch = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const count = await inventoryService.deleteBatch(id);

  if (count === 0) {
    return sendResponse(res, 200, "Record was not in database or already deleted");
  }

  sendResponse(res, 200, "Inventory batch removed successfully");
});