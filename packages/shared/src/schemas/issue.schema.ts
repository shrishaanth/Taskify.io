import { z } from 'zod';

export const issueTypes = ['task', 'bug', 'story', 'epic', 'subtask'] as const;
export const issuePriorities = ['none', 'low', 'medium', 'high', 'urgent'] as const;

export const createIssueSchema = z.object({
  type: z.enum(issueTypes).default('task'),
  title: z.string().min(1, 'Title is required').max(300).trim(),
  description: z.string().default(''),
  status: z.string().default('Todo'),
  priority: z.enum(issuePriorities).default('medium'),
  assigneeId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  epicId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  labels: z.array(z.string().trim()).default([]),
  storyPoints: z.number().min(0).max(999).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().min(1).max(300).trim().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(issuePriorities).optional(),
  assigneeId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  epicId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  labels: z.array(z.string().trim()).optional(),
  storyPoints: z.number().min(0).max(999).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
});

export const issueStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
