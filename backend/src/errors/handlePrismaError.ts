import { Prisma } from "@prisma/client";
import { AppError } from "./AppError";

/**
 * Maps Prisma Client errors to appropriate operational AppError instances.
 */
export const handlePrismaError = (error: any): AppError => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.join(", ")
          : (error.meta?.target as string) || "field";
        return new AppError(`Duplicate value entered for unique field: ${target}`, 400);
      }
      case "P2025": {
        const cause = (error.meta?.cause as string) || "Requested record was not found";
        return new AppError(`Record not found: ${cause}`, 404);
      }
      case "P2003": {
        const fieldName = (error.meta?.field_name as string) || "foreign key";
        return new AppError(`Foreign key constraint failed on ${fieldName}`, 400);
      }
      case "P2014": {
        return new AppError(`Invalid relation ID: change violates required relationship`, 400);
      }
      case "P2000": {
        return new AppError(`Value provided is out of range for field`, 400);
      }
      case "P2023": {
        return new AppError(`Inconsistent column data or invalid ID format`, 400);
      }
      default: {
        return new AppError(`Database error (${error.code}): ${error.message}`, 400);
      }
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new AppError(`Invalid database query parameters or schema mismatch`, 400);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new AppError(`Database connection failed`, 500);
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return new AppError(`An unknown database error occurred`, 500);
  }

  return new AppError(`Database operation failed`, 500);
};
