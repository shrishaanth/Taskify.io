import { create } from "zustand";
import * as fx from "../mocks/fixtures";
import type {
  AppNotification,
  BoardSummary,
  CardDetail,
  CardPatch,
  CardSummary,
  Column,
  Id,
  OrgMemberRow,
  OrgRole,
  OrgSummary,
  ProjectMemberRow,
  ProjectRole,
  ProjectSummary,
  UserRef,
} from "../types/domain";
import type { BoardColorKey } from "../styles/tokens";

let seq = 1000;
const nextId = (prefix: string) => `${prefix}-${++seq}`;
const clone = <T>(v: T): T => structuredClone(v);

/** Stable empty reference — selectors must never return a fresh `[]` (infinite loop). */
export const EMPTY = [] as never[];

interface CreateProjectInput {
  name: string;
  description?: string;
}
interface CreateBoardInput {
  name: string;
  colorKey: BoardColorKey;
}
interface InviteInput {
  email: string;
  role: string;
}

export interface MockDataState {
  currentUserId: Id;
  users: Record<Id, UserRef>;
  orgs: OrgSummary[];
  orgMembers: Record<Id, OrgMemberRow[]>;
  projects: Record<Id, ProjectSummary[]>;
  projectMembers: Record<Id, ProjectMemberRow[]>;
  boards: Record<Id, BoardSummary[]>;
  boardColumns: Record<Id, Column[]>;
  cards: Record<Id, CardSummary[]>;
  cardDetails: Record<Id, CardDetail>;
  notifications: AppNotification[];
  doneColumnIds: Record<Id, string[]>;

  // selectors (pure helpers)
  currentUser: () => UserRef;
  orgById: (orgId: Id) => OrgSummary | undefined;
  projectById: (orgId: Id, projectId: Id) => ProjectSummary | undefined;
  boardById: (boardId: Id) => BoardSummary | undefined;
  projectRoleFor: (projectId: Id) => ProjectRole | null;
  orgRoleFor: (orgId: Id) => OrgRole | null;
  /** Existing detail, or a minimal one synthesised from the card summary. */
  getCardDetail: (boardId: Id, cardId: Id) => CardDetail | undefined;

  // org actions
  createOrg: (name: string) => Id;
  updateOrgName: (orgId: Id, name: string) => void;
  inviteOrgMember: (orgId: Id, input: InviteInput) => void;
  setOrgMemberRole: (orgId: Id, userId: Id, role: OrgRole) => void;
  removeOrgMember: (orgId: Id, userId: Id) => void;
  markAllNotificationsRead: () => void;

  // project actions
  createProject: (orgId: Id, input: CreateProjectInput) => Id;
  inviteProjectMember: (projectId: Id, input: InviteInput) => void;
  setProjectMemberRole: (projectId: Id, userId: Id, role: ProjectRole) => void;
  removeProjectMember: (projectId: Id, userId: Id) => void;

  // board / column / card actions
  createBoard: (projectId: Id, orgId: Id, input: CreateBoardInput) => Id;
  addColumn: (boardId: Id, name: string) => void;
  renameColumn: (boardId: Id, columnId: string, name: string) => void;
  deleteColumn: (boardId: Id, columnId: string) => void;
  addCard: (boardId: Id, columnId: string, title: string) => void;
  updateCard: (cardId: Id, patch: CardPatch) => void;
  deleteCard: (boardId: Id, cardId: Id) => void;
  toggleSubtask: (cardId: Id, subtaskId: Id, done: boolean) => void;
  addSubtask: (cardId: Id, title: string) => void;
  addComment: (cardId: Id, body: string) => void;
  deleteComment: (cardId: Id, commentId: Id) => void;
  addAttachment: (cardId: Id, file: { name: string; size: number; type: string }) => void;
  deleteAttachment: (cardId: Id, attachmentId: Id) => void;
}

function seed() {
  return {
    currentUserId: fx.CURRENT_USER_ID,
    users: clone(fx.USERS),
    orgs: clone(fx.ORGS),
    orgMembers: clone(fx.ORG_MEMBERS),
    projects: clone(fx.PROJECTS),
    projectMembers: clone(fx.PROJECT_MEMBERS),
    boards: clone(fx.BOARDS),
    boardColumns: clone(fx.BOARD_COLUMNS),
    cards: clone(fx.CARDS),
    cardDetails: clone(fx.CARD_DETAILS),
    notifications: clone(fx.NOTIFICATIONS),
    doneColumnIds: clone(fx.DONE_COLUMN_IDS),
  };
}

