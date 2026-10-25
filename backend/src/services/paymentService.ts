import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";
import {
  CreateVoucherInput,
  UpdateVoucherInput,
  QueryVoucherInput,
} from "../validations/paymentValidation";

const prisma = new PrismaClient();

const generateNextVoucherCode = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `AKP-EXP-${currentYear}-`;

  const latestVoucher = await prisma.expenseVoucher.findFirst({
    where: {
      voucherNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!latestVoucher) {
    return `${prefix}0001`;
  }

  const parts = latestVoucher.voucherNo.split("-");
  const lastNumber = parseInt(parts[parts.length - 1], 10);
  const nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

const formatDate = (date?: string) => {
  if (!date) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return date;
};

// Calculate TDS, VDS, and net payout
const computeTaxWithholdings = (grossAmount: number | undefined, tdsRate: number = 0, vdsRate: number = 0, defaultAmount: number = 0) => {
  if (grossAmount && grossAmount > 0) {
    const tdsAmount = Number(((grossAmount * (tdsRate || 0)) / 100).toFixed(2));
    const vdsAmount = Number(((grossAmount * (vdsRate || 0)) / 100).toFixed(2));
    const netAmount = Number(Math.max(0, grossAmount - tdsAmount - vdsAmount).toFixed(2));
    return {
      grossAmount,
      tdsRate,
      tdsAmount,
      vdsRate,
      vdsAmount,
      netAmount,
      finalAmount: netAmount > 0 ? netAmount : grossAmount,
    };
  }

  return {
    grossAmount: defaultAmount,
    tdsRate: 0,
    tdsAmount: 0,
    vdsRate: 0,
    vdsAmount: 0,
    netAmount: defaultAmount,
    finalAmount: defaultAmount,
  };
};

export const paymentService = {
  /**
   * Generates the next sequential voucher code
   */
  async getNextVoucherNumber() {
    return generateNextVoucherCode();
  },

  /**
   * Retrieves all vouchers with optional filters and pagination
   */
  async getAllVouchers(filters?: QueryVoucherInput) {
    const where: Record<string, any> = {};

    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { voucherNo: { contains: q, mode: "insensitive" } },
        { payeeName: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { poNumber: { contains: q, mode: "insensitive" } },
        { chequeNumber: { contains: q, mode: "insensitive" } },
        { sourceDetail: { contains: q, mode: "insensitive" } },
      ];
    }

    if (filters?.status && filters.status !== "all") {
      where.status = filters.status;
    }

    if (filters?.category && filters.category !== "all") {
      where.category = filters.category;
    }

    if (filters?.payeeType && filters.payeeType !== "all") {
      where.payeeType = filters.payeeType;
    }

    if (filters?.fundingSource && filters.fundingSource !== "all") {
      where.fundingSource = filters.fundingSource;
    }

    // Pagination calculations
    const page = filters?.page ? Math.max(1, parseInt(filters.page, 10) || 1) : 1;
    const isFetchAll = filters?.limit === "all" || filters?.limit === "-1";
    const limit = isFetchAll ? 0 : filters?.limit ? Math.max(1, parseInt(filters.limit, 10) || 10) : 10;
    const skip = limit > 0 ? (page - 1) * limit : undefined;
    const take = limit > 0 ? limit : undefined;

    const [total, vouchers] = await Promise.all([
      prisma.expenseVoucher.count({ where }),
      prisma.expenseVoucher.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...(skip !== undefined ? { skip } : {}),
        ...(take !== undefined ? { take } : {}),
      }),
    ]);

    const totalPages = limit > 0 ? Math.ceil(total / limit) || 1 : 1;

    return {
      vouchers,
      meta: {
        total,
        page,
        limit: limit > 0 ? limit : total,
        totalPages,
      },
    };
  },

  /**
   * Get single voucher by ID
   */
  async getVoucherById(id: string) {
    const voucher = await prisma.expenseVoucher.findUnique({ where: { id } });
    if (!voucher) {
      throw new AppError("Expense voucher not found", 404);
    }
    return voucher;
  },

  /**
   * Aggregated KPI metrics for expense and vendor payments
   */
  async getVoucherMetrics() {
    const all = await prisma.expenseVoucher.findMany();

    let totalDisbursedBDT = 0;
    let totalPendingBDT = 0;
    let totalGrossBDT = 0;
    let totalTdsWithheldBDT = 0;
    let totalVdsWithheldBDT = 0;
    let disbursedCount = 0;
    let pendingCount = 0;

    const categoryMap: Record<string, { count: number; amount: number }> = {};
    const fundingSourceMap: Record<string, { count: number; amount: number }> = {};

    for (const v of all) {
      const amount = Number(v.amount) || 0;
      const gross = Number(v.grossAmount) || amount;
      const tds = Number(v.tdsAmount) || 0;
      const vds = Number(v.vdsAmount) || 0;

      totalGrossBDT += gross;
      totalTdsWithheldBDT += tds;
      totalVdsWithheldBDT += vds;

      if (v.status === "Disbursed") {
        totalDisbursedBDT += amount;
        disbursedCount++;
      } else if (v.status === "Pending Approval" || v.status === "Approved" || v.status === "Draft") {
        totalPendingBDT += amount;
        pendingCount++;
      }

      // Categories
      const cat = v.category || "General";
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, amount: 0 };
      categoryMap[cat].count++;
      categoryMap[cat].amount += amount;

      // Funding sources
      const src = v.fundingSource || "Cash Safe";
      if (!fundingSourceMap[src]) fundingSourceMap[src] = { count: 0, amount: 0 };
      fundingSourceMap[src].count++;
      fundingSourceMap[src].amount += amount;
    }

    return {
      totalVouchers: all.length,
      totalDisbursedBDT,
      totalPendingBDT,
      totalGrossBDT,
      totalTdsWithheldBDT,
      totalVdsWithheldBDT,
      disbursedCount,
      pendingCount,
      categoryBreakdown: Object.entries(categoryMap).map(([category, stats]) => ({
        category,
        count: stats.count,
        amount: stats.amount,
      })),
      fundingSourceBreakdown: Object.entries(fundingSourceMap).map(([source, stats]) => ({
        source,
        count: stats.count,
        amount: stats.amount,
      })),
    };
  },

  /**
   * Creates a new Expense Voucher with automatic TDS/VDS and treasury integration
   */
  async createVoucher(data: CreateVoucherInput, actorName?: string) {
    if (!data.payeeName?.trim()) {
      throw new AppError("Payee name is required", 400);
    }
    const rawAmount = Number(data.amount);
    if (isNaN(rawAmount) || rawAmount <= 0) {
      throw new AppError("Valid voucher amount is required", 400);
    }

    const finalVoucherNo = data.voucherNo?.trim() ? data.voucherNo.trim() : await generateNextVoucherCode();

    // Check duplicate voucherNo
    const existing = await prisma.expenseVoucher.findUnique({
      where: { voucherNo: finalVoucherNo },
    });
    if (existing) {
      throw new AppError(`Voucher number "${finalVoucherNo}" already exists`, 400);
    }

    const taxCalc = computeTaxWithholdings(
      data.grossAmount ? Number(data.grossAmount) : rawAmount,
      data.tdsRate,
      data.vdsRate,
      rawAmount
    );

    const status = data.status || "Disbursed";
    const paymentDateFormatted = formatDate(data.paymentDate);

    // If marked "Disbursed", optionally debit the financial account and write journal entry
    const created = await prisma.$transaction(async (txClient) => {
      let targetAccountId = data.financialAccountId;

      // If financialAccountId wasn't provided, attempt lookup by sourceDetail or institution
      if (!targetAccountId && data.sourceDetail) {
        const foundAcc = await txClient.financialAccount.findFirst({
          where: {
            OR: [
              { accountTitle: { contains: data.sourceDetail.trim(), mode: "insensitive" } },
              { institution: { contains: data.sourceDetail.trim(), mode: "insensitive" } },
            ],
          },
        });
        if (foundAcc) {
          targetAccountId = foundAcc.id;
        }
      }

      // If disbursed, debit account balance and record journal transaction
      if (status === "Disbursed" && targetAccountId) {
        const account = await txClient.financialAccount.findUnique({
          where: { id: targetAccountId },
        });

        if (account) {
          await txClient.financialAccount.update({
            where: { id: targetAccountId },
            data: { balance: { decrement: taxCalc.finalAmount } },
          });

          const jrnCount = await txClient.journalTransaction.count();
          const jrnRef = `JRN-EXP-${String(jrnCount + 1).padStart(4, "0")}`;

          await txClient.journalTransaction.create({
            data: {
              entryDate: paymentDateFormatted,
              refCode: jrnRef,
              flowType: "OUTFLOW",
              particulars: data.poNumber
                ? `Voucher #${finalVoucherNo} [PO: ${data.poNumber}] - ${data.payeeName} (${data.category})`
                : `Voucher #${finalVoucherNo} - ${data.payeeName} (${data.category})`,
              fundingEntity: data.payeeName,
              method: data.paymentMethod || (data.fundingSource === "Cash Safe" ? "Cash Handover" : "BEFTN / RTGS"),
              amount: taxCalc.finalAmount,
              sourceAccountId: targetAccountId,
              reconciliationStatus: "Reconciled",
            },
          });
        }
      }

      return txClient.expenseVoucher.create({
        data: {
          voucherNo: finalVoucherNo,
          payeeName: data.payeeName.trim(),
          payeeType: data.payeeType || "General / Other",
          wholesalerId: data.wholesalerId || null,
          poNumber: data.poNumber?.trim() || null,
          category: data.category || "General Operating Expense",
          fundingSource: data.fundingSource || "Cash Safe",
          sourceDetail: data.sourceDetail || "Head Office Cash Safe",
          financialAccountId: targetAccountId || null,
          paymentMethod: data.paymentMethod || "Cash",
          chequeNumber: data.chequeNumber?.trim() || null,
          grossAmount: taxCalc.grossAmount,
          tdsRate: taxCalc.tdsRate,
          tdsAmount: taxCalc.tdsAmount,
          vdsRate: taxCalc.vdsRate,
          vdsAmount: taxCalc.vdsAmount,
          netAmount: taxCalc.netAmount,
          amount: taxCalc.finalAmount,
          paymentDate: paymentDateFormatted,
          notes: data.notes || "",
          lineItems: (data.lineItems || []).map((item) => ({
            itemName: item.itemName.trim(),
            quantity: Number(item.quantity),
            unitCostBDT: item.unitCostBDT != null ? Number(item.unitCostBDT) : null,
            lineTotalBDT: item.lineTotalBDT != null ? Number(item.lineTotalBDT) : null,
          })),
          status,
          preparedBy: data.preparedBy || actorName || "Finance Controller",
          approvedBy: status === "Disbursed" || status === "Approved" ? (actorName || "Finance Director") : null,
          approvedAt: status === "Disbursed" || status === "Approved" ? new Date() : null,
          disbursedBy: status === "Disbursed" ? (actorName || "Treasury Manager") : null,
          disbursedAt: status === "Disbursed" ? new Date() : null,
        },
      });
    });

    // Statutory 21 CFR Part 11 Audit Log
    await auditLogService.recordAuditEvent({
      module: "Finance & Accounts",
      actionType: "Expense Voucher Created",
      severity: created.amount >= 100000 ? "Critical" : "Routine",
      entityTarget: `Voucher #${created.voucherNo} (${created.payeeName})`,
      entityType: "ExpenseVoucher",
      entityId: created.id,
      changeSummary: `Expense voucher ${created.voucherNo} created for ${created.payeeName}. Net Amount: BDT ${created.amount.toLocaleString("en-IN")}, Status: ${created.status}, Source: ${created.sourceDetail}.`,
      newPayload: created,
      reasonForChange: created.notes || "Official expenditure requisition recorded",
      actorName: actorName || created.preparedBy || "Finance Controller",
    });

    return created;
  },

  /**
   * Updates an existing voucher
   */
  async updateVoucher(id: string, data: UpdateVoucherInput, actorName?: string) {
    const existing = await prisma.expenseVoucher.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Expense voucher not found", 404);
    }

    const updateData: Record<string, any> = {};

    if (data.voucherNo !== undefined) updateData.voucherNo = data.voucherNo.trim();
    if (data.payeeName !== undefined) updateData.payeeName = data.payeeName.trim();
    if (data.payeeType !== undefined) updateData.payeeType = data.payeeType;
    if (data.wholesalerId !== undefined) updateData.wholesalerId = data.wholesalerId;
    if (data.poNumber !== undefined) updateData.poNumber = data.poNumber ? data.poNumber.trim() : null;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.fundingSource !== undefined) updateData.fundingSource = data.fundingSource;
    if (data.sourceDetail !== undefined) updateData.sourceDetail = data.sourceDetail;
    if (data.financialAccountId !== undefined) updateData.financialAccountId = data.financialAccountId;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.chequeNumber !== undefined) updateData.chequeNumber = data.chequeNumber ? data.chequeNumber.trim() : null;
    if (data.paymentDate !== undefined) updateData.paymentDate = formatDate(data.paymentDate);
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.lineItems !== undefined) {
      updateData.lineItems = data.lineItems.map((item) => ({
        itemName: item.itemName.trim(),
        quantity: Number(item.quantity),
        unitCostBDT: item.unitCostBDT != null ? Number(item.unitCostBDT) : null,
        lineTotalBDT: item.lineTotalBDT != null ? Number(item.lineTotalBDT) : null,
      }));
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;

    // Recalculate tax amounts if gross or rates were supplied
    const grossAmount = data.grossAmount !== undefined ? Number(data.grossAmount) : (existing.grossAmount || existing.amount);
    const tdsRate = data.tdsRate !== undefined ? Number(data.tdsRate) : (existing.tdsRate || 0);
    const vdsRate = data.vdsRate !== undefined ? Number(data.vdsRate) : (existing.vdsRate || 0);
    const baseAmount = data.amount !== undefined ? Number(data.amount) : existing.amount;

    if (data.grossAmount !== undefined || data.tdsRate !== undefined || data.vdsRate !== undefined) {
      const taxCalc = computeTaxWithholdings(grossAmount, tdsRate, vdsRate, baseAmount);
      updateData.grossAmount = taxCalc.grossAmount;
      updateData.tdsRate = taxCalc.tdsRate;
      updateData.tdsAmount = taxCalc.tdsAmount;
      updateData.vdsRate = taxCalc.vdsRate;
      updateData.vdsAmount = taxCalc.vdsAmount;
      updateData.netAmount = taxCalc.netAmount;
      updateData.amount = taxCalc.finalAmount;
    } else if (data.amount !== undefined) {
      updateData.amount = Number(data.amount);
    }

    const updated = await prisma.expenseVoucher.update({
      where: { id },
      data: updateData,
    });

    await auditLogService.recordAuditEvent({
      module: "Finance & Accounts",
      actionType: "Expense Voucher Updated",
      severity: "Routine",
      entityTarget: `Voucher #${updated.voucherNo} (${updated.payeeName})`,
      entityType: "ExpenseVoucher",
      entityId: updated.id,
      changeSummary: `Voucher ${updated.voucherNo} modified. Status: ${updated.status}, Net: BDT ${updated.amount.toLocaleString("en-IN")}.`,
      priorPayload: existing,
      newPayload: updated,
      actorName: actorName || "Finance Controller",
    });

    return updated;
  },

  /**
   * Maker-Checker Authorize & Release Workflow
   * Actions: "approve" | "disburse" | "reject"
   */
  async authorizeVoucher(
    id: string,
    action: "approve" | "disburse" | "reject",
    options?: {
      chequeNumber?: string | null;
      financialAccountId?: string | null;
      paymentMethod?: string | null;
      rejectionReason?: string | null;
      approverName?: string | null;
    }
  ) {
    const existing = await prisma.expenseVoucher.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Expense voucher not found", 404);
    }

    const approver = options?.approverName || "Super Admin";

    if (action === "approve") {
      const updated = await prisma.expenseVoucher.update({
        where: { id },
        data: {
          status: "Approved",
          approvedBy: approver,
          approvedAt: new Date(),
          rejectionReason: null,
        },
      });

      await auditLogService.recordAuditEvent({
        module: "Finance & Accounts",
        actionType: "Expense Voucher Approved",
        severity: "Routine",
        entityTarget: `Voucher #${updated.voucherNo} (${updated.payeeName})`,
        entityType: "ExpenseVoucher",
        entityId: updated.id,
        changeSummary: `Voucher ${updated.voucherNo} approved by ${approver}. Amount: BDT ${updated.amount.toLocaleString("en-IN")}.`,
        priorPayload: existing,
        newPayload: updated,
        actorName: approver,
      });

      return updated;
    }

    if (action === "reject") {
      const updated = await prisma.expenseVoucher.update({
        where: { id },
        data: {
          status: "Rejected",
          rejectionReason: options?.rejectionReason || "Returned by reviewer",
        },
      });

      await auditLogService.recordAuditEvent({
        module: "Finance & Accounts",
        actionType: "Expense Voucher Rejected",
        severity: "Routine",
        entityTarget: `Voucher #${updated.voucherNo} (${updated.payeeName})`,
        entityType: "ExpenseVoucher",
        entityId: updated.id,
        changeSummary: `Voucher ${updated.voucherNo} rejected by ${approver}. Reason: ${options?.rejectionReason || "No comment"}.`,
        priorPayload: existing,
        newPayload: updated,
        actorName: approver,
      });

      return updated;
    }

    if (action === "disburse") {
      return prisma.$transaction(async (txClient) => {
        let accountId = options?.financialAccountId || existing.financialAccountId;

        // If no explicit account ID, attempt lookup by sourceDetail
        if (!accountId && existing.sourceDetail) {
          const foundAcc = await txClient.financialAccount.findFirst({
            where: {
              OR: [
                { accountTitle: { contains: existing.sourceDetail.trim(), mode: "insensitive" } },
                { institution: { contains: existing.sourceDetail.trim(), mode: "insensitive" } },
              ],
            },
          });
          if (foundAcc) accountId = foundAcc.id;
        }

        // Debit the bank or cash drawer
        if (accountId) {
          const account = await txClient.financialAccount.findUnique({
            where: { id: accountId },
          });

          if (account) {
            await txClient.financialAccount.update({
              where: { id: accountId },
              data: { balance: { decrement: existing.amount } },
            });

            const jrnCount = await txClient.journalTransaction.count();
            const jrnRef = `JRN-EXP-${String(jrnCount + 1).padStart(4, "0")}`;

            await txClient.journalTransaction.create({
              data: {
                entryDate: formatDate(existing.paymentDate),
                refCode: jrnRef,
                flowType: "OUTFLOW",
                particulars: existing.poNumber
                  ? `Settlement Disbursement: Voucher #${existing.voucherNo} [PO: ${existing.poNumber}] - ${existing.payeeName}`
                  : `Settlement Disbursement: Voucher #${existing.voucherNo} - ${existing.payeeName}`,
                fundingEntity: existing.payeeName,
                method: options?.paymentMethod || existing.paymentMethod || "Bank Transfer",
                amount: existing.amount,
                sourceAccountId: accountId,
                reconciliationStatus: "Reconciled",
              },
            });
          }
        }

        const updated = await txClient.expenseVoucher.update({
          where: { id },
          data: {
            status: "Disbursed",
            financialAccountId: accountId || existing.financialAccountId,
            chequeNumber: options?.chequeNumber !== undefined ? options.chequeNumber : existing.chequeNumber,
            paymentMethod: options?.paymentMethod || existing.paymentMethod,
            disbursedBy: approver,
            disbursedAt: new Date(),
            rejectionReason: null,
          },
        });

        await auditLogService.recordAuditEvent({
          module: "Finance & Accounts",
          actionType: "Expense Voucher Disbursed",
          severity: existing.amount >= 100000 ? "Critical" : "Routine",
          entityTarget: `Voucher #${updated.voucherNo} (${updated.payeeName})`,
          entityType: "ExpenseVoucher",
          entityId: updated.id,
          changeSummary: `Voucher ${updated.voucherNo} settled and disbursed by ${approver}. Net BDT ${updated.amount.toLocaleString("en-IN")}.`,
          priorPayload: existing,
          newPayload: updated,
          actorName: approver,
        });

        return updated;
      });
    }

    throw new AppError("Invalid authorization action", 400);
  },

  /**
   * Deletes a voucher (and reverses ledger if it was disbursed)
   */
  async deleteVoucher(id: string, actorName?: string) {
    const existing = await prisma.expenseVoucher.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Expense voucher not found", 404);
    }

    // If it was already disbursed and debited from an account, revert account balance
    if (existing.status === "Disbursed" && existing.financialAccountId) {
      await prisma.financialAccount.update({
        where: { id: existing.financialAccountId },
        data: { balance: { increment: existing.amount } },
      }).catch(() => null);
    }

    await auditLogService.recordAuditEvent({
      module: "Finance & Accounts",
      actionType: "Expense Voucher Deleted",
      severity: existing.amount >= 100000 ? "Critical" : "Routine",
      entityTarget: `Voucher #${existing.voucherNo} (${existing.payeeName})`,
      entityType: "ExpenseVoucher",
      entityId: existing.id,
      changeSummary: `Expense voucher ${existing.voucherNo} for ${existing.payeeName} (BDT ${existing.amount.toLocaleString("en-IN")}) was deleted by ${actorName || "Finance Controller"}.`,
      priorPayload: existing,
      actorName: actorName || "Finance Controller",
    });

    return prisma.expenseVoucher.delete({ where: { id } });
  },
};