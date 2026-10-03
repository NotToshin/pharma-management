import { Request, Response } from "express";
import { clientService } from "../services/clientService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getAllClients = catchAsync(async (req: Request, res: Response) => {
  const clients = await clientService.getAllClients();
  sendResponse(res, 200, "Clients retrieved successfully", clients);
});

export const createClient = catchAsync(async (req: Request, res: Response) => {
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

  const newClient = await clientService.createClient({
    clientCode,
    pharmacyName,
    proprietor,
    phone,
    drugLicenseNo,
    tradeLicenseNo,
    address,
    territory,
    assignedMio,
    creditLimitBDT: Number(creditLimitBDT) || 150000,
    outstandingBalanceBDT: Number(outstandingBalanceBDT) || 0,
    creditTermDays: Number(creditTermDays) || 30,
    status,
    lastBilledDate,
  });

  sendResponse(res, 201, "Client created successfully", newClient);
});

export const updateClient = catchAsync(async (req: Request, res: Response) => {
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

  const updatedClient = await clientService.updateClient(id, {
    clientCode,
    pharmacyName,
    proprietor,
    phone,
    drugLicenseNo,
    tradeLicenseNo,
    address,
    territory,
    assignedMio,
    creditLimitBDT: creditLimitBDT !== undefined ? Number(creditLimitBDT) : undefined,
    outstandingBalanceBDT: outstandingBalanceBDT !== undefined ? Number(outstandingBalanceBDT) : undefined,
    creditTermDays: creditTermDays !== undefined ? Number(creditTermDays) : undefined,
    status,
    lastBilledDate,
  });

  sendResponse(res, 200, "Client updated successfully", updatedClient);
});

export const deleteClient = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await clientService.deleteClient(id);
  sendResponse(res, 200, "Client deleted successfully");
});