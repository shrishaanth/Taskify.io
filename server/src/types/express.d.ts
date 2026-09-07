import type { OrgRole, ProjectRole } from "../models/enums.js";

export interface OrgMembershipContext {
  organizationId: string;
  role: OrgRole;
}

export interface AuthContext {
  userId: string;
  orgMemberships: OrgMembershipContext[];
  orgIds: string[];
}

export interface OrgContext {
  id: string;
  role: OrgRole;
}

export interface ProjectContext {
  id: string;
  organizationId: string;
  role: ProjectRole | null;
  viaOrgOverride: boolean;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      org?: OrgContext;
      project?: ProjectContext;
      resolvedProjectId?: string;
      resolvedBoardId?: string;
    }
  }
}

export {};
