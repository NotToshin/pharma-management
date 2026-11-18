import { Router } from "express";
import {
  getAllTerritories,
  createTerritory,
  updateTerritory,
  deleteTerritory,
} from "../controllers/territoryController";

import { requireAuth, requirePermission } from "../middlewares/requireAuth";
import { validateBody, validateParams, validateQuery } from "../utils/validate";
import { createTerritorySchema, updateTerritorySchema, territoryIdParamSchema, queryTerritorySchema } from "../validations/territoryValidation";

const router = Router();

router.get("/", validateQuery(queryTerritorySchema), getAllTerritories);
router.post("/", requireAuth(), requirePermission(["Target Vs Achievement", "Territory Sales Breakdown"], "create"), validateBody(createTerritorySchema), createTerritory);
router.put("/:id", requireAuth(), requirePermission("Territory Sales Breakdown", "edit"), validateParams(territoryIdParamSchema), validateBody(updateTerritorySchema), updateTerritory);
router.delete("/:id", requireAuth(), requirePermission("Territory Sales Breakdown", "delete"), validateParams(territoryIdParamSchema), deleteTerritory);

export default router;
