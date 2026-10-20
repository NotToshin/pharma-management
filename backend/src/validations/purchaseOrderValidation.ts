import { z } from "zod";

export const purchaseOrderItemSchema = z.object({
  no: z.coerce.number().optional(),
  skuCode: z.string().optional().nullable(),
  drugName: z.string().min(1, "Drug formulation name is required"),
  genericName: z.string().optional().nullable(),
  packSize: z.string().optional().nullable(),
  quantityOrdered: z.coerce.number().min(1, "Ordered quantity must be at least 1"),
  quantityReceived: z.coerce.number().min(0).optional().default(0),
  unitCostBDT: z.coerce.number().min(0, "Unit cost must be non-negative"),
  totalCostBDT: z.coerce.number().optional(),
  storageRequirement: z.string().optional().default("Controlled Ambient (<25°C)"),
});

export const createPurchaseOrderSchema = z.object({
  body: z.object({
    poNumber: z.string().optional(),
    poDate: z.string().optional(),
    expectedDeliveryDate: z.string().optional().nullable(),
    wholesalerName: z.string().min(1, "Wholesaler name is required"),
    wholesalerCode: z.string().optional().nullable(),
    contactPerson: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    wholesalerAddress: z.string().optional().nullable(),
    deliveryWarehouse: z.string().optional().default("Main Distribution Bay - Tejgaon Central"),
    paymentTerms: z.string().optional().default("Net 30 Days"),
    items: z.array(purchaseOrderItemSchema).min(1, "At least one order item is required"),
    discountBDT: z.coerce.number().min(0).optional().default(0),
    taxBDT: z.coerce.number().min(0).optional().default(0),
    priority: z
      .enum(["Routine", "Urgent / Stockout Risk", "Emergency Cold-Chain"])
      .optional()
      .default("Routine"),
    status: z
      .enum(["Draft", "Submitted", "Approved", "Partially Received", "Received", "Cancelled"])
      .optional()
      .default("Draft"),
    approvalStage: z.string().optional().default("Procurement Officer Review"),
    requisitionRef: z.string().optional().nullable(),
    shippingTerms: z.string().optional().default("FOB Central Depot"),
    notes: z.string().optional().nullable(),
    createdBy: z.string().optional().nullable(),
  }),
});

export const updatePurchaseOrderSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Purchase order ID is required"),
  }),
  body: z.object({
    expectedDeliveryDate: z.string().optional().nullable(),
    wholesalerName: z.string().min(1).optional(),
    wholesalerCode: z.string().optional().nullable(),
    contactPerson: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    wholesalerAddress: z.string().optional().nullable(),
    deliveryWarehouse: z.string().optional(),
    paymentTerms: z.string().optional(),
    items: z.array(purchaseOrderItemSchema).optional(),
    discountBDT: z.coerce.number().min(0).optional(),
    taxBDT: z.coerce.number().min(0).optional(),
    priority: z.enum(["Routine", "Urgent / Stockout Risk", "Emergency Cold-Chain"]).optional(),
    status: z
      .enum(["Draft", "Submitted", "Approved", "Partially Received", "Received", "Cancelled"])
      .optional(),
    approvalStage: z.string().optional(),
    requisitionRef: z.string().optional().nullable(),
    shippingTerms: z.string().optional(),
    notes: z.string().optional().nullable(),
  }),
});

export const updatePurchaseOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Purchase order ID is required"),
  }),
  body: z.object({
    status: z.enum(["Draft", "Submitted", "Approved", "Partially Received", "Received", "Cancelled"], {
      message: "Invalid status value",
    }),
    approvalStage: z.string().optional(),
    notes: z.string().optional(),
    approvedBy: z.string().optional(),
  }),
});

