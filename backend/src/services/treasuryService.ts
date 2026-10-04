import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";

const prisma = new PrismaClient();

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

    return prisma.treasuryDeposit.create({
      data: {
        destinationType: data.destinationType.trim(),
        destinationName: data.destinationName.trim(),
        amount: numAmount,
      },
    });
  },
};