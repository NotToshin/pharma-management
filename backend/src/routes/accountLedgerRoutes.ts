import { Router } from "express";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getTransactions,
  createTransaction,
  deleteTransaction,
} from "../controllers/accountLedgerController";

const router = Router();

router.get("/accounts", getAccounts);
router.post("/accounts", createAccount);
router.put("/accounts/:id", updateAccount);
router.delete("/accounts/:id", deleteAccount);

router.get("/transactions", getTransactions);
router.post("/transactions", createTransaction);
router.delete("/transactions/:id", deleteTransaction);

export default router;
