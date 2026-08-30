import type { OrgRole, ProjectRole } from "../models/enums.js";

export interface OrgMembershipContext {
  organizationId: string;
  role: OrgRole;
}

export interface AuthContext {
  userId: string;
  /** Every org the caller belongs to, resolved once per request from the DB. */
  orgMemberships: OrgMembershipContext[];
  /** Convenience: just the org ids (for scoped queries). */
  orgIds: string[];
}

export interface OrgContext {
  id: string;
  role: OrgRole;
}

export interface ProjectContext {
  id: string;
  organizationId: string;
  /** null when access is granted via an Org Owner/Admin override only. */
  role: ProjectRole | null;
  /** true when the caller passed only because they are an Org Owner/Admin. */
  viaOrgOverride: boolean;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      org?: OrgContext;
      project?: ProjectContext;
    }
  }
}

export {};
