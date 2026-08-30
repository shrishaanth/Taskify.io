import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../components/primitives/Input/Input";
import { Button } from "../components/primitives/Button/Button";
import { IconButton } from "../components/primitives/IconButton/IconButton";
import * as authApi from "../api/auth";
import { ApiError } from "../api/http";
import { useSession } from "../stores/sessionStore";
import styles from "./pages.module.css";

export function SignupPage() {
  const navigate = useNavigate();
  const bootstrap = useSession((s) => s.bootstrap);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      // UC-1: creates an account only — no Organization.
      await authApi.signup({ name, email, password });
      await bootstrap();
      navigate("/welcome");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? "An account with that email already exists."
          : "Could not create your account. Check the form and try again.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={styles.authScreen}>
      <form className={styles.authCard} onSubmit={submit}>
        <div className={styles.brandRow}>
          <span className={styles.brandLogo} aria-hidden="true">
            ✓
          </span>
          Taskify
        </div>
        <p className={styles.authSubtitle}>Create your free account</p>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="signup-name">
            Your Name
          </label>
          <Input
            id="signup-name"
            placeholder="Alex Rivera"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="signup-email">
            Email Address
          </label>
          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="signup-password">
            Password
          </label>
          <Input
            id="signup-password"
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
                icon={<span aria-hidden="true">{show ? "🙈" : "👁"}</span>}
              />
            }
          />
          {error && <span className={styles.formError}>{error}</span>}
        </div>

        <Button type="submit" fullWidth loading={pending}>
          Create account
        </Button>

        <p className={styles.authFooter}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
