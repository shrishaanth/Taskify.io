import type {
  Id,
  ProjectMemberRow,
  ProjectRole,
  ProjectSummary,
  UserRef,
} from "../types/domain";
import { apiFetch } from "./http";

interface RawProjectListEntry {
  id: string;
  name: string;
  description?: string;
  role: ProjectRole | null;
  members: UserRef[];
}

export async function listProjects(orgId: Id): Promise<ProjectSummary[]> {
  const rows = await apiFetch<RawProjectListEntry[]>(
    `/orgs/${orgId}/projects`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    ...(r.description ? { description: r.description } : {}),
    role: r.role,
    members: r.members ?? [],
  }));
}

export async function createProject(
  orgId: Id,
  input: { name: string; description?: string },
): Promise<ProjectSummary> {
  const r = await apiFetch<{
    id: string;
    name: string;
    description?: string;
    role: ProjectRole;
  }>(`/orgs/${orgId}/projects`, { method: "POST", body: input });
  return {
    id: r.id,
    name: r.name,
    ...(r.description ? { description: r.description } : {}),
    role: r.role,
    members: [],
  };
}

export interface ProjectDetail extends ProjectSummary {
  memberRows: ProjectMemberRow[];
}

export async function getProject(
  orgId: Id,
  projectId: Id,
): Promise<ProjectDetail> {
  const r = await apiFetch<{
    id: string;
    name: string;
    description?: string;
    role: ProjectRole;
    members: { user: UserRef; role: ProjectRole }[];
  }>(`/orgs/${orgId}/projects/${projectId}`);
  return {
    id: r.id,
    name: r.name,
    ...(r.description ? { description: r.description } : {}),
    role: r.role,
    members: r.members.map((m) => m.user),
    memberRows: r.members.map((m) => ({ user: m.user, role: m.role })),
  };
}

export function updateProject(
  orgId: Id,
  projectId: Id,
  patch: { name?: string; description?: string | null },
) {
  return apiFetch(`/orgs/${orgId}/projects/${projectId}`, {
    method: "PATCH",
    body: patch,
  });
}

export function deleteProject(orgId: Id, projectId: Id) {
  return apiFetch<void>(`/orgs/${orgId}/projects/${projectId}`, {
    method: "DELETE",
  });
}

export async function listProjectMembers(
  orgId: Id,
  projectId: Id,
): Promise<ProjectMemberRow[]> {
  const rows = await apiFetch<{ user: UserRef; role: ProjectRole }[]>(
    `/orgs/${orgId}/projects/${projectId}/members`,
  );
  return rows.map((r) => ({ user: r.user, role: r.role }));
}

export function setProjectMember(
  orgId: Id,
  projectId: Id,
  userId: Id,
  role: ProjectRole,
) {
  return apiFetch<{ userId: string; role: ProjectRole }>(
    `/orgs/${orgId}/projects/${projectId}/members/${userId}`,
    { method: "PUT", body: { role } },
  );
}

export function removeProjectMember(orgId: Id, projectId: Id, userId: Id) {
  return apiFetch<void>(
    `/orgs/${orgId}/projects/${projectId}/members/${userId}`,
    { method: "DELETE" },
  );
}
