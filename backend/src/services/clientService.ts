import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";

const prisma = new PrismaClient();

const generateClientCode = () => `AKP-CL-${Math.floor(1000 + Math.random() * 9000)}`;

const formatDate = (date?: string | Date) => {
  if (!date) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  if (date instanceof Date) return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return date;
};

export const clientService = {
  async getAllClients() {
    return prisma.client.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async createClient(data: {
    clientCode?: string;
    pharmacyName: string;
    proprietor?: string;
    phone: string;
    drugLicenseNo?: string;
    tradeLicenseNo?: string;
    address?: string;
    territory?: string;
    assignedMio?: string;
    creditLimitBDT?: number;
    outstandingBalanceBDT?: number;
    creditTermDays?: number;
    status?: string;
    lastBilledDate?: string;
  }) {
    if (!data.pharmacyName?.trim()) {
      throw new AppError("Pharmacy name is required", 400);
    }
    if (!data.phone?.trim()) {
      throw new AppError("Phone number is required", 400);
    }

    return prisma.client.create({
      data: {
        clientCode: data.clientCode || generateClientCode(),
        pharmacyName: data.pharmacyName.trim(),
        proprietor: data.proprietor?.trim() || "N/A",
        phone: data.phone.trim(),
        drugLicenseNo: data.drugLicenseNo?.trim() || "N/A",
        tradeLicenseNo: data.tradeLicenseNo?.trim() || "N/A",
        address: data.address?.trim() || "N/A",
        territory: data.territory || "Dhaka North",
        assignedMio: data.assignedMio || "Unassigned",
        creditLimitBDT: Number(data.creditLimitBDT) || 150000,
        outstandingBalanceBDT: Number(data.outstandingBalanceBDT) || 0,
        creditTermDays: Number(data.creditTermDays) || 30,
        status: data.status || "Active / Healthy",
        lastBilledDate: formatDate(data.lastBilledDate),
      },
    });
  },

  async updateClient(id: string, data: {
    clientCode?: string;
    pharmacyName?: string;
    proprietor?: string;
    phone?: string;
    drugLicenseNo?: string;
    tradeLicenseNo?: string;
    address?: string;
    territory?: string;
    assignedMio?: string;
    creditLimitBDT?: number;
    outstandingBalanceBDT?: number;
    creditTermDays?: number;
    status?: string;
    lastBilledDate?: string;
  }) {
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Client not found", 404);
    }

    const updateData: Record<string, any> = {};
    if (data.clientCode !== undefined) updateData.clientCode = data.clientCode;
    if (data.pharmacyName !== undefined) updateData.pharmacyName = data.pharmacyName;
    if (data.proprietor !== undefined) updateData.proprietor = data.proprietor;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.drugLicenseNo !== undefined) updateData.drugLicenseNo = data.drugLicenseNo;
    if (data.tradeLicenseNo !== undefined) updateData.tradeLicenseNo = data.tradeLicenseNo;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.territory !== undefined) updateData.territory = data.territory;
    if (data.assignedMio !== undefined) updateData.assignedMio = data.assignedMio;
    if (data.creditLimitBDT !== undefined) updateData.creditLimitBDT = Number(data.creditLimitBDT);
    if (data.outstandingBalanceBDT !== undefined) updateData.outstandingBalanceBDT = Number(data.outstandingBalanceBDT);
    if (data.creditTermDays !== undefined) updateData.creditTermDays = Number(data.creditTermDays);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.lastBilledDate !== undefined) updateData.lastBilledDate = formatDate(data.lastBilledDate);

    return prisma.client.update({
      where: { id },
      data: updateData,
    });
  },

  async deleteClient(id: string) {
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Client not found", 404);
    }
    return prisma.client.delete({ where: { id } });
  },
};