export const useMockData = create<MockDataState>((set, get) => ({
  ...seed(),

  currentUser: () => get().users[get().currentUserId],
  orgById: (orgId) => get().orgs.find((o) => o.id === orgId),
  projectById: (orgId, projectId) =>
    (get().projects[orgId] ?? []).find((p) => p.id === projectId),
  boardById: (boardId) =>
    Object.values(get().boards)
      .flat()
      .find((b) => b.id === boardId),
  projectRoleFor: (projectId) => {
    const me = get().currentUserId;
    const row = (get().projectMembers[projectId] ?? []).find((m) => m.user.id === me);
    return row?.role ?? null;
  },
  orgRoleFor: (orgId) => {
    const me = get().currentUserId;
    const row = (get().orgMembers[orgId] ?? []).find((m) => m.user.id === me);
    return row?.role ?? null;
  },

  getCardDetail: (boardId, cardId) => {
    const existing = get().cardDetails[cardId];
    if (existing) return existing;
    const summary = (get().cards[boardId] ?? []).find((c) => c.id === cardId);
    if (!summary) return undefined;
    return { ...summary, subtasks: [], comments: [], attachments: [] };
  },

  createOrg: (name) => {
    const id = nextId("org");
    const me = get().users[get().currentUserId];
    set((s) => ({
      orgs: [...s.orgs, { id, name, slug: name.toLowerCase().replace(/\s+/g, "-"), role: "owner" }],
      orgMembers: { ...s.orgMembers, [id]: [{ user: me, role: "owner" }] },
      projects: { ...s.projects, [id]: [] },
    }));
    return id;
  },

  updateOrgName: (orgId, name) =>
    set((s) => ({
      orgs: s.orgs.map((o) => (o.id === orgId ? { ...o, name } : o)),
    })),

  inviteOrgMember: (orgId, { email, role }) =>
    set((s) => {
      const id = nextId("u");
      const user: UserRef = { id, name: email.split("@")[0], email };
      return {
        users: { ...s.users, [id]: user },
        orgMembers: {
          ...s.orgMembers,
          [orgId]: [...(s.orgMembers[orgId] ?? []), { user, role: role as OrgRole }],
        },
      };
    }),

  setOrgMemberRole: (orgId, userId, role) =>
    set((s) => ({
      orgMembers: {
        ...s.orgMembers,
        [orgId]: (s.orgMembers[orgId] ?? []).map((m) =>
          m.user.id === userId ? { ...m, role } : m,
        ),
      },
    })),

  removeOrgMember: (orgId, userId) =>
    set((s) => ({
      orgMembers: {
        ...s.orgMembers,
        [orgId]: (s.orgMembers[orgId] ?? []).filter((m) => m.user.id !== userId),
      },
    })),

  markAllNotificationsRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

  createProject: (orgId, { name, description }) => {
    const id = nextId("prj");
    const me = get().users[get().currentUserId];
    const project: ProjectSummary = {
      id,
      name,
      role: "head",
      members: [me],
      ...(description ? { description } : {}),
    };
    set((s) => ({
      projects: { ...s.projects, [orgId]: [...(s.projects[orgId] ?? []), project] },
      projectMembers: { ...s.projectMembers, [id]: [{ user: me, role: "head" }] },
      boards: { ...s.boards, [id]: [] },
    }));
    return id;
  },

  inviteProjectMember: (projectId, { email, role }) =>
    set((s) => {
      const existing = Object.values(s.users).find((u) => u.email === email);
      const user = existing ?? { id: nextId("u"), name: email.split("@")[0], email };
      return {
        users: existing ? s.users : { ...s.users, [user.id]: user },
        projectMembers: {
          ...s.projectMembers,
          [projectId]: [
            ...(s.projectMembers[projectId] ?? []).filter((m) => m.user.id !== user.id),
            { user, role: role as ProjectRole },
          ],
        },
      };
    }),

  setProjectMemberRole: (projectId, userId, role) =>
    set((s) => ({
      projectMembers: {
        ...s.projectMembers,
        [projectId]: (s.projectMembers[projectId] ?? []).map((m) =>
          m.user.id === userId ? { ...m, role } : m,
        ),
      },
    })),

  removeProjectMember: (projectId, userId) =>
    set((s) => ({
      projectMembers: {
        ...s.projectMembers,
        [projectId]: (s.projectMembers[projectId] ?? []).filter((m) => m.user.id !== userId),
      },
    })),

  createBoard: (projectId, orgId, { name, colorKey }) => {
    const id = nextId("brd");
    const board: BoardSummary = { id, projectId, name, cardCount: 0, colorKey };
    set((s) => ({
      boards: { ...s.boards, [projectId]: [...(s.boards[projectId] ?? []), board] },
      boardColumns: {
        ...s.boardColumns,
        [id]: [
          { id: nextId("col"), name: "To Do", order: 0 },
          { id: nextId("col"), name: "In Progress", order: 1 },
          { id: nextId("col"), name: "Done", order: 2 },
        ],
      },
      cards: { ...s.cards, [id]: [] },
    }));
    void orgId;
    return id;
  },

  addColumn: (boardId, name) =>
    set((s) => {
      const cols = s.boardColumns[boardId] ?? [];
      return {
        boardColumns: {
          ...s.boardColumns,
          [boardId]: [...cols, { id: nextId("col"), name, order: cols.length }],
        },
      };
    }),

  renameColumn: (boardId, columnId, name) =>
    set((s) => ({
      boardColumns: {
        ...s.boardColumns,
        [boardId]: (s.boardColumns[boardId] ?? []).map((c) =>
          c.id === columnId ? { ...c, name } : c,
        ),
      },
    })),

  deleteColumn: (boardId, columnId) =>
    set((s) => ({
      boardColumns: {
        ...s.boardColumns,
        [boardId]: (s.boardColumns[boardId] ?? []).filter((c) => c.id !== columnId),
      },
      cards: {
        ...s.cards,
        [boardId]: (s.cards[boardId] ?? []).filter((c) => c.columnId !== columnId),
      },
    })),

  addCard: (boardId, columnId, title) =>
    set((s) => {
      const list = s.cards[boardId] ?? [];
      const order = list.filter((c) => c.columnId === columnId).length;
      const card: CardSummary = {
        id: nextId("card"),
        boardId,
        columnId,
        order,
        title,
        labels: [],
        assignees: [],
        subtaskDone: 0,
        subtaskTotal: 0,
        commentCount: 0,
      };
      return { cards: { ...s.cards, [boardId]: [...list, card] } };
    }),

  updateCard: (cardId, patch) =>
    set((s) => {
      const detail = s.cardDetails[cardId];
      const users = s.users;
      const apply = <T extends CardSummary>(c: T): T => {
        const next: T = { ...c };
        if (patch.title !== undefined) next.title = patch.title;
        if (patch.labels !== undefined) next.labels = patch.labels;
        if (patch.priority !== undefined) next.priority = patch.priority;
        if (patch.dueDate !== undefined) {
          if (patch.dueDate === null) delete next.dueDate;
          else next.dueDate = patch.dueDate;
        }
        if (patch.assigneeIds !== undefined) {
          next.assignees = patch.assigneeIds
            .map((id) => users[id])
            .filter((u): u is UserRef => Boolean(u));
        }
        return next;
      };
      const nextCards: Record<Id, CardSummary[]> = {};
      for (const [bid, list] of Object.entries(s.cards)) {
        nextCards[bid] = list.map((c) => (c.id === cardId ? apply(c) : c));
      }
      return {
        cards: nextCards,
        cardDetails: detail
          ? { ...s.cardDetails, [cardId]: apply(detail) }
          : s.cardDetails,
      };
    }),

  deleteCard: (boardId, cardId) =>
    set((s) => ({
      cards: { ...s.cards, [boardId]: (s.cards[boardId] ?? []).filter((c) => c.id !== cardId) },
    })),

  toggleSubtask: (cardId, subtaskId, done) =>
    set((s) => {
      const detail = s.cardDetails[cardId];
      if (!detail) return s;
      const subtasks = detail.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, done } : st,
      );
      const subtaskDone = subtasks.filter((st) => st.done).length;
      return {
        cardDetails: {
          ...s.cardDetails,
          [cardId]: { ...detail, subtasks, subtaskDone },
        },
      };
    }),

  addSubtask: (cardId, title) =>
    set((s) => {
      const detail = s.cardDetails[cardId];
      if (!detail) return s;
      const subtasks = [
        ...detail.subtasks,
        { id: nextId("st"), title, done: false },
      ];
      return {
        cardDetails: {
          ...s.cardDetails,
          [cardId]: { ...detail, subtasks, subtaskTotal: subtasks.length },
        },
      };
    }),

  addComment: (cardId, body) =>
    set((s) => {
      const detail = s.cardDetails[cardId];
      if (!detail) return s;
      const comment = {
        id: nextId("cm"),
        author: s.users[s.currentUserId],
        body,
        createdAt: new Date().toISOString(),
      };
      return {
        cardDetails: {
          ...s.cardDetails,
          [cardId]: {
            ...detail,
            comments: [...detail.comments, comment],
            commentCount: detail.comments.length + 1,
          },
        },
      };
    }),

  deleteComment: (cardId, commentId) =>
    set((s) => {
      const detail = s.cardDetails[cardId];
      if (!detail) return s;
      const comments = detail.comments.filter((c) => c.id !== commentId);
      return {
        cardDetails: {
          ...s.cardDetails,
          [cardId]: { ...detail, comments, commentCount: comments.length },
        },
      };
    }),

  addAttachment: (cardId, file) =>
    set((s) => {
      const detail = s.cardDetails[cardId];
      if (!detail) return s;
      const attachment = {
        id: nextId("att"),
        fileName: file.name,
        fileUrl: `/files/${file.name}`,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedBy: s.users[s.currentUserId],
      };
      return {
        cardDetails: {
          ...s.cardDetails,
          [cardId]: { ...detail, attachments: [...detail.attachments, attachment] },
        },
      };
    }),

  deleteAttachment: (cardId, attachmentId) =>
    set((s) => {
      const detail = s.cardDetails[cardId];
      if (!detail) return s;
      return {
        cardDetails: {
          ...s.cardDetails,
          [cardId]: {
            ...detail,
            attachments: detail.attachments.filter((a) => a.id !== attachmentId),
          },
        },
      };
    }),
}));

/** Reset the store to the seed fixtures — used between tests. */
export function resetMockData() {
  seq = 1000;
  useMockData.setState(seed());
}
