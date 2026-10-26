import { Request, Response } from "express";
import {
  clientService,
  clientFilterableFields,
} from "../services/clientService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";
import { pick } from "../utils/pick";
import { paginationFields } from "../utils/paginationHelper";

export const getAllClients = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, clientFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);

  const result = await clientService.getAllClients(
    filters as any,
    paginationOptions as any
  );
  sendResponse(
    res,
    200,
    "Clients retrieved successfully",
    result.data,
    result.meta
  );
});

export const getClientById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const client = await clientService.getClientById(id);
  sendResponse(res, 200, "Client retrieved successfully", client);
});

export const createClient = catchAsync(async (req: Request, res: Response) => {
  const newClient = await clientService.createClient(req.body);
  sendResponse(res, 201, "Client created successfully", newClient);
});

export const updateClient = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedClient = await clientService.updateClient(id, req.body);
  sendResponse(res, 200, "Client updated successfully", updatedClient);
});

export const deleteClient = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await clientService.deleteClient(id);
  sendResponse(res, 200, "Client deleted successfully");
});

export const bulkImportClients = catchAsync(async (req: Request, res: Response) => {
  const result = await clientService.bulkImportClients(req.body);
  sendResponse(res, 201, "Clients imported successfully", result);
});