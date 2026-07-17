import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

/**
 * One socket per logged-in session, shared app-wide through context.
 * The socket authenticates with the same JWT as the REST API; the server
 * places it in a per-user room (and the admins room for admins), so this
 * client only ever receives events about data it is allowed to see.
 */

export type PresenceMap = Set<string>;

interface SocketState {
  socket: Socket | null;
  /** Live connection status — drives the "Live / Offline" indicator. */
  connected: boolean;
  /** userIds currently online anywhere in the cluster. */
  online: PresenceMap;
}

const SocketContext = createContext<SocketState>({
  socket: null,
  connected: false,
  online: new Set(),
});

export const useSocket = () => useContext(SocketContext);

// The socket connects to the same origin the app is served from (nginx or
// the Vite dev proxy forwards /socket.io to the backend), unless an explicit
// URL is configured for split deployments (e.g. Vercel client + Render API).
const SOCKET_URL: string | undefined = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || undefined;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated, logout } = useAuth();
  const [connected, setConnected] = useState(false);
  const [online, setOnline] = useState<PresenceMap>(new Set());
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      setOnline(new Set());
      return;
    }

    const s = io(SOCKET_URL ?? "/", {
      auth: { token },
      // Polling first, then upgrade — survives proxies without websocket
      // support and matches the server's transport config.
      transports: ["polling", "websocket"],
      reconnectionDelayMax: 10_000,
    });

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", () => setConnected(false));

    s.on("presence:update", ({ online: ids }: { online: string[] }) => {
      setOnline(new Set(ids));
    });

    // Account deleted by an admin while logged in: end the session now.
    s.on("user:deleted", () => {
      logout();
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, logout]);

  const value = useMemo(() => ({ socket, connected, online }), [socket, connected, online]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
