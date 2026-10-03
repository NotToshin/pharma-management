import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodSchema, ZodError, ZodIssue } from "zod";
import { sendResponse } from "./response";

const formatZodError = (error: ZodError): string => {
  const issues = error.issues as ZodIssue[];
  return issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
};

export const validate = (schema: ZodSchema): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendResponse(res, 400, `Validation error: ${formatZodError(error)}`);
      }
      return next(error);
    }
  };
};

export const validateBody = (schema: ZodSchema): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendResponse(res, 400, `Validation error: ${formatZodError(error)}`);
      }
      return next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.params);
      req.params = parsed as Record<string, string>;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendResponse(res, 400, `Validation error: ${formatZodError(error)}`);
      }
      return next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.query);
      req.query = parsed as Record<string, string>;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendResponse(res, 400, `Validation error: ${formatZodError(error)}`);
      }
      return next(error);
    }
  };
};