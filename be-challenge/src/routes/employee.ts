import { Router } from "express";
import {
  validateEmailLogin,
  validateAccessCodeRequest,
  validateCreateEmployee,
  validateUpdateEmployee,
  validateDeleteEmployee,
  validateEmployeeSearch,
  validateAccountSetup,
  validateEmployeeLogin,
} from "../middleware/validation";
import { authenticateToken, requireOwner } from "../middleware/auth";
import {
  loginEmail,
  validateAccessCode,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeList,
  validateSetupToken,
  completeAccountSetup,
  loginWithCredentials,
  getChatParticipants,
} from "../controllers/employee";

const router = Router();

router.post("/login-email", validateEmailLogin, loginEmail);

router.post("/login", validateEmployeeLogin, loginWithCredentials);

router.post(
  "/validate-access-code",
  validateAccessCodeRequest,
  validateAccessCode
);

router.post(
  "/create",
  authenticateToken,
  requireOwner,
  validateCreateEmployee,
  createEmployee
);

router.put(
  "/update",
  authenticateToken,
  requireOwner,
  validateUpdateEmployee,
  updateEmployee
);

router.post(
  "/delete",
  authenticateToken,
  requireOwner,
  validateDeleteEmployee,
  deleteEmployee
);

router.get(
  "/search",
  authenticateToken,
  requireOwner,
  validateEmployeeSearch,
  getEmployeeList
);

router.get("/setup/:token", validateSetupToken);

router.post("/setup", validateAccountSetup, completeAccountSetup);

router.get("/chat/participants", authenticateToken, getChatParticipants);

router.get("/:employeeId", authenticateToken, getEmployee);

export default router;
