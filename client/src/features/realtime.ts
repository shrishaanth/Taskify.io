import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../api/socket";
import { qk } from "./queryClient";

/**
 * Real-time wiring for the events in software-spec §6. The client never trusts
 * a payload to be complete — every handler nudges React Query to refetch the
 * affected slice, so the socket only decides *when* to refresh, not *what* the
 * data is.
 */

/**
 * App-wide: `notification:new` (room `user:<id>`) refreshes the bell.
 * Mounted once, in the authenticated shell.
 */
export function useRealtimeNotifications(): void {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = () => {
      void qc.invalidateQueries({ queryKey: qk.notifications });
    };
    socket.on("notification:new", onNew);
    return () => {
      socket.off("notification:new", onNew);
    };
  }, [qc]);
}

/**
 * Board view: while mounted, join `board:<id>` and react to the card / comment
 * events for that board.
 *   card:created | card:updated | card:moved | card:deleted -> refetch the
 *     board's card list (+ any open card detail)
 *   comment:new -> refetch that card's detail
 */
export function useBoardRealtime(projectId: string, boardId: string): void {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !boardId) return;

    const join = () => socket.emit("subscribe:board", boardId);
    join();
    socket.on("connect", join);

    const refetchCards = () => {
      void qc.invalidateQueries({ queryKey: qk.cards(boardId) });
      // any open card-detail query for this board (["card", boardId, ...])
      void qc.invalidateQueries({ queryKey: ["card", boardId] });
    };
    const refetchComment = (evt: { cardId?: string }) => {
      if (evt?.cardId) {
        void qc.invalidateQueries({ queryKey: qk.card(boardId, evt.cardId) });
      } else {
        refetchCards();
      }
    };

    socket.on("card:created", refetchCards);
    socket.on("card:updated", refetchCards);
    socket.on("card:moved", refetchCards);
    socket.on("card:deleted", refetchCards);
    socket.on("comment:new", refetchComment);

    return () => {
      socket.emit("unsubscribe:board", boardId);
      socket.off("connect", join);
      socket.off("card:created", refetchCards);
      socket.off("card:updated", refetchCards);
      socket.off("card:moved", refetchCards);
      socket.off("card:deleted", refetchCards);
      socket.off("comment:new", refetchComment);
    };
  }, [qc, projectId, boardId]);
}
