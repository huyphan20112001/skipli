import { Request, Response, NextFunction } from "express";
import { isValidAccessCode } from "../utils/access-code";

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export function isValidPhoneNumber(phoneNumber: string): boolean {
  return /^\+?[\d\s\-\(\)]{10,15}$/.test(phoneNumber.replace(/\s/g, ""));
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>\"'&]/g, "");
}

export function validateCreateAccessCode(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors: ValidationErrorDetail[] = [];
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    errors.push({ field: "phoneNumber", message: "Phone number is required" });
  } else if (!isValidPhoneNumber(phoneNumber)) {
    errors.push({
      field: "phoneNumber",
      message: "Invalid phone number format",
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input parameters",
        details: errors,
      },
    });
    return;
  }

  req.body.phoneNumber = sanitizeString(phoneNumber);
  next();
}

export function validateAccessCodeRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors: ValidationErrorDetail[] = [];
  const { phoneNumber, email, accessCode } = req.body;

  if (!accessCode) {
    errors.push({ field: "accessCode", message: "Access code is required" });
  } else if (!isValidAccessCode(accessCode)) {
    errors.push({
      field: "accessCode",
      message: "Access code must be 6 digits",
    });
  }

  if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
    errors.push({
      field: "phoneNumber",
      message: "Invalid phone number format",
    });
  }

  if (email && !isValidEmail(email)) {
    errors.push({ field: "email", message: "Invalid email format" });
  }

  if (!phoneNumber && !email) {
    errors.push({
      field: "identifier",
      message: "Either phone number or email is required",
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input parameters",
        details: errors,
      },
    });
    return;
  }

  if (phoneNumber) req.body.phoneNumber = sanitizeString(phoneNumber);
  if (email) req.body.email = sanitizeString(email);
  req.body.accessCode = sanitizeString(accessCode);
  next();
}

export function validateCreateEmployee(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors: ValidationErrorDetail[] = [];
  const { name, email, department } = req.body;

  if (!name || name.trim().length === 0) {
    errors.push({ field: "name", message: "Name is required" });
  } else if (name.length > 100) {
    errors.push({
      field: "name",
      message: "Name must be less than 100 characters",
    });
  }

  if (!email) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!isValidEmail(email)) {
    errors.push({ field: "email", message: "Invalid email format" });
  }

  if (!department || department.trim().length === 0) {
    errors.push({ field: "department", message: "Department is required" });
  } else if (department.length > 50) {
    errors.push({
      field: "department",
      message: "Department must be less than 50 characters",
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input parameters",
        details: errors,
      },
    });
    return;
  }

  req.body.name = sanitizeString(name);
  req.body.email = sanitizeString(email);
  req.body.department = sanitizeString(department);
  next();
}

export function validateEmployeeId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { employeeId } = req.params;

  if (!employeeId || employeeId.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Employee ID is required",
      },
    });
    return;
  }

  next();
}

export function validateEmailLogin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors: ValidationErrorDetail[] = [];
  const { email } = req.body;

  if (!email) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!isValidEmail(email)) {
    errors.push({ field: "email", message: "Invalid email format" });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input parameters",
        details: errors,
      },
    });
    return;
  }

  req.body.email = sanitizeString(email);
  next();
}
export function validateUpdateEmployee(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors: ValidationErrorDetail[] = [];
  const { employeeId, name, email, department, isActive } = req.body;

  if (!employeeId || employeeId.trim().length === 0) {
    errors.push({ field: "employeeId", message: "Employee ID is required" });
  }

  const hasNameField = name !== undefined;
  const hasEmailField = email !== undefined;
  const hasDepartmentField = department !== undefined;
  const hasIsActiveField = isActive !== undefined;

  if (
    !hasNameField &&
    !hasEmailField &&
    !hasDepartmentField &&
    !hasIsActiveField
  ) {
    errors.push({
      field: "update",
      message:
        "At least one field (name, email, department, or isActive) must be provided for update",
    });
  }

  if (hasNameField) {
    if (typeof name !== "string" || name.trim().length === 0) {
      errors.push({
        field: "name",
        message: "Name must be a non-empty string",
      });
    } else if (name.length > 100) {
      errors.push({
        field: "name",
        message: "Name must be less than 100 characters",
      });
    }
  }

  if (hasEmailField) {
    if (typeof email !== "string" || !isValidEmail(email.trim())) {
      errors.push({ field: "email", message: "Invalid email format" });
    }
  }

  if (hasDepartmentField) {
    if (typeof department !== "string" || department.trim().length === 0) {
      errors.push({
        field: "department",
        message: "Department must be a non-empty string",
      });
    } else if (department.length > 50) {
      errors.push({
        field: "department",
        message: "Department must be less than 50 characters",
      });
    }
  }

  if (hasIsActiveField && typeof isActive !== "boolean") {
    errors.push({ field: "isActive", message: "isActive must be a boolean" });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input parameters",
        details: errors,
      },
    });
    return;
  }

  req.body.employeeId = sanitizeString(employeeId);
  if (hasNameField) req.body.name = sanitizeString(name);
  if (hasEmailField) req.body.email = sanitizeString(email);
  if (hasDepartmentField) req.body.department = sanitizeString(department);

  next();
}

