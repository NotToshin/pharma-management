import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllTreasuryDeposits = async (req: Request, res: Response): Promise<void> => {
  try {
    const deposits = await prisma.treasuryDeposit.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(deposits);
  } catch (error) {
    console.error("Error fetching treasury deposits:", error);
    res.status(500).json({ error: "Failed to fetch deposits" });
  }
};

export const postTreasuryDeposit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { destinationType, destinationName, amount } = req.body;

    const depositRecord = await prisma.treasuryDeposit.create({
      data: {
        destinationType,
        destinationName,
        amount: Number(amount) || 0,
      },
    });

    res.status(201).json(depositRecord);
  } catch (error: any) {
    console.error("Error posting treasury deposit:", error);
    res.status(400).json({ error: error.message || "Failed to post treasury deposit." });
  }
};
