import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../components/primitives/Input/Input";
import { Button } from "../components/primitives/Button/Button";
import { IconButton } from "../components/primitives/IconButton/IconButton";
import { useSession } from "../stores/sessionStore";
import { useMockData } from "../stores/mockDataStore";
import styles from "./pages.module.css";

export function LoginPage() {
  const navigate = useNavigate();
  const signIn = useSession((s) => s.signIn);
  const orgs = useMockData((s) => s.orgs);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    signIn();
    navigate(orgs[0] ? `/orgs/${orgs[0].id}/projects` : "/welcome");
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
            trailingSlot={
              <IconButton
                label={show ? "Hide password" : "Show password"}
                size="sm"
                onClick={() => setShow((v) => !v)}
                icon={<span aria-hidden="true">{show ? "🙈" : "👁"}</span>}
              />
            }
          />
        </div>

        <Button type="submit" fullWidth>
          Log in
        </Button>

        <p className={styles.authFooter}>
          New to Taskify? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
