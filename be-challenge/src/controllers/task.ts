import { Request, Response } from "express";
import FirebaseService from "../services/firebase";
import { logger } from "../utils/logger";
import {
  ApiResponse,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  DeleteTaskRequest,
  UserRole,
} from "../types";

const firebaseService = FirebaseService.getInstance();
const TASKS_COLLECTION = "tasks";

export async function getTaskDetails(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    logger.info("Retrieving task details", { taskId, userId, userRole });

    const taskDoc = await firebaseService.getDocument(TASKS_COLLECTION, taskId);

    if (!taskDoc) {
      logger.warn("Task not found", { taskId, userId });

      const response: ApiResponse = {
        success: false,
        message: "Task not found",
        error: {
          code: "TASK_NOT_FOUND",
          message: "Task not found",
        },
      };

      res.status(404).json(response);
      return;
    }

    if (userRole === UserRole.OWNER) {
      if (taskDoc.createdBy !== userId) {
        logger.warn("Unauthorized access to task by owner", {
          taskId,
          userId,
          createdBy: taskDoc.createdBy,
        });

        const response: ApiResponse = {
          success: false,
          message: "You can only view tasks you created",
          error: {
            code: "UNAUTHORIZED_ACCESS",
            message: "You can only view tasks you created",
          },
        };

        res.status(403).json(response);
        return;
      }
    } else if (userRole === UserRole.EMPLOYEE) {
      if (taskDoc.assignedTo !== userId) {
        logger.warn("Unauthorized access to task by employee", {
          taskId,
          userId,
          assignedTo: taskDoc.assignedTo,
        });

        const response: ApiResponse = {
          success: false,
          message: "You can only view tasks assigned to you",
          error: {
            code: "UNAUTHORIZED_ACCESS",
            message: "You can only view tasks assigned to you",
          },
        };

        res.status(403).json(response);
        return;
      }
    }

    logger.info("Task details retrieved successfully", { taskId, userId });

    const response: ApiResponse = {
      success: true,
      message: "Task details retrieved successfully",
      data: {
        task: {
          ...taskDoc,
          id: taskId,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error retrieving task details", {
      taskId: req.params.taskId,
      userId: req.user?.userId,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to retrieve task details. Please try again.",
      error: {
        code: "TASK_RETRIEVAL_FAILED",
        message: "Failed to retrieve task details. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}

export async function createTask(req: Request, res: Response): Promise<void> {
  try {
    const {
      title,
      description,
      assignedTo,
      priority,
      dueDate,
    }: CreateTaskRequest = req.body;
    const ownerId = req.user?.userId;

    logger.info("Creating new task", { title, assignedTo, priority, ownerId });

    if (assignedTo) {
      const employeeDoc = await firebaseService.getDocument(
        "employees",
        assignedTo
      );

      if (!employeeDoc) {
        logger.warn("Assigned employee not found", { assignedTo, ownerId });

        const response: ApiResponse = {
          success: false,
          message: "Assigned employee not found",
          error: {
            code: "EMPLOYEE_NOT_FOUND",
            message: "Assigned employee not found",
          },
        };

        res.status(404).json(response);
        return;
      }

      if (employeeDoc.createdBy !== ownerId) {
        logger.warn("Cannot assign task to employee from different owner", {
          assignedTo,
          ownerId,
          employeeCreatedBy: employeeDoc.createdBy,
        });

        const response: ApiResponse = {
          success: false,
          message: "You can only assign tasks to employees you manage",
          error: {
            code: "UNAUTHORIZED_ASSIGNMENT",
            message: "You can only assign tasks to employees you manage",
          },
        };

        res.status(403).json(response);
        return;
      }

      if (!employeeDoc.isActive) {
        logger.warn("Cannot assign task to inactive employee", {
          assignedTo,
          ownerId,
        });

        const response: ApiResponse = {
          success: false,
          message: "Cannot assign task to inactive employee",
          error: {
            code: "EMPLOYEE_INACTIVE",
            message: "Cannot assign task to inactive employee",
          },
        };

        res.status(400).json(response);
        return;
      }
    }

    const newTask: Omit<Task, "id"> = {
      title,
      description,
      assignedTo: assignedTo || undefined,
      status: "pending",
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdAt: new Date(),
      createdBy: ownerId!,
    };

    const taskId = await firebaseService.createDocument(
      TASKS_COLLECTION,
      newTask
    );

    logger.info("Task created successfully", {
      taskId,
      title,
      assignedTo,
      ownerId,
    });

    const response: ApiResponse = {
      success: true,
      message: "Task created successfully",
      data: {
        taskId,
        task: {
          id: taskId,
          ...newTask,
        },
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error("Error creating task", {
      title: req.body.title,
      ownerId: req.user?.userId,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to create task. Please try again.",
      error: {
        code: "TASK_CREATION_FAILED",
        message: "Failed to create task. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  try {
    const taskId = req.params.taskId || req.body.taskId;
    const ownerId = req.user?.userId;

    logger.info("Deleting task", { taskId, ownerId });

    const taskDoc = await firebaseService.getDocument(TASKS_COLLECTION, taskId);

    if (!taskDoc) {
      logger.warn("Task not found for deletion", { taskId, ownerId });

      const response: ApiResponse = {
        success: false,
        message: "Task not found",
        error: {
          code: "TASK_NOT_FOUND",
          message: "Task not found",
        },
      };

      res.status(404).json(response);
      return;
    }

    if (taskDoc.createdBy !== ownerId) {
      logger.warn("Unauthorized delete attempt", {
        taskId,
        ownerId,
        createdBy: taskDoc.createdBy,
      });

      const response: ApiResponse = {
        success: false,
        message: "You can only delete tasks you created",
        error: {
          code: "UNAUTHORIZED_DELETE",
          message: "You can only delete tasks you created",
        },
      };

      res.status(403).json(response);
      return;
    }

    await firebaseService.deleteDocument(TASKS_COLLECTION, taskId);

    logger.info("Task deleted successfully", {
      taskId,
      deletedBy: ownerId,
    });

    const response: ApiResponse = {
      success: true,
      message: "Task deleted successfully",
      data: {
        taskId,
        deletedAt: new Date(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error deleting task", {
      taskId: req.params.taskId || req.body.taskId,
      ownerId: req.user?.userId,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to delete task. Please try again.",
      error: {
        code: "TASK_DELETION_FAILED",
        message: "Failed to delete task. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}

export async function getTaskList(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user?.userId;
    const {
      search = "",
      page = "1",
      limit = "10",
      status = "all",
      priority = "all",
      assignedTo = "",
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    logger.info("Getting task list", {
      ownerId,
      search,
      page: pageNum,
      limit: limitNum,
      status,
      priority,
      assignedTo,
    });

    const tasksCollection = firebaseService.getCollection(TASKS_COLLECTION);
    let query = tasksCollection.where("createdBy", "==", ownerId);

    if (status !== "all") {
      query = query.where("status", "==", status);
    }

    if (priority !== "all") {
      query = query.where("priority", "==", priority);
    }

    if (
      assignedTo &&
      typeof assignedTo === "string" &&
      assignedTo.trim() !== ""
    ) {
      query = query.where("assignedTo", "==", assignedTo.trim());
    }

    const querySnapshot = await query.get();

    let tasks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (Task & { id: string })[];

    if (search && typeof search === "string" && search.trim() !== "") {
      const searchTerm = search.toLowerCase().trim();
      tasks = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm) ||
          task.description.toLowerCase().includes(searchTerm)
      );
    }

    tasks.sort((a, b) => {
      const dateA =
        a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB =
        b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    const total = tasks.length;
    const paginatedTasks = tasks.slice(offset, offset + limitNum);

    logger.info("Task list retrieved successfully", {
      ownerId,
      total,
      returned: paginatedTasks.length,
      page: pageNum,
      limit: limitNum,
    });

    const response: ApiResponse = {
      success: true,
      message: "Task list retrieved successfully",
      data: {
        tasks: paginatedTasks,
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
          status: status.toString(),
          priority: priority.toString(),
          assignedTo: assignedTo.toString(),
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error retrieving task list", {
      ownerId: req.user?.userId,
      query: req.query,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to retrieve task list. Please try again.",
      error: {
        code: "TASK_LIST_RETRIEVAL_FAILED",
        message: "Failed to retrieve task list. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}

export async function getEmployeeTaskList(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const employeeId = req.user?.userId;
    const {
      search = "",
      page = "1",
      limit = "10",
      status = "all",
      priority = "all",
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    logger.info("Getting employee task list", {
      employeeId,
      search,
      page: pageNum,
      limit: limitNum,
      status,
      priority,
    });

    const tasksCollection = firebaseService.getCollection(TASKS_COLLECTION);
    let query = tasksCollection.where("assignedTo", "==", employeeId);

    if (status !== "all") {
      query = query.where("status", "==", status);
    }

    if (priority !== "all") {
      query = query.where("priority", "==", priority);
    }

    const querySnapshot = await query.get();

    let tasks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (Task & { id: string })[];

    if (search && typeof search === "string" && search.trim() !== "") {
      const searchTerm = search.toLowerCase().trim();
      tasks = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm) ||
          task.description.toLowerCase().includes(searchTerm)
      );
    }

    tasks.sort((a, b) => {
      const dateA =
        a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB =
        b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    const total = tasks.length;
    const paginatedTasks = tasks.slice(offset, offset + limitNum);

    logger.info("Employee task list retrieved successfully", {
      employeeId,
      total,
      returned: paginatedTasks.length,
      page: pageNum,
      limit: limitNum,
    });

    const response: ApiResponse = {
      success: true,
      message: "Employee task list retrieved successfully",
      data: {
        tasks: paginatedTasks,
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
          status: status.toString(),
          priority: priority.toString(),
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error retrieving employee task list", {
      employeeId: req.user?.userId,
      query: req.query,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to retrieve employee task list. Please try again.",
      error: {
        code: "EMPLOYEE_TASK_LIST_RETRIEVAL_FAILED",
        message: "Failed to retrieve employee task list. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  try {
    const taskId = req.params.taskId || req.body.taskId;
    const { title, description, assignedTo, status, priority, dueDate } =
      req.body;
    const ownerId = req.user?.userId;

    logger.info("Updating task", {
      taskId,
      ownerId,
      fieldsToUpdate: {
        title,
        description,
        assignedTo,
        status,
        priority,
        dueDate,
      },
    });

    const taskDoc = await firebaseService.getDocument(TASKS_COLLECTION, taskId);

    if (!taskDoc) {
      logger.warn("Task not found for update", { taskId, ownerId });

      const response: ApiResponse = {
        success: false,
        message: "Task not found",
        error: {
          code: "TASK_NOT_FOUND",
          message: "Task not found",
        },
      };

      res.status(404).json(response);
      return;
    }

    if (assignedTo !== undefined && assignedTo !== null) {
      const employeeDoc = await firebaseService.getDocument(
        "employees",
        assignedTo
      );

      if (!employeeDoc) {
        logger.warn("Assigned employee not found", {
          assignedTo,
          ownerId,
          taskId,
        });

        const response: ApiResponse = {
          success: false,
          message: "Assigned employee not found",
          error: {
            code: "EMPLOYEE_NOT_FOUND",
            message: "Assigned employee not found",
          },
        };

        res.status(404).json(response);
        return;
      }

      if (employeeDoc.createdBy !== ownerId) {
        logger.warn("Cannot assign task to employee from different owner", {
          assignedTo,
          ownerId,
          taskId,
          employeeCreatedBy: employeeDoc.createdBy,
        });

        const response: ApiResponse = {
          success: false,
          message: "You can only assign tasks to employees you manage",
          error: {
            code: "UNAUTHORIZED_ASSIGNMENT",
            message: "You can only assign tasks to employees you manage",
          },
        };

        res.status(403).json(response);
        return;
      }

      if (!employeeDoc.isActive) {
        logger.warn("Cannot assign task to inactive employee", {
          assignedTo,
          ownerId,
          taskId,
        });

        const response: ApiResponse = {
          success: false,
          message: "Cannot assign task to inactive employee",
          error: {
            code: "EMPLOYEE_INACTIVE",
            message: "Cannot assign task to inactive employee",
          },
        };

        res.status(400).json(response);
        return;
      }
    }

    const updateData: Partial<Task> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assignedTo !== undefined)
      updateData.assignedTo = assignedTo || undefined;
    if (status !== undefined) {
      updateData.status = status;

      if (status === "completed" && taskDoc.status !== "completed") {
        updateData.completedAt = new Date();
      } else if (status !== "completed") {
        updateData.completedAt = undefined;
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined)
      updateData.dueDate = dueDate ? new Date(dueDate) : undefined;

    await firebaseService.updateDocument(TASKS_COLLECTION, taskId, updateData);

    logger.info("Task updated successfully", {
      taskId,
      updatedBy: ownerId,
      updatedFields: Object.keys(updateData).filter(
        (key) => key !== "updatedAt"
      ),
    });

    const updatedTaskDoc = await firebaseService.getDocument(
      TASKS_COLLECTION,
      taskId
    );

    const response: ApiResponse = {
      success: true,
      message: "Task updated successfully",
      data: {
        task: {
          ...updatedTaskDoc,
          id: taskId,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error updating task", {
      taskId: req.params.taskId || req.body.taskId,
      ownerId: req.user?.userId,
      error: error instanceof Error ? error.message : error,
    });

    const response: ApiResponse = {
      success: false,
      message: "Failed to update task. Please try again.",
      error: {
        code: "TASK_UPDATE_FAILED",
        message: "Failed to update task. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    res.status(500).json(response);
  }
}
