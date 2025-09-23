import { Request, Response } from "express";
import FirebaseService from "../services/firebase";
import { emailService } from "../services/email";
import { generateAccessCode } from "../utils/access-code";
import { generateToken } from "../utils/jwt";
import { logger } from "../utils/logger";
import {
  ApiResponse,
  Employee,
  LoginEmailRequest,
  ValidateAccessCodeRequest,
  UserRole,
  CreateEmployeeRequest,
  DeleteEmployeeRequest,
  UpdateEmployeeRequest,
  AccountSetupRequest,
  EmployeeLoginRequest,
} from "../types";

const firebaseService = FirebaseService.getInstance();
const EMPLOYEES_COLLECTION = "employees";

export async function loginEmail(req: Request, res: Response): Promise<void> {
  try {
    const { email }: LoginEmailRequest = req.body;

    logger.info("Creating access code for employee", { email });

    const employeesCollection =
      firebaseService.getCollection(EMPLOYEES_COLLECTION);
    const employeeQuery = await employeesCollection
      .where("email", "==", email)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (employeeQuery.empty) {
      logger.warn("Employee not found or inactive for email", { email });

      const response: ApiResponse = {
        success: false,
        message: "Employee not found or account is inactive",
        error: {
          code: "EMPLOYEE_NOT_FOUND",
          message: "Employee not found or account is inactive",
        },
      };

      res.status(404).json(response);
      return;
    }

    const employeeDoc = employeeQuery.docs[0];
    const employeeId = employeeDoc.id;

    const accessCode = generateAccessCode();

    await firebaseService.updateDocument(EMPLOYEES_COLLECTION, employeeId, {
      accessCode,
      updatedAt: new Date(),
    });

    logger.info("Updated employee with new access code", { employeeId, email });

    const emailSuccess = await emailService.sendVerificationCode(
      email,
      accessCode
    );

    if (!emailSuccess) {
      logger.warn("Failed to send verification email", { employeeId, email });
    }

    logger.info("Access code generated successfully for employee", {
      employeeId,
      email,

      accessCodeGenerated: true,
      emailSent: emailSuccess,
    });

    const response: ApiResponse = {
      success: true,
      message: emailSuccess
        ? "Access code generated and sent to your email address"
        : "Access code generated. Please check your email for the verification code.",
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error creating access code for employee", {
      email: req.body.email,
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
    const { email, accessCode }: ValidateAccessCodeRequest = req.body;

    logger.info("Validating access code for employee", { email });

    const employeesCollection =
      firebaseService.getCollection(EMPLOYEES_COLLECTION);
    const employeeQuery = await employeesCollection
      .where("email", "==", email)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (employeeQuery.empty) {
      logger.warn("Employee not found for email", { email });

      const response: ApiResponse = {
        success: false,
        message: "Invalid email or access code",
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or access code",
        },
      };

      res.status(401).json(response);
      return;
    }

    const employeeDoc = employeeQuery.docs[0];
    const employee = employeeDoc.data() as Employee;

    if (employee.accessCode !== accessCode) {
      logger.warn("Invalid access code provided", {
        email,
        employeeId: employeeDoc.id,
      });

      const response: ApiResponse = {
        success: false,
        message: "Invalid email or access code",
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or access code",
        },
      };

      res.status(401).json(response);
      return;
    }

    await firebaseService.updateDocument(EMPLOYEES_COLLECTION, employeeDoc.id, {
      accessCode: "",
      lastLogin: new Date(),
    });

    const token = generateToken(employeeDoc.id, UserRole.EMPLOYEE);

    logger.info("Access code validated successfully for employee", {
      employeeId: employeeDoc.id,
      email,
    });

    const response: ApiResponse = {
      success: true,
      message: "Access code validated successfully",
      data: {
        employeeId: employeeDoc.id,
        token,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error validating access code for employee", {
      email: req.body.email,
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

export async function getEmployee(req: Request, res: Response): Promise<void> {
  try {
    const { employeeId } = req.params;

    logger.info("Retrieving employee details", { employeeId });

    const employeeDoc = await firebaseService.getDocument(
      EMPLOYEES_COLLECTION,
      employeeId
    );

    if (!employeeDoc) {
      logger.warn("Employee not found", { employeeId });

      const response: ApiResponse = {
        success: false,
        message: "Employee not found",
        error: {
          code: "EMPLOYEE_NOT_FOUND",
          message: "Employee not found",
        },
      };

      res.status(404).json(response);
      return;
    }

    const { accessCode, ...employeeData } = employeeDoc;

    logger.info("Employee details retrieved successfully", { employeeId });

    const response: ApiResponse = {
      success: true,
      message: "Employee details retrieved successfully",
      data: {
        employee: {
          ...employeeData,
          id: employeeId,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error retrieving employee details", {
      employeeId: req.params.employeeId,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to retrieve employee details. Please try again.",
      error: {
        code: "EMPLOYEE_RETRIEVAL_FAILED",
        message: "Failed to retrieve employee details. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}

export async function createEmployee(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { name, email, department }: CreateEmployeeRequest = req.body;
    const ownerId = req.user?.userId;

    logger.info("Creating new employee", { name, email, department, ownerId });

    const employeesCollection =
      firebaseService.getCollection(EMPLOYEES_COLLECTION);
    const existingEmployeeQuery = await employeesCollection
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!existingEmployeeQuery.empty) {
      logger.warn("Employee with email already exists", { email });

      const response: ApiResponse = {
        success: false,
        message: "Employee with this email already exists",
        error: {
          code: "EMPLOYEE_ALREADY_EXISTS",
          message: "Employee with this email already exists",
        },
      };

      res.status(409).json(response);
      return;
    }

    const setupToken = require("crypto").randomBytes(32).toString("hex");
    const setupTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newEmployee: Omit<Employee, "id"> = {
      name,
      email,
      department,
      accessCode: "",
      setupToken,
      setupTokenExpiry,
      isActive: true,
      isSetupComplete: false,
      createdAt: new Date(),
      createdBy: ownerId!,
    };

    const employeeId = await firebaseService.createDocument(
      EMPLOYEES_COLLECTION,
      newEmployee
    );

    logger.info("Employee created successfully", { employeeId, email, name });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const setupLink = `${frontendUrl}/employee/setup?token=${setupToken}`;

    const emailSuccess = await emailService.sendAccountSetupLink(
      email,
      setupLink,
      name
    );

    if (!emailSuccess) {
      logger.warn("Failed to send account setup email", {
        employeeId,
        email,
      });
    }

    logger.info("Employee account setup email sent", {
      employeeId,
      email,
      setupEmailSent: emailSuccess,
    });

    const response: ApiResponse = {
      success: true,
      message: emailSuccess
        ? "Employee created successfully and setup link sent via email"
        : "Employee created successfully. Please manually provide setup instructions.",
      data: {
        employeeId,
        employee: {
          id: employeeId,
          name,
          email,
          department,
          isActive: true,
          createdAt: newEmployee.createdAt,
          createdBy: ownerId!,
        },
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error("Error creating employee", {
      name: req.body.name,
      email: req.body.email,
      department: req.body.department,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to create employee. Please try again.",
      error: {
        code: "EMPLOYEE_CREATION_FAILED",
        message: "Failed to create employee. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}

export async function updateEmployee(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      employeeId,
      name,
      email,
      department,
      isActive,
    }: UpdateEmployeeRequest = req.body;
    const ownerId = req.user?.userId;

    logger.info("Updating employee", {
      employeeId,
      ownerId,
      fieldsToUpdate: { name, email, department, isActive },
    });

    const employeeDoc = await firebaseService.getDocument(
      EMPLOYEES_COLLECTION,
      employeeId
    );
    logger.warn("Employee not found for update", employeeDoc);
    if (!employeeDoc) {
      logger.warn("Employee not found for update", { employeeId });

      const response: ApiResponse = {
        success: false,
        message: "Employee not found",
        error: {
          code: "EMPLOYEE_NOT_FOUND",
          message: "Employee not found",
        },
      };

      res.status(404).json(response);
      return;
    }

    if (email && email !== employeeDoc.email) {
      const employeesCollection =
        firebaseService.getCollection(EMPLOYEES_COLLECTION);
      const existingEmployeeQuery = await employeesCollection
        .where("email", "==", email)
        .limit(1)
        .get();

      if (!existingEmployeeQuery.empty) {
        logger.warn("Email already exists for another employee", {
          email,
          employeeId,
        });

        const response: ApiResponse = {
          success: false,
          message: "An employee with this email already exists",
          error: {
            code: "EMAIL_ALREADY_EXISTS",
            message: "An employee with this email already exists",
          },
        };

        res.status(409).json(response);
        return;
      }
    }

    const updateData: Partial<Employee> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (department !== undefined) updateData.department = department;
    if (isActive !== undefined) updateData.isActive = isActive;

    await firebaseService.updateDocument(
      EMPLOYEES_COLLECTION,
      employeeId,
      updateData
    );

    logger.info("Employee updated successfully", {
      employeeId,
      updatedBy: ownerId,
      updatedFields: Object.keys(updateData).filter(
        (key) => key !== "updatedAt"
      ),
    });

    const updatedEmployeeDoc = await firebaseService.getDocument(
      EMPLOYEES_COLLECTION,
      employeeId
    );

    const { accessCode, ...employeeData } = updatedEmployeeDoc;

    const response: ApiResponse = {
      success: true,
      message: "Employee updated successfully",
      data: {
        employee: {
          ...employeeData,
          id: employeeId,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error updating employee", {
      employeeId: req.body.employeeId,
      ownerId: req.user?.userId,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to update employee. Please try again.",
      error: {
        code: "EMPLOYEE_UPDATE_FAILED",
        message: "Failed to update employee. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}

export async function deleteEmployee(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { employeeId }: DeleteEmployeeRequest = req.body;
    const ownerId = req.user?.userId;

    logger.info("Deleting employee", { employeeId, ownerId });

    const employeeDoc = await firebaseService.getDocument(
      EMPLOYEES_COLLECTION,
      employeeId
    );

    if (!employeeDoc) {
      logger.warn("Employee not found for deletion", { employeeId });

      const response: ApiResponse = {
        success: false,
        message: "Employee not found",
        error: {
          code: "EMPLOYEE_NOT_FOUND",
          message: "Employee not found",
        },
      };

      res.status(404).json(response);
      return;
    }

    if (employeeDoc.createdBy !== ownerId) {
      logger.warn("Unauthorized delete attempt", {
        employeeId,
        ownerId,
        createdBy: employeeDoc.createdBy,
      });

      const response: ApiResponse = {
        success: false,
        message: "You can only delete employees you created",
        error: {
          code: "UNAUTHORIZED_DELETE",
          message: "You can only delete employees you created",
        },
      };

      res.status(403).json(response);
      return;
    }

    await firebaseService.deleteDocument(EMPLOYEES_COLLECTION, employeeId);

    logger.info("Employee deleted successfully", {
      employeeId,
      deletedBy: ownerId,
    });

    const response: ApiResponse = {
      success: true,
      message: "Employee deleted successfully",
      data: {
        employeeId,
        deletedAt: new Date(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error deleting employee", {
      employeeId: req.body.employeeId,
      ownerId: req.user?.userId,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to delete employee. Please try again.",
      error: {
        code: "EMPLOYEE_DELETION_FAILED",
        message: "Failed to delete employee. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}

export async function getEmployeeList(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const ownerId = req.user?.userId;
    const {
      search = "",
      page = "1",
      limit = "10",
      department = "",
      isActive = "true",
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    logger.info("Getting employee list", {
      ownerId,
      search,
      page: pageNum,
      limit: limitNum,
      department,
      isActive,
    });

    const employeesCollection =
      firebaseService.getCollection(EMPLOYEES_COLLECTION);
    let query = employeesCollection.where("createdBy", "==", ownerId);

    if (isActive !== "all") {
      const activeStatus = isActive === "true";
      query = query.where("isActive", "==", activeStatus);
    }

    if (
      department &&
      typeof department === "string" &&
      department.trim() !== ""
    ) {
      query = query.where("department", "==", department.trim());
    }

    const querySnapshot = await query.get();

    let employees = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (Employee & { id: string })[];

    if (search && typeof search === "string" && search.trim() !== "") {
      const searchTerm = search.toLowerCase().trim();
      employees = employees.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchTerm) ||
          employee.email.toLowerCase().includes(searchTerm)
      );
    }

    employees.sort((a, b) => {
      const dateA =
        a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB =
        b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    const total = employees.length;
    const paginatedEmployees = employees.slice(offset, offset + limitNum);

    const sanitizedEmployees = paginatedEmployees.map(
      ({ accessCode, ...employee }) => employee
    );

    logger.info("Employee list retrieved successfully", {
      ownerId,
      total,
      returned: sanitizedEmployees.length,
      page: pageNum,
      limit: limitNum,
    });

    const response: ApiResponse = {
      success: true,
      message: "Employee list retrieved successfully",
      data: {
        employees: sanitizedEmployees,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: offset + limitNum < total,
          hasPrev: pageNum > 1,
        },
        filters: {
          search: search.toString(),
          department: department.toString(),
          isActive: isActive.toString(),
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error retrieving employee list", {
      ownerId: req.user?.userId,
      query: req.query,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to retrieve employee list. Please try again.",
      error: {
        code: "EMPLOYEE_LIST_RETRIEVAL_FAILED",
        message: "Failed to retrieve employee list. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}
export async function validateSetupToken(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { token } = req.params;
    console.log("🚀 ~ validateSetupToken ~ token => ", token);

    logger.info("Validating setup token", {
      token: token.substring(0, 8) + "...",
    });

    const employeesCollection =
      firebaseService.getCollection(EMPLOYEES_COLLECTION);
    const employeeQuery = await employeesCollection
      .where("setupToken", "==", token)
      .limit(1)
      .get();

    if (employeeQuery.empty) {
      logger.warn("Invalid setup token provided", {
        token: token.substring(0, 8) + "...",
      });

      const response: ApiResponse = {
        success: false,
        message: "Invalid or expired setup token",
        error: {
          code: "INVALID_SETUP_TOKEN",
          message: "Invalid or expired setup token",
        },
      };

      res.status(404).json(response);
      return;
    }

    const employeeDoc = employeeQuery.docs[0];
    console.log("🚀 ~ validateSetupToken ~ employeeDoc => ", employeeDoc);
    const employee = employeeDoc.data() as Employee;
    console.log("🚀 ~ validateSetupToken ~ employee => ", employee);

    console.log(new Date(), employee.setupTokenExpiry.toDate());

    if (
      employee.setupTokenExpiry &&
      new Date() > employee.setupTokenExpiry.toDate()
    ) {
      logger.warn("Setup token has expired", {
        employeeId: employeeDoc.id,
        expiry: employee.setupTokenExpiry,
      });

      const response: ApiResponse = {
        success: false,
        message: "Setup token has expired. Please request a new invitation.",
        error: {
          code: "SETUP_TOKEN_EXPIRED",
          message: "Setup token has expired. Please request a new invitation.",
        },
      };

      res.status(410).json(response);
      return;
    }

    if (employee.isSetupComplete) {
      logger.warn("Account already set up", { employeeId: employeeDoc.id });

      const response: ApiResponse = {
        success: false,
        message: "Account has already been set up. Please use the login page.",
        error: {
          code: "ACCOUNT_ALREADY_SETUP",
          message:
            "Account has already been set up. Please use the login page.",
        },
      };

      res.status(409).json(response);
      return;
    }

    logger.info("Setup token validated successfully", {
      employeeId: employeeDoc.id,
    });

    const response: ApiResponse = {
      success: true,
      message: "Setup token is valid",
      data: {
        employeeInfo: {
          name: employee.name,
          email: employee.email,
          department: employee.department,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error validating setup token", {
      token: req.params.token?.substring(0, 8) + "...",
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to validate setup token. Please try again.",
      error: {
        code: "SETUP_TOKEN_VALIDATION_FAILED",
        message: "Failed to validate setup token. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}

export async function completeAccountSetup(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { token, username, password }: AccountSetupRequest = req.body;

    logger.info("Processing account setup completion", {
      token: token.substring(0, 8) + "...",
      username,
    });

    const {
      validateUsername,
      validatePasswordStrength,
      isUsernameUnique,
      hashPassword,
    } = await import("../utils/password");

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      logger.warn("Invalid username format", {
        username,
        error: usernameValidation.error,
      });

      const response: ApiResponse = {
        success: false,
        message: usernameValidation.error!,
        error: {
          code: "INVALID_USERNAME",
          message: usernameValidation.error!,
        },
      };

      res.status(400).json(response);
      return;
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      logger.warn("Invalid password strength", {
        username,
        error: passwordValidation.error,
      });

      const response: ApiResponse = {
        success: false,
        message: passwordValidation.error!,
        error: {
          code: "INVALID_PASSWORD",
          message: passwordValidation.error!,
        },
      };

      res.status(400).json(response);
      return;
    }

    const isUnique = await isUsernameUnique(username);
    if (!isUnique) {
      logger.warn("Username already taken", { username });

      const response: ApiResponse = {
        success: false,
        message:
          "Username is already taken. Please choose a different username.",
        error: {
          code: "USERNAME_TAKEN",
          message:
            "Username is already taken. Please choose a different username.",
        },
      };

      res.status(409).json(response);
      return;
    }

    const employeesCollection =
      firebaseService.getCollection(EMPLOYEES_COLLECTION);
    const employeeQuery = await employeesCollection
      .where("setupToken", "==", token)
      .limit(1)
      .get();

    if (employeeQuery.empty) {
      logger.warn("Invalid setup token for account completion", {
        token: token.substring(0, 8) + "...",
      });

      const response: ApiResponse = {
        success: false,
        message: "Invalid or expired setup token",
        error: {
          code: "INVALID_SETUP_TOKEN",
          message: "Invalid or expired setup token",
        },
      };

      res.status(404).json(response);
      return;
    }

    const employeeDoc = employeeQuery.docs[0];
    const employee = employeeDoc.data() as Employee;

    if (
      employee.setupTokenExpiry &&
      new Date() > employee.setupTokenExpiry.toDate()
    ) {
      logger.warn("Setup token has expired for account completion", {
        employeeId: employeeDoc.id,
        expiry: employee.setupTokenExpiry,
      });

      const response: ApiResponse = {
        success: false,
        message: "Setup token has expired. Please request a new invitation.",
        error: {
          code: "SETUP_TOKEN_EXPIRED",
          message: "Setup token has expired. Please request a new invitation.",
        },
      };

      res.status(410).json(response);
      return;
    }

    if (employee.isSetupComplete) {
      logger.warn("Account already set up for completion", {
        employeeId: employeeDoc.id,
      });

      const response: ApiResponse = {
        success: false,
        message: "Account has already been set up. Please use the login page.",
        error: {
          code: "ACCOUNT_ALREADY_SETUP",
          message:
            "Account has already been set up. Please use the login page.",
        },
      };

      res.status(409).json(response);
      return;
    }

    const passwordHash = await hashPassword(password);

    await firebaseService.updateDocument(EMPLOYEES_COLLECTION, employeeDoc.id, {
      username,
      passwordHash,
      setupToken: "",
      setupTokenExpiry: null,
      isSetupComplete: true,
      isActive: true,
      updatedAt: new Date(),
    });

    const tokenJwt = generateToken(employeeDoc.id, UserRole.EMPLOYEE);

    logger.info("Account setup completed successfully", {
      employeeId: employeeDoc.id,
      username,
    });

    const response: ApiResponse = {
      success: true,
      message:
        "Account setup completed successfully. You can now log in with your credentials.",
      data: {
        employeeId: employeeDoc.id,
        username,
        setupComplete: true,
        token: tokenJwt,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error completing account setup", {
      token: req.body.token?.substring(0, 8) + "...",
      username: req.body.username,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to complete account setup. Please try again.",
      error: {
        code: "ACCOUNT_SETUP_FAILED",
        message: "Failed to complete account setup. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}
export async function loginWithCredentials(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { username, password }: EmployeeLoginRequest = req.body;

    logger.info("Employee login attempt", { username });

    const { verifyPassword } = await import("../utils/password");

    const employeesCollection =
      firebaseService.getCollection(EMPLOYEES_COLLECTION);
    const employeeQuery = await employeesCollection
      .where("username", "==", username)
      .where("isActive", "==", true)
      .where("isSetupComplete", "==", true)
      .limit(1)
      .get();

    if (employeeQuery.empty) {
      logger.warn("Employee not found or inactive for username", { username });

      const response: ApiResponse = {
        success: false,
        message: "Invalid username or password",
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid username or password",
        },
      };

      res.status(401).json(response);
      return;
    }

    const employeeDoc = employeeQuery.docs[0];
    const employee = employeeDoc.data() as Employee;

    if (!employee.passwordHash) {
      logger.warn("Employee account not properly set up", {
        employeeId: employeeDoc.id,
        username,
      });

      const response: ApiResponse = {
        success: false,
        message:
          "Account setup is incomplete. Please complete your account setup.",
        error: {
          code: "ACCOUNT_SETUP_INCOMPLETE",
          message:
            "Account setup is incomplete. Please complete your account setup.",
        },
      };

      res.status(401).json(response);
      return;
    }

    const isPasswordValid = await verifyPassword(
      password,
      employee.passwordHash
    );
    if (!isPasswordValid) {
      logger.warn("Invalid password provided", {
        employeeId: employeeDoc.id,
        username,
      });

      const response: ApiResponse = {
        success: false,
        message: "Invalid username or password",
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid username or password",
        },
      };

      res.status(401).json(response);
      return;
    }

    await firebaseService.updateDocument(EMPLOYEES_COLLECTION, employeeDoc.id, {
      lastLogin: new Date(),
    });

    const token = generateToken(employeeDoc.id, UserRole.EMPLOYEE);

    logger.info("Employee login successful", {
      employeeId: employeeDoc.id,
      username,
    });

    const { passwordHash, accessCode, setupToken, ...employeeData } = employee;

    const response: ApiResponse = {
      success: true,
      message: "Login successful",
      data: {
        employeeId: employeeDoc.id,
        token,
        employee: {
          ...employeeData,
          id: employeeDoc.id,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error during employee login", {
      username: req.body.username,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Login failed. Please try again.",
      error: {
        code: "LOGIN_FAILED",
        message: "Login failed. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}

export async function getChatParticipants(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    logger.info("Getting chat participants", { userId, userRole });

    const participants: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      isOnline?: boolean;
    }> = [];

    if (userRole === UserRole.OWNER) {
      const employeesCollection =
        firebaseService.getCollection(EMPLOYEES_COLLECTION);
      const employeeQuery = await employeesCollection
        .where("createdBy", "==", userId)
        .where("isActive", "==", true)
        .where("isSetupComplete", "==", true)
        .get();

      employeeQuery.docs.forEach((doc) => {
        const employee = doc.data() as Employee;
        participants.push({
          id: doc.id,
          name: employee.name,
          email: employee.email,
          role: "employee",
        });
      });
    } else if (userRole === UserRole.EMPLOYEE) {
      const employeeDoc = await firebaseService.getDocument(
        EMPLOYEES_COLLECTION,
        userId!
      );

      if (employeeDoc && employeeDoc.createdBy) {
        const ownerDoc = await firebaseService.getDocument(
          "owners",
          employeeDoc.createdBy
        );

        if (ownerDoc) {
          participants.push({
            id: employeeDoc.createdBy,
            name: ownerDoc.name || "Owner",
            email: ownerDoc.email,
            role: "owner",
          });
        }
      }
    }

    logger.info("Chat participants retrieved successfully", {
      userId,
      userRole,
      participantCount: participants.length,
    });

    const response: ApiResponse = {
      success: true,
      message: "Chat participants retrieved successfully",
      data: {
        participants,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error retrieving chat participants", {
      userId: req.user?.userId,
      userRole: req.user?.role,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to retrieve chat participants. Please try again.",
      error: {
        code: "CHAT_PARTICIPANTS_RETRIEVAL_FAILED",
        message: "Failed to retrieve chat participants. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}
