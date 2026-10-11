import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as boardsApi from "../api/boards";
import type { Id } from "../types/domain";
import { qk } from "./queryClient";

export function useBoards(projectId: Id) {
  return useQuery({
    queryKey: qk.boards(projectId),
    queryFn: () => boardsApi.listBoards(projectId),
    enabled: Boolean(projectId),
  });
}

export function useBoard(projectId: Id, boardId: Id) {
  return useQuery({
    queryKey: qk.board(projectId, boardId),
    queryFn: () => boardsApi.getBoard(projectId, boardId),
    enabled: Boolean(projectId && boardId),
    retry: false,
  });
}

export function useCreateBoard(projectId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string }) =>
      boardsApi.createBoard(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.boards(projectId) }),
  });
}

export function useUpdateBoard(projectId: Id, boardId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: boardsApi.BoardPatch) =>
      boardsApi.updateBoard(projectId, boardId, patch),
    onSuccess: (_board, patch) => {
      // Removing a column can move or delete its cards on the server.
      if (patch.moveCardsTo || patch.deleteCards) {
        qc.invalidateQueries({ queryKey: qk.cards(boardId) });
      }
      qc.invalidateQueries({ queryKey: qk.board(projectId, boardId) });
      qc.invalidateQueries({ queryKey: qk.boards(projectId) });
    },
  });
}

export function useDeleteBoard(projectId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boardId: Id) => boardsApi.deleteBoard(projectId, boardId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.boards(projectId) }),
  });
}
