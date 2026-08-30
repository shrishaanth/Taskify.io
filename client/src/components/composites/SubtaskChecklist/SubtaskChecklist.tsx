import { useState } from "react";
import type { FormEvent } from "react";
import { cn } from "../../utils/cn";
import { ProgressBar } from "../../primitives/ProgressBar/ProgressBar";
import { Input } from "../../primitives/Input/Input";
import { SubtaskItem } from "../SubtaskItem/SubtaskItem";
import type { Subtask } from "../../../types/domain";
import styles from "./SubtaskChecklist.module.css";

export interface SubtaskChecklistProps {
  subtasks: Subtask[];
  onToggle: (id: string, done: boolean) => void;
  onAdd: (title: string) => void;
  onEditTitle?: (id: string, title: string) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  className?: string;
}

export function SubtaskChecklist({
  subtasks,
  onToggle,
  onAdd,
  onEditTitle,
  onDelete,
  canEdit = true,
  className,
}: SubtaskChecklistProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const total = subtasks.length;
  const done = subtasks.filter((s) => s.done).length;

  const submitNew = (e: FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onAdd(title);
    setDraft("");
    setAdding(false);
  };

  return (
    <section className={cn(styles.root, className)} aria-label="Subtasks checklist">
      <div className={styles.header}>
        <h3 className={styles.title}>Subtasks Checklist</h3>
        <span className={styles.progressText}>{done}/{total} completed</span>
      </div>

      <ProgressBar current={done} total={total} label="Subtask progress" />

      <div className={styles.list}>
        {subtasks.map((s) => (
          <SubtaskItem
            key={s.id}
            subtask={s}
            onToggle={(d) => onToggle(s.id, d)}
            {...(canEdit && onEditTitle
              ? { onEditTitle: (title: string) => onEditTitle(s.id, title) }
              : {})}
            {...(canEdit && onDelete ? { onDelete: () => onDelete(s.id) } : {})}
          />
        ))}
      </div>

      {canEdit &&
        (adding ? (
          <form className={styles.addRow} onSubmit={submitNew}>
            <Input
              autoFocus
              value={draft}
              placeholder="Subtask title"
              aria-label="New subtask title"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                if (!draft.trim()) setAdding(false);
              }}
            />
          </form>
        ) : (
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setAdding(true)}
          >
            + Add checklist subtask
          </button>
        ))}
    </section>
  );
}
