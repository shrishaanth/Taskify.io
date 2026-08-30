import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("exposes the progressbar role with aria bounds", () => {
    render(<ProgressBar value={40} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
  });

  it("reflects `value` as the fill width", () => {
    render(<ProgressBar value={40} />);
    expect(screen.getByTestId("progress-fill")).toHaveStyle({ width: "40%" });
  });

  it("computes percent from current/total", () => {
    render(<ProgressBar current={3} total={5} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "60");
    expect(screen.getByTestId("progress-fill")).toHaveStyle({ width: "60%" });
  });

  it("clamps out-of-range values", () => {
    const { rerender } = render(<ProgressBar value={-20} />);
    expect(screen.getByTestId("progress-fill")).toHaveStyle({ width: "0%" });
    rerender(<ProgressBar value={250} />);
    expect(screen.getByTestId("progress-fill")).toHaveStyle({ width: "100%" });
  });

  it("treats total=0 as 0%", () => {
    render(<ProgressBar current={3} total={0} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("applies tone + accessible label", () => {
    render(<ProgressBar value={10} tone="green" label="Subtasks" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("data-tone", "green");
    expect(bar).toHaveAccessibleName("Subtasks");
  });
});
