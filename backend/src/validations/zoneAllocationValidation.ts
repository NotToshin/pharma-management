import { territoryIdField } from "./territoryValidation";
import { z } from "zod";

export const zoneAllocationFormSchema = z.object({
  staffId: z.string().optional().nullable(),
  mioName: z.string().min(1, "MIO Officer name is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  phone: z.string().min(1, "Phone number is required"),
  division: z.string().min(1, "Division selection is required"),
  territoryId: territoryIdField,
  territory: z.string().min(1, "Territory selection is required"),
  allocatedZone: z.string().min(1, "Allocated zone details are required"),
  effectiveDate: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export const createZoneAllocationSchema = z.object({
  body: zoneAllocationFormSchema,
});

export const updateZoneAllocationSchema = z.object({
  body: zoneAllocationFormSchema.partial(),
  params: z.object({
    id: z.string().min(1, "Allocation ID is required"),
  }),
});

export const zoneAllocationIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Allocation ID is required"),
  }),
});

export const getZoneAllocationsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().positive().optional(),
      limit: z
        .union([z.coerce.number().int().min(0), z.literal("all"), z.literal("-1")])
        .optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      searchTerm: z.string().optional(),
      search: z.string().optional(),
      division: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
});

export type GetZoneAllocationsQueryInput = z.infer<typeof getZoneAllocationsQuerySchema>["query"];
