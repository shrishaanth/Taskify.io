import type {
  Id,
  OrgInvite,
  OrgMemberRow,
  OrgRole,
  OrgSummary,
  UserRef,
} from "../types/domain";
import { apiFetch } from "./http";
import { setAccessToken } from "./tokenStore";

export function createOrg(name: string) {
  return apiFetch<{ id: string; name: string; slug: string }>("/orgs", {
    method: "POST",
    body: { name },
  });
}

export function getOrg(orgId: Id) {
  return apiFetch<{ id: string; name: string; slug: string }>(`/orgs/${orgId}`);
}

export function updateOrg(orgId: Id, patch: { name?: string; slug?: string }) {
  return apiFetch<{ id: string; name: string; slug: string }>(`/orgs/${orgId}`, {
    method: "PATCH",
    body: patch,
  });
}

export function deleteOrg(orgId: Id) {
  return apiFetch<void>(`/orgs/${orgId}`, { method: "DELETE" });
}

interface RawMember {
  user: { id: string; name: string; email?: string; avatarUrl?: string };
  role: OrgRole;
}

export async function listOrgMembers(orgId: Id): Promise<OrgMemberRow[]> {
  const rows = await apiFetch<RawMember[]>(`/orgs/${orgId}/members`);
  return rows.map((r) => ({ user: r.user, role: r.role }));
}

export function inviteOrgMember(
  orgId: Id,
  input: { email: string; role: "admin" | "member" },
) {
  return apiFetch<OrgInvite>(`/orgs/${orgId}/invites`, {
    method: "POST",
    body: input,
  });
}

export function listOrgInvites(orgId: Id) {
  return apiFetch<OrgInvite[]>(`/orgs/${orgId}/invites`);
}

export interface MyInvite extends OrgInvite {
  organization: { id: string; name: string; slug: string };
}

/** Pending invites addressed to the signed-in user's own email. */
export function listMyInvites() {
  return apiFetch<MyInvite[]>(`/orgs/invites/mine`);
}

export function revokeOrgInvite(orgId: Id, inviteId: Id) {
  return apiFetch<void>(`/orgs/${orgId}/invites/${inviteId}`, {
    method: "DELETE",
  });
}

export interface AcceptInviteResult {
  organizationId: string;
  role: OrgRole;
  /** Present only when accepting created a brand-new account (UC-2 3a). */
  user?: UserRef;
  accessToken?: string;
}

export async function acceptInvite(
  token: string,
  body?: { name: string; password: string },
): Promise<AcceptInviteResult> {
  const res = await apiFetch<AcceptInviteResult>(
    `/orgs/invites/${token}/accept`,
    { method: "POST", body: body ?? {}, noRetry: true },
  );
  // A new account comes back with its own access token — start the session.
  if (res.accessToken) setAccessToken(res.accessToken);
  return res;
}

export function changeOrgMemberRole(orgId: Id, userId: Id, role: OrgRole) {
  return apiFetch<{ userId: string; role: OrgRole }>(
    `/orgs/${orgId}/members/${userId}`,
    { method: "PATCH", body: { role } },
  );
}

export function removeOrgMember(orgId: Id, userId: Id) {
  return apiFetch<void>(`/orgs/${orgId}/members/${userId}`, { method: "DELETE" });
}

/** Convenience for the org-switcher: which orgs am I in? (from /auth/me) */
export type { OrgSummary };
