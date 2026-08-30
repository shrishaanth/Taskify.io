import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/composites/PageHeader/PageHeader";
import { DangerZone } from "../components/composites/DangerZone/DangerZone";
import { Modal } from "../components/primitives/Modal/Modal";
import { Input } from "../components/primitives/Input/Input";
import { Button } from "../components/primitives/Button/Button";
import { useToast } from "../components/primitives/Toast/useToast";
import { useDeleteOrg, useUpdateOrg } from "../features/orgs";
import { canEditOrg } from "../lib/permissions";
import { useSession } from "../stores/sessionStore";
import { NotFoundPage } from "./NotFoundPage";
import styles from "./pages.module.css";

export function OrgSettingsPage() {
  const { orgId = "" } = useParams();
  const navigate = useNavigate();
  const org = useSession((s) => s.session?.orgs.find((o) => o.id === orgId));
  const updateOrg = useUpdateOrg(orgId);
  const deleteOrg = useDeleteOrg(orgId);
  const toast = useToast();

  const [name, setName] = useState(org?.name ?? "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  useEffect(() => {
    if (org) setName(org.name);
  }, [org]);

  if (!org) return <NotFoundPage />;

  const canEdit = canEditOrg(org.role);
  const isOwner = org.role === "owner";

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
          description="Permanently delete this organization and all its projects, boards, and cards. This action is irreversible."
          actionLabel="Delete Organization"
          disabled={!isOwner}
          {...(isOwner
            ? { onAction: () => setDeleteOpen(true) }
            : { helperText: "Only an Organization Owner can delete it" })}
        />
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setConfirmText("");
        }}
        size="sm"
        title="Delete organization"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteOpen(false);
                setConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteOrg.isPending}
              disabled={confirmText !== org.name}
              onClick={() =>
                deleteOrg.mutate(undefined, {
                  onSuccess: () => {
                    toast.show({ tone: "success", title: "Organization deleted" });
                    navigate("/", { replace: true });
                  },
                  onError: () =>
                    toast.show({
                      tone: "error",
                      title: "Could not delete the organization",
                    }),
                })
              }
            >
              Delete forever
            </Button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>
          This removes <strong>{org.name}</strong> and everything inside it.
          Type the organization name to confirm.
        </p>
        <Input
          aria-label="Type the organization name to confirm"
          value={confirmText}
          placeholder={org.name}
          onChange={(e) => setConfirmText(e.target.value)}
        />
      </Modal>
    </main>
  );
}
