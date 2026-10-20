import { Router } from "express";
import {
  getAccounts,
  getLedgerMetrics,
  createAccount,
  updateAccount,
  deleteAccount,
  getTransactions,
  createTransaction,
  updateTransaction,
  reconcileTransaction,
  deleteTransaction,
} from "../controllers/accountLedgerController";
import { validateBody, validateParams, validateQuery } from "../utils/validate";
import {
  createAccountSchema,
  updateAccountSchema,
  createTransactionSchema,
  accountIdParamSchema,
  transactionIdParamSchema,
  queryTransactionSchema,
  updateTransactionSchema,
  reconcileTransactionSchema,
} from "../validations/accountLedgerValidation";

const router = Router();

// Metrics & Top KPI Summaries
router.get("/metrics", getLedgerMetrics);

// Financial Accounts & Cash Drawers
router.get("/accounts", getAccounts);
router.post("/accounts", validateBody(createAccountSchema), createAccount);
router.put("/accounts/:id", validateParams(updateAccountSchema), validateBody(updateAccountSchema), updateAccount);
router.delete("/accounts/:id", validateParams(accountIdParamSchema), deleteAccount);

// Journal Transactions & Transfers
router.get("/transactions", validateQuery(queryTransactionSchema), getTransactions);
router.post("/transactions", validateBody(createTransactionSchema), createTransaction);
router.put("/transactions/:id", validateParams(transactionIdParamSchema), validateBody(updateTransactionSchema), updateTransaction);
router.patch("/transactions/:id/reconcile", validateParams(transactionIdParamSchema), validateBody(reconcileTransactionSchema), reconcileTransaction);
router.delete("/transactions/:id", validateParams(transactionIdParamSchema), deleteTransaction);

export default router;
