import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectTile } from "./ProjectTile";
import type { ProjectSummary } from "../../../types/domain";

const base: ProjectSummary = {
  id: "p1",
  name: "E-Commerce Redesign",
  description: "Collaborative board for managing task lists and team milestones.",
  category: "Web Development",
  role: "head",
  members: [
    { id: "u1", name: "Alex Rivera" },
    { id: "u2", name: "Sarah Chen" },
    { id: "u3", name: "Marcus Vance" },
    { id: "u4", name: "Emma Watson" },
    { id: "u5", name: "David Kim" },
  ],
};

describe("ProjectTile — accessible variant", () => {
  it("shows role badge, description, member group and open affordance", () => {
    render(<ProjectTile project={base} onOpen={() => {}} />);
    const tile = screen.getByRole("button", { name: /e-commerce redesign/i });
    expect(tile).toHaveAttribute("data-variant", "accessible");
    expect(screen.getByText("HEAD")).toBeInTheDocument();
    expect(screen.getByText(/Collaborative board/)).toBeInTheDocument();
    expect(screen.getByText("Open Board →")).toBeInTheDocument();
    expect(screen.getByText("Web Development")).toBeInTheDocument();
  });

  it("opens on click and on Enter/Space", async () => {
    const onOpen = vi.fn();
    render(<ProjectTile project={base} onOpen={onOpen} />);
    const tile = screen.getByRole("button");
    await userEvent.click(tile);
    tile.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onOpen).toHaveBeenCalledTimes(3);
  });
});

describe("ProjectTile — no-access variant (FR-2.3)", () => {
  const locked: ProjectSummary = {
    id: "p9",
    name: "Private Financial Audit",
    category: "Finance",
    role: null,
    members: [],
  };

  it("shows NO ACCESS, name only, lock note and no open affordance", () => {
    render(<ProjectTile project={locked} onOpen={() => {}} />);
    expect(screen.getByText("NO ACCESS")).toBeInTheDocument();
    expect(screen.getByText("Private Financial Audit")).toBeInTheDocument();
    expect(screen.getByText("Private project board")).toBeInTheDocument();
    expect(screen.queryByText("Open Board →")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("is marked disabled and not clickable", async () => {
    const onOpen = vi.fn();
    const { container } = render(<ProjectTile project={locked} onOpen={onOpen} />);
    const tile = container.querySelector('[data-variant="no-access"]')!;
    expect(tile).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(tile);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("renders no description or member avatars", () => {
    render(
      <ProjectTile
        project={{ ...locked, description: "should not show", members: [{ id: "x", name: "Y Z" }] }}
        onOpen={() => {}}
      />,
    );
    expect(screen.queryByText("should not show")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
