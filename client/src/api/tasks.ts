import { api } from "./client";

export interface ApiTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  createdBy: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedTo?: string | null;
  dueDate?: string | null;
}

export interface AdminStats {
  totalUsers: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  recentTasks: ApiTask[];
}

export interface MemberStats {
  completed: number;
  pending: number;
  dueSoon: number;
}

export const tasksApi = {
  // Admin -> every task. Member -> only tasks assigned to them.
  // The scoping happens on the server; the client never has to filter.
  list: () => api.get<ApiTask[]>("/tasks"),

  get: (id: string) => api.get<ApiTask>(`/tasks/${id}`),

  // Admin only (creating implies assigning).
  create: (payload: CreateTaskPayload) => api.post<ApiTask>("/tasks", payload),

  // Admin only — full edit of any field.
  update: (id: string, payload: Partial<CreateTaskPayload>) =>
    api.put<ApiTask>(`/tasks/${id}`, payload),

  // Member's one write privilege: move their own assigned task between columns.
  updateStatus: (id: string, status: string) =>
    api.patch<ApiTask>(`/tasks/${id}/status`, { status }),

  // Admin only.
  delete: (id: string) => api.delete<void>(`/tasks/${id}`),

  stats: () => api.get<AdminStats | MemberStats>("/tasks/stats"),
};
