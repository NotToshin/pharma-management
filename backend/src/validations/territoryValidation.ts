import { z } from "zod";

export const territoryIdField = z.string().regex(/^[a-f\d]{24}$/i, "Invalid territory ID").nullable().optional();

export const createTerritorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Territory name is required").max(200),
    division: z.string().trim().max(200).optional(),
    status: z.enum(["Active", "Inactive"]).optional().default("Active"),
  }),
});
