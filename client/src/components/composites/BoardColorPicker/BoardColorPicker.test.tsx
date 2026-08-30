import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardColorPicker } from "./BoardColorPicker";
import type { BoardColorKey } from "../../../styles/tokens";

function Harness({ initial = "sky" as BoardColorKey }) {
  const [value, setValue] = useState<BoardColorKey>(initial);
  return <BoardColorPicker value={value} onChange={setValue} />;
}

describe("BoardColorPicker", () => {
  it("renders a radiogroup with the six board colours", () => {
    render(<Harness />);
    expect(screen.getByRole("radiogroup", { name: "Board background color" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(6);
  });

  it("marks the current value as checked with roving tabindex", () => {
    render(<Harness initial="green" />);
    const green = screen.getByRole("radio", { name: "Green" });
    expect(green).toHaveAttribute("aria-checked", "true");
    expect(green).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "Pink" })).toHaveAttribute("tabindex", "-1");
  });

  it("selects a colour on click", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("radio", { name: "Amber" }));
    expect(screen.getByRole("radio", { name: "Amber" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("moves the selection with arrow keys and wraps", async () => {
    const onChange = vi.fn();
    render(<BoardColorPicker value="pink" onChange={onChange} />);
    screen.getByRole("radio", { name: "Pink" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("green");
  });
});
