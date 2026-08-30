import type { Id, OrgMemberRow, OrgRole, OrgSummary } from "../types/domain";
import { apiFetch } from "./http";

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
  return apiFetch<{ id: string; email: string; role: OrgRole; token: string }>(
    `/orgs/${orgId}/invites`,
    { method: "POST", body: input },
  );
}

export function acceptInvite(
  token: string,
  body?: { name: string; password: string },
) {
  return apiFetch(`/orgs/invites/${token}/accept`, {
    method: "POST",
    body: body ?? {},
  });
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
