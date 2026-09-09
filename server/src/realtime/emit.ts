import { getOriginSocketId } from "../lib/requestContext.js";
import { getIO } from "./io.js";

/**
 * Room emitter that excludes the socket which triggered the change. That client
 * already has the authoritative result in its HTTP response, so echoing to it
 * only causes a redundant refetch of data it just received.
 */
function toRoom(room: string, event: string, payload: unknown): void {
  const io = getIO();
  if (!io) return;
  const origin = getOriginSocketId();
  const target = origin ? io.to(room).except(origin) : io.to(room);
  target.emit(event, payload);
}

function toBoard(
  boardId: string | null | undefined,
  event: string,
  payload: unknown,
): void {
  if (!boardId) return;
  toRoom(`board:${boardId}`, event, payload);
}

function toProject(
  projectId: string | null | undefined,
  event: string,
  payload: unknown,
): void {
  if (!projectId) return;
  toRoom(`project:${projectId}`, event, payload);
}

function toOrg(
  orgId: string | null | undefined,
  event: string,
  payload: unknown,
): void {
  if (!orgId) return;
  toRoom(`org:${orgId}`, event, payload);
}

export function emitNotificationNew(userId: string, notification: unknown): void {
  getIO()?.to(`user:${userId}`).emit("notification:new", notification);
}

export function emitCardCreated(boardId: string, card: unknown): void {
  toBoard(boardId, "card:created", card);
}

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

export function emitBoardCreated(projectId: string, board: unknown): void {
  toProject(projectId, "board:created", board);
}

export function emitBoardUpdated(
  projectId: string | null | undefined,
  board: unknown,
): void {
  toProject(projectId, "board:updated", board);
}

export function emitBoardDeleted(projectId: string, boardId: string): void {
  toProject(projectId, "board:deleted", { id: boardId });
}

export function emitProjectMemberChanged(
  projectId: string,
  payload: { userId: string; role: string },
): void {
  toProject(projectId, "project:memberChanged", payload);
}

export function emitProjectMemberRemoved(
  projectId: string,
  userId: string,
): void {
  toProject(projectId, "project:memberRemoved", { userId });
}

export function emitOrgMemberChanged(
  orgId: string,
  payload: { userId: string; role: string },
): void {
  toOrg(orgId, "org:memberChanged", payload);
}
