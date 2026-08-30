import { NotificationModel, type NotificationType } from "../models/index.js";
import { notificationDto } from "./serialize.js";
import { emitNotificationNew } from "../realtime/emit.js";

/**
 * FR-6.1 — create in-app notifications: persist the rows that
 * `GET /notifications` serves, then push each one to its recipient's socket
 * room so the bell updates live.
 */
async function create(
  userIds: string[],
  type: NotificationType,
  payload: Record<string, unknown>,
  exclude?: string,
) {
  const targets = [...new Set(userIds)].filter((id) => id && id !== exclude);
  if (targets.length === 0) return;
  const docs = await NotificationModel.insertMany(
    targets.map((userId) => ({ userId, type, payload, read: false })),
  );
  for (const doc of docs) {
    emitNotificationNew(String(doc.userId), notificationDto(doc));
  }
}

export function notifyCardAssigned(
  assigneeIds: string[],
  card: { id: string; title: string },
  actorId: string,
) {
  return create(
    assigneeIds,
    "card_assigned",
    { cardId: card.id, cardTitle: card.title },
    actorId,
  );
}

export function notifyCommentOnCard(
  recipientIds: string[],
  card: { id: string; title: string },
  actorId: string,
) {
  return create(
    recipientIds,
    "comment_mention",
    { cardId: card.id, cardTitle: card.title },
    actorId,
  );
}

export function notifyRoleChanged(
  userId: string,
  scope: "org" | "project",
  contextName: string,
) {
  return create([userId], "role_changed", { scope, contextName });
}
