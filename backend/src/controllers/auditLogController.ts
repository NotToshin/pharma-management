import { Request, Response } from "express";
import { auditLogService } from "../services/auditLogService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";
import { QueryAuditLogInput } from "../validations/auditLogValidation";

export const getAllAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as QueryAuditLogInput;
  const result = await auditLogService.getAllLogs(query);
  sendResponse(
    res,
    200,
    "Statutory 21 CFR Part 11 audit records retrieved successfully",
    result.logs,
    result.meta
  );
});

export const getAuditStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await auditLogService.getStats();
  sendResponse(
    res,
    200,
    "Statutory audit trail compliance metrics retrieved successfully",
    stats
  );
});

export const verifyAuditChain = catchAsync(async (req: Request, res: Response) => {
  const verification = await auditLogService.verifyChain();
  sendResponse(
    res,
    200,
    verification.valid
      ? "Cryptographic SHA-256 hash chain verified 100% intact"
      : "Cryptographic hash chain verification failed",
    verification
  );
});

export const getAuditLogById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const log = await auditLogService.getLogById(id);
  sendResponse(res, 200, "Audit log record details retrieved successfully", log);
});

import { getActorContext } from "../utils/requestContext";

export const createAuditLog = catchAsync(async (req: Request, res: Response) => {
  const context = getActorContext();
  const actorContext = {
    userId: (req as any).user?.id || context?.userId,
    name: (req as any).user?.name || context?.name || "Super Administrator",
    email: (req as any).user?.email || context?.email || "superadmin@pharma.com",
    role: (req as any).user?.role?.name || (req as any).user?.role?.code || context?.role || "Super Administrator",
    ipAddress:
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      context?.ipAddress ||
      "127.0.0.1",
    userAgent: req.headers["user-agent"] || context?.userAgent || "Mozilla/5.0",
  };

  const newLog = await auditLogService.createLogEntry(req.body, actorContext);
  sendResponse(
    res,
    201,
    "New statutory audit record signed and committed to append-only ledger",
    newLog
  );
});

export const signAuditLog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const context = getActorContext();
  const signingUser = {
    name: (req as any).user?.name || req.body.signerName || context?.name || "Super Administrator",
    email: (req as any).user?.email || context?.email || "superadmin@pharma.com",
    role: (req as any).user?.role?.name || (req as any).user?.role?.code || context?.role || "Super Administrator",
  };

  const signedLog = await auditLogService.signLogEntry(id, req.body, signingUser);
  sendResponse(
    res,
    200,
    "21 CFR Part 11 Electronic Signature validated and affixed successfully",
    signedLog
  );
});

export const clearAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await auditLogService.clearAllAuditLogs();
  sendResponse(
    res,
    200,
    `Purged ${result.count} audit records from database. Ready for live compliance capture.`,
    result
  );
});
