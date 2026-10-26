import { z } from "zod";

export const clientFormSchema = z.object({
  clientCode: z.string().optional(),
  pharmacyName: z.string().min(1, "Pharmacy name is required"),
  proprietor: z.string().optional().or(z.literal("")),
  phone: z.string().min(1, "Phone number is required"),
  drugLicenseNo: z.string().optional().or(z.literal("")),
  tradeLicenseNo: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  territory: z.string().optional().or(z.literal("")),
  assignedMio: z.string().optional().or(z.literal("")),
  creditLimitBDT: z.coerce.number().min(0, "Credit limit cannot be negative").optional().default(0),
  outstandingBalanceBDT: z.coerce.number().min(0, "Outstanding balance cannot be negative").optional().default(0),
  creditTermDays: z.coerce.number().int().min(0, "Credit term days must be positive").optional().default(30),
  status: z.string().optional().default("Active / Healthy"),
  lastBilledDate: z.string().optional().or(z.literal("")),
});

export const createClientSchema = z.object({
  body: clientFormSchema,
});

export const updateClientBodySchema = z.object({
  clientCode: z.string().optional(),
  pharmacyName: z.string().min(1, "Pharmacy name is required").optional(),
  proprietor: z.string().optional().or(z.literal("")),
  phone: z.string().min(1, "Phone number is required").optional(),
  drugLicenseNo: z.string().optional().or(z.literal("")),
  tradeLicenseNo: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  territory: z.string().optional().or(z.literal("")),
  assignedMio: z.string().optional().or(z.literal("")),
  creditLimitBDT: z.coerce.number().min(0, "Credit limit cannot be negative").optional(),
  outstandingBalanceBDT: z.coerce.number().min(0, "Outstanding balance cannot be negative").optional(),
  creditTermDays: z.coerce.number().int().min(0, "Credit term days must be positive").optional(),
  status: z.string().optional(),
  lastBilledDate: z.string().optional().or(z.literal("")),
});

export const updateClientSchema = z.object({
  body: updateClientBodySchema,
  params: z.object({
    id: z.string().min(1, "Client ID is required"),
  }),
});

export const clientIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Client ID is required"),
  }),
});

export const getClientsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().min(0).optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      searchTerm: z.string().optional(),
      pharmacyName: z.string().optional(),
      clientCode: z.string().optional(),
      proprietor: z.string().optional(),
      phone: z.string().optional(),
      drugLicenseNo: z.string().optional(),
      tradeLicenseNo: z.string().optional(),
      territory: z.string().optional(),
      assignedMio: z.string().optional(),
      status: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export const bulkImportClientSchema = z.object({
  body: z.object({
    clients: z
      .array(
        z.object({
          clientCode: z.string().optional(),
          pharmacyName: z.string().min(1, "Pharmacy name is required"),
          proprietor: z.string().optional().default("N/A"),
          phone: z.string().optional().default("+880 1700-000000"),
          drugLicenseNo: z.string().optional().default("N/A"),
          tradeLicenseNo: z.string().optional().default("N/A"),
          address: z.string().optional().default("N/A"),
          territory: z.string().optional().default("Dhaka North"),
          assignedMio: z.string().optional().default("Unassigned"),
          creditLimitBDT: z.coerce.number().optional().default(0),
          outstandingBalanceBDT: z.coerce.number().optional().default(0),
          creditTermDays: z.coerce.number().optional().default(30),
          status: z.string().optional().default("Active / Healthy"),
          lastBilledDate: z.string().optional(),
        })
      )
      .min(1, "At least one pharmacy client is required"),
    updateExisting: z.boolean().optional().default(false),
  }),
});

export type ClientInput = z.infer<typeof clientFormSchema>;
export type GetClientsQueryInput = z.infer<typeof getClientsQuerySchema>["query"];
export type CreateClientInput = z.infer<typeof createClientSchema>["body"];
export type UpdateClientInput = z.infer<typeof updateClientSchema>["body"];
export type BulkImportClientInput = z.infer<typeof bulkImportClientSchema>["body"];