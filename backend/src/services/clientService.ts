import { Prisma, Client } from "@prisma/client";
import prisma from "../utils/prisma";
import { AppError } from "../errors";
import {
  paginationHelper,
  IPaginationOptions,
  IPaginatedResult,
} from "../utils/paginationHelper";

export interface IClientFilterOptions {
  searchTerm?: string;
  pharmacyName?: string;
  clientCode?: string;
  proprietor?: string;
  phone?: string;
  drugLicenseNo?: string;
  tradeLicenseNo?: string;
  territory?: string;
  assignedMio?: string;
  status?: string;
  [key: string]: any;
}

export const clientSearchableFields = [
  "pharmacyName",
  "clientCode",
  "proprietor",
  "phone",
  "drugLicenseNo",
  "tradeLicenseNo",
  "territory",
  "assignedMio",
  "address",
] as const;

export const clientFilterableFields = [
  "searchTerm",
  "pharmacyName",
  "clientCode",
  "proprietor",
  "phone",
  "drugLicenseNo",
  "tradeLicenseNo",
  "territory",
  "assignedMio",
  "status",
] as const;

const generateClientCode = () => `AKP-CL-${Math.floor(1000 + Math.random() * 9000)}`;

const formatDate = (date?: string | Date) => {
  if (!date) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  if (date instanceof Date) return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return date;
};

