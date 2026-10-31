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
import { auditLogService } from "./auditLogService";

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

    await auditLogService.recordAuditEvent({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role.name || user.role.code,
      module: "RBAC Security",
      actionType: "Operator Authenticated",
      severity: "Routine",
      entityTarget: `${user.name} (${user.email})`,
      entityType: "SystemUser",
      entityId: user.id,
      changeSummary: `Operator '${user.name}' (${user.role.name || user.role.code}) signed in to system successfully.`,
      newPayload: { userId: user.id, email: user.email, role: user.role.code, lastLogin: nowStr },
      reasonForChange: "Session authorization and cryptographic token issuance.",
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

  async refreshToken(incomingRefreshToken: string | string[]) {
    const tokens = [...new Set(
      (Array.isArray(incomingRefreshToken) ? incomingRefreshToken : [incomingRefreshToken])
        .filter((token): token is string => typeof token === "string" && token.split(".").length === 3)
    )];

    if (tokens.length === 0) {
      throw new AppError("Refresh token is required.", 401);
    }

    for (const candidate of tokens) {
      let decoded: { userId: string; tokenId: string };
      try {
        decoded = verifyRefreshToken(candidate);
      } catch {
        continue;
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

      if (!user) continue;

      if (user.status === "Restricted") {
        throw new AppError("User account is restricted.", 403);
      }

      if (!user.refreshTokenHash) {
        throw new AppError("Session expired or logged out. Please log in again.", 401);
      }

      const isMatch = compareTokenHash(candidate, user.refreshTokenHash);
      if (!isMatch) {
        // A parallel refresh may already have rotated this token. Try the other copy
        // without destroying the active session.
        continue;
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
    }

    throw new AppError("Invalid or expired refresh token. Please log in again.", 401);
  },

  // Alias for backward compatibility
  async rotateRefreshToken(incomingRefreshToken: string) {
    return this.refreshToken(incomingRefreshToken);
  },

  async logout(incomingRefreshToken?: string) {
    if (incomingRefreshToken) {
      try {
        const decoded = verifyRefreshToken(incomingRefreshToken);
        const user = await prisma.systemUser.findUnique({
          where: { id: decoded.userId },
          include: { role: true },
        });

        await prisma.systemUser.update({
          where: { id: decoded.userId },
          data: { refreshTokenHash: null },
        });

        if (user) {
          await auditLogService.recordAuditEvent({
            actorId: user.id,
            actorName: user.name,
            actorEmail: user.email,
            actorRole: user.role?.name || user.role?.code,
            module: "RBAC Security",
            actionType: "Operator Session Terminated",
            severity: "Routine",
            entityTarget: `${user.name} (${user.email})`,
            entityType: "SystemUser",
            entityId: user.id,
            changeSummary: `Operator '${user.name}' signed out and revoked active refresh credentials.`,
            reasonForChange: "Explicit user session revocation.",
          });
        }
      } catch {
        // Token was invalid or already expired; nothing further needed in DB
      }
    }
    return { message: "Logout successful" };
  },
};
