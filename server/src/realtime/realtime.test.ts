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

describe("realtime — board:changed", () => {
  it("notifies board subscribers when a card is created", async () => {
    const { head, member, project } = await makeScenario();
    const board = await makeBoard(project.organizationId, project._id);

    const socket = await connect(signAccessToken(member._id.toString()));
    socket.emit("subscribe:board", board._id.toString());
    await new Promise((r) => setTimeout(r, 150)); // let the join round-trip

    const changed = nextEvent<{ boardId: string; reason: string }>(
      socket,
      "board:changed",
    );

    await asUser(app, head)
      .post(`/api/v1/boards/${board._id}/cards`)
      .send({ title: "Live card", columnId: "c1" });

    const evt = await changed;
    expect(evt.boardId).toBe(board._id.toString());
    expect(evt.reason).toContain("card");
  });

  it("does not join a board the user has no access to", async () => {
    const { head, outsider, project } = await makeScenario();
    const board = await makeBoard(project.organizationId, project._id);

    const socket = await connect(signAccessToken(outsider._id.toString()));
    socket.emit("subscribe:board", board._id.toString());
    await new Promise((r) => setTimeout(r, 150));

    const changed = nextEvent(socket, "board:changed", 1200);
    await asUser(app, head)
      .post(`/api/v1/boards/${board._id}/cards`)
      .send({ title: "Not for outsider", columnId: "c1" });

    // the subscribe was rejected, so the outsider is not in the board room
    await expect(changed).rejects.toThrow(/timed out/);
  });
});
