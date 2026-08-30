import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../components/composites/PageHeader/PageHeader";
import { DangerZone } from "../components/composites/DangerZone/DangerZone";
import { Input } from "../components/primitives/Input/Input";
import { Button } from "../components/primitives/Button/Button";
import { useToast } from "../components/primitives/Toast/useToast";
import { canEditOrg } from "../lib/permissions";
import { useMockData } from "../stores/mockDataStore";
import { NotFoundPage } from "./NotFoundPage";
import styles from "./pages.module.css";

export function OrgSettingsPage() {
  const { orgId = "" } = useParams();
  const org = useMockData((s) => s.orgById(orgId));
  const orgRole = useMockData((s) => s.orgRoleFor(orgId));
  const updateOrgName = useMockData((s) => s.updateOrgName);
  const owners = useMockData(
    (s) => (s.orgMembers[orgId] ?? []).filter((m) => m.role === "owner").length,
  );
  const toast = useToast();

  const [name, setName] = useState(org?.name ?? "");
  useEffect(() => {
    if (org) setName(org.name);
  }, [org]);

  if (!org) return <NotFoundPage />;

  const canEdit = canEditOrg(orgRole);
  const soleOwner = owners <= 1;

  return (
    <main className={styles.page}>
      <PageHeader
        title="Organization Settings"
        subtitle="Modify organization name, custom branding, and general configurations."
        breadcrumbs={[{ label: org.name, href: `/orgs/${orgId}/projects` }, { label: "Settings" }]}
      />

      <div className={styles.settingsStack}>
        <div className={styles.card}>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="org-name">
              Organization Name
            </label>
            <Input
              id="org-name"
              value={name}
              disabled={!canEdit}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div style={{ marginTop: "var(--space-4)" }}>
            <Button
              size="sm"
              disabled={!canEdit || name.trim().length === 0 || name === org.name}
              onClick={() => {
                updateOrgName(orgId, name.trim());
                toast.show({ tone: "success", title: "Organization updated" });
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>

        <DangerZone
          description="Permanently delete this organization and all its data. This action is irreversible."
          actionLabel="Delete Organization"
          disabled
          helperText={
            soleOwner
              ? "Requires no other Owners"
              : "Deleting removes every project, board and card"
          }
        />
      </div>
    </main>
  );
}
