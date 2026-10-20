import { z } from "zod";

export const createCollectionSchema = z.object({
  body: z.object({
    receiptNo: z.string().optional(),
    invoiceNo: z.string().min(1, "Invoice number is required"),
    orderId: z.string().optional().nullable(),
    clientCode: z.string().optional().nullable(),
    chemistName: z.string().min(1, "Chemist name is required"),
    territory: z.string().min(1, "Territory is required"),
    salesRepName: z.string().min(1, "Sales representative name is required"),
    totalInvoiceAmount: z.coerce.number().positive("Total invoice amount must be positive"),
    amountCollected: z.coerce.number().positive("Collected amount must be positive"),
    dueAmountRemaining: z.coerce.number().min(0).optional().default(0),
    collectionDate: z.string().optional(),
    paymentMethod: z.enum(["Cash", "Cheque", "BEFTN / RTGS", "bKash / Nagad"]).optional().default("Cash"),
    chequeNumber: z.string().optional().nullable(),
    status: z
      .enum(["Pending Vault Clearance", "Cleared & Deposited", "Bounced / Rejected"])
      .optional()
      .default("Pending Vault Clearance"),
    destinationType: z.enum(["Cash Drawer", "Bank Account"]).optional().default("Cash Drawer"),
    destinationName: z.string().optional().default("Head Office Cash Safe"),
    financialAccountId: z.string().optional().nullable(),
    notes: z.string().optional().or(z.literal("")),
  }),
});

export const updateCollectionSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Collection ID is required"),
  }),
  body: z.object({
    receiptNo: z.string().optional(),
    invoiceNo: z.string().min(1).optional(),
    orderId: z.string().optional().nullable(),
    clientCode: z.string().optional().nullable(),
    chemistName: z.string().min(1).optional(),
    territory: z.string().min(1).optional(),
    salesRepName: z.string().min(1).optional(),
    totalInvoiceAmount: z.coerce.number().positive().optional(),
    amountCollected: z.coerce.number().positive().optional(),
    dueAmountRemaining: z.coerce.number().min(0).optional(),
    collectionDate: z.string().optional(),
    paymentMethod: z.enum(["Cash", "Cheque", "BEFTN / RTGS", "bKash / Nagad"]).optional(),
    chequeNumber: z.string().optional().nullable(),
    status: z.enum(["Pending Vault Clearance", "Cleared & Deposited", "Bounced / Rejected"]).optional(),
    destinationType: z.enum(["Cash Drawer", "Bank Account"]).optional(),
    destinationName: z.string().optional(),
    financialAccountId: z.string().optional().nullable(),
    notes: z.string().optional().or(z.literal("")),
  }),
});

export const settleBulkCollectionSchema = z.object({
  body: z.object({
    collectionIds: z.array(z.string()).min(1, "At least one collection ID is required"),
    destinationType: z.enum(["Cash Drawer", "Bank Account"]),
    destinationName: z.string().min(1, "Destination name is required"),
    financialAccountId: z.string().optional().nullable(),
    paymentMethod: z.string().optional(),
    clearedBy: z.string().optional().nullable(),
    notes: z.string().optional(),
  }),
});

export const collectionIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Collection ID is required"),
  }),
});

export const queryCollectionSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    territory: z.string().optional(),
    paymentMethod: z.string().optional(),
    salesRep: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>["body"];
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>["body"];
export type SettleBulkCollectionInput = z.infer<typeof settleBulkCollectionSchema>["body"];
export type QueryCollectionInput = z.infer<typeof queryCollectionSchema>["query"];
