import { Router } from "express";
import {
  getTerritoryAnalytics,
  syncRealisticBaseline,
} from "../controllers/territoryAnalyticsController";

const router = Router();

router.get("/", getTerritoryAnalytics);
router.post("/sync-baseline", syncRealisticBaseline);

export default router;
