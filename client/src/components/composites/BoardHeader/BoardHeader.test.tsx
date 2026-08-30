import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardHeader } from "./BoardHeader";

const crumbs = [
  { label: "Acme Design Studio", href: "/o" },
  { label: "E-Commerce Redesign", href: "/p" },
  { label: "Sprint Backlog" },
];

describe("BoardHeader", () => {
  it("renders breadcrumb, name, connection status and presence", () => {
    render(
      <BoardHeader
        name="Sprint Backlog"
        breadcrumbs={crumbs}
        connection="live"
        presence={[
          { id: "1", name: "A B" },
          { id: "2", name: "C D" },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Sprint Backlog" })).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("shows the offline state", () => {
    render(
      <BoardHeader name="B" breadcrumbs={crumbs} connection="offline" presence={[]} />,
    );
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("has no invite control (FR-3.1)", () => {
    render(
      <BoardHeader name="B" breadcrumbs={crumbs} connection="live" presence={[]} />,
    );
    expect(screen.queryByRole("button", { name: /invite/i })).not.toBeInTheDocument();
  });
});
