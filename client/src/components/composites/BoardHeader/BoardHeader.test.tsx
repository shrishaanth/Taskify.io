import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardHeader } from "./BoardHeader";

const crumbs = [
  { label: "Acme Design Studio", href: "/o" },
  { label: "E-Commerce Redesign", href: "/p" },
  { label: "Sprint Backlog" },
];

describe("BoardHeader", () => {
  it("renders the breadcrumb and the board name", () => {
    render(<BoardHeader name="Sprint Backlog" breadcrumbs={crumbs} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Sprint Backlog" }),
    ).toBeInTheDocument();
    expect(screen.getByText("E-Commerce Redesign")).toBeInTheDocument();
  });

  it("has no connection badge, presence row, or invite control (FR-3.1)", () => {
    render(<BoardHeader name="B" breadcrumbs={crumbs} />);
    expect(screen.queryByText("Live")).not.toBeInTheDocument();
    expect(screen.queryByText("Offline")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /invite/i }),
    ).not.toBeInTheDocument();
  });
});
