import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriorityBadge } from "./PriorityBadge";

describe("PriorityBadge", () => {
  it("maps each priority to a label + tone", () => {
    const cases = [
      ["low", "Low Priority", "slate"],
      ["medium", "Medium Priority", "sky"],
      ["high", "High Priority", "amber"],
      ["urgent", "Urgent", "red"],
    ] as const;
    for (const [priority, label, tone] of cases) {
      const { unmount } = render(<PriorityBadge priority={priority} />);
      expect(screen.getByText(label)).toHaveAttribute("data-tone", tone);
      unmount();
    }
  });

  it("passes through size", () => {
    render(<PriorityBadge priority="high" size="sm" />);
    expect(screen.getByText("High Priority")).toHaveAttribute("data-size", "sm");
  });
});
