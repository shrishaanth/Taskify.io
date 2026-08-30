import { createRef, useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("toggles when used uncontrolled", async () => {
    render(<Checkbox aria-label="done" />);
    const box = screen.getByRole("checkbox");
    expect(box).not.toBeChecked();
    await userEvent.click(box);
    expect(box).toBeChecked();
  });

  it("respects a controlled `checked` prop and fires onChange", async () => {
    const onChange = vi.fn();
    function Wrapper() {
      const [checked, setChecked] = useState(false);
      return (
        <Checkbox
          aria-label="c"
          checked={checked}
          onChange={(e) => {
            onChange(e.target.checked);
            setChecked(e.target.checked);
          }}
        />
      );
    }
    render(<Wrapper />);
    const box = screen.getByRole("checkbox");
    await userEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(box).toBeChecked();
  });

  it("associates a clickable label", async () => {
    render(<Checkbox label="Confirm copy" />);
    await userEvent.click(screen.getByText("Confirm copy"));
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("does not toggle when disabled", async () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="d" disabled onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("sets the indeterminate DOM property and aria-checked=mixed", () => {
    render(<Checkbox aria-label="i" indeterminate />);
    const box = screen.getByRole("checkbox") as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
    expect(box).toHaveAttribute("aria-checked", "mixed");
  });

  it("supports the sm size", () => {
    render(<Checkbox aria-label="s" size="sm" />);
    expect(
      screen.getByRole("checkbox").nextElementSibling,
    ).toHaveAttribute("data-size", "sm");
  });

  it("forwards a ref to the input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox ref={ref} aria-label="r" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
