import { Router } from "express";
import {
  validateCreateAccessCode,
  validateAccessCodeRequest,
} from "../middleware/validation";
import { createAccessCode, validateAccessCode } from "../controllers/owner";

const router = Router();

router.post("/create-access-code", validateCreateAccessCode, createAccessCode);

router.post(
  "/validate-access-code",
  validateAccessCodeRequest,
  validateAccessCode
);

export default router;
