/**
 * Pure permission predicates for **UI show/hide only**. The server re-checks
 * every one of these on each request (PROJECT_RULES.md §2, §4.4); never treat
 * a `true` here as authorisation.
 *
 * Rules distilled from srs/06-api-contract.md + srs/04-software-spec.md §4:
 *  - Org member management  -> Org Owner/Admin
 *  - Project member management -> Project Head OR Org Owner/Admin (override)
 *  - Project edit/delete    -> Project Head only
 *  - Board/Card/Subtask work -> Project Head or Member (identical rights)
 *  - Comment delete          -> author, Project Head, or Org Owner/Admin
 *  - Attachment delete       -> uploader, Project Head, or Org Owner/Admin
 */
import type { OrgRole, ProjectRole } from "../types/domain";

export interface ViewerContext {
  /** null when the viewer has no ProjectMembership on the project in question. */
  projectRole: ProjectRole | null;
  /** null when the viewer is not a member of the owning org (should be rare). */
  orgRole: OrgRole | null;
}

export function isOrgAdminOrOwner(orgRole: OrgRole | null): boolean {
  return orgRole === "owner" || orgRole === "admin";
}

/** Invite users, change org roles, remove members. */
export function canManageOrgMembers(orgRole: OrgRole | null): boolean {
  return isOrgAdminOrOwner(orgRole);
}

/** Update org name / settings. */
export function canEditOrg(orgRole: OrgRole | null): boolean {
  return isOrgAdminOrOwner(orgRole);
}

/** Add/remove Project Heads & Members (Head, or Org Owner/Admin override). */
export function canManageProjectMembers(ctx: ViewerContext): boolean {
  return ctx.projectRole === "head" || isOrgAdminOrOwner(ctx.orgRole);
}

/** Rename / delete the project itself — Project Head only (API contract). */
export function canEditProject(ctx: ViewerContext): boolean {
  return ctx.projectRole === "head";
}

/** Open the project and see boards/cards/members. */
export function canViewProject(ctx: ViewerContext): boolean {
  return ctx.projectRole === "head" || ctx.projectRole === "member";
}

/** Create/edit/move/delete cards & boards, comment, manage subtasks. */
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
