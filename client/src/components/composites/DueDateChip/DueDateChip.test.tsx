import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DueDateChip } from "./DueDateChip";

const NOW = new Date(2026, 7, 30, 12); // local Aug 30 2026
const iso = (y: number, m: number, d: number) => new Date(y, m, d, 12).toISOString();

describe("DueDateChip", () => {
  it("renders the short date, not overdue by default", () => {
    render(<DueDateChip date={iso(2026, 9, 20)} now={NOW} />);
    const chip = screen.getByText("Oct 20");
    expect(chip).toHaveAttribute("data-overdue", "false");
  });

  it("marks a past date as overdue", () => {
    render(<DueDateChip date={iso(2026, 7, 10)} now={NOW} />);
    expect(screen.getByText("Aug 10")).toHaveAttribute("data-overdue", "true");
  });

  it("never shows overdue for a done card", () => {
    render(<DueDateChip date={iso(2026, 7, 10)} done now={NOW} />);
    expect(screen.getByText("Aug 10")).toHaveAttribute("data-overdue", "false");
  });

  it("renders nothing when there is no date and no emptyLabel", () => {
    const { container } = render(<DueDateChip now={NOW} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a dashed empty chip when emptyLabel is given", () => {
    render(<DueDateChip emptyLabel="No due date" now={NOW} />);
    expect(screen.getByText("No due date")).toHaveAttribute("data-empty", "true");
  });
});
