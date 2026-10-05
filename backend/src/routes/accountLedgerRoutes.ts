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
import { validateBody, validateParams } from "../utils/validate";
import {
  createAccountSchema,
  updateAccountSchema,
  createTransactionSchema,
  accountIdParamSchema,
  transactionIdParamSchema,
} from "../validations/accountLedgerValidation";

const router = Router();

router.get("/accounts", getAccounts);
router.post("/accounts", validateBody(createAccountSchema), createAccount);
router.put("/accounts/:id", validateParams(updateAccountSchema), validateBody(updateAccountSchema), updateAccount);
router.delete("/accounts/:id", validateParams(accountIdParamSchema), deleteAccount);

router.get("/transactions", getTransactions);
router.post("/transactions", validateBody(createTransactionSchema), createTransaction);
router.delete("/transactions/:id", validateParams(transactionIdParamSchema), deleteTransaction);

export default router;
