import { z } from "zod";

const allocationSchema = z.object({
  documentId: z.string().min(1),
  amount: z.coerce.number().positive("Allocated amount must be positive"),
});

export const createSettlementSchema = z.object({
  body: z.object({
    direction: z.enum(["OUTGOING", "INCOMING"]),
    partyName: z.string().min(1, "Party name is required"),
    partyCode: z.string().optional().nullable(),
    amount: z.coerce.number().positive("Payment amount must be positive"),
    paymentMethod: z.string().min(1, "Payment method is required"),
    paymentDate: z.string().optional(),
    transactionRef: z.string().optional().nullable(),
    financialAccountId: z.string().optional().nullable(),
    notes: z.string().optional().or(z.literal("")),
    allocations: z.array(allocationSchema).optional(),
  }),
});

export const querySettlementSchema = z.object({
  query: z.object({
    direction: z.enum(["OUTGOING", "INCOMING"]),
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    partyName: z.string().optional(),
  }),
});

export const openBillsQuerySchema = z.object({
  query: z.object({
    direction: z.enum(["OUTGOING", "INCOMING"]),
    partyName: z.string().optional(),
  }),
});

export const settlementIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Payment ID is required"),
  }),
});
