import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";

export type SettlementDirection = "OUTGOING" | "INCOMING";

export interface SettlementAllocationInput {
  documentId: string;
  amount: number;
}

export interface CreateSettlementInput {
  direction: SettlementDirection;
  partyName: string;
  partyCode?: string | null;
  amount: number;
  paymentMethod: string;
  paymentDate?: string;
  transactionRef?: string | null;
  financialAccountId?: string | null;
  notes?: string;
  allocations?: SettlementAllocationInput[];
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const formatDate = (date?: string) => {
  if (!date) {
    return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  return date;
};

const paymentStatusFor = (total: number, paid: number) => {
  if (paid <= 0.009) return "UNPAID";
  if (paid + 0.009 >= total) return "PAID";
  return "PARTIALLY_PAID";
};

const isAdvanceMethod = (method: string) => method.trim().toLowerCase().includes("advance");

type OpenBill = {
  id: string;
  number: string;
  date: string;
  createdAt: Date;
  partyName: string;
  partyCode: string | null;
  total: number;
  paid: number;
  balance: number;
  documentStatus: string;
  paymentStatus: string;
  terms: string | null;
  referenceLabel: string;
};

async function priorPurchasePaidMap() {
  const vouchers = await prisma.expenseVoucher.findMany({
    where: { status: "Disbursed" },
    select: { poNumber: true, amount: true },
  });
  const paid = new Map<string, number>();
  for (const voucher of vouchers) {
    const key = voucher.poNumber?.trim();
    if (!key) continue;
    paid.set(key, round2((paid.get(key) || 0) + (Number(voucher.amount) || 0)));
  }
  return paid;
}

async function priorSalesPaidMap() {
  const collections = await prisma.deliveryCollection.findMany({
    where: { status: { not: "Bounced / Rejected" }, orderId: { not: null } },
    select: { orderId: true, amountCollected: true },
  });
  const paid = new Map<string, number>();
  for (const collection of collections) {
    if (!collection.orderId) continue;
    paid.set(
      collection.orderId,
      round2((paid.get(collection.orderId) || 0) + (Number(collection.amountCollected) || 0))
    );
  }
  return paid;
}

async function loadPurchaseBills(partyName?: string): Promise<OpenBill[]> {
  const priorPaid = await priorPurchasePaidMap();
  const orders = await prisma.purchaseOrder.findMany({
    where: {
      status: { notIn: ["Draft", "Cancelled"] },
      ...(partyName
        ? { wholesalerName: { equals: partyName.trim(), mode: "insensitive" } }
        : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  return orders.map((order) => {
    const total = round2(Number(order.totalAmountBDT) || 0);
    const paid = round2((Number(order.paidAmountBDT) || 0) + (priorPaid.get(order.poNumber) || 0));
    const balance = round2(Math.max(0, total - paid));
    return {
      id: order.id,
      number: order.poNumber,
      date: order.poDate,
      createdAt: order.createdAt,
      partyName: order.wholesalerName,
      partyCode: order.wholesalerCode || null,
      total,
      paid,
      balance,
      documentStatus: order.status,
      paymentStatus: order.paymentStatus || paymentStatusFor(total, paid),
      terms: order.paymentTerms || null,
      referenceLabel: "Purchase Order",
    };
  });
}

async function loadSalesBills(partyName?: string): Promise<OpenBill[]> {
  const priorPaid = await priorSalesPaidMap();
  const orders = await prisma.order.findMany({
    where: {
      status: { not: "Cancelled" },
      ...(partyName
        ? { pharmacyName: { equals: partyName.trim(), mode: "insensitive" } }
        : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  return orders.map((order) => {
    const total = round2(Number(order.orderValue) || 0);
    const paid = round2((Number(order.paidAmount) || 0) + (priorPaid.get(order.id) || 0));
    const balance = round2(Math.max(0, total - paid));
    return {
      id: order.id,
      number: order.orderNumber,
      date: order.orderDate,
      createdAt: order.createdAt,
      partyName: order.pharmacyName,
      partyCode: null,
      total,
      paid,
      balance,
      documentStatus: order.status,
      paymentStatus: order.paymentStatus || paymentStatusFor(total, paid),
      terms: order.invoiceNumber || null,
      referenceLabel: "Sales Order",
    };
  });
}

async function loadBills(direction: SettlementDirection, partyName?: string) {
  return direction === "OUTGOING" ? loadPurchaseBills(partyName) : loadSalesBills(partyName);
}

async function nextPaymentNumber(direction: SettlementDirection) {
  const year = new Date().getFullYear();
  const prefix = direction === "OUTGOING" ? `AKP-SPAY-${year}-` : `AKP-BPAY-${year}-`;
  const latest = await prisma.partySettlement.findFirst({
    where: { paymentNumber: { startsWith: prefix } },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return `${prefix}0001`;
  const last = parseInt(latest.paymentNumber.split("-").pop() || "0", 10);
  return `${prefix}${String((isNaN(last) ? 0 : last) + 1).padStart(4, "0")}`;
}

async function applyDocumentPaid(
  tx: typeof prisma,
  direction: SettlementDirection,
  documentId: string,
  delta: number
) {
  if (direction === "OUTGOING") {
    const doc = await tx.purchaseOrder.findUnique({ where: { id: documentId } });
    if (!doc) throw new AppError("Purchase order not found for this allocation", 404);
    const priorVouchers = await tx.expenseVoucher.findMany({
      where: { status: "Disbursed", poNumber: doc.poNumber },
      select: { amount: true },
    });
    const voucherPaid = round2(priorVouchers.reduce((sum, voucher) => sum + (Number(voucher.amount) || 0), 0));
    const total = round2(Number(doc.totalAmountBDT) || 0);
    const storedPaid = round2(Math.max(0, (Number(doc.paidAmountBDT) || 0) + delta));
    const effectivePaid = round2(storedPaid + voucherPaid);
    if (effectivePaid - total > 0.05) {
      throw new AppError(`Payment exceeds the balance of ${doc.poNumber}`, 400);
    }
    await tx.purchaseOrder.update({
      where: { id: documentId },
      data: {
        paidAmountBDT: storedPaid,
        paymentStatus: paymentStatusFor(total, Math.min(effectivePaid, total)),
      },
    });
    return { number: doc.poNumber, partyName: doc.wholesalerName, partyCode: doc.wholesalerCode || null };
  }

  const doc = await tx.order.findUnique({ where: { id: documentId } });
  if (!doc) throw new AppError("Sales order not found for this allocation", 404);
  const priorCollections = await tx.deliveryCollection.findMany({
    where: { orderId: doc.id, status: { not: "Bounced / Rejected" } },
    select: { amountCollected: true },
  });
  const collectionPaid = round2(
    priorCollections.reduce((sum, collection) => sum + (Number(collection.amountCollected) || 0), 0)
  );
  const total = round2(Number(doc.orderValue) || 0);
  const storedPaid = round2(Math.max(0, (Number(doc.paidAmount) || 0) + delta));
  const effectivePaid = round2(storedPaid + collectionPaid);
  if (effectivePaid - total > 0.05) {
    throw new AppError(`Payment exceeds the balance of ${doc.orderNumber}`, 400);
  }
  await tx.order.update({
    where: { id: documentId },
    data: {
      paidAmount: storedPaid,
      paymentStatus: paymentStatusFor(total, Math.min(effectivePaid, total)),
    },
  });
  return { number: doc.orderNumber, partyName: doc.pharmacyName, partyCode: null as string | null };
}

export const settlementService = {
  async getOpenBills(direction: SettlementDirection, partyName?: string) {
    const bills = await loadBills(direction, partyName);
    const advances = await prisma.partySettlement.findMany({
      where: {
        direction,
        status: "COMPLETED",
        unallocatedAmount: { gt: 0 },
        ...(partyName ? { partyName: { equals: partyName.trim(), mode: "insensitive" } } : {}),
      },
    });

    const partyMap = new Map<string, { name: string; code: string | null; openBalance: number; advanceBalance: number }>();

    if (direction === "OUTGOING") {
      const wholesalers = await prisma.wholesaler.findMany({ orderBy: { name: "asc" } });
      for (const wholesaler of wholesalers) {
        partyMap.set(wholesaler.name.trim().toLowerCase(), {
          name: wholesaler.name,
          code: wholesaler.wholesalerCode,
          openBalance: 0,
          advanceBalance: 0,
        });
      }
    } else {
      const clients = await prisma.client.findMany({ orderBy: { pharmacyName: "asc" } });
      for (const client of clients) {
        partyMap.set(client.pharmacyName.trim().toLowerCase(), {
          name: client.pharmacyName,
          code: client.clientCode,
          openBalance: 0,
          advanceBalance: 0,
        });
      }
    }

    for (const bill of bills) {
      const key = bill.partyName.trim().toLowerCase();
      const current = partyMap.get(key) || {
        name: bill.partyName,
        code: bill.partyCode,
        openBalance: 0,
        advanceBalance: 0,
      };
      current.openBalance = round2(current.openBalance + bill.balance);
      current.name = bill.partyName;
      if (!current.code && bill.partyCode) current.code = bill.partyCode;
      partyMap.set(key, current);
    }
    for (const advance of advances) {
      const key = advance.partyName.trim().toLowerCase();
      const current = partyMap.get(key) || {
        name: advance.partyName,
        code: advance.partyCode || null,
        openBalance: 0,
        advanceBalance: 0,
      };
      current.advanceBalance = round2(current.advanceBalance + (Number(advance.unallocatedAmount) || 0));
      partyMap.set(key, current);
    }

    const openBills = bills.filter((bill) => bill.balance > 0.009);
    const outstanding = round2(openBills.reduce((sum, bill) => sum + bill.balance, 0));
    const advanceBalance = round2(
      Array.from(partyMap.values()).reduce((sum, party) => sum + party.advanceBalance, 0)
    );

    return {
      bills: openBills,
      parties: Array.from(partyMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      summary: {
        openCount: openBills.length,
        outstanding,
        advanceBalance,
      },
    };
  },

  async getSettlements(filters: {
    direction: SettlementDirection;
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    partyName?: string;
  }) {
    const where: Record<string, unknown> = { direction: filters.direction };
    if (filters.status && filters.status !== "all") where.status = filters.status;
    if (filters.partyName?.trim()) {
      where.partyName = { equals: filters.partyName.trim(), mode: "insensitive" };
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { paymentNumber: { contains: q, mode: "insensitive" } },
        { partyName: { contains: q, mode: "insensitive" } },
        { transactionRef: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { accountTitle: { contains: q, mode: "insensitive" } },
      ];
    }

    const page = filters.page ? Math.max(1, parseInt(filters.page, 10) || 1) : 1;
    const fetchAll = filters.limit === "all" || filters.limit === "-1" || !filters.limit;
    const limit = fetchAll ? 0 : Math.max(1, parseInt(filters.limit || "20", 10) || 20);
    const skip = limit > 0 ? (page - 1) * limit : undefined;
    const take = limit > 0 ? limit : undefined;

    const [total, settlements] = await Promise.all([
      prisma.partySettlement.count({ where }),
      prisma.partySettlement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...(skip !== undefined ? { skip } : {}),
        ...(take !== undefined ? { take } : {}),
      }),
    ]);

    const completed = settlements.filter((row) => row.status === "COMPLETED");
    return {
      settlements,
      summary: {
        count: total,
        settledAmount: round2(completed.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)),
      },
      meta: {
        total,
        page,
        limit: limit > 0 ? limit : total,
        totalPages: limit > 0 ? Math.ceil(total / limit) || 1 : 1,
      },
    };
  },

  async createSettlement(data: CreateSettlementInput, actorName?: string) {
    if (data.direction === "INCOMING") {
      throw new AppError("Buyer payments are handled through Delivery Cash Collections (/finance/collections).", 400);
    }
    const direction = data.direction;
    const partyName = data.partyName.trim();
    const amount = round2(Number(data.amount));
    if (!partyName) throw new AppError("Party name is required", 400);
    if (!amount || amount <= 0) throw new AppError("Payment amount must be greater than zero", 400);

    const advance = isAdvanceMethod(data.paymentMethod);
    const paymentDate = formatDate(data.paymentDate);
    const bills = await loadBills(direction, partyName);
    const billById = new Map(bills.map((bill) => [bill.id, bill]));

    let planned: { documentId: string; documentNumber: string; amount: number }[] = [];

    if (data.allocations && data.allocations.length > 0) {
      for (const line of data.allocations) {
        const bill = billById.get(line.documentId);
        if (!bill) {
          throw new AppError("One of the selected orders is closed, cancelled, or belongs to another party", 400);
        }
        const lineAmount = round2(Number(line.amount));
        if (lineAmount - bill.balance > 0.05) {
          throw new AppError(`${bill.number} only has ৳${bill.balance.toLocaleString("en-IN")} open`, 400);
        }
        if (lineAmount > 0) {
          planned.push({ documentId: bill.id, documentNumber: bill.number, amount: lineAmount });
        }
      }
    } else if (!data.allocations) {
      let remaining = amount;
      for (const bill of bills.filter((item) => item.balance > 0.009)) {
        if (remaining <= 0.009) break;
        const take = round2(Math.min(bill.balance, remaining));
        if (take > 0) {
          planned.push({ documentId: bill.id, documentNumber: bill.number, amount: take });
          remaining = round2(remaining - take);
        }
      }
    }

    const allocatedSum = round2(planned.reduce((sum, line) => sum + line.amount, 0));
    if (allocatedSum - amount > 0.05) {
      throw new AppError("Allocated amounts cannot exceed the payment", 400);
    }
    const unallocatedAmount = round2(amount - allocatedSum);
    if (advance && unallocatedAmount > 0.05) {
      throw new AppError("An advance adjustment must be applied to open orders", 400);
    }
    if (advance && allocatedSum <= 0) {
      throw new AppError("Select at least one open order to apply the advance", 400);
    }

    const paymentNumber = await nextPaymentNumber(direction);

    const created = await prisma.$transaction(async (tx) => {
      let accountTitle: string | null = null;
      let financialAccountId = data.financialAccountId || null;
      const advanceDraws: { paymentId: string; amount: number }[] = [];

      if (advance) {
        const pool = await tx.partySettlement.findMany({
          where: {
            direction,
            status: "COMPLETED",
            partyName: { equals: partyName, mode: "insensitive" },
            unallocatedAmount: { gt: 0 },
          },
          orderBy: { createdAt: "asc" },
        });
        const available = round2(pool.reduce((sum, row) => sum + (Number(row.unallocatedAmount) || 0), 0));
        if (amount - available > 0.05) {
          throw new AppError(`Advance balance is only ৳${available.toLocaleString("en-IN")}`, 400);
        }
        let need = amount;
        for (const source of pool) {
          if (need <= 0.009) break;
          const take = round2(Math.min(Number(source.unallocatedAmount) || 0, need));
          if (take <= 0) continue;
          await tx.partySettlement.update({
            where: { id: source.id },
            data: { unallocatedAmount: round2((Number(source.unallocatedAmount) || 0) - take) },
          });
          advanceDraws.push({ paymentId: source.id, amount: take });
          need = round2(need - take);
        }
        financialAccountId = null;
      } else {
        if (!financialAccountId) {
          throw new AppError("Choose the cash drawer or bank account for this payment", 400);
        }
        const account = await tx.financialAccount.findUnique({ where: { id: financialAccountId } });
        if (!account) throw new AppError("Cash or bank account not found", 404);
        accountTitle = account.accountTitle;
        await tx.financialAccount.update({
          where: { id: account.id },
          data: { balance: direction === "OUTGOING" ? { decrement: amount } : { increment: amount } },
        });

        const stamp = Date.now().toString(36).toUpperCase();
        await tx.journalTransaction.create({
          data: {
            entryDate: paymentDate,
            refCode: `JRN-SPAY-${stamp}`,
            flowType: "OUTFLOW",
            particulars: `Supplier payment to ${partyName}${planned.length ? ` (${planned.map((p) => p.documentNumber).join(", ")})` : " (advance)"}`,
            fundingEntity: partyName,
            method: data.paymentMethod,
            amount,
            sourceAccountId: account.id,
            destinationAccountId: null,
            reconciliationStatus: "Reconciled",
          },
        });
      }

      for (const line of planned) {
        await applyDocumentPaid(tx as typeof prisma, direction, line.documentId, line.amount);
      }

      return tx.partySettlement.create({
        data: {
          paymentNumber,
          direction,
          partyName,
          partyCode: data.partyCode?.trim() || null,
          amount,
          unallocatedAmount,
          paymentMethod: data.paymentMethod,
          paymentDate,
          transactionRef: data.transactionRef?.trim() || null,
          financialAccountId,
          accountTitle,
          status: "COMPLETED",
          notes: data.notes?.trim() || "",
          allocations: planned.map((line) => ({
            documentType: direction === "OUTGOING" ? "PURCHASE_ORDER" : "SALES_ORDER",
            documentId: line.documentId,
            documentNumber: line.documentNumber,
            allocatedAmount: line.amount,
          })),
          advanceDraws,
          createdBy: actorName || "Finance Controller",
        },
      });
    });

    await auditLogService.recordAuditEvent({
      module: "Finance & Accounts",
      actionType: "Supplier Payment Recorded",
      severity: created.amount >= 100000 ? "Critical" : "Routine",
      entityTarget: `${created.paymentNumber} (${created.partyName})`,
      entityType: "PartySettlement",
      entityId: created.id,
      changeSummary: `${created.paymentNumber} recorded for ${created.partyName}. Amount ৳${created.amount.toLocaleString("en-IN")}, allocated ৳${round2(created.amount - created.unallocatedAmount).toLocaleString("en-IN")}, advance ৳${created.unallocatedAmount.toLocaleString("en-IN")}.`,
      newPayload: created,
      reasonForChange: created.notes || "Party settlement posted",
      actorName: actorName || created.createdBy || "Finance Controller",
    });

    return created;
  },

  async reverseSettlement(id: string, actorName?: string) {
    const existing = await prisma.partySettlement.findUnique({ where: { id } });
    if (!existing) throw new AppError("Payment not found", 404);
    if (existing.status !== "COMPLETED") {
      throw new AppError("Only a completed payment can be reversed", 400);
    }

    const allocated = round2(
      (existing.allocations || []).reduce((sum, line) => sum + (Number(line.allocatedAmount) || 0), 0)
    );
    const consumedAdvance = round2((Number(existing.amount) || 0) - allocated - (Number(existing.unallocatedAmount) || 0));
    if (consumedAdvance > 0.05) {
      throw new AppError("Part of this payment was later applied as an advance. Reverse that adjustment first.", 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const line of existing.allocations || []) {
        await applyDocumentPaid(
          tx as typeof prisma,
          existing.direction as SettlementDirection,
          line.documentId,
          -round2(Number(line.allocatedAmount) || 0)
        );
      }

      for (const draw of existing.advanceDraws || []) {
        const source = await tx.partySettlement.findUnique({ where: { id: draw.paymentId } });
        if (source && source.status === "COMPLETED") {
          await tx.partySettlement.update({
            where: { id: source.id },
            data: {
              unallocatedAmount: round2((Number(source.unallocatedAmount) || 0) + (Number(draw.amount) || 0)),
            },
          });
        }
      }

      const advance = isAdvanceMethod(existing.paymentMethod);
      if (!advance && existing.financialAccountId) {
        await tx.financialAccount.update({
          where: { id: existing.financialAccountId },
          data: {
            balance:
              existing.direction === "OUTGOING"
                ? { increment: existing.amount }
                : { decrement: existing.amount },
          },
        });
        const stamp = Date.now().toString(36).toUpperCase();
        await tx.journalTransaction.create({
          data: {
            entryDate: formatDate(),
            refCode: `JRN-REV-${stamp}`,
            flowType: existing.direction === "OUTGOING" ? "INFLOW" : "OUTFLOW",
            particulars: `Reversal of ${existing.paymentNumber} (${existing.partyName})`,
            fundingEntity: existing.partyName,
            method: existing.paymentMethod,
            amount: existing.amount,
            sourceAccountId: existing.direction === "INCOMING" ? existing.financialAccountId : null,
            destinationAccountId: existing.direction === "OUTGOING" ? existing.financialAccountId : null,
            reconciliationStatus: "Reconciled",
          },
        });
      }

      if (existing.direction === "INCOMING") {
        await tx.client.updateMany({
          where: { pharmacyName: { equals: existing.partyName, mode: "insensitive" } },
          data: { outstandingBalanceBDT: { increment: existing.amount } },
        });
      }

      return tx.partySettlement.update({
        where: { id },
        data: { status: "REVERSED", unallocatedAmount: 0 },
      });
    });

    await auditLogService.recordAuditEvent({
      module: "Finance & Accounts",
      actionType: "Party Payment Reversed",
      severity: "Critical",
      entityTarget: `${existing.paymentNumber} (${existing.partyName})`,
      entityType: "PartySettlement",
      entityId: existing.id,
      changeSummary: `${existing.paymentNumber} reversed. Order balances and the cash or bank account were restored.`,
      priorPayload: existing,
      newPayload: updated,
      reasonForChange: "Payment bounced or reversed",
      actorName: actorName || "Finance Controller",
    });

    return updated;
  },

  async deleteSettlement(id: string, actorName?: string) {
    const existing = await prisma.partySettlement.findUnique({ where: { id } });
    if (!existing) throw new AppError("Payment not found", 404);
    if (existing.status === "COMPLETED") {
      await this.reverseSettlement(id, actorName);
    }
    await prisma.partySettlement.delete({ where: { id } });
    await auditLogService.recordAuditEvent({
      module: "Finance & Accounts",
      actionType: "Party Payment Deleted",
      severity: "Critical",
      entityTarget: `${existing.paymentNumber} (${existing.partyName})`,
      entityType: "PartySettlement",
      entityId: existing.id,
      changeSummary: `${existing.paymentNumber} removed after its ledger effect was reversed.`,
      priorPayload: existing,
      reasonForChange: "Payment record deleted",
      actorName: actorName || "Finance Controller",
    });
  },
};
