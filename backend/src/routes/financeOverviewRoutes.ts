import { Router } from "express";
import { getFinancialOverview } from "../controllers/financeOverviewController";
import { validateQuery } from "../utils/validate";
import { queryFinanceOverviewSchema } from "../validations/financeOverviewValidation";

const router = Router();

router.get("/", validateQuery(queryFinanceOverviewSchema), getFinancialOverview);
router.get("/metrics", validateQuery(queryFinanceOverviewSchema), getFinancialOverview);

export default router;