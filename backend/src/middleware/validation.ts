import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiError, ErrorCode } from "./errorHandler";

/**
 * Validation middleware factory for request body
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, any> = {};
        error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(err.message);
        });

        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          "Validation error in request body",
          400,
          details
        );
      }
      throw error;
    }
  };
}

/**
 * Validation middleware factory for query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, any> = {};
        error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(err.message);
        });

        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          "Validation error in query parameters",
          400,
          details
        );
      }
      throw error;
    }
  };
}

/**
 * Validation middleware factory for URL parameters
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, any> = {};
        error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(err.message);
        });

        throw new ApiError(
          ErrorCode.VALIDATION_ERROR,
          "Validation error in URL parameters",
          400,
          details
        );
      }
      throw error;
    }
  };
}
