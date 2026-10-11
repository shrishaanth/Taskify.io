import { MutationCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/http";

export interface QueryClientOptions {
  /**
   * Called for every failed mutation that has not opted out with
   * `meta: { handlesOwnErrors: true }`. Without it most failures would be
   * invisible: the request is refused and the screen simply does not change.
   */
  onMutationError?: (message: string) => void;
}

export function mutationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status >= 500) return "The server had a problem. Please try again.";
    return error.message || "That could not be done.";
  }
  return "Could not reach the server. Check your connection and try again.";
}

export function makeQueryClient(options: QueryClientOptions = {}): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if (mutation.meta?.handlesOwnErrors) return;
        // A 401 means the session ended; the auth layer redirects to login.
        if (error instanceof ApiError && error.status === 401) return;
        options.onMutationError?.(mutationErrorMessage(error));
      },
    }),
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status < 500) return false;
          return failureCount < 2;
        },
        staleTime: 15_000,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}

export const qk = {
  session: ["session"] as const,
  orgMembers: (orgId: string) => ["orgs", orgId, "members"] as const,
  orgInvites: (orgId: string) => ["orgs", orgId, "invites"] as const,
  myInvites: ["invites", "mine"] as const,
  projects: (orgId: string) => ["projects", orgId] as const,
  project: (orgId: string, projectId: string) =>
    ["project", orgId, projectId] as const,
  projectMembers: (projectId: string) =>
    ["project", projectId, "members"] as const,
  boards: (projectId: string) => ["boards", projectId] as const,
  board: (projectId: string, boardId: string) =>
    ["board", projectId, boardId] as const,
  cards: (boardId: string) => ["cards", boardId] as const,
  card: (boardId: string, cardId: string) => ["card", boardId, cardId] as const,
  notifications: ["notifications"] as const,
};
