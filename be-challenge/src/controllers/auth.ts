import { Request, Response } from "express";
import FirebaseService from "../services/firebase";
import { logger } from "../utils/logger";
import { ApiResponse, UserRole, Owner, Employee } from "../types";

const firebaseService = FirebaseService.getInstance();
const OWNERS_COLLECTION = "owners";
const EMPLOYEES_COLLECTION = "employees";

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      logger.warn("Missing user information in token", { userId, userRole });

      const response: ApiResponse = {
        success: false,
        message: "Invalid authentication token",
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid authentication token",
        },
      };

      res.status(401).json(response);
      return;
    }

    logger.info("Retrieving user information", { userId, userRole });

    let userData: any;
    let userInfo: any;

    if (userRole === UserRole.OWNER) {
      userData = await firebaseService.getDocument(OWNERS_COLLECTION, userId);
      
      if (!userData) {
        logger.warn("Owner not found", { userId });

        const response: ApiResponse = {
          success: false,
          message: "Owner not found",
          error: {
            code: "USER_NOT_FOUND",
            message: "Owner not found",
          },
        };

        res.status(404).json(response);
        return;
      }

      // Remove sensitive data
      const { accessCode, ...ownerData } = userData;
      
      userInfo = {
        id: userId,
        role: UserRole.OWNER,
        ...ownerData,
      };

    } else if (userRole === UserRole.EMPLOYEE) {
      userData = await firebaseService.getDocument(EMPLOYEES_COLLECTION, userId);
      
      if (!userData) {
        logger.warn("Employee not found", { userId });

        const response: ApiResponse = {
          success: false,
          message: "Employee not found",
          error: {
            code: "USER_NOT_FOUND",
            message: "Employee not found",
          },
        };

        res.status(404).json(response);
        return;
      }

      // Remove sensitive data
      const { accessCode, passwordHash, setupToken, setupTokenExpiry, ...employeeData } = userData;
      
      userInfo = {
        id: userId,
        role: UserRole.EMPLOYEE,
        ...employeeData,
      };

    } else {
      logger.warn("Invalid user role", { userId, userRole });

      const response: ApiResponse = {
        success: false,
        message: "Invalid user role",
        error: {
          code: "INVALID_ROLE",
          message: "Invalid user role",
        },
      };

      res.status(400).json(response);
      return;
    }

    logger.info("User information retrieved successfully", { 
      userId, 
      userRole,
      hasData: !!userInfo 
    });

    const response: ApiResponse = {
      success: true,
      message: "User information retrieved successfully",
      data: {
        user: userInfo,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error retrieving user information", {
      userId: req.user?.userId,
      userRole: req.user?.role,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to retrieve user information. Please try again.",
      error: {
        code: "USER_INFO_RETRIEVAL_FAILED",
        message: "Failed to retrieve user information. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}