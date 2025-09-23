import { logger } from "../utils/logger";
import { Request, Response, NextFunction } from "express";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class ValidationError extends Error implements ApiError {
  statusCode = 400;
  code = "VALIDATION_ERROR";
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

export class AuthenticationError extends Error implements ApiError {
  statusCode = 401;
  code = "AUTHENTICATION_ERROR";

  constructor(message: string = "Authentication failed") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error implements ApiError {
  statusCode = 403;
  code = "AUTHORIZATION_ERROR";

  constructor(message: string = "Access denied") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error implements ApiError {
  statusCode = 404;
  code = "NOT_FOUND_ERROR";

  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class DatabaseError extends Error implements ApiError {
  statusCode = 500;
  code = "DATABASE_ERROR";

  constructor(message: string = "Database operation failed") {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ExternalServiceError extends Error implements ApiError {
  statusCode = 503;
  code = "EXTERNAL_SERVICE_ERROR";

  constructor(message: string = "External service unavailable") {
    super(message);
    this.name = "ExternalServiceError";
  }
}

export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error("API Error:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    statusCode: error.statusCode || 500,
  });

  const statusCode = error.statusCode || 500;

  const errorResponse: any = {
    success: false,
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred",
    },
  };

  if (error.details) {
    errorResponse.error.details = error.details;
  }

  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    errorResponse.error.message = "Internal server error";
  }

  res.status(statusCode).json(errorResponse);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

export function createSuccessResponse(data?: any, message?: string) {
  const response: any = {
    success: true,
  };

  if (message) {
    response.message = message;
  }

  if (data !== undefined) {
    response.data = data;
  }

  return response;
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: any
) {
  const response: any = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return response;
}
