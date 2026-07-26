// ── Enums / Literal Unions ────────────────────────────────────

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type IssueType = 'task' | 'bug' | 'story' | 'epic' | 'subtask';
export type IssuePriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';
export type SprintStatus = 'planning' | 'active' | 'completed';
export type BoardType = 'kanban' | 'scrum';
export type ScopeType = 'organization' | 'workspace' | 'project';
export type NotificationType =
  | 'issue_assigned'
  | 'issue_commented'
  | 'issue_updated'
  | 'mention'
  | 'role_changed'
  | 'sprint_started'
  | 'sprint_completed';

// ── Entity Interfaces (public-facing, no password hashes) ──────

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  tokenVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  description: string;
  avatarUrl: string;
  ownerId: string;
  settings: {
    allowedDomains: string[];
    defaultRole: UserRole;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string;
  avatarUrl: string;
  leadId: string | null;
  visibility: 'open' | 'private';
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description: string;
  avatarUrl: string;
  leadId: string | null;
  isArchived: boolean;
  counter: number;
  settings: {
    isPrivate: boolean;
    defaultAssignee: string | null;
    epicEnabled: boolean;
    sprintsEnabled: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  projectId: string;
  key: string;
  issueNumber: number;
  parentId: string | null;
  epicId: string | null;
  type: IssueType;
  title: string;
  description: string;
  status: string;
  priority: IssuePriority;
  reporterId: string;
  assigneeId: string | null;
  labels: string[];
  sprintId: string | null;
  boardColumnId: string | null;
  storyPoints: number | null;
  dueDate: string | null;
  startDate: string | null;
  completedAt: string | null;
  resolution: string | null;
  sortOrder: number;
  watcherIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Epic {
  id: string;
  projectId: string;
  name: string;
  summary: string;
  color: string;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  type: BoardType;
  columns: BoardColumn[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  statusFilter: string[];
  wipLimit: number | null;
  color: string | null;
}

export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  body: string;
  isEdited: boolean;
  isDeleted: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  issueId: string;
  authorId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  url: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface Membership {
  id: string;
  scopeType: ScopeType;
  scopeId: string;
  userId: string;
  role: UserRole;
  addedBy: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  organizationId: string;
  scopeType: ScopeType | null;
  scopeId: string | null;
  action: string;
  actorId: string;
  actorName: string;
  targetType: string | null;
  targetId: string | null;
  targetTitle: string | null;
  detail: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}
