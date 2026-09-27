import { Router } from "express";
import { getFinancialOverview } from "../controllers/financeOverviewController";

const router = Router();

router.get("/metrics", getFinancialOverview);

export default router;