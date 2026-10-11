import { NotificationModel, type NotificationType } from "../models/index.js";
import { notificationDto } from "./serialize.js";
import { emitNotificationNew } from "../realtime/emit.js";

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

/** Enough to link a notification back to the card it is about. */
export interface CardRef {
  id: string;
  title: string;
  organizationId: string;
  projectId: string;
  boardId: string;
}

const cardPayload = (card: CardRef) => ({
  cardId: card.id,
  cardTitle: card.title,
  organizationId: card.organizationId,
  projectId: card.projectId,
  boardId: card.boardId,
});

export function notifyCardAssigned(
  assigneeIds: string[],
  card: CardRef,
  actorId: string,
) {
  return create(assigneeIds, "card_assigned", cardPayload(card), actorId);
}

export function notifyCommentOnCard(
  recipientIds: string[],
  card: CardRef,
  actorId: string,
) {
  return create(recipientIds, "comment_mention", cardPayload(card), actorId);
}

export function notifyRoleChanged(
  userId: string,
  scope: "org" | "project",
  contextName: string,
  where: { organizationId: string; projectId?: string },
) {
  return create([userId], "role_changed", { scope, contextName, ...where });
}

export function notifyInviteAccepted(
  recipientIds: string[],
  info: {
    organizationId: string;
    orgName: string;
    acceptedById: string;
    acceptedByName: string;
  },
) {
  return create(
    recipientIds,
    "invite_accepted",
    {
      organizationId: info.organizationId,
      contextName: info.orgName,
      acceptedById: info.acceptedById,
      acceptedByName: info.acceptedByName,
    },
    info.acceptedById,
  );
}
