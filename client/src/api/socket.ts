import { io, type Socket } from "socket.io-client";
import { API_BASE, setSocketIdProvider } from "./http";

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