export const clientService = {
  async getAllClients(
    filters?: IClientFilterOptions,
    paginationOptions?: IPaginationOptions
  ): Promise<IPaginatedResult<Client[]>> {
    // Support calling getAllClients(paginationOptions) with a single argument
    if (
      !paginationOptions &&
      filters &&
      ("page" in filters ||
        "limit" in filters ||
        "sortBy" in filters ||
        "sortOrder" in filters)
    ) {
      paginationOptions = filters as IPaginationOptions;
      filters = {};
    }

    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper.calculatePagination(paginationOptions, {
        sortBy: "createdAt",
        sortOrder: "desc",
      });

    const { searchTerm, ...filterData } = filters || {};
    const andConditions: Prisma.ClientWhereInput[] = [];

    // Search across searchable fields
    if (searchTerm) {
      andConditions.push({
        OR: clientSearchableFields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
      });
    }

    // Specific field filters
    if (Object.keys(filterData).length > 0) {
      andConditions.push({
        AND: Object.entries(filterData).map(([field, value]) => ({
          [field]: {
            contains: String(value),
            mode: "insensitive",
          },
        })),
      });
    }

    const whereConditions: Prisma.ClientWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "pharmacyName",
      "clientCode",
      "territory",
      "creditLimitBDT",
      "outstandingBalanceBDT",
      "status",
    ];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const findArgs: Prisma.ClientFindManyArgs = {
      where: whereConditions,
      orderBy: { [safeSortBy]: sortOrder },
    };

    if (limit > 0) {
      findArgs.skip = skip;
      findArgs.take = limit;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany(findArgs),
      prisma.client.count({ where: whereConditions }),
    ]);

    const meta = paginationHelper.createPaginationMeta(total, { page, limit });

    return {
      meta,
      data: clients,
    };
  },

  async getClientById(id: string) {
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new AppError(`Client with ID '${id}' not found`, 404);
    }
    return client;
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

    let code = data.clientCode?.trim() || generateClientCode();
    // Verify clientCode uniqueness, generate new if collision
    const existingCode = await prisma.client.findUnique({ where: { clientCode: code } });
    if (existingCode) {
      if (data.clientCode) {
        throw new AppError(`Client code '${data.clientCode}' is already registered`, 400);
      }
      code = generateClientCode();
    }

    return prisma.client.create({
      data: {
        clientCode: code,
        pharmacyName: data.pharmacyName.trim(),
        proprietor: data.proprietor?.trim() || "N/A",
        phone: data.phone.trim(),
        drugLicenseNo: data.drugLicenseNo?.trim() || "N/A",
        tradeLicenseNo: data.tradeLicenseNo?.trim() || "N/A",
        address: data.address?.trim() || "N/A",
        territory: data.territory?.trim() || "Dhaka North",
        assignedMio: data.assignedMio?.trim() || "Unassigned",
        creditLimitBDT:
          data.creditLimitBDT !== undefined && data.creditLimitBDT !== null
            ? Number(data.creditLimitBDT)
            : 0,
        outstandingBalanceBDT: Number(data.outstandingBalanceBDT) || 0,
        creditTermDays: Number(data.creditTermDays) || 30,
        status: data.status || "Active / Healthy",
        lastBilledDate: formatDate(data.lastBilledDate),
      },
    });
  },

  async updateClient(
    id: string,
    data: {
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
    }
  ) {
    await this.getClientById(id);

    if (data.clientCode) {
      const existing = await prisma.client.findUnique({
        where: { clientCode: data.clientCode },
      });
      if (existing && existing.id !== id) {
        throw new AppError(`Client code '${data.clientCode}' is already taken`, 400);
      }
    }

    const updateData: Record<string, any> = {};
    if (data.clientCode !== undefined) updateData.clientCode = data.clientCode.trim();
    if (data.pharmacyName !== undefined) updateData.pharmacyName = data.pharmacyName.trim();
    if (data.proprietor !== undefined) updateData.proprietor = data.proprietor.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.drugLicenseNo !== undefined) updateData.drugLicenseNo = data.drugLicenseNo.trim();
    if (data.tradeLicenseNo !== undefined) updateData.tradeLicenseNo = data.tradeLicenseNo.trim();
    if (data.address !== undefined) updateData.address = data.address.trim();
    if (data.territory !== undefined) updateData.territory = data.territory.trim();
    if (data.assignedMio !== undefined) updateData.assignedMio = data.assignedMio.trim();
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
    await this.getClientById(id);
    return prisma.client.delete({ where: { id } });
  },

  async bulkImportClients(data: {
    clients: Array<{
      clientCode?: string;
      pharmacyName: string;
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
    }>;
    updateExisting?: boolean;
  }) {
    if (!Array.isArray(data.clients) || data.clients.length === 0) {
      throw new AppError("No pharmacy clients provided for import", 400);
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const skippedCodes: string[] = [];
    const errors: string[] = [];

    for (const item of data.clients) {
      const pharmacyName = item.pharmacyName?.trim();
      if (!pharmacyName) {
        skippedCount++;
        errors.push(`Row missing required Pharmacy Name`);
        continue;
      }

      const phone = item.phone?.trim() || "+880 1700-000000";
      const proprietor = item.proprietor?.trim() || "N/A";
      const drugLicenseNo = item.drugLicenseNo?.trim() || "N/A";
      const tradeLicenseNo = item.tradeLicenseNo?.trim() || "N/A";
      const address = item.address?.trim() || "N/A";
      const territory = item.territory?.trim() || "Dhaka North";
      const assignedMio = item.assignedMio?.trim() || "Unassigned";
      const creditLimitBDT =
        item.creditLimitBDT !== undefined && item.creditLimitBDT !== null
          ? Number(item.creditLimitBDT)
          : 0;
      const outstandingBalanceBDT = Number(item.outstandingBalanceBDT) || 0;
      const creditTermDays = Number(item.creditTermDays) || 30;
      const status = item.status?.trim() || "Active / Healthy";
      const lastBilledDate = formatDate(item.lastBilledDate);

      // Check if existing client matches by drugLicenseNo, clientCode, or identical pharmacyName & phone
      let existing: Client | null = null;

      if (item.clientCode?.trim()) {
        existing = await prisma.client.findUnique({
          where: { clientCode: item.clientCode.trim() },
        });
      }

      if (!existing && drugLicenseNo !== "N/A" && drugLicenseNo.length > 2) {
        existing = await prisma.client.findFirst({
          where: { drugLicenseNo },
        });
      }

      if (!existing && pharmacyName && phone !== "+880 1700-000000") {
        existing = await prisma.client.findFirst({
          where: {
            pharmacyName: { equals: pharmacyName, mode: "insensitive" },
            phone: { equals: phone },
          },
        });
      }

      if (existing) {
        if (data.updateExisting) {
          await prisma.client.update({
            where: { id: existing.id },
            data: {
              pharmacyName,
              proprietor,
              phone,
              drugLicenseNo,
              tradeLicenseNo,
              address,
              territory,
              assignedMio,
              creditLimitBDT,
              outstandingBalanceBDT,
              creditTermDays,
              status,
              lastBilledDate,
            },
          });
          updatedCount++;
        } else {
          skippedCount++;
          skippedCodes.push(existing.clientCode);
        }
      } else {
        let finalCode = item.clientCode?.trim() || generateClientCode();
        // Ensure generated code uniqueness
        const codeTaken = await prisma.client.findUnique({ where: { clientCode: finalCode } });
        if (codeTaken) {
          finalCode = generateClientCode();
        }

        await prisma.client.create({
          data: {
            clientCode: finalCode,
            pharmacyName,
            proprietor,
            phone,
            drugLicenseNo,
            tradeLicenseNo,
            address,
            territory,
            assignedMio,
            creditLimitBDT,
            outstandingBalanceBDT,
            creditTermDays,
            status,
            lastBilledDate,
          },
        });
        createdCount++;
      }
    }

    return {
      totalProcessed: data.clients.length,
      createdCount,
      updatedCount,
      skippedCount,
      skippedCodes,
      errors,
    };
  },
};