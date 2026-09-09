import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { cardSummaryFromPayload } from "../api/cards";
import { getSocket } from "../api/socket";
import type { CardSummary } from "../types/domain";
import { qk } from "./queryClient";

export function useAppRealtime(): void {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const refetchNotifications = () => {
      void qc.invalidateQueries({ queryKey: qk.notifications });
    };
    const refetchBoards = () => {
      void qc.invalidateQueries({ queryKey: ["boards"] });
      void qc.invalidateQueries({ queryKey: ["board"] });
    };
    const refetchProjectMembers = () => {
      void qc.invalidateQueries({ queryKey: ["project"] });
    };
    const refetchOrgMembers = () => {
      void qc.invalidateQueries({ queryKey: ["orgs"] });
    };

    socket.on("notification:new", refetchNotifications);
    socket.on("board:created", refetchBoards);
    socket.on("board:updated", refetchBoards);
    socket.on("board:deleted", refetchBoards);
    socket.on("project:memberChanged", refetchProjectMembers);
    socket.on("project:memberRemoved", refetchProjectMembers);
    socket.on("org:memberChanged", refetchOrgMembers);

    return () => {
      socket.off("notification:new", refetchNotifications);
      socket.off("board:created", refetchBoards);
      socket.off("board:updated", refetchBoards);
      socket.off("board:deleted", refetchBoards);
      socket.off("project:memberChanged", refetchProjectMembers);
      socket.off("project:memberRemoved", refetchProjectMembers);
      socket.off("org:memberChanged", refetchOrgMembers);
    };
  }, [qc]);
}

/**
 * Writes a card into the board's cached list, replacing any existing entry.
 * `card:*` payloads are the same DTO the list endpoint serves and only reach
 * sockets already admitted to `board:<id>`, so they can be applied as-is
 * instead of triggering a full refetch of the board.
 */
function upsertCard(qc: QueryClient, boardId: string, card: CardSummary): void {
  qc.setQueryData<CardSummary[]>(qk.cards(boardId), (prev) => {
    if (!prev) return prev;
    const idx = prev.findIndex((c) => c.id === card.id);
    if (idx === -1) return [...prev, card];
    const next = [...prev];
    next[idx] = card;
    return next;
  });
}

export function useBoardRealtime(projectId: string, boardId: string): void {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !boardId) return;

    const join = () => socket.emit("subscribe:board", boardId);
    join();
    socket.on("connect", join);

    // A refetch is the fallback for payloads that cannot be applied locally.
    const refetchCards = () => {
      void qc.invalidateQueries({ queryKey: qk.cards(boardId) });
    };

    const onCardWritten = (payload: unknown) => {
      const raw = payload as Parameters<typeof cardSummaryFromPayload>[0];
      if (!raw?.id) return refetchCards();
      upsertCard(qc, boardId, cardSummaryFromPayload(raw));
      // The open card detail carries subtasks and comments the summary lacks.
      void qc.invalidateQueries({ queryKey: qk.card(boardId, raw.id) });
    };

    const onCardMoved = (payload: unknown) => {
      const move = payload as { id?: string; columnId?: string; order?: number };
      if (!move?.id || !move.columnId || typeof move.order !== "number") {
        return refetchCards();
      }
      qc.setQueryData<CardSummary[]>(qk.cards(boardId), (prev) =>
        prev?.map((c) =>
          c.id === move.id
            ? { ...c, columnId: move.columnId as string, order: move.order as number }
            : c,
        ),
      );
    };

    const onCardDeleted = (payload: unknown) => {
      const id = (payload as { id?: string })?.id;
      if (!id) return refetchCards();
      qc.setQueryData<CardSummary[]>(qk.cards(boardId), (prev) =>
        prev?.filter((c) => c.id !== id),
      );
      qc.removeQueries({ queryKey: qk.card(boardId, id) });
    };

    const onCommentNew = (evt: { cardId?: string }) => {
      if (!evt?.cardId) return refetchCards();
      // Only the open detail view renders comment bodies; the summary just
      // needs its count, which arrives with the next card:updated or refetch.
      void qc.invalidateQueries({ queryKey: qk.card(boardId, evt.cardId) });
      void qc.invalidateQueries({ queryKey: qk.cards(boardId) });
    };

    socket.on("card:created", onCardWritten);
    socket.on("card:updated", onCardWritten);
    socket.on("card:moved", onCardMoved);
    socket.on("card:deleted", onCardDeleted);
    socket.on("comment:new", onCommentNew);

    return () => {
      socket.emit("unsubscribe:board", boardId);
      socket.off("connect", join);
      socket.off("card:created", onCardWritten);
      socket.off("card:updated", onCardWritten);
      socket.off("card:moved", onCardMoved);
      socket.off("card:deleted", onCardDeleted);
      socket.off("comment:new", onCommentNew);
    };
  }, [qc, projectId, boardId]);
}
