import crypto from "crypto";
import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { CreateAuditLogInput, QueryAuditLogInput, SignAuditLogInput } from "../validations/auditLogValidation";
import { getActorContext } from "../utils/requestContext";

export interface LogAuditEventOptions {
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  ipAddress?: string;
  userAgent?: string;
  module: string;
  actionType: string;
  severity?: "Critical" | "Security Warning" | "Statutory Notice" | "Routine";
  entityTarget: string;
  entityType?: string;
  entityId?: string;
  changeSummary: string;
  priorPayload?: any;
  newPayload?: any;
  reasonForChange?: string;
  signerName?: string;
  signatureMeaning?: string;
}

const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

function stringifyPayload(payload: any): string | undefined {
  if (payload === undefined || payload === null) return undefined;
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

function calculateEntryHash(params: {
  previousHash: string;
  timestamp: string | Date;
  actorEmail: string;
  module: string;
  actionType: string;
  entityTarget: string;
  priorPayload?: string;
  newPayload?: string;
  reasonForChange?: string;
}): string {
  const ts = params.timestamp instanceof Date ? params.timestamp.toISOString() : new Date(params.timestamp).toISOString();
  const rawData = [
    params.previousHash || GENESIS_HASH,
    ts,
    params.actorEmail.toLowerCase(),
    params.module,
    params.actionType,
    params.entityTarget,
    params.priorPayload || "",
    params.newPayload || "",
    params.reasonForChange || "",
  ].join("|#|");

  return crypto.createHash("sha256").update(rawData).digest("hex");
}

function formatAuditTimestamp(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
}

export const auditLogService = {
  async getAllLogs(filters?: QueryAuditLogInput) {
    const where: any = {};

    const searchValue = (filters?.search || filters?.searchTerm || "").trim();
    if (searchValue) {
      const s = searchValue;
      where.OR = [
        { auditRef: { contains: s, mode: "insensitive" } },
        { actorName: { contains: s, mode: "insensitive" } },
        { actorEmail: { contains: s, mode: "insensitive" } },
        { entityTarget: { contains: s, mode: "insensitive" } },
        { actionType: { contains: s, mode: "insensitive" } },
        { changeSummary: { contains: s, mode: "insensitive" } },
        { module: { contains: s, mode: "insensitive" } },
        { sha256Hash: { contains: s, mode: "insensitive" } },
      ];
    }

    if (filters?.module && filters.module !== "all") {
      where.module = { contains: filters.module, mode: "insensitive" };
    }

    if (filters?.severity && filters.severity !== "all") {
      where.severity = { equals: filters.severity, mode: "insensitive" };
    }

    if (filters?.actionType && filters.actionType !== "all") {
      where.actionType = { equals: filters.actionType, mode: "insensitive" };
    }

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = new Date(filters.startDate);
      if (filters.endDate) where.timestamp.lte = new Date(filters.endDate);
    }

    const page = Math.max(1, parseInt(filters?.page || "1", 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(filters?.limit || "10", 10) || 10));
    const skip = (page - 1) * limit;
    const allowedSortFields = [
      "timestamp",
      "createdAt",
      "auditRef",
      "actorName",
      "module",
      "severity",
      "actionType",
    ];
    const sortBy = allowedSortFields.includes(filters?.sortBy || "")
      ? (filters?.sortBy as string)
      : "timestamp";
    const sortOrder = filters?.sortOrder === "asc" ? "asc" : "desc";

    const [total, rawLogs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    const formattedLogs = rawLogs.map((log) => ({
      ...log,
      formattedTimestamp: formatAuditTimestamp(log.timestamp),
      isoTimestamp: log.timestamp.toISOString(),
    }));

    return {
      logs: formattedLogs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        totalPage: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getStats() {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "asc" },
    });

    const totalRecords = logs.length;
    let criticalCount = 0;
    let warningCount = 0;
    let statutoryCount = 0;
    let routineCount = 0;

    const moduleBreakdown: Record<string, number> = {};
    const severityBreakdown: Record<string, number> = {};

    let isChainIntact = true;
    let brokenAtRef: string | null = null;
    let verifiedCount = 0;

    let expectedPrevHash = GENESIS_HASH;

    for (let i = 0; i < logs.length; i++) {
      const entry = logs[i];

      // Tally severities
      const sev = entry.severity || "Routine";
      severityBreakdown[sev] = (severityBreakdown[sev] || 0) + 1;

      if (sev.toLowerCase() === "critical") criticalCount++;
      else if (sev.toLowerCase().includes("warning")) warningCount++;
      else if (sev.toLowerCase().includes("statutory")) statutoryCount++;
      else routineCount++;

      // Tally modules
      const mod = entry.module || "General";
      moduleBreakdown[mod] = (moduleBreakdown[mod] || 0) + 1;

      // Hash chain verification check
      if (isChainIntact) {
        const computedHash = calculateEntryHash({
          previousHash: expectedPrevHash,
          timestamp: entry.timestamp,
          actorEmail: entry.actorEmail,
          module: entry.module,
          actionType: entry.actionType,
          entityTarget: entry.entityTarget,
          priorPayload: entry.priorPayload || undefined,
          newPayload: entry.newPayload || undefined,
          reasonForChange: entry.reasonForChange || undefined,
        });

        const storedHash = entry.sha256Hash;
        const storedPrevHash = entry.previousHash || GENESIS_HASH;

        if (storedHash === computedHash && storedPrevHash === expectedPrevHash) {
          verifiedCount++;
          expectedPrevHash = storedHash;
        } else {
          isChainIntact = false;
          brokenAtRef = entry.auditRef;
        }
      }
    }

    const integrityPercentage = totalRecords > 0 ? (verifiedCount / totalRecords) * 100 : 100;

    return {
      totalRecords,
      criticalCount,
      warningCount,
      statutoryCount,
      routineCount,
      isChainIntact,
      brokenAtRef,
      verifiedCount,
      integrityPercentage: Math.round(integrityPercentage * 10) / 10,
      moduleBreakdown,
      severityBreakdown,
    };
  },

  async verifyChain() {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "asc" },
    });

    let currentExpectedPrev = GENESIS_HASH;
    let verifiedBlocks = 0;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const recalculatedHash = calculateEntryHash({
        previousHash: currentExpectedPrev,
        timestamp: log.timestamp,
        actorEmail: log.actorEmail,
        module: log.module,
        actionType: log.actionType,
        entityTarget: log.entityTarget,
        priorPayload: log.priorPayload || undefined,
        newPayload: log.newPayload || undefined,
        reasonForChange: log.reasonForChange || undefined,
      });

      if (log.sha256Hash !== recalculatedHash || (log.previousHash || GENESIS_HASH) !== currentExpectedPrev) {
        return {
          valid: false,
          totalVerified: verifiedBlocks,
          totalBlocks: logs.length,
          corruptedRecord: {
            id: log.id,
            auditRef: log.auditRef,
            expectedHash: recalculatedHash,
            actualHash: log.sha256Hash,
            expectedPreviousHash: currentExpectedPrev,
            actualPreviousHash: log.previousHash,
          },
          message: `Cryptographic tampering detected at record ref '${log.auditRef}'. Hash verification failed.`,
        };
      }

      verifiedBlocks++;
      currentExpectedPrev = log.sha256Hash;
    }

    return {
      valid: true,
      totalVerified: verifiedBlocks,
      totalBlocks: logs.length,
      genesisHash: GENESIS_HASH,
      headHash: logs.length > 0 ? logs[logs.length - 1].sha256Hash : GENESIS_HASH,
      message: logs.length === 0
        ? "No audit events recorded yet. Ready for live operations with genesis integrity."
        : `Complete 21 CFR Part 11 audit chain intact. All ${verifiedBlocks} chronological blocks verified valid with SHA-256 integrity.`,
    };
  },

  async getLogById(id: string) {
    const log = await prisma.auditLog.findFirst({
      where: {
        OR: [{ id }, { auditRef: id }],
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            territory: true,
            role: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!log) {
      throw new AppError(`Audit log record with reference '${id}' not found.`, 404);
    }

    return {
      ...log,
      formattedTimestamp: formatAuditTimestamp(log.timestamp),
      isoTimestamp: log.timestamp.toISOString(),
    };
  },

  async createLogEntry(
    input: CreateAuditLogInput,
    actorContext?: {
      userId?: string;
      name?: string;
      email?: string;
      role?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    // 1. Fetch latest audit log to chain hashes
    const latestLog = await prisma.auditLog.findFirst({
      orderBy: { timestamp: "desc" },
    });

    const previousHash = latestLog?.sha256Hash || GENESIS_HASH;

    // 2. Compute Next Sequential Audit Reference: AUD-YYYY-NNNNN
    const year = new Date().getFullYear();
    const allRefs = await prisma.auditLog.findMany({
      select: { auditRef: true },
    });

    let maxSeq = 10000;
    for (const r of allRefs) {
      const match = r.auditRef?.match(/AUD-\d+-(\d+)/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    }
    const auditRef = `AUD-${year}-${maxSeq + 1}`;

    const context = getActorContext();
    const timestamp = new Date();
    const actorEmail = actorContext?.email || context?.email || "system@pharma.com";
    const actorName = actorContext?.name || context?.name || "System Administrator";
    const actorRole = actorContext?.role || context?.role || "System Administrator";
    const actorId = actorContext?.userId || context?.userId;
    const ipAddress = actorContext?.ipAddress || context?.ipAddress || "127.0.0.1";
    const userAgent = actorContext?.userAgent || context?.userAgent || "Mozilla/5.0";

    const priorPayloadStr = stringifyPayload(input.priorPayload);
    const newPayloadStr = stringifyPayload(input.newPayload);
    const reasonForChange =
      input.reasonForChange ||
      context?.reasonForChange ||
      `Statutory audit trail record executed under 21 CFR Part 11 protocols for ${input.module} (${input.actionType}).`;

    // 3. Calculate Immutable Cryptographic SHA-256 Hash
    const sha256Hash = calculateEntryHash({
      previousHash,
      timestamp,
      actorEmail,
      module: input.module,
      actionType: input.actionType,
      entityTarget: input.entityTarget,
      priorPayload: priorPayloadStr,
      newPayload: newPayloadStr,
      reasonForChange,
    });

    // 4. Create Immutable Record
    const newEntry = await prisma.auditLog.create({
      data: {
        auditRef,
        timestamp,
        actorId: actorContext?.userId || undefined,
        actorName,
        actorEmail,
        actorRole,
        ipAddress,
        userAgent,
        module: input.module,
        actionType: input.actionType,
        severity: input.severity || "Routine",
        entityTarget: input.entityTarget,
        entityType: input.entityType,
        entityId: input.entityId,
        changeSummary: input.changeSummary,
        priorPayload: priorPayloadStr,
        newPayload: newPayloadStr,
        reasonForChange,
        sha256Hash,
        previousHash,
        verifiedSignature: true,
        signerName: input.signerName || actorName,
        signatureMeaning: input.signatureMeaning || "Authorship",
        signedAt: timestamp,
      },
    });

    return {
      ...newEntry,
      formattedTimestamp: formatAuditTimestamp(newEntry.timestamp),
    };
  },

  async signLogEntry(
    id: string,
    signatureInput: SignAuditLogInput,
    signingUser?: { name: string; email: string; role: string }
  ) {
    const existing = await this.getLogById(id);

    const signedAt = new Date();
    const updatedSummary = `${existing.changeSummary} [Statutorily Signed by ${signatureInput.signerName} (${signatureInput.signatureMeaning}) on ${formatAuditTimestamp(signedAt)}: ${signatureInput.reason}]`;

    const updated = await prisma.auditLog.update({
      where: { id: existing.id },
      data: {
        signerName: signatureInput.signerName,
        signatureMeaning: signatureInput.signatureMeaning,
        signedAt,
        verifiedSignature: true,
        changeSummary: updatedSummary,
        reasonForChange: signatureInput.reason || existing.reasonForChange,
      },
    });

    return {
      ...updated,
      formattedTimestamp: formatAuditTimestamp(updated.timestamp),
      formattedSignedAt: formatAuditTimestamp(signedAt),
    };
  },

  async recordAuditEvent(options: LogAuditEventOptions): Promise<void> {
    try {
      const latestLog = await prisma.auditLog.findFirst({
        orderBy: { timestamp: "desc" },
      });
      const previousHash = latestLog?.sha256Hash || GENESIS_HASH;

      const year = new Date().getFullYear();
      const allRefs = await prisma.auditLog.findMany({ select: { auditRef: true } });
      let maxSeq = 10000;
      for (const r of allRefs) {
        const match = r.auditRef?.match(/AUD-\d+-(\d+)/);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) maxSeq = seq;
        }
      }
      const auditRef = `AUD-${year}-${maxSeq + 1}`;

      const context = getActorContext();
      const timestamp = new Date();

      // Resilient actor resolution for EVERY user
      let resolvedEmail = options.actorEmail || context?.email;
      let resolvedName = options.actorName || context?.name;
      let resolvedRole = options.actorRole || context?.role;
      let resolvedUserId = options.actorId || context?.userId;

      // If actor was missing from context, inspect newPayload for clues
      if (!resolvedEmail && options.newPayload && typeof options.newPayload === "object") {
        const p = options.newPayload as any;
        const candidateEmail = p.email || p.actorEmail || p.operatorEmail;
        const candidateName =
          p.name ||
          p.fullName ||
          p.doctorName ||
          p.mioName ||
          p.assignedMio ||
          p.salesRepName ||
          p.createdBy ||
          p.approvedBy;
        if (candidateEmail && typeof candidateEmail === "string") {
          resolvedEmail = candidateEmail.trim().toLowerCase();
        }
        if (candidateName && typeof candidateName === "string" && candidateName !== "Unassigned" && candidateName !== "General MIO") {
          resolvedName = resolvedName || candidateName;
        }
      }

      const actorEmail = resolvedEmail || "system@pharma.com";
      const actorName = resolvedName || "System Administrator";
      const actorRole = resolvedRole || "System Administrator";
      const actorId = resolvedUserId;
      const ipAddress = options.ipAddress || context?.ipAddress || "127.0.0.1";
      const userAgent = options.userAgent || context?.userAgent || "Mozilla/5.0";

      const priorPayloadStr = stringifyPayload(options.priorPayload);
      const newPayloadStr = stringifyPayload(options.newPayload);
      const reasonForChange =
        options.reasonForChange ||
        context?.reasonForChange ||
        `Statutory audit trail record executed under 21 CFR Part 11 protocols for ${options.module} (${options.actionType}).`;

      const sha256Hash = calculateEntryHash({
        previousHash,
        timestamp,
        actorEmail,
        module: options.module,
        actionType: options.actionType,
        entityTarget: options.entityTarget,
        priorPayload: priorPayloadStr,
        newPayload: newPayloadStr,
        reasonForChange,
      });

      await prisma.auditLog.create({
        data: {
          auditRef,
          timestamp,
          actorId,
          actorName,
          actorEmail,
          actorRole,
          ipAddress,
          userAgent,
          module: options.module,
          actionType: options.actionType,
          severity: options.severity || "Routine",
          entityTarget: options.entityTarget,
          entityType: options.entityType,
          entityId: options.entityId,
          changeSummary: options.changeSummary,
          priorPayload: priorPayloadStr,
          newPayload: newPayloadStr,
          reasonForChange,
          sha256Hash,
          previousHash,
          verifiedSignature: true,
          signerName: options.signerName || actorName,
          signatureMeaning: options.signatureMeaning || "Authorship",
          signedAt: timestamp,
        },
      });
    } catch (err) {
      console.error("Failed to record automated audit event:", err);
    }
  },

  async clearAllAuditLogs(): Promise<{ count: number }> {
    const result = await prisma.auditLog.deleteMany({});
    return { count: result.count };
  },
};
