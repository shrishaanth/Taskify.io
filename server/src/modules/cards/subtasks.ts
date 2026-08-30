import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../lib/errors.js";
import { asyncHandler } from "../../lib/http.js";
import { subtaskDto } from "../../lib/serialize.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireProjectRole } from "../../middleware/requireProjectRole.js";
import { resolveProjectFromCard } from "../../middleware/resolveScope.js";
import { validate } from "../../middleware/validate.js";
import { SubtaskModel } from "../../models/index.js";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

// Mounted at /api/v1/cards/:cardId/subtasks
export const subtasksRouter: Router = Router({ mergeParams: true });
subtasksRouter.use(requireAuth, resolveProjectFromCard, requireProjectRole("head", "member"));

subtasksRouter.get(
  "/",
  validate({ params: z.object({ cardId: objectId }) }),
  asyncHandler(async (req, res) => {
    const rows = await SubtaskModel.find({ cardId: req.params.cardId })
      .sort({ createdAt: 1 })
      .lean();
    res.json(rows.map(subtaskDto));
  }),
);

subtasksRouter.post(
  "/",
  validate({
    params: z.object({ cardId: objectId }),
    body: z.object({
      title: z.string().trim().min(1).max(300),
      assigneeId: objectId.nullable().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const doc = await SubtaskModel.create({
      cardId: req.params.cardId,
      title: req.body.title,
      done: false,
      ...(req.body.assigneeId ? { assigneeId: req.body.assigneeId } : {}),
    });
    res.status(201).json(subtaskDto(doc));
  }),
);

subtasksRouter.patch(
  "/:subtaskId",
  validate({
    params: z.object({ cardId: objectId, subtaskId: objectId }),
    body: z
      .object({
        title: z.string().trim().min(1).max(300).optional(),
        assigneeId: objectId.nullable().optional(),
        done: z.boolean().optional(),
      })
      .refine((b) => Object.keys(b).length > 0, { message: "Nothing to update" }),
  }),
  asyncHandler(async (req, res) => {
    const doc = await SubtaskModel.findOne({
      _id: req.params.subtaskId,
      cardId: req.params.cardId,
    });
    if (!doc) throw AppError.notFound();
    if (req.body.title !== undefined) doc.title = req.body.title;
    if (req.body.done !== undefined) doc.done = req.body.done;
    if (req.body.assigneeId !== undefined) {
      if (req.body.assigneeId === null) doc.set("assigneeId", undefined);
      else doc.assigneeId = req.body.assigneeId;
    }
    await doc.save();
    res.json(subtaskDto(doc));
  }),
);

subtasksRouter.delete(
  "/:subtaskId",
  validate({ params: z.object({ cardId: objectId, subtaskId: objectId }) }),
  asyncHandler(async (req, res) => {
    const r = await SubtaskModel.deleteOne({
      _id: req.params.subtaskId,
      cardId: req.params.cardId,
    });
    if (r.deletedCount === 0) throw AppError.notFound();
    res.status(204).end();
  }),
);
