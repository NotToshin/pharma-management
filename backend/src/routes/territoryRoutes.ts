import { Router } from "express";
import {
  getAllTerritories,
  createTerritory,
} from "../controllers/territoryController";

import { requireAuth, requirePermission } from "../middlewares/requireAuth";
import { validateBody } from "../utils/validate";
import { createTerritorySchema } from "../validations/territoryValidation";

const router = Router();

router.get("/", getAllTerritories);
router.post("/", requireAuth(), requirePermission("Target Vs Achievement", "create"), validateBody(createTerritorySchema), createTerritory);

export default router;
