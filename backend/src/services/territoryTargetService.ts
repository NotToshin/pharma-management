import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";

const DEFAULT_TERRITORIES_SEED = [
  {
    territory: "Dhaka North",
    mioName: "Rafiqul Islam",
    targetAmount: 1500000,
    achievedAmount: 1590000,
    fiscalYear: "Fiscal Year 2026",
  },
  {
    territory: "Dhaka South",
    mioName: "Tanvir Ahmed",
    targetAmount: 1800000,
    achievedAmount: 1710000,
    fiscalYear: "Fiscal Year 2026",
  },
  {
    territory: "Chittagong Central",
    mioName: "Kamrul Hasan",
    targetAmount: 1200000,
    achievedAmount: 1260000,
    fiscalYear: "Fiscal Year 2026",
  },
  {
    territory: "Sylhet Sadar",
    mioName: "Enamul Haque",
    targetAmount: 950000,
    achievedAmount: 760000,
    fiscalYear: "Fiscal Year 2026",
  },
  {
    territory: "Rajshahi Metro",
    mioName: "Sabbir Hossain",
    targetAmount: 1100000,
    achievedAmount: 1045000,
    fiscalYear: "Fiscal Year 2026",
  },
  {
    territory: "Khulna Zone",
    mioName: "Mahmudul Hasan",
    targetAmount: 850000,
    achievedAmount: 892500,
    fiscalYear: "Fiscal Year 2026",
  },
  {
    territory: "Bogura Hub",
    mioName: "Farhan Kabir",
    targetAmount: 700000,
    achievedAmount: 525000,
    fiscalYear: "Fiscal Year 2026",
  },
];

const STANDARD_TERRITORIES = [
  "Dhaka North",
  "Dhaka South",
  "Mirpur",
  "Uttara",
  "Dhanmondi",
  "Gulshan",
  "Mohakhali",
  "Motijheel",
  "Savar",
  "Gazipur",
  "Narayanganj",
  "Chittagong Central",
  "Chittagong North",
  "Agrabad C/A",
  "GEC Circle",
  "Cox's Bazar",
  "Comilla",
  "Feni",
  "Noakhali",
  "Sylhet Sadar",
  "Zindabazar",
  "Amberkhana",
  "Moulvibazar",
  "Habiganj",
  "Rajshahi Metro",
  "Shaheb Bazar",
  "Bogura Hub",
  "Bogura Central",
  "Pabna",
  "Khulna Zone",
  "Shibbari More",
  "Jessore",
  "Kushtia",
  "Barisal Sadar",
  "Patuakhali",
  "Rangpur Cantt",
  "Dinajpur",
  "Mymensingh Town",
  "Jamalpur",
];

