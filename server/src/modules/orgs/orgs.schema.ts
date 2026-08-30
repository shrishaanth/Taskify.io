import { z } from "zod";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

export const createOrgSchema = {
  body: z.object({ name: z.string().trim().min(1).max(120) }),
};

export const orgIdParams = { params: z.object({ orgId: objectId }) };

export const updateOrgSchema = {
  params: z.object({ orgId: objectId }),
  body: z
    .object({
      name: z.string().trim().min(1).max(120).optional(),
      slug: z.string().trim().min(1).max(60).optional(),
    })
    .refine((b) => b.name !== undefined || b.slug !== undefined, {
      message: "Nothing to update",
    }),
};

export const inviteSchema = {
  params: z.object({ orgId: objectId }),
  body: z.object({
    email: z.string().email().max(200),
    role: z.enum(["admin", "member"]),
  }),
};

export const acceptInviteSchema = {
  params: z.object({ inviteToken: z.string().min(10).max(200) }),
  body: z
    .object({
      // Present only when the invitee has no account yet (UC-2 3a).
      name: z.string().trim().min(1).max(120).optional(),
      password: z.string().min(8).max(200).optional(),
    })
    .default({}),
};

export const memberParams = {
  params: z.object({ orgId: objectId, userId: objectId }),
};

export const changeRoleSchema = {
  params: z.object({ orgId: objectId, userId: objectId }),
  body: z.object({ role: z.enum(["owner", "admin", "member"]) }),
};
