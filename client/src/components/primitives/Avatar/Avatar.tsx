import { useState } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { initialsFromName, toneFromName } from "./avatarUtils";
import styles from "./Avatar.module.css";

export type AvatarSize = "xs" | "sm" | "md" | "lg";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Used for the alt text, initials fallback and the deterministic colour. */
  name: string;
  src?: string;
  size?: AvatarSize;
  showStatus?: boolean;
  status?: "online" | "offline";
}

export function Avatar({
  name,
  src,
  size = "md",
  showStatus = false,
  status = "offline",
  className,
  ...rest
}: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(src) && !imgFailed;

  return (
    <span
      className={cn(styles.root, className)}
      data-size={size}
      data-testid="avatar"
      {...rest}
    >
      {showImage ? (
        <img
          className={styles.image}
          src={src}
          alt={name}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span
          className={styles.initials}
          data-tone={toneFromName(name)}
          data-testid="avatar-initials"
          role="img"
          aria-label={name}
        >
          {initialsFromName(name)}
        </span>
      )}
      {showStatus && (
        <span
          className={styles.status}
          data-status={status}
          data-testid="avatar-status"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
