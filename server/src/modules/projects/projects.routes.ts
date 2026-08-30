import { Router } from "express";
import { asyncHandler } from "../../lib/http.js";
import { requireOrgRole } from "../../middleware/requireOrgRole.js";
import {
  requireProjectManage,
  requireProjectRole,
} from "../../middleware/requireProjectRole.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./projects.controller.js";
import {
  createProjectSchema,
  orgScopeParams,
  projectMemberParams,
  projectParams,
  setProjectRoleSchema,
  updateProjectSchema,
} from "./projects.schema.js";

// mergeParams so :orgId (and later :projectId) are visible here.
export const projectsRouter: Router = Router({ mergeParams: true });

// Every route below is org-scoped; `requireAuth` already ran on the parent.
projectsRouter.get(
  "/",
  validate(orgScopeParams),
  requireOrgRole(),
  asyncHandler(controller.list),
);

projectsRouter.post(
  "/",
  validate(createProjectSchema),
  requireOrgRole(),
  asyncHandler(controller.create),
);

projectsRouter.get(
  "/:projectId",
  validate(projectParams),
  requireOrgRole(), // must be an org member; handler enforces the 403 (FR-2.3)
  asyncHandler(controller.detail),
);

projectsRouter.patch(
  "/:projectId",
  validate(updateProjectSchema),
  requireProjectRole("head"),
  asyncHandler(controller.update),
);

projectsRouter.delete(
  "/:projectId",
  validate(projectParams),
  requireProjectRole("head"),
  asyncHandler(controller.remove),
);

projectsRouter.get(
  "/:projectId/members",
  validate(projectParams),
  requireProjectRole("head", "member"),
  asyncHandler(controller.members),
);

projectsRouter.put(
  "/:projectId/members/:userId",
  validate(setProjectRoleSchema),
  requireProjectManage(),
  asyncHandler(controller.setMember),
);

projectsRouter.delete(
  "/:projectId/members/:userId",
  validate(projectMemberParams),
  requireProjectManage(),
  asyncHandler(controller.removeMember),
);
