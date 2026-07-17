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
      action: args.action,
      actor: args.actorId,
      actorName: args.actorName,
      task: args.taskId || null,
      taskTitle: args.taskTitle || null,
      targetUser: args.targetUserId || null,
      detail: args.detail || "",
    });
    emitActivity(toPublicActivity(entry));
  } catch (err) {
    console.error("Activity log write failed:", (err as Error).message);
  }
}
