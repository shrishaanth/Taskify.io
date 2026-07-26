import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  key: z
    .string()
    .min(2, 'Key must be at least 2 characters')
    .max(10, 'Key must be at most 10 characters')
    .regex(/^[A-Z][A-Z0-9]*$/, 'Key must be uppercase alphanumeric starting with a letter')
    .trim(),
  description: z.string().max(1000).default(''),
  settings: z
    .object({
      isPrivate: z.boolean().default(false),
      epicEnabled: z.boolean().default(true),
      sprintsEnabled: z.boolean().default(true),
    })
    .default({}),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(1000).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  leadId: z.string().optional().nullable(),
  settings: z
    .object({
      isPrivate: z.boolean().optional(),
      epicEnabled: z.boolean().optional(),
      sprintsEnabled: z.boolean().optional(),
    })
    .optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
