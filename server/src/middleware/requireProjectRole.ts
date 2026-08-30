import type { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import { AppError } from "../lib/errors.js";
import type { ProjectRole } from "../models/enums.js";
import { ProjectMembershipModel, ProjectModel } from "../models/index.js";

interface Options {
  /** Allowed project roles. Empty = any project membership passes. */
  roles?: ProjectRole[];
  /**
   * Let an Org Owner/Admin through even with no ProjectMembership — the
   * intentional override for membership-management actions (FR-2.7, UC-9).
   */
  allowOrgManagerOverride?: boolean;
}

/**
 * Guards a project-scoped route by `:projectId`, re-reading membership from the
 * DB every request (§4 — demotions take effect on the next request).
 *
 *  - project missing OR in another tenant  → 404 (never confirmed — UC-10)
 *  - in the org, project listed, but the caller has no ProjectMembership → 403
 *    (unless `allowOrgManagerOverride` and the caller is Org Owner/Admin)
 *  - has a ProjectMembership whose role is not allowed → 403
 */
function build({ roles = [], allowOrgManagerOverride = false }: Options): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (!req.auth) throw AppError.unauthenticated();

      const projectId = req.params.projectId ?? req.resolvedProjectId;
      if (!projectId || !isValidObjectId(projectId)) throw AppError.notFound();

      const project = await ProjectModel.findById(projectId)
        .select("organizationId")
        .lean();
      if (!project) throw AppError.notFound();

      const orgId = String(project.organizationId);
      const orgMembership = req.auth.orgMemberships.find(
        (m) => m.organizationId === orgId,
      );
      // Project belongs to an org the caller is not in → indistinguishable 404.
      if (!orgMembership) throw AppError.notFound();

      const isOrgManager =
        orgMembership.role === "owner" || orgMembership.role === "admin";

      const pm = await ProjectMembershipModel.findOne({
        projectId,
        userId: req.auth.userId,
      })
        .select("role")
        .lean();
      const projectRole: ProjectRole | null = pm?.role ?? null;

      const roleAllowed =
        projectRole !== null &&
        (roles.length === 0 || roles.includes(projectRole));

      if (roleAllowed) {
        req.project = {
          id: projectId,
          organizationId: orgId,
          role: projectRole,
          viaOrgOverride: false,
        };
        return next();
      }

      if (allowOrgManagerOverride && isOrgManager) {
        req.project = {
          id: projectId,
          organizationId: orgId,
          role: projectRole,
          viaOrgOverride: true,
        };
        return next();
      }

      // In the org, project is legitimately listed, but access is blocked.
      throw AppError.forbidden();
    } catch (err) {
      next(err);
    }
  };
}

/** Require any project membership, or one of the given roles. No org override. */
export function requireProjectRole(...roles: ProjectRole[]): RequestHandler {
  return build({ roles });
}

/**
 * Project Head, or an Org Owner/Admin acting as the organizational safety net.
 * Use for project membership changes and project reassignment (UC-9).
 */
export function requireProjectManage(): RequestHandler {
  return build({ roles: ["head"], allowOrgManagerOverride: true });
}

/**
 * Any project member (Head/Member) OR an Org Owner/Admin without a
 * ProjectMembership. Use where the API contract allows "…, or Org Owner/Admin"
 * on top of project access — comment/attachment deletion. The route handler
 * still applies the finer author/uploader check.
 */
export function requireBoardAccessOrOrgManager(): RequestHandler {
  return build({ roles: ["head", "member"], allowOrgManagerOverride: true });
}
