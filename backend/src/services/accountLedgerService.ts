import { AccountCategory, Prisma } from "@prisma/client";
import prisma from "../utils/prisma";
import { nextJournalRef } from "../utils/journalRef";
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

interface LinkedCounts {
  journal: number;
  openingJournal: number;
  blockingJournal: number;
  collections: number;
  expenses: number;
  settlements: number;
}

type TxClient = Prisma.TransactionClient;

const roundMoney = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

const postBalanceMovement = async (
  txClient: TxClient,
  params: {
    accountId: string;
    amount: number;
    direction: "IN" | "OUT";
    method: "Opening Balance" | "Balance Adjustment";
    particulars: string;
    entryDate: string;
    refPrefix: "OPEN" | "ADJ";
    createdAt?: Date;
  }
) => {
  const refCode = await nextJournalRef(
    params.refPrefix === "OPEN" ? "JRN-OPEN-" : "JRN-ADJ-",
    txClient
  );

  const transaction = await txClient.journalTransaction.create({
    data: {
      entryDate: params.entryDate,
      refCode,
      flowType: params.direction === "IN" ? "INFLOW" : "OUTFLOW",
      particulars: params.particulars,
      fundingEntity: "AK Pharma Treasury",
      method: params.method,
      amount: params.amount,
      sourceAccountId: params.direction === "OUT" ? params.accountId : null,
      destinationAccountId: params.direction === "IN" ? params.accountId : null,
      reconciliationStatus: "Reconciled",
      ...(params.createdAt ? { createdAt: params.createdAt } : {}),
    },
  });

  const account = await txClient.financialAccount.update({
    where: { id: params.accountId },
    data: {
      balance:
        params.direction === "IN"
          ? { increment: params.amount }
          : { decrement: params.amount },
    },
  });

  return { transaction, account };
};

const getLinkedCounts = async (accountId: string): Promise<LinkedCounts> => {
  const [journal, openingJournal, collections, expenses, settlements] = await Promise.all([
    prisma.journalTransaction.count({
      where: {
        OR: [{ sourceAccountId: accountId }, { destinationAccountId: accountId }],
      },
    }),
    prisma.journalTransaction.count({
      where: {
        method: "Opening Balance",
        OR: [{ sourceAccountId: accountId }, { destinationAccountId: accountId }],
      },
    }),
    prisma.deliveryCollection.count({ where: { financialAccountId: accountId } }),
    prisma.expenseVoucher.count({ where: { financialAccountId: accountId } }),
    prisma.partySettlement.count({ where: { financialAccountId: accountId } }),
  ]);

  return {
    journal,
    openingJournal,
    blockingJournal: Math.max(0, journal - openingJournal),
    collections,
    expenses,
    settlements,
  };
};

const formatLinkedCounts = (counts: LinkedCounts) => {
  const parts: string[] = [];
  if (counts.blockingJournal > 0) {
    parts.push(
      `${counts.blockingJournal} business transaction${
        counts.blockingJournal === 1 ? "" : "s"
      }`
    );
  }
  if (counts.collections > 0) {
    parts.push(`${counts.collections} collection${counts.collections === 1 ? "" : "s"}`);
  }
  if (counts.expenses > 0) {
    parts.push(`${counts.expenses} expense voucher${counts.expenses === 1 ? "" : "s"}`);
  }
  if (counts.settlements > 0) {
    parts.push(`${counts.settlements} settlement${counts.settlements === 1 ? "" : "s"}`);
  }
  return parts.join(", ");
};

const totalLinkedRecords = (counts: LinkedCounts) =>
  counts.blockingJournal + counts.collections + counts.expenses + counts.settlements;

