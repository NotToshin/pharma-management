import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { STANDARD_TERRITORY_DIVISION_MAP } from "./territoryAnalyticsService";
import { auditLogService } from "./auditLogService";

export const territoryService = {
  /**
   * Fetch all master territories from the database.
   * Auto-initializes from standard territories and existing zone allocations if empty.
   */
  async getAllTerritories() {
    let territories = await prisma.territory.findMany({
      orderBy: { name: "asc" },
    });

    if (territories.length === 0) {
      const existingAllocations = await prisma.mioZoneAllocation.findMany({
        select: { territory: true, division: true },
      });

      const uniqueMap = new Map<string, string | undefined>();

      // Standard taxonomy
      Object.entries(STANDARD_TERRITORY_DIVISION_MAP).forEach(([name, division]) => {
        if (name.trim()) uniqueMap.set(name.trim(), division);
      });

      // Existing allocations in DB
      existingAllocations.forEach((alloc) => {
        if (alloc.territory?.trim()) {
          uniqueMap.set(
            alloc.territory.trim(),
            alloc.division?.trim() || uniqueMap.get(alloc.territory.trim())
          );
        }
      });

      const seedData = Array.from(uniqueMap.entries()).map(([name, division]) => ({
        name,
        division: division || "General Division",
        status: "Active",
      }));

      if (seedData.length > 0) {
        await prisma.territory.createMany({
          data: seedData,
        });

        territories = await prisma.territory.findMany({
          orderBy: { name: "asc" },
        });
      }
    }

    return territories;
  },

  async createTerritory(data: { name: string; division?: string; status?: string }) {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new AppError("Territory name is required", 400);
    }

    const existing = await prisma.territory.findFirst({
      where: { name: { equals: trimmedName, mode: "insensitive" } },
    });
    if (existing) {
      throw new AppError(`Territory '${trimmedName}' already exists`, 400);
    }

    const created = await prisma.territory.create({
      data: {
        name: trimmedName,
        division: data.division?.trim() || "General Division",
        status: data.status?.trim() || "Active",
      },
    });

    await auditLogService.recordAuditEvent({
      module: "Field Force",
      actionType: "Territory Created",
      severity: "Routine",
      entityTarget: `${created.name} (${created.division})`,
      entityType: "Territory",
      entityId: created.id,
      changeSummary: `Created master sales territory '${created.name}' under division '${created.division}'.`,
      newPayload: created,
      reasonForChange: "Sales territory master boundary creation.",
    });

    return created;
  },
};
