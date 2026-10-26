import { Request, Response } from "express";
import { roleService } from "../services/roleService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";

export const getAllRoles = catchAsync(async (req: Request, res: Response) => {
  const roles = await roleService.getAllRoles();
  sendResponse(res, 200, "Roles retrieved successfully", roles);
});

export const createRole = catchAsync(async (req: Request, res: Response) => {
  const newRole = await roleService.createRole(req.body);
  sendResponse(res, 201, "Role created successfully", newRole);
});

export const deleteRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await roleService.deleteRole(id);
  sendResponse(res, 200, "Role deleted successfully");
});
