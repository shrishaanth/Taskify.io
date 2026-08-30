import { z } from "zod";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");
const priority = z.enum(["low", "medium", "high", "urgent"]);

export const boardScopeParams = { params: z.object({ boardId: objectId }) };
export const cardParams = {
  params: z.object({ boardId: objectId, cardId: objectId }),
};

export const createCardSchema = {
  params: z.object({ boardId: objectId }),
  body: z.object({
    title: z.string().trim().min(1).max(300),
    columnId: z.string().min(1).max(60),
    description: z.string().max(20000).optional(),
    labels: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    assigneeIds: z.array(objectId).max(20).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    priority: priority.optional(),
    order: z.number().int().min(0).optional(),
  }),
};

export const updateCardSchema = {
  params: z.object({ boardId: objectId, cardId: objectId }),
  body: z
    .object({
      title: z.string().trim().min(1).max(300).optional(),
      description: z.string().max(20000).nullable().optional(),
      labels: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
      assigneeIds: z.array(objectId).max(20).optional(),
      dueDate: z.string().datetime().nullable().optional(),
      priority: priority.nullable().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: "Nothing to update" }),
};

export const moveCardSchema = {
  params: z.object({ boardId: objectId, cardId: objectId }),
  body: z.object({
    columnId: z.string().min(1).max(60),
    order: z.number().int().min(0),
  }),
};
