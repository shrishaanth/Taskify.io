import { create } from "zustand";
import * as authApi from "../api/auth";
import type { Session } from "../api/auth";
import { setOnAuthLost } from "../api/http";

export type SessionStatus = "loading" | "authenticated" | "anonymous";

export interface SessionState {
  status: SessionStatus;
  session: Session | null;
  isAuthenticated: boolean;
  /** Restore the session on app boot (tries the refresh cookie via /me). */
  bootstrap: () => Promise<void>;
  /** Re-pull /me (e.g. after creating/joining an org). */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Test/imperative override. */
  setSession: (session: Session | null) => void;
}

export const useSession = create<SessionState>((set) => ({
  status: "loading",
  session: null,
  isAuthenticated: false,

  bootstrap: async () => {
    try {
      const session = await authApi.fetchSession();
      set({ status: "authenticated", isAuthenticated: true, session });
    } catch {
      set({ status: "anonymous", isAuthenticated: false, session: null });
    }
  },

  refresh: async () => {
    try {
      const session = await authApi.fetchSession();
      set({ status: "authenticated", isAuthenticated: true, session });
    } catch {
      /* keep the current session on a transient failure */
    }
  },

  signOut: async () => {
    await authApi.logout();
    set({ status: "anonymous", isAuthenticated: false, session: null });
  },

  setSession: (session) =>
    set({
      session,
      status: session ? "authenticated" : "anonymous",
      isAuthenticated: Boolean(session),
    }),
}));

// When a token refresh fails mid-flight, drop the session.
setOnAuthLost(() => {
  useSession.setState({
    status: "anonymous",
    isAuthenticated: false,
    session: null,
  });
});
