import { z } from "zod";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

export const orgScopeParams = { params: z.object({ orgId: objectId }) };

export const createProjectSchema = {
  params: z.object({ orgId: objectId }),
  body: z.object({
    name: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000).optional(),
  }),
};

export const projectParams = {
  params: z.object({ orgId: objectId, projectId: objectId }),
};

export const updateProjectSchema = {
  params: z.object({ orgId: objectId, projectId: objectId }),
  body: z
    .object({
      name: z.string().trim().min(1).max(160).optional(),
      description: z.string().trim().max(2000).nullable().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: "Nothing to update" }),
};

export const projectMemberParams = {
  params: z.object({
    orgId: objectId,
    projectId: objectId,
    userId: objectId,
  }),
};

export const setProjectRoleSchema = {
  params: z.object({
    orgId: objectId,
    projectId: objectId,
    userId: objectId,
  }),
  body: z.object({ role: z.enum(["head", "member"]) }),
};
