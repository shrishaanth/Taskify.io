import { io, type Socket } from "socket.io-client";
import { API_BASE, refreshAccessToken, setSocketIdProvider } from "./http";
import { getAccessToken } from "./tokenStore";

const WS_ORIGIN: string =
  (import.meta.env.VITE_WS_URL as string | undefined) ??
  (API_BASE.startsWith("http")
    ? new URL(API_BASE).origin
    : typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:4000");

let socket: Socket | null = null;

setSocketIdProvider(() => socket?.id);

export function connectSocket(token: string | null): Socket | null {
  if (import.meta.env.MODE === "test" || !token) return socket;

  if (socket) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  try {
    socket = io(WS_ORIGIN, {
      path: "/socket.io",
      // Read on every attempt. The HTTP layer rotates the access token every
      // few minutes; a token captured once here would be expired by the time
      // the connection drops and has to be re-established.
      auth: (cb) => cb({ token: getAccessToken() }),
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    attachAuthRecovery(socket);
  } catch {
    socket = null;
  }
  return socket;
}

/**
 * socket.io retries transport failures by itself but treats a refusal from the
 * server's auth middleware as final. Without this the socket would stay dead,
 * silently, until the page was reloaded.
 */
function attachAuthRecovery(s: Socket): void {
  let recovering = false;
  s.on("connect_error", (err) => {
    if (err.message !== "unauthenticated" || recovering) return;
    recovering = true;
    void refreshAccessToken()
      .then((ok) => {
        if (ok && socket === s) s.connect();
      })
      .finally(() => {
        recovering = false;
      });
  });
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
