import { useEffect, useState } from "react";
import { Modal } from "../../primitives/Modal/Modal";
import { Button } from "../../primitives/Button/Button";
import { Select } from "../../primitives/Select/Select";
import type { Column } from "../../../types/domain";

export type ColumnRemoval =
  | { kind: "empty" }
  | { kind: "move"; toColumnId: string }
  | { kind: "delete" };

export interface DeleteColumnDialogProps {
  open: boolean;
  column: Column | null;
  cardCount: number;
  /** The columns that will remain, i.e. where the cards could go. */
  otherColumns: Column[];
  pending?: boolean;
  onConfirm: (removal: ColumnRemoval) => void;
  onCancel: () => void;
}

/**
 * Removing a column that still holds cards has to say what happens to them.
 * Moving is the default; deleting them is a separate, explicitly red choice.
 */
export function DeleteColumnDialog({
  open,
  column,
  cardCount,
  otherColumns,
  pending = false,
  onConfirm,
  onCancel,
}: DeleteColumnDialogProps) {
  const [target, setTarget] = useState("");
  useEffect(() => {
    if (open) setTarget(otherColumns[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, column?.id]);

  const name = column?.name ?? "";
  const cards = cardCount === 1 ? "1 card" : `${cardCount} cards`;
  const canMove = otherColumns.length > 0;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      title={`Delete "${name}"?`}
      footer={
        cardCount === 0 ? (
          <>
            <Button variant="secondary" onClick={onCancel} data-autofocus="true">
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={pending}
              onClick={() => onConfirm({ kind: "empty" })}
            >
              Delete column
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={pending}
              onClick={() => onConfirm({ kind: "delete" })}
            >
              Delete {cards} too
            </Button>
            {canMove && (
              <Button
                loading={pending}
                disabled={!target}
                onClick={() => onConfirm({ kind: "move", toColumnId: target })}
              >
                Move cards and delete
              </Button>
            )}
          </>
        )
      }
    >
      {cardCount === 0 ? (
        <p style={{ margin: 0 }}>This column is empty. Deleting it cannot be undone.</p>
      ) : (
        <>
          <p style={{ marginTop: 0 }}>
            This column holds <strong>{cards}</strong>.{" "}
            {canMove
              ? "Choose where they should go, or delete them with the column."
              : "There is no other column to move them to."}
          </p>
          {canMove && (
            <Select
              aria-label="Move cards to"
              value={target}
              options={otherColumns.map((c) => ({ label: c.name, value: c.id }))}
              onChange={(e) => setTarget(e.target.value)}
            />
          )}
        </>
      )}
    </Modal>
  );
}
