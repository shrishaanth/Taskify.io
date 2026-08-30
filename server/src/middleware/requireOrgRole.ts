import type { RequestHandler } from "express";
import { AppError } from "../lib/errors.js";
import type { OrgRole } from "../models/enums.js";

/**
 * Guards an org-scoped route by `:orgId`.
 *  - not a member of that org            → 404 (cross-tenant; never confirmed)
 *  - member but role not in `allowed`    → 403
 * With no `allowed` roles, any membership passes ("Org member" routes).
 * Requires `requireAuth` to have run first.
 */
export function requireOrgRole(...allowed: OrgRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(AppError.unauthenticated());

    const orgId = req.params.orgId;
    const membership = req.auth.orgMemberships.find(
      (m) => m.organizationId === orgId,
    );

    if (!membership) return next(AppError.notFound());
    if (allowed.length > 0 && !allowed.includes(membership.role)) {
      return next(AppError.forbidden());
    }

    req.org = { id: orgId, role: membership.role };
    next();
  };
}
