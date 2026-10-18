import { Router } from "express";
import {
  getAllTargets,
  getTargetOptions,
  createTarget,
  updateTarget,
  deleteTarget,
} from "../controllers/territoryTargetController";
import { validateBody, validateParams } from "../utils/validate";
import {
  createTerritoryTargetSchema,
  updateTerritoryTargetSchema,
  territoryTargetIdParamSchema,
} from "../validations/territoryTargetValidation";

const router = Router();

router.get("/", getAllTargets);
router.get("/options", getTargetOptions);
router.post("/", validateBody(createTerritoryTargetSchema), createTarget);
router.put(
  "/:id",
  validateParams(territoryTargetIdParamSchema),
  validateBody(updateTerritoryTargetSchema),
  updateTarget
);
router.delete("/:id", validateParams(territoryTargetIdParamSchema), deleteTarget);

export default router;
