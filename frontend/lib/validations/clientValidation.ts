import { z } from "zod";

export const clientFormSchema = z.object({
  clientCode: z.string().optional(),
  pharmacyName: z.string().min(1, "Pharmacy / Chemist name is required"),
  proprietor: z.string().optional().or(z.literal("")),
  phone: z.string().min(1, "Primary contact phone is required"),
  drugLicenseNo: z.string().optional().or(z.literal("")),
  tradeLicenseNo: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  territory: z.string().min(1, "Territory is required"),
  assignedMio: z.string().optional().or(z.literal("")),
  creditLimitBDT: z.coerce
    .number({ message: "Credit facility must be a number" })
    .min(0, "Credit facility cannot be negative")
    .default(0),
  outstandingBalanceBDT: z.coerce
    .number({ message: "Outstanding balance must be a number" })
    .min(0, "Outstanding balance cannot be negative")
    .optional()
    .default(0),
  creditTermDays: z.coerce
    .number({ message: "Credit term days must be a number" })
    .int("Credit term days must be an integer")
    .min(0, "Credit terms cannot be negative")
    .optional()
    .default(30),
  status: z.enum(["Active / Healthy", "Credit Hold", "Watchlist", "Cash Only"]).optional().default("Active / Healthy"),
  lastBilledDate: z.string().optional().or(z.literal("")),
});

export const createClientSchema = z.object({
  body: clientFormSchema,
});

export const updateClientSchema = z.object({
  body: clientFormSchema.partial(),
  params: z.object({
    id: z.string().min(1, "Client ID is required"),
  }),
});

export const clientIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Client ID is required"),
  }),
});

export type ClientInput = z.infer<typeof clientFormSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>["body"];
export type UpdateClientInput = z.infer<typeof updateClientSchema>["body"];
