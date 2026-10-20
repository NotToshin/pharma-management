import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";
import {
  CreateVoucherInput,
  UpdateVoucherInput,
  QueryVoucherInput,
} from "../validations/paymentValidation";

const prisma = new PrismaClient();

const INITIAL_EXPENSE_VOUCHERS = [
  {
    voucherNo: "AKP-EXP-2026-0001",
    payeeName: "Square Pharmaceuticals Depot",
    payeeType: "Wholesaler / Vendor",
    poNumber: "AKP-PO-2026-0101",
    category: "Wholesaler Settlement",
    fundingSource: "Bank Account",
    sourceDetail: "Eastern Bank PLC (Corporate Ops)",
    paymentMethod: "BEFTN / RTGS",
    chequeNumber: "EBL-FT-99120",
    grossAmount: 185000,
    tdsRate: 5,
    tdsAmount: 9250,
    vdsRate: 7.5,
    vdsAmount: 13875,
    netAmount: 161875,
    amount: 161875,
    paymentDate: "12 Oct 2026",
    notes: "Consignment settlement for anti-infective formulations invoice # SQR-4481.",
    status: "Disbursed",
    preparedBy: "Accounts Officer",
    approvedBy: "Finance Director",
    approvedAt: new Date("2026-10-12T10:30:00Z"),
    disbursedBy: "Treasury Manager",
    disbursedAt: new Date("2026-10-12T11:15:00Z"),
  },
  {
    voucherNo: "AKP-EXP-2026-0002",
    payeeName: "Beximco Pharma Distribution",
    payeeType: "Wholesaler / Vendor",
    poNumber: "AKP-PO-2026-0102",
    category: "Wholesaler Settlement",
    fundingSource: "Bank Account",
    sourceDetail: "Islami Bank Bangladesh PLC",
    paymentMethod: "Cheque",
    chequeNumber: "IBBL-CQ-782914",
    grossAmount: 240000,
    tdsRate: 5,
    tdsAmount: 12000,
    vdsRate: 7.5,
    vdsAmount: 18000,
    netAmount: 210000,
    amount: 210000,
    paymentDate: "14 Oct 2026",
    notes: "Direct wholesale settlement for cardiovascular therapeutic batches.",
    status: "Disbursed",
    preparedBy: "Accounts Officer",
    approvedBy: "Finance Director",
    approvedAt: new Date("2026-10-14T09:45:00Z"),
    disbursedBy: "Treasury Manager",
    disbursedAt: new Date("2026-10-14T14:20:00Z"),
  },
  {
    voucherNo: "AKP-EXP-2026-0003",
    payeeName: "Dr. Tahmina Chowdhury & Advisory Panel",
    payeeType: "Doctor / Clinical",
    poNumber: null,
    category: "Doctor Gifts & Promotional",
    fundingSource: "Cash Safe",
    sourceDetail: "Head Office Cash Safe",
    paymentMethod: "Cash",
    chequeNumber: null,
    grossAmount: 45000,
    tdsRate: 10,
    tdsAmount: 4500,
    vdsRate: 0,
    vdsAmount: 0,
    netAmount: 40500,
    amount: 40500,
    paymentDate: "16 Oct 2026",
    notes: "Honorarium and CME symposium materials for Clinical Endocrinology Meet, Dhaka.",
    status: "Disbursed",
    preparedBy: "Product Executive",
    approvedBy: "Managing Director",
    approvedAt: new Date("2026-10-16T11:00:00Z"),
    disbursedBy: "Cashier HQ",
    disbursedAt: new Date("2026-10-16T15:30:00Z"),
  },
  {
    voucherNo: "AKP-EXP-2026-0004",
    payeeName: "MIO Field Force (Dhaka Metro East Team)",
    payeeType: "Staff TA/DA",
    poNumber: null,
    category: "Staff Welfare & Meals",
    fundingSource: "Cash Safe",
    sourceDetail: "Head Office Cash Safe",
    paymentMethod: "Cash",
    chequeNumber: null,
    grossAmount: 38500,
    tdsRate: 0,
    tdsAmount: 0,
    vdsRate: 0,
    vdsAmount: 0,
    netAmount: 38500,
    amount: 38500,
    paymentDate: "17 Oct 2026",
    notes: "Bi-weekly field conveyance, client visit Ta/Da, and emergency transit meals for 12 medical reps.",
    status: "Disbursed",
    preparedBy: "Field Admin",
    approvedBy: "RSM Executive",
    approvedAt: new Date("2026-10-17T08:30:00Z"),
    disbursedBy: "Cashier HQ",
    disbursedAt: new Date("2026-10-17T10:00:00Z"),
  },
  {
    voucherNo: "AKP-EXP-2026-0005",
    payeeName: "Tejgaon Cold-Chain Facility Power & Generator Fuel",
    payeeType: "Facility & Utilities",
    poNumber: null,
    category: "General Operating Expense",
    fundingSource: "Bank Account",
    sourceDetail: "Eastern Bank PLC (Corporate Ops)",
    paymentMethod: "BEFTN / RTGS",
    chequeNumber: "EBL-FT-99182",
    grossAmount: 62000,
    tdsRate: 5,
    tdsAmount: 3100,
    vdsRate: 0,
    vdsAmount: 0,
    netAmount: 58900,
    amount: 58900,
    paymentDate: "18 Oct 2026",
    notes: "Central warehouse HVAC refrigeration maintenance and backup diesel procurement for continuous 2-8°C cooling.",
    status: "Disbursed",
    preparedBy: "Warehouse Supervisor",
    approvedBy: "Finance Director",
    approvedAt: new Date("2026-10-18T14:10:00Z"),
    disbursedBy: "Treasury Manager",
    disbursedAt: new Date("2026-10-18T16:00:00Z"),
  },
  {
    voucherNo: "AKP-EXP-2026-0006",
    payeeName: "Directorate General of Drug Administration (DGDA)",
    payeeType: "Regulatory & DGDA",
    poNumber: null,
    category: "General Operating Expense",
    fundingSource: "Bank Account",
    sourceDetail: "Eastern Bank PLC (Corporate Ops)",
    paymentMethod: "Pay Order",
    chequeNumber: "PO-DGDA-2026-09",
    grossAmount: 75000,
    tdsRate: 0,
    tdsAmount: 0,
    vdsRate: 0,
    vdsAmount: 0,
    netAmount: 75000,
    amount: 75000,
    paymentDate: "19 Oct 2026",
    notes: "Statutory product registration and manufacturing site inspection fee renewal for 4 new antibiotic SKUs.",
    status: "Pending Approval",
    preparedBy: "Regulatory Affairs Officer",
    approvedBy: null,
    approvedAt: null,
    disbursedBy: null,
    disbursedAt: null,
  },
  {
    voucherNo: "AKP-EXP-2026-0007",
    payeeName: "Incepta Wholesalers Ltd",
    payeeType: "Wholesaler / Vendor",
    poNumber: "AKP-PO-2026-0103",
    category: "Wholesaler Settlement",
    fundingSource: "Bank Account",
    sourceDetail: "Standard Chartered Bank",
    paymentMethod: "BEFTN / RTGS",
    chequeNumber: "SCB-RTGS-5541",
    grossAmount: 310000,
    tdsRate: 5,
    tdsAmount: 15500,
    vdsRate: 7.5,
    vdsAmount: 23250,
    netAmount: 271250,
    amount: 271250,
    paymentDate: "20 Oct 2026",
    notes: "Requisition settlement for broad-spectrum cephalosporin and gastro-resistant formulations.",
    status: "Pending Approval",
    preparedBy: "Procurement Officer",
    approvedBy: null,
    approvedAt: null,
    disbursedBy: null,
    disbursedAt: null,
  },
  {
    voucherNo: "AKP-EXP-2026-0008",
    payeeName: "Apex Printing & Packaging Works",
    payeeType: "Wholesaler / Vendor",
    poNumber: null,
    category: "Meetings & Events",
    fundingSource: "Cash Safe",
    sourceDetail: "CEO Cash Safe",
    paymentMethod: "Cash",
    chequeNumber: null,
    grossAmount: 28000,
    tdsRate: 0,
    tdsAmount: 0,
    vdsRate: 0,
    vdsAmount: 0,
    netAmount: 28000,
    amount: 28000,
    paymentDate: "20 Oct 2026",
    notes: "Doctor prescription writing pads, sample envelopes, and clinical dosing reference chart print runs.",
    status: "Approved",
    preparedBy: "Marketing Executive",
    approvedBy: "Finance Director",
    approvedAt: new Date("2026-10-20T09:00:00Z"),
    disbursedBy: null,
    disbursedAt: null,
  },
];

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
   * Seed demo pharmaceutical vouchers if table is completely empty
   */
  async ensureSeedData() {
    try {
      const count = await prisma.expenseVoucher.count();
      if (count === 0) {
        for (const v of INITIAL_EXPENSE_VOUCHERS) {
          await prisma.expenseVoucher.create({
            data: v as any,
          });
        }
      }
    } catch (err) {
      console.warn("Could not seed initial expense vouchers:", err);
    }
  },

  /**
   * Retrieves all vouchers with optional filters and pagination
   */
  async getAllVouchers(filters?: QueryVoucherInput) {
    await this.ensureSeedData();

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
    await this.ensureSeedData();

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
              particulars: `Voucher #${finalVoucherNo} - ${data.payeeName} (${data.category})`,
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
                particulars: `Settlement Disbursement: Voucher #${existing.voucherNo} - ${existing.payeeName}`,
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