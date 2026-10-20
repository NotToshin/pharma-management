import { z } from "zod";

const accountCategoryEnum = z.enum(["BANK", "CASH"]);

export const createAccountSchema = z.object({
  body: z.object({
    accountTitle: z.string().min(1, "Account title is required"),
    category: accountCategoryEnum,
    institution: z.string().min(1, "Institution is required"),
    accountNumber: z.string().min(1, "Account number is required"),
    branch: z.string().optional().or(z.literal("")),
    accountClass: z.string().min(1, "Account class is required"),
    initialBalance: z.coerce.number().optional().default(0),
  }),
});

export const updateAccountSchema = z.object({
  body: z.object({
    accountTitle: z.string().min(1).optional(),
    category: accountCategoryEnum.optional(),
    institution: z.string().min(1).optional(),
    accountNumber: z.string().min(1).optional(),
    branch: z.string().optional().or(z.literal("")),
    accountClass: z.string().min(1).optional(),
    balance: z.coerce.number().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Account ID is required"),
  }),
});

export const createTransactionSchema = z.object({
  body: z.object({
    entryDate: z.string().min(1, "Entry date is required"),
    flowType: z.enum(["INFLOW", "OUTFLOW", "TRANSFER", "LOAN"]).refine(
      (val) => ["INFLOW", "OUTFLOW", "TRANSFER", "LOAN"].includes(val),
      "Flow type must be INFLOW, OUTFLOW, TRANSFER, or LOAN"
    ),
    particulars: z.string().min(1, "Particulars is required"),
    fundingEntity: z.string().optional().or(z.literal("")),
    method: z.string().min(1, "Method is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    sourceAccountId: z.string().optional().or(z.literal("")),
    destinationAccountId: z.string().optional().or(z.literal("")),
    reconciliationStatus: z.string().optional().default("Reconciled"),
  }),
});

export const accountIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Account ID is required"),
  }),
});

export const transactionIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Transaction ID is required"),
  }),
});

export const queryTransactionSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    flowType: z.string().optional(),
    accountId: z.string().optional(),
    reconciliationStatus: z.string().optional(),
  }).optional(),
});

export const updateTransactionSchema = z.object({
  body: z.object({
    particulars: z.string().min(1).optional(),
    fundingEntity: z.string().optional().or(z.literal("")),
    method: z.string().optional(),
    entryDate: z.string().optional(),
    reconciliationStatus: z.enum(["Reconciled", "In Transit", "Unreconciled"]).optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Transaction ID is required"),
  }),
});

export const reconcileTransactionSchema = z.object({
  body: z.object({
    reconciliationStatus: z.enum(["Reconciled", "In Transit", "Unreconciled"]),
  }),
  params: z.object({
    id: z.string().min(1, "Transaction ID is required"),
  }),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>["body"];
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>["body"];
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>["body"];
export type QueryTransactionInput = z.infer<typeof queryTransactionSchema>["query"];
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>["body"];
export type ReconcileTransactionInput = z.infer<typeof reconcileTransactionSchema>["body"];