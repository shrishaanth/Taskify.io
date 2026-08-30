import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardCanvas } from "./BoardCanvas";
import type { CardSummary, Column } from "../../../types/domain";

function dt() {
  const store: Record<string, string> = {};
  return {
    setData: (k: string, v: string) => {
      store[k] = v;
    },
    getData: (k: string) => store[k] ?? "",
    effectAllowed: "",
    dropEffect: "",
  };
}

const columns: Column[] = [
  { id: "todo", name: "To Do", order: 0 },
  { id: "doing", name: "In Progress", order: 1 },
  { id: "done", name: "Done", order: 2 },
];

const card = (id: string, columnId: string): CardSummary => ({
  id,
  boardId: "b1",
  columnId,
  order: 0,
  title: `Card ${id}`,
  labels: [],
  assignees: [],
  subtaskDone: 0,
  subtaskTotal: 0,
  commentCount: 0,
});

describe("BoardCanvas", () => {
  it("renders columns in order with their cards", () => {
    render(
      <BoardCanvas
        columns={[...columns].reverse()}
        cardsByColumn={{ todo: [card("1", "todo")], doing: [], done: [] }}
        onAddCard={() => {}}
        onOpenCard={() => {}}
      />,
    );
    const regions = screen.getAllByRole("region");
    expect(regions.map((r) => r.getAttribute("aria-label"))).toEqual([
      "To Do",
      "In Progress",
      "Done",
    ]);
  });

  it("routes add-card to the right column id", async () => {
    const onAddCard = vi.fn();
    render(
      <BoardCanvas
        columns={columns}
        cardsByColumn={{}}
        onAddCard={onAddCard}
        onOpenCard={() => {}}
      />,
    );
    const addButtons = screen.getAllByRole("button", { name: /add a card/i });
    await userEvent.click(addButtons[1]);
    expect(onAddCard).toHaveBeenCalledWith("doing");
  });

  it("shows the add-column tile only when canManage + onAddColumn", async () => {
    const onAddColumn = vi.fn();
    const { rerender } = render(
      <BoardCanvas
        columns={columns}
        cardsByColumn={{}}
        onAddCard={() => {}}
        onOpenCard={() => {}}
        onAddColumn={onAddColumn}
      />,
    );
    expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();

    rerender(
      <BoardCanvas
        columns={columns}
        cardsByColumn={{}}
        canManage
        onAddCard={() => {}}
        onOpenCard={() => {}}
        onAddColumn={onAddColumn}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Add column" }));
    expect(onAddColumn).toHaveBeenCalledTimes(1);
  });

  it("renders the empty state instead of the board when there are no columns", () => {
    render(
      <BoardCanvas
        columns={[]}
        cardsByColumn={{}}
        onAddCard={() => {}}
        onOpenCard={() => {}}
        emptyState={<div>This board is empty</div>}
      />,
    );
    expect(screen.getByText("This board is empty")).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("moves a card to another column via drag and drop (canManage + onMoveCard)", () => {
    const onMoveCard = vi.fn();
    render(
      <BoardCanvas
        columns={columns}
        cardsByColumn={{
          todo: [card("1", "todo")],
          doing: [card("2", "doing")],
          done: [],
        }}
        canManage
        onMoveCard={onMoveCard}
        onAddCard={() => {}}
        onOpenCard={() => {}}
      />,
    );

    const cardEl = screen.getByRole("button", { name: "Card 1" });
    const dataTransfer = dt();
    fireEvent.dragStart(cardEl, { dataTransfer });

    const doneRegion = screen.getByRole("region", { name: "Done" });
    const dropZone = within(doneRegion).getByTestId("kanban-column-list");
    fireEvent.dragOver(dropZone, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });

    expect(onMoveCard).toHaveBeenCalledWith("1", "done", null);
  });

  it("does not enable drag-and-drop without canManage", () => {
    render(
      <BoardCanvas
        columns={columns}
        cardsByColumn={{ todo: [card("1", "todo")], doing: [], done: [] }}
        onMoveCard={vi.fn()}
        onAddCard={() => {}}
        onOpenCard={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Card 1" })).toHaveAttribute(
      "draggable",
      "false",
    );
  });

  it("suppresses overdue styling for cards in done columns", () => {
    const past = new Date(2000, 0, 1).toISOString();
    render(
      <BoardCanvas
        columns={columns}
        cardsByColumn={{ done: [{ ...card("x", "done"), dueDate: past }] }}
        doneColumnIds={["done"]}
        onAddCard={() => {}}
        onOpenCard={() => {}}
        now={new Date(2026, 7, 30)}
      />,
    );
    // the due chip renders but not overdue
    const chip = screen.getByText(/Jan 1/);
    expect(chip).toHaveAttribute("data-overdue", "false");
  });
});
