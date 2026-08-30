import { useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../components/composites/PageHeader/PageHeader";
import { MembersTable } from "../components/composites/MembersTable/MembersTable";
import { InviteMemberModal } from "../components/composites/CreateModals/InviteMemberModal";
import { Button } from "../components/primitives/Button/Button";
import { useMockData, EMPTY } from "../stores/mockDataStore";
import { NotFoundPage } from "./NotFoundPage";
import styles from "./pages.module.css";

export function OrgMembersPage() {
  const { orgId = "" } = useParams();
  const [inviteOpen, setInviteOpen] = useState(false);

  const org = useMockData((s) => s.orgById(orgId));
  const members = useMockData((s) => s.orgMembers[orgId] ?? EMPTY);
  const orgRole = useMockData((s) => s.orgRoleFor(orgId));
  const setOrgMemberRole = useMockData((s) => s.setOrgMemberRole);
  const removeOrgMember = useMockData((s) => s.removeOrgMember);
  const inviteOrgMember = useMockData((s) => s.inviteOrgMember);

  if (!org) return <NotFoundPage />;

  return (
    <main className={styles.page}>
      <PageHeader
        title="Members"
        subtitle="Manage members, roles, and platform permissions."
        breadcrumbs={[{ label: org.name, href: `/orgs/${orgId}/projects` }, { label: "Members" }]}
        action={<Button onClick={() => setInviteOpen(true)}>+ Invite Member</Button>}
      />

      <MembersTable
        scope="org"
        members={members}
        viewer={{ projectRole: null, orgRole }}
        onChangeRole={(userId, role) =>
          setOrgMemberRole(orgId, userId, role as "owner" | "admin" | "member")
        }
        onRemove={(userId) => removeOrgMember(orgId, userId)}
      />

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={(values) => {
          inviteOrgMember(orgId, values);
          setInviteOpen(false);
        }}
      />
    </main>
  );
}
