import { HttpResponse, http } from "msw";
import {
  db,
  nextId,
  orgRoleOf,
  projectRoleOf,
  userRef,
} from "./fakeApi";

const BASE = "http://localhost:4000/api/v1";

const err = (status: number, code: string, message = code) =>
  HttpResponse.json({ message, code }, { status });
const notFound = () => err(404, "NOT_FOUND", "Not found");
const forbidden = () => err(403, "FORBIDDEN", "Forbidden");
const unauth = () => err(401, "UNAUTHENTICATED", "Auth required");

function callerId(request: Request): string | null {
  const h = request.headers.get("authorization") ?? "";
  const m = h.match(/^Bearer test:(.+)$/);
  return m ? m[1] : null;
}

/** org ids the caller belongs to */
const callerOrgIds = (uid: string) =>
  db.orgMembers.filter((m) => m.userId === uid).map((m) => m.orgId);

function cardDto(cardId: string) {
  const c = db.cards.find((x) => x.id === cardId)!;
  const subs = db.subtasks.filter((s) => s.cardId === cardId);
  return {
    id: c.id,
    boardId: c.boardId,
    columnId: c.columnId,
    order: c.order,
    title: c.title,
    ...(c.description ? { description: c.description } : {}),
    labels: [...c.labels],
    assigneeIds: [...c.assigneeIds],
    assignees: c.assigneeIds.map(userRef),
    subtaskDone: subs.filter((s) => s.done).length,
    subtaskTotal: subs.length,
    commentCount: db.comments.filter((x) => x.cardId === cardId).length,
    ...(c.dueDate ? { dueDate: c.dueDate } : {}),
    ...(c.priority ? { priority: c.priority } : {}),
  };
}

