import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";

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

const INITIAL_BATCHES = [
  {
    skuCode: "SKU-CF-200",
    brandName: "Cef-3 200mg/5ml Susp",
    genericName: "Cefixime Trihydrate",
    category: "Antibiotic",
    batchNumber: "BX-2026-039",
    mfgDate: "2026-01-10",
    expiryDate: "2027-08-30",
    availableUnits: 450,
    unitPrice: 185.0,
    warehouseBin: "Cold Room A (2-8°C)",
    storageCondition: "Cold Chain (2-8°C)",
  },
  {
    skuCode: "SKU-CL-625",
    brandName: "Clavroc 625mg Tab",
    genericName: "Amoxicillin + Clavulanic Acid",
    category: "Antibiotic",
    batchNumber: "BX-2025-119",
    mfgDate: "2025-06-15",
    expiryDate: "2027-04-20",
    availableUnits: 1200,
    unitPrice: 315.0,
    warehouseBin: "Bay 01 - Shelf A",
    storageCondition: "Controlled Ambient (<25°C)",
  },
  {
    skuCode: "SKU-CP-500",
    brandName: "Ciprocin 500mg Tab",
    genericName: "Ciprofloxacin HCl",
    category: "Antibiotic",
    batchNumber: "BX-2025-412",
    mfgDate: "2025-04-10",
    expiryDate: "2026-12-15",
    availableUnits: 850,
    unitPrice: 28.5,
    warehouseBin: "Bay 01 - Shelf A",
    storageCondition: "Controlled Ambient (<25°C)",
  },
  {
    skuCode: "SKU-NP-500",
    brandName: "Napa Extra 500mg",
    genericName: "Paracetamol + Caffeine",
    category: "Analgesic & Antipyretic",
    batchNumber: "BX-2026-802",
    mfgDate: "2026-02-01",
    expiryDate: "2028-01-15",
    availableUnits: 2500,
    unitPrice: 2.4,
    warehouseBin: "Bay 02 - Shelf B",
    storageCondition: "Controlled Ambient (<25°C)",
  },
  {
    skuCode: "SKU-AZ-500",
    brandName: "Azithromycin 500mg",
    genericName: "Azithromycin Dihydrate",
    category: "Antibiotic",
    batchNumber: "BX-2026-301",
    mfgDate: "2026-03-01",
    expiryDate: "2027-11-20",
    availableUnits: 600,
    unitPrice: 45.0,
    warehouseBin: "Bay 01 - Shelf A",
    storageCondition: "Controlled Ambient (<25°C)",
  },
];

export const inventoryService = {
  async seedInitialBatchesIfEmpty() {
    try {
      const count = await prisma.inventoryBatch.count();
      if (count === 0) {
        for (const item of INITIAL_BATCHES) {
          await prisma.inventoryBatch.create({ data: item });
        }
      }
    } catch (err) {
      console.warn("Could not seed initial batches:", err);
    }
  },

  async getAllBatches() {
    await this.seedInitialBatchesIfEmpty();
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
    const existing = await prisma.inventoryBatch.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Batch not found", 404);
    }

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
      throw new AppError("Batch not found", 404);
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
    const existing = await prisma.inventoryBatch.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Batch not found", 404);
    }

    const result = await prisma.inventoryBatch.delete({
      where: { id },
    });
    return result;
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
    if (!batch) throw new AppError("Batch not found", 404);

    const remainingUnits = batch.availableUnits - deductUnits;
    if (remainingUnits < 0) throw new AppError("Insufficient stock", 400);

    return prisma.inventoryBatch.update({
      where: { id: batchId },
      data: { availableUnits: remainingUnits },
    });
  },
};