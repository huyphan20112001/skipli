import { Router } from "express";
import {
  validateTaskId,
  validateCreateTask,
  validateDeleteTask,
  validateTaskSearch,
  validateUpdateTask,
  validateEmployeeTaskSearch,
} from "../middleware/validation";
import {
  authenticateToken,
  requireOwner,
  requireEmployee,
} from "../middleware/auth";
import {
  getTaskDetails,
  createTask,
  deleteTask,
  getTaskList,
  updateTask,
  getEmployeeTaskList,
} from "../controllers/task";

const router = Router();

router.post(
  "/create",
  authenticateToken,
  requireOwner,
  validateCreateTask,
  createTask
);

router.post(
  "/delete",
  authenticateToken,
  requireOwner,
  validateDeleteTask,
  deleteTask
);

router.put("/update", authenticateToken, validateUpdateTask, updateTask);

router.get(
  "/search",
  authenticateToken,
  requireOwner,
  validateTaskSearch,
  getTaskList
);

router.put("/:taskId", authenticateToken, validateTaskId, updateTask);

router.delete(
  "/:taskId",
  authenticateToken,
  requireOwner,
  validateTaskId,
  deleteTask
);

router.get("/:taskId", authenticateToken, validateTaskId, getTaskDetails);

router.get(
  "/employee/assigned",
  authenticateToken,
  requireEmployee,
  validateEmployeeTaskSearch,
  getEmployeeTaskList
);

export default router;
