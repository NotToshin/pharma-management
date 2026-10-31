import { z } from "zod";

export const createAuditLogSchema = z.object({
  module: z.string().min(1, "Module name is required"),
  actionType: z.string().min(1, "Action type is required"),
  severity: z
    .enum(["Critical", "Security Warning", "Statutory Notice", "Routine"])
    .default("Routine"),
  entityTarget: z.string().min(1, "Entity target is required"),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  changeSummary: z.string().min(1, "Change summary is required"),
  priorPayload: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  newPayload: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
  reasonForChange: z.string().optional(),
  signerName: z.string().optional(),
  signatureMeaning: z
    .enum([
      "Authorship",
      "Approval",
      "Review",
      "Verification",
      "Responsibility",
      "Statutory Signoff",
    ])
    .optional(),
});

export const signAuditLogSchema = z.object({
  signerName: z.string().min(1, "Signer printed name is required"),
  signatureMeaning: z.enum([
    "Authorship",
    "Approval",
    "Review",
    "Verification",
    "Responsibility",
    "Statutory Signoff",
  ]),
  reason: z.string().min(1, "21 CFR Part 11 reason/justification is required"),
  password: z.string().optional(),
});

export const queryAuditLogSchema = z.object({
  search: z.string().optional(),
  searchTerm: z.string().optional(),
  module: z.string().optional(),
  severity: z.string().optional(),
  actionType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const auditLogIdParamSchema = z.object({
  id: z.string().min(1, "Audit log ID is required"),
});

export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;
export type SignAuditLogInput = z.infer<typeof signAuditLogSchema>;
export type QueryAuditLogInput = z.infer<typeof queryAuditLogSchema>;
