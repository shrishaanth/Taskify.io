import { getIO } from "./io.js";

/** Push a freshly-created notification to its recipient's room (FR-6.1). */
export function emitNotificationNew(userId: string, notification: unknown): void {
  getIO()?.to(`user:${userId}`).emit("notification:new", notification);
}

/**
 * Tell everyone currently viewing a board that its cards/columns changed, so
 * their client can refetch (UC-9). `reason` is advisory only.
 */
export function emitBoardChanged(
  boardId: string | undefined | null,
  reason: string,
): void {
  if (!boardId) return;
  getIO()?.to(`board:${boardId}`).emit("board:changed", { boardId, reason });
}
