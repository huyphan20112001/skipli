import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { getMe } from "../controllers/auth";

const router = Router();

// Get current user information (works for both owners and employees)
router.get("/me", authenticateToken, getMe);

export default router;
