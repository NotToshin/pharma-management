import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. Get Accounts
export const getAccounts = async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.financialAccount.findMany({
      orderBy: { createdAt: "asc" },
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
};

// 2. Create Account (Bank or Cash Drawer)
export const createAccount = async (req: Request, res: Response) => {
  try {
    const { accountTitle, category, institution, accountNumber, branch, accountClass, initialBalance } = req.body;
    const created = await prisma.financialAccount.create({
      data: {
        accountTitle: accountTitle.trim(),
        category,
        institution,
        accountNumber: accountNumber?.trim() || "CASH-VAULT",
        branch: branch?.trim() || "Main Branch",
        accountClass: accountClass || "Current",
        balance: Number(initialBalance) || 0,
      },
    });
    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to create account" });
  }
};

// 3. Delete Account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.financialAccount.delete({ where: { id } });
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete account" });
  }
};

// 4. Get Transactions
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const list = await prisma.journalTransaction.findMany({
      include: {
        sourceAccount: true,
        destinationAccount: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// 5. Create Transaction (Inflow, Outflow, Transfer, Loan)
export const createTransaction = async (req: Request, res: Response) => {
  try {
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

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: "Valid transaction amount is required" });
    }

    const count = await prisma.journalTransaction.count();
    const refCode = `JRN-2026-${String(count + 1).padStart(4, "0")}`;

    const tx = await prisma.$transaction(async (txClient) => {
      // Balance Updates
      if ((flowType === "INFLOW" || flowType === "LOAN") && destinationAccountId) {
        await txClient.financialAccount.update({
          where: { id: destinationAccountId },
          data: { balance: { increment: numAmount } },
        });
      } else if (flowType === "OUTFLOW" && sourceAccountId) {
        await txClient.financialAccount.update({
          where: { id: sourceAccountId },
          data: { balance: { decrement: numAmount } },
        });
      } else if (flowType === "TRANSFER" && sourceAccountId && destinationAccountId) {
        await txClient.financialAccount.update({
          where: { id: sourceAccountId },
          data: { balance: { decrement: numAmount } },
        });
        await txClient.financialAccount.update({
          where: { id: destinationAccountId },
          data: { balance: { increment: numAmount } },
        });
      }

      return txClient.journalTransaction.create({
        data: {
          entryDate: entryDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          refCode,
          flowType,
          particulars,
          fundingEntity: fundingEntity || null,
          method: method || "Bank Transfer",
          amount: numAmount,
          sourceAccountId: sourceAccountId || null,
          destinationAccountId: destinationAccountId || null,
          reconciliationStatus: reconciliationStatus || "Reconciled",
        },
        include: {
          sourceAccount: true,
          destinationAccount: true,
        },
      });
    });

    res.status(201).json(tx);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to post transaction" });
  }
};

// 6. Delete Transaction (Reverses Account Balances)
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.journalTransaction.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const numAmount = Number(existing.amount);

    await prisma.$transaction(async (txClient) => {
      if ((existing.flowType === "INFLOW" || existing.flowType === "LOAN") && existing.destinationAccountId) {
        await txClient.financialAccount.update({
          where: { id: existing.destinationAccountId },
          data: { balance: { decrement: numAmount } },
        });
      } else if (existing.flowType === "OUTFLOW" && existing.sourceAccountId) {
        await txClient.financialAccount.update({
          where: { id: existing.sourceAccountId },
          data: { balance: { increment: numAmount } },
        });
      } else if (existing.flowType === "TRANSFER" && existing.sourceAccountId && existing.destinationAccountId) {
        await txClient.financialAccount.update({
          where: { id: existing.sourceAccountId },
          data: { balance: { increment: numAmount } },
        });
        await txClient.financialAccount.update({
          where: { id: existing.destinationAccountId },
          data: { balance: { decrement: numAmount } },
        });
      }

      await txClient.journalTransaction.delete({ where: { id } });
    });

    res.json({ message: "Transaction reverted and removed successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete transaction" });
  }
};