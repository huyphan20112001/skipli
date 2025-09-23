import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

export interface EmailService {
  sendVerificationCode(email: string, code: string): Promise<boolean>;
  sendEmployeeCredentials(
    email: string,
    credentials: EmployeeCredentials
  ): Promise<boolean>;
  sendAccountSetupLink(
    email: string,
    setupLink: string,
    employeeName: string
  ): Promise<boolean>;
}

export interface EmployeeCredentials {
  name: string;
  email: string;
  employeeId: string;
  department: string;
}

class MailtrapEmailService implements EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    const host = process.env.MAILTRAP_HOST;
    const port = process.env.MAILTRAP_PORT;
    const username = process.env.MAILTRAP_USERNAME;
    const password = process.env.MAILTRAP_PASSWORD;
    this.fromEmail =
      process.env.MAILTRAP_FROM_EMAIL || "noreply@employeetask.com";

    if (!host || !port || !username || !password) {
      logger.warn(
        "Mailtrap credentials not configured. Email service will be disabled."
      );
      throw new Error("Mailtrap credentials not configured");
    }

    this.transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(port),
      auth: {
        user: username,
        pass: password,
      },
    });
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    const maxRetries = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const mailOptions = {
          from: this.fromEmail,
          to: email,
          subject: "Your Verification Code",
          text: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
          html: this.getVerificationCodeTemplate(code),
        };

        const result = await this.transporter.sendMail(mailOptions);

        logger.info(`Verification email sent successfully to ${email}`, {
          messageId: result.messageId,
          response: result.response,
          attempt,
        });

        return true;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;

        logger.error(
          `Failed to send verification email (attempt ${attempt}/${maxRetries})`,
          {
            email: email,
            error: error instanceof Error ? error.message : "Unknown error",
            isLastAttempt,
          }
        );

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

  async sendEmployeeCredentials(
    email: string,
    credentials: EmployeeCredentials
  ): Promise<boolean> {
    const maxRetries = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const mailOptions = {
          from: this.fromEmail,
          to: email,
          subject: "Welcome to Employee Task Management - Your Account Details",
          text: this.getEmployeeCredentialsText(credentials),
          html: this.getEmployeeCredentialsTemplate(credentials),
        };

        const result = await this.transporter.sendMail(mailOptions);

        logger.info(
          `Employee credentials email sent successfully to ${email}`,
          {
            messageId: result.messageId,
            response: result.response,
            employeeId: credentials.employeeId,
            attempt,
          }
        );

        return true;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;

        logger.error(
          `Failed to send employee credentials email (attempt ${attempt}/${maxRetries})`,
          {
            email: email,
            employeeId: credentials.employeeId,
            error: error instanceof Error ? error.message : "Unknown error",
            isLastAttempt,
          }
        );

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

  async sendAccountSetupLink(
    email: string,
    setupLink: string,
    employeeName: string
  ): Promise<boolean> {
    const maxRetries = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const mailOptions = {
          from: this.fromEmail,
          to: email,
          subject: "Complete Your Account Setup - Employee Task Management",
          text: this.getAccountSetupText(setupLink, employeeName),
          html: this.getAccountSetupTemplate(setupLink, employeeName),
        };

        const result = await this.transporter.sendMail(mailOptions);

        logger.info(`Account setup email sent successfully to ${email}`, {
          messageId: result.messageId,
          response: result.response,
          employeeName,
          attempt,
        });

        return true;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;

        logger.error(
          `Failed to send account setup email (attempt ${attempt}/${maxRetries})`,
          {
            email: email,
            employeeName,
            error: error instanceof Error ? error.message : "Unknown error",
            isLastAttempt,
          }
        );

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

  private getVerificationCodeTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verification Code</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .code { font-size: 24px; font-weight: bold; color: #007bff; text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 5px; margin: 20px 0; }
          .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Employee Task Management</h1>
          </div>
          <div class="content">
            <h2>Your Verification Code</h2>
            <p>Please use the following verification code to complete your login:</p>
            <div class="code">${code}</div>
            <p><strong>Important:</strong> This code will expire in 10 minutes for security reasons.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getEmployeeCredentialsText(credentials: EmployeeCredentials): string {
    return `
Welcome to Employee Task Management!

Hello ${credentials.name},

Your employee account has been created successfully. Here are your account details:

Employee ID: ${credentials.employeeId}
Name: ${credentials.name}
Email: ${credentials.email}
Department: ${credentials.department}

To access your account:
1. Visit the employee login page
2. Enter your email address: ${credentials.email}
3. Request a verification code
4. Enter the code you receive via email

If you have any questions or need assistance, please contact your manager.

Best regards,
Employee Task Management Team
    `;
  }

  private getEmployeeCredentialsTemplate(
    credentials: EmployeeCredentials
  ): string {
    const frontEndUrl = process.env.FRONTEND_URL || "http://locahost:5173";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Employee Task Management</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .credentials { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .credential-item { margin: 10px 0; }
          .credential-label { font-weight: bold; color: #495057; }
          .steps { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Employee Task Management!</h1>
          </div>
          <div class="content">
            <h2>Hello ${credentials.name},</h2>
            <p>Your employee account has been created successfully. Here are your account details:</p>
            
            <div class="credentials">
              <div class="credential-item">
                <span class="credential-label">Employee ID:</span> ${credentials.employeeId}
              </div>
              <div class="credential-item">
                <span class="credential-label">Name:</span> ${credentials.name}
              </div>
              <div class="credential-item">
                <span class="credential-label">Email:</span> ${credentials.email}
              </div>
              <div class="credential-item">
                <span class="credential-label">Department:</span> ${credentials.department}
              </div>
            </div>

            <h3>How to Access Your Account:</h3>
            <div class="steps">
              <ol>
                <li>Visit the employee login page</li>
                <li>Enter your email address: <strong>${credentials.email}</strong></li>
                <li>Request a verification code</li>
                <li>Enter the code you receive via email</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href=${frontEndUrl}/login target="_blank" 
                  rel="noopener noreferrer"
                  style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                        color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Go to Employee Login
              </a>
            </div>

            <p>If you have any questions or need assistance, please contact your manager.</p>
            <p>Best regards,<br>Employee Task Management Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getAccountSetupText(setupLink: string, employeeName: string): string {
    return `
Welcome to Employee Task Management!

Hello ${employeeName},

Your employee account has been created and you need to complete the setup process.

To set up your account:
1. Click on the following link: ${setupLink}
2. Create your username and password
3. Start using the Employee Task Management system

This setup link will expire in 24 hours for security reasons.

If you have any questions or need assistance, please contact your manager.

Best regards,
Employee Task Management Team
    `;
  }

  private getAccountSetupTemplate(
    setupLink: string,
    employeeName: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Complete Your Account Setup</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .setup-button { 
            display: inline-block; 
            padding: 15px 30px; 
            background-color: #28a745; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: bold; 
            margin: 20px 0;
            text-align: center;
          }
          .setup-button:hover { background-color: #218838; }
          .steps { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Complete Your Account Setup</h1>
          </div>
          <div class="content">
            <h2>Hello ${employeeName},</h2>
            <p>Welcome to Employee Task Management! Your account has been created and you need to complete the setup process.</p>
            
            <div style="text-align: center;">
              <a href="${setupLink}" class="setup-button" target="_blank" rel="noopener noreferrer">
                Complete Account Setup
              </a>
            </div>

            <h3>Setup Process:</h3>
            <div class="steps">
              <ol>
                <li>Click the "Complete Account Setup" button above</li>
                <li>Create your unique username</li>
                <li>Set a secure password</li>
                <li>Start using the Employee Task Management system</li>
              </ol>
            </div>

            <div class="warning">
              <strong>Important:</strong> This setup link will expire in 24 hours for security reasons. 
              Please complete your account setup as soon as possible.
            </div>

            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
              ${setupLink}
            </p>

            <p>If you have any questions or need assistance, please contact your manager.</p>
            <p>Best regards,<br>Employee Task Management Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

class MockEmailService implements EmailService {
  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    logger.info(
      `[MOCK EMAIL] Verification code ${code} would be sent to ${email}`
    );
    return true;
  }

  async sendEmployeeCredentials(
    email: string,
    credentials: EmployeeCredentials
  ): Promise<boolean> {
    logger.info(`[MOCK EMAIL] Employee credentials would be sent to ${email}`, {
      employeeId: credentials.employeeId,
      name: credentials.name,
      department: credentials.department,
    });
    return true;
  }

  async sendAccountSetupLink(
    email: string,
    setupLink: string,
    employeeName: string
  ): Promise<boolean> {
    logger.info(`[MOCK EMAIL] Account setup link would be sent to ${email}`, {
      employeeName,
      setupLink,
    });
    return true;
  }
}

export function createEmailService(): EmailService {
  const isProduction = process.env.NODE_ENV === "production";
  const hasMailtrapConfig =
    process.env.MAILTRAP_HOST &&
    process.env.MAILTRAP_PORT &&
    process.env.MAILTRAP_USERNAME &&
    process.env.MAILTRAP_PASSWORD;

  if (isProduction && !hasMailtrapConfig) {
    throw new Error(
      "Mailtrap configuration required in production environment"
    );
  }

  if (hasMailtrapConfig) {
    try {
      return new MailtrapEmailService();
    } catch (error) {
      logger.warn(
        "Failed to initialize Mailtrap service, falling back to mock service"
      );
      return new MockEmailService();
    }
  }

  logger.info("Using mock email service for development");
  return new MockEmailService();
}

export const emailService = createEmailService();
