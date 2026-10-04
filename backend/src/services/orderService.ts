import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";

const prisma = new PrismaClient();

const generateOrderNumber = () => `SO-2026-${Math.floor(4500 + Math.random() * 500)}`;
const generateChallanNumber = () => `DC-2026-${Math.floor(1100 + Math.random() * 100)}`;

const formatDate = (date?: string) => {
  if (!date) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return date;
};

interface LineItem {
  description: string;
  quantity: number;
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
    itemsSummary: string;
    itemsDetail: LineItem[];
    totalBoxes?: number;
    orderValue?: number;
    deliveryMethod?: string;
    status?: string;
    challanNumber?: string;
    invoiceNumber?: string;
  }) {
    if (!data.pharmacyName?.trim()) {
      throw new AppError("Pharmacy name is required", 400);
    }

    return prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: data.orderNumber || generateOrderNumber(),
          orderDate: formatDate(data.orderDate),
          pharmacyName: data.pharmacyName,
          territory: data.territory || "Dhaka North",
          assignedMio: data.assignedMio || "General MIO",
          itemsSummary: data.itemsSummary || "Pharmaceutical Products",
          totalBoxes: Number(data.totalBoxes) || 1,
          orderValue: Number(data.orderValue) || 0,
          deliveryMethod: data.deliveryMethod || "Sales Representative",
          status: data.status || "FEFO Allocated",
          challanNumber: data.challanNumber || generateChallanNumber(),
          invoiceNumber: data.invoiceNumber,
        },
      });

      if (Array.isArray(data.itemsDetail) && data.itemsDetail.length > 0) {
        for (const lineItem of data.itemsDetail) {
          const medicineName = (lineItem.description || "").trim();
          let qtyNeeded = Number(lineItem.quantity) || 0;

          if (!medicineName || qtyNeeded <= 0) continue;

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