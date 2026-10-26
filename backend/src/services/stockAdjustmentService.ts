import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { mirrorBatchQuantity } from "./productBatchService";
import { CreateStockAdjustmentInput, UpdateStockAdjustmentInput } from "../validations/stockAdjustmentValidation";
import { auditLogService } from "./auditLogService";

function formatCurrentDate(): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date();
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export const stockAdjustmentService = {
  async getAllAdjustments(filters?: { search?: string; type?: string; status?: string }) {
    const where: any = {};

    if (filters?.search && filters.search.trim()) {
      const s = filters.search.trim();
      where.OR = [
        { adjustmentRef: { contains: s, mode: "insensitive" } },
        { skuCode: { contains: s, mode: "insensitive" } },
        { formulationName: { contains: s, mode: "insensitive" } },
        { batchNumber: { contains: s, mode: "insensitive" } },
        { reasonCode: { contains: s, mode: "insensitive" } },
        { authorizedBy: { contains: s, mode: "insensitive" } },
      ];
    }

    if (filters?.type && filters.type !== "all") {
      where.type = { equals: filters.type, mode: "insensitive" };
    }

    if (filters?.status && filters.status !== "all") {
      where.approvalStatus = { equals: filters.status, mode: "insensitive" };
    }

    const adjustments = await prisma.stockAdjustment.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return adjustments;
  },

  async getSummaryMetrics() {
    const adjustments = await prisma.stockAdjustment.findMany();

    const totalRecords = adjustments.length;
    let netImpactBDT = 0;
    let writeOffCount = 0;
    let writeOffValue = 0;
    let quarantineCount = 0;
    let quarantineValue = 0;
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;

    for (const adj of adjustments) {
      netImpactBDT += adj.totalImpactBDT;

      const typeLower = adj.type.toLowerCase();
      const locLower = adj.warehouseLocation.toLowerCase();

      if (typeLower.includes("write-off") || typeLower.includes("write off")) {
        writeOffCount += 1;
        writeOffValue += Math.abs(adj.totalImpactBDT);
      }

      if (typeLower.includes("quarantine") || locLower.includes("quarantine") || locLower.includes("q-01")) {
        quarantineCount += 1;
        quarantineValue += Math.abs(adj.totalImpactBDT);
      }

      if (adj.approvalStatus === "Approved & Adjusted") {
        approvedCount += 1;
      } else if (adj.approvalStatus === "Pending Review") {
        pendingCount += 1;
      } else if (adj.approvalStatus === "Rejected") {
        rejectedCount += 1;
      }
    }

    const auditComplianceRate = totalRecords > 0 ? Math.round((approvedCount / totalRecords) * 100) : 100;

    return {
      totalRecords,
      netImpactBDT,
      writeOffCount,
      writeOffValue,
      quarantineCount,
      quarantineValue,
      approvedCount,
      pendingCount,
      rejectedCount,
      auditComplianceRate,
    };
  },

  async getAdjustmentById(id: string) {
    const adj = await prisma.stockAdjustment.findUnique({
      where: { id },
    });

    if (!adj) {
      throw new AppError(`Stock adjustment with ID '${id}' not found`, 404);
    }

    return adj;
  },

  async createAdjustment(data: CreateStockAdjustmentInput) {
    let adjustmentRef = data.adjustmentRef?.trim();
    if (!adjustmentRef) {
      const allAdjs = await prisma.stockAdjustment.findMany({ select: { adjustmentRef: true } });
      let maxNum = 85;
      for (const a of allAdjs) {
        const match = a.adjustmentRef?.match(/ADJ-\d+-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      adjustmentRef = `ADJ-${new Date().getFullYear()}-${String(maxNum + 1).padStart(3, "0")}`;
    }
    const date = data.date?.trim() || formatCurrentDate();
    const quantity = Number(data.quantity);
    const unitCostBDT = Number(data.unitCostBDT);
    const totalImpactBDT = data.totalImpactBDT !== undefined ? Number(data.totalImpactBDT) : quantity * unitCostBDT;
    const authorizedBy = data.authorizedBy?.trim() || "Toshin Bin Azad (Super Admin)";
    const approvalStatus = data.approvalStatus || "Approved & Adjusted";

    const adjustment = await prisma.stockAdjustment.create({
      data: {
        adjustmentRef,
        date,
        skuCode: data.skuCode.trim(),
        formulationName: data.formulationName.trim(),
        batchNumber: data.batchNumber.trim(),
        warehouseLocation: data.warehouseLocation.trim(),
        type: data.type.trim(),
        quantity,
        unitCostBDT,
        totalImpactBDT,
        reasonCode: data.reasonCode.trim(),
        authorizedBy,
        approvalStatus,
      },
    });

    // Sync inventory batch stock if adjustment is immediately approved
    if (approvalStatus === "Approved & Adjusted") {
      await this.applyBatchStockSync(data.batchNumber.trim(), data.skuCode.trim(), quantity);
    }

    await auditLogService.recordAuditEvent({
      module: "FEFO Warehouse",
      actionType: adjustment.type.includes("Quarantine")
        ? "Batch Quarantined"
        : adjustment.type.includes("Write-off")
        ? "Stock Write-off"
        : "Stock Adjusted",
      severity:
        adjustment.type.includes("Quarantine") || adjustment.type.includes("Write-off")
          ? "Critical"
          : "Routine",
      entityTarget: `SKU: ${adjustment.skuCode} | Batch # ${adjustment.batchNumber}`,
      entityType: "StockAdjustment",
      entityId: adjustment.id,
      changeSummary: `Stock adjustment ${adjustment.adjustmentRef} (${adjustment.type}) recorded for ${adjustment.quantity} units (${adjustment.formulationName}). Total financial impact: BDT ${adjustment.totalImpactBDT}.`,
      newPayload: adjustment,
      reasonForChange: adjustment.reasonCode,
      actorName: adjustment.authorizedBy,
    });

    return adjustment;
  },

  async updateAdjustment(id: string, data: UpdateStockAdjustmentInput) {
    const existing = await this.getAdjustmentById(id);

    const updateData: any = {};
    if (data.adjustmentRef !== undefined) updateData.adjustmentRef = data.adjustmentRef.trim();
    if (data.date !== undefined) updateData.date = data.date.trim();
    if (data.skuCode !== undefined) updateData.skuCode = data.skuCode.trim();
    if (data.formulationName !== undefined) updateData.formulationName = data.formulationName.trim();
    if (data.batchNumber !== undefined) updateData.batchNumber = data.batchNumber.trim();
    if (data.warehouseLocation !== undefined) updateData.warehouseLocation = data.warehouseLocation.trim();
    if (data.type !== undefined) updateData.type = data.type.trim();
    if (data.reasonCode !== undefined) updateData.reasonCode = data.reasonCode.trim();
    if (data.authorizedBy !== undefined) updateData.authorizedBy = data.authorizedBy.trim();

    const quantity = data.quantity !== undefined ? Number(data.quantity) : existing.quantity;
    const unitCostBDT = data.unitCostBDT !== undefined ? Number(data.unitCostBDT) : existing.unitCostBDT;
    if (data.quantity !== undefined) updateData.quantity = quantity;
    if (data.unitCostBDT !== undefined) updateData.unitCostBDT = unitCostBDT;
    updateData.totalImpactBDT = data.totalImpactBDT !== undefined ? Number(data.totalImpactBDT) : quantity * unitCostBDT;

    if (data.approvalStatus !== undefined) {
      updateData.approvalStatus = data.approvalStatus;
      // If transitioned from pending/rejected to Approved & Adjusted
      if (existing.approvalStatus !== "Approved & Adjusted" && data.approvalStatus === "Approved & Adjusted") {
        await this.applyBatchStockSync(
          updateData.batchNumber || existing.batchNumber,
          updateData.skuCode || existing.skuCode,
          quantity
        );
      }
    }

    const updated = await prisma.stockAdjustment.update({
      where: { id },
      data: updateData,
    });

    await auditLogService.recordAuditEvent({
      module: "FEFO Warehouse",
      actionType: "Stock Adjustment Modified",
      severity: "Security Warning",
      entityTarget: `Adjustment # ${updated.adjustmentRef} (${updated.formulationName})`,
      entityType: "StockAdjustment",
      entityId: id,
      changeSummary: `Stock adjustment ${updated.adjustmentRef} was updated in warehouse registry.`,
      priorPayload: existing,
      newPayload: updated,
      reasonForChange: data.reasonCode || existing.reasonCode,
      actorName: updated.authorizedBy,
    });

    return updated;
  },

  async updateStatus(id: string, approvalStatus: "Approved & Adjusted" | "Pending Review" | "Rejected") {
    const existing = await this.getAdjustmentById(id);

    if (existing.approvalStatus !== "Approved & Adjusted" && approvalStatus === "Approved & Adjusted") {
      await this.applyBatchStockSync(existing.batchNumber, existing.skuCode, existing.quantity);
    }

    const updated = await prisma.stockAdjustment.update({
      where: { id },
      data: { approvalStatus },
    });

    await auditLogService.recordAuditEvent({
      module: "FEFO Warehouse",
      actionType: "Stock Adjustment Signoff",
      severity: approvalStatus === "Approved & Adjusted" ? "Statutory Notice" : "Security Warning",
      entityTarget: `Adjustment # ${existing.adjustmentRef} (${existing.formulationName})`,
      entityType: "StockAdjustment",
      entityId: id,
      changeSummary: `Stock adjustment ${existing.adjustmentRef} status modified from '${existing.approvalStatus}' to '${approvalStatus}'.`,
      priorPayload: { approvalStatus: existing.approvalStatus },
      newPayload: { approvalStatus },
      reasonForChange: "GMP warehouse regulatory authorization workflow.",
    });

    return updated;
  },

  async deleteAdjustment(id: string) {
    const existing = await this.getAdjustmentById(id);
    if (existing.approvalStatus === "Approved & Adjusted") {
      await this.applyBatchStockSync(existing.batchNumber, existing.skuCode, -existing.quantity);
    }
    const deleted = await prisma.stockAdjustment.delete({
      where: { id },
    });

    await auditLogService.recordAuditEvent({
      module: "FEFO Warehouse",
      actionType: "Stock Adjustment Revoked",
      severity: "Critical",
      entityTarget: `Adjustment # ${existing.adjustmentRef} (${existing.formulationName})`,
      entityType: "StockAdjustment",
      entityId: id,
      changeSummary: `Stock adjustment ${existing.adjustmentRef} was deleted from ledger.`,
      priorPayload: existing,
      reasonForChange: "Administrative statutory rollback.",
    });

    return deleted;
  },

  async applyBatchStockSync(batchNumber: string, skuCode: string, quantity: number): Promise<void> {
    try {
      let batch = await prisma.inventoryBatch.findFirst({
        where: { batchNumber: { equals: batchNumber, mode: "insensitive" } },
      });

      if (!batch && skuCode) {
        batch = await prisma.inventoryBatch.findFirst({
          where: { skuCode: { equals: skuCode, mode: "insensitive" } },
        });
      }

      if (batch) {
        const newAvailable = Math.max(0, batch.availableUnits + Math.round(quantity));
        await prisma.inventoryBatch.update({
          where: { id: batch.id },
          data: { availableUnits: newAvailable },
        });
        await mirrorBatchQuantity(prisma, batch.id, newAvailable);
      }
    } catch (err) {
      console.warn("Could not sync stock with inventory batch:", err);
    }
  },
};
