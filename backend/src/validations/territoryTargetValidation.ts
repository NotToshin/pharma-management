import { territoryIdField } from "./territoryValidation";
import { z } from "zod";

export const territoryTargetFormSchema = z.object({
  territoryId: territoryIdField,
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

export const territoryTargetQueryFieldsSchema = z.object({
  fiscalYear: z.string().optional(),
  territory: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  searchTerm: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const queryTerritoryTargetSchema = z.object({
  query: territoryTargetQueryFieldsSchema.optional(),
});

export type QueryTerritoryTargetInput = z.infer<typeof territoryTargetQueryFieldsSchema>;
