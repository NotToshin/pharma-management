import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";

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

    const newLog = await prisma.doctorVisitLog.create({
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
      territory?: string;
      visitDate?: string;
      visitTime?: string;
      promotedDrugs?: string;
      samplesGiven?: string;
      feedback?: string;
    }
  ) {
    const existing = await this.getVisitLogById(id);

    const updated = await prisma.doctorVisitLog.update({
      where: { id },
      data,
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
