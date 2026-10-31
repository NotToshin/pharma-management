import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";
import type { Prisma } from "@prisma/client";
import { loadOrderAttributionSources, normalizeAssignment, resolveOrderMio } from "./orderAttributionService";
import { territoryService } from "./territoryService";
import { STANDARD_TERRITORY_DIVISION_MAP } from "./territoryAnalyticsService";

export const territoryTargetService = {
  /**
   * Retrieves all sales quota targets for MIOs with real-time database orders sync
   */
  async getAllTargets(filters?: { fiscalYear?: string; territory?: string }) {
    const where: Prisma.TerritoryTargetWhereInput = {};
    if (filters?.fiscalYear && filters.fiscalYear !== "all") {
      where.fiscalYear = { equals: filters.fiscalYear, mode: "insensitive" };
    }
    if (filters?.territory && filters.territory !== "all") {
      where.territory = { equals: filters.territory, mode: "insensitive" };
    }

    const [targets, orders, staffList, attributionSources] = await Promise.all([
      prisma.territoryTarget.findMany({
        where,
        include: { territoryRef: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          territory: true,
          assignedMio: true,
          pharmacyName: true,
          orderValue: true,
          status: true,
        },
      }),
      prisma.staff.findMany({
        select: {
          id: true,
          fullName: true,
          empId: true,
          department: true,
          role: { select: { name: true } },
          territory: true,
          phone: true,
          email: true,
        },
      }),
      loadOrderAttributionSources(),
    ]);

    // Non-blocking background sync for targets missing territoryId
    const unlinkedTargets = targets.filter((t) => !t.territoryId && t.territory?.trim());
    if (unlinkedTargets.length > 0) {
      void (async () => {
        try {
          const masterTerritories = await prisma.territory.findMany({ select: { id: true, name: true } });
          const terrMap = new Map(masterTerritories.map((m) => [m.name.trim().toLowerCase(), m.id]));
          for (const ut of unlinkedTargets) {
            const matchedId = terrMap.get(ut.territory.trim().toLowerCase());
            if (matchedId) {
              await prisma.territoryTarget.update({
                where: { id: ut.id },
                data: { territoryId: matchedId },
              }).catch(() => null);
            }
          }
        } catch {
          // ignore background sync errors
        }
      })();
    }

    const { allocations } = attributionSources;
    const attributedOrders = orders.map((order) => ({
      ...order,
      resolvedMio: normalizeAssignment(resolveOrderMio(order, attributionSources)),
    }));

    // Lookup caches for enriching MIO records with real HR & Field Force details
    const staffByName = new Map<string, (typeof staffList)[0]>();
    staffList.forEach((s) => {
      if (s.fullName?.trim()) {
        staffByName.set(s.fullName.trim().toLowerCase(), s);
      }
    });

    const allocByName = new Map<string, (typeof allocations)[0]>();
    allocations.forEach((a) => {
      if (a.mioName?.trim()) {
        allocByName.set(a.mioName.trim().toLowerCase(), a);
      }
    });

    const formattedTargets = targets.map((target) => {
      const targetTerritoryLower = normalizeAssignment(target.territory);
      const targetMioLower = normalizeAssignment(target.mioName);

      // Aggregate matching orders for real delivered/invoiced sales from DB
      const attributableOrders = attributedOrders.filter((order) =>
        Boolean(targetMioLower) && order.resolvedMio === targetMioLower &&
        (!targetTerritoryLower || !normalizeAssignment(order.territory) ||
          normalizeAssignment(order.territory) === targetTerritoryLower));
      const matchingOrders = attributableOrders.filter((order) =>
        normalizeAssignment(order.status) === "delivered & invoiced");
      const ordersRealized = matchingOrders.reduce(
        (sum, o) => sum + (Number(o.orderValue) || 0),
        0
      );

      // Achieved amount is derived directly from live database orders
      const achievedRaw =
        attributableOrders.length > 0 ? ordersRealized : target.achievedAmount || 0;

      const targetRaw = target.targetAmount;
      const rate =
        targetRaw > 0 ? Math.round((achievedRaw / targetRaw) * 100) : 0;

      let status: "Surpassed" | "On Track" | "Behind" = "Behind";
      if (rate >= 100) status = "Surpassed";
      else if (rate >= 90) status = "On Track";

      // Staff and Allocation profile enrichment
      const staffInfo = staffByName.get(targetMioLower);
      const allocInfo = allocByName.get(targetMioLower);

      return {
        id: target.id,
        territoryId: target.territoryId || target.territoryRef?.id || null,
        territoryRef: target.territoryRef ? {
          id: target.territoryRef.id,
          name: target.territoryRef.name,
          division: target.territoryRef.division,
          status: target.territoryRef.status,
        } : null,
        territory: target.territory,
        mio: target.mioName,
        empId: staffInfo?.empId || allocInfo?.employeeId || null,
        phone: staffInfo?.phone || allocInfo?.phone || null,
        division: target.territoryRef?.division || allocInfo?.division || null,
        zone: allocInfo?.allocatedZone || null,
        targetRaw,
        achievedRaw,
        baselineAchievedRaw: target.achievedAmount,
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
    const topPerforming =
      formattedTargets.length > 0
        ? formattedTargets.reduce(
            (max, t) => (t.rate > max.rate ? t : max),
            formattedTargets[0]
          )
        : null;
    const underperformingCount = formattedTargets.filter((t) => t.status === "Behind").length;

    return {
      targets: formattedTargets,
      summary: {
        totalTarget,
        totalAchieved,
        overallRate,
        topPerformingHub: topPerforming ? `${topPerforming.mio} (${topPerforming.territory})` : "N/A",
        underperformingCount,
        activeZonesCount: formattedTargets.length,
      },
    };
  },

  /**
   * Generates dynamic options for dropdowns populated strictly from real database entities,
   * with master territories from the Territory collection
   */
  async getTargetOptions() {
    const [masterTerritories, allocations, staffList, clients, orders, targets] = await Promise.all([
      territoryService.getAllTerritories(),
      prisma.mioZoneAllocation.findMany({
        orderBy: { territory: "asc" },
      }),
      prisma.staff.findMany({
        where: {
          OR: [
            { department: { equals: "Field Force", mode: "insensitive" } },
            { territory: { not: null } },
            { role: { is: { name: { contains: "MIO", mode: "insensitive" } } } },
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
      prisma.territoryTarget.findMany({
        select: { territory: true, mioName: true, territoryId: true, territoryRef: true },
      }),
    ]);

    // Build unique territories set strictly from database records & master territory collection
    const territorySet = new Set<string>();

    masterTerritories.forEach((t) => {
      if (t.name?.trim()) territorySet.add(t.name.trim());
    });
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
    targets.forEach((t) => {
      if (t.territory?.trim()) territorySet.add(t.territory.trim());
    });

    const territories = Array.from(territorySet).sort((a, b) => a.localeCompare(b));

    const territoryList = masterTerritories.map((t) => ({
      id: t.id,
      name: t.name,
      division: t.division || null,
      status: t.status || "Active",
    }));

    const territoryIdMap: Record<string, string> = {};
    masterTerritories.forEach((t) => {
      territoryIdMap[t.name.trim()] = t.id;
    });

    // Build unique MIOs list strictly from database records
    const miosMap = new Map<
      string,
      { id?: string; name: string; empId?: string; territory?: string; phone?: string }
    >();

    allocations.forEach((a) => {
      if (a.mioName?.trim()) {
        const name = a.mioName.trim();
        miosMap.set(name, {
          id: a.id,
          name,
          empId: a.employeeId,
          territory: a.territory,
          phone: a.phone,
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
          phone: s.phone || undefined,
        });
      }
    });

    orders.forEach((o) => {
      if (o.assignedMio?.trim() && !miosMap.has(o.assignedMio.trim())) {
        const name = o.assignedMio.trim();
        miosMap.set(name, {
          name,
          territory: o.territory || undefined,
        });
      }
    });

    targets.forEach((t) => {
      if (t.mioName?.trim() && !miosMap.has(t.mioName.trim())) {
        const name = t.mioName.trim();
        miosMap.set(name, {
          name,
          territory: t.territory || undefined,
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
    targets.forEach((t) => {
      if (t.territory && t.mioName && !territoryMioMap[t.territory.trim()]) {
        territoryMioMap[t.territory.trim()] = t.mioName.trim();
      }
    });

    return {
      territories,
      territoryList,
      territoryIdMap,
      mios: Array.from(miosMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      territoryMioMap,
    };
  },

  /**
   * Creates a new MIO sales target quota in the database,
   * establishing a relation with the Territory collection
   */
  async createTarget(data: {
    territoryId?: string | null;
    territory: string;
    mioName: string;
    targetAmount: number;
    achievedAmount?: number;
    fiscalYear?: string;
    notes?: string | null;
  }) {
    let targetTerritoryName = data.territory.trim();
    let targetTerritoryId = data.territoryId?.trim() || null;

    // Resolve or establish relation with Territory collection
    if (targetTerritoryId) {
      const terr = await prisma.territory.findUnique({
        where: { id: targetTerritoryId },
      });
      if (terr) {
        targetTerritoryName = terr.name;
        targetTerritoryId = terr.id;
      }
    } else {
      let terr = await prisma.territory.findFirst({
        where: { name: { equals: targetTerritoryName, mode: "insensitive" } },
      });
      if (!terr && targetTerritoryName) {
        const division = STANDARD_TERRITORY_DIVISION_MAP[targetTerritoryName] || "General Division";
        terr = await prisma.territory.create({
          data: {
            name: targetTerritoryName,
            division,
            status: "Active",
          },
        });
      }
      if (terr) {
        targetTerritoryId = terr.id;
        targetTerritoryName = terr.name;
      }
    }

    const mioName = data.mioName.trim();
    const fiscalYear = data.fiscalYear?.trim() || "Fiscal Year 2026";
    const targetAmount = Number(data.targetAmount);

    // Store only the entered baseline; live achievements are calculated on read.
    const achievedAmount = Number(data.achievedAmount) || 0;

    // Check if target for same territory, MIO, and fiscal year already exists
    const existing = await prisma.territoryTarget.findFirst({
      where: {
        OR: [
          ...(targetTerritoryId ? [{ territoryId: targetTerritoryId }] : []),
          { territory: { equals: targetTerritoryName, mode: "insensitive" } },
        ],
        mioName: { equals: mioName, mode: "insensitive" },
        fiscalYear: { equals: fiscalYear, mode: "insensitive" },
      },
    });

    let result;
    if (existing) {
      result = await prisma.territoryTarget.update({
        where: { id: existing.id },
        data: {
          territoryId: targetTerritoryId,
          territory: targetTerritoryName,
          targetAmount,
          achievedAmount,
          notes: data.notes?.trim() || existing.notes,
        },
        include: {
          territoryRef: true,
        },
      });

      await auditLogService
        .createLogEntry({
          module: "Target vs. Achievement",
          actionType: "MIO Quota Re-allocated",
          severity: "Routine",
          entityTarget: `${mioName} - ${targetTerritoryName}`,
          entityType: "TerritoryTarget",
          entityId: result.id,
          changeSummary: `Re-allocated quota target to ৳${targetAmount.toLocaleString()} (Achieved: ৳${achievedAmount.toLocaleString()}) for MIO ${mioName} in ${targetTerritoryName}`,
          priorPayload: existing,
          newPayload: result,
        })
        .catch(() => null);
    } else {
      result = await prisma.territoryTarget.create({
        data: {
          territoryId: targetTerritoryId,
          territory: targetTerritoryName,
          mioName,
          targetAmount,
          achievedAmount,
          fiscalYear,
          notes: data.notes?.trim() || null,
        },
        include: {
          territoryRef: true,
        },
      });

      await auditLogService
        .createLogEntry({
          module: "Target vs. Achievement",
          actionType: "MIO Quota Allocated",
          severity: "Routine",
          entityTarget: `${mioName} - ${targetTerritoryName}`,
          entityType: "TerritoryTarget",
          entityId: result.id,
          changeSummary: `Created new quota target of ৳${targetAmount.toLocaleString()} for MIO ${mioName} in ${targetTerritoryName}`,
          newPayload: result,
        })
        .catch(() => null);
    }

    return result;
  },

  /**
   * Updates an existing MIO quota target, preserving relation with Territory
   */
  async updateTarget(
    id: string,
    data: {
      territoryId?: string | null;
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
      include: { territoryRef: true },
    });

    if (!existing) {
      throw new AppError("Target quota record not found", 404);
    }

    let targetTerritoryName = data.territory ? data.territory.trim() : existing.territory;
    let targetTerritoryId =
      data.territoryId !== undefined
        ? (data.territoryId?.trim() || null)
        : existing.territoryId;

    if (data.territoryId?.trim()) {
      const terr = await prisma.territory.findUnique({
        where: { id: data.territoryId.trim() },
      });
      if (terr) {
        targetTerritoryName = terr.name;
        targetTerritoryId = terr.id;
      }
    } else if (data.territory?.trim()) {
      let terr = await prisma.territory.findFirst({
        where: { name: { equals: data.territory.trim(), mode: "insensitive" } },
      });
      if (!terr) {
        const division = STANDARD_TERRITORY_DIVISION_MAP[data.territory.trim()] || "General Division";
        terr = await prisma.territory.create({
          data: {
            name: data.territory.trim(),
            division,
            status: "Active",
          },
        });
      }
      if (terr) {
        targetTerritoryId = terr.id;
        targetTerritoryName = terr.name;
      }
    }

    const mioName = data.mioName ? data.mioName.trim() : existing.mioName;

    const calculatedAchieved =
      data.achievedAmount !== undefined
        ? Number(data.achievedAmount)
        : existing.achievedAmount;

    const updated = await prisma.territoryTarget.update({
      where: { id },
      data: {
        territoryId: targetTerritoryId,
        territory: targetTerritoryName,
        ...(data.mioName ? { mioName } : {}),
        ...(data.targetAmount !== undefined ? { targetAmount: Number(data.targetAmount) } : {}),
        achievedAmount: calculatedAchieved,
        ...(data.fiscalYear ? { fiscalYear: data.fiscalYear.trim() } : {}),
        ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
      },
      include: {
        territoryRef: true,
      },
    });

    await auditLogService
      .createLogEntry({
        module: "Target vs. Achievement",
        actionType: "MIO Quota Modified",
        severity: "Routine",
        entityTarget: `${updated.mioName} - ${updated.territory}`,
        entityType: "TerritoryTarget",
        entityId: updated.id,
        changeSummary: `Modified target quota for MIO ${updated.mioName} in ${updated.territory} (Target: ৳${updated.targetAmount.toLocaleString()}, Achieved: ৳${updated.achievedAmount.toLocaleString()})`,
        priorPayload: existing,
        newPayload: updated,
      })
      .catch(() => null);

    return updated;
  },

  /**
   * Deletes a target quota record
   */
  async deleteTarget(id: string) {
    const existing = await prisma.territoryTarget.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Target quota record not found", 404);
    }

    await prisma.territoryTarget.delete({
      where: { id },
    });

    await auditLogService
      .createLogEntry({
        module: "Target vs. Achievement",
        actionType: "MIO Quota Removed",
        severity: "Routine",
        entityTarget: `${existing.mioName} - ${existing.territory}`,
        entityType: "TerritoryTarget",
        entityId: id,
        changeSummary: `Removed quota target of ৳${existing.targetAmount.toLocaleString()} for MIO ${existing.mioName} in ${existing.territory}`,
        priorPayload: existing,
      })
      .catch(() => null);

    return { id, territory: existing.territory, message: "Target removed successfully" };
  },
};
