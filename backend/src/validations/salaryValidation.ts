import { z } from "zod";

const paymentStatusEnum = z.enum(["PENDING", "PAID", "PROCESSING"]);

export const upsertSalarySchema = z.object({
  body: z.object({
    empId: z.string().min(1, "Employee ID is required"),
    payPeriod: z.string().min(1, "Pay period is required"),
    baseSalary: z.coerce.number().min(0).optional(),
    basicSalary: z.coerce.number().min(0).optional(),
    houseRent: z.coerce.number().min(0).optional().default(0),
    medicalAllowance: z.coerce.number().min(0).optional().default(0),
    conveyanceTaDa: z.coerce.number().min(0).optional().default(0),
    salesIncentive: z.coerce.number().min(0).optional().default(0),
    specialBonus: z.coerce.number().min(0).optional().default(0),
    providentFund: z.coerce.number().min(0).optional().default(0),
    taxDeduction: z.coerce.number().min(0).optional().default(0),
    otherDeductions: z.coerce.number().min(0).optional().default(0),
    leaveDays: z.coerce.number().int().min(0).optional().default(0),
  }),
});

export const updateSalarySchema = z.object({
  body: z.object({
    baseSalary: z.coerce.number().min(0).optional(),
    basicSalary: z.coerce.number().min(0).optional(),
    houseRent: z.coerce.number().min(0).optional(),
    medicalAllowance: z.coerce.number().min(0).optional(),
    conveyanceTaDa: z.coerce.number().min(0).optional(),
    salesIncentive: z.coerce.number().min(0).optional(),
    specialBonus: z.coerce.number().min(0).optional(),
    providentFund: z.coerce.number().min(0).optional(),
    taxDeduction: z.coerce.number().min(0).optional(),
    otherDeductions: z.coerce.number().min(0).optional(),
    leaveDays: z.coerce.number().int().min(0).optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Salary ID is required"),
  }),
});

export const salaryIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Salary ID is required"),
  }),
});

export const getSalariesQuerySchema = z.object({
  query: z.object({
    month: z.string().optional().default("September 2026"),
  }),
});

export type UpsertSalaryInput = z.infer<typeof upsertSalarySchema>["body"];
export type UpdateSalaryInput = z.infer<typeof updateSalarySchema>["body"];