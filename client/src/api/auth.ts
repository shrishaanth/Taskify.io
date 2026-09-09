import type { OrgSummary, UserRef } from "../types/domain";
import { apiFetch } from "./http";
import { setAccessToken } from "./tokenStore";

interface AuthResponse {
  user: UserRef;
  accessToken: string;
  refreshToken: string;
}

interface MeResponse {
  user: UserRef;
  memberships: {
    organizationId: string;
    role: OrgSummary["role"];
    organization: { id: string; name: string; slug: string };
  }[];
}

export interface Session {
  user: UserRef;
  orgs: OrgSummary[];
}

function toSession(me: MeResponse): Session {
  return {
    user: me.user,
    orgs: me.memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
    })),
  };
}

export async function signup(input: {
  email: string;
  name: string;
  password: string;
}): Promise<UserRef> {
  const res = await apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: input,
    noRetry: true,
  });
  setAccessToken(res.accessToken);
  return res.user;
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<UserRef> {
  const res = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
    noRetry: true,
  });
  setAccessToken(res.accessToken);
  return res.user;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST", body: {}, noRetry: true });
  } finally {
    setAccessToken(null);
  }
}

export async function fetchSession(): Promise<Session> {
  return toSession(await apiFetch<MeResponse>("/auth/me"));
}

export interface OrgDeletionImpact {
  id: string;
  name: string;
  memberCount: number;
}

export interface DeletionPreview {
  /** Orgs the caller solely owns that still have other members. Blocking. */
  blockingOrgs: OrgDeletionImpact[];
  /** Orgs the caller is the only member of — deleted with the account. */
  orgsToDelete: OrgDeletionImpact[];
}

export function fetchDeletionPreview(): Promise<DeletionPreview> {
  return apiFetch<DeletionPreview>("/auth/me/deletion-preview");
}

export async function deleteAccount(input: {
  password: string;
  confirmEmail: string;
}): Promise<void> {
  await apiFetch<void>("/auth/me", {
    method: "DELETE",
    body: input,
    noRetry: true,
  });
  // Only after it succeeded — a rejected attempt (wrong password, or an org
  // that still needs an Owner) must leave the session intact so the user can
  // read the error and correct it.
  setAccessToken(null);
}
