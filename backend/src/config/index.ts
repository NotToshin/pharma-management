import dotenv from "dotenv";
import path from "path";
import { SignOptions } from "jsonwebtoken";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const requireEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Set it in your .env file.`
    );
  }

  return value;
};

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  database_url: requireEnv("DATABASE_URL"),
  salt_rounds: Number(process.env.SALT_ROUNDS) || 12,
  jwt: {
    secret: requireEnv("JWT_SECRET"),
    access_secret: requireEnv("JWT_ACCESS_SECRET"),
    refresh_secret: requireEnv("JWT_REFRESH_SECRET"),
    access_expires_in: (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as SignOptions["expiresIn"],
    refresh_expires_in: (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  },
};

export default config;
