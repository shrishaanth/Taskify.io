import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "../components/composites/PageHeader/PageHeader";
import { DangerZone } from "../components/composites/DangerZone/DangerZone";
import { Input } from "../components/primitives/Input/Input";
import { Button } from "../components/primitives/Button/Button";
import { useToast } from "../components/primitives/Toast/useToast";
import { useUpdateOrg } from "../features/orgs";
import { canEditOrg } from "../lib/permissions";
import { useSession } from "../stores/sessionStore";
import { NotFoundPage } from "./NotFoundPage";
import styles from "./pages.module.css";

export function OrgSettingsPage() {
  const { orgId = "" } = useParams();
  const org = useSession((s) => s.session?.orgs.find((o) => o.id === orgId));
  const updateOrg = useUpdateOrg(orgId);
  const toast = useToast();

  const [name, setName] = useState(org?.name ?? "");
  useEffect(() => {
    if (org) setName(org.name);
  }, [org]);

  if (!org) return <NotFoundPage />;

  const canEdit = canEditOrg(org.role);

  return (
    <main className={styles.page}>
      <PageHeader
        title="Organization Settings"
        subtitle="Modify organization name, custom branding, and general configurations."
        breadcrumbs={[
          { label: org.name, href: `/orgs/${orgId}/projects` },
          { label: "Settings" },
        ]}
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
              loading={updateOrg.isPending}
              disabled={
                !canEdit || name.trim().length === 0 || name === org.name
              }
              onClick={() =>
                updateOrg.mutate(
                  { name: name.trim() },
                  {
                    onSuccess: () =>
                      toast.show({ tone: "success", title: "Organization updated" }),
                    onError: () =>
                      toast.show({ tone: "error", title: "Could not save changes" }),
                  },
                )
              }
            >
              Save Changes
            </Button>
          </div>
        </div>

        <DangerZone
          description="Permanently delete this organization and all its data. This action is irreversible."
          actionLabel="Delete Organization"
          disabled
          helperText="Requires no other Owners"
        />
      </div>
    </main>
  );
}
