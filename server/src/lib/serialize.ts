import { Types } from "mongoose";

type Id = Types.ObjectId | string;

interface WithTimestamps {
  createdAt?: Date;
  updatedAt?: Date;
}

const iso = (d?: Date) => (d ? d.toISOString() : undefined);

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export function userDto(u: {
  _id: Id;
  email: string;
  name: string;
  avatarUrl?: string | null;
}): UserDto {
  return {
    id: String(u._id),
    email: u.email,
    name: u.name,
    ...(u.avatarUrl ? { avatarUrl: u.avatarUrl } : {}),
  };
}

export function orgDto(o: {
  _id: Id;
  name: string;
  slug: string;
}): { id: string; name: string; slug: string } {
  return { id: String(o._id), name: o.name, slug: o.slug };
}

export function projectDto(p: {
  _id: Id;
  organizationId: Id;
  name: string;
  description?: string | null;
} & WithTimestamps) {
  return {
    id: String(p._id),
    organizationId: String(p.organizationId),
    name: p.name,
    ...(p.description ? { description: p.description } : {}),
    createdAt: iso(p.createdAt),
    updatedAt: iso(p.updatedAt),
  };
}

export function boardDto(
  b: {
    _id: Id;
    organizationId: Id;
    projectId: Id;
    name: string;
    columns: { id: string; name: string; order: number }[];
  } & WithTimestamps,
  extra?: { cardCount?: number },
) {
  return {
    id: String(b._id),
    organizationId: String(b.organizationId),
    projectId: String(b.projectId),
    name: b.name,
    columns: b.columns
      .map((c) => ({ id: c.id, name: c.name, order: c.order }))
      .sort((a, z) => a.order - z.order),
    ...(extra?.cardCount !== undefined ? { cardCount: extra.cardCount } : {}),
    createdAt: iso(b.createdAt),
    updatedAt: iso(b.updatedAt),
  };
}

export interface CardExtras {
  assignees?: UserDto[];
  subtaskDone?: number;
  subtaskTotal?: number;
  commentCount?: number;
}

export function cardDto(
  c: {
    _id: Id;
    organizationId: Id;
    boardId: Id;
    columnId: string;
    order: number;
    title: string;
    description?: string | null;
    labels: string[];
    assigneeIds: Id[];
    dueDate?: Date | null;
    priority?: string | null;
  } & WithTimestamps,
  extra: CardExtras = {},
) {
  return {
    id: String(c._id),
    organizationId: String(c.organizationId),
    boardId: String(c.boardId),
    columnId: c.columnId,
    order: c.order,
    title: c.title,
    ...(c.description ? { description: c.description } : {}),
    labels: [...c.labels],
    assigneeIds: c.assigneeIds.map(String),
    assignees: extra.assignees ?? [],
    subtaskDone: extra.subtaskDone ?? 0,
    subtaskTotal: extra.subtaskTotal ?? 0,
    commentCount: extra.commentCount ?? 0,
    ...(c.dueDate ? { dueDate: c.dueDate.toISOString() } : {}),
    ...(c.priority ? { priority: c.priority } : {}),
    createdAt: iso(c.createdAt),
    updatedAt: iso(c.updatedAt),
  };
}

export function subtaskDto(s: {
  _id: Id;
  cardId: Id;
  title: string;
  assigneeId?: Id | null;
  done: boolean;
}) {
  return {
    id: String(s._id),
    cardId: String(s.cardId),
    title: s.title,
    ...(s.assigneeId ? { assigneeId: String(s.assigneeId) } : {}),
    done: s.done,
  };
}

export function commentDto(
  c: {
    _id: Id;
    cardId: Id;
    authorId: Id;
    body: string;
  } & WithTimestamps,
  author?: UserDto,
) {
  return {
    id: String(c._id),
    cardId: String(c.cardId),
    authorId: String(c.authorId),
    ...(author ? { author } : {}),
    body: c.body,
    createdAt: iso(c.createdAt),
  };
}

export function attachmentDto(a: {
  _id: Id;
  cardId: Id;
  uploadedById: Id;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
} & WithTimestamps) {
  return {
    id: String(a._id),
    cardId: String(a.cardId),
    uploadedById: String(a.uploadedById),
    fileName: a.fileName,
    fileUrl: a.fileUrl,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    createdAt: iso(a.createdAt),
  };
}

function notificationTitle(type: string, payload: unknown): string {
  const p = (payload ?? {}) as Record<string, unknown>;
  const card = typeof p.cardTitle === "string" ? p.cardTitle : "a card";
  const ctx =
    typeof p.contextName === "string" ? p.contextName : "your workspace";
  const who =
    typeof p.acceptedByName === "string" ? p.acceptedByName : "Someone";
  switch (type) {
    case "card_assigned":
      return `You were assigned to "${card}"`;
    case "comment_mention":
      return `New comment on "${card}"`;
    case "role_changed":
      return `Your role changed in ${ctx}`;
    case "invite_accepted":
      return `${who} accepted your invitation to ${ctx}`;
    default:
      return "You have a new notification";
  }
}

export function notificationDto(n: {
  _id: Id;
  userId: Id;
  type: string;
  payload: unknown;
  read: boolean;
} & WithTimestamps) {
  return {
    id: String(n._id),
    userId: String(n.userId),
    type: n.type,
    title: notificationTitle(n.type, n.payload),
    payload: n.payload ?? {},
    read: n.read,
    createdAt: iso(n.createdAt),
  };
}

export function orgInviteDto(
  i: {
    _id: Id;
    organizationId: Id;
    email: string;
    role: string;
    token: string;
    expiresAt: Date;
  } & WithTimestamps,
  extra?: { invitedBy?: UserDto },
) {
  return {
    id: String(i._id),
    organizationId: String(i.organizationId),
    email: i.email,
    role: i.role,
    token: i.token,
    ...(extra?.invitedBy ? { invitedBy: extra.invitedBy } : {}),
    expiresAt: i.expiresAt.toISOString(),
    createdAt: iso(i.createdAt),
  };
}
