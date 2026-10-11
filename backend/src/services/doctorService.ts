import prisma from "../utils/prisma";
import { AppError } from "../errors";

export const doctorService = {
  async getAllDoctors() {
    return prisma.doctor.findMany({
      orderBy: { createdAt: "desc" },
    });
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
    territoryAndMio: string;
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

    return prisma.doctor.create({
      data: {
        doctorName: data.doctorName,
        phone: data.phone,
        bmdcRegNumber: data.bmdcRegNumber,
        specialtyAndInstitute: data.specialtyAndInstitute,
        chamber: data.chamber,
        territoryAndMio: data.territoryAndMio,
        email: data.email,
        tier: data.tier,
        patientVolumeDaily: data.patientVolumeDaily,
      },
    });
  },

  async updateDoctor(
    id: string,
    data: {
      doctorName?: string;
      phone?: string;
      bmdcRegNumber?: string;
      specialtyAndInstitute?: string;
      chamber?: string;
      territoryAndMio?: string;
      email?: string;
      tier?: string;
      patientVolumeDaily?: number;
    }
  ) {
    await this.getDoctorById(id);

    if (data.bmdcRegNumber) {
      const existing = await prisma.doctor.findUnique({
        where: { bmdcRegNumber: data.bmdcRegNumber },
      });
      if (existing && existing.id !== id) {
        throw new AppError(
          `Doctor with BMDC Reg # '${data.bmdcRegNumber}' already exists (${existing.doctorName})`,
          400
        );
      }
    }

    return prisma.doctor.update({
      where: { id },
      data,
    });
  },

  async deleteDoctor(id: string) {
    await this.getDoctorById(id);
    return prisma.doctor.delete({ where: { id } });
  },

  async bulkImportDoctors(data: {
    doctors: Array<{
      doctorName: string;
      phone?: string;
      bmdcRegNumber: string;
      specialtyAndInstitute?: string;
      chamber?: string;
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
      const territoryAndMio = item.territoryAndMio?.trim() || "Dhaka / Unassigned";
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