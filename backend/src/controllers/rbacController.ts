import { Request, Response } from "express";
import { rbacService } from "../services/rbacService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from "../middlewares/token";

export const getRoles = catchAsync(async (req: Request, res: Response) => {
  const roles = await rbacService.getRoles();
  sendResponse(res, 200, "Roles retrieved successfully", roles);
});

export const createRole = catchAsync(async (req: Request, res: Response) => {
  const { name, code, description } = req.body;
  const newRole = await rbacService.createRole({ name, code, description });
  sendResponse(res, 201, "Role created successfully", newRole);
});

export const updateRolePermissions = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!Array.isArray(permissions)) {
    return sendResponse(res, 400, "Permissions array required");
  }

  const result = await rbacService.updateRolePermissions(id, permissions);
  sendResponse(res, 200, "Role permissions saved successfully", result);
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await rbacService.getUsers();
  sendResponse(res, 200, "Users retrieved successfully", users);
});

export const provisionUser = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, roleCode, territory } = req.body;

  if (!name || !email || !password || !roleCode) {
    return sendResponse(res, 400, "Name, email, password, and role are required.");
  }

  const newUser = await rbacService.provisionUser({ name, email, password, roleCode, territory });
  sendResponse(res, 201, "Operator account provisioned successfully", newUser);
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedUser = await rbacService.updateUser(id, req.body);
  sendResponse(res, 200, "Operator credentials and role updated successfully", updatedUser);
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await rbacService.deleteUser(id);
  sendResponse(res, 200, result.message);
});

export const toggleUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await rbacService.toggleUserStatus(id);
  sendResponse(res, 200, "User status updated successfully", result);
});

export const loginOperator = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendResponse(res, 400, "Email and password are required.");
  }

  const result = await rbacService.loginOperator(email, password);

  // Set tokens as HttpOnly cookies
  res.cookie("accessToken", result.token, getAccessTokenCookieOptions());

  sendResponse(res, 200, "Login successful", result);
});