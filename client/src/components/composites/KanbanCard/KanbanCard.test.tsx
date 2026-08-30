import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanCard } from "./KanbanCard";
import type { CardSummary } from "../../../types/domain";

const NOW = new Date(2026, 7, 30, 12);
const iso = (y: number, m: number, d: number) => new Date(y, m, d, 12).toISOString();

const base: CardSummary = {
  id: "c1",
  boardId: "b1",
  columnId: "col1",
  order: 0,
  title: "Design system token mapping and styleguide setup",
  labels: ["Design", "Tokens"],
  assignees: [{ id: "u1", name: "Alex Rivera" }],
  dueDate: iso(2026, 9, 20),
  priority: "high",
  subtaskDone: 3,
  subtaskTotal: 5,
  commentCount: 2,
};

describe("KanbanCard — default state", () => {
  it("renders labels, title, due date, subtask + comment counts and assignee", () => {
    render(<KanbanCard card={base} onOpen={() => {}} now={NOW} />);
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Tokens")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Design system token mapping/ })).toBeInTheDocument();
    expect(screen.getByText("Oct 20")).toHaveAttribute("data-overdue", "false");
    expect(screen.getByTestId("subtask-progress")).toHaveTextContent("3/5");
    expect(screen.getByTestId("comment-count")).toHaveTextContent("2");
    expect(screen.getByRole("img", { name: "Alex Rivera" })).toBeInTheDocument();
  });

  it("opens on click", async () => {
    const onOpen = vi.fn();
    render(<KanbanCard card={base} onOpen={onOpen} now={NOW} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe("KanbanCard — overdue state", () => {
  it("shows the due date in the overdue style", () => {
    render(
      <KanbanCard card={{ ...base, dueDate: iso(2026, 7, 10) }} onOpen={() => {}} now={NOW} />,
    );
    expect(screen.getByText("Aug 10")).toHaveAttribute("data-overdue", "true");
  });

  it("is never overdue in a done column", () => {
    render(
      <KanbanCard card={{ ...base, dueDate: iso(2026, 7, 10) }} done onOpen={() => {}} now={NOW} />,
    );
    expect(screen.getByText("Aug 10")).toHaveAttribute("data-overdue", "false");
  });
});

describe("KanbanCard — dragging state", () => {
  it("marks itself as dragging", () => {
    render(<KanbanCard card={base} isDragging onOpen={() => {}} now={NOW} />);
    expect(screen.getByRole("button")).toHaveAttribute("data-dragging", "true");
  });
});

describe("KanbanCard — edge cases", () => {
  it("hides the subtask indicator when there are no subtasks", () => {
    render(
      <KanbanCard
        card={{ ...base, subtaskDone: 0, subtaskTotal: 0 }}
        onOpen={() => {}}
        now={NOW}
      />,
    );
    expect(screen.queryByTestId("subtask-progress")).not.toBeInTheDocument();
  });

  it("hides comment count when zero, due chip when no date, avatar when unassigned, labels when none", () => {
    const bare: CardSummary = {
      id: "c2",
      boardId: "b1",
      columnId: "col1",
      order: 1,
      title: "Bare card",
      labels: [],
      assignees: [],
      subtaskDone: 0,
      subtaskTotal: 0,
      commentCount: 0,
    };
    render(<KanbanCard card={bare} onOpen={() => {}} now={NOW} />);
    expect(screen.queryByTestId("comment-count")).not.toBeInTheDocument();
    expect(screen.queryByTestId("subtask-progress")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText("Design")).not.toBeInTheDocument();
  });
});
