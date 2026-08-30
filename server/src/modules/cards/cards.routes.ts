import { Router } from "express";
import { asyncHandler } from "../../lib/http.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireProjectRole } from "../../middleware/requireProjectRole.js";
import { resolveProjectFromBoard } from "../../middleware/resolveScope.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./cards.controller.js";
import {
  boardScopeParams,
  cardParams,
  createCardSchema,
  moveCardSchema,
  updateCardSchema,
} from "./cards.schema.js";

// Mounted at /api/v1/boards/:boardId/cards
export const cardsRouter: Router = Router({ mergeParams: true });

cardsRouter.use(requireAuth, resolveProjectFromBoard);
const canWork = requireProjectRole("head", "member");

cardsRouter.get("/", validate(boardScopeParams), canWork, asyncHandler(controller.list));
cardsRouter.post("/", validate(createCardSchema), canWork, asyncHandler(controller.create));
cardsRouter.get("/:cardId", validate(cardParams), canWork, asyncHandler(controller.detail));
cardsRouter.patch(
  "/:cardId",
  validate(updateCardSchema),
  canWork,
  asyncHandler(controller.update),
);
cardsRouter.patch(
  "/:cardId/move",
  validate(moveCardSchema),
  canWork,
  asyncHandler(controller.move),
);
cardsRouter.delete(
  "/:cardId",
  validate(cardParams),
  canWork,
  asyncHandler(controller.remove),
);
