import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../../primitives/Modal/Modal";
import { Input } from "../../primitives/Input/Input";
import { Button } from "../../primitives/Button/Button";
import { BoardColorPicker } from "../BoardColorPicker/BoardColorPicker";
import type { BoardColorKey } from "../../../styles/tokens";
import styles from "./dialogs.module.css";

export interface CreateBoardValues {
  name: string;
  colorKey: BoardColorKey;
}

export interface CreateBoardModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (values: CreateBoardValues) => void;
  pending?: boolean;
}

export function CreateBoardModal({
  open,
  onClose,
  onCreate,
  pending = false,
}: CreateBoardModalProps) {
  const nameId = useId();
  const [name, setName] = useState("");
  const [colorKey, setColorKey] = useState<BoardColorKey>("sky");
  const canSubmit = name.trim().length > 0 && !pending;

  const doCreate = () => {
    if (canSubmit) onCreate({ name: name.trim(), colorKey });
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
      title="Create Board"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={doCreate} loading={pending} disabled={!canSubmit}>
            Create Board
          </Button>
        </>
      }
    >
      <form onSubmit={onFormSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={nameId}>
            Board Name
          </label>
          <Input
            id={nameId}
            autoFocus
            value={name}
            placeholder="e.g. Content Strategy"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Board Background Color</span>
          <BoardColorPicker value={colorKey} onChange={setColorKey} />
        </div>
      </form>
    </Modal>
  );
}
