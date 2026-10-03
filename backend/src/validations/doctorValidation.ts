import { z } from "zod";

export const createDoctorSchema = z.object({
  body: z.object({
    doctorName: z.string().min(1, "Doctor name is required"),
    phone: z.string().min(1, "Phone is required"),
    bmdcRegNumber: z.string().min(1, "BMDC registration number is required"),
    specialtyAndInstitute: z.string().min(1, "Specialty and institute is required"),
    chamber: z.string().min(1, "Chamber is required"),
    territoryAndMio: z.string().min(1, "Territory and MIO is required"),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    tier: z.string().min(1, "Tier is required"),
    patientVolumeDaily: z.coerce.number().int().min(0).optional().default(30),
  }),
});

export const updateDoctorSchema = z.object({
  body: z.object({
    doctorName: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    bmdcRegNumber: z.string().min(1).optional(),
    specialtyAndInstitute: z.string().min(1).optional(),
    chamber: z.string().min(1).optional(),
    territoryAndMio: z.string().min(1).optional(),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    tier: z.string().min(1).optional(),
    patientVolumeDaily: z.coerce.number().int().min(0).optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Doctor ID is required"),
  }),
});

export const doctorIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Doctor ID is required"),
  }),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>["body"];
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>["body"];