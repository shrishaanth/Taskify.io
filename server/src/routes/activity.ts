import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as activityController from "../controllers/activity.controller";

const router = Router();
router.use(requireAuth);

// Role-scoped inside the controller: Admin -> everything, Member -> only
// entries about them.
router.get("/", activityController.listActivity);

export default router;
