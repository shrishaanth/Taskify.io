import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("uses `label` as the accessible name and hides the icon", () => {
    render(<IconButton label="Close" icon={<svg data-testid="x" />} />);
    const btn = screen.getByRole("button", { name: "Close" });
    expect(btn).toHaveAttribute("type", "button");
    expect(screen.getByTestId("x")).toBeInTheDocument();
  });

  it.each(["ghost", "circle"] as const)("renders the %s variant", (variant) => {
    render(<IconButton label="m" variant={variant} icon={<svg />} />);
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", variant);
  });

  it.each(["sm", "md"] as const)("renders the %s size", (size) => {
    render(<IconButton label="m" size={size} icon={<svg />} />);
    expect(screen.getByRole("button")).toHaveAttribute("data-size", size);
  });

  it("fires onClick", async () => {
    const onClick = vi.fn();
    render(<IconButton label="Bell" icon={<svg />} onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", async () => {
    const onClick = vi.fn();
    render(<IconButton label="Bell" icon={<svg />} disabled onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards a ref", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<IconButton ref={ref} label="m" icon={<svg />} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
