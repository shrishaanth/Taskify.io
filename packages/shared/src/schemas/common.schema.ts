import { z } from 'zod';

// ── Cursor Pagination ─────────────────────────────────────────

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort: z.string().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export interface PaginatedResult<T> {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
}

// ── Membership ────────────────────────────────────────────────

export const scopeTypes = ['organization', 'workspace', 'project'] as const;

export const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).default('member'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

// ── Generic success response ──────────────────────────────────

export const messageResponseSchema = z.object({
  message: z.string(),
});

export type MessageResponse = z.infer<typeof messageResponseSchema>;
