import { useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../components/composites/PageHeader/PageHeader";
import { MembersTable } from "../components/composites/MembersTable/MembersTable";
import { RoleBadge } from "../components/composites/RoleBadge/RoleBadge";
import { InviteMemberModal } from "../components/composites/CreateModals/InviteMemberModal";
import { Button } from "../components/primitives/Button/Button";
import { Skeleton } from "../components/primitives/Skeleton/Skeleton";
import { useToast } from "../components/primitives/Toast/useToast";
import { formatShortDate } from "../lib/format";
import { canManageOrgMembers } from "../lib/permissions";
import {
  useChangeOrgMemberRole,
  useInviteOrgMember,
  useOrgInvites,
  useOrgMembers,
  useRemoveOrgMember,
  useRevokeOrgInvite,
} from "../features/orgs";
import { useSession } from "../stores/sessionStore";
import { NotFoundPage } from "./NotFoundPage";
import styles from "./pages.module.css";

function inviteLinkFor(token: string): string {
  const origin =
    typeof window !== "undefined" && window.location
      ? window.location.origin
      : "";
  return `${origin}/invite/${token}`;
}

export function OrgMembersPage() {
  const { orgId = "" } = useParams();
  const [inviteOpen, setInviteOpen] = useState(false);

  const toast = useToast();
  const org = useSession((s) => s.session?.orgs.find((o) => o.id === orgId));
  const canManage = canManageOrgMembers(org?.role ?? null);

  const membersQuery = useOrgMembers(orgId);
  const invitesQuery = useOrgInvites(orgId, canManage);
  const changeRole = useChangeOrgMemberRole(orgId);
  const removeMember = useRemoveOrgMember(orgId);
  const invite = useInviteOrgMember(orgId);
  const revokeInvite = useRevokeOrgInvite(orgId);

  if (!org) return <NotFoundPage />;

  const copyLink = async (token: string) => {
    const link = inviteLinkFor(token);
    try {
      await navigator.clipboard?.writeText(link);
      toast.show({ tone: "success", title: "Invite link copied" });
    } catch {
      toast.show({
        tone: "info",
        title: "Invite link",
        description: link,
        duration: 0,
      });
    }
  };

  const invites = invitesQuery.data ?? [];

  return (
    <main className={styles.page}>
      <PageHeader
        title="Members"
        subtitle="Manage members, roles, and platform permissions."
        breadcrumbs={[
          { label: org.name, href: `/orgs/${orgId}/projects` },
          { label: "Members" },
        ]}
        {...(canManage
          ? {
              action: (
                <Button onClick={() => setInviteOpen(true)}>
                  + Invite Member
                </Button>
              ),
            }
          : {})}
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

      {canManage && invites.length > 0 && (
        <section className={styles.inviteSection} aria-label="Pending invitations">
          <h2>Pending Invitations</h2>
          <div className={styles.inviteList}>
            {invites.map((inv) => (
              <div key={inv.id} className={styles.inviteRow}>
                <span className={styles.inviteEmail}>{inv.email}</span>
                <RoleBadge scope="org" role={inv.role} size="sm" />
                <span className={styles.inviteMeta}>
                  expires {formatShortDate(inv.expiresAt)}
                </span>
                <span className={styles.inviteSpacer} />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void copyLink(inv.token)}
                >
                  Copy link
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => revokeInvite.mutate(inv.id)}
                >
                  Revoke {inv.email}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        pending={invite.isPending}
        onInvite={(values) => {
          invite.mutate(
            { email: values.email, role: values.role as "admin" | "member" },
            {
              onSuccess: (created) => {
                setInviteOpen(false);
                toast.show({
                  tone: "success",
                  title: `Invite created for ${created.email}`,
                  description: `Send them this link: ${inviteLinkFor(created.token)}`,
                  duration: 0,
                });
                void navigator.clipboard
                  ?.writeText(inviteLinkFor(created.token))
                  .catch(() => {});
              },
              onError: () =>
                toast.show({
                  tone: "error",
                  title: "Could not create the invite",
                  description: "They may already be a member of this organization.",
                }),
            },
          );
        }}
      />
    </main>
  );
}
