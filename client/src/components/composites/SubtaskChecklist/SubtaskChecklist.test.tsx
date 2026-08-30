import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubtaskChecklist } from "./SubtaskChecklist";
import type { Subtask } from "../../../types/domain";

const subs: Subtask[] = [
  { id: "1", title: "Confirm copy", done: true },
  { id: "2", title: "Source photography", done: true },
  { id: "3", title: "Layout drafts", done: true },
  { id: "4", title: "Gather feedback", done: false },
  { id: "5", title: "Export files", done: false },
];

describe("SubtaskChecklist", () => {
  it("shows the completed count and progress", () => {
    render(
      <SubtaskChecklist subtasks={subs} onToggle={() => {}} onAdd={() => {}} />,
    );
    expect(screen.getByText("3/5 completed")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "60");
  });

  it("toggles a subtask by id", async () => {
    const onToggle = vi.fn();
    render(
      <SubtaskChecklist subtasks={subs} onToggle={onToggle} onAdd={() => {}} />,
    );
    await userEvent.click(screen.getByRole("checkbox", { name: "Gather feedback" }));
    expect(onToggle).toHaveBeenCalledWith("4", true);
  });

  it("adds a new subtask through the reveal-on-click input", async () => {
    const onAdd = vi.fn();
    render(<SubtaskChecklist subtasks={subs} onToggle={() => {}} onAdd={onAdd} />);
    await userEvent.click(screen.getByRole("button", { name: "+ Add checklist subtask" }));
    await userEvent.type(screen.getByLabelText("New subtask title"), "Publish{Enter}");
    expect(onAdd).toHaveBeenCalledWith("Publish");
  });

  it("handles the empty checklist edge case", () => {
    render(<SubtaskChecklist subtasks={[]} onToggle={() => {}} onAdd={() => {}} />);
    expect(screen.getByText("0/0 completed")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("hides all editing affordances when canEdit is false", () => {
    render(
      <SubtaskChecklist
        subtasks={subs}
        onToggle={() => {}}
        onAdd={() => {}}
        onDelete={() => {}}
        canEdit={false}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "+ Add checklist subtask" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Delete subtask/ })).not.toBeInTheDocument();
  });
});
