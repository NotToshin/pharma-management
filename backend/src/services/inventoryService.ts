import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";
import { ensureMasterProduct, mirrorBatchQuantity } from "./productBatchService";
import {
  CreateInventoryBatchInput,
  UpdateInventoryBatchInput,
} from "../validations/inventoryValidation";

export interface FEFOMetadata {
  daysToExpiry: number;
  fefoStatus: "Expired" | "Near Expiry" | "Priority Out" | "Healthy";
  isQuarantined: boolean;
  isExpired: boolean;
  totalValuation: number;
}

export function calculateFefoMeta(expiryDateStr: string, warehouseBin = ""): FEFOMetadata {
  const parsedTime = Date.parse(expiryDateStr);
  const targetDate = isNaN(parsedTime) ? new Date(2027, 11, 31).getTime() : parsedTime;
  const now = Date.now();
  const diffTime = targetDate - now;
  const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isQuarantined =
    warehouseBin.toLowerCase().includes("quarantine") ||
    warehouseBin.toUpperCase().includes("[QUARANTINE]") ||
    warehouseBin.toUpperCase().startsWith("Q-");

  let fefoStatus: "Expired" | "Near Expiry" | "Priority Out" | "Healthy" = "Healthy";
  if (daysToExpiry <= 0) {
    fefoStatus = "Expired";
  } else if (daysToExpiry <= 60) {
    fefoStatus = "Near Expiry";
  } else if (daysToExpiry <= 180) {
    fefoStatus = "Priority Out";
  }

  return {
    daysToExpiry,
    fefoStatus,
    isQuarantined,
    isExpired: daysToExpiry <= 0,
    totalValuation: 0,
  };
}

const generateBatchNumber = () => {
  const year = new Date().getFullYear();
  return `BX-${year}-${Math.floor(100 + Math.random() * 900)}`;
};

function formatCurrentDate(): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date();
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

const LEGACY_SORT_MAP: Record<string, { field: string; dir: 1 | -1 }> = {
  fefo_asc: { field: "daysToExpiry", dir: 1 },
  fefo_desc: { field: "daysToExpiry", dir: -1 },
  days_asc: { field: "daysToExpiry", dir: 1 },
  days_desc: { field: "daysToExpiry", dir: -1 },
  units_desc: { field: "availableUnits", dir: -1 },
  units_asc: { field: "availableUnits", dir: 1 },
  valuation_desc: { field: "totalValuation", dir: -1 },
  val_desc: { field: "totalValuation", dir: -1 },
  brand_asc: { field: "brandName", dir: 1 },
};

