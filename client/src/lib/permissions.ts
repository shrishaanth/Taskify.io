import type { OrgRole, ProjectRole } from "../types/domain";

export interface ViewerContext {
  projectRole: ProjectRole | null;
  orgRole: OrgRole | null;
}

export function isOrgAdminOrOwner(orgRole: OrgRole | null): boolean {
  return orgRole === "owner" || orgRole === "admin";
}

export function canManageOrgMembers(orgRole: OrgRole | null): boolean {
  return isOrgAdminOrOwner(orgRole);
}

export function canEditOrg(orgRole: OrgRole | null): boolean {
  return isOrgAdminOrOwner(orgRole);
}

export function canManageProjectMembers(ctx: ViewerContext): boolean {
  return ctx.projectRole === "head" || isOrgAdminOrOwner(ctx.orgRole);
}

export function canEditProject(ctx: ViewerContext): boolean {
  return ctx.projectRole === "head";
}

export function canViewProject(ctx: ViewerContext): boolean {
  return ctx.projectRole === "head" || ctx.projectRole === "member";
}

export function canWorkOnBoard(ctx: ViewerContext): boolean {
  return ctx.projectRole === "head" || ctx.projectRole === "member";
}

export function canDeleteComment(
  ctx: ViewerContext,
  opts: { isAuthor: boolean },
): boolean {
  return (
    opts.isAuthor || ctx.projectRole === "head" || isOrgAdminOrOwner(ctx.orgRole)
  );
}

export function canDeleteAttachment(
  ctx: ViewerContext,
  opts: { isUploader: boolean },
): boolean {
  return (
    opts.isUploader || ctx.projectRole === "head" || isOrgAdminOrOwner(ctx.orgRole)
  );
}
