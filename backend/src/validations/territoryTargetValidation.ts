import { z } from "zod";

export const territoryTargetFormSchema = z.object({
  territoryId: z.string().optional().nullable(),
  territory: z.string().min(1, "Territory is required"),
  mioName: z.string().min(1, "Assigned MIO is required"),
  targetAmount: z.coerce.number().positive("Target amount must be greater than 0"),
  achievedAmount: z.coerce.number().min(0, "Achieved amount cannot be negative").default(0),
  fiscalYear: z.string().optional().default("Fiscal Year 2026"),
  status: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createTerritoryTargetSchema = z.object({
  body: territoryTargetFormSchema,
});

export const updateTerritoryTargetSchema = z.object({
  body: territoryTargetFormSchema.partial(),
  params: z.object({
    id: z.string().min(1, "Target ID is required"),
  }),
});

export const territoryTargetIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Target ID is required"),
  }),
});

export const queryTerritoryTargetSchema = z.object({
  query: z.object({
    fiscalYear: z.string().optional(),
    territory: z.string().optional(),
  }).optional(),
});
