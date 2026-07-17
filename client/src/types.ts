// Task Status as const object (instead of enum)
export const TaskStatus = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
} as const;

// Task Priority as const object (instead of enum)
export const TaskPriority = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];
export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

export type UserRole = "admin" | "member";

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

export interface Member {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  createdAt?: string;
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; dot: string }> = {
  [TaskStatus.TODO]: { label: "Todo", color: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  [TaskStatus.IN_PROGRESS]: { label: "In Progress", color: "bg-yellow-50 text-yellow-700", dot: "bg-yellow-500" },
  [TaskStatus.DONE]: { label: "Done", color: "bg-green-50 text-green-700", dot: "bg-green-500" },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  [TaskPriority.LOW]: { label: "Low", color: "bg-green-100 text-green-700" },
  [TaskPriority.MEDIUM]: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  [TaskPriority.HIGH]: { label: "High", color: "bg-red-100 text-red-700" },
};
