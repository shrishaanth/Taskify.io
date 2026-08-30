import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Divider } from "./Divider";

describe("Divider", () => {
  it("renders a separator, horizontal by default", () => {
    render(<Divider />);
    const sep = screen.getByRole("separator");
    expect(sep).toHaveAttribute("aria-orientation", "horizontal");
    expect(sep).toHaveAttribute("data-orientation", "horizontal");
  });

  it("supports a vertical orientation", () => {
    render(<Divider orientation="vertical" />);
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
  });

  it("forwards className", () => {
    render(<Divider className="my-rule" />);
    expect(screen.getByRole("separator").className).toContain("my-rule");
  });
});
