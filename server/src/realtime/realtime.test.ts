import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { io as ioc, type Socket as ClientSocket } from "socket.io-client";
import { createApp } from "../app.js";
import { initRealtime, shutdownRealtime } from "./io.js";
import { signAccessToken } from "../lib/tokens.js";
import { addOrgMember, makeBoard, makeScenario } from "../test/factories.js";
import { asUser } from "../test/api.js";

const app = createApp();
let httpServer: HttpServer;
let port: number;
const clients: ClientSocket[] = [];

beforeAll(async () => {
  httpServer = createServer(app);
  initRealtime(httpServer);
  await new Promise<void>((resolve) => {
    httpServer.listen(0, () => {
      port = (httpServer.address() as AddressInfo).port;
      resolve();
    });
  });
});

afterAll(async () => {
  for (const c of clients) c.disconnect();
  await shutdownRealtime();
  if (httpServer.listening) {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  }
});

function connect(token: string): Promise<ClientSocket> {
  const socket = ioc(`http://localhost:${port}`, {
    path: "/socket.io",
    transports: ["websocket"],
    reconnection: false,
    auth: { token },
  });
  clients.push(socket);
  return new Promise((resolve, reject) => {
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", (err) => reject(err));
  });
}

function nextEvent<T = unknown>(
  socket: ClientSocket,
  event: string,
  timeoutMs = 4000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timed out waiting for "${event}"`)),
      timeoutMs,
    );
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

describe("realtime — connection", () => {
  it("rejects a socket with no / bad token", async () => {
    await expect(connect("not-a-real-token")).rejects.toThrow();
  });

  it("accepts a socket with a valid access token", async () => {
    const { member } = await makeScenario();
    const socket = await connect(signAccessToken(member._id.toString()));
    expect(socket.connected).toBe(true);
  });
});

describe("realtime — notification:new", () => {
  it("pushes a card_assigned notification to the assignee's room", async () => {
    const { head, member, project } = await makeScenario();
    const board = await makeBoard(project.organizationId, project._id);

    const socket = await connect(signAccessToken(member._id.toString()));
    const received = nextEvent<{ type: string }>(socket, "notification:new");

    const res = await asUser(app, head)
      .post(`/api/v1/boards/${board._id}/cards`)
      .send({ title: "Assigned card", columnId: "c1", assigneeIds: [member._id.toString()] });
    expect(res.status).toBe(201);

    expect((await received).type).toBe("card_assigned");
  });
});

describe("realtime — board room events (§6 catalog)", () => {
  async function subscribedSocket(userId: string, boardId: string) {
    const socket = await connect(signAccessToken(userId));
    socket.emit("subscribe:board", boardId);
    await new Promise((r) => setTimeout(r, 150));
    return socket;
  }

  it("card:created — full card object to board subscribers", async () => {
    const { head, member, project } = await makeScenario();
    const board = await makeBoard(project.organizationId, project._id);
    const socket = await subscribedSocket(member._id.toString(), board._id.toString());

    const evt = nextEvent<{ id: string; title: string; columnId: string }>(
      socket,
      "card:created",
    );
    await asUser(app, head)
      .post(`/api/v1/boards/${board._id}/cards`)
      .send({ title: "Live card", columnId: "c1" });

    const card = await evt;
    expect(card.title).toBe("Live card");
    expect(card.columnId).toBe("c1");
    expect(card.id).toEqual(expect.any(String));
  });

  it("card:updated on edit, card:moved on move, card:deleted on delete", async () => {
    const { head, member, project } = await makeScenario();
    const board = await makeBoard(project.organizationId, project._id);
    const socket = await subscribedSocket(member._id.toString(), board._id.toString());
    const asHead = asUser(app, head);

    const created = (
      await asHead.post(`/api/v1/boards/${board._id}/cards`).send({ title: "T", columnId: "c1" })
    ).body;

    const updated = nextEvent<{ id: string; title: string }>(socket, "card:updated");
    await asHead.patch(`/api/v1/boards/${board._id}/cards/${created.id}`).send({ title: "T2" });
    expect((await updated).title).toBe("T2");

    const moved = nextEvent<{ id: string; columnId: string; order: number }>(
      socket,
      "card:moved",
    );
    await asHead
      .patch(`/api/v1/boards/${board._id}/cards/${created.id}/move`)
      .send({ columnId: "c1", order: 0 });
    const m = await moved;
    expect(m.id).toBe(created.id);
    expect(m).toMatchObject({ columnId: "c1", order: 0 });

    const deleted = nextEvent<{ id: string }>(socket, "card:deleted");
    await asHead.delete(`/api/v1/boards/${board._id}/cards/${created.id}`);
    expect((await deleted).id).toBe(created.id);
  });

  it("comment:new — { cardId, comment } to board subscribers", async () => {
    const { head, member, project } = await makeScenario();
    const board = await makeBoard(project.organizationId, project._id);
    const socket = await subscribedSocket(member._id.toString(), board._id.toString());

    const card = (
      await asUser(app, head)
        .post(`/api/v1/boards/${board._id}/cards`)
        .send({ title: "C", columnId: "c1" })
    ).body;

    const evt = nextEvent<{ cardId: string; comment: { body: string } }>(
      socket,
      "comment:new",
    );
    await asUser(app, member)
      .post(`/api/v1/cards/${card.id}/comments`)
      .send({ body: "first!" });

    const payload = await evt;
    expect(payload.cardId).toBe(card.id);
    expect(payload.comment.body).toBe("first!");
  });

  it("room-scoping — a user who never joined the board gets nothing", async () => {
    const { head, member, project } = await makeScenario();
    const board = await makeBoard(project.organizationId, project._id);

    const socket = await connect(signAccessToken(member._id.toString()));
    const leaked = nextEvent(socket, "card:created", 1200);

    await asUser(app, head)
      .post(`/api/v1/boards/${board._id}/cards`)
      .send({ title: "not for you", columnId: "c1" });

    await expect(leaked).rejects.toThrow(/timed out/);
  });

  it("room-scoping — subscribe is rejected for a board the user can't access", async () => {
    const { head, outsider, project } = await makeScenario();
    const board = await makeBoard(project.organizationId, project._id);

    const socket = await connect(signAccessToken(outsider._id.toString()));
    socket.emit("subscribe:board", board._id.toString());
    await new Promise((r) => setTimeout(r, 150));

    const leaked = nextEvent(socket, "card:created", 1200);
    await asUser(app, head)
      .post(`/api/v1/boards/${board._id}/cards`)
      .send({ title: "still not for you", columnId: "c1" });

    await expect(leaked).rejects.toThrow(/timed out/);
  });
});

describe("realtime — project rooms (joined on connect, no subscribe)", () => {
  const boards = (projectId: string) => `/api/v1/projects/${projectId}/boards`;
  const projMembers = (orgId: string, projectId: string, userId: string) =>
    `/api/v1/orgs/${orgId}/projects/${projectId}/members/${userId}`;

  it("board:created / board:updated / board:deleted reach project members", async () => {
    const { head, member, project } = await makeScenario();
    const socket = await connect(signAccessToken(member._id.toString()));
    await new Promise((r) => setTimeout(r, 150));

    const created = nextEvent<{ id: string; name: string; projectId: string }>(
      socket,
      "board:created",
    );
    const res = await asUser(app, head)
      .post(boards(project._id.toString()))
      .send({ name: "Sprint 1" });
    expect(res.status).toBe(201);
    const board = await created;
    expect(board.name).toBe("Sprint 1");
    expect(board.projectId).toBe(project._id.toString());

    const updated = nextEvent<{ id: string; name: string }>(socket, "board:updated");
    await asUser(app, head)
      .patch(`${boards(project._id.toString())}/${board.id}`)
      .send({ name: "Sprint One" });
    expect((await updated).name).toBe("Sprint One");

    const deleted = nextEvent<{ id: string }>(socket, "board:deleted");
    await asUser(app, head).delete(`${boards(project._id.toString())}/${board.id}`);
    expect((await deleted).id).toBe(board.id);
  });

  it("project:memberChanged and project:memberRemoved reach project members", async () => {
    const { head, member, outsider, org, project } = await makeScenario();
    await addOrgMember(org._id, outsider._id, "member");

    const socket = await connect(signAccessToken(member._id.toString()));
    await new Promise((r) => setTimeout(r, 150));

    const changed = nextEvent<{ userId: string; role: string }>(
      socket,
      "project:memberChanged",
    );
    await asUser(app, head)
      .put(projMembers(org._id.toString(), project._id.toString(), outsider._id.toString()))
      .send({ role: "member" });
    expect(await changed).toEqual({
      userId: outsider._id.toString(),
      role: "member",
    });

    const removed = nextEvent<{ userId: string }>(socket, "project:memberRemoved");
    await asUser(app, head).delete(
      projMembers(org._id.toString(), project._id.toString(), outsider._id.toString()),
    );
    expect(await removed).toEqual({ userId: outsider._id.toString() });
  });

  it("setting a project role also persists a role_changed notification (FR-6.1)", async () => {
    const { head, outsider, org, project } = await makeScenario();
    await addOrgMember(org._id, outsider._id, "member");
    const socket = await connect(signAccessToken(outsider._id.toString()));

    const notif = nextEvent<{ type: string }>(socket, "notification:new");
    await asUser(app, head)
      .put(projMembers(org._id.toString(), project._id.toString(), outsider._id.toString()))
      .send({ role: "head" });
    expect((await notif).type).toBe("role_changed");
  });

  it("room-scoping — a user with no ProjectMembership never gets project events", async () => {
    const { head, outsider, project } = await makeScenario();
    const socket = await connect(signAccessToken(outsider._id.toString()));
    await new Promise((r) => setTimeout(r, 150));

    const leaked = nextEvent(socket, "board:created", 1200);
    await asUser(app, head)
      .post(boards(project._id.toString()))
      .send({ name: "Private board" });

    await expect(leaked).rejects.toThrow(/timed out/);
  });
});

describe("realtime — org rooms", () => {
  it("org:memberChanged reaches org members on PATCH /orgs/:orgId/members/:userId", async () => {
    const { owner, head, member, org } = await makeScenario();
    const socket = await connect(signAccessToken(head._id.toString()));
    await new Promise((r) => setTimeout(r, 150));

    const changed = nextEvent<{ userId: string; role: string }>(
      socket,
      "org:memberChanged",
    );
    await asUser(app, owner)
      .patch(`/api/v1/orgs/${org._id}/members/${member._id}`)
      .send({ role: "admin" });
    expect(await changed).toEqual({
      userId: member._id.toString(),
      role: "admin",
    });
  });
});

describe("realtime — the actor is not told what it already knows", () => {
  async function subscribed(userId: string, boardId: string) {
    const socket = await connect(signAccessToken(userId));
    socket.emit("subscribe:board", boardId);
    await new Promise((r) => setTimeout(r, 150));
    return socket;
  }

  it("skips the socket named by x-socket-id and still reaches everyone else", async () => {
    const { head, member, project } = await makeScenario();
    const board = await makeBoard(project.organizationId, project._id);

    const actor = await subscribed(head._id.toString(), board._id.toString());
    const observer = await subscribed(member._id.toString(), board._id.toString());

    const actorEcho = nextEvent(actor, "card:created", 1200);
    const observerEvent = nextEvent<{ title: string }>(observer, "card:created");

    await asUser(app, head)
      .post(`/api/v1/boards/${board._id}/cards`)
      .set("x-socket-id", actor.id as string)
      .send({ title: "No echo please", columnId: "c1" });

    // The observer still gets it...
    expect((await observerEvent).title).toBe("No echo please");
    // ...while the tab that made the change is left alone.
    await expect(actorEcho).rejects.toThrow(/timed out/);
  });

  it("still echoes when the client sends no socket id", async () => {
    const { head, project } = await makeScenario();
    const board = await makeBoard(project.organizationId, project._id);
    const actor = await subscribed(head._id.toString(), board._id.toString());

    const echo = nextEvent<{ title: string }>(actor, "card:created");
    await asUser(app, head)
      .post(`/api/v1/boards/${board._id}/cards`)
      .send({ title: "Echo me", columnId: "c1" });

    expect((await echo).title).toBe("Echo me");
  });

  it("a second tab of the same user is not suppressed", async () => {
    const { head, project } = await makeScenario();
    const board = await makeBoard(project.organizationId, project._id);

    const tabA = await subscribed(head._id.toString(), board._id.toString());
    const tabB = await subscribed(head._id.toString(), board._id.toString());

    const otherTab = nextEvent<{ title: string }>(tabB, "card:created");
    await asUser(app, head)
      .post(`/api/v1/boards/${board._id}/cards`)
      .set("x-socket-id", tabA.id as string)
      .send({ title: "Sync my other tab", columnId: "c1" });

    expect((await otherTab).title).toBe("Sync my other tab");
  });
});
