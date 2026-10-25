import { z } from "zod";

export const doctorFormSchema = z.object({
  doctorName: z.string().min(1, "Doctor name is required"),
  phone: z.string().min(1, "Phone number is required"),
  bmdcRegNumber: z.string().min(1, "BMDC registration number is required"),
  specialtyAndInstitute: z.string().min(1, "Specialty & Institute is required"),
  chamber: z.string().min(1, "Chamber address is required"),
  territory: z.string().optional().or(z.literal("")),
  territoryAndMio: z.string().optional().default("Unassigned"),
  email: z.string().min(1, "Email address is required").email("Invalid email format"),
  tier: z.string().min(1, "Prescriber tier is required"),
  patientVolumeDaily: z.coerce
    .number({ message: "Patient volume must be a number" })
    .int("Patient volume must be an integer")
    .min(0, "Patient volume cannot be negative"),
});

export const createDoctorSchema = z.object({
  body: doctorFormSchema,
});

export const updateDoctorSchema = z.object({
  body: doctorFormSchema.partial(),
  params: z.object({
    id: z.string().min(1, "Doctor ID is required"),
  }),
});

export const doctorIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Doctor ID is required"),
  }),
});

export type DoctorInput = z.infer<typeof doctorFormSchema>;
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>["body"];
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>["body"];
