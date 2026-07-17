import { api } from "./client";

export interface ApiActivity {
  id: string;
  action:
    | "task.created" | "task.updated" | "task.status" | "task.deleted"
    | "user.created" | "user.updated" | "user.deleted";
  actorName: string;
  taskTitle: string | null;
  targetUserId: string | null;
  detail: string;
  createdAt: string;
}

export const activityApi = {
  // Admin -> the whole feed. Member -> only entries about them.
  // Scoped on the server, like every other list in the app.
  list: (limit = 20) => api.get<ApiActivity[]>(`/activity?limit=${limit}`),
};
