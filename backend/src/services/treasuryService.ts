import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const treasuryService = {
  async getAllDeposits() {
    return prisma.treasuryDeposit.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async createDeposit(data: { destinationType: string; destinationName: string; amount: number }) {
    return prisma.treasuryDeposit.create({
      data: {
        destinationType: data.destinationType,
        destinationName: data.destinationName,
        amount: data.amount,
      },
    });
  },
};