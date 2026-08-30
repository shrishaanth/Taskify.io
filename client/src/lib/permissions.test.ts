import { describe, it, expect } from "vitest";
import {
  canManageOrgMembers,
  canEditOrg,
  canManageProjectMembers,
  canEditProject,
  canViewProject,
  canWorkOnBoard,
  canDeleteComment,
  canDeleteAttachment,
  isOrgAdminOrOwner,
} from "./permissions";

describe("org-level permissions", () => {
  it("only owner/admin manage org members + settings", () => {
    expect(canManageOrgMembers("owner")).toBe(true);
    expect(canManageOrgMembers("admin")).toBe(true);
    expect(canManageOrgMembers("member")).toBe(false);
    expect(canManageOrgMembers(null)).toBe(false);
    expect(canEditOrg("member")).toBe(false);
    expect(isOrgAdminOrOwner("admin")).toBe(true);
  });
});

describe("project member management (Head or Org Owner/Admin override)", () => {
  it("allows a Project Head", () => {
    expect(canManageProjectMembers({ projectRole: "head", orgRole: "member" })).toBe(
      true,
    );
  });
  it("allows an Org Owner/Admin with no project membership (FR-2.7 override)", () => {
    expect(canManageProjectMembers({ projectRole: null, orgRole: "admin" })).toBe(
      true,
    );
    expect(canManageProjectMembers({ projectRole: null, orgRole: "owner" })).toBe(
      true,
    );
  });
  it("rejects a plain Project Member", () => {
    expect(
      canManageProjectMembers({ projectRole: "member", orgRole: "member" }),
    ).toBe(false);
  });
});

describe("project edit/delete is Head-only", () => {
  it("Head yes, Member no, Org Admin (not on project) no", () => {
    expect(canEditProject({ projectRole: "head", orgRole: "member" })).toBe(true);
    expect(canEditProject({ projectRole: "member", orgRole: "member" })).toBe(false);
    expect(canEditProject({ projectRole: null, orgRole: "admin" })).toBe(false);
  });
});

describe("board/card work — Head and Member are identical", () => {
  it.each(["head", "member"] as const)("%s can work on the board", (r) => {
    expect(canWorkOnBoard({ projectRole: r, orgRole: "member" })).toBe(true);
    expect(canViewProject({ projectRole: r, orgRole: "member" })).toBe(true);
  });
  it("no membership -> cannot work or view (even Org Admin)", () => {
    expect(canWorkOnBoard({ projectRole: null, orgRole: "admin" })).toBe(false);
    expect(canViewProject({ projectRole: null, orgRole: "admin" })).toBe(false);
  });
});

describe("comment / attachment delete", () => {
  const member = { projectRole: "member", orgRole: "member" } as const;
  const head = { projectRole: "head", orgRole: "member" } as const;
  const orgAdmin = { projectRole: null, orgRole: "admin" } as const;

  it("author can always delete their own comment", () => {
    expect(canDeleteComment(member, { isAuthor: true })).toBe(true);
  });
  it("a non-author Member cannot delete someone else's comment", () => {
    expect(canDeleteComment(member, { isAuthor: false })).toBe(false);
  });
  it("Project Head and Org Owner/Admin can delete any comment", () => {
    expect(canDeleteComment(head, { isAuthor: false })).toBe(true);
    expect(canDeleteComment(orgAdmin, { isAuthor: false })).toBe(true);
  });
  it("attachment delete mirrors comment rules with the uploader", () => {
    expect(canDeleteAttachment(member, { isUploader: true })).toBe(true);
    expect(canDeleteAttachment(member, { isUploader: false })).toBe(false);
    expect(canDeleteAttachment(head, { isUploader: false })).toBe(true);
  });
});
