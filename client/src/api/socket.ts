import { io, type Socket } from "socket.io-client";
import { API_BASE } from "./http";

/**
 * Realtime channel (FR-6 / UC-9). Connects to the same origin as the REST API,
 * authenticating with the current access token. Emits/listens:
 *   - server → client: `notification:new`, `board:changed`
 *   - client → server: `subscribe:board`, `unsubscribe:board`
 *
 * Behind nginx the server is same-origin; in local dev the API runs on :4000,
 * so we derive the ws origin from API_BASE.
 */

const WS_ORIGIN: string =
  (import.meta.env.VITE_WS_URL as string | undefined) ??
  (API_BASE.startsWith("http")
    ? new URL(API_BASE).origin
    : typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:4000");

let socket: Socket | null = null;

export function connectSocket(token: string | null): Socket | null {
  // Tests drive the session store directly and never want a live socket.
  if (import.meta.env.MODE === "test" || !token) return socket;

  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  try {
    socket = io(WS_ORIGIN, {
      path: "/socket.io",
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  } catch {
    socket = null;
  }
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
