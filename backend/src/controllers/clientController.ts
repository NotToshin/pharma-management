import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      clientCode,
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
    } = req.body;

    const newClient = await prisma.client.create({
      data: {
        clientCode: clientCode || `AKP-CL-${Math.floor(1000 + Math.random() * 9000)}`,
        pharmacyName,
        proprietor: proprietor || "N/A",
        phone,
        drugLicenseNo: drugLicenseNo || "N/A",
        tradeLicenseNo: tradeLicenseNo || "N/A",
        address: address || "N/A",
        territory: territory || "Dhaka North",
        assignedMio: assignedMio || "Unassigned",
        creditLimitBDT: Number(creditLimitBDT) || 150000,
        outstandingBalanceBDT: Number(outstandingBalanceBDT) || 0,
        creditTermDays: Number(creditTermDays) || 30,
        status: status || "Active / Healthy",
        lastBilledDate: lastBilledDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      },
    });

    res.status(201).json(newClient);
  } catch (error: any) {
    console.error("Error creating client:", error);
    res.status(400).json({ error: error.message || "Failed to create client." });
  }
};

export const updateClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      clientCode,
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
    } = req.body;

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        clientCode,
        pharmacyName,
        proprietor,
        phone,
        drugLicenseNo,
        tradeLicenseNo,
        address,
        territory,
        assignedMio,
        creditLimitBDT: Number(creditLimitBDT),
        outstandingBalanceBDT: Number(outstandingBalanceBDT),
        creditTermDays: Number(creditTermDays),
        status,
        lastBilledDate,
      },
    });

    res.status(200).json(updatedClient);
  } catch (error: any) {
    console.error("Error updating client:", error);
    res.status(400).json({ error: error.message || "Failed to update client record" });
  }
};

export const deleteClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.client.delete({ where: { id } });
    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Failed to delete client record" });
  }
};