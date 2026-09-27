import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to calculate the next sequential voucher code
export const generateNextVoucherCode = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `AKP-EXP-${currentYear}-`;

  // Fetch the latest voucher created for this year
  const latestVoucher = await prisma.expenseVoucher.findFirst({
    where: {
      voucherNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!latestVoucher) {
    return `${prefix}0001`;
  }

  // Extract the trailing digits, increment by 1, and pad with zeroes
  const parts = latestVoucher.voucherNo.split("-");
  const lastNumber = parseInt(parts[parts.length - 1], 10);
  const nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

// GET /api/payments/next-number (Returns next available serial number)
export const getNextVoucherNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const nextCode = await generateNextVoucherCode();
    res.status(200).json({ nextVoucherNo: nextCode });
  } catch (error) {
    console.error("Error generating next voucher code:", error);
    res.status(500).json({ error: "Failed to generate serial voucher number" });
  }
};

// GET /api/payments
export const getAllVouchers = async (req: Request, res: Response): Promise<void> => {
  try {
    const vouchers = await prisma.expenseVoucher.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(vouchers);
  } catch (error) {
    console.error("Error fetching payment vouchers:", error);
    res.status(500).json({ error: "Failed to fetch payment vouchers" });
  }
};

// POST /api/payments
export const createVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      voucherNo,
      payeeName,
      category,
      fundingSource,
      sourceDetail,
      amount,
      paymentDate,
      notes,
    } = req.body;

    // Use user-provided code or compute the next strict sequential number
    const finalVoucherNo = voucherNo?.trim() ? voucherNo : await generateNextVoucherCode();

    const newVoucher = await prisma.expenseVoucher.create({
      data: {
        voucherNo: finalVoucherNo,
        payeeName,
        category: category || "General Operating Expense",
        fundingSource: fundingSource || "Cash Safe",
        sourceDetail: sourceDetail || "Head Office Cash Safe",
        amount: Number(amount) || 0,
        paymentDate: paymentDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        notes: notes || "",
      },
    });

    res.status(201).json(newVoucher);
  } catch (error: any) {
    console.error("Error creating payment voucher:", error);
    res.status(400).json({ error: error.message || "Failed to create payment voucher" });
  }
};

// PUT /api/payments/:id
export const updateVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      voucherNo,
      payeeName,
      category,
      fundingSource,
      sourceDetail,
      amount,
      paymentDate,
      notes,
    } = req.body;

    const updated = await prisma.expenseVoucher.update({
      where: { id },
      data: {
        voucherNo,
        payeeName,
        category,
        fundingSource,
        sourceDetail,
        amount: Number(amount) || 0,
        paymentDate,
        notes,
      },
    });

    res.status(200).json(updated);
  } catch (error: any) {
    console.error("Error updating payment voucher:", error);
    res.status(400).json({ error: error.message || "Failed to update payment voucher" });
  }
};

// DELETE /api/payments/:id
export const deleteVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.expenseVoucher.delete({ where: { id } });
    res.status(200).json({ message: "Voucher deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment voucher:", error);
    res.status(500).json({ error: "Failed to delete payment voucher" });
  }
};