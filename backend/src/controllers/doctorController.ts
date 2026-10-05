import { Request, Response } from "express";
import { doctorService } from "../services/doctorService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getAllDoctors = catchAsync(async (req: Request, res: Response) => {
  const doctors = await doctorService.getAllDoctors();
  sendResponse(res, 200, "Doctors retrieved successfully", doctors);
});

export const getDoctorById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const doctor = await doctorService.getDoctorById(id);
  sendResponse(res, 200, "Doctor retrieved successfully", doctor);
});

export const createDoctor = catchAsync(async (req: Request, res: Response) => {
  const { doctorName, phone, bmdcRegNumber, specialtyAndInstitute, chamber, territoryAndMio, email, tier, patientVolumeDaily } = req.body;

  const newDoctor = await doctorService.createDoctor({
    doctorName,
    phone,
    bmdcRegNumber,
    specialtyAndInstitute,
    chamber,
    territoryAndMio,
    email,
    tier,
    patientVolumeDaily: Number(patientVolumeDaily) || 30,
  });

  sendResponse(res, 201, "Doctor created successfully", newDoctor);
});

export const updateDoctor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { doctorName, phone, bmdcRegNumber, specialtyAndInstitute, chamber, territoryAndMio, email, tier, patientVolumeDaily } = req.body;

  const updatedDoctor = await doctorService.updateDoctor(id, {
    doctorName,
    phone,
    bmdcRegNumber,
    specialtyAndInstitute,
    chamber,
    territoryAndMio,
    email,
    tier,
    patientVolumeDaily: patientVolumeDaily !== undefined ? Number(patientVolumeDaily) || 30 : undefined,
  });

  sendResponse(res, 200, "Doctor updated successfully", updatedDoctor);
});

export const deleteDoctor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await doctorService.deleteDoctor(id);
  sendResponse(res, 200, "Doctor deleted successfully");
});