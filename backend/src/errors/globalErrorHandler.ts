import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "./AppError";
import { handleZodError, AppErrorWithValidation } from "./handleZodError";
import { handlePrismaError } from "./handlePrismaError";
import config from "../config";

export interface StandardizedErrorResponse {
  success: boolean;
  statusCode: number;
  status: string; // "fail" | "error"
  message: string;
  errors?: any;
  stack?: string;
}

/**
 * Global Error Handler Middleware intercepting all application errors.
 */
export const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let error: AppErrorWithValidation;

  // 1. Intercept Zod Validation Errors
  if (err instanceof ZodError) {
    error = handleZodError(err);
  }
  // 2. Intercept Prisma Database Errors
  else if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientInitializationError ||
    err?.name?.includes("PrismaClient")
  ) {
    error = handlePrismaError(err);
  }
  // 3. Handle AppError instances
  else if (err instanceof AppError) {
    error = err;
  }
  // 4. Fallback for unhandled programming / native errors
  else {
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || "Internal Server Error";
    error = new AppError(message, statusCode, false);
  }

  const statusCode = error.statusCode || 500;
  const status = error.status || (statusCode >= 400 && statusCode < 500 ? "fail" : "error");

  const isDev = config.env === "development";

  // Build standardized JSON response
  const responseBody: StandardizedErrorResponse = {
    success: false,
    statusCode,
    status,
    message: error.isOperational || isDev ? error.message : "Something went wrong on the server",
    ...(error.errors && { errors: error.errors }),
    ...(isDev && { stack: err.stack || error.stack }),
  };

  // Log unhandled non-operational errors or 5xx server errors for monitoring
  if (!error.isOperational || statusCode >= 500) {
    console.error("💥 SYSTEM ERROR 💥:", err);
  }

  res.status(statusCode).json(responseBody);
};

/**
 * Express Middleware for handling unknown / 404 routes.
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const err = new AppError(`Cannot find ${req.originalUrl} on this server`, 404);
  next(err);
};
