import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getDaysToExpiry(expiryDateStr: string): number {
  const parsedTime = Date.parse(expiryDateStr);
  const targetDate = isNaN(parsedTime) ? new Date(2027, 11, 31).getTime() : parsedTime;
  const diffTime = targetDate - Date.now();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

function getFEFOStatus(days: number): string {
  if (days <= 60) return "Near Expiry";
  if (days <= 180) return "Priority Out";
  return "Healthy";
}

const generateSKU = (brandName?: string) => {
  const brandPrefix = brandName ? brandName.slice(0, 2).toUpperCase() : "MD";
  return `SKU-${brandPrefix}-${Math.floor(100 + Math.random() * 900)}`;
};

const generateBatchNumber = () => `BX-${Date.now()}`;

export const inventoryService = {
  async getAllBatches() {
    const batches = await prisma.inventoryBatch.findMany({
      orderBy: { expiryDate: "asc" },
    });

    return batches.map((b) => {
      const days = getDaysToExpiry(b.expiryDate);
      return {
        ...b,
        daysToExpiry: days,
        fefoStatus: getFEFOStatus(days),
        availableUnits: Number(b.availableUnits),
        unitPrice: Number(b.unitPrice),
      };
    }).sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  },

  async createBatch(data: {
    brandName: string;
    genericName: string;
    category?: string;
    batchNumber?: string;
    mfgDate?: string;
    expiryDate?: string;
    availableUnits?: number;
    unitPrice?: number;
    warehouseBin?: string;
    storageCondition?: string;
  }) {
    return prisma.inventoryBatch.create({
      data: {
        skuCode: generateSKU(data.brandName),
        brandName: data.brandName?.trim() || "",
        genericName: data.genericName?.trim() || "",
        category: data.category || "Analgesic & Antipyretic",
        batchNumber: data.batchNumber?.trim() || generateBatchNumber(),
        mfgDate: data.mfgDate || new Date().toISOString().slice(0, 10),
        expiryDate: data.expiryDate || "2027-12-31",
        availableUnits: Math.max(0, parseInt(String(data.availableUnits), 10) || 0),
        unitPrice: Number(data.unitPrice) || 0,
        warehouseBin: data.warehouseBin?.trim() || "Bay 01 - Shelf A",
        storageCondition: data.storageCondition || "Controlled Ambient (<25°C)",
      },
    });
  },

  async updateBatch(id: string, data: {
    brandName?: string;
    genericName?: string;
    category?: string;
    batchNumber?: string;
    mfgDate?: string;
    expiryDate?: string;
    availableUnits?: number;
    unitPrice?: number;
    warehouseBin?: string;
    storageCondition?: string;
  }) {
    const updateData: Record<string, any> = {};
    if (data.brandName !== undefined) updateData.brandName = data.brandName.trim();
    if (data.genericName !== undefined) updateData.genericName = data.genericName.trim();
    if (data.category !== undefined) updateData.category = data.category;
    if (data.batchNumber !== undefined) updateData.batchNumber = data.batchNumber.trim();
    if (data.mfgDate !== undefined) updateData.mfgDate = data.mfgDate;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate;
    if (data.availableUnits !== undefined) updateData.availableUnits = Math.max(0, parseInt(String(data.availableUnits), 10) || 0);
    if (data.unitPrice !== undefined) updateData.unitPrice = Number(data.unitPrice) || 0;
    if (data.warehouseBin !== undefined) updateData.warehouseBin = data.warehouseBin.trim();
    if (data.storageCondition !== undefined) updateData.storageCondition = data.storageCondition;

    return prisma.inventoryBatch.update({
      where: { id },
      data: updateData,
    });
  },

  async adjustStock(id: string, type: "IN" | "OUT", quantity: number) {
    const currentBatch = await prisma.inventoryBatch.findUnique({ where: { id } });
    if (!currentBatch) {
      throw new Error("Batch not found");
    }

    const newUnits = type === "IN"
      ? currentBatch.availableUnits + quantity
      : Math.max(0, currentBatch.availableUnits - quantity);

    return prisma.inventoryBatch.update({
      where: { id },
      data: { availableUnits: newUnits },
    });
  },

  async deleteBatch(id: string) {
    const result = await prisma.inventoryBatch.deleteMany({
      where: { id },
    });
    return result.count;
  },

  async findBatchesByMedicineName(medicineName: string) {
    return prisma.inventoryBatch.findMany({
      where: {
        OR: [
          { brandName: { equals: medicineName, mode: "insensitive" } },
          { brandName: { contains: medicineName, mode: "insensitive" } },
        ],
        availableUnits: { gt: 0 },
      },
      orderBy: { expiryDate: "asc" },
    });
  },

  async deductStock(batchId: string, deductUnits: number) {
    const batch = await prisma.inventoryBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error("Batch not found");

    const remainingUnits = batch.availableUnits - deductUnits;
    if (remainingUnits < 0) throw new Error("Insufficient stock");

    return prisma.inventoryBatch.update({
      where: { id: batchId },
      data: { availableUnits: remainingUnits },
    });
  },
};