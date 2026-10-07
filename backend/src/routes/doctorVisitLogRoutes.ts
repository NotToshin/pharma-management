import { Router } from "express";
import {
  getAllVisitLogs,
  getVisitLogById,
  createVisitLog,
  updateVisitLog,
  deleteVisitLog,
} from "../controllers/doctorVisitLogController";
import { validateBody, validateParams } from "../utils/validate";
import {
  createVisitLogSchema,
  updateVisitLogSchema,
  visitLogIdParamSchema,
} from "../validations/doctorVisitLogValidation";

const router = Router();

router.get("/", getAllVisitLogs);
router.get("/:id", validateParams(visitLogIdParamSchema), getVisitLogById);
router.post("/", validateBody(createVisitLogSchema), createVisitLog);
router.put("/:id", validateParams(visitLogIdParamSchema), validateBody(updateVisitLogSchema), updateVisitLog);
router.delete("/:id", validateParams(visitLogIdParamSchema), deleteVisitLog);

export default router;
