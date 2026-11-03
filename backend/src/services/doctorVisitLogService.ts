import { resolveTerritoryAssignment, hasTerritoryAssignment } from "./territoryAssignment";
import { Prisma, DoctorVisitLog } from "@prisma/client";
import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";
import {
  paginationHelper,
  IPaginationOptions,
  IPaginatedResult,
} from "../utils/paginationHelper";

export interface IVisitLogFilterOptions {
  searchTerm?: string;
  search?: string;
  doctorName?: string;
  specialty?: string;
  chamber?: string;
  mioName?: string;
  territory?: string;
  feedback?: string;
  [key: string]: any;
}

export const visitLogSearchableFields = [
  "dcrCode",
  "doctorName",
  "specialty",
  "chamber",
  "mioName",
  "territory",
  "promotedDrugs",
  "feedback",
] as const;

export const visitLogFilterableFields = [
  "searchTerm",
  "search",
  "doctorName",
  "specialty",
  "chamber",
  "mioName",
  "territory",
  "feedback",
] as const;

export const doctorVisitLogService = {
  async getAllVisitLogs(
    filters?: IVisitLogFilterOptions,
    paginationOptions?: IPaginationOptions
  ): Promise<IPaginatedResult<DoctorVisitLog[]>> {
    // Backward compatibility: callers without a limit (or "all"/"-1") get ALL rows.
    const normalizedPagination: IPaginationOptions = { ...(paginationOptions || {}) };
    if (
      normalizedPagination.limit === undefined ||
      normalizedPagination.limit === "" ||
      normalizedPagination.limit === "all" ||
      Number(normalizedPagination.limit) === -1
    ) {
      normalizedPagination.limit = 0;
    }

    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper.calculatePagination(normalizedPagination, {
        sortBy: "createdAt",
        sortOrder: "desc",
      });

    const searchValue = (filters?.searchTerm || filters?.search || "").trim();
    const { searchTerm: _s1, search: _s2, ...filterData } = filters || {};

    const andConditions: Prisma.DoctorVisitLogWhereInput[] = [];

    if (searchValue) {
      andConditions.push({
        OR: visitLogSearchableFields.map((field) => ({
          [field]: {
            contains: searchValue,
            mode: "insensitive",
          },
        })),
      });
    }

    if (Object.keys(filterData).length > 0) {
      andConditions.push({
        AND: Object.entries(filterData).map(([field, value]) => ({
          [field]: {
            contains: String(value),
            mode: "insensitive",
          },
        })),
      });
    }

    const whereConditions: Prisma.DoctorVisitLogWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "visitDate",
      "visitTime",
      "dcrCode",
      "doctorName",
      "specialty",
      "chamber",
      "mioName",
      "territory",
      "feedback",
    ];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const findArgs: Prisma.DoctorVisitLogFindManyArgs = {
      where: whereConditions,
      orderBy: { [safeSortBy]: sortOrder },
      include: {
        mio: { select: { id: true, fullName: true, empId: true, phone: true } },
        territoryRef: true,
      },
    };

    if (limit > 0) {
      findArgs.skip = skip;
      findArgs.take = limit;
    }

    const [rows, total] = await Promise.all([
      prisma.doctorVisitLog.findMany(findArgs),
      prisma.doctorVisitLog.count({ where: whereConditions }),
    ]);

    const meta = paginationHelper.createPaginationMeta(total, { page, limit });

    return {
      meta,
      data: rows,
    };
  },

  async getVisitLogById(id: string) {
    const log = await prisma.doctorVisitLog.findUnique({
      where: { id },
      include: {
        mio: { select: { id: true, fullName: true, empId: true, phone: true } },
        territoryRef: true,
      },
    });
    if (!log) {
      throw new AppError(`Doctor visit log with ID '${id}' not found`, 404);
    }
    return log;
  },

  async createVisitLog(data: {
    dcrCode?: string;
    doctorName: string;
    specialty: string;
    chamber: string;
    mioName: string;
    mioId?: string | null;
    territoryId?: string | null;
    territory: string;
    visitDate: string;
    visitTime: string;
    promotedDrugs: string;
    samplesGiven: string;
    feedback: string;
  }) {
    const dcrCode = data.dcrCode || `DCR-2026-${Date.now().toString().slice(-4)}`;

    let mioName = data.mioName;
    const mioId = data.mioId || null;
    if (mioId) {
      const staff = await prisma.staff.findUnique({ where: { id: mioId } });
      if (staff) {
        mioName = staff.fullName;
      }
    }

    const assignment = await resolveTerritoryAssignment(data, { required: true });
    const newLog = await prisma.doctorVisitLog.create({
      data: {
        dcrCode,
        doctorName: data.doctorName,
        specialty: data.specialty,
        chamber: data.chamber,
        mioName,
        mioId,
        ...assignment,
        visitDate: data.visitDate,
        visitTime: data.visitTime,
        promotedDrugs: data.promotedDrugs,
        samplesGiven: data.samplesGiven,
        feedback: data.feedback,
      },
      include: {
        mio: { select: { id: true, fullName: true, empId: true, phone: true } },
        territoryRef: true,
      },
    });

    await auditLogService.recordAuditEvent({
      module: "Field Force",
      actionType: "Doctor Call Logged",
      severity: "Routine",
      entityTarget: `${newLog.dcrCode} (Dr. ${newLog.doctorName})`,
      entityType: "DoctorVisitLog",
      entityId: newLog.id,
      changeSummary: `Daily Call Report logged for Dr. ${newLog.doctorName} (${newLog.specialty}) at ${newLog.chamber} by MIO ${newLog.mioName}. Sentiment: ${newLog.feedback}. Samples: ${newLog.samplesGiven}.`,
      newPayload: newLog,
      reasonForChange: "Field Force Daily Call Report (DCR) record submission.",
    });

    return newLog;
  },

  async updateVisitLog(
    id: string,
    data: {
      dcrCode?: string;
      doctorName?: string;
      specialty?: string;
      chamber?: string;
      mioName?: string;
      mioId?: string | null;
      territoryId?: string | null;
      territory?: string;
      visitDate?: string;
      visitTime?: string;
      promotedDrugs?: string;
      samplesGiven?: string;
      feedback?: string;
    }
  ) {
    const existing = await this.getVisitLogById(id);

    const updateData: any = { ...data };
    if (data.mioId) {
      const staff = await prisma.staff.findUnique({ where: { id: data.mioId } });
      if (staff) {
        updateData.mioName = staff.fullName;
      }
    }

    const assignment = hasTerritoryAssignment(data)
      ? await resolveTerritoryAssignment(data, { required: true, currentId: existing.territoryId }) : {};
    const updated = await prisma.doctorVisitLog.update({
      where: { id },
      data: { ...updateData, ...assignment },
      include: {
        mio: { select: { id: true, fullName: true, empId: true, phone: true } },
        territoryRef: true,
      },
    });

    await auditLogService.recordAuditEvent({
      module: "Field Force",
      actionType: "Doctor Call Updated",
      severity: "Routine",
      entityTarget: `${updated.dcrCode} (Dr. ${updated.doctorName})`,
      entityType: "DoctorVisitLog",
      entityId: updated.id,
      changeSummary: `DCR record ${updated.dcrCode} for Dr. ${updated.doctorName} amended by MIO ${updated.mioName || existing.mioName}.`,
      priorPayload: existing,
      newPayload: updated,
      reasonForChange: "Field call retrospective log rectification.",
    });

    return updated;
  },

  async deleteVisitLog(id: string) {
    const existing = await this.getVisitLogById(id);
    const deleted = await prisma.doctorVisitLog.delete({ where: { id } });

    await auditLogService.recordAuditEvent({
      module: "Field Force",
      actionType: "Doctor Call Removed",
      severity: "Security Warning",
      entityTarget: `${existing.dcrCode} (Dr. ${existing.doctorName})`,
      entityType: "DoctorVisitLog",
      entityId: existing.id,
      changeSummary: `DCR record ${existing.dcrCode} for Dr. ${existing.doctorName} deleted from system ledger.`,
      priorPayload: existing,
      reasonForChange: "Regulatory purge of erroneous doctor call entry.",
    });

    return deleted;
  },
};
