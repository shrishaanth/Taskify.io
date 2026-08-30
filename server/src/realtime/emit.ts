import { getIO } from "./io.js";

/**
 * Real-time Event Catalog. Every event goes to exactly one room; nothing is
 * ever broadcast globally.
 *
 *   card:created            board:<id>   full card object
 *   card:updated            board:<id>   card object (id + fields)
 *   card:moved              board:<id>   { id, columnId, order }
 *   card:deleted            board:<id>   { id }
 *   comment:new             board:<id>   { cardId, comment }
 *   board:created           project:<id> full board object
 *   board:updated           project:<id> full board object
 *   board:deleted           project:<id> { id }
 *   project:memberChanged   project:<id> { userId, role }
 *   project:memberRemoved   project:<id> { userId }
 *   org:memberChanged       org:<id>     { userId, role }
 *   notification:new        user:<id>    notification object
 */

function toBoard(
  boardId: string | null | undefined,
  event: string,
  payload: unknown,
): void {
  if (!boardId) return;
  getIO()?.to(`board:${boardId}`).emit(event, payload);
}

function toProject(
  projectId: string | null | undefined,
  event: string,
  payload: unknown,
): void {
  if (!projectId) return;
  getIO()?.to(`project:${projectId}`).emit(event, payload);
}

function toOrg(
  orgId: string | null | undefined,
  event: string,
  payload: unknown,
): void {
  if (!orgId) return;
  getIO()?.to(`org:${orgId}`).emit(event, payload);
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

/** A board was created inside a project — tell everyone viewing that project. */
export function emitBoardCreated(projectId: string, board: unknown): void {
  toProject(projectId, "board:created", board);
}

/** A board was renamed / had its columns changed. */
export function emitBoardUpdated(
  projectId: string | null | undefined,
  board: unknown,
): void {
  toProject(projectId, "board:updated", board);
}

export function emitBoardDeleted(projectId: string, boardId: string): void {
  toProject(projectId, "board:deleted", { id: boardId });
}

/** A Project member's role was set (added or changed to head / member). */
export function emitProjectMemberChanged(
  projectId: string,
  payload: { userId: string; role: string },
): void {
  toProject(projectId, "project:memberChanged", payload);
}

/** A Project member was removed. */
export function emitProjectMemberRemoved(
  projectId: string,
  userId: string,
): void {
  toProject(projectId, "project:memberRemoved", { userId });
}

/** An Organization member's role was changed. */
export function emitOrgMemberChanged(
  orgId: string,
  payload: { userId: string; role: string },
): void {
  toOrg(orgId, "org:memberChanged", payload);
}
