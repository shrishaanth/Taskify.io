import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectHeader } from "./ProjectHeader";

const crumbs = [
  { label: "Acme Design Studio", href: "/o" },
  { label: "E-Commerce Redesign" },
];

describe("ProjectHeader", () => {
  it("renders breadcrumb, name, description and the two tabs", () => {
    render(
      <ProjectHeader
        name="E-Commerce Redesign"
        description="Manage lists, task cards, and project milestones."
        breadcrumbs={crumbs}
        activeTab="boards"
        onTabChange={() => {}}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "E-Commerce Redesign" })).toBeInTheDocument();
    expect(screen.getByText(/Manage lists/)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Boards" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Members" })).toHaveAttribute("aria-selected", "false");
  });

  it("reports tab changes", async () => {
    const onTabChange = vi.fn();
    render(
      <ProjectHeader
        name="P"
        breadcrumbs={crumbs}
        activeTab="boards"
        onTabChange={onTabChange}
      />,
    );
    await userEvent.click(screen.getByRole("tab", { name: "Members" }));
    expect(onTabChange).toHaveBeenCalledWith("members");
  });
});
