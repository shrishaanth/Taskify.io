import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";
import { useConfirm } from "./useConfirm";
import { Modal } from "../../primitives/Modal/Modal";

describe("ConfirmDialog", () => {
  it("puts focus on Cancel, so Enter cannot confirm by accident", () => {
    render(
      <ConfirmDialog open title="Delete it?" onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("reports confirm and cancel", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete it?"
        confirmLabel="Delete card"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete card" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("useConfirm", () => {
  function Harness({ onResult }: { onResult: (ok: boolean) => void }) {
    const { confirm, dialog } = useConfirm();
    return (
      <>
        <button
          type="button"
          onClick={() => void confirm({ title: "Sure?", confirmLabel: "Yes" }).then(onResult)}
        >
          ask
        </button>
        {dialog}
      </>
    );
  }

  it("resolves true on confirm and false on cancel", async () => {
    const onResult = vi.fn();
    render(<Harness onResult={onResult} />);

    await userEvent.click(screen.getByRole("button", { name: "ask" }));
    await userEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(onResult).toHaveBeenLastCalledWith(true);

    await userEvent.click(screen.getByRole("button", { name: "ask" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onResult).toHaveBeenLastCalledWith(false);
  });
});

describe("stacked dialogs", () => {
  it("Escape closes only the top dialog", async () => {
    const closeOuter = vi.fn();
    const closeInner = vi.fn();
    render(
      <>
        <Modal open onClose={closeOuter} title="Outer">
          outer
        </Modal>
        <ConfirmDialog open title="Inner" onConfirm={() => {}} onCancel={closeInner} />
      </>,
    );
    await userEvent.keyboard("{Escape}");
    expect(closeInner).toHaveBeenCalledTimes(1);
    expect(closeOuter).not.toHaveBeenCalled();
  });
});
