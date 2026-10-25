import { z } from "zod";

const expenseVoucherLineItemSchema = z.object({
  itemName: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitCostBDT: z.coerce.number().optional().nullable(),
  lineTotalBDT: z.coerce.number().optional().nullable(),
});

export const createVoucherSchema = z.object({
  body: z.object({
    voucherNo: z.string().optional(),
    payeeName: z.string().min(1, "Payee name is required"),
    payeeType: z.string().optional().default("General / Other"),
    wholesalerId: z.string().optional().nullable(),
    poNumber: z.string().optional().nullable(),
    category: z.string().min(1, "Category is required"),
    fundingSource: z.string().min(1, "Funding source is required"),
    sourceDetail: z.string().min(1, "Source detail is required"),
    financialAccountId: z.string().optional().nullable(),
    paymentMethod: z.string().optional().default("Cash"),
    chequeNumber: z.string().optional().nullable(),
    grossAmount: z.coerce.number().optional().nullable(),
    tdsRate: z.coerce.number().min(0).max(100).optional().default(0),
    tdsAmount: z.coerce.number().min(0).optional().default(0),
    vdsRate: z.coerce.number().min(0).max(100).optional().default(0),
    vdsAmount: z.coerce.number().min(0).optional().default(0),
    netAmount: z.coerce.number().optional().nullable(),
    amount: z.coerce.number().positive("Amount must be positive"),
    paymentDate: z.string().min(1, "Payment date is required"),
    notes: z.string().optional().or(z.literal("")),
    lineItems: z.array(expenseVoucherLineItemSchema).optional().default([]),
    status: z.enum(["Draft", "Pending Approval", "Approved", "Disbursed", "Rejected"]).optional().default("Disbursed"),
    preparedBy: z.string().optional().nullable(),
  }),
});

export const updateVoucherSchema = z.object({
  body: z.object({
    voucherNo: z.string().min(1).optional(),
    payeeName: z.string().min(1).optional(),
    payeeType: z.string().optional(),
    wholesalerId: z.string().optional().nullable(),
    poNumber: z.string().optional().nullable(),
    category: z.string().min(1).optional(),
    fundingSource: z.string().min(1).optional(),
    sourceDetail: z.string().min(1).optional(),
    financialAccountId: z.string().optional().nullable(),
    paymentMethod: z.string().optional(),
    chequeNumber: z.string().optional().nullable(),
    grossAmount: z.coerce.number().optional().nullable(),
    tdsRate: z.coerce.number().min(0).max(100).optional(),
    tdsAmount: z.coerce.number().min(0).optional(),
    vdsRate: z.coerce.number().min(0).max(100).optional(),
    vdsAmount: z.coerce.number().min(0).optional(),
    netAmount: z.coerce.number().optional().nullable(),
    amount: z.coerce.number().positive().optional(),
    paymentDate: z.string().min(1).optional(),
    notes: z.string().optional().or(z.literal("")),
    lineItems: z.array(expenseVoucherLineItemSchema).optional(),
    status: z.enum(["Draft", "Pending Approval", "Approved", "Disbursed", "Rejected"]).optional(),
    preparedBy: z.string().optional().nullable(),
    approvedBy: z.string().optional().nullable(),
    rejectionReason: z.string().optional().nullable(),
  }),
  params: z.object({
    id: z.string().min(1, "Voucher ID is required"),
  }),
});

export const authorizeVoucherSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Voucher ID is required"),
  }),
  body: z.object({
    action: z.enum(["approve", "disburse", "reject"]),
    chequeNumber: z.string().optional().nullable(),
    financialAccountId: z.string().optional().nullable(),
    paymentMethod: z.string().optional().nullable(),
    rejectionReason: z.string().optional().nullable(),
    approverName: z.string().optional().nullable(),
  }),
});

export const voucherIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Voucher ID is required"),
  }),
});

export const queryVoucherSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    payeeType: z.string().optional(),
    fundingSource: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export type CreateVoucherInput = z.infer<typeof createVoucherSchema>["body"];
export type UpdateVoucherInput = z.infer<typeof updateVoucherSchema>["body"];
export type AuthorizeVoucherInput = z.infer<typeof authorizeVoucherSchema>["body"];
export type QueryVoucherInput = z.infer<typeof queryVoucherSchema>["query"];