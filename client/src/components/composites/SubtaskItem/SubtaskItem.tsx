import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Checkbox } from "../../primitives/Checkbox/Checkbox";
import { Avatar } from "../../primitives/Avatar/Avatar";
import type { Subtask } from "../../../types/domain";
import styles from "../SubtaskChecklist/SubtaskChecklist.module.css";

export interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (done: boolean) => void;
  onEditTitle?: (title: string) => void;
  onDelete?: () => void;
}

export function SubtaskItem({
  subtask,
  onToggle,
  onEditTitle,
  onDelete,
}: SubtaskItemProps) {
  const [draft, setDraft] = useState(subtask.title);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== subtask.title) onEditTitle?.(next);
    else setDraft(subtask.title);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setDraft(subtask.title);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className={styles.item} data-done={subtask.done ? "true" : "false"}>
      <Checkbox
        size="sm"
        checked={subtask.done}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={subtask.title}
      />
      {onEditTitle ? (
        <input
          className={styles.itemTitle}
          value={draft}
          aria-label={`Edit: ${subtask.title}`}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
        />
      ) : (
        <span className={styles.itemTitle}>{subtask.title}</span>
      )}
      {subtask.assignee && (
        <Avatar name={subtask.assignee.name} size="xs" />
      )}
      {onDelete && (
        <button
          type="button"
          className={styles.remove}
          aria-label={`Delete subtask: ${subtask.title}`}
          onClick={onDelete}
        >
          ×
        </button>
      )}
    </div>
  );
}
