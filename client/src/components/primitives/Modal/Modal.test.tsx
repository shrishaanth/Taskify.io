import { useState } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

afterEach(() => {
  document.body.style.overflow = "";
});

function Harness({
  closeOnBackdrop,
  closeOnEsc,
}: {
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>open</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Project"
        {...(closeOnBackdrop !== undefined ? { closeOnBackdrop } : {})}
        {...(closeOnEsc !== undefined ? { closeOnEsc } : {})}
        footer={<button>Save</button>}
      >
        <input aria-label="field" />
      </Modal>
    </>
  );
}

describe("Modal", () => {
  it("renders nothing while closed", () => {
    render(<Modal open={false} onClose={() => {}} title="X">body</Modal>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("portals a labelled dialog when open", () => {
    render(<Modal open onClose={() => {}} title="Create Project">body</Modal>);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Create Project");
    // portalled to body, not nested in the React root container
    expect(dialog.closest("body")).toBe(document.body);
  });

  it("uses aria-label when there is no visible title", () => {
    render(
      <Modal open onClose={() => {}} aria-label="Confirm delete">
        body
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Confirm delete");
  });

  it("closes via the close button", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "open" }));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on backdrop click by default, but not on panel click", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "open" }));
    await userEvent.click(screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("modal-backdrop"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not close on backdrop when closeOnBackdrop is false", async () => {
    render(<Harness closeOnBackdrop={false} />);
    await userEvent.click(screen.getByRole("button", { name: "open" }));
    await userEvent.click(screen.getByTestId("modal-backdrop"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on Escape, unless disabled", async () => {
    const { rerender } = render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "open" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(<Harness closeOnEsc={false} />);
    await userEvent.click(screen.getByRole("button", { name: "open" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("locks body scroll while open and restores it on close", async () => {
    render(<Harness />);
    expect(document.body.style.overflow).toBe("");
    await userEvent.click(screen.getByRole("button", { name: "open" }));
    expect(document.body.style.overflow).toBe("hidden");
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(document.body.style.overflow).toBe("");
  });

  it("moves focus into the dialog on open and restores it on close", async () => {
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "open" });
    await userEvent.click(opener);
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(opener);
  });

  it("keeps Tab focus within the dialog", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "open" }));
    const dialog = screen.getByRole("dialog");
    const closeBtn = within(dialog).getByRole("button", { name: "Close" });
    const saveBtn = within(dialog).getByRole("button", { name: "Save" });

    saveBtn.focus();
    await userEvent.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);

    closeBtn.focus();
    await userEvent.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("renders footer content", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "open" }));
    expect(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Save" }),
    ).toBeInTheDocument();
  });

  it.each(["sm", "lg"] as const)("supports the %s size", (size) => {
    render(
      <Modal open onClose={() => {}} size={size} title="t">
        b
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("data-size", size);
  });
});
