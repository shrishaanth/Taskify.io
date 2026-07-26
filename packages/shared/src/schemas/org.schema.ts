import { z } from 'zod';

export const createOrgSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .trim(),
  description: z.string().max(500).default(''),
});

export const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .trim()
    .optional(),
  description: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .trim(),
  description: z.string().max(500).default(''),
  visibility: z.enum(['open', 'private']).default('open'),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .trim()
    .optional(),
  description: z.string().max(500).optional(),
  visibility: z.enum(['open', 'private']).optional(),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
