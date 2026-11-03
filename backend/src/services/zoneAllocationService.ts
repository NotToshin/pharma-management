import { resolveTerritoryAssignment, hasTerritoryAssignment } from "./territoryAssignment";
import { StaffStatus } from "@prisma/client";
import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";
import {
  paginationHelper,
  IPaginationOptions,
  IPaginatedResult,
} from "../utils/paginationHelper";

const mapStaffStatus = (status?: StaffStatus | string): string => {
  if (!status) return "Active";
  const s = String(status).toUpperCase();
  if (s === "ACTIVE") return "Active";
  if (s === "PROBATION") return "Probation";
  if (s === "ON_LEAVE" || s === "ON LEAVE") return "On Leave";
  if (s === "SUSPENDED") return "Suspended";
  if (s === "INACTIVE") return "Inactive";
  if (s === "TERMINATED") return "Terminated";
  return "Active";
};

export interface IZoneAllocationFilterOptions {
  searchTerm?: string;
  search?: string;
  division?: string;
  status?: string;
  [key: string]: any;
}

export const zoneAllocationFilterableFields = [
  "searchTerm",
  "search",
  "division",
  "status",
] as const;

export const zoneAllocationService = {
  async getAllAllocations(
    filters?: IZoneAllocationFilterOptions,
    paginationOptions?: IPaginationOptions
  ): Promise<IPaginatedResult<any[]>> {

    const [allocations, staffMembers, allDoctors, allClients] = await Promise.all([
      prisma.mioZoneAllocation.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.staff.findMany({
        include: { role: true },
      }),
      prisma.doctor.findMany({
        select: {
          id: true,
          doctorName: true,
          bmdcRegNumber: true,
          specialtyAndInstitute: true,
          chamber: true,
          territoryAndMio: true,
          territoryId: true,
          territory: true,
          tier: true,
          phone: true,
        },
      }),
      prisma.client.findMany({
        select: {
          id: true,
          clientCode: true,
          pharmacyName: true,
          proprietor: true,
          phone: true,
          address: true,
          territory: true,
          territoryId: true,
          assignedMio: true,
          creditLimitBDT: true,
          outstandingBalanceBDT: true,
          status: true,
        },
      }),
    ]);

    // Map staff by ID and Name for fast lookup
    const staffById = new Map<string, any>();
    const staffByName = new Map<string, any>();
    const staffByEmpId = new Map<string, any>();

    for (const s of staffMembers) {
      staffById.set(s.id, s);
      staffByName.set(s.fullName.trim().toLowerCase(), s);
      if (s.empId) staffByEmpId.set(s.empId.trim().toLowerCase(), s);
    }

    // Enrich each allocation with connected Docs, Stores, and Staff Status
    const enriched = allocations.map((alloc) => {
      // Find matching staff record
      const matchedStaff =
        (alloc.staffId && staffById.get(alloc.staffId)) ||
        (alloc.employeeId && staffByEmpId.get(alloc.employeeId.trim().toLowerCase())) ||
        staffByName.get(alloc.mioName.trim().toLowerCase());

      const status = matchedStaff ? mapStaffStatus(matchedStaff.status) : "Active";
      const actualPhone = matchedStaff?.phone || alloc.phone;
      const actualEmpId = matchedStaff?.empId || alloc.employeeId;

      const mioLower = alloc.mioName.trim().toLowerCase();
      const territoryLower = alloc.territory.trim().toLowerCase();

      // Auto-connect Doctors:
      // Match if doctor's territoryAndMio has MIO's name or matches territory
      const connectedDoctors = allDoctors.filter((doc) => {
        const docField = (doc.territoryAndMio || "").toLowerCase();
        if (!docField) return false;
        return (
          docField.includes(mioLower) ||
          (alloc.territoryId ? doc.territoryId === alloc.territoryId : territoryLower && (doc.territory || "").trim().toLowerCase() === territoryLower)
        );
      });

      // Auto-connect Pharmacy Stores:
      // Match if client's assignedMio has MIO's name or matches territory
      const connectedClients = allClients.filter((client) => {
        const clientMio = (client.assignedMio || "").trim().toLowerCase();
        const clientTerritory = (client.territory || "").trim().toLowerCase();
        return (
          (clientMio && (clientMio === mioLower || clientMio.includes(mioLower))) ||
          (alloc.territoryId ? client.territoryId === alloc.territoryId : territoryLower && clientTerritory === territoryLower)
        );
      });

      return {
        id: alloc.id,
        staffId: matchedStaff?.id || alloc.staffId,
        mioName: matchedStaff?.fullName || alloc.mioName,
        employeeId: actualEmpId,
        phone: actualPhone,
        division: alloc.division,
        territoryId: alloc.territoryId,
        territory: alloc.territory,
        allocatedZone: alloc.allocatedZone,
        effectiveDate: alloc.effectiveDate,
        notes: alloc.notes,
        status, // CONNECTED LIVE FROM STAFF DIRECTORY
        staffStatusRaw: matchedStaff?.status || "ACTIVE",
        assignedDoctors: connectedDoctors.length,
        assignedPharmacies: connectedClients.length,
        doctors: connectedDoctors,
        pharmacies: connectedClients,
        createdAt: alloc.createdAt,
        updatedAt: alloc.updatedAt,
      };
    });

    // Overview KPIs are computed over the whole enriched set (unfiltered),
    // matching the legacy frontend behavior.
    const overview = {
      activeOfficers: enriched.filter((item) => item.status === "Active").length,
      connectedDoctors: enriched.reduce(
        (acc, cur) => acc + (cur.assignedDoctors || 0),
        0
      ),
      connectedStores: enriched.reduce(
        (acc, cur) => acc + (cur.assignedPharmacies || 0),
        0
      ),
    };

    // Apply optional memory filters if supplied
    const searchValue = (filters?.searchTerm || filters?.search || "").trim();
    let result = enriched;
    if (searchValue) {
      const q = searchValue.toLowerCase();
      result = result.filter(
        (item) =>
          item.mioName.toLowerCase().includes(q) ||
          item.employeeId.toLowerCase().includes(q) ||
          item.territory.toLowerCase().includes(q) ||
          item.allocatedZone.toLowerCase().includes(q)
      );
    }

    if (filters?.division && filters.division !== "all") {
      const divQuery = filters.division.trim().toLowerCase();
      result = result.filter((item) =>
        item.division.toLowerCase().includes(divQuery)
      );
    }

    if (filters?.status && filters.status !== "all") {
      const statusQuery = filters.status.trim().toLowerCase();
      result = result.filter((item) =>
        item.status.toLowerCase() === statusQuery
      );
    }

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

    // Allowlisted in-memory sort (rows are already enriched at this point).
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "mioName",
      "employeeId",
      "territory",
      "division",
      "allocatedZone",
      "effectiveDate",
      "status",
    ];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const sorted = [...result].sort((a, b) => {
      const av = (a as any)[safeSortBy];
      const bv = (b as any)[safeSortBy];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = String(av).localeCompare(String(bv));
      return sortOrder === "asc" ? cmp : -cmp;
    });

    const total = sorted.length;
    const rows = limit > 0 ? sorted.slice(skip, skip + limit) : sorted;
    const meta = {
      ...paginationHelper.createPaginationMeta(total, { page, limit }),
      ...overview,
    };

    return { meta, data: rows };
  },

  async getAllStaffMios() {
    const allStaff = await prisma.staff.findMany({
      where: {
        OR: [
          { role: { is: { name: { contains: "MIO", mode: "insensitive" } } } },
          { role: { is: { name: { contains: "Medical Information", mode: "insensitive" } } } },
        ],
      },
      include: { role: true },
      orderBy: { fullName: "asc" },
    });

    return allStaff.map((s) => ({
      id: s.id,
      empId: s.empId,
      fullName: s.fullName,
      phone: s.phone,
      email: s.email,
      department: s.department,
      territory: s.territory,
      role: s.role?.name || "Medical Information Officer",
      status: mapStaffStatus(s.status),
      rawStatus: s.status,
    }));
  },

  async createAllocation(data: {
    staffId?: string | null;
    mioName: string;
    employeeId: string;
    phone: string;
    division: string;
    territoryId?: string | null;
    territory: string;
    allocatedZone: string;
    effectiveDate?: string;
    notes?: string | null;
  }) {
    let resolvedStaffId = data.staffId;
    let staffRecord = null;

    if (resolvedStaffId) {
      staffRecord = await prisma.staff.findUnique({
        where: { id: resolvedStaffId },
      });
    }

    if (!staffRecord) {
      staffRecord = await prisma.staff.findFirst({
        where: {
          OR: [
            { empId: data.employeeId },
            { fullName: { equals: data.mioName, mode: "insensitive" } },
          ],
        },
      });
      if (staffRecord) {
        resolvedStaffId = staffRecord.id;
      }
    }

    const todayDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newAllocation = await prisma.$transaction(async (tx) => {
      const assignment = await resolveTerritoryAssignment(data, { required: true, db: tx });
      const master = await tx.territory.findUniqueOrThrow({ where: { id: assignment.territoryId! } });
      if (staffRecord) await tx.staff.update({ where: { id: staffRecord.id }, data: assignment });
      return tx.mioZoneAllocation.create({
        data: {
          staffId: resolvedStaffId || null,
          mioName: staffRecord ? staffRecord.fullName : data.mioName,
          employeeId: staffRecord ? staffRecord.empId : data.employeeId,
          phone: staffRecord ? staffRecord.phone : data.phone,
          division: master.division || "General Division",
          ...assignment,
          allocatedZone: data.allocatedZone,
          effectiveDate: data.effectiveDate || todayDate,
          notes: data.notes || null,
        },
      });
    });

    await auditLogService.recordAuditEvent({
      module: "Field Force",
      actionType: "Zone Allocation Assigned",
      severity: "Routine",
      entityTarget: `${newAllocation.mioName} (${newAllocation.allocatedZone} - ${newAllocation.territory})`,
      entityType: "MioZoneAllocation",
      entityId: newAllocation.id,
      changeSummary: `Allocated zone '${newAllocation.allocatedZone}' in ${newAllocation.territory} (${newAllocation.division}) to MIO ${newAllocation.mioName}.`,
      newPayload: newAllocation,
      reasonForChange: "Field sales coverage and route deployment.",
    });

    return newAllocation;
  },

  async updateAllocation(
    id: string,
    data: {
      staffId?: string | null;
      mioName?: string;
      employeeId?: string;
      phone?: string;
      division?: string;
      territoryId?: string | null;
      territory?: string;
      allocatedZone?: string;
      effectiveDate?: string;
      notes?: string | null;
    }
  ) {
    const existing = await prisma.mioZoneAllocation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Zone allocation record not found", 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const assignment = await resolveTerritoryAssignment(hasTerritoryAssignment(data) ? data : { territoryId: existing.territoryId, territory: existing.territory }, { required: true, currentId: existing.territoryId, db: tx });
      const master = await tx.territory.findUniqueOrThrow({ where: { id: assignment.territoryId! } });
      const targetStaffId = data.staffId === undefined ? existing.staffId : data.staffId;
      if (targetStaffId) await tx.staff.update({ where: { id: targetStaffId }, data: assignment });
      return tx.mioZoneAllocation.update({
        where: { id },
        data: {
          ...(data.staffId !== undefined ? { staffId: data.staffId } : {}),
          ...(data.mioName ? { mioName: data.mioName } : {}),
          ...(data.employeeId ? { employeeId: data.employeeId } : {}),
          ...(data.phone ? { phone: data.phone } : {}),
          division: master.division || "General Division",
          ...assignment,
          ...(data.allocatedZone ? { allocatedZone: data.allocatedZone } : {}),
          ...(data.effectiveDate ? { effectiveDate: data.effectiveDate } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      });
    });

    await auditLogService.recordAuditEvent({
      module: "Field Force",
      actionType: "Zone Allocation Modified",
      severity: "Routine",
      entityTarget: `${updated.mioName} (${updated.allocatedZone} - ${updated.territory})`,
      entityType: "MioZoneAllocation",
      entityId: updated.id,
      changeSummary: `Reallocated zone '${updated.allocatedZone}' for ${updated.mioName} in ${updated.territory}.`,
      priorPayload: existing,
      newPayload: updated,
      reasonForChange: "Field operational zone boundary reassignment.",
    });

    return updated;
  },

  async deleteAllocation(id: string) {
    const existing = await prisma.mioZoneAllocation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Zone allocation record not found", 404);
    }

    const deleted = await prisma.mioZoneAllocation.delete({
      where: { id },
    });

    await auditLogService.recordAuditEvent({
      module: "Field Force",
      actionType: "Zone Allocation Revoked",
      severity: "Security Warning",
      entityTarget: `${existing.mioName} (${existing.allocatedZone} - ${existing.territory})`,
      entityType: "MioZoneAllocation",
      entityId: existing.id,
      changeSummary: `Revoked zone allocation '${existing.allocatedZone}' from ${existing.mioName}.`,
      priorPayload: existing,
      reasonForChange: "Zone allocation decommission / field realignment.",
    });

    return deleted;
  },
};
