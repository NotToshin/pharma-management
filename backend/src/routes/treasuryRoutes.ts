import { Router } from "express";
import { postTreasuryDeposit, getAllTreasuryDeposits } from "../controllers/treasuryController";

const router = Router();

router.get("/deposits", getAllTreasuryDeposits);
router.get("/", getAllTreasuryDeposits);
router.post("/deposit", postTreasuryDeposit);

export default router;
