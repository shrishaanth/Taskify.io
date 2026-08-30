import { useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../components/composites/PageHeader/PageHeader";
import { MembersTable } from "../components/composites/MembersTable/MembersTable";
import { InviteMemberModal } from "../components/composites/CreateModals/InviteMemberModal";
import { Button } from "../components/primitives/Button/Button";
import { Skeleton } from "../components/primitives/Skeleton/Skeleton";
import {
  useChangeOrgMemberRole,
  useInviteOrgMember,
  useOrgMembers,
  useRemoveOrgMember,
} from "../features/orgs";
import { useSession } from "../stores/sessionStore";
import { NotFoundPage } from "./NotFoundPage";
import styles from "./pages.module.css";

export function OrgMembersPage() {
  const { orgId = "" } = useParams();
  const [inviteOpen, setInviteOpen] = useState(false);

  const org = useSession((s) => s.session?.orgs.find((o) => o.id === orgId));
  const membersQuery = useOrgMembers(orgId);
  const changeRole = useChangeOrgMemberRole(orgId);
  const removeMember = useRemoveOrgMember(orgId);
  const invite = useInviteOrgMember(orgId);

  if (!org) return <NotFoundPage />;

  return (
    <main className={styles.page}>
      <PageHeader
        title="Members"
        subtitle="Manage members, roles, and platform permissions."
        breadcrumbs={[
          { label: org.name, href: `/orgs/${orgId}/projects` },
          { label: "Members" },
        ]}
        action={<Button onClick={() => setInviteOpen(true)}>+ Invite Member</Button>}
      />

      {membersQuery.isLoading ? (
        <Skeleton variant="block" height={220} />
      ) : (
        <MembersTable
          scope="org"
          members={membersQuery.data ?? []}
          viewer={{ projectRole: null, orgRole: org.role }}
          onChangeRole={(userId, role) =>
            changeRole.mutate({
              userId,
              role: role as "owner" | "admin" | "member",
            })
          }
          onRemove={(userId) => removeMember.mutate(userId)}
        />
      )}

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        pending={invite.isPending}
        onInvite={(values) => {
          invite.mutate(
            { email: values.email, role: values.role as "admin" | "member" },
            { onSuccess: () => setInviteOpen(false) },
          );
        }}
      />
    </main>
  );
}
