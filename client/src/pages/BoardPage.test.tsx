import { describe, it, expect, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../test/renderRoute";

const BOARD = "/orgs/org-acme/projects/prj-ecom/boards/brd-sprint";

describe("BoardPage", () => {
  it("renders the board header and columns with cards", () => {
    renderRoute(BOARD);
    expect(screen.getByRole("heading", { level: 1, name: "Sprint Backlog" })).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
    const todo = screen.getByRole("region", { name: "To Do" });
    expect(within(todo).getByText(/Design system token mapping/)).toBeInTheDocument();
  });

  it("opens a card in the detail modal and closes it", async () => {
    renderRoute(BOARD);
    await userEvent.click(screen.getByRole("button", { name: /Update homepage hero banner graphics/ }));
    const dialog = await screen.findByRole("dialog", {
      name: /Update homepage hero banner graphics/,
    });
    expect(within(dialog).getByText("3/5 completed")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("adds a card to a column", async () => {
    renderRoute(BOARD);
    const review = screen.getByRole("region", { name: "In Review" });
    expect(within(review).getByText("1")).toBeInTheDocument(); // count badge
    await userEvent.click(within(review).getByRole("button", { name: /add a card/i }));
    expect(within(review).getByText("2")).toBeInTheDocument();
    expect(within(review).getByRole("heading", { name: "Untitled card" })).toBeInTheDocument();
  });

  it("adds a column via the add-column tile", async () => {
    renderRoute(BOARD);
    expect(screen.getAllByTestId("kanban-column")).toHaveLength(4);
    await userEvent.click(screen.getByRole("button", { name: "Add column" }));
    expect(screen.getAllByTestId("kanban-column")).toHaveLength(5);
  });

  it("renames a column through its menu (via prompt)", async () => {
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("Blocked");
    renderRoute(BOARD);
    await userEvent.click(screen.getByRole("button", { name: "To Do column actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Rename column" }));
    expect(promptSpy).toHaveBeenCalled();
    expect(screen.getByRole("region", { name: "Blocked" })).toBeInTheDocument();
    promptSpy.mockRestore();
  });

  it("deletes a card from the detail modal", async () => {
    renderRoute(BOARD);
    await userEvent.click(screen.getByRole("button", { name: /Fix API integration bugs/ }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Card actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete card" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(/Fix API integration bugs/)).not.toBeInTheDocument();
  });

  it("shows the empty board state when the board has no columns", async () => {
    renderRoute("/orgs/org-acme/projects/prj-ecom/boards/brd-empty");
    expect(screen.getByRole("heading", { level: 1, name: "Fresh Board" })).toBeInTheDocument();
    expect(screen.getByText("This board is empty")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "+ Add your first column" }));
    expect(screen.getByRole("region", { name: "To Do" })).toBeInTheDocument();
  });

  it("blocks a non-member with the 403 screen", () => {
    renderRoute("/orgs/org-acme/projects/prj-audit/boards/whatever");
    expect(
      screen.getByRole("heading", { name: "You don't have access to this project" }),
    ).toBeInTheDocument();
  });
});
