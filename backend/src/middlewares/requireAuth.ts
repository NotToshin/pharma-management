import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../errors";
import { verifyAccessToken } from "./token";

const prisma = new PrismaClient();

/**
 * Authentication & Authorization Middleware
 *
 * Usage:
 * - requireAuth()                          -> Any authenticated user
 * - requireAuth("SUPERADMIN")              -> Only SUPERADMIN
 * - requireAuth("SUPERADMIN", "OTHER_ROLE") -> Any listed role
 *
 * Rules:
 * - Uses ONLY the Access Token.
 * - If expired or invalid, throws 401 (so frontend can invoke /refresh-token).
 * - Never automatically refreshes tokens inside this middleware.
 * - Authorization fetches the user's actual role live from the database.
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
        const normalizedDbCode = userRoleCode.replace(/_/g, ""); // "SUPER_ADMIN" -> "SUPERADMIN"

        const hasAllowedRole = allowedRoles.some((role) => {
          const upperRole = role.trim().toUpperCase();
          const normalizedAllowed = upperRole.replace(/_/g, "");
          return (
            upperRole === userRoleCode ||
            upperRole === userRoleName ||
            normalizedAllowed === normalizedDbCode
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

export default requireAuth;
