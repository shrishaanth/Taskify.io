import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../../primitives/Modal/Modal";
import { Input } from "../../primitives/Input/Input";
import { Textarea } from "../../primitives/Textarea/Textarea";
import { Button } from "../../primitives/Button/Button";

export interface EditDetailsValues {
  name: string;
  description?: string;
}

export interface EditDetailsDialogProps {
  open: boolean;
  /** e.g. "Rename board" or "Edit project". */
  title: string;
  nameLabel: string;
  initialName: string;
  /** Pass a string (even empty) to show a description field as well. */
  initialDescription?: string;
  confirmLabel?: string;
  pending?: boolean;
  onSubmit: (values: EditDetailsValues) => void;
  onCancel: () => void;
}

/** One dialog for renaming a board and for editing a project's name and description. */
export function EditDetailsDialog({
  open,
  title,
  nameLabel,
  initialName,
  initialDescription,
  confirmLabel = "Save",
  pending = false,
  onSubmit,
  onCancel,
}: EditDetailsDialogProps) {
  const nameId = useId();
  const descId = useId();
  const withDescription = initialDescription !== undefined;
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");

  // Start from the current values each time it opens, not from a stale draft.
  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setDescription(initialDescription ?? "");
  }, [open, initialName, initialDescription]);

  const trimmed = name.trim();
  const changed =
    trimmed !== initialName ||
    (withDescription && description.trim() !== (initialDescription ?? ""));
  const canSubmit = trimmed.length > 0 && changed && !pending;

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      name: trimmed,
      ...(withDescription ? { description: description.trim() } : {}),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button loading={pending} disabled={!canSubmit} onClick={() => submit()}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} style={{ display: "grid", gap: "var(--space-3)" }}>
        <div style={{ display: "grid", gap: "var(--space-1-5)" }}>
          <label htmlFor={nameId} style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>
            {nameLabel}
          </label>
          <Input
            id={nameId}
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        {withDescription && (
          <div style={{ display: "grid", gap: "var(--space-1-5)" }}>
            <label htmlFor={descId} style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>
              Description
            </label>
            <Textarea
              id={descId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
