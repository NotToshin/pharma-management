import { z } from "zod";

export const createVoucherSchema = z.object({
  body: z.object({
    voucherNo: z.string().min(1, "Voucher number is required"),
    payeeName: z.string().min(1, "Payee name is required"),
    category: z.string().min(1, "Category is required"),
    fundingSource: z.string().min(1, "Funding source is required"),
    sourceDetail: z.string().min(1, "Source detail is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    paymentDate: z.string().min(1, "Payment date is required"),
    notes: z.string().optional().or(z.literal("")),
  }),
});

export const updateVoucherSchema = z.object({
  body: z.object({
    voucherNo: z.string().min(1).optional(),
    payeeName: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    fundingSource: z.string().min(1).optional(),
    sourceDetail: z.string().min(1).optional(),
    amount: z.coerce.number().positive().optional(),
    paymentDate: z.string().min(1).optional(),
    notes: z.string().optional().or(z.literal("")),
  }),
  params: z.object({
    id: z.string().min(1, "Voucher ID is required"),
  }),
});

export const voucherIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Voucher ID is required"),
  }),
});

export type CreateVoucherInput = z.infer<typeof createVoucherSchema>["body"];
export type UpdateVoucherInput = z.infer<typeof updateVoucherSchema>["body"];