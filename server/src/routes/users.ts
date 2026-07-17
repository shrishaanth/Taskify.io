import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import * as userController from "../controllers/user.controller";

const router = Router();
router.use(requireAuth);

// Self-service — any authenticated user, on their own account only.
router.put("/me", userController.updateOwnProfile);
router.put("/me/password", userController.changeOwnPassword);

// Admin-only user/member management. Members can never reach these routes.
router.get("/", requireAdmin, userController.listUsers);
router.post("/", requireAdmin, userController.createMember);
router.put("/:id", requireAdmin, userController.updateUser);
router.post("/:id/reset-password", requireAdmin, userController.resetPassword);
router.delete("/:id", requireAdmin, userController.deleteUser);

export default router;
