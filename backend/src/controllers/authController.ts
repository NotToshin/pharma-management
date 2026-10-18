import { Request, Response } from "express";
import { authService } from "../services/authService";
import { sendResponse } from "../utils/response";
import { catchAsync } from "../utils/catchAsync";
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
} from "../middlewares/token";

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  // Set tokens strictly as cross-origin HttpOnly cookies
  res.cookie("accessToken", result.accessToken, getAccessTokenCookieOptions());
  res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions());

  sendResponse(res, 200, "Login successful", {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  const result = await authService.refreshToken(incomingRefreshToken);

  // Rotate tokens: set new access and refresh token strictly in HttpOnly cookies
  res.cookie("accessToken", result.accessToken, getAccessTokenCookieOptions());
  res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions());

  sendResponse(res, 200, "Token refreshed successfully", {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  await authService.logout(incomingRefreshToken);

  // Clear authentication cookies
  res.clearCookie("accessToken", getClearCookieOptions());
  res.clearCookie("refreshToken", getClearCookieOptions());

  sendResponse(res, 200, "Logout successful");
});
