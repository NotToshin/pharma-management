import { z } from "zod";

const staffStatusEnum = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "TERMINATED", "PROBATION", "ON_LEAVE"]);

export const createStaffSchema = z.object({
  body: z.object({
    empId: z.string().min(1, "Employee ID is required"),
    fullName: z.string().min(1, "Full name is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    nidNumber: z.string().optional().or(z.literal("")),
    fathersName: z.string().optional().or(z.literal("")),
    mothersName: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    department: z.string().optional().or(z.literal("")),
    territory: z.string().optional().or(z.literal("")),
    supervisor: z.string().optional().or(z.literal("")),
    status: staffStatusEnum.optional().default("ACTIVE"),
    roleId: z.string().optional().or(z.literal("")),
    joiningDate: z.string().optional().or(z.literal("")),
  }),
});

export const updateStaffSchema = z.object({
  body: z.object({
    empId: z.string().min(1).optional(),
    fullName: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    nidNumber: z.string().optional().or(z.literal("")),
    fathersName: z.string().optional().or(z.literal("")),
    mothersName: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    department: z.string().optional().or(z.literal("")),
    territory: z.string().optional().or(z.literal("")),
    supervisor: z.string().optional().or(z.literal("")),
    status: staffStatusEnum.optional(),
    roleId: z.string().optional().or(z.literal("")),
  }),
  params: z.object({
    id: z.string().min(1, "Staff ID is required"),
  }),
});

export const staffIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Staff ID is required"),
  }),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>["body"];
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>["body"];