import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssigneePicker } from "./AssigneePicker";
import type { UserRef } from "../../../types/domain";

const candidates: UserRef[] = [
  { id: "u1", name: "Alex Rivera" },
  { id: "u2", name: "Sarah Chen" },
  { id: "u3", name: "Marcus Vance" },
];

describe("AssigneePicker", () => {
  it("shows current assignees and an add control", () => {
    render(
      <AssigneePicker
        assignees={[candidates[0]]}
        candidates={candidates}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("img", { name: "Alex Rivera" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add assignee" })).toBeInTheDocument();
  });

  it("adds an unassigned candidate", async () => {
    const onChange = vi.fn();
    render(
      <AssigneePicker assignees={[candidates[0]]} candidates={candidates} onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Add assignee" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Sarah Chen" }));
    expect(onChange).toHaveBeenCalledWith(["u1", "u2"]);
  });

  it("removes an already-assigned candidate (toggle off)", async () => {
    const onChange = vi.fn();
    render(
      <AssigneePicker assignees={[candidates[0]]} candidates={candidates} onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Add assignee" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "✓ Alex Rivera" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("is display-only when canEdit is false", () => {
    render(
      <AssigneePicker
        assignees={[candidates[0]]}
        candidates={candidates}
        onChange={() => {}}
        canEdit={false}
      />,
    );
    expect(screen.queryByRole("button", { name: "Add assignee" })).not.toBeInTheDocument();
  });
});
