import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AppError } from "../errors";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  compareTokenHash,
} from "../middlewares/token";
import prisma from "../utils/prisma";

export const authService = {
  async login(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.systemUser.findUnique({
      where: {
        email: cleanEmail,
      },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("Invalid credentials. Please verify your email and password.", 401);
    }

    if (user.status === "Restricted") {
      throw new AppError("This account is restricted. Contact system administration.", 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid credentials. Please verify your email and password.", 401);
    }

    // Generate Access & Refresh tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.code,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenId: crypto.randomUUID(),
    });

    // Hash the refresh token and store in DB
    const refreshTokenHash = hashToken(refreshToken);

    const nowStr = new Date()
      .toLocaleString("en-GB", {
        timeZone: "Asia/Dhaka",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(/am|pm/i, (m) => m.toUpperCase());

    await prisma.systemUser.update({
      where: { id: user.id },
      data: {
        refreshTokenHash,
        lastLogin: nowStr,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.code,
        roleName: user.role.name,
        territory: user.territory,
        status: user.status,
        permissions: user.role.permissions,
      },
    };
  },

  async refreshToken(incomingRefreshToken: string) {
    if (!incomingRefreshToken) {
      throw new AppError("Refresh token is required.", 401);
    }

    let decoded: { userId: string; tokenId: string };
    try {
      decoded = verifyRefreshToken(incomingRefreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token. Please log in again.", 401);
    }

    const user = await prisma.systemUser.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("User account not found.", 401);
    }

    if (user.status === "Restricted") {
      throw new AppError("User account is restricted.", 403);
    }

    if (!user.refreshTokenHash) {
      throw new AppError("Session expired or logged out. Please log in again.", 401);
    }

    const isMatch = compareTokenHash(incomingRefreshToken, user.refreshTokenHash);
    if (!isMatch) {
      // Possible token reuse or tampering - revoke existing token family
      await prisma.systemUser.update({
        where: { id: user.id },
        data: { refreshTokenHash: null },
      });
      throw new AppError("Invalid refresh token. Session invalidated for security.", 401);
    }

    // Refresh token rotation: issue new access token AND new refresh token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.code,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      tokenId: crypto.randomUUID(),
    });

    const newRefreshTokenHash = hashToken(newRefreshToken);

    await prisma.systemUser.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: newRefreshTokenHash,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.code,
        roleName: user.role.name,
        territory: user.territory,
        status: user.status,
        permissions: user.role.permissions,
      },
    };
  },

  // Alias for backward compatibility
  async rotateRefreshToken(incomingRefreshToken: string) {
    return this.refreshToken(incomingRefreshToken);
  },

  async logout(incomingRefreshToken?: string) {
    if (incomingRefreshToken) {
      try {
        const decoded = verifyRefreshToken(incomingRefreshToken);
        await prisma.systemUser.update({
          where: { id: decoded.userId },
          data: { refreshTokenHash: null },
        });
      } catch {
        // Token was invalid or already expired; nothing further needed in DB
      }
    }
    return { message: "Logout successful" };
  },
};
