import { useState } from "react";
import type { FormEvent } from "react";
import { Avatar } from "../../primitives/Avatar/Avatar";
import { Input } from "../../primitives/Input/Input";
import { Button } from "../../primitives/Button/Button";
import type { UserRef } from "../../../types/domain";
import styles from "../CommentList/CommentList.module.css";

export interface CommentComposerProps {
  currentUser: UserRef;
  onSubmit: (body: string) => void;
  pending?: boolean;
}

export function CommentComposer({
  currentUser,
  onSubmit,
  pending = false,
}: CommentComposerProps) {
  const [body, setBody] = useState("");
  const canSubmit = body.trim().length > 0 && !pending;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(body.trim());
    setBody("");
  };

  return (
    <form className={styles.composer} onSubmit={submit}>
      <Avatar
        name={currentUser.name}
        {...(currentUser.avatarUrl ? { src: currentUser.avatarUrl } : {})}
        size="sm"
      />
      <div className={styles.composerMain}>
        <Input
          value={body}
          placeholder="Write a comment or ask for feedback…"
          aria-label="Write a comment"
          onChange={(e) => setBody(e.target.value)}
        />
        <Button type="submit" size="sm" loading={pending} disabled={!canSubmit}>
          Comment
        </Button>
      </div>
    </form>
  );
}