export const accountLedgerService = {
  async getAccounts() {
    const [
      accounts,
      sourceGroups,
      destinationGroups,
      collectionGroups,
      expenseGroups,
      settlementGroups,
      openingEntries,
    ] = await Promise.all([
      prisma.financialAccount.findMany({
        orderBy: [{ category: "desc" }, { balance: "desc" }],
      }),
      prisma.journalTransaction.groupBy({
        by: ["sourceAccountId"],
        where: { sourceAccountId: { not: null } },
        _count: { _all: true },
        _max: { createdAt: true },
      }),
      prisma.journalTransaction.groupBy({
        by: ["destinationAccountId"],
        where: { destinationAccountId: { not: null } },
        _count: { _all: true },
        _max: { createdAt: true },
      }),
      prisma.deliveryCollection.groupBy({
        by: ["financialAccountId"],
        where: { financialAccountId: { not: null } },
        _count: { _all: true },
      }),
      prisma.expenseVoucher.groupBy({
        by: ["financialAccountId"],
        where: { financialAccountId: { not: null } },
        _count: { _all: true },
      }),
      prisma.partySettlement.groupBy({
        by: ["financialAccountId"],
        where: { financialAccountId: { not: null } },
        _count: { _all: true },
      }),
      prisma.journalTransaction.findMany({
        where: { method: "Opening Balance" },
        select: { sourceAccountId: true, destinationAccountId: true },
      }),
    ]);

    const journalSummary = new Map<string, { count: number; lastAt: Date | null }>();
    const addJournalRow = (accountId: string | null, count: number, lastAt: Date | null) => {
      if (!accountId) return;
      const current = journalSummary.get(accountId) || { count: 0, lastAt: null };
      current.count += count;
      if (lastAt && (!current.lastAt || lastAt > current.lastAt)) {
        current.lastAt = lastAt;
      }
      journalSummary.set(accountId, current);
    };

    for (const row of sourceGroups) {
      addJournalRow(row.sourceAccountId, row._count._all, row._max.createdAt);
    }
    for (const row of destinationGroups) {
      addJournalRow(row.destinationAccountId, row._count._all, row._max.createdAt);
    }

    const docCounts = new Map<
      string,
      { collections: number; expenses: number; settlements: number }
    >();
    const addDocCount = (
      accountId: string | null,
      key: "collections" | "expenses" | "settlements",
      count: number
    ) => {
      if (!accountId) return;
      const current =
        docCounts.get(accountId) || { collections: 0, expenses: 0, settlements: 0 };
      current[key] = count;
      docCounts.set(accountId, current);
    };

    for (const row of collectionGroups) {
      addDocCount(row.financialAccountId, "collections", row._count._all);
    }
    for (const row of expenseGroups) {
      addDocCount(row.financialAccountId, "expenses", row._count._all);
    }
    for (const row of settlementGroups) {
      addDocCount(row.financialAccountId, "settlements", row._count._all);
    }

    const openingCounts = new Map<string, number>();
    for (const entry of openingEntries) {
      if (entry.sourceAccountId) {
        openingCounts.set(
          entry.sourceAccountId,
          (openingCounts.get(entry.sourceAccountId) || 0) + 1
        );
      }
      if (entry.destinationAccountId) {
        openingCounts.set(
          entry.destinationAccountId,
          (openingCounts.get(entry.destinationAccountId) || 0) + 1
        );
      }
    }

    return accounts.map((account) => {
      const journal = journalSummary.get(account.id);
      const docs = docCounts.get(account.id) || {
        collections: 0,
        expenses: 0,
        settlements: 0,
      };
      const openingJournal = openingCounts.get(account.id) || 0;
      const counts: LinkedCounts = {
        journal: journal?.count || 0,
        openingJournal,
        blockingJournal: Math.max(0, (journal?.count || 0) - openingJournal),
        collections: docs.collections,
        expenses: docs.expenses,
        settlements: docs.settlements,
      };

      return {
        ...account,
        transactionCount: counts.journal,
        blockingTransactionCount: counts.blockingJournal,
        linkedCollections: counts.collections,
        linkedExpenses: counts.expenses,
        linkedSettlements: counts.settlements,
        canDelete: totalLinkedRecords(counts) === 0,
        lastTransactionAt: journal?.lastAt || null,
      };
    });
  },

  async getAccountDetails(id: string) {
    const account = await prisma.financialAccount.findUnique({ where: { id } });
    if (!account) {
      throw new AppError("Account not found", 404);
    }

    const [credits, debits, lastSource, lastDestination, linked] = await Promise.all([
      prisma.journalTransaction.aggregate({
        where: { destinationAccountId: id },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.journalTransaction.aggregate({
        where: { sourceAccountId: id },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.journalTransaction.findFirst({
        where: { sourceAccountId: id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.journalTransaction.findFirst({
        where: { destinationAccountId: id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      getLinkedCounts(id),
    ]);

    const totalCredits = credits._sum.amount || 0;
    const totalDebits = debits._sum.amount || 0;
    const transactionCount = credits._count._all + debits._count._all;
    const lastDates = [lastSource?.createdAt, lastDestination?.createdAt].filter(
      (value): value is Date => Boolean(value)
    );
    const lastTransactionAt = lastDates.length
      ? new Date(Math.max(...lastDates.map((value) => value.getTime())))
      : null;
    const canDelete = totalLinkedRecords(linked) === 0;

    return {
      account,
      summary: {
        balance: account.balance,
        totalCredits,
        totalDebits,
        netMovement: totalCredits - totalDebits,
        transactionCount,
        lastTransactionAt,
      },
      linked,
      canDelete,
      deleteBlockedReason: canDelete
        ? null
        : `This account is linked to ${formatLinkedCounts(linked)}. Reverse, delete, or reassign those records first.`,
    };
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

    const openingBalance = roundMoney(Number(data.initialBalance) || 0);
    let openingRef: string | null = null;

    const created = await prisma.$transaction(async (txClient) => {
      const account = await txClient.financialAccount.create({
        data: {
          accountTitle: data.accountTitle.trim(),
          category: data.category || "BANK",
          institution: data.institution?.trim() || "AK Pharma Vault",
          accountNumber: data.accountNumber?.trim() || "CASH-VAULT",
          branch: data.branch?.trim() || "Main Branch",
          accountClass: data.accountClass || "Current",
          balance: 0,
        },
      });

      if (openingBalance === 0) {
        return account;
      }

      const movement = await postBalanceMovement(txClient, {
        accountId: account.id,
        amount: Math.abs(openingBalance),
        direction: openingBalance > 0 ? "IN" : "OUT",
        method: "Opening Balance",
        particulars: `Opening balance for ${account.accountTitle}`,
        entryDate: formatDate(),
        refPrefix: "OPEN",
      });

      openingRef = movement.transaction.refCode;
      return movement.account;
    });

    try {
      await auditLogService.createLogEntry({
        module: "Central Treasury & Ledger",
        actionType: "CREATE_ACCOUNT",
        entityTarget: created.accountTitle,
        entityType: "FinancialAccount",
        entityId: created.id,
        changeSummary: `Created treasury account '${created.accountTitle}' [${created.category}] with opening balance ৳${created.balance}${openingRef ? ` (${openingRef})` : ""}`,
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
    const requestedBalance =
      data.balance !== undefined && Number.isFinite(Number(data.balance))
        ? roundMoney(Number(data.balance))
        : undefined;

    let adjustmentRef: string | null = null;

    const result = await prisma.$transaction(async (txClient) => {
      const current = await txClient.financialAccount.findUnique({ where: { id } });
      if (!current) {
        throw new AppError("Account not found", 404);
      }

      const updateData: Record<string, any> = {};
      if (data.accountTitle !== undefined) updateData.accountTitle = data.accountTitle.trim();
      if (data.category !== undefined) updateData.category = data.category;
      if (data.institution !== undefined) updateData.institution = data.institution.trim();
      if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber.trim();
      if (data.branch !== undefined) updateData.branch = data.branch.trim();
      if (data.accountClass !== undefined) updateData.accountClass = data.accountClass;

      let account =
        Object.keys(updateData).length > 0
          ? await txClient.financialAccount.update({ where: { id }, data: updateData })
          : current;

      const delta =
        requestedBalance !== undefined
          ? roundMoney(requestedBalance - current.balance)
          : 0;

      if (delta !== 0 && requestedBalance !== undefined) {
        const movement = await postBalanceMovement(txClient, {
          accountId: id,
          amount: Math.abs(delta),
          direction: delta > 0 ? "IN" : "OUT",
          method: "Balance Adjustment",
          particulars: `Manual balance adjustment for ${account.accountTitle}: ৳${current.balance.toLocaleString("en-IN")} → ৳${requestedBalance.toLocaleString("en-IN")}`,
          entryDate: formatDate(),
          refPrefix: "ADJ",
        });

        adjustmentRef = movement.transaction.refCode;
        account = movement.account;
      }

      return { account, previousBalance: current.balance };
    });

    const updated = result.account;

    try {
      await auditLogService.createLogEntry({
        module: "Central Treasury & Ledger",
        actionType: "UPDATE_ACCOUNT",
        entityTarget: updated.accountTitle,
        entityType: "FinancialAccount",
        entityId: updated.id,
        changeSummary: adjustmentRef
          ? `Updated account '${updated.accountTitle}'. Balance adjusted from ৳${result.previousBalance.toLocaleString("en-IN")} to ৳${updated.balance.toLocaleString("en-IN")} (${adjustmentRef})`
          : `Updated parameters for account '${updated.accountTitle}'. Balance: ৳${updated.balance.toLocaleString("en-IN")}`,
        severity: adjustmentRef ? "Security Warning" : "Routine",
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

    const linked = await getLinkedCounts(id);

    if (totalLinkedRecords(linked) > 0) {
      throw new AppError(
        `Cannot delete this account because it is linked to ${formatLinkedCounts(linked)}. Reverse, delete, or reassign those records first.`,
        409
      );
    }

    const deleted = await prisma.$transaction(async (txClient) => {
      if (linked.openingJournal > 0) {
        await txClient.journalTransaction.deleteMany({
          where: {
            method: "Opening Balance",
            OR: [{ sourceAccountId: id }, { destinationAccountId: id }],
          },
        });
      }

      return txClient.financialAccount.delete({ where: { id } });
    });

    try {
      await auditLogService.createLogEntry({
        module: "Central Treasury & Ledger",
        actionType: "DELETE_ACCOUNT",
        entityTarget: existing.accountTitle,
        entityType: "FinancialAccount",
        entityId: id,
        changeSummary: `Deleted unused treasury account '${existing.accountTitle}'${
          linked.openingJournal > 0
            ? ` and ${linked.openingJournal} opening balance record(s)`
            : ""
        }`,
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
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    searchTerm?: string;
    flowType?: string;
    accountId?: string;
    reconciliationStatus?: string;
  }) {
    const where: any = {};

    const searchQuery = (query?.search || query?.searchTerm || "").trim();
    if (searchQuery) {
      where.OR = [
        { refCode: { contains: searchQuery, mode: "insensitive" } },
        { particulars: { contains: searchQuery, mode: "insensitive" } },
        { fundingEntity: { contains: searchQuery, mode: "insensitive" } },
        { method: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    if (query?.flowType && query.flowType !== "all") {
      where.flowType = { equals: query.flowType.toUpperCase() };
    }

    if (query?.accountId && query.accountId !== "all") {
      where.AND = [
        {
          OR: [
            { sourceAccountId: query.accountId },
            { destinationAccountId: query.accountId },
          ],
        },
      ];
    }

    if (query?.reconciliationStatus && query.reconciliationStatus !== "all") {
      where.reconciliationStatus = { equals: query.reconciliationStatus };
    }

    // Allowlisted sort fields; unknown keys fall back to createdAt
    const allowedSortFields = [
      "createdAt",
      "entryDate",
      "refCode",
      "amount",
      "particulars",
      "flowType",
      "method",
      "fundingEntity",
      "reconciliationStatus",
    ];
    const sortBy = allowedSortFields.includes(query?.sortBy || "")
      ? (query?.sortBy as string)
      : "createdAt";
    const sortOrder = query?.sortOrder === "asc" ? "asc" : "desc";
    const orderBy: any = { [sortBy]: sortOrder };

    // Backward compatibility: missing page/limit or limit "all"/"-1" returns ALL rows
    const fetchAll =
      (!query?.page && !query?.limit) ||
      !query?.limit ||
      query.limit === "all" ||
      query.limit === "-1";

    if (fetchAll) {
      return prisma.journalTransaction.findMany({
        where,
        include: {
          sourceAccount: true,
          destinationAccount: true,
        },
        orderBy,
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
        orderBy,
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
        totalPage: Math.ceil(total / limit) || 1,
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

    try {
      await auditLogService.createLogEntry({
        module: "Central Treasury & Ledger",
        actionType: "UPDATE_TRANSACTION",
        entityTarget: existing.refCode,
        entityType: "JournalTransaction",
        entityId: id,
        changeSummary: `Updated journal entry details for ${existing.refCode}`,
        priorPayload: existing,
        newPayload: updated,
        severity: "Routine",
      });
    } catch (e) {
      console.warn("Audit logging skipped:", e);
    }

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