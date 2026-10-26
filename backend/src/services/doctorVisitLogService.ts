import prisma from "../utils/prisma";
import { AppError } from "../errors";

export const doctorVisitLogService = {
  async getAllVisitLogs() {
    return prisma.doctorVisitLog.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async getVisitLogById(id: string) {
    const log = await prisma.doctorVisitLog.findUnique({ where: { id } });
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
    territory: string;
    visitDate: string;
    visitTime: string;
    promotedDrugs: string;
    samplesGiven: string;
    feedback: string;
  }) {
    const dcrCode = data.dcrCode || `DCR-2026-${Date.now().toString().slice(-4)}`;

    return prisma.doctorVisitLog.create({
      data: {
        dcrCode,
        doctorName: data.doctorName,
        specialty: data.specialty,
        chamber: data.chamber,
        mioName: data.mioName,
        territory: data.territory,
        visitDate: data.visitDate,
        visitTime: data.visitTime,
        promotedDrugs: data.promotedDrugs,
        samplesGiven: data.samplesGiven,
        feedback: data.feedback,
      },
    });
  },

  async updateVisitLog(
    id: string,
    data: {
      dcrCode?: string;
      doctorName?: string;
      specialty?: string;
      chamber?: string;
      mioName?: string;
      territory?: string;
      visitDate?: string;
      visitTime?: string;
      promotedDrugs?: string;
      samplesGiven?: string;
      feedback?: string;
    }
  ) {
    await this.getVisitLogById(id);

    return prisma.doctorVisitLog.update({
      where: { id },
      data,
    });
  },

  async deleteVisitLog(id: string) {
    await this.getVisitLogById(id);
    return prisma.doctorVisitLog.delete({ where: { id } });
  },
};
