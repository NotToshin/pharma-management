import prisma from "../utils/prisma";
import { AppError } from "../errors";
import { auditLogService } from "./auditLogService";

export const treasuryService = {
  async getAllDeposits() {
    return prisma.treasuryDeposit.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async createDeposit(data: { destinationType: string; destinationName: string; amount: number }) {
    if (!data.destinationType?.trim() || !data.destinationName?.trim()) {
      throw new AppError("Destination type and name are required", 400);
    }
    const numAmount = Number(data.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new AppError("Valid deposit amount is required", 400);
    }

    const newDeposit = await prisma.treasuryDeposit.create({
      data: {
        destinationType: data.destinationType.trim(),
        destinationName: data.destinationName.trim(),
        amount: numAmount,
      },
    });

    await auditLogService.recordAuditEvent({
      module: "Central Treasury & Ledger",
      actionType: "Treasury Deposit Logged",
      severity: "Routine",
      entityTarget: `${newDeposit.destinationName} (${newDeposit.destinationType})`,
      entityType: "TreasuryDeposit",
      entityId: newDeposit.id,
      changeSummary: `Recorded treasury liquidity deposit of ৳${newDeposit.amount.toLocaleString()} into ${newDeposit.destinationType} (${newDeposit.destinationName}).`,
      newPayload: newDeposit,
      reasonForChange: "Treasury cash management and liquidity allocation.",
    });

    return newDeposit;
  },
};