import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as projectsApi from "../api/projects";
import type { Id, ProjectRole } from "../types/domain";
import { qk } from "./queryClient";

export function useProjects(orgId: Id) {
  return useQuery({
    queryKey: qk.projects(orgId),
    queryFn: () => projectsApi.listProjects(orgId),
    enabled: Boolean(orgId),
  });
}

export function useProject(orgId: Id, projectId: Id) {
  return useQuery({
    queryKey: qk.project(orgId, projectId),
    queryFn: () => projectsApi.getProject(orgId, projectId),
    enabled: Boolean(orgId && projectId),
    retry: false,
  });
}

export function useCreateProject(orgId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string }) =>
      projectsApi.createProject(orgId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects(orgId) }),
  });
}

export function useUpdateProject(orgId: Id, projectId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: { name?: string; description?: string | null }) =>
      projectsApi.updateProject(orgId, projectId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.project(orgId, projectId) });
      qc.invalidateQueries({ queryKey: qk.projects(orgId) });
    },
  });
}

export function useDeleteProject(orgId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: Id) => projectsApi.deleteProject(orgId, projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects(orgId) }),
  });
}

export function useProjectMembers(orgId: Id, projectId: Id) {
  return useQuery({
    queryKey: qk.projectMembers(projectId),
    queryFn: () => projectsApi.listProjectMembers(orgId, projectId),
    enabled: Boolean(orgId && projectId),
  });
}

export function useSetProjectMember(orgId: Id, projectId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { userId: Id; role: ProjectRole }) =>
      projectsApi.setProjectMember(orgId, projectId, args.userId, args.role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.projectMembers(projectId) });
      qc.invalidateQueries({ queryKey: qk.project(orgId, projectId) });
    },
  });
}

export function useRemoveProjectMember(orgId: Id, projectId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: Id) =>
      projectsApi.removeProjectMember(orgId, projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.projectMembers(projectId) });
      qc.invalidateQueries({ queryKey: qk.project(orgId, projectId) });
    },
  });
}
