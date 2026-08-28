import { Request, Response, NextFunction } from "express";

/**
 * Standard API error codes used throughout the system
 */
export enum ErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_UUID = "INVALID_UUID",
  INVALID_DATE_FORMAT = "INVALID_DATE_FORMAT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_EMAIL = "INVALID_EMAIL",
  INVALID_ENUM_VALUE = "INVALID_ENUM_VALUE",
  
  // Authentication errors (401)
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  MISSING_TOKEN = "MISSING_TOKEN",
  
  // Authorization errors (403)
  FORBIDDEN = "FORBIDDEN",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  UNAUTHORIZED_LOCATION_ACCESS = "UNAUTHORIZED_LOCATION_ACCESS",
  UNAUTHORIZED_ROLE = "UNAUTHORIZED_ROLE",
  UNAUTHORIZED_DELETE = "UNAUTHORIZED_DELETE",
  
  // Resource errors (404)
  NOT_FOUND = "NOT_FOUND",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  PRODUCT_NOT_FOUND = "PRODUCT_NOT_FOUND",
  LOCATION_NOT_FOUND = "LOCATION_NOT_FOUND",
  CUSTOMER_NOT_FOUND = "CUSTOMER_NOT_FOUND",
  DEBT_NOT_FOUND = "DEBT_NOT_FOUND",
  SALE_NOT_FOUND = "SALE_NOT_FOUND",
  
  // Business logic errors (400/422)
  INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK",
  INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION",
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
  INVALID_OPERATION = "INVALID_OPERATION",
  NEGATIVE_INVENTORY = "NEGATIVE_INVENTORY",
  OVERDRAFT = "OVERDRAFT",
  
  // Server errors (500)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
}

/**
 * Structured API error response
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode | string;
    message: string;
    details?: Record<string, any>;
  };
}

/**
 * Extended Error class with code and HTTP status
 */
export class ApiError extends Error {
  constructor(
    public code: ErrorCode | string,
    public message: string,
    public statusCode: number = 400,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Global error handling middleware
 * Converts all errors to structured responses
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error for debugging
  console.error("Error:", {
    code: err.code || "UNKNOWN",
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: err.stack,
  });

  // Handle ApiError instances
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    } as ErrorResponse);
    return;
  }

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    const details: Record<string, any> = {};
    err.errors.forEach((e: any) => {
      const path = e.path.join(".");
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(e.message);
    });

    res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: "Validation error",
        details,
      },
    } as ErrorResponse);
    return;
  }

  // Handle PostgreSQL errors
  if (err.code === "23505") {
    // Unique constraint violation
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.DUPLICATE_ENTRY,
        message: "Duplicate entry: This record already exists",
      },
    } as ErrorResponse);
    return;
  }

  if (err.code === "23503") {
    // Foreign key constraint violation
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.INVALID_OPERATION,
        message: "Invalid operation: Referenced record does not exist",
      },
    } as ErrorResponse);
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: "Internal server error",
    },
  } as ErrorResponse);
}

/**
 * Wrapper to catch async route errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
