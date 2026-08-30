import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanColumn } from "./KanbanColumn";
import type { CardSummary, Column } from "../../../types/domain";

const column: Column = { id: "col1", name: "To Do", order: 0 };

const card = (id: string): CardSummary => ({
  id,
  boardId: "b1",
  columnId: "col1",
  order: 0,
  title: `Card ${id}`,
  labels: [],
  assignees: [],
  subtaskDone: 0,
  subtaskTotal: 0,
  commentCount: 0,
});

describe("KanbanColumn", () => {
  it("shows the name, live count and the cards", () => {
    render(
      <KanbanColumn
        column={column}
        cards={[card("1"), card("2"), card("3")]}
        onAddCard={() => {}}
        onOpenCard={() => {}}
      />,
    );
    const region = screen.getByRole("region", { name: "To Do" });
    expect(within(region).getByText("3")).toBeInTheDocument();
    expect(within(region).getAllByRole("button", { name: /^Card/ })).toHaveLength(3);
  });

  it("adds a card via the footer button", async () => {
    const onAddCard = vi.fn();
    render(
      <KanbanColumn column={column} cards={[]} onAddCard={onAddCard} onOpenCard={() => {}} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /add a card/i }));
    expect(onAddCard).toHaveBeenCalledTimes(1);
  });

  it("opens a card with its id", async () => {
    const onOpenCard = vi.fn();
    render(
      <KanbanColumn
        column={column}
        cards={[card("42")]}
        onAddCard={() => {}}
        onOpenCard={onOpenCard}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Card 42" }));
    expect(onOpenCard).toHaveBeenCalledWith("42");
  });

  it("hides the ⋯ menu unless canManage", () => {
    const { rerender } = render(
      <KanbanColumn
        column={column}
        cards={[]}
        onAddCard={() => {}}
        onOpenCard={() => {}}
        onRenameColumn={() => {}}
        onDeleteColumn={() => {}}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /column actions/i }),
    ).not.toBeInTheDocument();

    rerender(
      <KanbanColumn
        column={column}
        cards={[]}
        canManage
        onAddCard={() => {}}
        onOpenCard={() => {}}
        onRenameColumn={() => {}}
        onDeleteColumn={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /column actions/i }),
    ).toBeInTheDocument();
  });

  it("exposes rename / delete actions through the menu", async () => {
    const onRenameColumn = vi.fn();
    const onDeleteColumn = vi.fn();
    render(
      <KanbanColumn
        column={column}
        cards={[]}
        canManage
        onAddCard={() => {}}
        onOpenCard={() => {}}
        onRenameColumn={onRenameColumn}
        onDeleteColumn={onDeleteColumn}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /column actions/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete column" }));
    expect(onDeleteColumn).toHaveBeenCalledTimes(1);
    expect(onRenameColumn).not.toHaveBeenCalled();
  });
});
