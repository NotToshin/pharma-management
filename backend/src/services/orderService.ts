import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";

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

interface LineItem {
  no?: number;
  description: string;
  quantity: number;
  unitCost?: number;
  total?: number;
}

export const orderService = {
  async getAllOrders() {
    return prisma.order.findMany({
      orderBy: { createdAt: "desc" },
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
          const medicineName = lineItem.description.trim();
          let qtyNeeded = lineItem.quantity;

          if (!medicineName || qtyNeeded <= 0) continue;

          try {
            const availableBatches = await tx.inventoryBatch.findMany({
              where: {
                OR: [
                  { brandName: { equals: medicineName, mode: "insensitive" } },
                  { brandName: { contains: medicineName, mode: "insensitive" } },
                ],
                availableUnits: { gt: 0 },
              },
              orderBy: { expiryDate: "asc" },
            });

            for (const batch of availableBatches) {
              if (qtyNeeded <= 0) break;

              const deductUnits = Math.min(batch.availableUnits, qtyNeeded);
              const remainingUnits = batch.availableUnits - deductUnits;

              await tx.inventoryBatch.update({
                where: { id: batch.id },
                data: { availableUnits: remainingUnits },
              });

              qtyNeeded -= deductUnits;
            }
          } catch (batchErr) {
            console.error("Batch inventory allocation notice:", batchErr);
          }
        }
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
    return prisma.order.delete({ where: { id } });
  },
};