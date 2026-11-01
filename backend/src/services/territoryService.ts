import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";

export const territoryService = {
  async getAllTerritories() {
    return prisma.territory.findMany({ orderBy: { name: "asc" } });
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
