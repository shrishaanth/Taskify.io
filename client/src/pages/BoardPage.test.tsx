import { describe, it, expect, vi } from "vitest";
import { screen, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../test/renderRoute";

function fakeDataTransfer() {
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

const BOARD = "/orgs/org-acme/projects/prj-ecom/boards/brd-sprint";

describe("BoardPage", () => {
  it("renders the board header and columns with cards", async () => {
    renderRoute(BOARD);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Sprint Backlog" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
    const todo = await screen.findByRole("region", { name: "To Do" });
    expect(
      within(todo).getByText(/Design system token mapping/),
    ).toBeInTheDocument();
  });

  it("opens a card in the detail modal and closes it", async () => {
    renderRoute(BOARD);
    await userEvent.click(
      await screen.findByRole("button", {
        name: /Update homepage hero banner graphics/,
      }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: /Update homepage hero banner graphics/,
    });
    expect(await within(dialog).findByText("1/2 completed")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("adds a card to a column", async () => {
    renderRoute(BOARD);
    const review = await screen.findByRole("region", { name: "In Review" });
    await userEvent.click(
      within(review).getByRole("button", { name: /add a card/i }),
    );
    expect(
      await within(review).findByRole("heading", { name: "Untitled card" }),
    ).toBeInTheDocument();
  });

  it("adds a column via the add-column tile", async () => {
    renderRoute(BOARD);
    await screen.findByRole("region", { name: "To Do" });
    expect(screen.getAllByTestId("kanban-column")).toHaveLength(4);
    await userEvent.click(screen.getByRole("button", { name: "Add column" }));
    expect(await screen.findAllByTestId("kanban-column")).toHaveLength(5);
  });

  it("renames a column through its menu (via prompt)", async () => {
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("Blocked");
    renderRoute(BOARD);
    await userEvent.click(
      await screen.findByRole("button", { name: "To Do column actions" }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Rename column" }));
    expect(
      await screen.findByRole("region", { name: "Blocked" }),
    ).toBeInTheDocument();
    promptSpy.mockRestore();
  });

  it("deletes a card from the detail modal", async () => {
    renderRoute(BOARD);
    await userEvent.click(
      await screen.findByRole("button", { name: /Fix API integration bugs/ }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Card actions" }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete card" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Fix API integration bugs/),
    ).not.toBeInTheDocument();
  });

  it("moves a card to another column by drag and drop", async () => {
    renderRoute(BOARD);
    const doing = await screen.findByRole("region", { name: "In Progress" });
    const cardEl = within(doing).getByRole("button", {
      name: /Fix API integration bugs/,
    });

    const dataTransfer = fakeDataTransfer();
    fireEvent.dragStart(cardEl, { dataTransfer });
    const doneRegion = screen.getByRole("region", { name: "Done" });
    const dropZone = within(doneRegion).getByTestId("kanban-column-list");
    fireEvent.dragOver(dropZone, { dataTransfer });
    fireEvent.drop(dropZone, { dataTransfer });

    await waitFor(() =>
      expect(
        within(screen.getByRole("region", { name: "Done" })).getByText(
          /Fix API integration bugs/,
        ),
      ).toBeInTheDocument(),
    );
    expect(
      within(screen.getByRole("region", { name: "In Progress" })).queryByText(
        /Fix API integration bugs/,
      ),
    ).not.toBeInTheDocument();
  });

  it("renames a card from the detail modal by clicking its title", async () => {
    renderRoute(BOARD);
    await userEvent.click(
      await screen.findByRole("button", { name: /Fix API integration bugs/ }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /Fix API integration bugs/ }),
    );
    const input = within(dialog).getByLabelText("Card title");
    await userEvent.clear(input);
    await userEvent.type(input, "Checkout flow fixes{Enter}");
    expect(
      await within(dialog).findByRole("heading", { name: "Checkout flow fixes" }),
    ).toBeInTheDocument();
  });

  it("shows the empty board state when the board has no columns", async () => {
    renderRoute("/orgs/org-acme/projects/prj-ecom/boards/brd-empty");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Fresh Board" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("This board is empty")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "+ Add your first column" }),
    );
    expect(
      await screen.findByRole("region", { name: "To Do" }),
    ).toBeInTheDocument();
  });

  it("blocks a non-member with the 403 screen", async () => {
    renderRoute("/orgs/org-acme/projects/prj-audit/boards/whatever");
    expect(
      await screen.findByRole("heading", {
        name: "You don't have access to this project",
      }),
    ).toBeInTheDocument();
  });
});
