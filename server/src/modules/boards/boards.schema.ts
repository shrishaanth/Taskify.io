import { z } from "zod";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

const columnInput = z.object({
  id: z.string().min(1).max(40).optional(),
  name: z.string().trim().min(1).max(60),
  order: z.number().int().min(0),
});

export const projectScopeParams = { params: z.object({ projectId: objectId }) };

export const createBoardSchema = {
  params: z.object({ projectId: objectId }),
  body: z.object({
    name: z.string().trim().min(1).max(120),
    columns: z.array(columnInput).max(30).optional(),
  }),
};

export const boardParams = {
  params: z.object({ projectId: objectId, boardId: objectId }),
};

export const updateBoardSchema = {
  params: z.object({ projectId: objectId, boardId: objectId }),
  body: z
    .object({
      name: z.string().trim().min(1).max(120).optional(),
      columns: z.array(columnInput).max(30).optional(),
    })
    .refine((b) => b.name !== undefined || b.columns !== undefined, {
      message: "Nothing to update",
    }),
};
