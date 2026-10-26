import { z } from "zod";

export const createTreasuryDepositSchema = z.object({
  body: z.object({
    destinationType: z.string().min(1, "Destination type is required"),
    destinationName: z.string().min(1, "Destination name is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    salesRep: z.string().optional().or(z.literal("")),
    discrepancy: z.coerce.number().optional().default(0),
    resolution: z.string().optional().or(z.literal("")),
  }),
});

export type CreateTreasuryDepositInput = z.infer<typeof createTreasuryDepositSchema>["body"];