export const receivedItemDetailSchema = z.object({
  no: z.coerce.number().optional(),
  skuCode: z.string().optional().nullable(),
  drugName: z.string().min(1, "Drug name is required"),
  quantityToReceive: z.coerce.number().optional(),
  quantityReceived: z.coerce.number().optional(),
  batchNumber: z.string().min(1, "Batch number is required for receiving inventory"),
  mfgDate: z.string().optional(),
  expiryDate: z.string().optional(),
  warehouseBin: z.string().optional().default("Receiving Bay Dock 1"),
  storageCondition: z.string().optional().default("Controlled Ambient (<25°C)"),
  unitPrice: z.coerce.number().optional(),
  unitCostBDT: z.coerce.number().optional(),
}).transform((data) => ({
  ...data,
  quantityToReceive: data.quantityToReceive ?? data.quantityReceived ?? 1,
}));

export const receiveStockSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Purchase order ID is required"),
  }),
  body: z.object({
    receivedItems: z.array(receivedItemDetailSchema).optional(),
    items: z.array(receivedItemDetailSchema).optional(),
    challanNumber: z.string().optional().nullable(),
    deliveryChallan: z.string().optional().nullable(),
    receivedBy: z.string().optional(),
    notes: z.string().optional(),
    updateInventoryBatches: z.boolean().optional(),
    syncWithInventory: z.boolean().optional(),
  }).transform((data) => ({
    receivedItems: data.receivedItems || data.items || [],
    challanNumber: data.challanNumber || data.deliveryChallan || null,
    receivedBy: data.receivedBy || "Dock Receiving Officer",
    notes: data.notes || "",
    updateInventoryBatches: data.updateInventoryBatches ?? data.syncWithInventory ?? true,
  })).refine((data) => data.receivedItems.length > 0, {
    message: "At least one received item is required",
    path: ["receivedItems"],
  }),
});

export const purchaseOrderIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Purchase order ID is required"),
  }),
});

export const queryPurchaseOrderSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    wholesaler: z.string().optional(),
  }),
});

// Wholesaler registry schemas
export const createWholesalerSchema = z.object({
  body: z.object({
    wholesalerCode: z.string().optional(),
    name: z.string().min(1, "Wholesaler name is required"),
    contactPerson: z.string().min(1, "Contact person is required"),
    phone: z.string().min(1, "Phone number is required"),
    email: z.string().email("Valid email required").or(z.literal("")).optional().nullable(),
    drugLicenseNo: z.string().min(1, "Drug license number is required"),
    tradeLicense: z.string().optional().nullable(),
    address: z.string().min(1, "Address is required"),
    territory: z.string().optional().default("Dhaka Metro"),
    paymentTerms: z.string().optional().default("Net 30 Days"),
    rating: z.coerce.number().min(1).max(5).optional().default(5.0),
    status: z.enum(["Active", "Under Review", "Blacklisted"]).optional().default("Active"),
    leadTimeDays: z.coerce.number().min(1).optional().default(3),
    suppliedCategories: z.array(z.string()).optional().default([]),
  }),
});

export const updateWholesalerSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Wholesaler ID is required"),
  }),
  body: z.object({
    wholesalerCode: z.string().optional(),
    name: z.string().min(1).optional(),
    contactPerson: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().email("Valid email required").or(z.literal("")).optional().nullable(),
    drugLicenseNo: z.string().min(1).optional(),
    tradeLicense: z.string().optional().nullable(),
    address: z.string().min(1).optional(),
    territory: z.string().optional(),
    paymentTerms: z.string().optional(),
    rating: z.coerce.number().min(1).max(5).optional(),
    status: z.enum(["Active", "Under Review", "Blacklisted"]).optional(),
    leadTimeDays: z.coerce.number().min(1).optional(),
    suppliedCategories: z.array(z.string()).optional(),
  }),
});

export const wholesalerIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Wholesaler ID is required"),
  }),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>["body"];
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>["body"];
export type ReceiveStockInput = z.infer<typeof receiveStockSchema>["body"];
export type CreateWholesalerInput = z.infer<typeof createWholesalerSchema>["body"];
export type UpdateWholesalerInput = z.infer<typeof updateWholesalerSchema>["body"];
