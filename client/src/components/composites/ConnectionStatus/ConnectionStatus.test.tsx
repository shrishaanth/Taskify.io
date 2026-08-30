import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectionStatus } from "./ConnectionStatus";

describe("ConnectionStatus", () => {
  it("shows Live in green with a dot", () => {
    render(<ConnectionStatus status="live" />);
    expect(screen.getByText("Live")).toHaveAttribute("data-tone", "green");
    expect(screen.getByTestId("badge-dot")).toBeInTheDocument();
  });

  it("shows Offline in slate", () => {
    render(<ConnectionStatus status="offline" />);
    expect(screen.getByText("Offline")).toHaveAttribute("data-tone", "slate");
  });
});
