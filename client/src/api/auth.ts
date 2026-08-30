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
