import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { config } from "../config/index.js";
import { verifyAccessToken } from "../lib/tokens.js";
import {
  BoardModel,
  OrgMembershipModel,
  ProjectMembershipModel,
  UserModel,
} from "../models/index.js";

/**
 * FR-6 / UC-9 real-time layer. A single Socket.IO server sharing the HTTP
 * listener with Express. Clients authenticate with the same short-lived access
 * token as REST calls and join rooms scoped to `user:<id>`, `org:<id>` and
 * (on demand) `board:<id>` — never a global broadcast room.
 *
 * NOTE: multi-instance fan-out (the `@socket.io/redis-adapter`) is intentionally
 * out of scope. Behind the nginx load balancer, `ip_hash` keeps each client
 * pinned to one app instance, so events a client cares about are emitted by the
 * instance it is connected to. Cross-instance broadcast needs the Redis adapter.
 */

let io: Server | null = null;

export function initRealtime(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: config.CLIENT_ORIGIN, credentials: true },
  });

  io.use((socket, next) => {
    authenticate(socket)
      .then(() => next())
      .catch(() => next(new Error("unauthenticated")));
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    void socket.join(`user:${userId}`);
    void joinOrgRooms(socket, userId);

    socket.on("subscribe:board", (boardId: unknown) => {
      if (typeof boardId !== "string") return;
      void userCanAccessBoard(userId, boardId).then((ok) => {
        if (ok) void socket.join(`board:${boardId}`);
      });
    });

    socket.on("unsubscribe:board", (boardId: unknown) => {
      if (typeof boardId === "string") void socket.leave(`board:${boardId}`);
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export async function shutdownRealtime(): Promise<void> {
  if (io) {
    await io.close();
    io = null;
  }
}

async function authenticate(socket: Socket): Promise<void> {
  const token = (socket.handshake.auth as { token?: unknown } | undefined)?.token;
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("unauthenticated");
  }
  const { userId } = verifyAccessToken(token);
  const user = await UserModel.findById(userId).select("_id").lean();
  if (!user) throw new Error("unauthenticated");
  socket.data.userId = String(user._id);
}

async function joinOrgRooms(socket: Socket, userId: string): Promise<void> {
  const memberships = await OrgMembershipModel.find({ userId })
    .select("organizationId")
    .lean();
  for (const m of memberships) {
    void socket.join(`org:${String(m.organizationId)}`);
  }
}

async function userCanAccessBoard(
  userId: string,
  boardId: string,
): Promise<boolean> {
  const board = await BoardModel.findById(boardId).select("projectId").lean();
  if (!board) return false;
  return Boolean(
    await ProjectMembershipModel.exists({ projectId: board.projectId, userId }),
  );
}
