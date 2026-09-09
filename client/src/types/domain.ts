import type { BoardColorKey } from "../styles/tokens";

export type Id = string;

export type IsoDate = string;

export type OrgRole = "owner" | "admin" | "member";
export type ProjectRole = "head" | "member";
export type Priority = "low" | "medium" | "high" | "urgent";

export type NotificationType =
  | "card_assigned"
  | "comment_mention"
  | "role_changed"
  | "invite_accepted";

export interface UserRef {
  id: Id;
  name: string;
  email?: string;
  avatarUrl?: string;
  /** The account was deleted; name and email are tombstones, not real values. */
  deleted?: boolean;
}

export interface Column {
  id: string;
  name: string;
  order: number;
}

export interface Subtask {
  id: Id;
  title: string;
  assignee?: UserRef;
  done: boolean;
}

export interface Comment {
  id: Id;
  author: UserRef;
  body: string;
  createdAt: IsoDate;
}

export interface CardSummary {
  id: Id;
  boardId: Id;
  columnId: string;
  order: number;
  title: string;
  labels: string[];
  assignees: UserRef[];
  dueDate?: IsoDate;
  priority?: Priority;
  subtaskDone: number;
  subtaskTotal: number;
  commentCount: number;
}

export interface CardDetail extends CardSummary {
  description?: string;
  subtasks: Subtask[];
  comments: Comment[];
}

export interface CardPatch {
  title?: string;
  description?: string;
  labels?: string[];
  assigneeIds?: Id[];
  dueDate?: string | null;
  priority?: Priority;
}

export interface BoardSummary {
  id: Id;
  projectId: Id;
  name: string;
  cardCount: number;
  colorKey?: BoardColorKey;
}

export interface ProjectSummary {
  id: Id;
  name: string;
  description?: string;
  category?: string;
  role: ProjectRole | null;
  members: UserRef[];
}

export interface OrgSummary {
  id: Id;
  name: string;
  slug: string;
  role: OrgRole;
}

export interface ProjectMemberRow {
  user: UserRef;
  role: ProjectRole;
}

export interface OrgMemberRow {
  user: UserRef;
  role: OrgRole;
}

export interface OrgInvite {
  id: Id;
  email: string;
  role: Exclude<OrgRole, "owner">;
  token: string;
  invitedBy?: UserRef;
  expiresAt: IsoDate;
  createdAt?: IsoDate;
}

export interface AppNotification {
  id: Id;
  type: NotificationType;
  title: string;
  createdAt: IsoDate;
  read: boolean;
}
