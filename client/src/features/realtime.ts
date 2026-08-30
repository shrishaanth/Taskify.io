import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../api/socket";
import { qk } from "./queryClient";

/**
 * App-wide realtime wiring. Mounted once (in the authenticated shell): when the
 * server pushes a new notification, refetch the bell.
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
 * Live board sync (UC-9). While mounted, subscribes to the board's room and
 * refetches its cards / columns whenever anyone changes them.
 */
export function useBoardRealtime(
  projectId: string,
  boardId: string,
): void {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !boardId) return;

    const join = () => socket.emit("subscribe:board", boardId);
    join();
    socket.on("connect", join);

    const onChanged = (evt: { boardId?: string }) => {
      if (evt?.boardId && evt.boardId !== boardId) return;
      void qc.invalidateQueries({ queryKey: qk.cards(boardId) });
      void qc.invalidateQueries({ queryKey: qk.board(projectId, boardId) });
    };
    socket.on("board:changed", onChanged);

    return () => {
      socket.emit("unsubscribe:board", boardId);
      socket.off("connect", join);
      socket.off("board:changed", onChanged);
    };
  }, [qc, projectId, boardId]);
}
