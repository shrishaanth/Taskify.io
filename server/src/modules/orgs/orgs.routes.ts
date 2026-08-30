import { Router } from "express";
import { asyncHandler } from "../../lib/http.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireOrgRole } from "../../middleware/requireOrgRole.js";
import { validate } from "../../middleware/validate.js";
import { projectsRouter } from "../projects/projects.routes.js";
import * as controller from "./orgs.controller.js";
import {
  acceptInviteSchema,
  changeRoleSchema,
  createOrgSchema,
  inviteIdParams,
  inviteSchema,
  memberParams,
  orgIdParams,
  updateOrgSchema,
} from "./orgs.schema.js";

export const orgsRouter: Router = Router();

// Accept an invite — intentionally NOT behind requireAuth: a brand-new invitee
// has no account yet (UC-2 3a). The controller reads the bearer token itself
// when the invitee already has an account.
orgsRouter.post(
  "/invites/:inviteToken/accept",
  validate(acceptInviteSchema),
  asyncHandler(controller.acceptInvite),
);

// Pending invites addressed to the authenticated user's own email.
orgsRouter.get(
  "/invites/mine",
  requireAuth,
  asyncHandler(controller.myInvites),
);

orgsRouter.post(
  "/",
  requireAuth,
  validate(createOrgSchema),
  asyncHandler(controller.create),
);

orgsRouter.get(
  "/:orgId",
  requireAuth,
  validate(orgIdParams),
  requireOrgRole(),
  asyncHandler(controller.get),
);

orgsRouter.patch(
  "/:orgId",
  requireAuth,
  validate(updateOrgSchema),
  requireOrgRole("owner", "admin"),
  asyncHandler(controller.update),
);

orgsRouter.delete(
  "/:orgId",
  requireAuth,
  validate(orgIdParams),
  requireOrgRole("owner"),
  asyncHandler(controller.destroy),
);

orgsRouter.get(
  "/:orgId/members",
  requireAuth,
  validate(orgIdParams),
  requireOrgRole(),
  asyncHandler(controller.members),
);

orgsRouter.get(
  "/:orgId/invites",
  requireAuth,
  validate(orgIdParams),
  requireOrgRole("owner", "admin"),
  asyncHandler(controller.listInvites),
);

orgsRouter.post(
  "/:orgId/invites",
  requireAuth,
  validate(inviteSchema),
  requireOrgRole("owner", "admin"),
  asyncHandler(controller.invite),
);

orgsRouter.delete(
  "/:orgId/invites/:inviteId",
  requireAuth,
  validate(inviteIdParams),
  requireOrgRole("owner", "admin"),
  asyncHandler(controller.revokeInvite),
);

orgsRouter.patch(
  "/:orgId/members/:userId",
  requireAuth,
  validate(changeRoleSchema),
  requireOrgRole("owner", "admin"),
  asyncHandler(controller.changeRole),
);

orgsRouter.delete(
  "/:orgId/members/:userId",
  requireAuth,
  validate(memberParams),
  requireOrgRole("owner", "admin"),
  asyncHandler(controller.remove),
);

// Nested: /api/v1/orgs/:orgId/projects/...
orgsRouter.use("/:orgId/projects", requireAuth, projectsRouter);
