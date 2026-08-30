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

export function LoginPage() {
  const navigate = useNavigate();
  const bootstrap = useSession((s) => s.bootstrap);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await authApi.login({ email, password });
      await bootstrap();
      navigate("/");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Invalid email or password."
          : "Something went wrong. Please try again.",
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
        <p className={styles.authSubtitle}>Welcome back to your workspace!</p>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="login-email">
            Email Address
          </label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="login-password">
            Password
          </label>
          <Input
            id="login-password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={Boolean(error)}
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
          Log in
        </Button>

        <p className={styles.authFooter}>
          New to Taskify? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
