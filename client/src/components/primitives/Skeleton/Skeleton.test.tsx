import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("renders a single hidden bar by default", () => {
    const { container } = render(<Skeleton />);
    const bars = container.querySelectorAll("span[aria-hidden='true']");
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveAttribute("data-variant", "line");
  });

  it.each(["line", "block", "circle"] as const)(
    "renders the %s variant",
    (variant) => {
      const { container } = render(<Skeleton variant={variant} />);
      expect(container.firstChild).toHaveAttribute("data-variant", variant);
    },
  );

  it("renders `count` bars inside a group", () => {
    render(<Skeleton count={4} />);
    const group = screen.getByTestId("skeleton-group");
    expect(group.querySelectorAll("span[data-variant]")).toHaveLength(4);
  });

  it("applies numeric width/height as pixels and string values verbatim", () => {
    const { container } = render(<Skeleton width={120} height="2rem" radius="4px" />);
    expect(container.firstChild).toHaveStyle({
      width: "120px",
      height: "2rem",
      borderRadius: "4px",
    });
  });

  it("is hidden from the accessibility tree", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
