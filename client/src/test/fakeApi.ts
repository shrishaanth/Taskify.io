/**
 * In-memory backend used by the MSW handlers in tests. Shapes match the real
 * API responses (server DTOs), so the client api/ layer is exercised for real.
 */
import type {
  AppNotification,
  OrgRole,
  ProjectRole,
  UserRef,
} from "../types/domain";

interface Org {
  id: string;
  name: string;
  slug: string;
}
interface OrgMembership {
  orgId: string;
  userId: string;
  role: OrgRole;
}
interface Project {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
}
interface ProjectMembership {
  projectId: string;
  userId: string;
  role: ProjectRole;
}
interface Column {
  id: string;
  name: string;
  order: number;
}
interface Board {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  columns: Column[];
}
interface Card {
  id: string;
  organizationId: string;
  boardId: string;
  columnId: string;
  order: number;
  title: string;
  description?: string;
  labels: string[];
  assigneeIds: string[];
  dueDate?: string;
  priority?: string;
}
interface Subtask {
  id: string;
  cardId: string;
  title: string;
  assigneeId?: string;
  done: boolean;
}
interface Comment {
  id: string;
  cardId: string;
  authorId: string;
  body: string;
  createdAt: string;
}
interface OrgInviteRow {
  id: string;
  orgId: string;
  email: string;
  role: "admin" | "member";
  token: string;
  invitedById: string;
  expiresAt: string;
  acceptedAt?: string;
}

export interface FakeDb {
  users: Record<string, UserRef & { password: string }>;
  orgs: Org[];
  orgMembers: OrgMembership[];
  projects: Project[];
  projectMembers: ProjectMembership[];
  boards: Board[];
  cards: Card[];
  subtasks: Subtask[];
  comments: Comment[];
  invites: OrgInviteRow[];
  notifications: AppNotification[];
}

let seq = 0;
export const nextId = (p: string) => `${p}-${++seq}`;

const U = (id: string, name: string): UserRef & { password: string } => ({
  id,
  name,
  email: `${id}@acme.test`,
  password: "supersecret1",
});

