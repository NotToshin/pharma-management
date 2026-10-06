import jwt from "jsonwebtoken";
import crypto from "crypto";
import { CookieOptions } from "express";
import config from "../config";

const JWT_ACCESS_SECRET = config.jwt.access_secret;
const JWT_REFRESH_SECRET = config.jwt.refresh_secret;

const ACCESS_TOKEN_EXPIRY = config.jwt.access_expires_in;
const REFRESH_TOKEN_EXPIRY = config.jwt.refresh_expires_in;

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const compareTokenHash = (token: string, storedHash: string): boolean => {
  const tokenHash = hashToken(token);
  const storedBuf = Buffer.from(storedHash, "hex");
  const hashBuf = Buffer.from(tokenHash, "hex");

  if (storedBuf.length !== hashBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuf, hashBuf);
};

const isProduction = config.env === "production";

export const getAccessTokenCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: "/",
});

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
});

export const getClearCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
});

