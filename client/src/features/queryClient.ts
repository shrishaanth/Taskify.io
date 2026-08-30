import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/http";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry auth/permission/not-found — only transient failures.
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
