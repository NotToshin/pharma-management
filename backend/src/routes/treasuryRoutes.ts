import { Router } from "express";
import { postTreasuryDeposit, getAllTreasuryDeposits } from "../controllers/treasuryController";
import { validateBody } from "../utils/validate";
import { createTreasuryDepositSchema } from "../validations/treasuryValidation";

const router = Router();

router.get("/deposits", getAllTreasuryDeposits);
router.get("/", getAllTreasuryDeposits);
router.post("/deposit", validateBody(createTreasuryDepositSchema), postTreasuryDeposit);

export default router;
