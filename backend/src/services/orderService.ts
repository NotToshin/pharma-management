import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";
import { mirrorBatchQuantity } from "./productBatchService";

const prisma = new PrismaClient();

const generateUniqueOrderNumber = async (tx: any): Promise<string> => {
  const count = await tx.order.count();
  let candidate = `SO-2026-${String(count + 1).padStart(4, "0")}`;
  let exists = await tx.order.findUnique({ where: { orderNumber: candidate } });
  while (exists) {
    candidate = `SO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    exists = await tx.order.findUnique({ where: { orderNumber: candidate } });
  }
  return candidate;
};

const generateChallanNumber = () => `DC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

const formatDate = (date?: string) => {
  if (!date) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return date;
};

const remainingOrderDue = (order: { orderValue?: number | null; paidAmount?: number | null }) => {
  const total = Number(order.orderValue) || 0;
  const paid = Number(order.paidAmount) || 0;
  return Math.max(0, Math.round((total - paid) * 100) / 100);
};

interface LineItem {
  no?: number;
  description: string;
  quantity: number;
  unitCost?: number;
  total?: number;
}

export const orderService = {
  async getAllOrders() {
    const [orders, collections] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.deliveryCollection.findMany({
        where: { status: { not: "Bounced / Rejected" }, orderId: { not: null } },
        select: { orderId: true, amountCollected: true },
      }),
    ]);

    const collected = new Map<string, number>();
    for (const collection of collections) {
      if (!collection.orderId) continue;
      collected.set(
        collection.orderId,
        (collected.get(collection.orderId) || 0) + (Number(collection.amountCollected) || 0)
      );
    }

    return orders.map((order) => {
      const total = Number(order.orderValue) || 0;
      const paid = Math.min(total, (Number(order.paidAmount) || 0) + (collected.get(order.id) || 0));
      const paymentStatus = paid <= 0.009 ? "UNPAID" : paid + 0.009 >= total ? "PAID" : "PARTIALLY_PAID";
      return { ...order, paidAmount: paid, paymentStatus };
    });
  },

  async createOrder(data: {
    orderNumber?: string;
    orderDate?: string;
    pharmacyName: string;
    territory?: string;
    assignedMio?: string;
    itemsSummary?: string;
    itemsDetail?: LineItem[];
    totalBoxes?: number;
    orderValue?: number;
    discount?: number;
    discountAmount?: number;
    discountPercent?: number;
    comments?: string;
    deliveryMethod?: string;
    status?: string;
    challanNumber?: string;
    invoiceNumber?: string;
  }) {
    if (!data.pharmacyName?.trim()) {
      throw new AppError("Pharmacy name is required", 400);
    }

    return prisma.$transaction(async (tx) => {
      let finalOrderNumber = data.orderNumber?.trim();
      if (finalOrderNumber) {
        const existing = await tx.order.findUnique({ where: { orderNumber: finalOrderNumber } });
        if (existing) {
          finalOrderNumber = await generateUniqueOrderNumber(tx);
        }
      } else {
        finalOrderNumber = await generateUniqueOrderNumber(tx);
      }

      const formattedItems = Array.isArray(data.itemsDetail)
        ? data.itemsDetail.map((item, idx) => ({
            no: Number(item.no) || idx + 1,
            description: String(item.description || "").trim(),
            quantity: Number(item.quantity) || 1,
            unitCost: Number(item.unitCost) || 0,
            total: Number(item.total) || 0,
          }))
        : [];

      const newOrder = await tx.order.create({
        data: {
          orderNumber: finalOrderNumber,
          orderDate: formatDate(data.orderDate),
          pharmacyName: data.pharmacyName.trim(),
          territory: data.territory?.trim() || "Dhaka North",
          assignedMio: data.assignedMio?.trim() || "General MIO",
          itemsSummary:
            data.itemsSummary?.trim() ||
            (formattedItems.map((i) => `${i.description} (${i.quantity})`).join(", ") ||
              "General Formulations"),
          itemsDetail: formattedItems,
          totalBoxes:
            Number(data.totalBoxes) ||
            formattedItems.reduce((acc, i) => acc + i.quantity, 0) ||
            1,
          orderValue:
            Number(data.orderValue) ||
            formattedItems.reduce((acc, i) => acc + i.total, 0) ||
            0,
          discount: Number(data.discountAmount ?? data.discount ?? 0),
          comments: data.comments?.trim() || "",
          deliveryMethod: data.deliveryMethod || "Sales Representative",
          status: data.status || "FEFO Allocated",
          challanNumber: data.challanNumber || generateChallanNumber(),
          invoiceNumber: data.invoiceNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      });

      if (formattedItems.length > 0) {
        for (const lineItem of formattedItems) {
          const rawDesc = lineItem.description.trim();
          const cleanDesc = rawDesc.replace(/\s*\(\d+\)$/, "").trim();
          let qtyNeeded = lineItem.quantity;

          if (!cleanDesc || qtyNeeded <= 0) continue;

          try {
            const availableBatches = await tx.inventoryBatch.findMany({
              where: {
                OR: [
                  { brandName: { equals: cleanDesc, mode: "insensitive" } },
                  { brandName: { contains: cleanDesc, mode: "insensitive" } },
                  { genericName: { equals: cleanDesc, mode: "insensitive" } },
                  { genericName: { contains: cleanDesc, mode: "insensitive" } },
                  { skuCode: { equals: cleanDesc, mode: "insensitive" } },
                ],
                availableUnits: { gt: 0 },
              },
              orderBy: { expiryDate: "asc" },
            });

            for (const batch of availableBatches) {
              if (qtyNeeded <= 0) break;

              const deductUnits = Math.min(batch.availableUnits, qtyNeeded);
              const remainingUnits = batch.availableUnits - deductUnits;

              const updatedLot = await tx.inventoryBatch.update({
                where: { id: batch.id },
                data: { availableUnits: remainingUnits },
              });
              await mirrorBatchQuantity(tx, updatedLot.id, updatedLot.availableUnits);

              qtyNeeded -= deductUnits;
            }
          } catch (batchErr) {
            console.error("Batch inventory allocation notice:", batchErr);
          }
        }
      }

      // Sync Client Account Receivables (outstandingBalanceBDT)
      if (data.pharmacyName) {
        await tx.client.updateMany({
          where: { pharmacyName: { equals: data.pharmacyName.trim(), mode: "insensitive" } },
          data: {
            outstandingBalanceBDT: { increment: Number(newOrder.orderValue) || 0 },
            lastBilledDate: newOrder.orderDate,
          },
        }).catch(() => null);
      }

      return newOrder;
    });
  },

  async updateOrderStatus(id: string, status: string) {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Order not found", 404);
    }

    const isDelivered = status === "Delivered & Invoiced";
    const invoiceNum = isDelivered ? `INV-2026-${Math.floor(9020 + Math.random() * 80)}` : undefined;

    // If order was cancelled, restore allocated units to inventory and adjust client dues
    if (status === "Cancelled" && existing.status !== "Cancelled") {
      const items = Array.isArray(existing.itemsDetail) ? existing.itemsDetail : [];
      for (const item of items) {
        const desc = (item.description || "").replace(/\s*\(\d+\)$/, "").trim();
        const qty = Number(item.quantity) || 0;
        if (!desc || qty <= 0) continue;

        const batch = await prisma.inventoryBatch.findFirst({
          where: {
            OR: [
              { brandName: { contains: desc, mode: "insensitive" } },
              { genericName: { contains: desc, mode: "insensitive" } },
            ],
          },
        });

        if (batch) {
          const restored = await prisma.inventoryBatch.update({
            where: { id: batch.id },
            data: { availableUnits: { increment: qty } },
          }).catch(() => null);
          if (restored) {
            await mirrorBatchQuantity(prisma, restored.id, restored.availableUnits).catch(() => null);
          }
        }
      }

      if (existing.pharmacyName) {
        await prisma.client.updateMany({
          where: { pharmacyName: { equals: existing.pharmacyName.trim(), mode: "insensitive" } },
          data: { outstandingBalanceBDT: { decrement: remainingOrderDue(existing) } },
        }).catch(() => null);
      }
    }

    return prisma.order.update({
      where: { id },
      data: {
        status,
        ...(invoiceNum ? { invoiceNumber: invoiceNum } : {}),
      },
    });
  },

  async deleteOrder(id: string) {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Order not found", 404);
    }

    const alreadyPaid = Number(existing.paidAmount) || 0;
    if (alreadyPaid > 0.009) {
      throw new AppError(
        "This sales order has buyer payments. Reverse those payments before deleting it.",
        400
      );
    }

    // Restore stock if deleting an active order
    if (existing.status !== "Cancelled") {
      const items = Array.isArray(existing.itemsDetail) ? existing.itemsDetail : [];
      for (const item of items) {
        const desc = (item.description || "").replace(/\s*\(\d+\)$/, "").trim();
        const qty = Number(item.quantity) || 0;
        if (!desc || qty <= 0) continue;

        const batch = await prisma.inventoryBatch.findFirst({
          where: {
            OR: [
              { brandName: { contains: desc, mode: "insensitive" } },
              { genericName: { contains: desc, mode: "insensitive" } },
            ],
          },
        });

        if (batch) {
          const restored = await prisma.inventoryBatch.update({
            where: { id: batch.id },
            data: { availableUnits: { increment: qty } },
          }).catch(() => null);
          if (restored) {
            await mirrorBatchQuantity(prisma, restored.id, restored.availableUnits).catch(() => null);
          }
        }
      }

      if (existing.pharmacyName) {
        await prisma.client.updateMany({
          where: { pharmacyName: { equals: existing.pharmacyName.trim(), mode: "insensitive" } },
          data: { outstandingBalanceBDT: { decrement: remainingOrderDue(existing) } },
        }).catch(() => null);
      }
    }

    return prisma.order.delete({ where: { id } });
  },
};