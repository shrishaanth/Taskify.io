import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as notificationsApi from "../api/notifications";
import { useSession } from "../stores/sessionStore";
import { qk } from "./queryClient";

const PAGE_SIZE = 20;

/**
 * The notification bell, paginated as an infinite list. `fetchNextPage` pulls
 * the next page; `notification:new` socket events invalidate this query.
 */
export function useNotifications() {
  const isAuthed = useSession((s) => s.isAuthenticated);
  const query = useInfiniteQuery({
    queryKey: qk.notifications,
    queryFn: ({ pageParam }) =>
      notificationsApi.listNotifications({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.limit < last.total ? last.page + 1 : undefined,
    enabled: isAuthed,
    staleTime: 10_000,
  });

  const pages = query.data?.pages ?? [];
  return {
    ...query,
    items: pages.flatMap((p) => p.items),
    unreadCount: pages[0]?.unread ?? 0,
    total: pages[0]?.total ?? 0,
  };
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
