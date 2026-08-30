import { create } from "zustand";

/**
 * Phase 4 stand-in for auth state. Phase 5+ replaces this with real
 * access/refresh-token handling per PROJECT_RULES.md §4.
 */
export interface SessionState {
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => void;
}

export const useSession = create<SessionState>((set) => ({
  isAuthenticated: true,
  signIn: () => set({ isAuthenticated: true }),
  signOut: () => set({ isAuthenticated: false }),
}));
