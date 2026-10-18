import { Router } from "express";
import {
  getAllAuditLogs,
  getAuditStats,
  verifyAuditChain,
  getAuditLogById,
  createAuditLog,
  signAuditLog,
  clearAuditLogs,
} from "../controllers/auditLogController";
import { validateBody, validateParams, validateQuery } from "../utils/validate";
import {
  createAuditLogSchema,
  signAuditLogSchema,
  auditLogIdParamSchema,
  queryAuditLogSchema,
} from "../validations/auditLogValidation";

const router = Router();

router.delete("/clear-all", clearAuditLogs);
router.delete("/", clearAuditLogs);
router.get("/stats", getAuditStats);
router.get("/metrics", getAuditStats);
router.get("/verify-chain", verifyAuditChain);
router.get("/verify", verifyAuditChain);
router.get("/", validateQuery(queryAuditLogSchema), getAllAuditLogs);
router.get("/:id", validateParams(auditLogIdParamSchema), getAuditLogById);
router.post("/", validateBody(createAuditLogSchema), createAuditLog);
router.post(
  "/:id/sign",
  validateParams(auditLogIdParamSchema),
  validateBody(signAuditLogSchema),
  signAuditLog
);

export default router;
