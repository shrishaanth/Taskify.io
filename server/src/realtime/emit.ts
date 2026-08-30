import { getIO } from "./io.js";

/**
 * Real-time Event Catalog (software-spec §6). Every event goes to exactly one
 * room; nothing is ever broadcast globally.
 *
 *   card:created    board:<id>   full card object
 *   card:updated    board:<id>   card object (id + fields)
 *   card:moved      board:<id>   { id, columnId, order }
 *   card:deleted    board:<id>   { id }
 *   comment:new     board:<id>   { cardId, comment }
 *   notification:new user:<id>   notification object
 */

function toBoard(
  boardId: string | null | undefined,
  event: string,
  payload: unknown,
): void {
  if (!boardId) return;
  getIO()?.to(`board:${boardId}`).emit(event, payload);
}

/** Push a freshly-created notification to its recipient's room (FR-6.1). */
export function emitNotificationNew(userId: string, notification: unknown): void {
  getIO()?.to(`user:${userId}`).emit("notification:new", notification);
}

export function emitCardCreated(boardId: string, card: unknown): void {
  toBoard(boardId, "card:created", card);
}

/**
 * `card:updated` carries the full serialized card. The spec allows "changed
 * fields + id"; sending the whole card is a superset and lets the client swap
 * its cache entry without a diff.
 */
export function emitCardUpdated(
  boardId: string | null | undefined,
  card: unknown,
): void {
  toBoard(boardId, "card:updated", card);
}

export function emitCardMoved(
  boardId: string,
  move: { id: string; columnId: string; order: number },
): void {
  toBoard(boardId, "card:moved", move);
}

export function emitCardDeleted(boardId: string, cardId: string): void {
  toBoard(boardId, "card:deleted", { id: cardId });
}

export function emitCommentNew(
  boardId: string | null | undefined,
  payload: { cardId: string; comment: unknown },
): void {
  toBoard(boardId, "comment:new", payload);
}
