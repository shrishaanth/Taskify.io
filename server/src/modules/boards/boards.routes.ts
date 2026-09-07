import { Router } from "express";
import { asyncHandler } from "../../lib/http.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireProjectRole } from "../../middleware/requireProjectRole.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./boards.controller.js";
import {
  boardParams,
  createBoardSchema,
  projectScopeParams,
  updateBoardSchema,
} from "./boards.schema.js";

export const boardsRouter: Router = Router({ mergeParams: true });

boardsRouter.use(requireAuth);
const canWork = requireProjectRole("head", "member");

boardsRouter.get("/", validate(projectScopeParams), canWork, asyncHandler(controller.list));
boardsRouter.post("/", validate(createBoardSchema), canWork, asyncHandler(controller.create));
boardsRouter.get("/:boardId", validate(boardParams), canWork, asyncHandler(controller.get));
boardsRouter.patch(
  "/:boardId",
  validate(updateBoardSchema),
  canWork,
  asyncHandler(controller.update),
);
boardsRouter.delete(
  "/:boardId",
  validate(boardParams),
  canWork,
  asyncHandler(controller.remove),
);
