// Simple two-role system. There is no per-workspace or per-project role —
// a user is either an Admin or a Member across the whole app.
export type UserRole = "admin" | "member";

export type TaskStatus = "Todo" | "In Progress" | "Done";
export type TaskPriority = "Low" | "Medium" | "High";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string | null;
  createdBy: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// JWT carries only identity + role. Role is looked up fresh from the User
// document on every request that needs it (see middleware/auth.ts), so a
// role change or account deletion takes effect immediately.
export interface JwtPayload {
  userId: string;
  role: UserRole;
  tokenVersion: number;
}
