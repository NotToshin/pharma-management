import { territoryIdField } from "./territoryValidation";
import { z } from "zod";

const staffStatusEnum = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "TERMINATED", "PROBATION", "ON_LEAVE"]);

export const createStaffSchema = z.object({
  body: z.object({
    empId: z.string().optional().or(z.literal("")),
    fullName: z.string().min(1, "Full name is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    nidNumber: z.string().optional().or(z.literal("")),
    fathersName: z.string().optional().or(z.literal("")),
    mothersName: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    department: z.string().optional().or(z.literal("")),
    territoryId: territoryIdField,
    territory: z.string().optional().or(z.literal("")),
    supervisor: z.string().optional().or(z.literal("")),
    status: staffStatusEnum.optional().default("ACTIVE"),
    employmentStatus: z.string().optional().or(z.literal("")),
    roleId: z.string().optional().or(z.literal("")),
    roleName: z.string().optional().or(z.literal("")),
    designation: z.string().optional().or(z.literal("")),
    joiningDate: z.string().optional().or(z.literal("")),
    salary: z.union([z.number(), z.string()]).optional(),
    workSchedule: z.string().optional().or(z.literal("")),
    emergencyName: z.string().optional().or(z.literal("")),
    emergencyRelationship: z.string().optional().or(z.literal("")),
    emergencyPhone: z.string().optional().or(z.literal("")),
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
    territoryId: territoryIdField,
    territory: z.string().optional().or(z.literal("")),
    supervisor: z.string().optional().or(z.literal("")),
    status: staffStatusEnum.optional(),
    employmentStatus: z.string().optional().or(z.literal("")),
    roleId: z.string().optional().or(z.literal("")),
    roleName: z.string().optional().or(z.literal("")),
    designation: z.string().optional().or(z.literal("")),
    joiningDate: z.string().optional().or(z.literal("")),
    salary: z.union([z.number(), z.string()]).optional(),
    workSchedule: z.string().optional().or(z.literal("")),
    emergencyName: z.string().optional().or(z.literal("")),
    emergencyRelationship: z.string().optional().or(z.literal("")),
    emergencyPhone: z.string().optional().or(z.literal("")),
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

export const getStaffQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    searchTerm: z.string().optional(),
    department: z.string().optional(),
    status: z.string().optional(),
    role: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>["body"];
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>["body"];
export type GetStaffQueryInput = z.infer<typeof getStaffQuerySchema>["query"];