export const territoryTargetService = {
  async seedDefaultTargetsIfEmpty() {
    const count = await prisma.territoryTarget.count();
    if (count > 0) return;

    for (const item of DEFAULT_TERRITORIES_SEED) {
      await prisma.territoryTarget.create({
        data: item,
      });
    }
  },

  async getAllTargets(filters?: { fiscalYear?: string; territory?: string }) {
    await this.seedDefaultTargetsIfEmpty();

    const where: any = {};
    if (filters?.fiscalYear && filters.fiscalYear !== "all") {
      where.fiscalYear = { equals: filters.fiscalYear, mode: "insensitive" };
    }
    if (filters?.territory && filters.territory !== "all") {
      where.territory = { equals: filters.territory, mode: "insensitive" };
    }

    const [targets, orders] = await Promise.all([
      prisma.territoryTarget.findMany({
        where,
        orderBy: { createdAt: "asc" },
      }),
      prisma.order.findMany({
        select: {
          territory: true,
          assignedMio: true,
          orderValue: true,
        },
      }),
    ]);

    const formattedTargets = targets.map((target) => {
      const targetTerritoryLower = (target.territory || "").trim().toLowerCase();
      const targetMioLower = (target.mioName || "").trim().toLowerCase();

      // Aggregate matching orders for real delivered sales
      const matchingOrders = orders.filter((o) => {
        const orderTerritoryLower = (o.territory || "").trim().toLowerCase();
        const orderMioLower = (o.assignedMio || "").trim().toLowerCase();
        return (
          (orderTerritoryLower && orderTerritoryLower === targetTerritoryLower) ||
          (orderMioLower && targetMioLower && orderMioLower.includes(targetMioLower))
        );
      });

      const ordersRealized = matchingOrders.reduce(
        (sum, o) => sum + (Number(o.orderValue) || 0),
        0
      );

      // Achieved amount blends recorded target baseline + real orders delivered
      const achievedRaw =
        ordersRealized > 0
          ? Math.max(target.achievedAmount, ordersRealized)
          : target.achievedAmount;

      const targetRaw = target.targetAmount;
      const rate =
        targetRaw > 0 ? Math.round((achievedRaw / targetRaw) * 100) : 0;

      let status: "Surpassed" | "On Track" | "Behind" = "Behind";
      if (rate >= 100) status = "Surpassed";
      else if (rate >= 90) status = "On Track";

      return {
        id: target.id,
        territory: target.territory,
        mio: target.mioName,
        targetRaw,
        achievedRaw,
        target: `৳${targetRaw.toLocaleString("en-IN")}`,
        achieved: `৳${achievedRaw.toLocaleString("en-IN")}`,
        rate,
        status,
        fiscalYear: target.fiscalYear,
        notes: target.notes || null,
        matchingOrdersCount: matchingOrders.length,
        createdAt: target.createdAt,
        updatedAt: target.updatedAt,
      };
    });

    const totalTarget = formattedTargets.reduce((sum, t) => sum + t.targetRaw, 0);
    const totalAchieved = formattedTargets.reduce((sum, t) => sum + t.achievedRaw, 0);
    const overallRate = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
    const topPerforming = formattedTargets.length > 0
      ? formattedTargets.reduce((max, t) => (t.rate > max.rate ? t : max), formattedTargets[0])
      : null;
    const underperformingCount = formattedTargets.filter((t) => t.status === "Behind").length;

    return {
      targets: formattedTargets,
      summary: {
        totalTarget,
        totalAchieved,
        overallRate,
        topPerformingHub: topPerforming ? topPerforming.territory : "N/A",
        underperformingCount,
        activeZonesCount: formattedTargets.length,
      },
    };
  },

  async getTargetOptions() {
    const [allocations, staffList, clients, orders] = await Promise.all([
      prisma.mioZoneAllocation.findMany({
        orderBy: { territory: "asc" },
      }),
      prisma.staff.findMany({
        where: {
          OR: [
            { department: { equals: "Field Force", mode: "insensitive" } },
            { territory: { not: null } },
          ],
        },
        orderBy: { fullName: "asc" },
      }),
      prisma.client.findMany({
        select: { territory: true, assignedMio: true },
      }),
      prisma.order.findMany({
        select: { territory: true, assignedMio: true },
      }),
    ]);

    // Build unique territories set
    const territorySet = new Set<string>(STANDARD_TERRITORIES);

    allocations.forEach((a) => {
      if (a.territory?.trim()) territorySet.add(a.territory.trim());
    });
    staffList.forEach((s) => {
      if (s.territory?.trim()) territorySet.add(s.territory.trim());
    });
    clients.forEach((c) => {
      if (c.territory?.trim()) territorySet.add(c.territory.trim());
    });
    orders.forEach((o) => {
      if (o.territory?.trim()) territorySet.add(o.territory.trim());
    });

    const territories = Array.from(territorySet).sort((a, b) => a.localeCompare(b));

    // Build unique MIOs list
    const miosMap = new Map<string, { id?: string; name: string; empId?: string; territory?: string }>();

    allocations.forEach((a) => {
      if (a.mioName?.trim()) {
        const name = a.mioName.trim();
        miosMap.set(name, {
          id: a.id,
          name,
          empId: a.employeeId,
          territory: a.territory,
        });
      }
    });

    staffList.forEach((s) => {
      if (s.fullName?.trim() && !miosMap.has(s.fullName.trim())) {
        const name = s.fullName.trim();
        miosMap.set(name, {
          id: s.id,
          name,
          empId: s.empId,
          territory: s.territory || undefined,
        });
      }
    });

    // Territory to MIO suggestion map
    const territoryMioMap: Record<string, string> = {};
    allocations.forEach((a) => {
      if (a.territory && a.mioName) {
        territoryMioMap[a.territory.trim()] = a.mioName.trim();
      }
    });
    staffList.forEach((s) => {
      if (s.territory && s.fullName && !territoryMioMap[s.territory.trim()]) {
        territoryMioMap[s.territory.trim()] = s.fullName.trim();
      }
    });

    return {
      territories,
      mios: Array.from(miosMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      territoryMioMap,
    };
  },

  async createTarget(data: {
    territory: string;
    mioName: string;
    targetAmount: number;
    achievedAmount?: number;
    fiscalYear?: string;
    notes?: string | null;
  }) {
    const territory = data.territory.trim();
    const mioName = data.mioName.trim();
    const fiscalYear = data.fiscalYear?.trim() || "Fiscal Year 2026";
    const targetAmount = Number(data.targetAmount);
    const achievedAmount = Number(data.achievedAmount) || 0;

    // Check if target for same territory and fiscal year already exists
    const existing = await prisma.territoryTarget.findFirst({
      where: {
        territory: { equals: territory, mode: "insensitive" },
        fiscalYear: { equals: fiscalYear, mode: "insensitive" },
      },
    });

    let result;
    if (existing) {
      result = await prisma.territoryTarget.update({
        where: { id: existing.id },
        data: {
          mioName,
          targetAmount,
          achievedAmount,
          notes: data.notes?.trim() || existing.notes,
        },
      });

      await auditLogService
        .createLogEntry({
          module: "Target vs. Achievement",
          actionType: "Quota Re-allocated",
          severity: "Routine",
          entityTarget: `${territory} (${mioName})`,
          entityType: "TerritoryTarget",
          entityId: result.id,
          changeSummary: `Re-allocated quota target to ৳${targetAmount.toLocaleString()} (Achieved: ৳${achievedAmount.toLocaleString()}) for ${territory}`,
          priorPayload: existing,
          newPayload: result,
        })
        .catch(() => null);
    } else {
      result = await prisma.territoryTarget.create({
        data: {
          territory,
          mioName,
          targetAmount,
          achievedAmount,
          fiscalYear,
          notes: data.notes?.trim() || null,
        },
      });

      await auditLogService
        .createLogEntry({
          module: "Target vs. Achievement",
          actionType: "Quota Allocated",
          severity: "Routine",
          entityTarget: `${territory} (${mioName})`,
          entityType: "TerritoryTarget",
          entityId: result.id,
          changeSummary: `Created new territory target of ৳${targetAmount.toLocaleString()} for ${territory} assigned to ${mioName}`,
          newPayload: result,
        })
        .catch(() => null);
    }

    return result;
  },

  async updateTarget(
    id: string,
    data: {
      territory?: string;
      mioName?: string;
      targetAmount?: number;
      achievedAmount?: number;
      fiscalYear?: string;
      notes?: string | null;
    }
  ) {
    const existing = await prisma.territoryTarget.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Territory target not found", 404);
    }

    const updated = await prisma.territoryTarget.update({
      where: { id },
      data: {
        ...(data.territory ? { territory: data.territory.trim() } : {}),
        ...(data.mioName ? { mioName: data.mioName.trim() } : {}),
        ...(data.targetAmount !== undefined ? { targetAmount: Number(data.targetAmount) } : {}),
        ...(data.achievedAmount !== undefined ? { achievedAmount: Number(data.achievedAmount) } : {}),
        ...(data.fiscalYear ? { fiscalYear: data.fiscalYear.trim() } : {}),
        ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
      },
    });

    await auditLogService
      .createLogEntry({
        module: "Target vs. Achievement",
        actionType: "Quota Modified",
        severity: "Routine",
        entityTarget: `${updated.territory} (${updated.mioName})`,
        entityType: "TerritoryTarget",
        entityId: updated.id,
        changeSummary: `Modified territory target for ${updated.territory} (Target: ৳${updated.targetAmount.toLocaleString()})`,
        priorPayload: existing,
        newPayload: updated,
      })
      .catch(() => null);

    return updated;
  },

  async deleteTarget(id: string) {
    const existing = await prisma.territoryTarget.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Territory target not found", 404);
    }

    await prisma.territoryTarget.delete({
      where: { id },
    });

    await auditLogService
      .createLogEntry({
        module: "Target vs. Achievement",
        actionType: "Quota Removed",
        severity: "Routine",
        entityTarget: `${existing.territory} (${existing.mioName})`,
        entityType: "TerritoryTarget",
        entityId: id,
        changeSummary: `Removed territory quota of ৳${existing.targetAmount.toLocaleString()} for ${existing.territory}`,
        priorPayload: existing,
      })
      .catch(() => null);

    return { id, territory: existing.territory, message: "Target removed successfully" };
  },
};
