/**
 * Client-side view models, derived from srs/05-data-model.md.
 * These describe the shapes the UI renders; Phase 7 aligns them with the
 * server DTOs from the API contract. No field here that is absent from the
 * SRS data model — see COMPONENT_INVENTORY.md §4 for the decorative extras
 * (`ProjectSummary.category`, `BoardSummary.colorKey`) and why they are
 * client-only.
 */

import type { BoardColorKey } from "../styles/tokens";

export type Id = string;

/** ISO-8601 date-time string. */
export type IsoDate = string;

export type OrgRole = "owner" | "admin" | "member";
export type ProjectRole = "head" | "member";
export type Priority = "low" | "medium" | "high" | "urgent";

export type NotificationType =
  | "card_assigned"
  | "comment_mention"
  | "role_changed"
  | "due_soon";

export interface UserRef {
  id: Id;
  name: string;
  email?: string;
  avatarUrl?: string;
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

export interface Attachment {
  id: Id;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: UserRef;
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
  attachments: Attachment[];
}

/** Editable card fields (PATCH /boards/:boardId/cards/:cardId). */
export interface CardPatch {
  title?: string;
  description?: string;
  labels?: string[];
  assigneeIds?: Id[];
  dueDate?: string | null;
  priority?: Priority;
}

/** `colorKey` is a client-only preference (COMPONENT_INVENTORY.md §4 C1). */
export interface BoardSummary {
  id: Id;
  projectId: Id;
  name: string;
  cardCount: number;
  colorKey?: BoardColorKey;
}

/** `category` is decorative placeholder data (COMPONENT_INVENTORY.md §4 C11). */
export interface ProjectSummary {
  id: Id;
  name: string;
  description?: string;
  category?: string;
  /** null = the caller has no ProjectMembership (name-only, FR-2.3). */
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

export interface AppNotification {
  id: Id;
  type: NotificationType;
  title: string;
  createdAt: IsoDate;
  read: boolean;
}
