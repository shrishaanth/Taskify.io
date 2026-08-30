import type {
  CardDetail,
  CardPatch,
  CardSummary,
  Comment,
  Id,
  Subtask,
  UserRef,
} from "../types/domain";
import { apiFetch } from "./http";

interface RawCard extends Omit<CardSummary, "assignees"> {
  assigneeIds: string[];
  assignees: UserRef[];
  description?: string;
}

interface RawSubtask {
  id: string;
  title: string;
  assigneeId?: string;
  done: boolean;
}
interface RawComment {
  id: string;
  authorId: string;
  author?: UserRef;
  body: string;
  createdAt: string;
}
interface RawCardDetail extends RawCard {
  subtasks: RawSubtask[];
  comments: RawComment[];
}

const toSummary = (c: RawCard): CardSummary => ({
  id: c.id,
  boardId: c.boardId,
  columnId: c.columnId,
  order: c.order,
  title: c.title,
  labels: c.labels ?? [],
  assignees: c.assignees ?? [],
  ...(c.dueDate ? { dueDate: c.dueDate } : {}),
  ...(c.priority ? { priority: c.priority } : {}),
  subtaskDone: c.subtaskDone ?? 0,
  subtaskTotal: c.subtaskTotal ?? 0,
  commentCount: c.commentCount ?? 0,
});

/** Resolve the id-only refs on subtasks/comments against members. */
function toDetail(c: RawCardDetail, members: UserRef[]): CardDetail {
  const byId = new Map(members.map((m) => [m.id, m]));
  const ref = (id?: string): UserRef =>
    (id && byId.get(id)) || { id: id ?? "", name: "Unknown" };
  return {
    ...toSummary(c),
    ...(c.description ? { description: c.description } : {}),
    subtasks: c.subtasks.map<Subtask>((s) => ({
      id: s.id,
      title: s.title,
      done: s.done,
      ...(s.assigneeId ? { assignee: ref(s.assigneeId) } : {}),
    })),
    comments: c.comments.map<Comment>((cm) => ({
      id: cm.id,
      body: cm.body,
      createdAt: cm.createdAt,
      author: cm.author ?? ref(cm.authorId),
    })),
  };
}

export async function listCards(boardId: Id): Promise<CardSummary[]> {
  const rows = await apiFetch<RawCard[]>(`/boards/${boardId}/cards`);
  return rows.map(toSummary);
}

export async function getCard(
  boardId: Id,
  cardId: Id,
  members: UserRef[],
): Promise<CardDetail> {
  const raw = await apiFetch<RawCardDetail>(`/boards/${boardId}/cards/${cardId}`);
  return toDetail(raw, members);
}

export async function createCard(
  boardId: Id,
  input: { title: string; columnId: string },
): Promise<CardSummary> {
  return toSummary(
    await apiFetch<RawCard>(`/boards/${boardId}/cards`, {
      method: "POST",
      body: input,
    }),
  );
}

export function updateCard(boardId: Id, cardId: Id, patch: CardPatch) {
  return apiFetch<RawCard>(`/boards/${boardId}/cards/${cardId}`, {
    method: "PATCH",
    body: patch,
  }).then(toSummary);
}

export function moveCard(
  boardId: Id,
  cardId: Id,
  move: { columnId: string; order: number },
) {
  return apiFetch<RawCard>(`/boards/${boardId}/cards/${cardId}/move`, {
    method: "PATCH",
    body: move,
  }).then(toSummary);
}

export function deleteCard(boardId: Id, cardId: Id) {
  return apiFetch<void>(`/boards/${boardId}/cards/${cardId}`, {
    method: "DELETE",
  });
}

/* ---- card children ---- */

export function addSubtask(cardId: Id, title: string) {
  return apiFetch<RawSubtask>(`/cards/${cardId}/subtasks`, {
    method: "POST",
    body: { title },
  });
}
export function updateSubtask(
  cardId: Id,
  subtaskId: Id,
  patch: { title?: string; done?: boolean; assigneeId?: string | null },
) {
  return apiFetch<RawSubtask>(`/cards/${cardId}/subtasks/${subtaskId}`, {
    method: "PATCH",
    body: patch,
  });
}
export function deleteSubtask(cardId: Id, subtaskId: Id) {
  return apiFetch<void>(`/cards/${cardId}/subtasks/${subtaskId}`, {
    method: "DELETE",
  });
}

export function addComment(cardId: Id, body: string) {
  return apiFetch<RawComment>(`/cards/${cardId}/comments`, {
    method: "POST",
    body: { body },
  });
}
export function deleteComment(cardId: Id, commentId: Id) {
  return apiFetch<void>(`/cards/${cardId}/comments/${commentId}`, {
    method: "DELETE",
  });
}
