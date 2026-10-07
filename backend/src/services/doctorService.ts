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
};