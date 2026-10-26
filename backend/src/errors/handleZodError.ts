import { ZodError } from "zod";
import { AppError } from "./AppError";

export interface ZodFieldError {
  field: string;
  message: string;
}

export interface AppErrorWithValidation extends AppError {
  errors?: ZodFieldError[];
}

/**
 * Transforms Zod validation errors into a clean AppError with field-level error details.
 */
export const handleZodError = (error: ZodError): AppErrorWithValidation => {
  const errors: ZodFieldError[] = error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "field",
    message: issue.message,
  }));

  const message = `Validation failed: ${errors.map((e) => `${e.field} (${e.message})`).join("; ")}`;
  const appError: AppErrorWithValidation = new AppError(message, 400, true);
  appError.errors = errors;

  return appError;
};
