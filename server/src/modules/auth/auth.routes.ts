import { Router } from "express";
import { asyncHandler } from "../../lib/http.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./auth.controller.js";
import { loginSchema, logoutSchema, refreshSchema, signupSchema } from "./auth.schema.js";

export const authRouter: Router = Router();

authRouter.post("/signup", validate(signupSchema), asyncHandler(controller.signup));
authRouter.post("/login", validate(loginSchema), asyncHandler(controller.login));
authRouter.post("/refresh", validate(refreshSchema), asyncHandler(controller.refresh));
authRouter.post("/logout", validate(logoutSchema), asyncHandler(controller.logout));
authRouter.post("/logout-all", requireAuth, asyncHandler(controller.logoutAll));
authRouter.get("/me", requireAuth, asyncHandler(controller.me));
