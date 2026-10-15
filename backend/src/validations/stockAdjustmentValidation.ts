import { z } from "zod";

export const createStockAdjustmentSchema = z.object({
  body: z.object({
    adjustmentRef: z.string().optional(),
    date: z.string().optional(),
    skuCode: z.string().min(1, "SKU code is required"),
    formulationName: z.string().min(1, "Formulation name is required"),
    batchNumber: z.string().min(1, "Batch number is required"),
    warehouseLocation: z.string().min(1, "Warehouse location is required"),
    type: z.string().min(1, "Adjustment type is required"),
    quantity: z.coerce.number().refine((val) => val !== 0, "Quantity cannot be zero"),
    unitCostBDT: z.coerce.number().min(0, "Unit cost must be non-negative"),
    totalImpactBDT: z.coerce.number().optional(),
    reasonCode: z.string().min(1, "Reason code is required"),
    authorizedBy: z.string().optional(),
    approvalStatus: z.enum(["Approved & Adjusted", "Pending Review", "Rejected"]).optional().default("Approved & Adjusted"),
  }),
});

export const updateStockAdjustmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Adjustment ID is required"),
  }),
  body: z.object({
    adjustmentRef: z.string().optional(),
    date: z.string().optional(),
    skuCode: z.string().min(1).optional(),
    formulationName: z.string().min(1).optional(),
    batchNumber: z.string().min(1).optional(),
    warehouseLocation: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    quantity: z.coerce.number().refine((val) => val !== 0, "Quantity cannot be zero").optional(),
    unitCostBDT: z.coerce.number().min(0).optional(),
    totalImpactBDT: z.coerce.number().optional(),
    reasonCode: z.string().min(1).optional(),
    authorizedBy: z.string().optional(),
    approvalStatus: z.enum(["Approved & Adjusted", "Pending Review", "Rejected"]).optional(),
  }),
});

export const updateStockAdjustmentStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Adjustment ID is required"),
  }),
  body: z.object({
    approvalStatus: z.enum(["Approved & Adjusted", "Pending Review", "Rejected"], {
      message: "Status must be Approved & Adjusted, Pending Review, or Rejected",
    }),
  }),
});

export const stockAdjustmentIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Adjustment ID is required"),
  }),
});

export const queryStockAdjustmentSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
  }).optional(),
});

export type CreateStockAdjustmentInput = z.infer<typeof createStockAdjustmentSchema>["body"];
export type UpdateStockAdjustmentInput = z.infer<typeof updateStockAdjustmentSchema>["body"];
