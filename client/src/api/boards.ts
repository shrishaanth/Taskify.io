import type { BoardSummary, Column, Id } from "../types/domain";
import type { BoardColorKey } from "../styles/tokens";
import { boardColorKeyFor } from "../lib/labelColor";
import { apiFetch } from "./http";

interface RawBoard {
  id: string;
  projectId: string;
  name: string;
  columns: Column[];
  cardCount?: number;
}

/** `colorKey` is client-only (COMPONENT_INVENTORY.md §4 C1) — derived from id. */
function toBoardSummary(b: RawBoard): BoardSummary & { columns: Column[] } {
  return {
    id: b.id,
    projectId: b.projectId,
    name: b.name,
    cardCount: b.cardCount ?? 0,
    colorKey: boardColorKeyFor(b.id),
    columns: [...b.columns].sort((a, z) => a.order - z.order),
  };
}

export async function listBoards(projectId: Id) {
  const rows = await apiFetch<RawBoard[]>(`/projects/${projectId}/boards`);
  return rows.map(toBoardSummary);
}

export async function getBoard(projectId: Id, boardId: Id) {
  return toBoardSummary(
    await apiFetch<RawBoard>(`/projects/${projectId}/boards/${boardId}`),
  );
}

export async function createBoard(
  projectId: Id,
  input: { name: string; colorKey?: BoardColorKey },
) {
  // colorKey is not persisted server-side; kept in the client cache only.
  const raw = await apiFetch<RawBoard>(`/projects/${projectId}/boards`, {
    method: "POST",
    body: { name: input.name },
  });
  return toBoardSummary(raw);
}

export function updateBoard(
  projectId: Id,
  boardId: Id,
  patch: { name?: string; columns?: { id?: string; name: string; order: number }[] },
) {
  return apiFetch<RawBoard>(`/projects/${projectId}/boards/${boardId}`, {
    method: "PATCH",
    body: patch,
  }).then(toBoardSummary);
}

export function deleteBoard(projectId: Id, boardId: Id) {
  return apiFetch<void>(`/projects/${projectId}/boards/${boardId}`, {
    method: "DELETE",
  });
}