export function validateDeleteEmployee(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors: ValidationErrorDetail[] = [];
  const { employeeId } = req.body;

  if (!employeeId || employeeId.trim().length === 0) {
    errors.push({ field: "employeeId", message: "Employee ID is required" });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input parameters",
        details: errors,
      },
    });
    return;
  }

  req.body.employeeId = sanitizeString(employeeId);
  next();
}

export function validateEmployeeSearch(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { page, limit, search, department, isActive } = req.query;

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Page must be a positive number",
      },
    });
    return;
  }

  if (
    limit &&
    (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Limit must be a number between 1 and 100",
      },
    });
    return;
  }

  if (search && typeof search === "string" && search.length > 100) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Search term must be less than 100 characters",
      },
    });
    return;
  }

  if (department && typeof department === "string" && department.length > 50) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Department filter must be less than 50 characters",
      },
    });
    return;
  }

  if (isActive && !["true", "false", "all"].includes(isActive as string)) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "isActive must be 'true', 'false', or 'all'",
      },
    });
    return;
  }

  next();
}

export function validateTaskId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { taskId } = req.params;

  if (!taskId || taskId.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Task ID is required",
      },
    });
    return;
  }

  next();
}

export function validateCreateTask(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors: ValidationErrorDetail[] = [];
  const { title, description, assignedTo, priority, dueDate } = req.body;

  if (!title || title.trim().length === 0) {
    errors.push({ field: "title", message: "Title is required" });
  } else if (title.length > 200) {
    errors.push({
      field: "title",
      message: "Title must be less than 200 characters",
    });
  }

  if (!description || description.trim().length === 0) {
    errors.push({ field: "description", message: "Description is required" });
  } else if (description.length > 1000) {
    errors.push({
      field: "description",
      message: "Description must be less than 1000 characters",
    });
  }

  if (!priority) {
    errors.push({ field: "priority", message: "Priority is required" });
  } else if (!["low", "medium", "high"].includes(priority)) {
    errors.push({
      field: "priority",
      message: "Priority must be 'low', 'medium', or 'high'",
    });
  }

  if (
    assignedTo &&
    (typeof assignedTo !== "string" || assignedTo.trim().length === 0)
  ) {
    errors.push({
      field: "assignedTo",
      message: "Assigned employee ID must be a non-empty string",
    });
  }

  if (dueDate) {
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push({
        field: "dueDate",
        message: "Due date must be a valid date",
      });
    } else if (parsedDate < new Date()) {
      errors.push({
        field: "dueDate",
        message: "Due date cannot be in the past",
      });
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input parameters",
        details: errors,
      },
    });
    return;
  }

  req.body.title = sanitizeString(title);
  req.body.description = sanitizeString(description);
  if (assignedTo) req.body.assignedTo = sanitizeString(assignedTo);

  next();
}

export function validateDeleteTask(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors: ValidationErrorDetail[] = [];
  const { taskId } = req.body;

  if (!taskId || taskId.trim().length === 0) {
    errors.push({ field: "taskId", message: "Task ID is required" });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input parameters",
        details: errors,
      },
    });
    return;
  }

  req.body.taskId = sanitizeString(taskId);
  next();
}

