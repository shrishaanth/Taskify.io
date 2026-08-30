/**
 * Static seed data for Phase 4 screens. Shapes match src/types/domain.ts.
 * Phase 7 replaces the store that wraps this with real API calls.
 */
import type {
  AppNotification,
  BoardSummary,
  CardDetail,
  CardSummary,
  Column,
  OrgMemberRow,
  OrgSummary,
  ProjectMemberRow,
  ProjectSummary,
  UserRef,
} from "../types/domain";

export const CURRENT_USER_ID = "u-alex";

export const USERS: Record<string, UserRef> = {
  "u-alex": { id: "u-alex", name: "Alex Rivera", email: "alex@acme.com" },
  "u-sarah": { id: "u-sarah", name: "Sarah Chen", email: "sarah.chen@acme.com" },
  "u-marcus": { id: "u-marcus", name: "Marcus Vance", email: "marcus.v@acme.com" },
  "u-emma": { id: "u-emma", name: "Emma Watson", email: "emma.w@acme.com" },
  "u-david": { id: "u-david", name: "David Kim", email: "david.kim@acme.com" },
  "u-anna": { id: "u-anna", name: "Anna Vance", email: "anna@acme.com" },
};

export const ORGS: OrgSummary[] = [
  { id: "org-acme", name: "Acme Design Studio", slug: "acme-design-studio", role: "owner" },
  { id: "org-bright", name: "Bright Labs", slug: "bright-labs", role: "member" },
];

export const ORG_MEMBERS: Record<string, OrgMemberRow[]> = {
  "org-acme": [
    { user: USERS["u-anna"], role: "owner" },
    { user: USERS["u-alex"], role: "owner" },
    { user: USERS["u-sarah"], role: "admin" },
    { user: USERS["u-marcus"], role: "member" },
    { user: USERS["u-emma"], role: "member" },
    { user: USERS["u-david"], role: "member" },
  ],
  "org-bright": [{ user: USERS["u-alex"], role: "member" }],
};

export const PROJECTS: Record<string, ProjectSummary[]> = {
  "org-acme": [
    {
      id: "prj-ecom",
      name: "E-Commerce Redesign",
      description:
        "Collaborative board for managing task lists and team milestones for the Acme shop re-platforming.",
      category: "Web Development",
      role: "head",
      members: [USERS["u-alex"], USERS["u-sarah"], USERS["u-marcus"], USERS["u-emma"]],
    },
    {
      id: "prj-q3",
      name: "Q3 Marketing Strategy",
      description: "Collaborative board for managing task lists and team milestones.",
      category: "Marketing",
      role: "member",
      members: [USERS["u-sarah"], USERS["u-emma"], USERS["u-david"]],
    },
    {
      id: "prj-tokens",
      name: "Design System Tokens",
      description: "Collaborative board for managing task lists and team milestones.",
      category: "UI/UX Design",
      role: "head",
      members: [USERS["u-alex"], USERS["u-marcus"]],
    },
    {
      id: "prj-audit",
      name: "Private Financial Audit",
      category: "Finance",
      role: null,
      members: [],
    },
  ],
  "org-bright": [],
};

export const PROJECT_MEMBERS: Record<string, ProjectMemberRow[]> = {
  "prj-ecom": [
    { user: USERS["u-alex"], role: "head" },
    { user: USERS["u-sarah"], role: "member" },
    { user: USERS["u-marcus"], role: "member" },
    { user: USERS["u-emma"], role: "member" },
  ],
  "prj-q3": [
    { user: USERS["u-sarah"], role: "head" },
    { user: USERS["u-emma"], role: "member" },
    { user: USERS["u-david"], role: "member" },
  ],
  "prj-tokens": [
    { user: USERS["u-alex"], role: "head" },
    { user: USERS["u-marcus"], role: "member" },
  ],
};

export const BOARDS: Record<string, BoardSummary[]> = {
  "prj-ecom": [
    { id: "brd-sprint", projectId: "prj-ecom", name: "Sprint Backlog", cardCount: 6, colorKey: "green" },
    { id: "brd-design", projectId: "prj-ecom", name: "Design Tasks", cardCount: 8, colorKey: "purple" },
    { id: "brd-bugs", projectId: "prj-ecom", name: "Bug Tracker", cardCount: 4, colorKey: "red" },
    { id: "brd-mkt", projectId: "prj-ecom", name: "Marketing", cardCount: 6, colorKey: "amber" },
    { id: "brd-launch", projectId: "prj-ecom", name: "Launch Prep", cardCount: 15, colorKey: "sky" },
    { id: "brd-empty", projectId: "prj-ecom", name: "Fresh Board", cardCount: 0, colorKey: "pink" },
  ],
  "prj-q3": [
    { id: "brd-q3", projectId: "prj-q3", name: "Campaign Board", cardCount: 3, colorKey: "amber" },
  ],
  "prj-tokens": [],
};

