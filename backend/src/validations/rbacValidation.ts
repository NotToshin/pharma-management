import { z } from "zod";

export const loginOperatorSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const provisionUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    roleCode: z.string().min(1, "Role code is required"),
    territory: z.string().optional().default("Dhaka HQ"),
  }),
});

export const updateRolePermissionsSchema = z.object({
  body: z.object({
    permissions: z.array(z.object({
      module: z.string().min(1),
      category: z.string().min(1),
      read: z.boolean().optional().default(false),
      create: z.boolean().optional().default(false),
      edit: z.boolean().optional().default(false),
      delete: z.boolean().optional().default(false),
      specialAction: z.string().optional().nullable(),
      specialGranted: z.boolean().optional().default(false),
    })).min(1, "At least one permission is required"),
  }),
  params: z.object({
    id: z.string().min(1, "Role ID is required"),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});

export const roleIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Role ID is required"),
  }),
});

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Role name is required"),
    code: z.string().min(2, "Role code is required"),
    description: z.string().min(1, "Description is required"),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email("Invalid email format").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
    roleCode: z.string().min(1).optional(),
    territory: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});

export type LoginOperatorInput = z.infer<typeof loginOperatorSchema>["body"];
export type ProvisionUserInput = z.infer<typeof provisionUserSchema>["body"];
export type CreateRoleInput = z.infer<typeof createRoleSchema>["body"];
export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];