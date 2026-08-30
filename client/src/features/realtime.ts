import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../api/socket";
import { qk } from "./queryClient";

/**
 * Real-time wiring. The client never trusts a payload to be complete — every
 * handler just nudges React Query to refetch the affected slice, so the socket
 * only decides *when* to refresh, not *what* the data is.
 */

/**
 * App-wide listeners, registered once in the authenticated shell. The server
 * joins the connecting user to `user:<id>`, `org:<id>` and `project:<id>`
 * rooms on connect, so no explicit subscribe is needed here.
 *
 *   notification:new                          -> refetch the bell
 *   board:created | board:updated | board:deleted
 *                                             -> refetch the project's Boards list
 *   project:memberChanged | project:memberRemoved
 *                                             -> refetch Project Members
 *   org:memberChanged                         -> refetch Org Members
 */
export function useAppRealtime(): void {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const refetchNotifications = () => {
      void qc.invalidateQueries({ queryKey: qk.notifications });
    };
    const refetchBoards = () => {
      void qc.invalidateQueries({ queryKey: ["boards"] }); // qk.boards(projectId)
      void qc.invalidateQueries({ queryKey: ["board"] }); // open board detail
    };
    const refetchProjectMembers = () => {
      // qk.projectMembers(projectId) + qk.project(orgId, projectId)
      void qc.invalidateQueries({ queryKey: ["project"] });
    };
    const refetchOrgMembers = () => {
      void qc.invalidateQueries({ queryKey: ["orgs"] }); // qk.orgMembers(orgId)
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
