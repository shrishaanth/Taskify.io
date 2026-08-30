import { forwardRef, useId, useImperativeHandle, useState } from "react";
import type { FormEvent } from "react";
import { cn } from "../../utils/cn";
import { Input } from "../../primitives/Input/Input";
import { Select } from "../../primitives/Select/Select";
import { Button } from "../../primitives/Button/Button";
import styles from "./InviteForm.module.css";

export interface InviteFormValues {
  email: string;
  role: string;
}

export interface InviteFormHandle {
  /** Validate + submit programmatically (used by an external footer button). */
  submit: () => void;
}

export interface InviteFormProps {
  scope: "org" | "project";
  onSubmit: (values: InviteFormValues) => void;
  pending?: boolean;
  /** Hide the built-in submit button (an external footer button drives it). */
  hideSubmit?: boolean;
  className?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 4.5l5 4 5-4" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ORG_ROLES = [
  { label: "Admin", value: "admin" },
  { label: "Member", value: "member" },
];
const PROJECT_ROLES = [
  { label: "Head (Full project control)", value: "head" },
  { label: "Member (Can view & edit)", value: "member" },
];

export const InviteForm = forwardRef<InviteFormHandle, InviteFormProps>(
  function InviteForm(
    { scope, onSubmit, pending = false, hideSubmit = false, className },
    ref,
  ) {
    const emailId = useId();
    const roleId = useId();
    const isProject = scope === "project";
    const roles = isProject ? PROJECT_ROLES : ORG_ROLES;

    const [email, setEmail] = useState("");
    const [role, setRole] = useState("member");
    const [touched, setTouched] = useState(false);

    const invalidEmail = email.length > 0 && !EMAIL_RE.test(email);
    const canSubmit = EMAIL_RE.test(email) && !pending;

    const doSubmit = () => {
      setTouched(true);
      if (!EMAIL_RE.test(email)) return;
      onSubmit({ email: email.trim(), role });
    };

    useImperativeHandle(ref, () => ({ submit: doSubmit }));

    const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      doSubmit();
    };

    return (
      <form className={cn(styles.root, className)} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={emailId}>
            {isProject ? "Search by Email Address" : "Email Address"}
          </label>
          <Input
            id={emailId}
            type="email"
            value={email}
            placeholder={isProject ? "colleague@acme.com" : "Enter email address"}
            leadingIcon={<MailIcon />}
            invalid={touched && (invalidEmail || email.length === 0)}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
          />
          {touched && invalidEmail && (
            <span className={styles.error}>Enter a valid email address.</span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={roleId}>
            {isProject ? "Assign Project Role" : "Org Role"}
          </label>
          <Select
            id={roleId}
            value={role}
            options={roles}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>

        {!hideSubmit && (
          <Button
            type="submit"
            fullWidth={isProject}
            loading={pending}
            disabled={!canSubmit}
          >
            Send Invite
          </Button>
        )}
      </form>
    );
  },
);
