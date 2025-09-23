import { Router } from "express";
import {
  validateTaskId,
  validateCreateTask,
  validateDeleteTask,
  validateTaskSearch,
  validateUpdateTask,
} from "../middleware/validation";
import { authenticateToken, requireOwner } from "../middleware/auth";
import {
  getTaskDetails,
  createTask,
  deleteTask,
  getTaskList,
  updateTask,
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

router.put(
  "/update",
  authenticateToken,
  requireOwner,
  validateUpdateTask,
  updateTask
);

router.get(
  "/search",
  authenticateToken,
  requireOwner,
  validateTaskSearch,
  getTaskList
);

router.put(
  "/:taskId",
  authenticateToken,
  requireOwner,
  validateTaskId,
  updateTask
);

router.delete(
  "/:taskId",
  authenticateToken,
  requireOwner,
  validateTaskId,
  deleteTask
);

router.get("/:taskId", authenticateToken, validateTaskId, getTaskDetails);

export default router;
