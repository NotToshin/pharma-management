import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";
import {
  CreateCollectionInput,
  UpdateCollectionInput,
  SettleBulkCollectionInput,
  QueryCollectionInput,
} from "../validations/collectionValidation";

const prisma = new PrismaClient();

const formatDate = (date?: string) => {
  if (!date) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return date;
};

const generateNextReceiptNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `AKP-COL-${currentYear}-`;

  const latestCollection = await prisma.deliveryCollection.findFirst({
    where: {
      receiptNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!latestCollection) {
    return `${prefix}0001`;
  }

  const parts = latestCollection.receiptNo.split("-");
  const lastNumber = parseInt(parts[parts.length - 1], 10);
  const nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

export const collectionService = {
  /**
   * Generates sequential collection receipt number
   */
  async getNextReceiptNumber() {
    return generateNextReceiptNumber();
  },

  /**
   * Seeds realistic delivery cash collections based on delivered orders if empty
   */
  async ensureSeedData() {
    try {
      const count = await prisma.deliveryCollection.count();
      if (count > 0) return;

      const orders = await prisma.order.findMany({
        where: { status: { not: "Cancelled" } },
        take: 12,
      });

      const sampleTerritories = ["Dhaka North", "Dhaka South", "Chittagong Central", "Sylhet Metro", "Rajshahi"];
      const sampleMios = ["Tanvir Ahmed", "Mahmudul Hasan", "Kamrul Islam", "Zahidul Karim", "Farhan Kabir"];
      const samplePharmacies = [
        "Labaid Pharmacy (Gulshan)",
        "Popular Medicine Corner (Dhanmondi)",
        "Green Life Drug House (Panthapath)",
        "Al-Madina Chemist (Uttara)",
        "Square Health Pharmacy (Mirpur)",
        "Ibn Sina Drug Point (Badda)",
        "Medix Care Chemist (Mohakhali)",
        "Central City Pharmacy (Motijheel)",
      ];

      const recordsToSeed: any[] = [];
      const currentYear = new Date().getFullYear();

      // Seed 8-10 realistic collections
      for (let i = 0; i < 8; i++) {
        const order = orders[i];
        const invoiceNo = order?.invoiceNumber || `INV-${currentYear}-${String(i + 1).padStart(4, "0")}`;
        const chemistName = order?.pharmacyName || samplePharmacies[i % samplePharmacies.length];
        const territory = order?.territory || sampleTerritories[i % sampleTerritories.length];
        const salesRepName = order?.assignedMio || sampleMios[i % sampleMios.length];
        const totalInvoice = Number(order?.orderValue) || (35000 + i * 14500);

        // Mix of realized and pending collections
        const isSettled = i < 4;
        const amountCollected = isSettled ? totalInvoice : Math.round(totalInvoice * 0.85);
        const dueAmountRemaining = Math.max(0, totalInvoice - amountCollected);

        const method = i % 3 === 0 ? "Cash" : i % 3 === 1 ? "Cheque" : "BEFTN / RTGS";
        const chequeNo = method === "Cheque" ? `CQ-IBBL-${78120 + i}` : method === "BEFTN / RTGS" ? `EBL-FT-${9910 + i}` : null;

        recordsToSeed.push({
          receiptNo: `AKP-COL-${currentYear}-${String(i + 1).padStart(4, "0")}`,
          invoiceNo,
          orderId: order?.id || null,
          clientCode: `CHM-${1000 + i}`,
          chemistName,
          territory,
          salesRepName,
          totalInvoiceAmount: totalInvoice,
          amountCollected,
          dueAmountRemaining,
          collectionDate: `${12 + i} Oct ${currentYear}`,
          paymentMethod: method,
          chequeNumber: chequeNo,
          status: isSettled ? "Cleared & Deposited" : "Pending Vault Clearance",
          destinationType: i % 2 === 0 ? "Cash Drawer" : "Bank Account",
          destinationName: i % 2 === 0 ? "Head Office Cash Safe" : "Eastern Bank PLC (Corporate Ops)",
          clearedBy: isSettled ? "Cashier & Vault Officer" : null,
          clearedAt: isSettled ? new Date(`2026-10-${12 + i}T16:00:00Z`) : null,
          notes: isSettled
            ? "MIO cash handover reconciled and deposited into vault."
            : "Chemist delivery realized by field MIO. Awaiting vault/bank clearance.",
        });
      }

      for (const rec of recordsToSeed) {
        await prisma.deliveryCollection.create({ data: rec });
      }
    } catch (err) {
      console.warn("Could not seed initial delivery collections:", err);
    }
  },

  /**
   * Retrieves all collections with query filters and pagination
   */
  async getAllCollections(filters?: QueryCollectionInput) {
    await this.ensureSeedData();

    const where: Record<string, any> = {};

    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { receiptNo: { contains: q, mode: "insensitive" } },
        { invoiceNo: { contains: q, mode: "insensitive" } },
        { chemistName: { contains: q, mode: "insensitive" } },
        { salesRepName: { contains: q, mode: "insensitive" } },
        { territory: { contains: q, mode: "insensitive" } },
        { chequeNumber: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ];
    }

    if (filters?.status && filters.status !== "all") {
      where.status = filters.status;
    }

    if (filters?.territory && filters.territory !== "all") {
      where.territory = filters.territory;
    }

    if (filters?.paymentMethod && filters.paymentMethod !== "all") {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters?.salesRep && filters.salesRep !== "all") {
      where.salesRepName = filters.salesRep;
    }

    // Pagination calculations
    const page = filters?.page ? Math.max(1, parseInt(filters.page, 10) || 1) : 1;
    const isFetchAll = filters?.limit === "all" || filters?.limit === "-1";
    const limit = isFetchAll ? 0 : filters?.limit ? Math.max(1, parseInt(filters.limit, 10) || 10) : 10;
    const skip = limit > 0 ? (page - 1) * limit : undefined;
    const take = limit > 0 ? limit : undefined;

    const [total, collections] = await Promise.all([
      prisma.deliveryCollection.count({ where }),
      prisma.deliveryCollection.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...(skip !== undefined ? { skip } : {}),
        ...(take !== undefined ? { take } : {}),
      }),
    ]);

    const totalPages = limit > 0 ? Math.ceil(total / limit) || 1 : 1;

    return {
      collections,
      meta: {
        total,
        page,
        limit: limit > 0 ? limit : total,
        totalPages,
      },
    };
  },

  /**
   * Get single collection by ID
   */
  async getCollectionById(id: string) {
    const item = await prisma.deliveryCollection.findUnique({ where: { id } });
    if (!item) {
      throw new AppError("Collection receipt not found", 404);
    }
    return item;
  },

  /**
   * Aggregated KPI metrics for delivery cash collections & vault clearance
   */
  async getCollectionMetrics() {
    await this.ensureSeedData();

    const all = await prisma.deliveryCollection.findMany();

    let totalRealizedBDT = 0;
    let totalPendingClearanceBDT = 0;
    let totalInvoicedBDT = 0;
    let outstandingDueBDT = 0;
    let realizedCount = 0;
    let pendingCount = 0;

    const territoryMap: Record<string, { count: number; amount: number }> = {};
    const methodMap: Record<string, { count: number; amount: number }> = {};

    for (const c of all) {
      const collected = Number(c.amountCollected) || 0;
      const invoiced = Number(c.totalInvoiceAmount) || 0;
      const due = Number(c.dueAmountRemaining) || Math.max(0, invoiced - collected);

      totalInvoicedBDT += invoiced;
      outstandingDueBDT += due;

      if (c.status === "Cleared & Deposited") {
        totalRealizedBDT += collected;
        realizedCount++;
      } else if (c.status === "Pending Vault Clearance") {
        totalPendingClearanceBDT += collected;
        pendingCount++;
      }

      // Territory
      const terr = c.territory || "Unassigned";
      if (!territoryMap[terr]) territoryMap[terr] = { count: 0, amount: 0 };
      territoryMap[terr].count++;
      territoryMap[terr].amount += collected;

      // Payment method
      const meth = c.paymentMethod || "Cash";
      if (!methodMap[meth]) methodMap[meth] = { count: 0, amount: 0 };
      methodMap[meth].count++;
      methodMap[meth].amount += collected;
    }

    return {
      totalReceipts: all.length,
      totalRealizedBDT,
      totalPendingClearanceBDT,
      totalInvoicedBDT,
      outstandingDueBDT,
      realizedCount,
      pendingCount,
      territoryBreakdown: Object.entries(territoryMap).map(([territory, stats]) => ({
        territory,
        count: stats.count,
        amount: stats.amount,
      })),
      paymentMethodBreakdown: Object.entries(methodMap).map(([method, stats]) => ({
        method,
        count: stats.count,
        amount: stats.amount,
      })),
    };
  },

  /**
   * Record new delivery cash collection receipt
   */
  async createCollection(data: CreateCollectionInput, actorName?: string) {
    if (!data.chemistName?.trim() || !data.invoiceNo?.trim()) {
      throw new AppError("Chemist name and invoice number are required", 400);
    }

    const collected = Number(data.amountCollected);
    const invoiced = Number(data.totalInvoiceAmount);

    if (isNaN(collected) || collected <= 0) {
      throw new AppError("Valid collected amount is required", 400);
    }

    const finalReceiptNo = data.receiptNo?.trim() ? data.receiptNo.trim() : await generateNextReceiptNumber();
    const dueRemaining = Math.max(0, invoiced - collected);
    const status = data.status || "Pending Vault Clearance";
    const dateFormatted = formatDate(data.collectionDate);

    const created = await prisma.$transaction(async (txClient) => {
      let targetAccountId = data.financialAccountId;

      // If clearing immediately and destination specified, lookup account
      if (status === "Cleared & Deposited") {
        if (!targetAccountId && data.destinationName) {
          const acc = await txClient.financialAccount.findFirst({
            where: {
              OR: [
                { accountTitle: { contains: data.destinationName.trim(), mode: "insensitive" } },
                { institution: { contains: data.destinationName.trim(), mode: "insensitive" } },
              ],
            },
          });
          if (acc) targetAccountId = acc.id;
        }

        // Credit the safe/bank account
        if (targetAccountId) {
          await txClient.financialAccount.update({
            where: { id: targetAccountId },
            data: { balance: { increment: collected } },
          });

          const jrnCount = await txClient.journalTransaction.count();
          const jrnRef = `JRN-COL-${String(jrnCount + 1).padStart(4, "0")}`;

          await txClient.journalTransaction.create({
            data: {
              entryDate: dateFormatted,
              refCode: jrnRef,
              flowType: "INFLOW",
              particulars: `Delivery Collection: ${finalReceiptNo} from ${data.chemistName} (Inv: ${data.invoiceNo})`,
              fundingEntity: data.chemistName,
              method: data.paymentMethod || "Cash Handover",
              amount: collected,
              destinationAccountId: targetAccountId,
              reconciliationStatus: "Reconciled",
            },
          });

          await txClient.treasuryDeposit.create({
            data: {
              destinationType: data.destinationType || "Cash Drawer",
              destinationName: data.destinationName || "Head Office Cash Safe",
              amount: collected,
              salesRep: data.salesRepName,
              resolution: `Collection Receipt ${finalReceiptNo}`,
            },
          });
        }

        // Decrement client outstanding dues if registered
        if (data.chemistName) {
          await txClient.client.updateMany({
            where: { pharmacyName: { equals: data.chemistName.trim(), mode: "insensitive" } },
            data: { outstandingBalanceBDT: { decrement: collected } },
          });
        }

        // Mark order settled if fully paid
        if (dueRemaining === 0) {
          if (data.orderId) {
            await txClient.order.update({
              where: { id: data.orderId },
              data: { status: "Settled" },
            }).catch(() => null);
          } else if (data.invoiceNo) {
            await txClient.order.updateMany({
              where: { invoiceNumber: data.invoiceNo },
              data: { status: "Settled" },
            }).catch(() => null);
          }
        }
      }

      return txClient.deliveryCollection.create({
        data: {
          receiptNo: finalReceiptNo,
          invoiceNo: data.invoiceNo.trim(),
          orderId: data.orderId || null,
          clientCode: data.clientCode || null,
          chemistName: data.chemistName.trim(),
          territory: data.territory.trim(),
          salesRepName: data.salesRepName.trim(),
          totalInvoiceAmount: invoiced,
          amountCollected: collected,
          dueAmountRemaining: dueRemaining,
          collectionDate: dateFormatted,
          paymentMethod: data.paymentMethod || "Cash",
          chequeNumber: data.chequeNumber?.trim() || null,
          status,
          destinationType: data.destinationType || "Cash Drawer",
          destinationName: data.destinationName || "Head Office Cash Safe",
          financialAccountId: targetAccountId || null,
          clearedBy: status === "Cleared & Deposited" ? (actorName || "Finance Controller") : null,
          clearedAt: status === "Cleared & Deposited" ? new Date() : null,
          notes: data.notes || "",
        },
      });
    });

    await auditLogService.recordAuditEvent({
      module: "Finance & Accounts",
      actionType: "Delivery Cash Collection Logged",
      severity: created.amountCollected >= 100000 ? "Critical" : "Routine",
      entityTarget: `Receipt #${created.receiptNo} (${created.chemistName})`,
      entityType: "DeliveryCollection",
      entityId: created.id,
      changeSummary: `Collection of BDT ${created.amountCollected.toLocaleString("en-IN")} logged from ${created.chemistName} by ${created.salesRepName}. Status: ${created.status}.`,
      newPayload: created,
      actorName: actorName || "Finance Controller",
    });

    return created;
  },

  /**
   * Updates an existing collection record
   */
  async updateCollection(id: string, data: UpdateCollectionInput, actorName?: string) {
    const existing = await prisma.deliveryCollection.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Collection receipt not found", 404);
    }

    const updateData: Record<string, any> = {};

    if (data.receiptNo !== undefined) updateData.receiptNo = data.receiptNo.trim();
    if (data.invoiceNo !== undefined) updateData.invoiceNo = data.invoiceNo.trim();
    if (data.orderId !== undefined) updateData.orderId = data.orderId;
    if (data.clientCode !== undefined) updateData.clientCode = data.clientCode;
    if (data.chemistName !== undefined) updateData.chemistName = data.chemistName.trim();
    if (data.territory !== undefined) updateData.territory = data.territory.trim();
    if (data.salesRepName !== undefined) updateData.salesRepName = data.salesRepName.trim();
    if (data.totalInvoiceAmount !== undefined) updateData.totalInvoiceAmount = Number(data.totalInvoiceAmount);
    if (data.amountCollected !== undefined) updateData.amountCollected = Number(data.amountCollected);
    if (data.collectionDate !== undefined) updateData.collectionDate = formatDate(data.collectionDate);
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.chequeNumber !== undefined) updateData.chequeNumber = data.chequeNumber?.trim() || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.destinationType !== undefined) updateData.destinationType = data.destinationType;
    if (data.destinationName !== undefined) updateData.destinationName = data.destinationName;
    if (data.financialAccountId !== undefined) updateData.financialAccountId = data.financialAccountId;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const totalInv = updateData.totalInvoiceAmount !== undefined ? updateData.totalInvoiceAmount : existing.totalInvoiceAmount;
    const amtColl = updateData.amountCollected !== undefined ? updateData.amountCollected : existing.amountCollected;
    updateData.dueAmountRemaining = Math.max(0, totalInv - amtColl);

    const updated = await prisma.deliveryCollection.update({
      where: { id },
      data: updateData,
    });

    await auditLogService.recordAuditEvent({
      module: "Finance & Accounts",
      actionType: "Delivery Collection Updated",
      severity: "Routine",
      entityTarget: `Receipt #${updated.receiptNo} (${updated.chemistName})`,
      entityType: "DeliveryCollection",
      entityId: updated.id,
      changeSummary: `Receipt ${updated.receiptNo} modified. Amount: BDT ${updated.amountCollected.toLocaleString("en-IN")}, Status: ${updated.status}.`,
      priorPayload: existing,
      newPayload: updated,
      actorName: actorName || "Finance Controller",
    });

    return updated;
  },

  /**
   * Settle and clear single or bulk delivery collections into physical cash safes or bank accounts
   */
  async settleAndClearCollections(data: SettleBulkCollectionInput, actorName?: string) {
    if (!data.collectionIds || data.collectionIds.length === 0) {
      throw new AppError("At least one collection ID must be selected for settlement", 400);
    }

    const collections = await prisma.deliveryCollection.findMany({
      where: { id: { in: data.collectionIds } },
    });

    if (collections.length === 0) {
      throw new AppError("No matching collections found", 404);
    }

    // Filter items that are not yet cleared
    const pendingItems = collections.filter((c) => c.status !== "Cleared & Deposited");
    if (pendingItems.length === 0) {
      throw new AppError("All selected collections are already cleared and deposited", 400);
    }

    const totalSettlementBDT = pendingItems.reduce((sum, item) => sum + (Number(item.amountCollected) || 0), 0);
    const dateFormatted = formatDate();
    const clearer = data.clearedBy || actorName || "Finance Controller";

    const result = await prisma.$transaction(async (txClient) => {
      let targetAccountId = data.financialAccountId;

      // Lookup financialAccount if not specified directly
      if (!targetAccountId && data.destinationName) {
        const acc = await txClient.financialAccount.findFirst({
          where: {
            OR: [
              { accountTitle: { contains: data.destinationName.trim(), mode: "insensitive" } },
              { institution: { contains: data.destinationName.trim(), mode: "insensitive" } },
            ],
          },
        });
        if (acc) targetAccountId = acc.id;
      }

      // 1. Credit the bank or cash safe account balance
      if (targetAccountId) {
        await txClient.financialAccount.update({
          where: { id: targetAccountId },
          data: { balance: { increment: totalSettlementBDT } },
        });

        const jrnCount = await txClient.journalTransaction.count();
        const jrnRef = `JRN-COL-${String(jrnCount + 1).padStart(4, "0")}`;

        await txClient.journalTransaction.create({
          data: {
            entryDate: dateFormatted,
            refCode: jrnRef,
            flowType: "INFLOW",
            particulars: `Vault Settlement: Bulk cleared ${pendingItems.length} MIO delivery collection(s) to ${data.destinationName}`,
            fundingEntity: "Field MIO Collections",
            method: data.paymentMethod || (data.destinationType === "Cash Drawer" ? "Cash Handover" : "BEFTN / RTGS"),
            amount: totalSettlementBDT,
            destinationAccountId: targetAccountId,
            reconciliationStatus: "Reconciled",
          },
        });
      }

      // 2. Post to Treasury Deposit table
      await txClient.treasuryDeposit.create({
        data: {
          destinationType: data.destinationType,
          destinationName: data.destinationName,
          amount: totalSettlementBDT,
          salesRep: clearer,
          resolution: `Cleared & Deposited ${pendingItems.length} delivery collection receipts into ${data.destinationName}.`,
        },
      });

      // 3. Mark each collection as Cleared & Deposited
      for (const item of pendingItems) {
        await txClient.deliveryCollection.update({
          where: { id: item.id },
          data: {
            status: "Cleared & Deposited",
            destinationType: data.destinationType,
            destinationName: data.destinationName,
            financialAccountId: targetAccountId || item.financialAccountId,
            clearedBy: clearer,
            clearedAt: new Date(),
          },
        });

        // Reduce client outstanding balance if matching
        if (item.chemistName) {
          await txClient.client.updateMany({
            where: { pharmacyName: { equals: item.chemistName.trim(), mode: "insensitive" } },
            data: { outstandingBalanceBDT: { decrement: item.amountCollected } },
          });
        }

        // Mark associated order as Settled
        if (item.orderId) {
          await txClient.order.update({
            where: { id: item.orderId },
            data: { status: "Settled" },
          }).catch(() => null);
        } else if (item.invoiceNo) {
          await txClient.order.updateMany({
            where: { invoiceNumber: item.invoiceNo },
            data: { status: "Settled" },
          }).catch(() => null);
        }
      }

      return {
        clearedCount: pendingItems.length,
        totalSettlementBDT,
        destinationName: data.destinationName,
      };
    });

    await auditLogService.recordAuditEvent({
      module: "Finance & Accounts",
      actionType: "Delivery Collections Cleared & Deposited",
      severity: result.totalSettlementBDT >= 100000 ? "Critical" : "Routine",
      entityTarget: `${result.clearedCount} Collection Receipts into ${result.destinationName}`,
      entityType: "DeliveryCollection",
      changeSummary: `Cleared and credited BDT ${result.totalSettlementBDT.toLocaleString("en-IN")} across ${result.clearedCount} delivery collection receipts into [${data.destinationType}] ${result.destinationName}.`,
      actorName: clearer,
    });

    return result;
  },

  /**
   * Deletes a collection receipt (reverses ledger if it was cleared)
   */
  async deleteCollection(id: string, actorName?: string) {
    const existing = await prisma.deliveryCollection.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Collection receipt not found", 404);
    }

    // If cleared, reverse account balance and revert client balance
    if (existing.status === "Cleared & Deposited" && existing.financialAccountId) {
      await prisma.financialAccount.update({
        where: { id: existing.financialAccountId },
        data: { balance: { decrement: existing.amountCollected } },
      }).catch(() => null);

      if (existing.chemistName) {
        await prisma.client.updateMany({
          where: { pharmacyName: { equals: existing.chemistName.trim(), mode: "insensitive" } },
          data: { outstandingBalanceBDT: { increment: existing.amountCollected } },
        }).catch(() => null);
      }
    }

    await auditLogService.recordAuditEvent({
      module: "Finance & Accounts",
      actionType: "Delivery Collection Deleted",
      severity: existing.amountCollected >= 100000 ? "Critical" : "Routine",
      entityTarget: `Receipt #${existing.receiptNo} (${existing.chemistName})`,
      entityType: "DeliveryCollection",
      entityId: existing.id,
      changeSummary: `Collection receipt ${existing.receiptNo} for BDT ${existing.amountCollected.toLocaleString("en-IN")} deleted by ${actorName || "Finance Controller"}.`,
      priorPayload: existing,
      actorName: actorName || "Finance Controller",
    });

    return prisma.deliveryCollection.delete({ where: { id } });
  },
};
