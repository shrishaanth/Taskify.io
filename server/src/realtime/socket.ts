import http from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { createAdapter } from "@socket.io/redis-adapter";
import { config } from "../config";
import { JwtPayload } from "../types";
import { UserModel } from "../models/user.model";
import {
  duplicateForAdapter,
  presenceConnect,
  presenceDisconnect,
  presenceList,
} from "../services/redis";

/**
 * Real-time layer.
 *
 * Room design:
 *   user:<id>  — every socket a user has open (multiple tabs join the same
 *                room). Task events are targeted at the assignee's room.
 *   admins     — every connected Admin. Admins see every change because
 *                they can see every task.
 *
 * With REDIS_URL set, the Redis adapter broadcasts events across ALL app
 * instances — a member connected to instance A still receives an update
 * triggered by an admin whose request hit instance B. That's what makes
 * the stateless app-server pool behind a load balancer actually work.
 */

let io: Server | null = null;

interface SocketAuth {
  userId: string;
  name: string;
}

function socketUser(socket: Socket): SocketAuth {
  return (socket.data as { user: SocketAuth }).user;
}

export function initSocket(server: http.Server, allowedOrigins: (string | RegExp)[]): Server {
  io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
    // Long-polling first then upgrade — plays nicer with proxies/LBs that
    // aren't configured for websockets yet. Sticky sessions in nginx handle
    // the polling handshake correctly.
    transports: ["polling", "websocket"],
  });

  const adapterConns = duplicateForAdapter();
  if (adapterConns) {
    io.adapter(createAdapter(adapterConns.pub, adapterConns.sub));
    console.log("Socket.IO: Redis adapter enabled (multi-instance broadcast)");
  } else {
    console.log("Socket.IO: in-memory adapter (single instance)");
  }

  // Authenticate the socket exactly like an HTTP request: verify the JWT,
  // then re-check the account still exists and read its CURRENT role.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error("Missing token"));

      const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
      const user = await UserModel.findById(payload.userId).select("name").lean();
      if (!user) return next(new Error("Account no longer exists"));

      socket.data.user = {
        userId: payload.userId,
        name: user.name,
      };
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socketUser(socket);

    socket.join(`user:${user.userId}`);
    if (user) socket.join("admins");

    await presenceConnect(user.userId);
    await broadcastPresence();

    socket.on("disconnect", async () => {
      await presenceDisconnect(user.userId);
      await broadcastPresence();
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

async function broadcastPresence(): Promise<void> {
  if (!io) return;
  const online = await presenceList();
  io.emit("presence:update", { online });
}

// ── Emit helpers used by the controllers ────────────────────────────────────
// Every mutation notifies exactly the people allowed to see it:
//   admins            → everything
//   the assignee      → their own task
//   a former assignee → a "removed" event so the task disappears from their board

interface PublicTask {
  id: string;
  assignedTo: string | null;
  [key: string]: unknown;
}

export function emitTaskUpsert(task: PublicTask, previousAssignee?: string | null): void {
  if (!io) return;
  io.to("admins").emit("task:upsert", { task });
  if (task.assignedTo) {
    io.to(`user:${task.assignedTo}`).emit("task:upsert", { task });
  }
  // Reassigned away from someone: tell them the task is gone from their view.
  if (previousAssignee && previousAssignee !== task.assignedTo) {
    io.to(`user:${previousAssignee}`).emit("task:removed", { id: task.id });
  }
}

export function emitTaskRemoved(taskId: string, assignedTo: string | null): void {
  if (!io) return;
  io.to("admins").emit("task:removed", { id: taskId });
  if (assignedTo) io.to(`user:${assignedTo}`).emit("task:removed", { id: taskId });
}

/** Member directory changed (created/updated/deleted a user) — admins refresh
 * their Users page; the affected user gets told their own profile changed
 * (e.g. an admin renamed them or changed their role). */
export function emitUserChanged(userId?: string): void {
  if (!io) return;
  io.to("admins").emit("user:changed", {});
  if (userId) io.to(`user:${userId}`).emit("user:self-changed", {});
}

/** A user was deleted — force their live sessions to log out. */
export function emitUserDeleted(userId: string): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("user:deleted", {});
}

export interface ActivityPayload {
  id: string;
  action: string;
  actorName: string;
  taskTitle: string | null;
  targetUserId: string | null;
  createdAt: string;
}

/** Activity feed entries go to admins and to the user the entry is about. */
export function emitActivity(entry: ActivityPayload): void {
  if (!io) return;
  io.to("admins").emit("activity:new", { entry });
  if (entry.targetUserId) {
    io.to(`user:${entry.targetUserId}`).emit("activity:new", { entry });
  }
}

/** Targeted toast notification (e.g. "You were assigned a new task"). */
export function emitNotification(userId: string, message: string, kind: "info" | "success" | "warning" = "info"): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("notify", { message, kind });
}
