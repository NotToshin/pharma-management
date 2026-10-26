import { Prisma, Doctor } from "@prisma/client";
import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";
import {
  paginationHelper,
  IPaginationOptions,
  IPaginatedResult,
} from "../utils/paginationHelper";

export interface IDoctorFilterOptions {
  searchTerm?: string;
  doctorName?: string;
  phone?: string;
  bmdcRegNumber?: string;
  specialtyAndInstitute?: string;
  chamber?: string;
  territory?: string;
  territoryAndMio?: string;
  email?: string;
  tier?: string;
  [key: string]: any;
}

export const doctorSearchableFields = [
  "doctorName",
  "phone",
  "bmdcRegNumber",
  "specialtyAndInstitute",
  "chamber",
  "territory",
  "territoryAndMio",
  "email",
  "tier",
] as const;

export const doctorFilterableFields = [
  "searchTerm",
  "doctorName",
  "phone",
  "bmdcRegNumber",
  "specialtyAndInstitute",
  "chamber",
  "territory",
  "territoryAndMio",
  "email",
  "tier",
] as const;

export const doctorService = {
  async getAllDoctors(
    filters?: IDoctorFilterOptions,
    paginationOptions?: IPaginationOptions
  ): Promise<IPaginatedResult<Doctor[]>> {
    // Support calling getAllDoctors(paginationOptions) with a single argument
    if (
      !paginationOptions &&
      filters &&
      ("page" in filters ||
        "limit" in filters ||
        "sortBy" in filters ||
        "sortOrder" in filters)
    ) {
      paginationOptions = filters as IPaginationOptions;
      filters = {};
    }

    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper.calculatePagination(paginationOptions, {
        sortBy: "createdAt",
        sortOrder: "desc",
      });

    const { searchTerm, ...filterData } = filters || {};
    const andConditions: Prisma.DoctorWhereInput[] = [];

    // Search across searchable fields
    if (searchTerm) {
      andConditions.push({
        OR: doctorSearchableFields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
      });
    }

    // Specific field filters
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

    const whereConditions: Prisma.DoctorWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    // Validate safe sort field against Doctor model properties
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "doctorName",
      "bmdcRegNumber",
      "tier",
      "patientVolumeDaily",
    ];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const findArgs: Prisma.DoctorFindManyArgs = {
      where: whereConditions,
      orderBy: { [safeSortBy]: sortOrder },
    };

    if (limit > 0) {
      findArgs.skip = skip;
      findArgs.take = limit;
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany(findArgs),
      prisma.doctor.count({ where: whereConditions }),
    ]);

    const meta = paginationHelper.createPaginationMeta(total, { page, limit });

    return {
      meta,
      data: doctors,
    };
  },

  async getDoctorById(id: string) {
    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      throw new AppError(`Doctor with ID '${id}' not found`, 404);
    }
    return doctor;
  },

  async createDoctor(data: {
    doctorName: string;
    phone: string;
    bmdcRegNumber: string;
    specialtyAndInstitute: string;
    chamber: string;
    territory?: string;
    territoryAndMio?: string;
    email: string;
    tier: string;
    patientVolumeDaily: number;
  }) {
    const existingDoctor = await prisma.doctor.findUnique({
      where: { bmdcRegNumber: data.bmdcRegNumber },
    });
    if (existingDoctor) {
      throw new AppError(
        `Doctor with BMDC Reg # '${data.bmdcRegNumber}' already exists (${existingDoctor.doctorName})`,
        400
      );
    }

    const territoryVal = data.territory?.trim() || null;
    const territoryAndMio =
      data.territoryAndMio ||
      (territoryVal ? `${territoryVal}` : "Unassigned");

    const created = await prisma.doctor.create({
      data: {
        doctorName: data.doctorName,
        phone: data.phone,
        bmdcRegNumber: data.bmdcRegNumber,
        specialtyAndInstitute: data.specialtyAndInstitute,
        chamber: data.chamber,
        territory: territoryVal,
        territoryAndMio,
        email: data.email,
        tier: data.tier,
        patientVolumeDaily: data.patientVolumeDaily,
      },
    });

    await auditLogService.recordAuditEvent({
      module: "Clinical Registry",
      actionType: "Doctor Registered",
      severity: "Routine",
      entityTarget: `Dr. ${created.doctorName} (BMDC: ${created.bmdcRegNumber})`,
      entityType: "Doctor",
      entityId: created.id,
      changeSummary: `Registered clinical practitioner Dr. ${created.doctorName} with BMDC #${created.bmdcRegNumber} (Tier ${created.tier}).`,
      newPayload: created,
      reasonForChange: "Clinical registry doctor credentialing verification.",
    });

    return created;
  },

  async updateDoctor(
    id: string,
    data: {
      doctorName?: string;
      phone?: string;
      bmdcRegNumber?: string;
      specialtyAndInstitute?: string;
      chamber?: string;
      territory?: string;
      territoryAndMio?: string;
      email?: string;
      tier?: string;
      patientVolumeDaily?: number;
    }
  ) {
    const existing = await this.getDoctorById(id);

    if (data.bmdcRegNumber) {
      const existingDuplicate = await prisma.doctor.findUnique({
        where: { bmdcRegNumber: data.bmdcRegNumber },
      });
      if (existingDuplicate && existingDuplicate.id !== id) {
        throw new AppError(
          `Doctor with BMDC Reg # '${data.bmdcRegNumber}' already exists (${existingDuplicate.doctorName})`,
          400
        );
      }
    }

    const updated = await prisma.doctor.update({
      where: { id },
      data,
    });

    const isTierChanged = data.tier && data.tier !== existing.tier;
    await auditLogService.recordAuditEvent({
      module: "Clinical Registry",
      actionType: isTierChanged ? "Tier Re-ranked" : "Clinical Registry Updated",
      severity: isTierChanged ? "Statutory Notice" : "Routine",
      entityTarget: `Practitioner BMDC: ${updated.bmdcRegNumber} (${updated.doctorName})`,
      entityType: "Doctor",
      entityId: id,
      changeSummary: isTierChanged
        ? `Prescriber category modified from Tier ${existing.tier} to Tier ${updated.tier} based on clinical evaluation.`
        : `Updated clinical profile details for Dr. ${updated.doctorName}.`,
      priorPayload: existing,
      newPayload: updated,
      reasonForChange: isTierChanged
        ? "Periodic clinical prescription quota review and territory tier re-evaluation."
        : "Practitioner information update.",
    });

    return updated;
  },

  async deleteDoctor(id: string) {
    const existing = await this.getDoctorById(id);
    const deleted = await prisma.doctor.delete({ where: { id } });

    await auditLogService.recordAuditEvent({
      module: "Clinical Registry",
      actionType: "Doctor Deregistered",
      severity: "Critical",
      entityTarget: `Dr. ${existing.doctorName} (BMDC: ${existing.bmdcRegNumber})`,
      entityType: "Doctor",
      entityId: id,
      changeSummary: `Deregistered clinical practitioner Dr. ${existing.doctorName} from active registry.`,
      priorPayload: existing,
      reasonForChange: "Practitioner deregistration / statutory registry archive.",
    });

    return deleted;
  },

  async bulkImportDoctors(data: {
    doctors: Array<{
      doctorName: string;
      phone?: string;
      bmdcRegNumber: string;
      specialtyAndInstitute?: string;
      chamber?: string;
      territory?: string;
      territoryAndMio?: string;
      email?: string;
      tier?: string;
      patientVolumeDaily?: number;
    }>;
    updateExisting?: boolean;
  }) {
    if (!Array.isArray(data.doctors) || data.doctors.length === 0) {
      throw new AppError("No doctors provided for import", 400);
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const skippedBmdc: string[] = [];
    const errors: string[] = [];

    for (const item of data.doctors) {
      const bmdc = item.bmdcRegNumber?.trim();
      if (!bmdc) {
        skippedCount++;
        errors.push(`Doctor '${item.doctorName || "Unknown"}' is missing BMDC registration number.`);
        continue;
      }

      const doctorName = item.doctorName?.trim() || "Dr. Medical Practitioner";
      const phone = item.phone?.trim() || "+880 1700-000000";
      const specialtyAndInstitute = item.specialtyAndInstitute?.trim() || "General Medicine";
      const chamber = item.chamber?.trim() || "Central Chamber";
      const territory = item.territory?.trim() || (item.territoryAndMio ? item.territoryAndMio.split("/")[0].trim() : null);
      const territoryAndMio = item.territoryAndMio?.trim() || (territory ? `${territory} / Unassigned` : "Dhaka / Unassigned");
      const email = item.email?.trim() || "doctor@akpharma.com";
      const tier = item.tier?.trim() || "Tier 1 (High Prescriber)";
      const patientVolumeDaily = Number(item.patientVolumeDaily) || 20;

      const existing = await prisma.doctor.findUnique({
        where: { bmdcRegNumber: bmdc },
      });

      if (existing) {
        if (data.updateExisting) {
          await prisma.doctor.update({
            where: { id: existing.id },
            data: {
              doctorName,
              phone,
              specialtyAndInstitute,
              chamber,
              territory,
              territoryAndMio,
              email,
              tier,
              patientVolumeDaily,
            },
          });
          updatedCount++;
        } else {
          skippedCount++;
          skippedBmdc.push(bmdc);
        }
      } else {
        await prisma.doctor.create({
          data: {
            doctorName,
            phone,
            bmdcRegNumber: bmdc,
            specialtyAndInstitute,
            chamber,
            territory,
            territoryAndMio,
            email,
            tier,
            patientVolumeDaily,
          },
        });
        createdCount++;
      }
    }

    return {
      totalProcessed: data.doctors.length,
      createdCount,
      updatedCount,
      skippedCount,
      skippedBmdc,
      errors,
    };
  },
};