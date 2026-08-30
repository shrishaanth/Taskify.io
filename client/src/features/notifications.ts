import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "../api/notifications";
import { useSession } from "../stores/sessionStore";
import { qk } from "./queryClient";

export function useNotifications() {
  const isAuthed = useSession((s) => s.isAuthenticated);
  return useQuery({
    queryKey: qk.notifications,
    queryFn: () => notificationsApi.listNotifications({ limit: 20 }),
    enabled: isAuthed,
    staleTime: 10_000,
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}
