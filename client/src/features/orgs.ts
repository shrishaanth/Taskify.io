import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as orgsApi from "../api/orgs";
import type { Id, OrgRole } from "../types/domain";
import { useSession } from "../stores/sessionStore";
import { qk } from "./queryClient";

export function useOrgMembers(orgId: Id) {
  return useQuery({
    queryKey: qk.orgMembers(orgId),
    queryFn: () => orgsApi.listOrgMembers(orgId),
    enabled: Boolean(orgId),
  });
}

export function useCreateOrg() {
  const refresh = useSession((s) => s.refresh);
  return useMutation({
    mutationFn: (name: string) => orgsApi.createOrg(name),
    onSuccess: () => refresh(),
  });
}

export function useUpdateOrg(orgId: Id) {
  const refresh = useSession((s) => s.refresh);
  return useMutation({
    mutationFn: (patch: { name?: string; slug?: string }) =>
      orgsApi.updateOrg(orgId, patch),
    onSuccess: () => refresh(),
  });
}

export function useDeleteOrg(orgId: Id) {
  const refresh = useSession((s) => s.refresh);
  return useMutation({
    mutationFn: () => orgsApi.deleteOrg(orgId),
    onSuccess: () => refresh(),
  });
}

export function useOrgInvites(orgId: Id, enabled = true) {
  return useQuery({
    queryKey: qk.orgInvites(orgId),
    queryFn: () => orgsApi.listOrgInvites(orgId),
    enabled: Boolean(orgId) && enabled,
  });
}

export function useInviteOrgMember(orgId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: "admin" | "member" }) =>
      orgsApi.inviteOrgMember(orgId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.orgInvites(orgId) });
      void qc.invalidateQueries({ queryKey: qk.orgMembers(orgId) });
    },
  });
}

export function useRevokeOrgInvite(orgId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: Id) => orgsApi.revokeOrgInvite(orgId, inviteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.orgInvites(orgId) }),
  });
}

export function useMyInvites() {
  const status = useSession((s) => s.status);
  return useQuery({
    queryKey: qk.myInvites,
    queryFn: () => orgsApi.listMyInvites(),
    enabled: status === "authenticated",
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  const refresh = useSession((s) => s.refresh);
  return useMutation({
    mutationFn: (token: string) => orgsApi.acceptInvite(token),
    onSuccess: async () => {
      await refresh();
      void qc.invalidateQueries({ queryKey: qk.myInvites });
    },
  });
}

export function useChangeOrgMemberRole(orgId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { userId: Id; role: OrgRole }) =>
      orgsApi.changeOrgMemberRole(orgId, args.userId, args.role),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.orgMembers(orgId) }),
  });
}

export function useRemoveOrgMember(orgId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: Id) => orgsApi.removeOrgMember(orgId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.orgMembers(orgId) }),
  });
}
