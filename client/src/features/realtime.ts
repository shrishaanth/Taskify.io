import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../api/socket";
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
