import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { ApiResponse, JwtPayload, UserRole } from "../types";
import { logger } from "../utils/logger";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logger.warn("No token provided in request", { path: req.path });

    const response: ApiResponse = {
      success: false,
      message: "Access token required",
      error: {
        code: "TOKEN_REQUIRED",
        message: "Access token required",
      },
    };

    res.status(401).json(response);
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn("Invalid token provided", {
      path: req.path,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Invalid or expired token",
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired token",
      },
    };

    res.status(401).json(response);
  }
}

export function requireOwner(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      message: "Authentication required",
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication required",
      },
    };

    res.status(401).json(response);
    return;
  }

  if (req.user.role !== UserRole.OWNER) {
    logger.warn("Unauthorized access attempt by non-owner", {
      userId: req.user.userId,
      role: req.user.role,
      path: req.path,
    });

    const response: ApiResponse = {
      success: false,
      message: "Owner access required",
      error: {
        code: "OWNER_ACCESS_REQUIRED",
        message: "Owner access required",
      },
    };

    res.status(403).json(response);
    return;
  }

  next();
}

export function requireEmployee(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      message: "Authentication required",
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication required",
      },
    };

    res.status(401).json(response);
    return;
  }

  if (req.user.role !== UserRole.EMPLOYEE) {
    logger.warn("Unauthorized access attempt by non-employee", {
      userId: req.user.userId,
      role: req.user.role,
      path: req.path,
    });

    const response: ApiResponse = {
      success: false,
      message: "Employee access required",
      error: {
        code: "EMPLOYEE_ACCESS_REQUIRED",
        message: "Employee access required",
      },
    };

    res.status(403).json(response);
    return;
  }

  next();
}
