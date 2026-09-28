import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. Get Accounts (Sorted by balance descending, clean with zero mocks)
export const getAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const accounts = await prisma.financialAccount.findMany({
      orderBy: { balance: "desc" },
    });
    res.status(200).json(accounts);
  } catch (error) {
    console.error("Error fetching financial accounts:", error);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
};

// 2. Create Account (Bank or Cash Drawer)
export const createAccount = async (req: Request, res: Response): Promise<void> => {
  try {
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
      res.status(400).json({ error: "Account title is required" });
      return;
    }

    const created = await prisma.financialAccount.create({
      data: {
        accountTitle: accountTitle.trim(),
        category: category || "BANK",
        institution: institution ? institution.trim() : "AK Pharma Vault",
        accountNumber: accountNumber?.trim() || "CASH-VAULT",
        branch: branch?.trim() || "Main Branch",
        accountClass: accountClass || "Current",
        balance: Number(initialBalance) || 0,
      },
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error("Error creating account:", error);
    res.status(400).json({ error: error.message || "Failed to create account" });
  }
};

// 3. Update Account
export const updateAccount = async (req: Request, res: Response): Promise<void> => {
  try {
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

    const updated = await prisma.financialAccount.update({
      where: { id },
      data: {
        ...(accountTitle && { accountTitle: accountTitle.trim() }),
        ...(category && { category }),
        ...(institution && { institution: institution.trim() }),
        ...(accountNumber && { accountNumber: accountNumber.trim() }),
        ...(branch && { branch: branch.trim() }),
        ...(accountClass && { accountClass }),
        ...(balance !== undefined && { balance: Number(balance) }),
      },
    });

    res.status(200).json(updated);
  } catch (error: any) {
    console.error("Error updating account:", error);
    res.status(400).json({ error: error.message || "Failed to update account" });
  }
};

// 4. Delete Account (With foreign key transaction cleanup safety)
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if account has journal transactions attached
    const attachedTxCount = await prisma.journalTransaction.count({
      where: {
        OR: [{ sourceAccountId: id }, { destinationAccountId: id }],
      },
    });

    if (attachedTxCount > 0) {
      res.status(400).json({
        error: `Cannot delete account. There are ${attachedTxCount} journal transaction(s) associated with it.`,
      });
      return;
    }

    await prisma.financialAccount.delete({ where: { id } });
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: error.message || "Failed to delete account" });
  }
};

// 5. Get Transactions
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.journalTransaction.findMany({
      include: {
        sourceAccount: true,
        destinationAccount: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(list);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// 6. Create Transaction (Inflow, Outflow, Transfer, Loan)
export const createTransaction = async (req: Request, res: Response): Promise<void> => {
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
      res.status(400).json({ error: "Valid transaction amount is required" });
      return;
    }

    const count = await prisma.journalTransaction.count();
    const refCode = `JRN-2026-${String(count + 1).padStart(4, "0")}`;

    const tx = await prisma.$transaction(async (txClient) => {
      // Dynamic Balance Adjustments
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
          entryDate:
            entryDate ||
            new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
          refCode,
          flowType,
          particulars: particulars || "General Entry",
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
    console.error("Error creating transaction:", error);
    res.status(400).json({ error: error.message || "Failed to post transaction" });
  }
};

// 7. Delete Transaction (Safely reverts account balances)
export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.journalTransaction.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Transaction not found" });
      return;
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

    res.status(200).json({ message: "Transaction reverted and removed successfully" });
  } catch (error: any) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ error: error.message || "Failed to delete transaction" });
  }
};
