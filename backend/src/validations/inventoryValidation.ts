import { z } from "zod";

export const createInventoryBatchSchema = z.object({
  body: z.object({
    brandName: z.string().min(1, "Brand name is required"),
    genericName: z.string().min(1, "Generic name is required"),
    category: z.string().min(1, "Category is required"),
    batchNumber: z.string().min(1, "Batch number is required"),
    mfgDate: z.string().min(1, "Manufacturing date is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    availableUnits: z.coerce.number().int().min(0).optional().default(0),
    unitPrice: z.coerce.number().min(0).optional().default(0),
    warehouseBin: z.string().optional().or(z.literal("")),
    storageCondition: z.string().optional().or(z.literal("")),
  }),
});

export const updateInventoryBatchSchema = z.object({
  body: z.object({
    brandName: z.string().min(1).optional(),
    genericName: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    batchNumber: z.string().min(1).optional(),
    mfgDate: z.string().min(1).optional(),
    expiryDate: z.string().min(1).optional(),
    availableUnits: z.coerce.number().int().min(0).optional(),
    unitPrice: z.coerce.number().min(0).optional(),
    warehouseBin: z.string().optional().or(z.literal("")),
    storageCondition: z.string().optional().or(z.literal("")),
  }),
  params: z.object({
    id: z.string().min(1, "Batch ID is required"),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    type: z.enum(["IN", "OUT"]).refine((val) => ["IN", "OUT"].includes(val), "Type must be 'IN' or 'OUT'"),
    quantity: z.coerce.number().int().positive("Quantity must be a positive integer"),
  }),
  params: z.object({
    id: z.string().min(1, "Batch ID is required"),
  }),
});

export const batchIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Batch ID is required"),
  }),
});

export type CreateInventoryBatchInput = z.infer<typeof createInventoryBatchSchema>["body"];
export type UpdateInventoryBatchInput = z.infer<typeof updateInventoryBatchSchema>["body"];
export type AdjustStockInput = z.infer<typeof adjustStockSchema>["body"];