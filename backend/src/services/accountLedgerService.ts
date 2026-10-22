import { AccountCategory } from "@prisma/client";
import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";

const formatDate = (date?: string) => {
  if (!date) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return date;
};

const generateRefCode = async () => {
  const count = await prisma.journalTransaction.count();
  return `JRN-2026-${String(count + 1).padStart(4, "0")}`;
};

interface TransactionInput {
  entryDate?: string;
  flowType: "INFLOW" | "OUTFLOW" | "TRANSFER" | "LOAN";
  particulars?: string;
  fundingEntity?: string;
  method?: string;
  amount: number;
  sourceAccountId?: string;
  destinationAccountId?: string;
  reconciliationStatus?: string;
}

interface CreateAccountInput {
  accountTitle: string;
  category?: AccountCategory;
  institution?: string;
  accountNumber?: string;
  branch?: string;
  accountClass?: string;
  initialBalance?: number;
}

export const accountLedgerService = {
  async getAccounts() {
    return prisma.financialAccount.findMany({
      orderBy: [{ category: "desc" }, { balance: "desc" }],
    });
  },

  async getLedgerMetrics() {
    const [accounts, transactions] = await Promise.all([
      prisma.financialAccount.findMany(),
      prisma.journalTransaction.findMany(),
    ]);

    const totalBankLiquidity = accounts
      .filter((a) => a.category === "BANK")
      .reduce((sum, a) => sum + (a.balance || 0), 0);

    const totalCashSafeLiquidity = accounts
      .filter((a) => a.category === "CASH")
      .reduce((sum, a) => sum + (a.balance || 0), 0);

    const totalCombinedFunds = totalBankLiquidity + totalCashSafeLiquidity;

    const totalInflows = transactions
      .filter((t) => t.flowType === "INFLOW")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalOutflows = transactions
      .filter((t) => t.flowType === "OUTFLOW")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalLoans = transactions
      .filter((t) => t.flowType === "LOAN")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalTransfers = transactions
      .filter((t) => t.flowType === "TRANSFER")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const reconciledTxCount = transactions.filter(
      (t) => t.reconciliationStatus === "Reconciled"
    ).length;

    const pendingReconciliationCount = transactions.filter(
      (t) => t.reconciliationStatus !== "Reconciled"
    ).length;

    return {
      totalBankLiquidity,
      totalCashSafeLiquidity,
      totalCombinedFunds,
      totalInflows,
      totalOutflows,
      totalLoans,
      totalTransfers,
      activeAccountsCount: accounts.length,
      bankCount: accounts.filter((a) => a.category === "BANK").length,
      cashCount: accounts.filter((a) => a.category === "CASH").length,
      totalTransactionCount: transactions.length,
      reconciledTxCount,
      pendingReconciliationCount,
    };
  },

  async createAccount(data: CreateAccountInput) {
    const existing = await prisma.financialAccount.findUnique({
      where: { accountTitle: data.accountTitle.trim() },
    });
    if (existing) {
      throw new AppError("An account with this title already exists", 400);
    }

    const created = await prisma.financialAccount.create({
      data: {
        accountTitle: data.accountTitle.trim(),
        category: data.category || "BANK",
        institution: data.institution?.trim() || "AK Pharma Vault",
        accountNumber: data.accountNumber?.trim() || "CASH-VAULT",
        branch: data.branch?.trim() || "Main Branch",
        accountClass: data.accountClass || "Current",
        balance: Number(data.initialBalance) || 0,
      },
    });

    try {
      await auditLogService.createLogEntry({
        module: "Central Treasury & Ledger",
        actionType: "CREATE_ACCOUNT",
        entityTarget: created.accountTitle,
        entityType: "FinancialAccount",
        entityId: created.id,
        changeSummary: `Created treasury account '${created.accountTitle}' [${created.category}] with opening balance ৳${created.balance}`,
        severity: "Statutory Notice",
      });
    } catch (e) {
      console.warn("Audit logging skipped:", e);
    }

    return created;
  },

  async updateAccount(
    id: string,
    data: {
      accountTitle?: string;
      category?: string;
      institution?: string;
      accountNumber?: string;
      branch?: string;
      accountClass?: string;
      balance?: number;
    }
  ) {
    const existing = await prisma.financialAccount.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Account not found", 404);
    }

    const updateData: Record<string, any> = {};
    if (data.accountTitle !== undefined) updateData.accountTitle = data.accountTitle.trim();
    if (data.category !== undefined) updateData.category = data.category;
    if (data.institution !== undefined) updateData.institution = data.institution.trim();
    if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber.trim();
    if (data.branch !== undefined) updateData.branch = data.branch.trim();
    if (data.accountClass !== undefined) updateData.accountClass = data.accountClass;
    if (data.balance !== undefined) updateData.balance = Number(data.balance);

    const updated = await prisma.financialAccount.update({
      where: { id },
      data: updateData,
    });

    try {
      await auditLogService.createLogEntry({
        module: "Central Treasury & Ledger",
        actionType: "UPDATE_ACCOUNT",
        entityTarget: updated.accountTitle,
        entityType: "FinancialAccount",
        entityId: updated.id,
        changeSummary: `Updated parameters for account '${updated.accountTitle}'. Balance: ৳${updated.balance}`,
        severity: "Routine",
      });
    } catch (e) {
      console.warn("Audit logging skipped:", e);
    }

    return updated;
  },

  async deleteAccount(id: string) {
    const existing = await prisma.financialAccount.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Account not found", 404);
    }

    const attachedTxCount = await prisma.journalTransaction.count({
      where: {
        OR: [{ sourceAccountId: id }, { destinationAccountId: id }],
      },
    });

    if (attachedTxCount > 0) {
      throw new AppError(
        `Cannot delete account. There are ${attachedTxCount} journal transaction(s) associated with it.`,
        400
      );
    }

    const deleted = await prisma.financialAccount.delete({ where: { id } });

    try {
      await auditLogService.createLogEntry({
        module: "Central Treasury & Ledger",
        actionType: "DELETE_ACCOUNT",
        entityTarget: existing.accountTitle,
        entityType: "FinancialAccount",
        entityId: id,
        changeSummary: `Deleted unused treasury account '${existing.accountTitle}'`,
        severity: "Security Warning",
      });
    } catch (e) {
      console.warn("Audit logging skipped:", e);
    }

    return deleted;
  },

  async getTransactions(query?: {
    page?: string;
    limit?: string;
    search?: string;
    flowType?: string;
    accountId?: string;
    reconciliationStatus?: string;
  }) {
    const where: any = {};

    if (query?.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { refCode: { contains: s, mode: "insensitive" } },
        { particulars: { contains: s, mode: "insensitive" } },
        { fundingEntity: { contains: s, mode: "insensitive" } },
        { method: { contains: s, mode: "insensitive" } },
      ];
    }

    if (query?.flowType && query.flowType !== "all") {
      where.flowType = { equals: query.flowType.toUpperCase() };
    }

    if (query?.accountId && query.accountId !== "all") {
      where.OR = [
        { sourceAccountId: query.accountId },
        { destinationAccountId: query.accountId },
      ];
    }

    if (query?.reconciliationStatus && query.reconciliationStatus !== "all") {
      where.reconciliationStatus = { equals: query.reconciliationStatus };
    }

    // If no pagination parameters provided, return all for backwards compatibility
    if (!query?.page && !query?.limit) {
      return prisma.journalTransaction.findMany({
        where,
        include: {
          sourceAccount: true,
          destinationAccount: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    const page = Math.max(1, parseInt(query.page || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10) || 20));
    const skip = (page - 1) * limit;

    const [total, transactions] = await Promise.all([
      prisma.journalTransaction.count({ where }),
      prisma.journalTransaction.findMany({
        where,
        include: {
          sourceAccount: true,
          destinationAccount: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async createTransaction(data: TransactionInput) {
    const numAmount = Number(data.amount);
    if (!numAmount || numAmount <= 0) {
      throw new AppError("Valid transaction amount is required", 400);
    }

    if (data.flowType === "TRANSFER" && (!data.sourceAccountId || !data.destinationAccountId)) {
      throw new AppError("Transfer requires both source and destination accounts", 400);
    }

    if (data.flowType === "TRANSFER" && data.sourceAccountId === data.destinationAccountId) {
      throw new AppError("Source and Destination accounts cannot be the same", 400);
    }

    const refCode = await generateRefCode();

    const created = await prisma.$transaction(async (txClient) => {
      if ((data.flowType === "INFLOW" || data.flowType === "LOAN") && data.destinationAccountId) {
        await txClient.financialAccount.update({
          where: { id: data.destinationAccountId },
          data: { balance: { increment: numAmount } },
        });
      } else if (data.flowType === "OUTFLOW" && data.sourceAccountId) {
        await txClient.financialAccount.update({
          where: { id: data.sourceAccountId },
          data: { balance: { decrement: numAmount } },
        });
      } else if (data.flowType === "TRANSFER" && data.sourceAccountId && data.destinationAccountId) {
        await txClient.financialAccount.update({
          where: { id: data.sourceAccountId },
          data: { balance: { decrement: numAmount } },
        });
        await txClient.financialAccount.update({
          where: { id: data.destinationAccountId },
          data: { balance: { increment: numAmount } },
        });
      }

      return txClient.journalTransaction.create({
        data: {
          entryDate: formatDate(data.entryDate),
          refCode,
          flowType: data.flowType,
          particulars: data.particulars || "General Entry",
          fundingEntity: data.fundingEntity || null,
          method: data.method || "Bank Transfer",
          amount: numAmount,
          sourceAccountId: data.sourceAccountId || null,
          destinationAccountId: data.destinationAccountId || null,
          reconciliationStatus: data.reconciliationStatus || "Reconciled",
        },
        include: {
          sourceAccount: true,
          destinationAccount: true,
        },
      });
    });

    try {
      await auditLogService.createLogEntry({
        module: "Central Treasury & Ledger",
        actionType: "POST_TRANSACTION",
        entityTarget: refCode,
        entityType: "JournalTransaction",
        entityId: created.id,
        changeSummary: `Posted ${data.flowType} transaction ${refCode} of ৳${numAmount.toLocaleString("en-IN")}. Method: ${data.method}`,
        severity: "Routine",
      });
    } catch (e) {
      console.warn("Audit logging skipped:", e);
    }

    return created;
  },

  async updateTransaction(
    id: string,
    data: {
      particulars?: string;
      fundingEntity?: string;
      method?: string;
      entryDate?: string;
      reconciliationStatus?: string;
    }
  ) {
    const existing = await prisma.journalTransaction.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Transaction not found", 404);
    }

    const updated = await prisma.journalTransaction.update({
      where: { id },
      data: {
        particulars: data.particulars !== undefined ? data.particulars.trim() : undefined,
        fundingEntity: data.fundingEntity !== undefined ? data.fundingEntity.trim() : undefined,
        method: data.method,
        entryDate: data.entryDate,
        reconciliationStatus: data.reconciliationStatus,
      },
      include: {
        sourceAccount: true,
        destinationAccount: true,
      },
    });

    return updated;
  },

  async reconcileTransaction(id: string, reconciliationStatus: "Reconciled" | "In Transit" | "Unreconciled") {
    const existing = await prisma.journalTransaction.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Transaction not found", 404);
    }

    const updated = await prisma.journalTransaction.update({
      where: { id },
      data: { reconciliationStatus },
      include: {
        sourceAccount: true,
        destinationAccount: true,
      },
    });

    try {
      await auditLogService.createLogEntry({
        module: "Central Treasury & Ledger",
        actionType: "RECONCILE_TRANSACTION",
        entityTarget: existing.refCode,
        entityType: "JournalTransaction",
        entityId: id,
        changeSummary: `Updated reconciliation status of transaction ${existing.refCode} to '${reconciliationStatus}'`,
        severity: "Routine",
      });
    } catch (e) {
      console.warn("Audit logging skipped:", e);
    }

    return updated;
  },

  async deleteTransaction(id: string) {
    const existing = await prisma.journalTransaction.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Transaction not found", 404);
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

    try {
      await auditLogService.createLogEntry({
        module: "Central Treasury & Ledger",
        actionType: "REVERSE_TRANSACTION",
        entityTarget: existing.refCode,
        entityType: "JournalTransaction",
        entityId: id,
        changeSummary: `Reversed and deleted ${existing.flowType} transaction ${existing.refCode} of ৳${numAmount.toLocaleString("en-IN")}`,
        severity: "Critical",
      });
    } catch (e) {
      console.warn("Audit logging skipped:", e);
    }

    return { success: true };
  },
};