import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all doctors
export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const doctors = await prisma.doctor.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: doctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ success: false, error: "Failed to fetch doctors" });
  }
};

// Create a new doctor
export const createDoctor = async (req: Request, res: Response) => {
  try {
    const { doctorName, phone, bmdcRegNumber, specialtyAndInstitute, chamber, territoryAndMio, email, tier, patientVolumeDaily } = req.body;
    
    const newDoctor = await prisma.doctor.create({
      data: {
        doctorName,
        phone,
        bmdcRegNumber,
        specialtyAndInstitute,
        chamber,
        territoryAndMio,
        email,
        tier,
        patientVolumeDaily: Number(patientVolumeDaily) || 30,
      },
    });

    res.status(201).json({ success: true, doctor: newDoctor });
  } catch (error: any) {
    console.error("Error creating doctor:", error);
    res.status(400).json({ success: false, error: error.message || "Invalid payload format" });
  }
};

// Update an existing doctor
export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { doctorName, phone, bmdcRegNumber, specialtyAndInstitute, chamber, territoryAndMio, email, tier, patientVolumeDaily } = req.body;

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        doctorName,
        phone,
        bmdcRegNumber,
        specialtyAndInstitute,
        chamber,
        territoryAndMio,
        email,
        tier,
        patientVolumeDaily: Number(patientVolumeDaily) || 30,
      },
    });

    res.json({ success: true, doctor: updatedDoctor });
  } catch (error: any) {
    console.error("Error updating doctor:", error);
    res.status(400).json({ success: false, error: error.message || "Failed to update doctor" });
  }
};

// Delete a doctor
export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.doctor.delete({
      where: { id },
    });
    res.json({ success: true, message: `Doctor ${id} deleted successfully.` });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(404).json({ success: false, error: "Doctor not found" });
  }
};