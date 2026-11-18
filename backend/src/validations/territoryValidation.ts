import { z } from "zod";

export const territoryIdField = z.string().regex(/^[a-f\d]{24}$/i, "Invalid territory ID").nullable().optional();

export const territoryFormSchema = z.object({
    name: z.string().trim().min(1, "Territory name is required").max(200),
    division: z.string().trim().max(200).optional(),
    status: z.enum(["Active", "Inactive"]).optional().default("Active"),
  }).strict();

export const createTerritorySchema = z.object({ body: territoryFormSchema });
export const updateTerritorySchema = z.object({ body: territoryFormSchema });
export const territoryIdParamSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid territory ID") }),
});

export const territoryQueryFieldsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.union([z.literal("all"), z.literal("-1"), z.coerce.number().int().min(1).max(100)]).optional(),
  search: z.string().trim().max(200).optional(),
  searchTerm: z.string().trim().max(200).optional(),
  status: z.enum(["Active", "Inactive", "all"]).optional(),
  sortBy: z.enum(["name", "division", "status", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
export const queryTerritorySchema = z.object({ query: territoryQueryFieldsSchema });
export type TerritoryQuery = z.infer<typeof territoryQueryFieldsSchema>;
export type TerritoryInput = z.infer<typeof territoryFormSchema>;
