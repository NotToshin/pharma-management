import { z } from "zod";

export const createInventoryBatchSchema = z.object({
  body: z.object({
    brandName: z.string().trim().min(1, "Commercial brand name is required"),
    genericName: z.string().trim().min(1, "Generic composition name is required"),
    category: z.string().trim().min(1, "Therapeutic category is required"),
    batchNumber: z.string().trim().min(1, "Batch number is required"),
    mfgDate: z
      .string()
      .trim()
      .min(1, "Manufacturing date is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Manufacturing date must be in YYYY-MM-DD format"),
    expiryDate: z
      .string()
      .trim()
      .min(1, "Expiry date is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry date must be in YYYY-MM-DD format"),
    availableUnits: z.coerce
      .number()
      .int("Available units must be an integer")
      .min(0, "Available units cannot be negative")
      .default(0),
    unitPrice: z.coerce
      .number()
      .min(0, "Unit price cannot be negative")
      .default(0),
    warehouseBin: z.string().trim().min(1, "Warehouse bin / shelf location is required"),
    storageCondition: z
      .enum(["Controlled Ambient (<25°C)", "Cold Chain (2-8°C)"])
      .default("Controlled Ambient (<25°C)"),
    skuCode: z.string().trim().optional(),
    supplierName: z.string().trim().optional(),
  }),
});

export const updateInventoryBatchSchema = z.object({
  body: z.object({
    brandName: z.string().trim().min(1, "Commercial brand name cannot be empty").optional(),
    genericName: z.string().trim().min(1, "Generic composition cannot be empty").optional(),
    category: z.string().trim().min(1, "Therapeutic category cannot be empty").optional(),
    batchNumber: z.string().trim().min(1, "Batch number cannot be empty").optional(),
    mfgDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Manufacturing date must be in YYYY-MM-DD format")
      .optional(),
    expiryDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry date must be in YYYY-MM-DD format")
      .optional(),
    availableUnits: z.coerce
      .number()
      .int("Available units must be an integer")
      .min(0, "Available units cannot be negative")
      .optional(),
    unitPrice: z.coerce
      .number()
      .min(0, "Unit price cannot be negative")
      .optional(),
    warehouseBin: z.string().trim().min(1, "Warehouse bin cannot be empty").optional(),
    storageCondition: z
      .enum(["Controlled Ambient (<25°C)", "Cold Chain (2-8°C)"])
      .optional(),
    skuCode: z.string().trim().optional(),
    supplierName: z.string().trim().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Batch ID is required"),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    type: z.enum(["IN", "OUT", "DAMAGE"]),
    quantity: z.coerce.number().int("Quantity must be an integer").positive("Adjustment quantity must be a positive number"),
    reason: z.string().trim().optional(),
    authorizedBy: z.string().trim().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Batch ID is required"),
  }),
});

export const quarantineBatchSchema = z.object({
  body: z.object({
    action: z.enum(["QUARANTINE", "RELEASE"]),
    reason: z.string().trim().min(3, "Justification reason of at least 3 characters is required"),
    targetBin: z.string().trim().optional(),
    authorizedBy: z.string().trim().optional(),
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

export const queryInventorySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    fefoStatus: z.string().optional(),
    storageCondition: z.string().optional(),
    sort: z.string().optional(),
  }).optional(),
});

export type CreateInventoryBatchInput = z.infer<typeof createInventoryBatchSchema>["body"];
export type UpdateInventoryBatchInput = z.infer<typeof updateInventoryBatchSchema>["body"];
export type AdjustStockInput = z.infer<typeof adjustStockSchema>["body"];
export type QuarantineBatchInput = z.infer<typeof quarantineBatchSchema>["body"];