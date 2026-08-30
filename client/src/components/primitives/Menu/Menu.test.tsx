import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Menu, type MenuItem } from "./Menu";

const makeItems = (spies: Record<string, () => void>): MenuItem[] => [
  { id: "rename", label: "Rename", onSelect: spies.rename },
  { id: "reorder", label: "Reorder", onSelect: spies.reorder, disabled: true },
  { id: "delete", label: "Delete", onSelect: spies.delete, tone: "danger" },
];

describe("Menu", () => {
  it("is closed until the trigger is clicked", async () => {
    const spies = { rename: vi.fn(), reorder: vi.fn(), delete: vi.fn() };
    render(<Menu trigger={<button>Actions</button>} items={makeItems(spies)} />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("selects an item, calls its handler and closes", async () => {
    const spies = { rename: vi.fn(), reorder: vi.fn(), delete: vi.fn() };
    render(<Menu trigger={<button>Actions</button>} items={makeItems(spies)} />);
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
    expect(spies.rename).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not fire a disabled item", async () => {
    const spies = { rename: vi.fn(), reorder: vi.fn(), delete: vi.fn() };
    render(<Menu trigger={<button>Actions</button>} items={makeItems(spies)} />);
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    const disabled = screen.getByRole("menuitem", { name: "Reorder" });
    expect(disabled).toBeDisabled();
    await userEvent.click(disabled);
    expect(spies.reorder).not.toHaveBeenCalled();
  });

  it("closes on outside click", async () => {
    const spies = { rename: vi.fn(), reorder: vi.fn(), delete: vi.fn() };
    render(
      <div>
        <Menu trigger={<button>Actions</button>} items={makeItems(spies)} />
        <button>outside</button>
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const spies = { rename: vi.fn(), reorder: vi.fn(), delete: vi.fn() };
    render(<Menu trigger={<button>Actions</button>} items={makeItems(spies)} />);
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("moves the active item with ArrowDown, skipping disabled entries", async () => {
    const spies = { rename: vi.fn(), reorder: vi.fn(), delete: vi.fn() };
    render(<Menu trigger={<button>Actions</button>} items={makeItems(spies)} />);
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    // opens focused on "Rename"; ArrowDown should skip disabled "Reorder" -> "Delete"
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
  });

  it("supports controlled open state", async () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <span data-testid="state">{open ? "open" : "closed"}</span>
          <Menu
            open={open}
            onOpenChange={setOpen}
            trigger={<button>Actions</button>}
            items={[{ id: "a", label: "A", onSelect: () => {} }]}
          />
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByTestId("state")).toHaveTextContent("open");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("applies the placement data attribute", async () => {
    render(
      <Menu
        placement="bottom-end"
        trigger={<button>Actions</button>}
        items={[{ id: "a", label: "A", onSelect: () => {} }]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menu")).toHaveAttribute("data-placement", "bottom-end");
  });
});
