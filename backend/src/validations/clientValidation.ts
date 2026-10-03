import { z } from "zod";

export const createClientSchema = z.object({
  body: z.object({
    clientCode: z.string().min(1, "Client code is required"),
    pharmacyName: z.string().min(1, "Pharmacy name is required"),
    proprietor: z.string().optional().or(z.literal("")),
    phone: z.string().min(1, "Phone is required"),
    drugLicenseNo: z.string().optional().or(z.literal("")),
    tradeLicenseNo: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    territory: z.string().optional().or(z.literal("")),
    assignedMio: z.string().optional().or(z.literal("")),
    creditLimitBDT: z.coerce.number().min(0).optional().default(150000),
    outstandingBalanceBDT: z.coerce.number().min(0).optional().default(0),
    creditTermDays: z.coerce.number().int().min(0).optional().default(30),
    status: z.string().optional().default("Active / Healthy"),
    lastBilledDate: z.string().optional().or(z.literal("")),
  }),
});

export const updateClientSchema = z.object({
  body: z.object({
    clientCode: z.string().min(1).optional(),
    pharmacyName: z.string().min(1).optional(),
    proprietor: z.string().optional().or(z.literal("")),
    phone: z.string().min(1).optional(),
    drugLicenseNo: z.string().optional().or(z.literal("")),
    tradeLicenseNo: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    territory: z.string().optional().or(z.literal("")),
    assignedMio: z.string().optional().or(z.literal("")),
    creditLimitBDT: z.coerce.number().min(0).optional(),
    outstandingBalanceBDT: z.coerce.number().min(0).optional(),
    creditTermDays: z.coerce.number().int().min(0).optional(),
    status: z.string().optional(),
    lastBilledDate: z.string().optional().or(z.literal("")),
  }),
  params: z.object({
    id: z.string().min(1, "Client ID is required"),
  }),
});

export const clientIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Client ID is required"),
  }),
});

export type CreateClientInput = z.infer<typeof createClientSchema>["body"];
export type UpdateClientInput = z.infer<typeof updateClientSchema>["body"];