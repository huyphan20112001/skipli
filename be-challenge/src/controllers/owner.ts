import { Request, Response } from "express";
import FirebaseService from "../services/firebase";
import { smsService } from "../services/sms";
import { generateAccessCode } from "../utils/access-code";
import { generateToken } from "../utils/jwt";
import { logger } from "../utils/logger";
import {
  ApiResponse,
  Owner,
  CreateAccessCodeRequest,
  ValidateAccessCodeRequest,
  UserRole,
} from "../types";

const firebaseService = FirebaseService.getInstance();
const OWNERS_COLLECTION = "owners";

export async function createAccessCode(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { phoneNumber }: CreateAccessCodeRequest = req.body;

    logger.info("Creating access code for owner", { phoneNumber });

    const accessCode = generateAccessCode();

    const ownersCollection = firebaseService.getCollection(OWNERS_COLLECTION);
    const existingOwnerQuery = await ownersCollection
      .where("phoneNumber", "==", phoneNumber)
      .limit(1)
      .get();

    let ownerId: string;

    if (!existingOwnerQuery.empty) {
      const existingOwner = existingOwnerQuery.docs[0];
      ownerId = existingOwner.id;

      await firebaseService.updateDocument(OWNERS_COLLECTION, ownerId, {
        accessCode,
        updatedAt: new Date(),
      });

      logger.info("Updated existing owner with new access code", {
        ownerId,
        phoneNumber,
      });
    } else {
      const ownerData: Omit<Owner, "id"> = {
        phoneNumber,
        accessCode,
        createdAt: new Date(),
      };

      ownerId = await firebaseService.createDocument(
        OWNERS_COLLECTION,
        ownerData
      );
      logger.info("Created new owner record", { ownerId, phoneNumber });
    }

    const smsSuccess = await smsService.sendVerificationCode(
      phoneNumber,
      accessCode
    );

    if (!smsSuccess) {
      logger.warn("Failed to send SMS verification code", {
        ownerId,
        phoneNumber,
      });
    }

    logger.info("Access code generated successfully", {
      ownerId,
      phoneNumber,

      accessCodeGenerated: true,
      smsSent: smsSuccess,
    });

    const response: ApiResponse = {
      success: true,
      message: smsSuccess
        ? "Access code generated and sent to your phone number"
        : "Access code generated. Please check your phone for the verification code.",
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error creating access code for owner", {
      phoneNumber: req.body.phoneNumber,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to generate access code. Please try again.",
      error: {
        code: "ACCESS_CODE_CREATION_FAILED",
        message: "Failed to generate access code. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}

export async function validateAccessCode(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { phoneNumber, accessCode }: ValidateAccessCodeRequest = req.body;

    logger.info("Validating access code for owner", { phoneNumber });

    const ownersCollection = firebaseService.getCollection(OWNERS_COLLECTION);
    const ownerQuery = await ownersCollection
      .where("phoneNumber", "==", phoneNumber)
      .limit(1)
      .get();

    if (ownerQuery.empty) {
      logger.warn("Owner not found for phone number", { phoneNumber });

      const response: ApiResponse = {
        success: false,
        message: "Invalid phone number or access code",
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid phone number or access code",
        },
      };

      res.status(401).json(response);
      return;
    }

    const ownerDoc = ownerQuery.docs[0];
    const owner = ownerDoc.data() as Owner;

    if (owner.accessCode !== accessCode) {
      logger.warn("Invalid access code provided", {
        phoneNumber,
        ownerId: ownerDoc.id,
      });

      const response: ApiResponse = {
        success: false,
        message: "Invalid phone number or access code",
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid phone number or access code",
        },
      };

      res.status(401).json(response);
      return;
    }

    await firebaseService.updateDocument(OWNERS_COLLECTION, ownerDoc.id, {
      accessCode: "",
      lastLogin: new Date(),
    });

    const token = generateToken(ownerDoc.id, UserRole.OWNER);

    logger.info("Access code validated successfully for owner", {
      ownerId: ownerDoc.id,
      phoneNumber,
    });

    const response: ApiResponse = {
      success: true,
      message: "Access code validated successfully",
      data: {
        ownerId: ownerDoc.id,
        token,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error validating access code for owner", {
      phoneNumber: req.body.phoneNumber,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to validate access code. Please try again.",
      error: {
        code: "ACCESS_CODE_VALIDATION_FAILED",
        message: "Failed to validate access code. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}
