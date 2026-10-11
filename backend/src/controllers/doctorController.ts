import { Request, Response } from "express";
import {
  doctorService,
  doctorFilterableFields,
} from "../services/doctorService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";
import { pick } from "../utils/pick";
import { paginationFields } from "../utils/paginationHelper";

export const getAllDoctors = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, doctorFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);

  const result = await doctorService.getAllDoctors(
    filters as any,
    paginationOptions as any
  );
  sendResponse(
    res,
    200,
    "Doctors retrieved successfully",
    result.data,
    result.meta
  );
});

export const getDoctorById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const doctor = await doctorService.getDoctorById(id);
  sendResponse(res, 200, "Doctor retrieved successfully", doctor);
});

export const createDoctor = catchAsync(async (req: Request, res: Response) => {
  const newDoctor = await doctorService.createDoctor(req.body);
  sendResponse(res, 201, "Doctor created successfully", newDoctor);
});

export const updateDoctor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedDoctor = await doctorService.updateDoctor(id, req.body);
  sendResponse(res, 200, "Doctor updated successfully", updatedDoctor);
});

export const deleteDoctor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await doctorService.deleteDoctor(id);
  sendResponse(res, 200, "Doctor deleted successfully");
});

export const bulkImportDoctors = catchAsync(async (req: Request, res: Response) => {
  const result = await doctorService.bulkImportDoctors(req.body);
  sendResponse(res, 201, "Doctors imported successfully", result);
});