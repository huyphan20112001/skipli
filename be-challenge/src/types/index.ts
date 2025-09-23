export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export enum UserRole {
  OWNER = "owner",
  EMPLOYEE = "employee",
}

export interface Owner {
  id: string;
  phoneNumber: string;
  accessCode: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  accessCode: string;
  username?: string;
  passwordHash?: string;
  setupToken?: string;
  setupTokenExpiry?: any;
  isActive: boolean;
  isSetupComplete: boolean;
  createdAt: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  createdBy: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: Date;
  messageType: "owner-to-employee" | "employee-to-owner";
  isRead: boolean;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface CreateAccessCodeRequest {
  phoneNumber: string;
}

export interface ValidateAccessCodeRequest {
  phoneNumber?: string;
  email?: string;
  accessCode: string;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  department: string;
}

export interface LoginEmailRequest {
  email: string;
}

export interface DeleteEmployeeRequest {
  employeeId: string;
}

export interface UpdateEmployeeRequest {
  employeeId: string;
  name?: string;
  email?: string;
  department?: string;
  isActive?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  completedAt?: Date;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  assignedTo?: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
}

export interface UpdateTaskRequest {
  taskId: string;
  title?: string;
  description?: string;
  assignedTo?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high";
  dueDate?: string;
}

export interface DeleteTaskRequest {
  taskId: string;
}

export interface SetupTokenValidationRequest {
  token: string;
}

export interface AccountSetupRequest {
  token: string;
  username: string;
  password: string;
}

export interface EmployeeLoginRequest {
  username: string;
  password: string;
}

export interface FirebaseCollectionMetadata {
  description: string;
  createdAt: Date;
  version: string;
  schema: any;
}