export function validateTaskSearch(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { page, limit, search, status, priority, assignedTo } = req.query;

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Page must be a positive number",
      },
    });
    return;
  }

  if (
    limit &&
    (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Limit must be a number between 1 and 100",
      },
    });
    return;
  }

  if (search && typeof search === "string" && search.length > 100) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Search term must be less than 100 characters",
      },
    });
    return;
  }

  if (
    status &&
    !["pending", "in_progress", "completed", "cancelled", "all"].includes(
      status as string
    )
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          "Status must be 'pending', 'in_progress', 'completed', 'cancelled', or 'all'",
      },
    });
    return;
  }

  if (
    priority &&
    !["low", "medium", "high", "all"].includes(priority as string)
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Priority must be 'low', 'medium', 'high', or 'all'",
      },
    });
    return;
  }

  if (assignedTo && typeof assignedTo === "string" && assignedTo.length > 50) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Assigned employee ID must be less than 50 characters",
      },
    });
    return;
  }

  next();
}
export function validateUpdateTask(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors: ValidationErrorDetail[] = [];
  const { taskId, title, description, assignedTo, status, priority, dueDate } =
    req.body;

  if (!taskId || taskId.trim().length === 0) {
    errors.push({ field: "taskId", message: "Task ID is required" });
  }

  const hasTitleField = title !== undefined;
  const hasDescriptionField = description !== undefined;
  const hasAssignedToField = assignedTo !== undefined;
  const hasStatusField = status !== undefined;
  const hasPriorityField = priority !== undefined;
  const hasDueDateField = dueDate !== undefined;

  if (
    !hasTitleField &&
    !hasDescriptionField &&
    !hasAssignedToField &&
    !hasStatusField &&
    !hasPriorityField &&
    !hasDueDateField
  ) {
    errors.push({
      field: "update",
      message:
        "At least one field (title, description, assignedTo, status, priority, or dueDate) must be provided for update",
    });
  }

  if (hasTitleField) {
    if (typeof title !== "string" || title.trim().length === 0) {
      errors.push({
        field: "title",
        message: "Title must be a non-empty string",
      });
    } else if (title.length > 200) {
      errors.push({
        field: "title",
        message: "Title must be less than 200 characters",
      });
    }
  }

  if (hasDescriptionField) {
    if (typeof description !== "string" || description.trim().length === 0) {
      errors.push({
        field: "description",
        message: "Description must be a non-empty string",
      });
    } else if (description.length > 1000) {
      errors.push({
        field: "description",
        message: "Description must be less than 1000 characters",
      });
    }
  }

  if (hasAssignedToField) {
    if (
      assignedTo !== null &&
      (typeof assignedTo !== "string" || assignedTo.trim().length === 0)
    ) {
      errors.push({
        field: "assignedTo",
        message:
          "Assigned employee ID must be a non-empty string or null to unassign",
      });
    }
  }

  if (
    hasStatusField &&
    !["pending", "in_progress", "completed", "cancelled"].includes(status)
  ) {
    errors.push({
      field: "status",
      message:
        "Status must be 'pending', 'in_progress', 'completed', or 'cancelled'",
    });
  }

  if (hasPriorityField && !["low", "medium", "high"].includes(priority)) {
    errors.push({
      field: "priority",
      message: "Priority must be 'low', 'medium', or 'high'",
    });
  }

  if (hasDueDateField) {
    if (dueDate !== null) {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate.getTime())) {
        errors.push({
          field: "dueDate",
          message: "Due date must be a valid date or null to remove due date",
        });
      }
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input parameters",
        details: errors,
      },
    });
    return;
  }

  req.body.taskId = sanitizeString(taskId);
  if (hasTitleField) req.body.title = sanitizeString(title);
  if (hasDescriptionField) req.body.description = sanitizeString(description);
  if (hasAssignedToField && assignedTo !== null)
    req.body.assignedTo = sanitizeString(assignedTo);

  next();
}

export function validateAccountSetup(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors: ValidationErrorDetail[] = [];
  const { token, username, password } = req.body;

  if (!token || token.trim().length === 0) {
    errors.push({ field: "token", message: "Setup token is required" });
  } else if (token.length < 32) {
    errors.push({ field: "token", message: "Invalid setup token format" });
  }

  if (!username || username.trim().length === 0) {
    errors.push({ field: "username", message: "Username is required" });
  } else if (username.length < 3) {
    errors.push({
      field: "username",
      message: "Username must be at least 3 characters long",
    });
  } else if (username.length > 30) {
    errors.push({
      field: "username",
      message: "Username must be less than 30 characters long",
    });
  } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push({
      field: "username",
      message:
        "Username can only contain letters, numbers, underscores, and hyphens",
    });
  } else if (/^\d/.test(username)) {
    errors.push({
      field: "username",
      message: "Username cannot start with a number",
    });
  }

  if (!password || password.trim().length === 0) {
    errors.push({ field: "password", message: "Password is required" });
  } else if (password.length < 8) {
    errors.push({
      field: "password",
      message: "Password must be at least 8 characters long",
    });
  } else if (password.length > 128) {
    errors.push({
      field: "password",
      message: "Password must be less than 128 characters long",
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input parameters",
        details: errors,
      },
    });
    return;
  }

  req.body.token = sanitizeString(token);
  req.body.username = sanitizeString(username);

  next();
}
export function validateEmployeeTaskSearch(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { page, limit, search, status, priority } = req.query;

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Page must be a positive number",
      },
    });
    return;
  }

  if (
    limit &&
    (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Limit must be a number between 1 and 100",
      },
    });
    return;
  }

  if (search && typeof search === "string" && search.length > 100) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Search term must be less than 100 characters",
      },
    });
    return;
  }

  if (
    status &&
    !["pending", "in_progress", "completed", "cancelled", "all"].includes(
      status as string
    )
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          "Status must be 'pending', 'in_progress', 'completed', 'cancelled', or 'all'",
      },
    });
    return;
  }

  if (
    priority &&
    !["low", "medium", "high", "all"].includes(priority as string)
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Priority must be 'low', 'medium', 'high', or 'all'",
      },
    });
    return;
  }

  next();
}

export function validateEmployeeLogin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors: ValidationErrorDetail[] = [];
  const { username, password } = req.body;

  if (!username || username.trim().length === 0) {
    errors.push({ field: "username", message: "Username is required" });
  }

  if (!password || password.trim().length === 0) {
    errors.push({ field: "password", message: "Password is required" });
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input parameters",
        details: errors,
      },
    });
    return;
  }

  req.body.username = sanitizeString(username);

  next();
}
