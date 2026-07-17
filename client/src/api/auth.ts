import { api } from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

// Note: no `role` field. The very first account to register becomes Admin
// automatically; everyone after that must be created by an Admin.
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", payload),

  register: (payload: RegisterPayload) =>
    api.post<AuthUser>("/auth/register", payload),

  me: () => api.get<AuthUser>("/auth/me"),

  // Lets the login screen know whether public registration is still open
  // (only true until the first Admin account exists).
  registrationStatus: () => api.get<{ open: boolean }>("/auth/registration-status"),
};
