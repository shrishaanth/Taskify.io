import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { io as ioc, type Socket as ClientSocket } from "socket.io-client";
import { createApp } from "../app.js";
import { initRealtime, shutdownRealtime } from "./io.js";
import { signAccessToken } from "../lib/tokens.js";
import { makeBoard, makeScenario } from "../test/factories.js";
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
  await shutdownRealtime(); // io.close() also closes the underlying HTTP server
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
    await new Promise((r) => setTimeout(r, 150)); // let the join round-trip
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

    // member connects but does NOT subscribe to the board room
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
