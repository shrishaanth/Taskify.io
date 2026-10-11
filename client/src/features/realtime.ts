import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { cardSummaryFromPayload } from "../api/cards";
import { getSocket } from "../api/socket";
import { useSession } from "../stores/sessionStore";
import type { CardSummary } from "../types/domain";
import { applyCardMove } from "./cards";
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
    // Being added to a project arrives as a role_changed notification; the
    // project list has to be re-read for its tile to unlock.
    const onNotification = (n: { type?: string } | undefined) => {
      refetchNotifications();
      if (n?.type === "role_changed") {
        void qc.invalidateQueries({ queryKey: ["projects"] });
        void qc.invalidateQueries({ queryKey: ["project"] });
      }
    };
    // Membership decides which orgs and roles the shell shows, and that lives
    // in the session, not in a query.
    const me = () => useSession.getState().session?.user.id;
    const onOrgMemberChanged = (evt: { userId?: string } | undefined) => {
      refetchOrgMembers();
      if (evt?.userId && evt.userId === me()) void useSession.getState().refresh();
    };
    const onOrgMemberRemoved = (evt: { userId?: string } | undefined) => {
      refetchOrgMembers();
      if (evt?.userId && evt.userId === me()) {
        void useSession.getState().refresh();
        void qc.invalidateQueries();
      }
    };

    // The first connect coincides with the initial page load, which fetches
    // everything anyway; only later ones mean events may have been missed.
    let connectedBefore = socket.connected;
    const resync = () => {
      if (!connectedBefore) {
        connectedBefore = true;
        return;
      }
      refetchNotifications();
      refetchBoards();
      refetchProjectMembers();
      refetchOrgMembers();
    };
    socket.on("connect", resync);
    socket.on("notification:new", onNotification);
    socket.on("board:created", refetchBoards);
    socket.on("board:updated", refetchBoards);
    socket.on("board:deleted", refetchBoards);
    socket.on("project:memberChanged", refetchProjectMembers);
    socket.on("project:memberRemoved", refetchProjectMembers);
    socket.on("org:memberChanged", onOrgMemberChanged);
    socket.on("org:memberRemoved", onOrgMemberRemoved);

    return () => {
      socket.off("connect", resync);
      socket.off("notification:new", onNotification);
      socket.off("board:created", refetchBoards);
      socket.off("board:updated", refetchBoards);
      socket.off("board:deleted", refetchBoards);
      socket.off("project:memberChanged", refetchProjectMembers);
      socket.off("project:memberRemoved", refetchProjectMembers);
      socket.off("org:memberChanged", onOrgMemberChanged);
      socket.off("org:memberRemoved", onOrgMemberRemoved);
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
      const known = qc
        .getQueryData<CardSummary[]>(qk.cards(boardId))
        ?.some((c) => c.id === move.id);
      if (!known) return refetchCards();
      // The payload names only the moved card, but a move also shifts every
      // sibling. Renumber them the same way the server and the optimistic
      // path do, or the moved card ties with a neighbour and sorts wrongly.
      qc.setQueryData<CardSummary[]>(qk.cards(boardId), (prev) =>
        prev
          ? applyCardMove(prev, move.id as string, move.columnId as string, move.order as number)
          : prev,
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

    // Events sent while this client was offline are gone, so a reconnect has
    // to rejoin the room and re-read the board rather than trust the cache.
    let connectedBefore = socket.connected;
    const onConnect = () => {
      join();
      if (!connectedBefore) {
        connectedBefore = true;
        return;
      }
      refetchCards();
      void qc.invalidateQueries({ queryKey: ["card", boardId] });
    };
    socket.on("connect", onConnect);

    socket.on("card:created", onCardWritten);
    socket.on("card:updated", onCardWritten);
    socket.on("card:moved", onCardMoved);
    socket.on("card:deleted", onCardDeleted);
    socket.on("comment:new", onCommentNew);

    return () => {
      socket.emit("unsubscribe:board", boardId);
      socket.off("connect", onConnect);
      socket.off("card:created", onCardWritten);
      socket.off("card:updated", onCardWritten);
      socket.off("card:moved", onCardMoved);
      socket.off("card:deleted", onCardDeleted);
      socket.off("comment:new", onCommentNew);
    };
  }, [qc, projectId, boardId]);
}
