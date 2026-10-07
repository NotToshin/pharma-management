import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodSchema, z } from "zod";

function getShape(schema: any): Record<string, ZodSchema> | null {
  if (!schema) return null;
  if ("shape" in schema && typeof schema.shape === "object") {
    return schema.shape;
  }
  if (schema._def?.schema) {
    return getShape(schema._def.schema);
  }
  if (schema._def?.innerType) {
    return getShape(schema._def.innerType);
  }
  return null;
}

export const validate = (schema: ZodSchema): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shape = getShape(schema);
      if (shape && ("body" in shape || "params" in shape || "query" in shape)) {
        const parsed: any = await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        if (parsed && typeof parsed === "object") {
          if ("body" in parsed && parsed.body !== undefined) req.body = parsed.body;
          if ("params" in parsed && parsed.params !== undefined) req.params = parsed.params;
          if ("query" in parsed && parsed.query !== undefined) req.query = parsed.query;
        }
      } else {
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const validateBody = (schema: ZodSchema): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shape = getShape(schema);
      let targetSchema: ZodSchema = schema;
      let targetData = req.body;

      if (shape && "body" in shape) {
        targetSchema = shape.body;
        if (
          targetData &&
          typeof targetData === "object" &&
          "body" in targetData &&
          Object.keys(targetData).length === 1
        ) {
          targetData = targetData.body;
        }
      }

      req.body = await targetSchema.parseAsync(targetData);
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shape = getShape(schema);
      let targetSchema: ZodSchema = schema;
      let targetData = req.params;

      if (shape && "params" in shape) {
        targetSchema = shape.params;
        if (
          targetData &&
          typeof targetData === "object" &&
          "params" in targetData
        ) {
          targetData = (targetData as any).params;
        }
      }

      const parsed = await targetSchema.parseAsync(targetData);
      req.params = parsed as Record<string, string>;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shape = getShape(schema);
      let targetSchema: ZodSchema = schema;
      let targetData = req.query;

      if (shape && "query" in shape) {
        targetSchema = shape.query;
        if (
          targetData &&
          typeof targetData === "object" &&
          "query" in targetData
        ) {
          targetData = (targetData as any).query;
        }
      }

      const parsed = await targetSchema.parseAsync(targetData);
      req.query = parsed as Record<string, string>;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};