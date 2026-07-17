import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { validateTaskBody } from "../middleware/validation";
import * as taskController from "../controllers/task.controller";

const router = Router();
router.use(requireAuth);

// Role-aware dashboard numbers (admin: system-wide, member: own tasks only).
router.get("/stats", taskController.getStats);

// Listing/reading is scoped by role inside the controller: Admin -> all
// tasks, Member -> only tasks assigned to them.
router.get("/", taskController.listTasks);
router.get("/:id", taskController.getTask);

// Creating, full editing, assigning and deleting are Admin-only.
router.post("/", requireAdmin, validateTaskBody, taskController.createTask);
router.put("/:id", requireAdmin, taskController.updateTask);
router.delete("/:id", requireAdmin, taskController.deleteTask);

// A Member's one write privilege: move their own assigned task between
// statuses. Ownership is checked inside the controller.
router.patch("/:id/status", taskController.updateOwnTaskStatus);

export default router;
