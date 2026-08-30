import { NotificationModel, type NotificationType } from "../models/index.js";

/**
 * FR-6.1 — create in-app notifications. The `notification:new` socket emit is
 * wired with the real-time layer; here we persist the rows that
 * `GET /notifications` serves.
 */
async function create(
  userIds: string[],
  type: NotificationType,
  payload: Record<string, unknown>,
  exclude?: string,
) {
  const targets = [...new Set(userIds)].filter((id) => id && id !== exclude);
  if (targets.length === 0) return;
  await NotificationModel.insertMany(
    targets.map((userId) => ({ userId, type, payload, read: false })),
  );
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
