import { api } from "./client";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  avatarUrl: string;
  createdAt?: string;
}

export const usersApi = {
  // Admin only — the full user directory. Members never call this.
  list: () => api.get<ApiUser[]>("/users"),

  // Admin only — the ONLY way a Member account is created.
  create: (payload: { name: string; email: string; password: string; role?: "admin" | "member" }) =>
    api.post<ApiUser>("/users", payload),

  update: (id: string, payload: Partial<{ name: string; role: "admin" | "member"; avatarUrl: string }>) =>
    api.put<ApiUser>(`/users/${id}`, payload),

  resetPassword: (id: string, password: string) =>
    api.post<{ message: string }>(`/users/${id}/reset-password`, { password }),

  delete: (id: string) => api.delete<void>(`/users/${id}`),

  // Self-service, any authenticated user.
  updateMe: (payload: Partial<{ name: string; avatarUrl: string }>) =>
    api.put<ApiUser>("/users/me", payload),

  changeMyPassword: (currentPassword: string, newPassword: string) =>
    api.put<{ message: string }>("/users/me/password", { currentPassword, newPassword }),
};
