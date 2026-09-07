import type { Request } from "express";
import type { OrgRole } from "../../models/index.js";
import { auth } from "../../lib/http.js";

export function callerOrgRole(req: Request): OrgRole | null {
  const orgId = req.project?.organizationId;
  if (!orgId || !req.auth) return null;
  return req.auth.orgMemberships.find((m) => m.organizationId === orgId)?.role ?? null;
}

export function canDeleteAuthored(req: Request, authorId: string): boolean {
  const me = auth(req).userId;
  if (authorId === me) return true;
  if (req.project?.role === "head") return true;
  const orgRole = callerOrgRole(req);
  return orgRole === "owner" || orgRole === "admin";
}
