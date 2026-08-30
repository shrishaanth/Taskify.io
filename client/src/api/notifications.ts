import type { AppNotification, Id } from "../types/domain";
import { apiFetch } from "./http";

interface ListResponse {
  items: AppNotification[];
  page: number;
  limit: number;
  total: number;
  unread: number;
}

export function listNotifications(params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch<ListResponse>(`/notifications${suffix}`);
}

export function markNotificationRead(id: Id) {
  return apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return apiFetch<void>(`/notifications/read-all`, { method: "PATCH" });
}
