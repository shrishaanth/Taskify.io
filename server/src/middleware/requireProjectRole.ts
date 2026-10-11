import type { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import { AppError } from "../lib/errors.js";
import type { ProjectRole } from "../models/enums.js";
import { ProjectMembershipModel, ProjectModel } from "../models/index.js";

interface Options {
  roles?: ProjectRole[];
  allowOrgManagerOverride?: boolean;
}

function build({ roles = [], allowOrgManagerOverride = false }: Options): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (!req.auth) throw AppError.unauthenticated();

      const projectId = req.params.projectId ?? req.resolvedProjectId;
      if (!projectId || !isValidObjectId(projectId)) throw AppError.notFound();

      // Neither lookup needs the other's answer; the project membership is
      // only trusted below, after the org check has passed.
      const [project, pm] = await Promise.all([
        ProjectModel.findById(projectId).select("organizationId").lean(),
        ProjectMembershipModel.findOne({ projectId, userId: req.auth.userId })
          .select("role")
          .lean(),
      ]);
      if (!project) throw AppError.notFound();

      const orgId = String(project.organizationId);
      const orgMembership = req.auth.orgMemberships.find(
        (m) => m.organizationId === orgId,
      );
      if (!orgMembership) throw AppError.notFound();

      const isOrgManager =
        orgMembership.role === "owner" || orgMembership.role === "admin";

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

      throw AppError.forbidden();
    } catch (err) {
      next(err);
    }
  };
}

export function requireProjectRole(...roles: ProjectRole[]): RequestHandler {
  return build({ roles });
}

export function requireProjectManage(): RequestHandler {
  return build({ roles: ["head"], allowOrgManagerOverride: true });
}

export function requireBoardAccessOrOrgManager(): RequestHandler {
  return build({ roles: ["head", "member"], allowOrgManagerOverride: true });
}
