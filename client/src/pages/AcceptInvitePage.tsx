import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Input } from "../components/primitives/Input/Input";
import { Button } from "../components/primitives/Button/Button";
import { IconButton } from "../components/primitives/IconButton/IconButton";
import { Spinner } from "../components/primitives/Spinner/Spinner";
import * as orgsApi from "../api/orgs";
import { ApiError } from "../api/http";
import { useSession } from "../stores/sessionStore";
import styles from "./pages.module.css";

type Phase = "working" | "needAccount" | "error";

/**
 * UC-2 — accept an organization invite. Reached at `/invite/:token`, outside the
 * authenticated shell. If the visitor is already signed in the invite is
 * accepted straight away; otherwise they create an account in one step (UC-2 3a).
 */
export function AcceptInvitePage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const status = useSession((s) => s.status);
  const bootstrap = useSession((s) => s.bootstrap);
  const refresh = useSession((s) => s.refresh);
  const signOut = useSession((s) => s.signOut);

  const [phase, setPhase] = useState<Phase>("working");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const attempted = useRef(false);

  const messageFor = (err: unknown): string => {
    if (err instanceof ApiError) {
      if (err.status === 404)
        return "This invite link is invalid or has already been used.";
      if (err.status === 409)
        return "You already have a Taskify account. Log in first, then open this link again.";
      if (err.status === 403)
        return "This invite was sent to a different email address. Sign out and sign back in with the invited address.";
    }
    return "Something went wrong accepting this invite. Please try again.";
  };

  const finish = async (organizationId: string) => {
    await refresh();
    navigate(`/orgs/${organizationId}/projects`, { replace: true });
  };

  // Auto-accept for an already-authenticated visitor.
  useEffect(() => {
    if (attempted.current) return;
    if (status === "loading") return;
    if (status === "anonymous") {
      setPhase("needAccount");
      return;
    }
    attempted.current = true;
    void (async () => {
      try {
        const res = await orgsApi.acceptInvite(token);
        await finish(res.organizationId);
      } catch (err) {
        setError(messageFor(err));
        setPhase("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token]);

  const createAndAccept = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await orgsApi.acceptInvite(token, { name, password });
      await bootstrap();
      await finish(res.organizationId);
    } catch (err) {
      setError(messageFor(err));
      setPending(false);
    }
  };

  return (
    <div className={styles.authScreen}>
      <div className={styles.authCard}>
        <div className={styles.brandRow}>
          <span className={styles.brandLogo} aria-hidden="true">
            ✓
          </span>
          Taskify
        </div>

        {phase === "working" && (
          <>
            <p className={styles.authSubtitle}>Accepting your invite…</p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Spinner size="lg" label="Accepting invite" />
            </div>
          </>
        )}

        {phase === "error" && (
          <>
            <p className={styles.authSubtitle}>Invite couldn&apos;t be accepted</p>
            <p className={styles.formError}>{error}</p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <Button onClick={() => navigate("/login")}>Go to log in</Button>
              {status === "authenticated" && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    void signOut().then(() => navigate("/login"));
                  }}
                >
                  Sign out
                </Button>
              )}
            </div>
          </>
        )}

        {phase === "needAccount" && (
          <form onSubmit={createAndAccept}>
            <p className={styles.authSubtitle}>
              You&apos;ve been invited to a Taskify organization. Set up your
              account to join.
            </p>

            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="invite-name">
                Your Name
              </label>
              <Input
                id="invite-name"
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="invite-password">
                Password
              </label>
              <Input
                id="invite-password"
                type={show ? "text" : "password"}
                placeholder="Create a strong password"
                invalid={Boolean(error)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                trailingSlot={
                  <IconButton
                    label={show ? "Hide password" : "Show password"}
                    size="sm"
                    onClick={() => setShow((v) => !v)}
                    icon={
                      <span aria-hidden="true">{show ? "🙈" : "👁"}</span>
                    }
                  />
                }
              />
              {error && <span className={styles.formError}>{error}</span>}
            </div>

            <Button type="submit" fullWidth loading={pending}>
              Join organization
            </Button>

            <p className={styles.authFooter}>
              Already have an account? <Link to="/login">Log in</Link> first, then
              open the invite link again.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
