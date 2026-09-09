import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/composites/PageHeader/PageHeader";
import { DangerZone } from "../components/composites/DangerZone/DangerZone";
import { Modal } from "../components/primitives/Modal/Modal";
import { Input } from "../components/primitives/Input/Input";
import { Button } from "../components/primitives/Button/Button";
import { Spinner } from "../components/primitives/Spinner/Spinner";
import { useToast } from "../components/primitives/Toast/useToast";
import * as authApi from "../api/auth";
import type { DeletionPreview } from "../api/auth";
import { ApiError } from "../api/http";
import { disconnectSocket } from "../api/socket";
import { useSession } from "../stores/sessionStore";
import styles from "./pages.module.css";

export function AccountSettingsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useSession((s) => s.session?.user);
  const setSession = useSession((s) => s.setSession);

  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // The consequences are fetched when the dialog opens rather than on page
  // load, so the numbers shown are the ones in force at the moment of asking.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingPreview(true);
    authApi
      .fetchDeletionPreview()
      .then((p) => {
        if (!cancelled) setPreview(p);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // `/auth/me` always carries the caller's own email; the field is optional
  // only because the same shape is reused for other people's references.
  const email = user?.email ?? "";
  if (!user || !email) return null;

  const close = () => {
    setOpen(false);
    setPassword("");
    setConfirmEmail("");
    setError(null);
    setPreview(null);
  };

  const blocked = (preview?.blockingOrgs.length ?? 0) > 0;
  const emailMatches =
    confirmEmail.trim().toLowerCase() === email.toLowerCase();
  const canSubmit =
    !pending && !blocked && !loadingPreview && emailMatches && password.length > 0;

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      await authApi.deleteAccount({ password, confirmEmail: confirmEmail.trim() });
      disconnectSocket();
      setSession(null);
      toast.show({ tone: "success", title: "Your account has been deleted" });
      navigate("/signup", { replace: true });
    } catch (e) {
      // Re-read the consequences: a 409 means someone else's membership
      // changed since the dialog opened.
      const err = e as ApiError;
      setError(err?.message ?? "Could not delete your account");
      if (err?.status === 409) {
        void authApi.fetchDeletionPreview().then(setPreview).catch(() => {});
      }
      setPending(false);
    }
  };

  return (
    <main className={styles.page}>
      <PageHeader
        title="Account Settings"
        subtitle="Manage the account you sign in with."
      />

      <div className={styles.settingsStack}>
        <div className={styles.card}>
          <div className={styles.formField}>
            <span className={styles.formLabel}>Name</span>
            <Input value={user.name} readOnly disabled />
          </div>
          <div className={styles.formField} style={{ marginTop: "var(--space-4)" }}>
            <span className={styles.formLabel}>Email</span>
            <Input value={email} readOnly disabled />
          </div>
        </div>

        <DangerZone
          description="Permanently delete your account. Your name and email are removed, you lose access to every organization and project, and anything you were assigned to is unassigned. Comments you wrote stay on their cards, attributed to a deleted user."
          actionLabel="Delete my account"
          onAction={() => setOpen(true)}
        />
      </div>

      <Modal
        open={open}
        onClose={close}
        size="sm"
        title="Delete your account"
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={pending}
              disabled={!canSubmit}
              onClick={() => void submit()}
            >
              Delete forever
            </Button>
          </>
        }
      >
        {loadingPreview ? (
          <p style={{ marginTop: 0, display: "flex", gap: "0.5rem" }}>
            <Spinner size="sm" label="Checking your organizations" />
            Checking what this will affect…
          </p>
        ) : (
          <>
            {blocked && (
              <div className={styles.calloutDanger} role="alert">
                <p style={{ marginTop: 0 }}>
                  You are the only Owner of{" "}
                  {preview?.blockingOrgs.length === 1
                    ? "an organization that"
                    : "organizations that"}{" "}
                  other people still belong to. Promote another Owner, or delete{" "}
                  {preview?.blockingOrgs.length === 1 ? "it" : "them"}, first:
                </p>
                <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                  {preview?.blockingOrgs.map((o) => (
                    <li key={o.id}>
                      <a href={`/orgs/${o.id}/members`}>{o.name}</a> —{" "}
                      {o.memberCount} members
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!blocked && (preview?.orgsToDelete.length ?? 0) > 0 && (
              <div className={styles.calloutDanger}>
                <p style={{ margin: 0 }}>
                  Nobody else belongs to{" "}
                  {preview?.orgsToDelete.length === 1
                    ? "this organization"
                    : "these organizations"}
                  , so {preview?.orgsToDelete.length === 1 ? "it" : "they"} will
                  be deleted with your account, along with every project, board
                  and card inside:
                </p>
                <ul style={{ margin: "var(--space-2) 0 0", paddingLeft: "1.25rem" }}>
                  {preview?.orgsToDelete.map((o) => (
                    <li key={o.id}>{o.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <p style={{ marginTop: blocked ? "var(--space-4)" : 0 }}>
              This cannot be undone. Type <strong>{email}</strong> and your
              password to confirm.
            </p>

            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="confirm-email">
                Your email
              </label>
              <Input
                id="confirm-email"
                value={confirmEmail}
                placeholder={email}
                autoComplete="off"
                disabled={blocked}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />
            </div>

            <div className={styles.formField} style={{ marginTop: "var(--space-3)" }}>
              <label className={styles.formLabel} htmlFor="confirm-password">
                Your password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={password}
                autoComplete="current-password"
                disabled={blocked}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit) {
                    e.preventDefault();
                    void submit();
                  }
                }}
              />
            </div>

            {error && (
              <p className={styles.formError} role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </Modal>
    </main>
  );
}
