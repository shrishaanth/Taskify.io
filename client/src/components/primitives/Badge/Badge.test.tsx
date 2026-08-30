import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, type BadgeTone } from "./Badge";

const TONES: BadgeTone[] = [
  "sky",
  "slate",
  "red",
  "amber",
  "green",
  "violet",
  "purple",
  "rose",
  "pink",
];

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Head</Badge>);
    expect(screen.getByText("Head")).toBeInTheDocument();
  });

  it("defaults to slate tone + soft variant + md size", () => {
    render(<Badge>x</Badge>);
    const el = screen.getByText("x");
    expect(el).toHaveAttribute("data-tone", "slate");
    expect(el).toHaveAttribute("data-variant", "soft");
    expect(el).toHaveAttribute("data-size", "md");
  });

  it.each(TONES)("supports the %s tone", (tone) => {
    render(<Badge tone={tone}>{tone}</Badge>);
    expect(screen.getByText(tone)).toHaveAttribute("data-tone", tone);
  });

  it.each(["soft", "solid", "outline"] as const)(
    "supports the %s variant",
    (variant) => {
      render(<Badge variant={variant}>v</Badge>);
      expect(screen.getByText("v")).toHaveAttribute("data-variant", variant);
    },
  );

  it("renders a leading dot only when asked", () => {
    const { rerender } = render(<Badge>Offline</Badge>);
    expect(screen.queryByTestId("badge-dot")).not.toBeInTheDocument();
    rerender(<Badge leadingDot>Live</Badge>);
    expect(screen.getByTestId("badge-dot")).toBeInTheDocument();
  });

  it("supports the sm size", () => {
    render(<Badge size="sm">NO ACCESS</Badge>);
    expect(screen.getByText("NO ACCESS")).toHaveAttribute("data-size", "sm");
  });
});