export const inventoryService = {
  async getAllBatches(query?: {
    search?: string;
    searchTerm?: string;
    category?: string;
    fefoStatus?: string;
    storageCondition?: string;
    sort?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number | string;
    limit?: number | string;
  }) {
    const batches = await prisma.inventoryBatch.findMany({
      orderBy: { expiryDate: "asc" },
    });

    const enriched = batches.map((b) => {
      const meta = calculateFefoMeta(b.expiryDate, b.warehouseBin);
      const units = Number(b.availableUnits) || 0;
      const price = Number(b.unitPrice) || 0;
      return {
        ...b,
        availableUnits: units,
        unitPrice: price,
        daysToExpiry: meta.daysToExpiry,
        fefoStatus: meta.fefoStatus,
        isQuarantined: meta.isQuarantined,
        isExpired: meta.isExpired,
        totalValuation: Math.round(units * price * 100) / 100,
      };
    });

    // Apply filtering
    let filtered = enriched;

    const searchValue = (query?.search || query?.searchTerm || "").trim();
    if (searchValue) {
      const q = searchValue.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.brandName.toLowerCase().includes(q) ||
          b.genericName.toLowerCase().includes(q) ||
          b.batchNumber.toLowerCase().includes(q) ||
          b.skuCode.toLowerCase().includes(q) ||
          b.warehouseBin.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      );
    }

    if (query?.category && query.category !== "all") {
      filtered = filtered.filter(
        (b) => b.category.toLowerCase() === query.category!.toLowerCase()
      );
    }

    if (query?.storageCondition && query.storageCondition !== "all") {
      filtered = filtered.filter(
        (b) => b.storageCondition.toLowerCase() === query.storageCondition!.toLowerCase()
      );
    }

    if (query?.fefoStatus && query.fefoStatus !== "all") {
      const fs = query.fefoStatus.toLowerCase();
      if (fs === "quarantined") {
        filtered = filtered.filter((b) => b.isQuarantined);
      } else {
        filtered = filtered.filter((b) => b.fefoStatus.toLowerCase() === fs);
      }
    }

    // Apply sorting. Allowlisted sortBy/sortOrder wins, then the legacy `sort` key,
    // then the default FEFO order (earliest expiry first).
    const allowedSortFields = ["daysToExpiry", "availableUnits", "totalValuation", "brandName"];
    let sortField = "daysToExpiry";
    let sortDir: 1 | -1 = 1;
    if (query?.sortBy && allowedSortFields.includes(query.sortBy)) {
      sortField = query.sortBy;
      sortDir = query.sortOrder === "desc" ? -1 : 1;
    } else if (query?.sort && LEGACY_SORT_MAP[query.sort]) {
      const mapped = LEGACY_SORT_MAP[query.sort];
      sortField = mapped.field;
      sortDir = mapped.dir;
    }
    filtered.sort((a, b) => {
      const av = a[sortField as keyof typeof a];
      const bv = b[sortField as keyof typeof b];
      if (typeof av === "string" || typeof bv === "string") {
        return String(av).localeCompare(String(bv)) * sortDir;
      }
      return (Number(av) - Number(bv)) * sortDir;
    });

    // Apply pagination. Missing limit, "all" or "-1" returns every filtered row.
    const page = Math.max(1, parseInt(String(query?.page || "1"), 10) || 1);
    const rawLimit = query?.limit;
    const limit =
      rawLimit === undefined || rawLimit === "all" || rawLimit === "-1"
        ? 0
        : Math.max(0, parseInt(String(rawLimit), 10) || 0);

    const total = filtered.length;
    const rows =
      limit > 0
        ? filtered.slice((page - 1) * limit, (page - 1) * limit + limit)
        : filtered;

    return {
      rows,
      meta: {
        total,
        page,
        limit: limit > 0 ? limit : total,
        totalPage: limit > 0 ? Math.ceil(total / limit) || 1 : 1,
      },
    };
  },

  async getBatchById(id: string) {
    const batch = await prisma.inventoryBatch.findUnique({
      where: { id },
    });
    if (!batch) {
      throw new AppError("Batch record not found", 404);
    }

    const meta = calculateFefoMeta(batch.expiryDate, batch.warehouseBin);
    const units = Number(batch.availableUnits) || 0;
    const price = Number(batch.unitPrice) || 0;

    return {
      ...batch,
      availableUnits: units,
      unitPrice: price,
      daysToExpiry: meta.daysToExpiry,
      fefoStatus: meta.fefoStatus,
      isQuarantined: meta.isQuarantined,
      isExpired: meta.isExpired,
      totalValuation: Math.round(units * price * 100) / 100,
    };
  },

  async getInventoryStats() {
    const batches = await prisma.inventoryBatch.findMany();

    let grossValuation = 0;
    let totalStockUnits = 0;
    let coldChainBatches = 0;
    let coldChainUnits = 0;
    let ambientUnits = 0;
    let priorityOutCount = 0;
    let nearExpiryCount = 0;
    let expiredCount = 0;
    let quarantinedCount = 0;
    let healthyCount = 0;

    const categoryStats: Record<string, { count: number; units: number; valuation: number }> = {};

    for (const b of batches) {
      const meta = calculateFefoMeta(b.expiryDate, b.warehouseBin);
      const units = Number(b.availableUnits) || 0;
      const price = Number(b.unitPrice) || 0;
      const batchVal = units * price;

      grossValuation += batchVal;
      totalStockUnits += units;

      if (b.storageCondition.includes("Cold")) {
        coldChainBatches++;
        coldChainUnits += units;
      } else {
        ambientUnits += units;
      }

      if (meta.isQuarantined) {
        quarantinedCount++;
      } else if (meta.fefoStatus === "Expired") {
        expiredCount++;
      } else if (meta.fefoStatus === "Near Expiry") {
        nearExpiryCount++;
        priorityOutCount++;
      } else if (meta.fefoStatus === "Priority Out") {
        priorityOutCount++;
      } else {
        healthyCount++;
      }

      const cat = b.category || "General";
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, units: 0, valuation: 0 };
      }
      categoryStats[cat].count++;
      categoryStats[cat].units += units;
      categoryStats[cat].valuation += batchVal;
    }

    return {
      grossValuation: Math.round(grossValuation * 100) / 100,
      totalStockUnits,
      activeBatchCount: batches.length,
      coldChainBatches,
      coldChainUnits,
      ambientUnits,
      priorityOutCount,
      nearExpiryCount,
      expiredCount,
      quarantinedCount,
      healthyCount,
      categoryStats,
    };
  },

  async createBatch(
    data: CreateInventoryBatchInput,
    actorContext?: { name?: string; email?: string; role?: string }
  ) {
    const mfgTime = Date.parse(data.mfgDate);
    const expTime = Date.parse(data.expiryDate);

    if (isNaN(mfgTime)) {
      throw new AppError("Invalid manufacturing date format. Expected YYYY-MM-DD", 400);
    }
    if (isNaN(expTime)) {
      throw new AppError("Invalid expiry date format. Expected YYYY-MM-DD", 400);
    }
    if (expTime <= mfgTime) {
      throw new AppError("Expiry date must be after manufacturing date", 400);
    }

    const batchCode = data.batchNumber.trim();
    const existing = await prisma.inventoryBatch.findFirst({
      where: { batchNumber: batchCode },
    });
    if (existing) {
      throw new AppError(
        `Batch number '${batchCode}' already exists in the ledger. Each production batch code must be unique.`,
        400
      );
    }

    const availableUnits = Math.max(0, parseInt(String(data.availableUnits), 10) || 0);
    const unitPrice = Math.max(0, Number(data.unitPrice) || 0);

    const created = await prisma.$transaction(async (tx) => {
      const product = await ensureMasterProduct(tx, {
        brandName: data.brandName,
        genericName: data.genericName,
        skuCode: data.skuCode,
        category: data.category,
        storageCondition: data.storageCondition,
      });

      const lot = await tx.inventoryBatch.create({
        data: {
          productId: product.id,
          skuCode: product.skuCode,
          brandName: product.brandName,
          genericName: product.genericName,
          category: data.category.trim() || product.category,
          batchNumber: batchCode,
          mfgDate: data.mfgDate.trim(),
          expiryDate: data.expiryDate.trim(),
          availableUnits,
          unitPrice,
          warehouseBin: data.warehouseBin.trim(),
          storageCondition: data.storageCondition || product.storageCondition,
        },
      });

      await tx.productBatch.create({
        data: {
          productId: product.id,
          batchNumber: batchCode,
          purchasePrice: unitPrice,
          mfgDate: data.mfgDate.trim(),
          expiryDate: data.expiryDate.trim(),
          quantity: availableUnits,
          warehouseBin: data.warehouseBin.trim(),
          storageCondition: data.storageCondition || product.storageCondition,
          inventoryBatchId: lot.id,
        },
      });

      return lot;
    });

    // 21 CFR Part 11 Audit Trail
    await auditLogService.recordAuditEvent({
      actorName: actorContext?.name || "Warehouse Lead",
      actorEmail: actorContext?.email || "warehouse@akpharma.com",
      actorRole: actorContext?.role || "Warehouse Officer",
      module: "FEFO Stock Control",
      actionType: "Batch Inward Received",
      severity: "Routine",
      entityTarget: `SKU: ${created.skuCode} | Batch # ${created.batchNumber} (${created.brandName})`,
      entityType: "InventoryBatch",
      entityId: created.id,
      changeSummary: `Received inward consignment of ${created.availableUnits} units at ৳${created.unitPrice}/unit. Stored in ${created.warehouseBin} (${created.storageCondition}).`,
      newPayload: created,
      reasonForChange: "Consignment receipt and initial FEFO ledger registration.",
    });

    const meta = calculateFefoMeta(created.expiryDate, created.warehouseBin);
    return {
      ...created,
      daysToExpiry: meta.daysToExpiry,
      fefoStatus: meta.fefoStatus,
      isQuarantined: meta.isQuarantined,
      isExpired: meta.isExpired,
      totalValuation: Math.round(created.availableUnits * created.unitPrice * 100) / 100,
    };
  },

  async updateBatch(
    id: string,
    data: UpdateInventoryBatchInput,
    actorContext?: { name?: string; email?: string; role?: string }
  ) {
    const existing = await prisma.inventoryBatch.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Inventory batch record not found", 404);
    }

    const effectiveMfg = data.mfgDate?.trim() || existing.mfgDate;
    const effectiveExp = data.expiryDate?.trim() || existing.expiryDate;

    if (data.mfgDate || data.expiryDate) {
      const mfgTime = Date.parse(effectiveMfg);
      const expTime = Date.parse(effectiveExp);
      if (isNaN(mfgTime) || isNaN(expTime) || expTime <= mfgTime) {
        throw new AppError("Expiry date must be strictly after manufacturing date", 400);
      }
    }

    if (data.batchNumber && data.batchNumber.trim() !== existing.batchNumber) {
      const duplicate = await prisma.inventoryBatch.findFirst({
        where: {
          batchNumber: data.batchNumber.trim(),
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new AppError(
          `Batch number '${data.batchNumber.trim()}' is already in use by another batch.`,
          400
        );
      }
    }

    const updatePayload: Record<string, any> = {};
    if (data.brandName !== undefined) updatePayload.brandName = data.brandName.trim();
    if (data.genericName !== undefined) updatePayload.genericName = data.genericName.trim();
    if (data.category !== undefined) updatePayload.category = data.category.trim();
    if (data.batchNumber !== undefined) updatePayload.batchNumber = data.batchNumber.trim();
    if (data.mfgDate !== undefined) updatePayload.mfgDate = data.mfgDate.trim();
    if (data.expiryDate !== undefined) updatePayload.expiryDate = data.expiryDate.trim();
    if (data.warehouseBin !== undefined) updatePayload.warehouseBin = data.warehouseBin.trim();
    if (data.storageCondition !== undefined) updatePayload.storageCondition = data.storageCondition;
    if (data.skuCode !== undefined && data.skuCode.trim()) updatePayload.skuCode = data.skuCode.trim();

    if (data.availableUnits !== undefined) {
      updatePayload.availableUnits = Math.max(0, parseInt(String(data.availableUnits), 10) || 0);
    }
    if (data.unitPrice !== undefined) {
      updatePayload.unitPrice = Math.max(0, Number(data.unitPrice) || 0);
    }

    const updated = await prisma.inventoryBatch.update({
      where: { id },
      data: updatePayload,
    });

    // 21 CFR Part 11 Audit Trail
    await auditLogService.recordAuditEvent({
      actorName: actorContext?.name || "Warehouse Lead",
      actorEmail: actorContext?.email || "warehouse@akpharma.com",
      actorRole: actorContext?.role || "Warehouse Officer",
      module: "FEFO Stock Control",
      actionType: "Batch Record Updated",
      severity: "Routine",
      entityTarget: `SKU: ${updated.skuCode} | Batch # ${updated.batchNumber}`,
      entityType: "InventoryBatch",
      entityId: updated.id,
      changeSummary: `Batch details modified for ${updated.brandName}. Stock: ${updated.availableUnits} units, Bin: ${updated.warehouseBin}.`,
      priorPayload: existing,
      newPayload: updated,
      reasonForChange: "Warehouse ledger maintenance and metadata rectification.",
    });

    const meta = calculateFefoMeta(updated.expiryDate, updated.warehouseBin);
    return {
      ...updated,
      daysToExpiry: meta.daysToExpiry,
      fefoStatus: meta.fefoStatus,
      isQuarantined: meta.isQuarantined,
      isExpired: meta.isExpired,
      totalValuation: Math.round(updated.availableUnits * updated.unitPrice * 100) / 100,
    };
  },

  async adjustStock(
    id: string,
    type: "IN" | "OUT" | "DAMAGE",
    quantity: number,
    reason?: string,
    authorizedBy?: string,
    actorContext?: { name?: string; email?: string; role?: string }
  ) {
    const batch = await prisma.inventoryBatch.findUnique({ where: { id } });
    if (!batch) {
      throw new AppError("Inventory batch record not found", 404);
    }

    const priorStock = batch.availableUnits;
    let newStock = priorStock;
    let adjustmentImpact = 0;
    let adjustmentTypeLabel = "Audit Count Discrepancy";

    if (type === "IN") {
      newStock = priorStock + quantity;
      adjustmentImpact = quantity * batch.unitPrice;
      adjustmentTypeLabel = "Restock Inward Correction";
    } else if (type === "OUT") {
      if (quantity > priorStock) {
        throw new AppError(
          `Cannot deduct ${quantity} units. Only ${priorStock} units are available in this batch.`,
          400
        );
      }
      newStock = priorStock - quantity;
      adjustmentImpact = -(quantity * batch.unitPrice);
      adjustmentTypeLabel = "Audit Count Discrepancy";
    } else if (type === "DAMAGE") {
      if (quantity > priorStock) {
        throw new AppError(
          `Cannot write off ${quantity} units. Only ${priorStock} units are available in this batch.`,
          400
        );
      }
      newStock = priorStock - quantity;
      adjustmentImpact = -(quantity * batch.unitPrice);
      adjustmentTypeLabel = "Write-off (Damaged/Broken)";
    }

    const updated = await prisma.inventoryBatch.update({
      where: { id },
      data: { availableUnits: newStock },
    });
    await mirrorBatchQuantity(prisma, updated.id, updated.availableUnits);

    // Create a synchronized StockAdjustment log in database
    const year = new Date().getFullYear();
    const allRefs = await prisma.stockAdjustment.findMany({ select: { adjustmentRef: true } });
    let maxNum = 80;
    for (const r of allRefs) {
      const match = r.adjustmentRef?.match(/ADJ-\d+-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const adjustmentRef = `ADJ-${year}-${String(maxNum + 1).padStart(3, "0")}`;

    await prisma.stockAdjustment.create({
      data: {
        adjustmentRef,
        date: formatCurrentDate(),
        skuCode: batch.skuCode,
        formulationName: batch.brandName,
        batchNumber: batch.batchNumber,
        warehouseLocation: batch.warehouseBin,
        type: adjustmentTypeLabel,
        quantity: type === "IN" ? quantity : -quantity,
        unitCostBDT: batch.unitPrice,
        totalImpactBDT: adjustmentImpact,
        reasonCode: reason || `Manual stock adjustment (${type}) applied from Active Inventory Ledger.`,
        authorizedBy: authorizedBy || actorContext?.name || "Warehouse Lead",
        approvalStatus: "Approved & Adjusted",
      },
    }).catch((err) => {
      console.warn("Could not write stock adjustment entry:", err);
    });

    // 21 CFR Part 11 Audit Trail
    await auditLogService.recordAuditEvent({
      actorName: actorContext?.name || authorizedBy || "Warehouse Lead",
      actorEmail: actorContext?.email || "warehouse@akpharma.com",
      actorRole: actorContext?.role || "Inventory Control Specialist",
      module: "FEFO Stock Control",
      actionType: type === "DAMAGE" ? "Stock Write-off" : "Stock Quantity Adjusted",
      severity: type === "DAMAGE" ? "Critical" : "Routine",
      entityTarget: `SKU: ${batch.skuCode} | Batch # ${batch.batchNumber} (${batch.brandName})`,
      entityType: "InventoryBatch",
      entityId: batch.id,
      changeSummary: `Stock quantity adjusted from ${priorStock} to ${newStock} units (${type}: ${quantity} units). Ref: ${adjustmentRef}.`,
      priorPayload: { availableUnits: priorStock },
      newPayload: { availableUnits: newStock, type, quantity, reason },
      reasonForChange: reason || "Physical count reconciliation and ledger synchronization.",
    });

    const meta = calculateFefoMeta(updated.expiryDate, updated.warehouseBin);
    return {
      ...updated,
      daysToExpiry: meta.daysToExpiry,
      fefoStatus: meta.fefoStatus,
      isQuarantined: meta.isQuarantined,
      isExpired: meta.isExpired,
      totalValuation: Math.round(updated.availableUnits * updated.unitPrice * 100) / 100,
    };
  },

  async quarantineBatch(
    id: string,
    action: "QUARANTINE" | "RELEASE",
    reason: string,
    targetBin?: string,
    authorizedBy?: string,
    actorContext?: { name?: string; email?: string; role?: string }
  ) {
    const batch = await prisma.inventoryBatch.findUnique({ where: { id } });
    if (!batch) {
      throw new AppError("Inventory batch record not found", 404);
    }

    const priorBin = batch.warehouseBin;
    const isCurrentlyQuarantined =
      priorBin.toLowerCase().includes("quarantine") ||
      priorBin.toUpperCase().includes("[QUARANTINE]");

    let newBin = targetBin?.trim() || "";

    if (action === "QUARANTINE") {
      if (isCurrentlyQuarantined) {
        throw new AppError("This batch is already flagged in quarantine status.", 400);
      }
      newBin = newBin || "Quarantine Bay Q-01";

      const updated = await prisma.inventoryBatch.update({
        where: { id },
        data: { warehouseBin: newBin },
      });

      // Record a StockAdjustment for Quarantine Transfer
      const year = new Date().getFullYear();
      const allRefs = await prisma.stockAdjustment.findMany({ select: { adjustmentRef: true } });
      let maxNum = 80;
      for (const r of allRefs) {
        const match = r.adjustmentRef?.match(/ADJ-\d+-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      const adjustmentRef = `ADJ-${year}-${String(maxNum + 1).padStart(3, "0")}`;

      await prisma.stockAdjustment.create({
        data: {
          adjustmentRef,
          date: formatCurrentDate(),
          skuCode: batch.skuCode,
          formulationName: batch.brandName,
          batchNumber: batch.batchNumber,
          warehouseLocation: newBin,
          type: "Quarantine Transfer",
          quantity: -batch.availableUnits,
          unitCostBDT: batch.unitPrice,
          totalImpactBDT: -(batch.availableUnits * batch.unitPrice),
          reasonCode: `Quarantine Hold: ${reason}`,
          authorizedBy: authorizedBy || actorContext?.name || "Quality Assurance Lead",
          approvalStatus: "Approved & Adjusted",
        },
      }).catch((err) => {
        console.warn("Could not write quarantine stock adjustment entry:", err);
      });

      // 21 CFR Part 11 Audit Trail
      await auditLogService.recordAuditEvent({
        actorName: actorContext?.name || authorizedBy || "QA Compliance Lead",
        actorEmail: actorContext?.email || "qa@akpharma.com",
        actorRole: actorContext?.role || "Quality Assurance Lead",
        module: "FEFO Stock Control",
        actionType: "Batch Quarantined",
        severity: "Critical",
        entityTarget: `SKU: ${batch.skuCode} | Batch # ${batch.batchNumber} (${batch.brandName})`,
        entityType: "InventoryBatch",
        entityId: batch.id,
        changeSummary: `Batch transferred to ${newBin}. Immediate dispatch hold applied for ${batch.availableUnits} units.`,
        priorPayload: { warehouseBin: priorBin },
        newPayload: { warehouseBin: newBin, reason },
        reasonForChange: `Quarantine Hold Initiated: ${reason}`,
      });

      const meta = calculateFefoMeta(updated.expiryDate, updated.warehouseBin);
      return {
        ...updated,
        daysToExpiry: meta.daysToExpiry,
        fefoStatus: meta.fefoStatus,
        isQuarantined: true,
        isExpired: meta.isExpired,
        totalValuation: Math.round(updated.availableUnits * updated.unitPrice * 100) / 100,
      };
    } else {
      // RELEASE
      if (!isCurrentlyQuarantined) {
        throw new AppError("This batch is not currently in quarantine status.", 400);
      }
      newBin = newBin || "Bay 01 - Shelf A";

      const updated = await prisma.inventoryBatch.update({
        where: { id },
        data: { warehouseBin: newBin },
      });

      // 21 CFR Part 11 Audit Trail
      await auditLogService.recordAuditEvent({
        actorName: actorContext?.name || authorizedBy || "QA Compliance Lead",
        actorEmail: actorContext?.email || "qa@akpharma.com",
        actorRole: actorContext?.role || "Quality Assurance Lead",
        module: "FEFO Stock Control",
        actionType: "Batch Released from Quarantine",
        severity: "Routine",
        entityTarget: `SKU: ${batch.skuCode} | Batch # ${batch.batchNumber} (${batch.brandName})`,
        entityType: "InventoryBatch",
        entityId: batch.id,
        changeSummary: `Batch released from quarantine and restored to pick bay: ${newBin}.`,
        priorPayload: { warehouseBin: priorBin },
        newPayload: { warehouseBin: newBin, reason },
        reasonForChange: `Quarantine Release Authorization: ${reason}`,
      });

      const meta = calculateFefoMeta(updated.expiryDate, updated.warehouseBin);
      return {
        ...updated,
        daysToExpiry: meta.daysToExpiry,
        fefoStatus: meta.fefoStatus,
        isQuarantined: false,
        isExpired: meta.isExpired,
        totalValuation: Math.round(updated.availableUnits * updated.unitPrice * 100) / 100,
      };
    }
  },

  async deleteBatch(
    id: string,
    actorContext?: { name?: string; email?: string; role?: string }
  ) {
    const existing = await prisma.inventoryBatch.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Inventory batch record not found", 404);
    }

    await prisma.productBatch.deleteMany({ where: { inventoryBatchId: existing.id } });
    const deleted = await prisma.inventoryBatch.delete({
      where: { id },
    });

    // 21 CFR Part 11 Audit Trail
    await auditLogService.recordAuditEvent({
      actorName: actorContext?.name || "Warehouse Lead",
      actorEmail: actorContext?.email || "warehouse@akpharma.com",
      actorRole: actorContext?.role || "Warehouse Director",
      module: "FEFO Stock Control",
      actionType: "Batch Record Deleted",
      severity: "Critical",
      entityTarget: `SKU: ${existing.skuCode} | Batch # ${existing.batchNumber} (${existing.brandName})`,
      entityType: "InventoryBatch",
      entityId: existing.id,
      changeSummary: `Permanent deletion of batch record ${existing.batchNumber} with ${existing.availableUnits} units valuation ৳${(existing.availableUnits * existing.unitPrice).toFixed(2)}.`,
      priorPayload: existing,
      reasonForChange: "Administrative batch purge / statutory ledger decommission.",
    });

    return deleted;
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
    if (remainingUnits < 0) throw new AppError("Insufficient stock in batch", 400);

    const updated = await prisma.inventoryBatch.update({
      where: { id: batchId },
      data: { availableUnits: remainingUnits },
    });
    await mirrorBatchQuantity(prisma, updated.id, updated.availableUnits);
    return updated;
  },
};