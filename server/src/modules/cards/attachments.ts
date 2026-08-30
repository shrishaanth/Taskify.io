import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../lib/errors.js";
import { asyncHandler, auth } from "../../lib/http.js";
import { attachmentDto } from "../../lib/serialize.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  requireBoardAccessOrOrgManager,
  requireProjectRole,
} from "../../middleware/requireProjectRole.js";
import { resolveProjectFromCard } from "../../middleware/resolveScope.js";
import { validate } from "../../middleware/validate.js";
import { AttachmentModel } from "../../models/index.js";
import { canDeleteAuthored } from "./childScope.js";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);
const canWork = requireProjectRole("head", "member");

/**
 * No pluggable file-storage backend in this scope (vision "out of scope").
 * The client uploads the file elsewhere and POSTs the resulting metadata here.
 */
// Mounted at /api/v1/cards/:cardId/attachments
export const attachmentsRouter: Router = Router({ mergeParams: true });
attachmentsRouter.use(requireAuth, resolveProjectFromCard);

attachmentsRouter.get(
  "/",
  validate({ params: z.object({ cardId: objectId }) }),
  canWork,
  asyncHandler(async (req, res) => {
    const rows = await AttachmentModel.find({ cardId: req.params.cardId })
      .sort({ createdAt: 1 })
      .lean();
    res.json(rows.map(attachmentDto));
  }),
);

attachmentsRouter.post(
  "/",
  validate({
    params: z.object({ cardId: objectId }),
    body: z.object({
      fileName: z.string().trim().min(1).max(300),
      fileUrl: z.string().url().max(2000),
      mimeType: z.string().min(1).max(200),
      sizeBytes: z.number().int().min(0).max(50 * 1024 * 1024),
    }),
  }),
  canWork,
  asyncHandler(async (req, res) => {
    const doc = await AttachmentModel.create({
      cardId: req.params.cardId,
      uploadedById: auth(req).userId,
      fileName: req.body.fileName,
      fileUrl: req.body.fileUrl,
      mimeType: req.body.mimeType,
      sizeBytes: req.body.sizeBytes,
    });
    res.status(201).json(attachmentDto(doc));
  }),
);

attachmentsRouter.delete(
  "/:attachmentId",
  validate({ params: z.object({ cardId: objectId, attachmentId: objectId }) }),
  requireBoardAccessOrOrgManager(),
  asyncHandler(async (req, res) => {
    const att = await AttachmentModel.findOne({
      _id: req.params.attachmentId,
      cardId: req.params.cardId,
    });
    if (!att) throw AppError.notFound();
    if (!canDeleteAuthored(req, String(att.uploadedById))) {
      throw AppError.forbidden(
        "Only the uploader, a Project Head, or an Org Owner/Admin can delete this attachment",
      );
    }
    await att.deleteOne();
    res.status(204).end();
  }),
);
