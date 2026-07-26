import { ActivityModel, ActivityDocument } from "../models/activity.model";
import { emitActivity } from "../realtime/socket";

export function toPublicActivity(doc: any) {
  return {
    id: doc._id.toString(),
    action: doc.action,
    actorName: doc.actorName,
    taskTitle: doc.taskTitle,
    targetUserId: doc.targetUser ? doc.targetUser.toString() : null,
    detail: doc.detail,
    createdAt: doc.createdAt,
  };
}

interface RecordArgs {
  action: ActivityDocument["action"];
  actorId: string;
  actorName: string;
  taskId?: string | null;
  taskTitle?: string | null;
  targetUserId?: string | null;
  detail?: string;
}

/**
 * Writes an audit entry and pushes it live to everyone entitled to see it.
 * Fire-and-forget from the controllers' perspective: an activity write
 * failing must never fail the request that triggered it.
 */
export async function recordActivity(args: RecordArgs): Promise<void> {
  try {
    const entry = await ActivityModel.create({
      organizationId: args.actorId, // placeholder — old service replaced in Phase 4
      action: args.action,
      actorId: args.actorId,
      actorName: args.actorName,
      targetType: 'issue',
      targetId: args.taskId || null,
      targetTitle: args.taskTitle || null,
      detail: args.detail || "",
    });
    emitActivity(toPublicActivity(entry));
  } catch (err) {
    console.error("Activity log write failed:", (err as Error).message);
  }
}
