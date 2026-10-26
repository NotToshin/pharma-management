import { z } from "zod";

export const visitLogFormSchema = z.object({
  dcrCode: z.string().optional(),
  doctorName: z.string().min(1, "Doctor name is required"),
  specialty: z.string().min(1, "Specialty is required"),
  chamber: z.string().min(1, "Chamber address is required"),
  mioName: z.string().min(1, "Field MIO name is required"),
  territory: z.string().min(1, "Territory is required"),
  visitDate: z.string().min(1, "Visit date is required"),
  visitTime: z.string().min(1, "Visit time is required"),
  promotedDrugs: z.string().min(1, "Promoted drugs are required"),
  samplesGiven: z.string().min(1, "Samples given information is required"),
  feedback: z.enum(["High Potential", "Positive", "Neutral", "Needs Follow-up"], {
    message: "Feedback sentiment must be High Potential, Positive, Neutral, or Needs Follow-up",
  }),
});

export const createVisitLogSchema = z.object({
  body: visitLogFormSchema,
});

export const updateVisitLogSchema = z.object({
  body: visitLogFormSchema.partial(),
  params: z.object({
    id: z.string().min(1, "Log ID is required"),
  }),
});

export const visitLogIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Log ID is required"),
  }),
});

export type VisitLogInput = z.infer<typeof visitLogFormSchema>;
export type CreateVisitLogInput = z.infer<typeof createVisitLogSchema>["body"];
export type UpdateVisitLogInput = z.infer<typeof updateVisitLogSchema>["body"];
