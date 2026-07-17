import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { ActivityModel } from "../models/activity.model";
import { toPublicActivity } from "../services/activity";

/**
 * Scoped exactly like tasks: an Admin sees the whole feed, a Member sees
 * only entries that concern them (their tasks being created/edited/etc.).
 */
export async function listActivity(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const filter = req.user!.role === "admin" ? {} : { targetUser: req.user!.userId };
    const entries = await ActivityModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(entries.map(toPublicActivity));
  } catch (error) { next(error); }
}
