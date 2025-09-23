import { Router } from "express";
import ownerRoutes from "./owner";
import employeeRoutes from "./employee";
import taskRoutes from "./task";
import authRoutes from "./auth";

const router = Router();

router.use("/owner", ownerRoutes);

router.use("/employee", employeeRoutes);

router.use("/task", taskRoutes);

router.use("/auth", authRoutes);

export default router;
