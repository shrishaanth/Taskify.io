import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover } from "./Popover";

describe("Popover", () => {
  it("toggles content on trigger click and wires aria", async () => {
    render(
      <Popover label="Details" trigger={<button>open</button>}>
        <p>panel body</p>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "open" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Details" })).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("closes on outside click and on Escape", async () => {
    render(
      <div>
        <Popover label="D" trigger={<button>open</button>}>
          <p>body</p>
        </Popover>
        <button>outside</button>
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: "open" }));
    await userEvent.click(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "open" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports controlled mode", async () => {
    const onOpenChange = vi.fn();
    render(
      <Popover label="D" open={false} onOpenChange={onOpenChange} trigger={<button>open</button>}>
        <p>body</p>
      </Popover>,
    );
    await userEvent.click(screen.getByRole("button", { name: "open" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // still closed because parent didn't update the prop
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
