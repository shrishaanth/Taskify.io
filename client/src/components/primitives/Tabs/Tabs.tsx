import { useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Tabs.module.css";

export interface TabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  "aria-label"?: string;
  className?: string;
}

export function Tabs({
  tabs,
  activeId,
  onChange,
  "aria-label": ariaLabel,
  className,
}: TabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const move = (dir: 1 | -1, fromId: string) => {
    const enabled = tabs.filter((t) => !t.disabled);
    if (enabled.length === 0) return;
    const idx = enabled.findIndex((t) => t.id === fromId);
    const next = enabled[(idx + dir + enabled.length) % enabled.length];
    onChange(next.id);
    refs.current[next.id]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      move(1, id);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      move(-1, id);
    }
  };

  return (
    <div
      role="tablist"
      {...(ariaLabel ? { "aria-label": ariaLabel } : null)}
      className={cn(styles.root, className)}
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[tab.id] = node;
            }}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={tab.disabled ?? false}
            className={styles.tab}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, tab.id)}
          >
            {tab.icon && (
              <span className={styles.icon} aria-hidden="true">
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
