import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../lib/errors.js";
import { asyncHandler, auth } from "../../lib/http.js";
import { notifyCommentOnCard } from "../../lib/notify.js";
import { commentDto } from "../../lib/serialize.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  requireBoardAccessOrOrgManager,
  requireProjectRole,
} from "../../middleware/requireProjectRole.js";
import { resolveProjectFromCard } from "../../middleware/resolveScope.js";
import { validate } from "../../middleware/validate.js";
import { CardModel, CommentModel } from "../../models/index.js";
import { canDeleteAuthored } from "./childScope.js";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);
const canWork = requireProjectRole("head", "member");

// Mounted at /api/v1/cards/:cardId/comments
export const commentsRouter: Router = Router({ mergeParams: true });
commentsRouter.use(requireAuth, resolveProjectFromCard);

commentsRouter.get(
  "/",
  validate({ params: z.object({ cardId: objectId }) }),
  canWork,
  asyncHandler(async (req, res) => {
    const rows = await CommentModel.find({ cardId: req.params.cardId })
      .sort({ createdAt: 1 })
      .lean();
    res.json(rows.map(commentDto));
  }),
);

commentsRouter.post(
  "/",
  validate({
    params: z.object({ cardId: objectId }),
    body: z.object({ body: z.string().trim().min(1).max(10000) }),
  }),
  canWork,
  asyncHandler(async (req, res) => {
    const me = auth(req).userId;
    const comment = await CommentModel.create({
      cardId: req.params.cardId,
      authorId: me,
      body: req.body.body,
    });

    // UC-8 — notify the card's assignees, except the author.
    const card = await CardModel.findById(req.params.cardId)
      .select("title assigneeIds")
      .lean();
    if (card) {
      await notifyCommentOnCard(
        card.assigneeIds.map(String),
        { id: req.params.cardId, title: card.title },
        me,
      );
    }

    res.status(201).json(commentDto(comment));
  }),
);

commentsRouter.delete(
  "/:commentId",
  validate({ params: z.object({ cardId: objectId, commentId: objectId }) }),
  requireBoardAccessOrOrgManager(),
  asyncHandler(async (req, res) => {
    const comment = await CommentModel.findOne({
      _id: req.params.commentId,
      cardId: req.params.cardId,
    });
    if (!comment) throw AppError.notFound();
    if (!canDeleteAuthored(req, String(comment.authorId))) {
      throw AppError.forbidden("Only the author, a Project Head, or an Org Owner/Admin can delete this comment");
    }
    await comment.deleteOne();
    res.status(204).end();
  }),
);