export const handlers = [
  /* ---------------- auth ---------------- */
  http.post(`${BASE}/auth/signup`, async ({ request }) => {
    const b = (await request.json()) as {
      email: string;
      name: string;
      password: string;
    };
    if (Object.values(db.users).some((u) => u.email === b.email)) {
      return err(409, "CONFLICT", "Email exists");
    }
    const id = nextId("u");
    db.users[id] = { id, name: b.name, email: b.email, password: b.password };
    return HttpResponse.json(
      { user: userRef(id), accessToken: `test:${id}`, refreshToken: "r" },
      { status: 201 },
    );
  }),
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const b = (await request.json()) as { email: string; password: string };
    const u = Object.values(db.users).find(
      (x) => x.email === b.email && x.password === b.password,
    );
    if (!u) return unauth();
    return HttpResponse.json({
      user: userRef(u.id),
      accessToken: `test:${u.id}`,
      refreshToken: "r",
    });
  }),
  http.post(`${BASE}/auth/refresh`, () => unauth()),
  http.post(`${BASE}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${BASE}/auth/me`, ({ request }) => {
    const uid = callerId(request);
    if (!uid || !db.users[uid]) return unauth();
    return HttpResponse.json({
      user: userRef(uid),
      memberships: db.orgMembers
        .filter((m) => m.userId === uid)
        .map((m) => {
          const org = db.orgs.find((o) => o.id === m.orgId)!;
          return {
            organizationId: org.id,
            role: m.role,
            organization: { id: org.id, name: org.name, slug: org.slug },
          };
        }),
    });
  }),

  /* ---------------- orgs ---------------- */
  http.post(`${BASE}/orgs`, async ({ request }) => {
    const uid = callerId(request);
    if (!uid) return unauth();
    const { name } = (await request.json()) as { name: string };
    const id = nextId("org");
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (db.orgs.some((o) => o.slug === slug)) slug = `${slug}-2`;
    db.orgs.push({ id, name, slug });
    db.orgMembers.push({ orgId: id, userId: uid, role: "owner" });
    return HttpResponse.json({ id, name, slug }, { status: 201 });
  }),
  http.patch(`${BASE}/orgs/:orgId`, async ({ request, params }) => {
    const uid = callerId(request);
    const orgId = params.orgId as string;
    const role = uid ? orgRoleOf(orgId, uid) : null;
    if (!role) return notFound();
    if (role !== "owner" && role !== "admin") return forbidden();
    const patch = (await request.json()) as { name?: string };
    const org = db.orgs.find((o) => o.id === orgId)!;
    if (patch.name) org.name = patch.name;
    return HttpResponse.json({ id: org.id, name: org.name, slug: org.slug });
  }),
  http.get(`${BASE}/orgs/:orgId/members`, ({ request, params }) => {
    const uid = callerId(request);
    const orgId = params.orgId as string;
    if (!uid || !orgRoleOf(orgId, uid)) return notFound();
    return HttpResponse.json(
      db.orgMembers
        .filter((m) => m.orgId === orgId)
        .map((m) => ({ user: userRef(m.userId), role: m.role })),
    );
  }),
  http.get(`${BASE}/orgs/invites/mine`, ({ request }) => {
    const uid = callerId(request);
    const me = uid ? db.users[uid] : undefined;
    if (!me) return unauth();
    return HttpResponse.json(
      db.invites
        .filter(
          (i) =>
            i.email === me.email &&
            !i.acceptedAt &&
            Date.parse(i.expiresAt) > Date.now(),
        )
        .map((i) => {
          const org = db.orgs.find((o) => o.id === i.orgId)!;
          return {
            id: i.id,
            organizationId: i.orgId,
            email: i.email,
            role: i.role,
            token: i.token,
            invitedBy: userRef(i.invitedById),
            expiresAt: i.expiresAt,
            organization: { id: org.id, name: org.name, slug: org.slug },
          };
        }),
    );
  }),
  http.get(`${BASE}/orgs/:orgId/invites`, ({ request, params }) => {
    const uid = callerId(request);
    const orgId = params.orgId as string;
    const role = uid ? orgRoleOf(orgId, uid) : null;
    if (!role) return notFound();
    if (role !== "owner" && role !== "admin") return forbidden();
    return HttpResponse.json(
      db.invites
        .filter(
          (i) =>
            i.orgId === orgId &&
            !i.acceptedAt &&
            Date.parse(i.expiresAt) > Date.now(),
        )
        .map((i) => ({
          id: i.id,
          organizationId: i.orgId,
          email: i.email,
          role: i.role,
          token: i.token,
          invitedBy: userRef(i.invitedById),
          expiresAt: i.expiresAt,
        })),
    );
  }),
  http.post(`${BASE}/orgs/:orgId/invites`, async ({ request, params }) => {
    const uid = callerId(request);
    const orgId = params.orgId as string;
    const role = uid ? orgRoleOf(orgId, uid) : null;
    if (!role) return notFound();
    if (role !== "owner" && role !== "admin") return forbidden();
    const b = (await request.json()) as {
      email: string;
      role: "admin" | "member";
    };
    const email = b.email.toLowerCase().trim();
    const existing = Object.values(db.users).find((x) => x.email === email);
    if (existing && orgRoleOf(orgId, existing.id)) {
      return err(409, "CONFLICT", "That user is already a member");
    }
    const id = nextId("inv");
    const token = `tok-${id}`;
    db.invites.push({
      id,
      orgId,
      email,
      role: b.role,
      token,
      invitedById: uid!,
      expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    });
    return HttpResponse.json(
      {
        id,
        organizationId: orgId,
        email,
        role: b.role,
        token,
        expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      },
      { status: 201 },
    );
  }),
  http.delete(
    `${BASE}/orgs/:orgId/invites/:inviteId`,
    ({ request, params }) => {
      const uid = callerId(request);
      const orgId = params.orgId as string;
      const role = uid ? orgRoleOf(orgId, uid) : null;
      if (!role) return notFound();
      if (role !== "owner" && role !== "admin") return forbidden();
      const before = db.invites.length;
      db.invites = db.invites.filter(
        (i) => !(i.id === params.inviteId && i.orgId === orgId && !i.acceptedAt),
      );
      if (db.invites.length === before) return notFound();
      return new HttpResponse(null, { status: 204 });
    },
  ),
  http.post(
    `${BASE}/orgs/invites/:token/accept`,
    async ({ request, params }) => {
      const token = params.token as string;
      const inv = db.invites.find((i) => i.token === token);
      if (!inv || inv.acceptedAt || Date.parse(inv.expiresAt) < Date.now()) {
        return notFound();
      }
      const uid = callerId(request);
      const body = (await request.json().catch(() => ({}))) as {
        name?: string;
        password?: string;
      };

      let userId: string;
      let createdUser: (typeof db.users)[string] | null = null;

      if (uid) {
        const u = db.users[uid];
        if (!u) return unauth();
        if (u.email !== inv.email) return forbidden();
        userId = u.id;
      } else {
        const clash = Object.values(db.users).find(
          (x) => x.email === inv.email,
        );
        if (clash) {
          return err(409, "CONFLICT", "An account exists — log in first");
        }
        if (!body.name || !body.password) {
          return err(400, "VALIDATION_ERROR", "name and password required");
        }
        const id = nextId("u");
        db.users[id] = {
          id,
          name: body.name,
          email: inv.email,
          password: body.password,
        };
        createdUser = db.users[id];
        userId = id;
      }

      if (!db.orgMembers.some((m) => m.orgId === inv.orgId && m.userId === userId)) {
        db.orgMembers.push({ orgId: inv.orgId, userId, role: inv.role });
      }
      inv.acceptedAt = new Date().toISOString();

      const payload: Record<string, unknown> = {
        organizationId: inv.orgId,
        role: inv.role,
      };
      if (createdUser) {
        payload.user = userRef(createdUser.id);
        payload.accessToken = `test:${createdUser.id}`;
      }
      return HttpResponse.json(payload, {
        status: createdUser ? 201 : 200,
      });
    },
  ),
  http.patch(
    `${BASE}/orgs/:orgId/members/:userId`,
    async ({ request, params }) => {
      const uid = callerId(request);
      const orgId = params.orgId as string;
      const role = uid ? orgRoleOf(orgId, uid) : null;
      if (!role) return notFound();
      if (role !== "owner" && role !== "admin") return forbidden();
      const b = (await request.json()) as { role: string };
      const target = params.userId as string;
      const mem = db.orgMembers.find(
        (m) => m.orgId === orgId && m.userId === target,
      );
      if (!mem) return notFound();
      if (
        mem.role === "owner" &&
        b.role !== "owner" &&
        db.orgMembers.filter((m) => m.orgId === orgId && m.role === "owner")
          .length <= 1
      ) {
        return err(409, "CONFLICT", "Last owner");
      }
      mem.role = b.role as "owner" | "admin" | "member";
      return HttpResponse.json({ userId: target, role: mem.role });
    },
  ),
  http.delete(`${BASE}/orgs/:orgId/members/:userId`, ({ request, params }) => {
    const uid = callerId(request);
    const orgId = params.orgId as string;
    const role = uid ? orgRoleOf(orgId, uid) : null;
    if (!role) return notFound();
    if (role !== "owner" && role !== "admin") return forbidden();
    const target = params.userId as string;
    const mem = db.orgMembers.find(
      (m) => m.orgId === orgId && m.userId === target,
    );
    if (!mem) return notFound();
    if (
      mem.role === "owner" &&
      db.orgMembers.filter((m) => m.orgId === orgId && m.role === "owner")
        .length <= 1
    ) {
      return err(409, "CONFLICT", "Last owner");
    }
    db.orgMembers = db.orgMembers.filter(
      (m) => !(m.orgId === orgId && m.userId === target),
    );
    return new HttpResponse(null, { status: 204 });
  }),

  /* ---------------- projects ---------------- */
  http.get(`${BASE}/orgs/:orgId/projects`, ({ request, params }) => {
    const uid = callerId(request);
    const orgId = params.orgId as string;
    if (!uid || !orgRoleOf(orgId, uid)) return notFound();
    return HttpResponse.json(
      db.projects
        .filter((p) => p.organizationId === orgId)
        .map((p) => {
          const role = projectRoleOf(p.id, uid);
          if (!role) return { id: p.id, name: p.name, role: null, members: [] };
          const members = db.projectMembers
            .filter((m) => m.projectId === p.id)
            .map((m) => userRef(m.userId));
          return {
            id: p.id,
            name: p.name,
            ...(p.description ? { description: p.description } : {}),
            role,
            members,
          };
        }),
    );
  }),
  http.post(`${BASE}/orgs/:orgId/projects`, async ({ request, params }) => {
    const uid = callerId(request);
    const orgId = params.orgId as string;
    if (!uid || !orgRoleOf(orgId, uid)) return notFound();
    const b = (await request.json()) as { name: string; description?: string };
    const id = nextId("prj");
    db.projects.push({
      id,
      organizationId: orgId,
      name: b.name,
      ...(b.description ? { description: b.description } : {}),
    });
    db.projectMembers.push({ projectId: id, userId: uid, role: "head" });
    return HttpResponse.json(
      {
        id,
        name: b.name,
        ...(b.description ? { description: b.description } : {}),
        role: "head",
      },
      { status: 201 },
    );
  }),
  http.get(
    `${BASE}/orgs/:orgId/projects/:projectId`,
    ({ request, params }) => {
      const uid = callerId(request);
      const orgId = params.orgId as string;
      const projectId = params.projectId as string;
      if (!uid || !orgRoleOf(orgId, uid)) return notFound();
      const p = db.projects.find(
        (x) => x.id === projectId && x.organizationId === orgId,
      );
      if (!p) return notFound();
      const role = projectRoleOf(projectId, uid);
      if (!role) return forbidden();
      const members = db.projectMembers
        .filter((m) => m.projectId === projectId)
        .map((m) => ({ user: userRef(m.userId), role: m.role }));
      return HttpResponse.json({
        id: p.id,
        name: p.name,
        ...(p.description ? { description: p.description } : {}),
        role,
        members,
      });
    },
  ),
  http.patch(
    `${BASE}/orgs/:orgId/projects/:projectId`,
    async ({ request, params }) => {
      const uid = callerId(request);
      const orgId = params.orgId as string;
      const projectId = params.projectId as string;
      if (!uid || !orgRoleOf(orgId, uid)) return notFound();
      if (projectRoleOf(projectId, uid) !== "head") return forbidden();
      const b = (await request.json()) as {
        name?: string;
        description?: string | null;
      };
      const p = db.projects.find((x) => x.id === projectId)!;
      if (b.name) p.name = b.name;
      if (b.description === null) delete p.description;
      else if (b.description !== undefined) p.description = b.description;
      return HttpResponse.json({ id: p.id, name: p.name, organizationId: orgId });
    },
  ),
  http.delete(
    `${BASE}/orgs/:orgId/projects/:projectId`,
    ({ request, params }) => {
      const uid = callerId(request);
      const orgId = params.orgId as string;
      const projectId = params.projectId as string;
      if (!uid || !orgRoleOf(orgId, uid)) return notFound();
      if (projectRoleOf(projectId, uid) !== "head") return forbidden();
      db.projects = db.projects.filter((p) => p.id !== projectId);
      db.projectMembers = db.projectMembers.filter(
        (m) => m.projectId !== projectId,
      );
      return new HttpResponse(null, { status: 204 });
    },
  ),
  http.get(
    `${BASE}/orgs/:orgId/projects/:projectId/members`,
    ({ request, params }) => {
      const uid = callerId(request);
      const projectId = params.projectId as string;
      if (!uid || !projectRoleOf(projectId, uid)) return forbidden();
      return HttpResponse.json(
        db.projectMembers
          .filter((m) => m.projectId === projectId)
          .map((m) => ({ user: userRef(m.userId), role: m.role })),
      );
    },
  ),
  http.put(
    `${BASE}/orgs/:orgId/projects/:projectId/members/:userId`,
    async ({ request, params }) => {
      const uid = callerId(request);
      const orgId = params.orgId as string;
      const projectId = params.projectId as string;
      const target = params.userId as string;
      const pr = uid ? projectRoleOf(projectId, uid) : null;
      const or = uid ? orgRoleOf(orgId, uid) : null;
      if (!or) return notFound();
      if (pr !== "head" && or !== "owner" && or !== "admin") return forbidden();
      if (!orgRoleOf(orgId, target)) {
        return err(400, "VALIDATION_ERROR", "Not an org member");
      }
      const b = (await request.json()) as { role: "head" | "member" };
      const existing = db.projectMembers.find(
        (m) => m.projectId === projectId && m.userId === target,
      );
      if (existing) existing.role = b.role;
      else db.projectMembers.push({ projectId, userId: target, role: b.role });
      return HttpResponse.json({ userId: target, role: b.role });
    },
  ),
  http.delete(
    `${BASE}/orgs/:orgId/projects/:projectId/members/:userId`,
    ({ request, params }) => {
      const uid = callerId(request);
      const orgId = params.orgId as string;
      const projectId = params.projectId as string;
      const target = params.userId as string;
      const pr = uid ? projectRoleOf(projectId, uid) : null;
      const or = uid ? orgRoleOf(orgId, uid) : null;
      if (!or) return notFound();
      if (pr !== "head" && or !== "owner" && or !== "admin") return forbidden();
      const before = db.projectMembers.length;
      db.projectMembers = db.projectMembers.filter(
        (m) => !(m.projectId === projectId && m.userId === target),
      );
      if (db.projectMembers.length === before) return notFound();
      return new HttpResponse(null, { status: 204 });
    },
  ),

  /* ---------------- boards ---------------- */
  http.get(`${BASE}/projects/:projectId/boards`, ({ request, params }) => {
    const uid = callerId(request);
    const projectId = params.projectId as string;
    const project = db.projects.find((p) => p.id === projectId);
    if (!uid || !project || !callerOrgIds(uid).includes(project.organizationId)) {
      return notFound();
    }
    if (!projectRoleOf(projectId, uid)) return forbidden();
    return HttpResponse.json(
      db.boards
        .filter((b) => b.projectId === projectId)
        .map((b) => ({
          id: b.id,
          projectId: b.projectId,
          name: b.name,
          columns: b.columns,
          cardCount: db.cards.filter((c) => c.boardId === b.id).length,
        })),
    );
  }),
  http.post(
    `${BASE}/projects/:projectId/boards`,
    async ({ request, params }) => {
      const uid = callerId(request);
      const projectId = params.projectId as string;
      const project = db.projects.find((p) => p.id === projectId);
      if (
        !uid ||
        !project ||
        !callerOrgIds(uid).includes(project.organizationId)
      ) {
        return notFound();
      }
      if (!projectRoleOf(projectId, uid)) return forbidden();
      const b = (await request.json()) as { name: string };
      const id = nextId("brd");
      const columns = [
        { id: nextId("col"), name: "To Do", order: 0 },
        { id: nextId("col"), name: "In Progress", order: 1 },
        { id: nextId("col"), name: "Done", order: 2 },
      ];
      db.boards.push({
        id,
        organizationId: project.organizationId,
        projectId,
        name: b.name,
        columns,
      });
      return HttpResponse.json(
        { id, projectId, name: b.name, columns, cardCount: 0 },
        { status: 201 },
      );
    },
  ),
  http.get(
    `${BASE}/projects/:projectId/boards/:boardId`,
    ({ request, params }) => {
      const uid = callerId(request);
      const projectId = params.projectId as string;
      const boardId = params.boardId as string;
      const project = db.projects.find((p) => p.id === projectId);
      if (
        !uid ||
        !project ||
        !callerOrgIds(uid).includes(project.organizationId)
      ) {
        return notFound();
      }
      if (!projectRoleOf(projectId, uid)) return forbidden();
      const board = db.boards.find(
        (x) => x.id === boardId && x.projectId === projectId,
      );
      if (!board) return notFound();
      return HttpResponse.json({
        id: board.id,
        projectId: board.projectId,
        name: board.name,
        columns: board.columns,
        cardCount: db.cards.filter((c) => c.boardId === boardId).length,
      });
    },
  ),
  http.patch(
    `${BASE}/projects/:projectId/boards/:boardId`,
    async ({ request, params }) => {
      const uid = callerId(request);
      const projectId = params.projectId as string;
      const boardId = params.boardId as string;
      if (!uid || !projectRoleOf(projectId, uid)) return forbidden();
      const board = db.boards.find((x) => x.id === boardId);
      if (!board) return notFound();
      const b = (await request.json()) as {
        name?: string;
        columns?: { id?: string; name: string; order: number }[];
      };
      if (b.name) board.name = b.name;
      if (b.columns) {
        board.columns = b.columns
          .slice()
          .sort((x, y) => x.order - y.order)
          .map((c, i) => ({ id: c.id ?? nextId("col"), name: c.name, order: i }));
      }
      return HttpResponse.json({
        id: board.id,
        projectId: board.projectId,
        name: board.name,
        columns: board.columns,
        cardCount: db.cards.filter((c) => c.boardId === boardId).length,
      });
    },
  ),
  http.delete(
    `${BASE}/projects/:projectId/boards/:boardId`,
    ({ request, params }) => {
      const uid = callerId(request);
      const projectId = params.projectId as string;
      const boardId = params.boardId as string;
      if (!uid || !projectRoleOf(projectId, uid)) return forbidden();
      db.boards = db.boards.filter((x) => x.id !== boardId);
      db.cards = db.cards.filter((c) => c.boardId !== boardId);
      return new HttpResponse(null, { status: 204 });
    },
  ),

  /* ---------------- cards ---------------- */
  http.get(`${BASE}/boards/:boardId/cards`, ({ request, params }) => {
    const uid = callerId(request);
    const boardId = params.boardId as string;
    const board = db.boards.find((b) => b.id === boardId);
    if (!uid || !board || !callerOrgIds(uid).includes(board.organizationId)) {
      return notFound();
    }
    if (!projectRoleOf(board.projectId, uid)) return forbidden();
    return HttpResponse.json(
      db.cards.filter((c) => c.boardId === boardId).map((c) => cardDto(c.id)),
    );
  }),
  http.post(
    `${BASE}/boards/:boardId/cards`,
    async ({ request, params }) => {
      const uid = callerId(request);
      const boardId = params.boardId as string;
      const board = db.boards.find((b) => b.id === boardId);
      if (!uid || !board || !projectRoleOf(board.projectId, uid)) {
        return board ? forbidden() : notFound();
      }
      const b = (await request.json()) as { title: string; columnId: string };
      if (!board.columns.some((c) => c.id === b.columnId)) {
        return err(400, "VALIDATION_ERROR", "bad column");
      }
      const id = nextId("card");
      db.cards.push({
        id,
        organizationId: board.organizationId,
        boardId,
        columnId: b.columnId,
        order: db.cards.filter(
          (c) => c.boardId === boardId && c.columnId === b.columnId,
        ).length,
        title: b.title,
        labels: [],
        assigneeIds: [],
      });
      return HttpResponse.json(cardDto(id), { status: 201 });
    },
  ),
  http.get(
    `${BASE}/boards/:boardId/cards/:cardId`,
    ({ request, params }) => {
      const uid = callerId(request);
      const boardId = params.boardId as string;
      const cardId = params.cardId as string;
      const board = db.boards.find((b) => b.id === boardId);
      if (!uid || !board || !callerOrgIds(uid).includes(board.organizationId)) {
        return notFound();
      }
      if (!projectRoleOf(board.projectId, uid)) return forbidden();
      const card = db.cards.find(
        (c) => c.id === cardId && c.boardId === boardId,
      );
      if (!card) return notFound();
      return HttpResponse.json({
        ...cardDto(cardId),
        subtasks: db.subtasks
          .filter((s) => s.cardId === cardId)
          .map((s) => ({
            id: s.id,
            cardId,
            title: s.title,
            ...(s.assigneeId ? { assigneeId: s.assigneeId } : {}),
            done: s.done,
          })),
        comments: db.comments
          .filter((c) => c.cardId === cardId)
          .map((c) => ({
            id: c.id,
            cardId,
            authorId: c.authorId,
            author: userRef(c.authorId),
            body: c.body,
            createdAt: c.createdAt,
          })),
      });
    },
  ),
  http.patch(
    `${BASE}/boards/:boardId/cards/:cardId`,
    async ({ request, params }) => {
      const uid = callerId(request);
      const boardId = params.boardId as string;
      const cardId = params.cardId as string;
      const board = db.boards.find((b) => b.id === boardId);
      if (!uid || !board || !projectRoleOf(board.projectId, uid)) {
        return board ? forbidden() : notFound();
      }
      const card = db.cards.find((c) => c.id === cardId);
      if (!card) return notFound();
      const p = (await request.json()) as Record<string, unknown>;
      if (typeof p.title === "string") card.title = p.title;
      if (Array.isArray(p.labels)) card.labels = p.labels as string[];
      if (Array.isArray(p.assigneeIds))
        card.assigneeIds = p.assigneeIds as string[];
      if (p.priority === null) delete card.priority;
      else if (typeof p.priority === "string") card.priority = p.priority;
      if (p.dueDate === null) delete card.dueDate;
      else if (typeof p.dueDate === "string") card.dueDate = p.dueDate;
      if (p.description === null) delete card.description;
      else if (typeof p.description === "string") card.description = p.description;
      return HttpResponse.json(cardDto(cardId));
    },
  ),
  http.patch(
    `${BASE}/boards/:boardId/cards/:cardId/move`,
    async ({ request, params }) => {
      const uid = callerId(request);
      const boardId = params.boardId as string;
      const cardId = params.cardId as string;
      const board = db.boards.find((b) => b.id === boardId);
      if (!uid || !board || !projectRoleOf(board.projectId, uid)) {
        return board ? forbidden() : notFound();
      }
      const card = db.cards.find((c) => c.id === cardId)!;
      const b = (await request.json()) as { columnId: string; order: number };
      card.columnId = b.columnId;
      card.order = b.order;
      return HttpResponse.json(cardDto(cardId));
    },
  ),
  http.delete(
    `${BASE}/boards/:boardId/cards/:cardId`,
    ({ request, params }) => {
      const uid = callerId(request);
      const boardId = params.boardId as string;
      const cardId = params.cardId as string;
      const board = db.boards.find((b) => b.id === boardId);
      if (!uid || !board || !projectRoleOf(board.projectId, uid)) {
        return board ? forbidden() : notFound();
      }
      db.cards = db.cards.filter((c) => c.id !== cardId);
      db.subtasks = db.subtasks.filter((s) => s.cardId !== cardId);
      db.comments = db.comments.filter((c) => c.cardId !== cardId);
      return new HttpResponse(null, { status: 204 });
    },
  ),

  /* ---------------- card children ---------------- */
  http.post(
    `${BASE}/cards/:cardId/subtasks`,
    async ({ request, params }) => {
      const cardId = params.cardId as string;
      const b = (await request.json()) as { title: string };
      const id = nextId("st");
      db.subtasks.push({ id, cardId, title: b.title, done: false });
      return HttpResponse.json({ id, cardId, title: b.title, done: false }, { status: 201 });
    },
  ),
  http.patch(
    `${BASE}/cards/:cardId/subtasks/:subtaskId`,
    async ({ request, params }) => {
      const st = db.subtasks.find((s) => s.id === params.subtaskId);
      if (!st) return notFound();
      const b = (await request.json()) as { done?: boolean; title?: string };
      if (typeof b.done === "boolean") st.done = b.done;
      if (typeof b.title === "string") st.title = b.title;
      return HttpResponse.json({
        id: st.id,
        cardId: st.cardId,
        title: st.title,
        done: st.done,
      });
    },
  ),
  http.delete(`${BASE}/cards/:cardId/subtasks/:subtaskId`, ({ params }) => {
    db.subtasks = db.subtasks.filter((s) => s.id !== params.subtaskId);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${BASE}/cards/:cardId/comments`, ({ params }) => {
    const cardId = params.cardId as string;
    return HttpResponse.json(
      db.comments
        .filter((c) => c.cardId === cardId)
        .map((c) => ({
          id: c.id,
          cardId,
          authorId: c.authorId,
          author: userRef(c.authorId),
          body: c.body,
          createdAt: c.createdAt,
        })),
    );
  }),
  http.post(
    `${BASE}/cards/:cardId/comments`,
    async ({ request, params }) => {
      const uid = callerId(request)!;
      const cardId = params.cardId as string;
      const b = (await request.json()) as { body: string };
      const id = nextId("cm");
      const createdAt = new Date().toISOString();
      db.comments.push({ id, cardId, authorId: uid, body: b.body, createdAt });
      return HttpResponse.json(
        {
          id,
          cardId,
          authorId: uid,
          author: userRef(uid),
          body: b.body,
          createdAt,
        },
        { status: 201 },
      );
    },
  ),
  http.delete(`${BASE}/cards/:cardId/comments/:commentId`, ({ params }) => {
    db.comments = db.comments.filter((c) => c.id !== params.commentId);
    return new HttpResponse(null, { status: 204 });
  }),

  /* ---------------- notifications ---------------- */
  http.get(`${BASE}/notifications`, ({ request }) => {
    if (!callerId(request)) return unauth();
    return HttpResponse.json({
      items: db.notifications,
      page: 1,
      limit: 20,
      total: db.notifications.length,
      unread: db.notifications.filter((n) => !n.read).length,
    });
  }),
  http.patch(`${BASE}/notifications/read-all`, () => {
    db.notifications = db.notifications.map((n) => ({ ...n, read: true }));
    return new HttpResponse(null, { status: 204 });
  }),
  http.patch(`${BASE}/notifications/:id/read`, ({ params }) => {
    const n = db.notifications.find((x) => x.id === params.id);
    if (!n) return notFound();
    n.read = true;
    return new HttpResponse(null, { status: 204 });
  }),
];
