import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";
import { verifyAccessToken } from "./token";
import { requestContextStorage, ActorContext } from "../utils/requestContext";

export const actorContextMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    const ipAddress = rawIp === "::1" || rawIp === "::ffff:127.0.0.1" ? "127.0.0.1" : rawIp;
    const userAgent = (req.headers["user-agent"] as string) || "Mozilla/5.0";

    const actor: ActorContext = {
      ipAddress,
      userAgent,
    };

    // 1. Check custom headers passed from client
    if (req.headers["x-user-email"]) {
      actor.email = (req.headers["x-user-email"] as string).trim().toLowerCase();
    }
    if (req.headers["x-user-name"]) {
      actor.name = (req.headers["x-user-name"] as string).trim();
    }
    if (req.headers["x-user-role"]) {
      actor.role = (req.headers["x-user-role"] as string).trim();
    }

    // 2. Check token from cookie or Authorization header
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        if (decoded?.userId) {
          actor.userId = decoded.userId;
          if (decoded.email) actor.email = decoded.email.trim().toLowerCase();
          if (decoded.role) actor.role = decoded.role;

          // Lookup full user name & role from database
          const user = await prisma.systemUser.findUnique({
            where: { id: decoded.userId },
            include: { role: true },
          });

          if (user) {
            actor.userId = user.id;
            actor.name = user.name;
            actor.email = user.email.toLowerCase();
            actor.role = user.role?.name || user.role?.code || actor.role;
            (req as any).user = user;
          }
        }
      } catch {
        // Fallback: unverified decode if token is expired but present
        try {
          const rawDecoded = jwt.decode(token) as any;
          if (rawDecoded?.email) {
            actor.email = actor.email || rawDecoded.email.trim().toLowerCase();
            actor.userId = actor.userId || rawDecoded.userId;
            actor.role = actor.role || rawDecoded.role;
          }
        } catch {
          // Token decode failed, retain headers
        }
      }
    }

    // 3. If actor email exists but name/role is missing, look up user by email
    if (actor.email && (!actor.name || !actor.role)) {
      try {
        const userByEmail = await prisma.systemUser.findUnique({
          where: { email: actor.email.toLowerCase() },
          include: { role: true },
        });
        if (userByEmail) {
          actor.userId = actor.userId || userByEmail.id;
          actor.name = actor.name || userByEmail.name;
          actor.role = actor.role || userByEmail.role?.name || userByEmail.role?.code;
          if (!(req as any).user) {
            (req as any).user = userByEmail;
          }
        }
      } catch {}
    }

    requestContextStorage.run(actor, () => next());
  } catch (err) {
    next();
  }
};
