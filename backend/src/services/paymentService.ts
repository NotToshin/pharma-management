import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";

const prisma = new PrismaClient();

const generateNextVoucherCode = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `AKP-EXP-${currentYear}-`;

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

  const parts = latestVoucher.voucherNo.split("-");
  const lastNumber = parseInt(parts[parts.length - 1], 10);
  const nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

const formatDate = (date?: string) => {
  if (!date) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return date;
};

export const paymentService = {
  async getNextVoucherNumber() {
    return generateNextVoucherCode();
  },

  async getAllVouchers() {
    return prisma.expenseVoucher.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async createVoucher(data: {
    voucherNo?: string;
    payeeName: string;
    category?: string;
    fundingSource?: string;
    sourceDetail?: string;
    amount: number;
    paymentDate?: string;
    notes?: string;
  }) {
    if (!data.payeeName?.trim()) {
      throw new AppError("Payee name is required", 400);
    }
    const numAmount = Number(data.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new AppError("Valid voucher amount is required", 400);
    }

    const finalVoucherNo = data.voucherNo?.trim() ? data.voucherNo : await generateNextVoucherCode();

    return prisma.expenseVoucher.create({
      data: {
        voucherNo: finalVoucherNo,
        payeeName: data.payeeName.trim(),
        category: data.category || "General Operating Expense",
        fundingSource: data.fundingSource || "Cash Safe",
        sourceDetail: data.sourceDetail || "Head Office Cash Safe",
        amount: numAmount,
        paymentDate: formatDate(data.paymentDate),
        notes: data.notes || "",
      },
    });
  },

  async updateVoucher(id: string, data: {
    voucherNo?: string;
    payeeName?: string;
    category?: string;
    fundingSource?: string;
    sourceDetail?: string;
    amount?: number;
    paymentDate?: string;
    notes?: string;
  }) {
    const existing = await prisma.expenseVoucher.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Expense voucher not found", 404);
    }

    const updateData: Record<string, any> = {};
    if (data.voucherNo !== undefined) updateData.voucherNo = data.voucherNo;
    if (data.payeeName !== undefined) updateData.payeeName = data.payeeName;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.fundingSource !== undefined) updateData.fundingSource = data.fundingSource;
    if (data.sourceDetail !== undefined) updateData.sourceDetail = data.sourceDetail;
    if (data.amount !== undefined) updateData.amount = Number(data.amount) || 0;
    if (data.paymentDate !== undefined) updateData.paymentDate = formatDate(data.paymentDate);
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.expenseVoucher.update({
      where: { id },
      data: updateData,
    });
  },

  async deleteVoucher(id: string) {
    const existing = await prisma.expenseVoucher.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Expense voucher not found", 404);
    }
    return prisma.expenseVoucher.delete({ where: { id } });
  },
};