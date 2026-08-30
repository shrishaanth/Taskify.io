import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../lib/errors.js";
import { asyncHandler, auth } from "../../lib/http.js";
import { notificationDto } from "../../lib/serialize.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validate } from "../../middleware/validate.js";
import {
  paginationQuerySchema,
  toPageInfo,
} from "../../middleware/pagination.js";
import { NotificationModel } from "../../models/index.js";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i);

// Mounted at /api/v1/notifications — always self-scoped.
export const notificationsRouter: Router = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get(
  "/",
  validate({ query: paginationQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = toPageInfo(
      req.query as unknown as { page: number; limit: number },
    );
    const filter = { userId: auth(req).userId };
    const [items, total, unread] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({ ...filter, read: false }),
    ]);
    res.json({
      items: items.map(notificationDto),
      page,
      limit,
      total,
      unread,
    });
  }),
);

notificationsRouter.patch(
  "/read-all",
  asyncHandler(async (req, res) => {
    await NotificationModel.updateMany(
      { userId: auth(req).userId, read: false },
      { $set: { read: true } },
    );
    res.status(204).end();
  }),
);

notificationsRouter.patch(
  "/:id/read",
  validate({ params: z.object({ id: objectId }) }),
  asyncHandler(async (req, res) => {
    // Self-scoped: a notification for another user is simply "not found".
    const r = await NotificationModel.updateOne(
      { _id: req.params.id, userId: auth(req).userId },
      { $set: { read: true } },
    );
    if (r.matchedCount === 0) throw AppError.notFound();
    res.status(204).end();
  }),
);
