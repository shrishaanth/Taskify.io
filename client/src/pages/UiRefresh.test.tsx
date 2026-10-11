import { describe, it, expect } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { renderRoute } from "../test/renderRoute";
import { KanbanCard } from "../components/composites/KanbanCard/KanbanCard";
import { KanbanColumn } from "../components/composites/KanbanColumn/KanbanColumn";
import { isDueSoon } from "../lib/format";
import type { CardSummary } from "../types/domain";

const card = (id: string, over: Partial<CardSummary> = {}): CardSummary => ({
  id,
  boardId: "b",
  columnId: "c",
  order: 0,
  title: `Card ${id}`,
  labels: [],
  assignees: [],
  subtaskDone: 0,
  subtaskTotal: 0,
  commentCount: 0,
  ...over,
});

describe("cards say more at a glance", () => {
  it("carries its priority as an attribute for the coloured edge", () => {
    render(<KanbanCard card={card("1", { priority: "urgent" })} onOpen={() => {}} />);
    expect(screen.getByRole("button", { name: /Card 1/ })).toHaveAttribute(
      "data-priority",
      "urgent",
    );
  });

  it("writes the priority out only when it needs attention", () => {
    const { rerender } = render(
      <KanbanCard card={card("1", { priority: "medium" })} onOpen={() => {}} />,
    );
    expect(screen.queryByText(/medium/i)).not.toBeInTheDocument();
    rerender(<KanbanCard card={card("1", { priority: "high" })} onOpen={() => {}} />);
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it("marks a card that has a description and shows every assignee", () => {
    render(
      <KanbanCard
        card={card("1", {
          hasDescription: true,
          assignees: [
            { id: "a", name: "Ann Lee" },
            { id: "b", name: "Bo Diaz" },
          ],
        })}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByTestId("has-description")).toBeInTheDocument();
    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(screen.getByText("BD")).toBeInTheDocument();
  });

  it("flags subtask progress as complete when everything is ticked", () => {
    render(
      <KanbanCard card={card("1", { subtaskDone: 2, subtaskTotal: 2 })} onOpen={() => {}} />,
    );
    expect(screen.getByTestId("subtask-progress")).toHaveAttribute("data-complete", "true");
  });
});

describe("due soon", () => {
  const now = new Date(2026, 9, 18, 10, 0, 0);
  it("covers today and the next two days, but not overdue or done cards", () => {
    expect(isDueSoon("2026-10-18T00:00:00.000Z", { now })).toBe(true);
    expect(isDueSoon("2026-10-20T00:00:00.000Z", { now })).toBe(true);
    expect(isDueSoon("2026-10-21T00:00:00.000Z", { now })).toBe(false);
    expect(isDueSoon("2026-10-17T00:00:00.000Z", { now })).toBe(false);
    expect(isDueSoon("2026-10-19T00:00:00.000Z", { now, done: true })).toBe(false);
  });
});

describe("drop slot", () => {
  const column = { id: "c", name: "To Do", order: 0 };
  const cards = [card("1"), card("2"), card("3")];
  const renderColumn = (draggingCardId: string) =>
    render(
      <KanbanColumn
        column={column}
        cards={cards}
        draggable
        draggingCardId={draggingCardId}
        onCardDrop={() => {}}
        onAddCard={() => {}}
        onOpenCard={() => {}}
      />,
    );

  it("opens above the card being hovered", () => {
    renderColumn("1");
    const target = screen.getByRole("button", { name: /Card 3/ });
    fireEvent.dragEnter(target);
    const slot = screen.getByTestId("drop-slot");
    expect(slot.nextElementSibling).toBe(target);
  });

  it("does not open where dropping would change nothing", () => {
    renderColumn("1");
    fireEvent.dragEnter(screen.getByRole("button", { name: /Card 2/ }));
    expect(screen.queryByTestId("drop-slot")).not.toBeInTheDocument();
  });

  it("opens at the end when hovering the empty part of the column", () => {
    renderColumn("1");
    fireEvent.dragEnter(screen.getByTestId("kanban-column-list"));
    const slot = screen.getByTestId("drop-slot");
    expect(slot.nextElementSibling).toBeNull();
  });
});

describe("top bar", () => {
  it("links to Projects, Members and Settings and marks the current one", async () => {
    renderRoute("/orgs/org-acme/members");
    const nav = await screen.findByRole("navigation", { name: "Organization" });
    expect(within(nav).getByRole("button", { name: "Members" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByRole("button", { name: "Projects" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(within(nav).getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });
});
