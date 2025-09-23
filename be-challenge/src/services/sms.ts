import twilio from "twilio";
import { logger } from "../utils/logger";

export interface SMSService {
  sendVerificationCode(phoneNumber: string, code: string): Promise<boolean>;
}

class TwilioSMSService implements SMSService {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || "";

    if (!accountSid || !authToken || !this.fromNumber) {
      logger.warn(
        "Twilio credentials not configured. SMS service will be disabled."
      );
      throw new Error("Twilio credentials not configured");
    }

    if (!accountSid.startsWith("AC")) {
      logger.warn(
        "Invalid Twilio Account SID format. Account SID must start with 'AC'",
        {
          providedSid: accountSid.substring(0, 2) + "...",
        }
      );
      throw new Error("Invalid Twilio Account SID format");
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendVerificationCode(
    phoneNumber: string,
    code: string
  ): Promise<boolean> {
    const maxRetries = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const formattedPhone = this.formatPhoneNumber(phoneNumber);

        const message = `Your verification code is: ${code}. This code will expire in 10 minutes.`;

        const result = await this.client.messages.create({
          body: message,
          from: this.fromNumber,
          to: formattedPhone,
        });

        logger.info(`SMS sent successfully to ${formattedPhone}`, {
          messageSid: result.sid,
          status: result.status,
          attempt,
        });

        return result.status === "queued" || result.status === "sent";
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;

        logger.error(`Failed to send SMS (attempt ${attempt}/${maxRetries})`, {
          phoneNumber: phoneNumber,
          error: error instanceof Error ? error.message : "Unknown error",
          isLastAttempt,
        });

        if (isLastAttempt) {
          return false;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attempt)
        );
      }
    }

    return false;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, "");

    if (!phoneNumber.startsWith("+")) {
      return `+1${cleaned}`;
    }

    return phoneNumber;
  }
}

class MockSMSService implements SMSService {
  async sendVerificationCode(
    phoneNumber: string,
    code: string
  ): Promise<boolean> {
    logger.info(
      `[MOCK SMS] Verification code ${code} would be sent to ${phoneNumber}`
    );
    return true;
  }
}

export function createSMSService(): SMSService {
  const isProduction = process.env.NODE_ENV === "production";
  const hasTwilioConfig =
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER;

  if (isProduction && !hasTwilioConfig) {
    throw new Error("Twilio configuration required in production environment");
  }

  if (hasTwilioConfig) {
    try {
      return new TwilioSMSService();
    } catch (error) {
      logger.warn(
        "Failed to initialize Twilio service, falling back to mock service",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        }
      );
      return new MockSMSService();
    }
  }

  logger.info("Using mock SMS service for development");
  return new MockSMSService();
}

export const smsService = createSMSService();
