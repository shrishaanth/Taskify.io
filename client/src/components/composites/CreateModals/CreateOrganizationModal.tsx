import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../../primitives/Modal/Modal";
import { Input } from "../../primitives/Input/Input";
import { Button } from "../../primitives/Button/Button";
import styles from "./dialogs.module.css";

export interface CreateOrganizationModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  pending?: boolean;
}

export function CreateOrganizationModal({
  open,
  onClose,
  onCreate,
  pending = false,
}: CreateOrganizationModalProps) {
  const fieldId = useId();
  const [name, setName] = useState("");
  const canSubmit = name.trim().length > 0 && !pending;

  const doCreate = () => {
    if (canSubmit) onCreate(name.trim());
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
      title="Create Organization"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={doCreate} loading={pending} disabled={!canSubmit}>
            Create Workspace
          </Button>
        </>
      }
    >
      <p className={styles.body}>
        Organizations let you manage projects, invite co-workers, and share
        custom status labels across multiple team boards.
      </p>
      <form onSubmit={onFormSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={fieldId}>
            Organization Name
          </label>
          <Input
            id={fieldId}
            autoFocus
            value={name}
            placeholder="e.g. Acme Design Studio"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
