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

export function useInviteOrgMember(orgId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: "admin" | "member" }) =>
      orgsApi.inviteOrgMember(orgId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.orgMembers(orgId) }),
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
