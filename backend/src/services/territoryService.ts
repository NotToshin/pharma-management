import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";
import type { Prisma } from "@prisma/client";
import type { TerritoryInput, TerritoryQuery } from "../validations/territoryValidation";
import { createPaginationMeta } from "../utils/paginationHelper";

// Null and absent ObjectIds are distinct in MongoDB. Legacy labels must be
// checked too, so deleting or renaming a master cannot orphan those records.
function assignmentWhere(id: string, name: string) {
  return { OR: [
    { territoryId: id },
    { AND: [
      { OR: [{ territoryId: null }, { territoryId: { isSet: false } }] },
      { territory: { equals: name, mode: "insensitive" as const } },
    ] },
  ] };
}

function doctorAssignmentWhere(id: string, name: string): Prisma.DoctorWhereInput {
  return { OR: [assignmentWhere(id, name), {
    AND: [
      { OR: [{ territoryId: null }, { territoryId: { isSet: false } }] },
      { OR: [{ territory: null }, { territory: "" }, { territory: { isSet: false } }] },
      { OR: [
        { territoryAndMio: { equals: name, mode: "insensitive" } },
        { territoryAndMio: { startsWith: `${name} / `, mode: "insensitive" } },
      ] },
    ],
  }] };
}

export const territoryService = {
  async getAllTerritories() {
    return prisma.territory.findMany({ orderBy: { name: "asc" } });
  },

  async listTerritories(query: TerritoryQuery = {}) {
    const search = query.search || query.searchTerm;
    const where: Prisma.TerritoryWhereInput = {
      ...(search ? { OR: [
        { name: { contains: search, mode: "insensitive" } },
        { division: { contains: search, mode: "insensitive" } },
      ] } : {}),
      ...(query.status && query.status !== "all" ? { status: query.status } : {}),
    };
    const limit = typeof query.limit === "number" ? query.limit : 0;
    const total = await prisma.territory.count({ where });
    const page = limit ? Math.min(query.page || 1, Math.max(1, Math.ceil(total / limit))) : 1;
    const data = await prisma.territory.findMany({
      where,
      orderBy: [{ [query.sortBy || "name"]: query.sortOrder || "asc" }, { id: "asc" }],
      ...(limit ? { skip: (page - 1) * limit, take: limit } : {}),
    });
    return { data, meta: createPaginationMeta(total, { page, limit }) };
  },

  async updateTerritory(id: string, input: TerritoryInput) {
    const { before, updated } = await prisma.$transaction(async tx => {
      const before = await tx.territory.findUnique({ where: { id } });
      if (!before) throw new AppError("Territory not found", 404);
      const name = input.name.trim();
      const duplicate = await tx.territory.findFirst({ where: {
        id: { not: id }, name: { equals: name, mode: "insensitive" },
      } });
      if (duplicate) throw new AppError(`Territory '${name}' already exists`, 400);
      const division = input.division?.trim() || "General Division";
      const updated = await tx.territory.update({ where: { id }, data: { name, division, status: input.status } });
      const where = assignmentWhere(id, before.name);
      if (before.name !== name) {
        // Existing name-based imports are linked as their label is updated.
        const data = { territoryId: id, territory: name };
        await Promise.all([
          tx.systemUser.updateMany({ where, data }),
          tx.staff.updateMany({ where, data }),
          tx.client.updateMany({ where, data }),
          tx.order.updateMany({ where, data }),
          tx.deliveryCollection.updateMany({ where, data }),
          tx.wholesaler.updateMany({ where, data }),
          tx.doctorVisitLog.updateMany({ where, data }),
          tx.territoryTarget.updateMany({ where, data }),
        ]);
        const doctors = await tx.doctor.findMany({
          where: doctorAssignmentWhere(id, before.name), select: { id: true, territoryAndMio: true },
        });
        for (const doctor of doctors) {
          const combined = doctor.territoryAndMio.trim();
          const suffix = combined.toLowerCase().startsWith(`${before.name.toLowerCase()} / `)
            ? combined.slice(before.name.length) : combined.startsWith("MIO:") ? ` / ${combined}` : "";
          await tx.doctor.update({ where: { id: doctor.id }, data: { ...data, territoryAndMio: `${name}${suffix}` } });
        }
      }
      if (before.name !== name || before.division !== division) {
        await tx.mioZoneAllocation.updateMany({ where, data: { territoryId: id, territory: name, division } });
      }
      return { before, updated };
    });
    await auditLogService.recordAuditEvent({
      module: "Field Force", actionType: "Territory Updated", severity: "Routine",
      entityTarget: `${updated.name} (${updated.division})`, entityType: "Territory", entityId: id,
      changeSummary: `Updated master sales territory '${before.name}' to '${updated.name}' (${updated.status}).`,
      priorPayload: before, newPayload: updated, reasonForChange: "Territory master maintenance.",
    });
    return updated;
  },

  async deleteTerritory(id: string) {
    const deleted = await prisma.$transaction(async tx => {
      const existing = await tx.territory.findUnique({ where: { id } });
      if (!existing) throw new AppError("Territory not found", 404);
      const where = assignmentWhere(id, existing.name);
      const counts = await Promise.all([
        tx.systemUser.count({ where }), tx.doctor.count({ where: doctorAssignmentWhere(id, existing.name) }),
        tx.doctorVisitLog.count({ where }), tx.staff.count({ where }), tx.client.count({ where }),
        tx.order.count({ where }), tx.deliveryCollection.count({ where }), tx.wholesaler.count({ where }),
        tx.mioZoneAllocation.count({ where }), tx.territoryTarget.count({ where }),
      ]);
      if (counts.some(count => count > 0)) {
        throw new AppError("This territory is assigned to existing records and cannot be deleted. Set it to Inactive instead.", 409);
      }
      return tx.territory.delete({ where: { id } });
    });
    await auditLogService.recordAuditEvent({
      module: "Field Force", actionType: "Territory Deleted", severity: "Routine",
      entityTarget: `${deleted.name} (${deleted.division})`, entityType: "Territory", entityId: id,
      changeSummary: `Deleted unused master sales territory '${deleted.name}'.`,
      priorPayload: deleted, reasonForChange: "Territory master maintenance.",
    });
    return deleted;
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
