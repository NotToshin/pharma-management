import { Router } from "express";
import { postTreasuryDeposit } from "../controllers/treasuryController";

const router = Router();
router.post("/deposit", postTreasuryDeposit);

export default router;