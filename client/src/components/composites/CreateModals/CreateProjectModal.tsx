import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../../primitives/Modal/Modal";
import { Input } from "../../primitives/Input/Input";
import { Textarea } from "../../primitives/Textarea/Textarea";
import { Button } from "../../primitives/Button/Button";
import styles from "./dialogs.module.css";

export interface CreateProjectValues {
  name: string;
  description?: string;
}

export interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (values: CreateProjectValues) => void;
  pending?: boolean;
}

export function CreateProjectModal({
  open,
  onClose,
  onCreate,
  pending = false,
}: CreateProjectModalProps) {
  const nameId = useId();
  const descId = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const canSubmit = name.trim().length > 0 && !pending;

  const doCreate = () => {
    if (!canSubmit) return;
    const trimmed = description.trim();
    onCreate({
      name: name.trim(),
      ...(trimmed ? { description: trimmed } : {}),
    });
  };
  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    doCreate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Create Project"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={doCreate} loading={pending} disabled={!canSubmit}>
            Create
          </Button>
        </>
      }
    >
      <form onSubmit={onFormSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={nameId}>
            Project Name
          </label>
          <Input
            id={nameId}
            autoFocus
            value={name}
            placeholder="e.g. Mobile App Redesign"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={descId}>
            Project Description (Optional)
          </label>
          <Textarea
            id={descId}
            value={description}
            placeholder="Describe the primary objectives of this workspace board…"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
