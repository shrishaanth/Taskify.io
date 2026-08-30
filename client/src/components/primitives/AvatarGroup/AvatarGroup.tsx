import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { Avatar, type AvatarSize } from "../Avatar/Avatar";
import styles from "./AvatarGroup.module.css";

export interface AvatarGroupItem {
  name: string;
  src?: string;
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  avatars: AvatarGroupItem[];
  max?: number;
  size?: AvatarSize;
  /** When provided, renders a trailing "+" button. */
  onAdd?: () => void;
  addLabel?: string;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = "sm",
  onAdd,
  addLabel = "Add member",
  className,
  ...rest
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - visible.length;

  return (
    <div className={cn(styles.root, className)} data-size={size} {...rest}>
      {visible.map((a, i) => (
        <Avatar
          key={`${a.name}-${i}`}
          className={styles.item}
          name={a.name}
          {...(a.src ? { src: a.src } : null)}
          size={size}
        />
      ))}
      {overflow > 0 && (
        <span className={styles.overflow} data-size={size} data-testid="avatar-overflow">
          +{overflow}
        </span>
      )}
      {onAdd && (
        <button
          type="button"
          className={styles.add}
          data-size={size}
          aria-label={addLabel}
          onClick={onAdd}
        >
          <span aria-hidden="true">+</span>
        </button>
      )}
    </div>
  );
}
