import { Request, Response } from "express";
import { PrismaClient, StaffStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const staffList = await prisma.staff.findMany({
      include: {
        role: true,
        salaries: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(staffList);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      empId,
      fullName,
      phone,
      email,
      nidNumber,
      fathersName,
      mothersName,
      address,
      department,
      designation,
      employmentStatus,
      supervisor,
      salary,
    } = req.body;

    let defaultRole = await prisma.role.findFirst({
      where: { name: designation || department || "General Staff" }
    });
    
    if (!defaultRole) {
      defaultRole = await prisma.role.create({
        data: {
          name: designation || department || "General Staff",
          permissions: ["VIEW_DASHBOARD"],
        },
      });
    }

    const numericSalary = Number(salary) || 20000;
    
    // Map frontend status cleanly to Prisma enum
    let dbStatus: StaffStatus = StaffStatus.ACTIVE;
    if (employmentStatus === "Probationary") dbStatus = StaffStatus.PROBATION;
    else if (employmentStatus === "On Leave") dbStatus = StaffStatus.ON_LEAVE;
    else if (employmentStatus === "Suspended") dbStatus = StaffStatus.SUSPENDED;

    const newStaff = await prisma.staff.create({
      data: {
        empId,
        fullName,
        phone,
        email: email || null,
        nidNumber: nidNumber || "N/A",
        fathersName: fathersName || "N/A",
        mothersName: mothersName || "N/A",
        address: address || "N/A",
        department: department || "General",
        supervisor: supervisor || "Toshin Bin Azad (Head of HR)",
        status: dbStatus,
        territory: "Dhaka",
        role: {
          connect: { id: defaultRole.id },
        },
        salaries: {
          create: {
            payPeriod: "September 2026",
            baseSalary: numericSalary,
            houseRent: numericSalary * 0.5,
            medicalAllowance: 3500,
            conveyanceTaDa: 15000,
            netPay: numericSalary,
            effectiveDate: new Date(),
          },
        },
      },
      include: {
        role: true,
        salaries: true,
      },
    });

    res.status(201).json(newStaff);
  } catch (error: any) {
    console.error("Error creating staff:", error);
    res.status(400).json({ error: error.message || "Failed to onboard staff." });
  }
};

export const updateStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      fullName,
      phone,
      email,
      nidNumber,
      fathersName,
      mothersName,
      address,
      department,
      designation,
      employmentStatus,
      supervisor,
      status,
    } = req.body;

    // Map incoming status accurately
    let resolvedStatus: StaffStatus = StaffStatus.ACTIVE;
    const inputStatus = status || employmentStatus;
    
    if (inputStatus === "Probationary" || inputStatus === "PROBATION") {
      resolvedStatus = StaffStatus.PROBATION;
    } else if (inputStatus === "On Leave" || inputStatus === "ON_LEAVE") {
      resolvedStatus = StaffStatus.ON_LEAVE;
    } else if (inputStatus === "Suspended" || inputStatus === "SUSPENDED") {
      resolvedStatus = StaffStatus.SUSPENDED;
    } else {
      resolvedStatus = StaffStatus.ACTIVE;
    }

    let roleConnect = undefined;
    if (designation) {
      let foundRole = await prisma.role.findFirst({ where: { name: designation } });
      if (!foundRole) {
        foundRole = await prisma.role.create({ data: { name: designation, permissions: ["VIEW_DASHBOARD"] } });
      }
      roleConnect = { connect: { id: foundRole.id } };
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
        fullName,
        phone,
        email: email || null,
        nidNumber,
        fathersName,
        mothersName,
        address,
        department,
        supervisor: supervisor || null,
        status: resolvedStatus,
        ...(roleConnect ? { role: roleConnect } : {}),
      },
      include: {
        role: true,
        salaries: true,
      },
    });

    res.status(200).json(updatedStaff);
  } catch (error: any) {
    console.error("Error updating staff:", error);
    res.status(400).json({ error: error.message || "Failed to update staff record" });
  }
};

export const deleteStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.staff.delete({ where: { id } });
    res.status(200).json({ message: "Staff deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff:", error);
    res.status(500).json({ error: "Failed to delete staff member" });
  }
};