export function seedDb(): FakeDb {
  seq = 1000;
  const users = {
    "u-alex": U("u-alex", "Alex Rivera"),
    "u-sarah": U("u-sarah", "Sarah Chen"),
    "u-marcus": U("u-marcus", "Marcus Vance"),
    "u-emma": U("u-emma", "Emma Watson"),
    "u-david": U("u-david", "David Kim"),
    "u-anna": U("u-anna", "Anna Vance"),
    // exists but belongs to no organization yet (has a pending invite)
    "u-noorg": U("u-noorg", "Nadia Ortiz"),
  };

  const db: FakeDb = {
    users,
    orgs: [
      { id: "org-acme", name: "Acme Design Studio", slug: "acme-design-studio" },
      { id: "org-bright", name: "Bright Labs", slug: "bright-labs" },
    ],
    orgMembers: [
      { orgId: "org-acme", userId: "u-anna", role: "owner" },
      { orgId: "org-acme", userId: "u-alex", role: "owner" },
      { orgId: "org-acme", userId: "u-sarah", role: "admin" },
      { orgId: "org-acme", userId: "u-marcus", role: "member" },
      { orgId: "org-acme", userId: "u-emma", role: "member" },
      { orgId: "org-acme", userId: "u-david", role: "member" },
      { orgId: "org-bright", userId: "u-alex", role: "member" },
    ],
    projects: [
      {
        id: "prj-ecom",
        organizationId: "org-acme",
        name: "E-Commerce Redesign",
        description: "Collaborative board for managing task lists and milestones.",
      },
      { id: "prj-q3", organizationId: "org-acme", name: "Q3 Marketing Strategy" },
      { id: "prj-tokens", organizationId: "org-acme", name: "Design System Tokens" },
      { id: "prj-audit", organizationId: "org-acme", name: "Private Financial Audit" },
    ],
    projectMembers: [
      { projectId: "prj-ecom", userId: "u-alex", role: "head" },
      { projectId: "prj-ecom", userId: "u-sarah", role: "member" },
      { projectId: "prj-ecom", userId: "u-marcus", role: "member" },
      { projectId: "prj-q3", userId: "u-sarah", role: "head" },
      { projectId: "prj-q3", userId: "u-alex", role: "member" },
      { projectId: "prj-tokens", userId: "u-alex", role: "head" },
      // prj-audit: Alex has NO membership (403 case)
    ],
    boards: [
      {
        id: "brd-sprint",
        organizationId: "org-acme",
        projectId: "prj-ecom",
        name: "Sprint Backlog",
        columns: [
          { id: "col-todo", name: "To Do", order: 0 },
          { id: "col-doing", name: "In Progress", order: 1 },
          { id: "col-review", name: "In Review", order: 2 },
          { id: "col-done", name: "Done", order: 3 },
        ],
      },
      {
        id: "brd-empty",
        organizationId: "org-acme",
        projectId: "prj-ecom",
        name: "Fresh Board",
        columns: [],
      },
    ],
    cards: [
      {
        id: "card-1",
        organizationId: "org-acme",
        boardId: "brd-sprint",
        columnId: "col-todo",
        order: 0,
        title: "Design system token mapping and styleguide setup",
        labels: ["Design", "Priority"],
        assigneeIds: ["u-marcus"],
        priority: "high",
      },
      {
        id: "card-2",
        organizationId: "org-acme",
        boardId: "brd-sprint",
        columnId: "col-todo",
        order: 1,
        title: "Update homepage hero banner graphics",
        description: "Refresh the hero graphic for the Fall launch.",
        labels: ["Marketing"],
        assigneeIds: ["u-sarah"],
      },
      {
        id: "card-3",
        organizationId: "org-acme",
        boardId: "brd-sprint",
        columnId: "col-doing",
        order: 0,
        title: "Fix API integration bugs on checkout flows",
        labels: ["Bug"],
        assigneeIds: ["u-alex"],
      },
      {
        id: "card-4",
        organizationId: "org-acme",
        boardId: "brd-sprint",
        columnId: "col-review",
        order: 0,
        title: "E-Commerce flow audit",
        labels: [],
        assigneeIds: [],
      },
    ],
    subtasks: [
      { id: "st-1", cardId: "card-2", title: "Confirm copy", done: true },
      { id: "st-2", cardId: "card-2", title: "Gather feedback", done: false },
    ],
    comments: [
      {
        id: "cm-1",
        cardId: "card-2",
        authorId: "u-alex",
        body: "Uploaded the final photo cuts.",
        createdAt: new Date(Date.now() - 3_600_000).toISOString(),
      },
    ],
    invites: [
      {
        id: "inv-seed",
        orgId: "org-acme",
        email: "pending.hire@acme.test",
        role: "member",
        token: "seed-invite-token",
        invitedById: "u-alex",
        expiresAt: new Date(Date.now() + 6 * 86_400_000).toISOString(),
      },
      {
        // existing user (Sarah) invited into an org she's not a member of
        id: "inv-bright",
        orgId: "org-bright",
        email: "u-sarah@acme.test",
        role: "member",
        token: "bright-invite-token",
        invitedById: "u-alex",
        expiresAt: new Date(Date.now() + 6 * 86_400_000).toISOString(),
      },
      {
        // pending invite for the org-less user, surfaced on the Welcome page
        id: "inv-welcome",
        orgId: "org-acme",
        email: "u-noorg@acme.test",
        role: "member",
        token: "welcome-invite-token",
        invitedById: "u-alex",
        expiresAt: new Date(Date.now() + 6 * 86_400_000).toISOString(),
      },
    ],
    notifications: [
      {
        id: "ntf-1",
        type: "card_assigned",
        title: 'You were assigned to "Homepage Redesign"',
        createdAt: new Date(Date.now() - 120_000).toISOString(),
        read: false,
      },
      {
        id: "ntf-2",
        type: "role_changed",
        title: "Your role was changed to Admin",
        createdAt: new Date(Date.now() - 90_000_000).toISOString(),
        read: true,
      },
    ],
  };
  return db;
}

export let db: FakeDb = seedDb();
export function resetDb() {
  db = seedDb();
}

/* selectors */
export const orgRoleOf = (orgId: string, userId: string) =>
  db.orgMembers.find((m) => m.orgId === orgId && m.userId === userId)?.role ??
  null;
export const projectRoleOf = (projectId: string, userId: string) =>
  db.projectMembers.find(
    (m) => m.projectId === projectId && m.userId === userId,
  )?.role ?? null;
export const userRef = (id: string): UserRef => {
  const u = db.users[id];
  return u
    ? { id: u.id, name: u.name, ...(u.email ? { email: u.email } : {}) }
    : { id, name: "Unknown" };
};
