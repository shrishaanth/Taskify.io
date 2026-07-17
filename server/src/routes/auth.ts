import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateAuthBody } from "../middleware/validation";
import * as authController from "../controllers/auth.controller";

const router = Router();

// Open only until the very first (Admin) account exists.
router.get("/registration-status", authController.registrationStatus);
router.post("/register", authController.register);
router.post("/login", validateAuthBody, authController.login);
router.get("/me", requireAuth, authController.me);

export default router;
