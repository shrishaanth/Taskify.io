import { getIO } from "./io.js";

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
