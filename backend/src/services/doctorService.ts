import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const doctorService = {
  async getAllDoctors() {
    return prisma.doctor.findMany({
      orderBy: { createdAt: "desc" },
    });
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
    patientVolumeDaily?: number;
  }) {
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
        patientVolumeDaily: Number(data.patientVolumeDaily) || 30,
      },
    });
  },

  async updateDoctor(id: string, data: {
    doctorName?: string;
    phone?: string;
    bmdcRegNumber?: string;
    specialtyAndInstitute?: string;
    chamber?: string;
    territoryAndMio?: string;
    email?: string;
    tier?: string;
    patientVolumeDaily?: number;
  }) {
    const updateData: Record<string, any> = {};
    if (data.doctorName !== undefined) updateData.doctorName = data.doctorName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.bmdcRegNumber !== undefined) updateData.bmdcRegNumber = data.bmdcRegNumber;
    if (data.specialtyAndInstitute !== undefined) updateData.specialtyAndInstitute = data.specialtyAndInstitute;
    if (data.chamber !== undefined) updateData.chamber = data.chamber;
    if (data.territoryAndMio !== undefined) updateData.territoryAndMio = data.territoryAndMio;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.tier !== undefined) updateData.tier = data.tier;
    if (data.patientVolumeDaily !== undefined) updateData.patientVolumeDaily = Number(data.patientVolumeDaily) || 30;

    return prisma.doctor.update({
      where: { id },
      data: updateData,
    });
  },

  async deleteDoctor(id: string) {
    return prisma.doctor.delete({ where: { id } });
  },
};