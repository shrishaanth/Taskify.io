// ── Permission Strings ────────────────────────────────────────
// Every action in the system is represented by a string permission.
// Grouped by domain for readability.

export const Permissions = {
  // ── Organization ────────────────────
  ORG_VIEW: 'org:view',
  ORG_EDIT: 'org:edit',
  ORG_DELETE: 'org:delete',
  ORG_MANAGE: 'org:manage',

  // ── Workspace ───────────────────────
  WORKSPACE_VIEW: 'workspace:view',
  WORKSPACE_CREATE: 'workspace:create',
  WORKSPACE_EDIT: 'workspace:edit',
  WORKSPACE_DELETE: 'workspace:delete',
  WORKSPACE_MANAGE: 'workspace:manage',

  // ── Project ─────────────────────────
  PROJECT_VIEW: 'project:view',
  PROJECT_CREATE: 'project:create',
  PROJECT_EDIT: 'project:edit',
  PROJECT_DELETE: 'project:delete',
  PROJECT_MANAGE: 'project:manage',

  // ── Issues ──────────────────────────
  ISSUES_VIEW: 'issues:view',
  ISSUES_CREATE: 'issues:create',
  ISSUES_EDIT: 'issues:edit',
  ISSUES_EDIT_ALL: 'issues:edit:all',
  ISSUES_DELETE: 'issues:delete',
  ISSUES_ASSIGN: 'issues:assign',
  ISSUES_MOVE: 'issues:move',
  ISSUES_WATCH: 'issues:watch',

  // ── Comments ────────────────────────
  COMMENTS_CREATE: 'comments:create',
  COMMENTS_EDIT: 'comments:edit',
  COMMENTS_EDIT_ALL: 'comments:edit:all',
  COMMENTS_DELETE: 'comments:delete',
  COMMENTS_DELETE_ALL: 'comments:delete:all',

  // ── Sprints ─────────────────────────
  SPRINTS_VIEW: 'sprints:view',
  SPRINTS_CREATE: 'sprints:create',
  SPRINTS_EDIT: 'sprints:edit',
  SPRINTS_DELETE: 'sprints:delete',
  SPRINTS_MANAGE: 'sprints:manage',
  SPRINTS_START: 'sprints:start',

  // ── Boards ──────────────────────────
  BOARDS_VIEW: 'boards:view',
  BOARDS_CREATE: 'boards:create',
  BOARDS_EDIT: 'boards:edit',
  BOARDS_DELETE: 'boards:delete',
  BOARDS_CONFIGURE: 'boards:configure',

  // ── Members ─────────────────────────
  MEMBERS_VIEW: 'members:view',
  MEMBERS_INVITE: 'members:invite',
  MEMBERS_ROLE: 'members:role',
  MEMBERS_REMOVE: 'members:remove',

  // ── Attachments ─────────────────────
  ATTACHMENTS_CREATE: 'attachments:create',
  ATTACHMENTS_DELETE: 'attachments:delete',

  // ── Epics ───────────────────────────
  EPICS_VIEW: 'epics:view',
  EPICS_CREATE: 'epics:create',
  EPICS_EDIT: 'epics:edit',
  EPICS_DELETE: 'epics:delete',

  // ── Activity ────────────────────────
  ACTIVITY_VIEW: 'activity:view',
  ACTIVITY_EXPORT: 'activity:export',

  // ── System ──────────────────────────
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_JOBS: 'system:jobs',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
export type RoleName = 'owner' | 'admin' | 'member' | 'viewer';
// ── Role → Permission Mapping ─────────────────────────────────
// Each scope level has slightly different defaults.
// Organization roles are the broadest; project roles are the narrowest.

export type ScopePermissionMap = Record<RoleName, Permission[]>;

export const ORG_ROLE_PERMISSIONS: ScopePermissionMap = {
  owner: Object.values(Permissions) as Permission[],

  admin: [
    Permissions.ORG_VIEW,
    Permissions.ORG_EDIT,
    Permissions.ORG_MANAGE,
    Permissions.WORKSPACE_VIEW,
    Permissions.WORKSPACE_CREATE,
    Permissions.WORKSPACE_EDIT,
    Permissions.WORKSPACE_DELETE,
    Permissions.WORKSPACE_MANAGE,
    Permissions.PROJECT_VIEW,
    Permissions.PROJECT_CREATE,
    Permissions.PROJECT_EDIT,
    Permissions.PROJECT_DELETE,
    Permissions.PROJECT_MANAGE,
    Permissions.ISSUES_VIEW,
    Permissions.ISSUES_CREATE,
    Permissions.ISSUES_EDIT,
    Permissions.ISSUES_EDIT_ALL,
    Permissions.ISSUES_DELETE,
    Permissions.ISSUES_ASSIGN,
    Permissions.ISSUES_MOVE,
    Permissions.ISSUES_WATCH,
    Permissions.COMMENTS_CREATE,
    Permissions.COMMENTS_EDIT,
    Permissions.COMMENTS_EDIT_ALL,
    Permissions.COMMENTS_DELETE,
    Permissions.COMMENTS_DELETE_ALL,
    Permissions.SPRINTS_VIEW,
    Permissions.SPRINTS_CREATE,
    Permissions.SPRINTS_EDIT,
    Permissions.SPRINTS_DELETE,
    Permissions.SPRINTS_MANAGE,
    Permissions.SPRINTS_START,
    Permissions.BOARDS_VIEW,
    Permissions.BOARDS_CREATE,
    Permissions.BOARDS_EDIT,
    Permissions.BOARDS_DELETE,
    Permissions.BOARDS_CONFIGURE,
    Permissions.MEMBERS_VIEW,
    Permissions.MEMBERS_INVITE,
    Permissions.MEMBERS_ROLE,
    Permissions.MEMBERS_REMOVE,
    Permissions.ATTACHMENTS_CREATE,
    Permissions.ATTACHMENTS_DELETE,
    Permissions.EPICS_VIEW,
    Permissions.EPICS_CREATE,
    Permissions.EPICS_EDIT,
    Permissions.EPICS_DELETE,
    Permissions.ACTIVITY_VIEW,
    Permissions.ACTIVITY_EXPORT,
  ],

  member: [
    Permissions.ORG_VIEW,
    Permissions.WORKSPACE_VIEW,
    Permissions.PROJECT_VIEW,
    Permissions.ISSUES_VIEW,
    Permissions.ISSUES_CREATE,
    Permissions.ISSUES_EDIT,
    Permissions.ISSUES_MOVE,
    Permissions.ISSUES_WATCH,
    Permissions.COMMENTS_CREATE,
    Permissions.COMMENTS_EDIT,
    Permissions.COMMENTS_DELETE,
    Permissions.SPRINTS_VIEW,
    Permissions.BOARDS_VIEW,
    Permissions.ATTACHMENTS_CREATE,
    Permissions.ATTACHMENTS_DELETE,
    Permissions.EPICS_VIEW,
    Permissions.ACTIVITY_VIEW,
    Permissions.MEMBERS_VIEW,
  ],

  viewer: [
    Permissions.ORG_VIEW,
    Permissions.WORKSPACE_VIEW,
    Permissions.PROJECT_VIEW,
    Permissions.ISSUES_VIEW,
    Permissions.SPRINTS_VIEW,
    Permissions.BOARDS_VIEW,
    Permissions.EPICS_VIEW,
    Permissions.ACTIVITY_VIEW,
    Permissions.MEMBERS_VIEW,
  ],
};

export const WORKSPACE_ROLE_PERMISSIONS: ScopePermissionMap = {
  owner: Object.values(Permissions) as Permission[],
  admin: ORG_ROLE_PERMISSIONS.admin.filter(
    (p) => !p.startsWith('org:') && p !== 'workspace:delete' && p !== 'workspace:create',
  ) as Permission[],
  member: [...ORG_ROLE_PERMISSIONS.member] as Permission[],
  viewer: [...ORG_ROLE_PERMISSIONS.viewer] as Permission[],
};

export const PROJECT_ROLE_PERMISSIONS: ScopePermissionMap = {
  owner: Object.values(Permissions) as Permission[],
  admin: ORG_ROLE_PERMISSIONS.admin.filter(
    (p) => !p.startsWith('org:') && !p.startsWith('workspace:') && !p.startsWith('project:create') && !p.startsWith('project:delete'),
  ) as Permission[],
  member: [...ORG_ROLE_PERMISSIONS.member] as Permission[],
  viewer: [...ORG_ROLE_PERMISSIONS.viewer] as Permission[],
};

// ── Lookup Helper ──────────────────────────────────────────────

export function getPermissionsForRole(role: RoleName, scopeType: 'organization' | 'workspace' | 'project'): Permission[] {
  switch (scopeType) {
    case 'organization':
      return ORG_ROLE_PERMISSIONS[role];
    case 'workspace':
      return WORKSPACE_ROLE_PERMISSIONS[role];
    case 'project':
      return PROJECT_ROLE_PERMISSIONS[role];
  }
}

// ── Event Types ───────────────────────────────────────────────

export const EventTypes = {
  ISSUE_CREATED: 'issue:created',
  ISSUE_UPDATED: 'issue:updated',
  ISSUE_DELETED: 'issue:deleted',
  ISSUE_STATUS_CHANGED: 'issue:status_changed',
  ISSUE_ASSIGNED: 'issue:assigned',
  COMMENT_CREATED: 'comment:created',
  COMMENT_DELETED: 'comment:deleted',
  SPRINT_STARTED: 'sprint:started',
  SPRINT_COMPLETED: 'sprint:completed',
  MEMBERSHIP_ADDED: 'membership:added',
  MEMBERSHIP_REMOVED: 'membership:removed',
  MEMBERSHIP_ROLE_CHANGED: 'membership:role_changed',
  USER_REGISTERED: 'user:registered',
  USER_PASSWORD_CHANGED: 'user:password_changed',
  USER_TOKEN_REVOKED: 'user:token_revoked',
} as const;

export type AppEventType = (typeof EventTypes)[keyof typeof EventTypes];
