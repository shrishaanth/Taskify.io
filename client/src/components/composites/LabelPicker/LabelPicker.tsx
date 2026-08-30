import { useState } from "react";
import type { KeyboardEvent } from "react";
import { cn } from "../../utils/cn";
import { Chip, AddChip } from "../../primitives/Chip/Chip";
import { labelToneFor } from "../../../lib/labelColor";
import styles from "./LabelPicker.module.css";

export interface LabelPickerProps {
  labels: string[];
  onChange: (labels: string[]) => void;
  canEdit?: boolean;
  className?: string;
}

export function LabelPicker({
  labels,
  onChange,
  canEdit = true,
  className,
}: LabelPickerProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (value && !labels.includes(value)) onChange([...labels, value]);
    setDraft("");
    setAdding(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    } else if (e.key === "Escape") {
      setDraft("");
      setAdding(false);
    }
  };

  return (
    <div className={cn(styles.root, className)}>
      {labels.map((label) => (
        <Chip
          key={label}
          tone={labelToneFor(label)}
          size="sm"
          removable={canEdit}
          onRemove={() => onChange(labels.filter((l) => l !== label))}
        >
          {label}
        </Chip>
      ))}
      {canEdit &&
        (adding ? (
          <input
            className={styles.input}
            autoFocus
            value={draft}
            placeholder="New label"
            aria-label="New label"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={add}
            onKeyDown={onKeyDown}
          />
        ) : (
          <AddChip aria-label="Add label" onClick={() => setAdding(true)} />
        ))}
    </div>
  );
}
