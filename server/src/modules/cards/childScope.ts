import type { Request } from "express";
import type { OrgRole } from "../../models/index.js";
import { auth } from "../../lib/http.js";

/** Org role the caller holds in the current project's organization (if any). */
export function callerOrgRole(req: Request): OrgRole | null {
  const orgId = req.project?.organizationId;
  if (!orgId || !req.auth) return null;
  return req.auth.orgMemberships.find((m) => m.organizationId === orgId)?.role ?? null;
}

/**
 * Comment / attachment delete rule (API contract):
 * the author/uploader, a Project Head, or an Org Owner/Admin.
 */
export function canDeleteAuthored(req: Request, authorId: string): boolean {
  const me = auth(req).userId;
  if (authorId === me) return true;
  if (req.project?.role === "head") return true;
  const orgRole = callerOrgRole(req);
  return orgRole === "owner" || orgRole === "admin";
}
