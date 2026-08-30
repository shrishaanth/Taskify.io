import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("renders with placeholder and rows", () => {
    render(<Textarea placeholder="Describe…" rows={5} aria-label="desc" />);
    const el = screen.getByPlaceholderText("Describe…");
    expect(el.tagName).toBe("TEXTAREA");
    expect(el).toHaveAttribute("rows", "5");
  });

  it("calls onChange and updates when controlled", async () => {
    const onChange = vi.fn();
    render(<Textarea aria-label="d" onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox"), "hi");
    expect(onChange).toHaveBeenCalled();
  });

  it("reflects the invalid state", () => {
    render(<Textarea aria-label="d" invalid />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("supports the sm size and disabled", () => {
    render(<Textarea aria-label="d" size="sm" disabled />);
    const el = screen.getByRole("textbox");
    expect(el).toHaveAttribute("data-size", "sm");
    expect(el).toBeDisabled();
  });
});
