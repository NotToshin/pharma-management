import { Router } from "express";
import { getDashboardTelemetry } from "../controllers/dashboardController";

const router = Router();
router.get("/telemetry", getDashboardTelemetry);
export default router;