export const BOARD_COLUMNS: Record<string, Column[]> = {
  "brd-sprint": [
    { id: "col-todo", name: "To Do", order: 0 },
    { id: "col-doing", name: "In Progress", order: 1 },
    { id: "col-review", name: "In Review", order: 2 },
    { id: "col-done", name: "Done", order: 3 },
  ],
  "brd-q3": [
    { id: "q3-todo", name: "To Do", order: 0 },
    { id: "q3-done", name: "Done", order: 1 },
  ],
  "brd-empty": [],
};

const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString();

export const CARDS: Record<string, CardSummary[]> = {
  "brd-sprint": [
    {
      id: "card-1",
      boardId: "brd-sprint",
      columnId: "col-todo",
      order: 0,
      title: "Design system token mapping and styleguide setup",
      labels: ["Design", "Priority"],
      assignees: [USERS["u-marcus"]],
      dueDate: iso(2026, 9, 20),
      priority: "high",
      subtaskDone: 3,
      subtaskTotal: 5,
      commentCount: 2,
    },
    {
      id: "card-2",
      boardId: "brd-sprint",
      columnId: "col-todo",
      order: 1,
      title: "Update homepage hero banner graphics for Fall launch",
      labels: ["Marketing"],
      assignees: [USERS["u-emma"]],
      dueDate: iso(2026, 9, 24),
      priority: "medium",
      subtaskDone: 0,
      subtaskTotal: 4,
      commentCount: 1,
    },
    {
      id: "card-3",
      boardId: "brd-sprint",
      columnId: "col-doing",
      order: 0,
      title: "Fix API integration bugs on checkout flows",
      labels: ["Development", "Bug"],
      assignees: [USERS["u-alex"]],
      dueDate: iso(2026, 9, 18),
      priority: "urgent",
      subtaskDone: 4,
      subtaskTotal: 8,
      commentCount: 12,
    },
    {
      id: "card-4",
      boardId: "brd-sprint",
      columnId: "col-review",
      order: 0,
      title: "E-Commerce flow audit & screen polish",
      labels: ["Design"],
      assignees: [USERS["u-sarah"]],
      dueDate: iso(2026, 9, 19),
      priority: "medium",
      subtaskDone: 5,
      subtaskTotal: 5,
      commentCount: 7,
    },
    {
      id: "card-5",
      boardId: "brd-sprint",
      columnId: "col-done",
      order: 0,
      title: "Sign-up flow technical documentation draft",
      labels: ["Docs"],
      assignees: [USERS["u-david"]],
      dueDate: iso(2026, 9, 12),
      priority: "low",
      subtaskDone: 3,
      subtaskTotal: 3,
      commentCount: 1,
    },
  ],
  "brd-q3": [],
};

export const CARD_DETAILS: Record<string, CardDetail> = {
  "card-2": {
    ...CARDS["brd-sprint"][1],
    description:
      "We need to refresh the current hero graphic for the upcoming Fall Fashion product launch. The graphics should feature high-contrast images of the core lifestyle jackets collection and follow the verified brand styling layout.",
    subtasks: [
      { id: "st-1", title: "Confirm exact marketing content copy and localized texts", done: true, assignee: USERS["u-sarah"] },
      { id: "st-2", title: "Source high-res photography asset files", done: true, assignee: USERS["u-alex"] },
      { id: "st-3", title: "Generate three initial layout drafts in Figma", done: true, assignee: USERS["u-sarah"] },
      { id: "st-4", title: "Gather design team feedback and choose final hero variation", done: false, assignee: USERS["u-marcus"] },
      { id: "st-5", title: "Export optimized files and upload to CMS templates", done: false, assignee: USERS["u-david"] },
    ],
    comments: [
      {
        id: "cm-1",
        author: USERS["u-alex"],
        body: "Just uploaded the final photo cuts for the Fall launch jackets. Sarah, let me know if these work with the chosen layouts!",
        createdAt: iso(2026, 7, 30),
      },
    ],
    attachments: [
      {
        id: "att-1",
        fileName: "hero_draft_v1.png",
        fileUrl: "/files/hero_draft_v1.png",
        mimeType: "image/png",
        sizeBytes: 2_400_000,
        uploadedBy: USERS["u-alex"],
      },
    ],
  },
};

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: "ntf-1",
    type: "card_assigned",
    title: 'You were assigned to "Homepage Redesign"',
    createdAt: new Date(Date.now() - 2 * 60_000).toISOString(),
    read: false,
  },
  {
    id: "ntf-2",
    type: "comment_mention",
    title: "Sarah commented on your task",
    createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    read: false,
  },
  {
    id: "ntf-3",
    type: "role_changed",
    title: "Your role was changed to Admin",
    createdAt: new Date(Date.now() - 26 * 60 * 60_000).toISOString(),
    read: true,
  },
  {
    id: "ntf-4",
    type: "due_soon",
    title: 'Task "Export CMS files" is due soon',
    createdAt: new Date(Date.now() - 28 * 60 * 60_000).toISOString(),
    read: true,
  },
];

/** Board ids whose "done" column should suppress overdue styling. */
export const DONE_COLUMN_IDS: Record<string, string[]> = {
  "brd-sprint": ["col-done"],
  "brd-q3": ["q3-done"],
};
