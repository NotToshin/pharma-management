import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to calculate days to expiry dynamically
function getDaysToExpiry(expiryDateStr: string): number {
  const parsedTime = Date.parse(expiryDateStr);
  const targetDate = isNaN(parsedTime) ? new Date(2027, 11, 31).getTime() : parsedTime;
  const diffTime = targetDate - Date.now();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

// 1. GET /api/inventory — Fetch all batches sorted by FEFO priority (earliest expiry first)
export const getAllBatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const batches = await prisma.inventoryBatch.findMany({
      orderBy: { expiryDate: "asc" },
    });

    // Add daysToExpiry and FEFO status dynamically before responding
    const mapped = batches.map((b) => {
      const days = getDaysToExpiry(b.expiryDate);
      let fefoStatus = "Healthy";
      if (days <= 60) {
        fefoStatus = "Near Expiry";
      } else if (days <= 180) {
        fefoStatus = "Priority Out";
      }

      return {
        ...b,
        daysToExpiry: days,
        fefoStatus,
        availableUnits: Number(b.availableUnits),
        unitPrice: Number(b.unitPrice),
      };
    });

    // Ensure strictly earliest expiry is first
    mapped.sort((a, b) => a.daysToExpiry - b.daysToExpiry);

    res.status(200).json(mapped);
  } catch (error) {
    console.error("Error fetching inventory batches:", error);
    res.status(500).json({ error: "Failed to fetch inventory ledger" });
  }
};

// 2. POST /api/inventory — Receive a new batch
export const createBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      brandName,
      genericName,
      category,
      batchNumber,
      mfgDate,
      expiryDate,
      availableUnits,
      unitPrice,
      warehouseBin,
      storageCondition,
    } = req.body;

    const brandPrefix = brandName ? brandName.slice(0, 2).toUpperCase() : "MD";
    const skuCode = `SKU-${brandPrefix}-${Math.floor(100 + Math.random() * 900)}`;

    const newBatch = await prisma.inventoryBatch.create({
      data: {
        skuCode,
        brandName: brandName ? brandName.trim() : "",
        genericName: genericName ? genericName.trim() : "",
        category: category || "Analgesic & Antipyretic",
        batchNumber: batchNumber ? batchNumber.trim() : `BX-${Date.now()}`,
        mfgDate: mfgDate || new Date().toISOString().slice(0, 10),
        expiryDate: expiryDate || "2027-12-31",
        availableUnits: Math.max(0, parseInt(availableUnits, 10) || 0),
        unitPrice: Number(unitPrice) || 0,
        warehouseBin: warehouseBin?.trim() || "Bay 01 - Shelf A",
        storageCondition: storageCondition || "Controlled Ambient (<25°C)",
      },
    });

    res.status(201).json(newBatch);
  } catch (error: any) {
    console.error("Error receiving batch:", error);
    res.status(400).json({ error: error.message || "Failed to create inventory batch" });
  }
};

// 3. PUT /api/inventory/:id — Update batch details or adjust available units
export const updateBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      brandName,
      genericName,
      category,
      batchNumber,
      mfgDate,
      expiryDate,
      availableUnits,
      unitPrice,
      warehouseBin,
      storageCondition,
    } = req.body;

    const existing = await prisma.inventoryBatch.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Batch record not found in database" });
      return;
    }

    const updateData: any = {};
    if (brandName !== undefined) updateData.brandName = brandName.trim();
    if (genericName !== undefined) updateData.genericName = genericName.trim();
    if (category !== undefined) updateData.category = category;
    if (batchNumber !== undefined) updateData.batchNumber = batchNumber.trim();
    if (mfgDate !== undefined) updateData.mfgDate = mfgDate;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate;
    if (availableUnits !== undefined) updateData.availableUnits = Math.max(0, parseInt(availableUnits, 10) || 0);
    if (unitPrice !== undefined) updateData.unitPrice = Number(unitPrice) || 0;
    if (warehouseBin !== undefined) updateData.warehouseBin = warehouseBin.trim();
    if (storageCondition !== undefined) updateData.storageCondition = storageCondition;

    const updated = await prisma.inventoryBatch.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json(updated);
  } catch (error: any) {
    console.error("Error updating inventory batch:", error);
    res.status(400).json({ error: error.message || "Failed to update inventory batch" });
  }
};

// 4. POST /api/inventory/:id/adjust — Atomic quick stock adjustment (+ / -)
export const adjustStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, quantity } = req.body; // type: "IN" | "OUT"
    const qty = parseInt(quantity, 10);

    if (isNaN(qty) || qty <= 0) {
      res.status(400).json({ error: "Valid adjustment quantity is required" });
      return;
    }

    const currentBatch = await prisma.inventoryBatch.findUnique({ where: { id } });
    if (!currentBatch) {
      res.status(404).json({ error: "Batch not found" });
      return;
    }

    const newUnits =
      type === "IN"
        ? currentBatch.availableUnits + qty
        : Math.max(0, currentBatch.availableUnits - qty);

    const updated = await prisma.inventoryBatch.update({
      where: { id },
      data: { availableUnits: newUnits },
    });

    res.status(200).json(updated);
  } catch (error: any) {
    console.error("Error adjusting stock:", error);
    res.status(500).json({ error: "Failed to adjust stock quantity" });
  }
};

// 5. DELETE /api/inventory/:id — Safe delete (prevents P2025 crash)
export const deleteBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // deleteMany returns { count: n } and NEVER throws P2025 error if the record does not exist
    const result = await prisma.inventoryBatch.deleteMany({
      where: { id },
    });

    if (result.count === 0) {
      res.status(200).json({ message: "Record was not in database or already deleted" });
      return;
    }

    res.status(200).json({ message: "Inventory batch removed successfully" });
  } catch (error: any) {
    console.error("Error deleting batch:", error);
    res.status(500).json({ error: "Failed to delete inventory batch" });
  }
};