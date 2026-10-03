import { PrismaClient, AccountCategory } from "@prisma/client";

const prisma = new PrismaClient();

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
      orderBy: { balance: "desc" },
    });
  },

  async createAccount(data: CreateAccountInput) {
    return prisma.financialAccount.create({
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
  },

  async updateAccount(id: string, data: {
    accountTitle?: string;
    category?: string;
    institution?: string;
    accountNumber?: string;
    branch?: string;
    accountClass?: string;
    balance?: number;
  }) {
    const updateData: Record<string, any> = {};
    if (data.accountTitle !== undefined) updateData.accountTitle = data.accountTitle.trim();
    if (data.category !== undefined) updateData.category = data.category;
    if (data.institution !== undefined) updateData.institution = data.institution.trim();
    if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber.trim();
    if (data.branch !== undefined) updateData.branch = data.branch.trim();
    if (data.accountClass !== undefined) updateData.accountClass = data.accountClass;
    if (data.balance !== undefined) updateData.balance = Number(data.balance);

    return prisma.financialAccount.update({
      where: { id },
      data: updateData,
    });
  },

  async deleteAccount(id: string) {
    const attachedTxCount = await prisma.journalTransaction.count({
      where: {
        OR: [{ sourceAccountId: id }, { destinationAccountId: id }],
      },
    });

    if (attachedTxCount > 0) {
      throw new Error(`Cannot delete account. There are ${attachedTxCount} journal transaction(s) associated with it.`);
    }

    return prisma.financialAccount.delete({ where: { id } });
  },

  async getTransactions() {
    return prisma.journalTransaction.findMany({
      include: {
        sourceAccount: true,
        destinationAccount: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async createTransaction(data: TransactionInput) {
    const numAmount = Number(data.amount);
    if (!numAmount || numAmount <= 0) {
      throw new Error("Valid transaction amount is required");
    }

    const refCode = await generateRefCode();

    return prisma.$transaction(async (txClient) => {
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
  },

  async deleteTransaction(id: string) {
    const existing = await prisma.journalTransaction.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Transaction not found");
    }

    const numAmount = Number(existing.amount);

    return prisma.$transaction(async (txClient) => {
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
  },
};