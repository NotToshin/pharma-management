/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";
import { verifyAccessToken } from "./token";
import prisma from "../utils/prisma";

/**
 * Authentication & Authorization Middleware
 *
 * Usage:
 * - requireAuth()                          -> Any authenticated user
 * - requireAuth("SUPERADMIN")              -> Only SUPERADMIN
 * - requireAuth("SUPER_ADMIN", "RSM_EXEC") -> Any listed role
 */
export const requireAuth = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract Access Token from HttpOnly cookie or Authorization header
      const token =
        req.cookies?.accessToken ||
        (req.headers.authorization?.startsWith("Bearer ")
          ? req.headers.authorization.split(" ")[1]
          : null);

      if (!token) {
        throw new AppError("Authentication required. Access token missing.", 401);
      }

      // Verify Access Token (Throws 401 if expired or invalid)
      let decoded: { userId: string; email: string; role: string };
      try {
        decoded = verifyAccessToken(token);
      } catch (err: any) {
        if (err?.name === "TokenExpiredError") {
          throw new AppError("Access token expired. Please refresh your session.", 401);
        }
        throw new AppError("Invalid access token. Please log in again.", 401);
      }

      // Query the user's actual role and permissions from the database
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
        throw new AppError("Authenticated user account was not found.", 401);
      }

      if (user.status === "Restricted") {
        throw new AppError("Account is restricted. Contact system administration.", 403);
      }

      // If specific roles are specified, enforce authorization based on DB role
      if (allowedRoles.length > 0) {
        const userRoleCode = (user.role?.code || "").toUpperCase();
        const userRoleName = (user.role?.name || "").toUpperCase();
        const normalizedDbCode = userRoleCode.replace(/[\s_]+/g, "");
        const normalizedDbName = userRoleName.replace(/[\s_]+/g, "");

        const hasAllowedRole = allowedRoles.some((role) => {
          const upperRole = role.trim().toUpperCase();
          const normalizedAllowed = upperRole.replace(/[\s_]+/g, "");
          return (
            upperRole === userRoleCode ||
            upperRole === userRoleName ||
            normalizedAllowed === normalizedDbCode ||
            normalizedAllowed === normalizedDbName ||
            (normalizedDbCode.includes("SUPERADMIN") && normalizedAllowed.includes("SUPERADMIN")) ||
            (normalizedDbName.includes("SUPERADMIN") && normalizedAllowed.includes("SUPERADMIN"))
          );
        });

        if (!hasAllowedRole) {
          throw new AppError("Forbidden: Insufficient permissions for this resource.", 403);
        }
      }

      // Attach authenticated user to request object
      req.user = user;

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/**
 * Granular Permission Middleware
 * Enforces module-level action permission (e.g. read, create, edit, delete)
 */
export const requirePermission = (
  moduleName: string,
  action: "read" | "create" | "edit" | "delete"
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401);
      }

      // SUPER_ADMIN bypasses granular module checks
      const userRoleCode = (req.user.role?.code || "").toUpperCase();
      if (userRoleCode === "SUPER_ADMIN" || userRoleCode === "SUPERADMIN") {
        return next();
      }

      const permissions = req.user.role?.permissions || [];
      const modulePerm = permissions.find(
        (p: any) => p.module.toLowerCase() === moduleName.toLowerCase()
      );

      if (!modulePerm || !modulePerm[action]) {
        throw new AppError(
          `Forbidden: You do not have permission to ${action} ${moduleName}.`,
          403
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export default requireAuth;
