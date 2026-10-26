import { Request, Response } from "express";
import { accountLedgerService } from "../services/accountLedgerService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getAccounts = catchAsync(async (req: Request, res: Response) => {
  const accounts = await accountLedgerService.getAccounts();
  sendResponse(res, 200, "Financial accounts retrieved successfully", accounts);
});

export const getLedgerMetrics = catchAsync(async (req: Request, res: Response) => {
  const metrics = await accountLedgerService.getLedgerMetrics();
  sendResponse(res, 200, "Central treasury ledger metrics calculated", metrics);
});

export const createAccount = catchAsync(async (req: Request, res: Response) => {
  const {
    accountTitle,
    category,
    institution,
    accountNumber,
    branch,
    accountClass,
    initialBalance,
  } = req.body;

  if (!accountTitle) {
    return sendResponse(res, 400, "Account title is required");
  }

  const created = await accountLedgerService.createAccount({
    accountTitle,
    category,
    institution,
    accountNumber,
    branch,
    accountClass,
    initialBalance,
  });

  sendResponse(res, 201, "Account created successfully", created);
});

export const updateAccount = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    accountTitle,
    category,
    institution,
    accountNumber,
    branch,
    accountClass,
    balance,
  } = req.body;

  const updated = await accountLedgerService.updateAccount(id, {
    accountTitle,
    category,
    institution,
    accountNumber,
    branch,
    accountClass,
    balance: balance !== undefined ? Number(balance) : undefined,
  });

  sendResponse(res, 200, "Account updated successfully", updated);
});

export const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await accountLedgerService.deleteAccount(id);
  sendResponse(res, 200, "Account deleted successfully");
});

export const getTransactions = catchAsync(async (req: Request, res: Response) => {
  const result = await accountLedgerService.getTransactions(req.query as any);
  if (result && typeof result === "object" && "meta" in result) {
    sendResponse(
      res,
      200,
      "Transactions retrieved successfully",
      (result as any).transactions,
      (result as any).meta
    );
  } else {
    sendResponse(res, 200, "Transactions retrieved successfully", result);
  }
});

export const createTransaction = catchAsync(async (req: Request, res: Response) => {
  const {
    entryDate,
    flowType,
    particulars,
    fundingEntity,
    method,
    amount,
    sourceAccountId,
    destinationAccountId,
    reconciliationStatus,
  } = req.body;

  const tx = await accountLedgerService.createTransaction({
    entryDate,
    flowType,
    particulars,
    fundingEntity,
    method,
    amount: Number(amount),
    sourceAccountId,
    destinationAccountId,
    reconciliationStatus,
  });

  sendResponse(res, 201, "Transaction created successfully", tx);
});

export const updateTransaction = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { particulars, fundingEntity, method, entryDate, reconciliationStatus } = req.body;

  const updated = await accountLedgerService.updateTransaction(id, {
    particulars,
    fundingEntity,
    method,
    entryDate,
    reconciliationStatus,
  });

  sendResponse(res, 200, "Transaction updated successfully", updated);
});

export const reconcileTransaction = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reconciliationStatus } = req.body;

  const updated = await accountLedgerService.reconcileTransaction(id, reconciliationStatus);
  sendResponse(res, 200, `Transaction marked as ${reconciliationStatus}`, updated);
});

export const deleteTransaction = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await accountLedgerService.deleteTransaction(id);
  sendResponse(res, 200, "Transaction reverted and removed successfully");
});