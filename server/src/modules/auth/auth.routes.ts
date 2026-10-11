import { Router } from "express";
import { asyncHandler } from "../../lib/http.js";
import { credentialLimiter, refreshLimiter } from "../../middleware/rateLimit.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./auth.controller.js";
import {
  deleteAccountSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  signupSchema,
} from "./auth.schema.js";

export const authRouter: Router = Router();

authRouter.post("/signup", credentialLimiter, validate(signupSchema), asyncHandler(controller.signup));
authRouter.post("/login", credentialLimiter, validate(loginSchema), asyncHandler(controller.login));
authRouter.post("/refresh", refreshLimiter, validate(refreshSchema), asyncHandler(controller.refresh));
authRouter.post("/logout", validate(logoutSchema), asyncHandler(controller.logout));
authRouter.post("/logout-all", requireAuth, asyncHandler(controller.logoutAll));
authRouter.get("/me", requireAuth, asyncHandler(controller.me));
authRouter.get(
  "/me/deletion-preview",
  requireAuth,
  asyncHandler(controller.deletionPreview),
);
authRouter.delete(
  "/me",
  credentialLimiter,
  requireAuth,
  validate(deleteAccountSchema),
  asyncHandler(controller.deleteAccount),
);
