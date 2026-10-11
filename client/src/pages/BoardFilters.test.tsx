import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../test/renderRoute";

const BOARD = "/orgs/org-acme/projects/prj-ecom/boards/brd-sprint";

describe("board filters", () => {
  it("narrows the board as you type and says how many cards are shown", async () => {
    renderRoute(BOARD);
    await screen.findByRole("button", { name: /Fix API integration bugs/ });

    await userEvent.type(screen.getByLabelText("Search cards"), "API integration");

    expect(
      screen.getByRole("button", { name: /Fix API integration bugs/ }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/^1 of \d+ cards$/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.queryByText(/of \d+ cards$/)).not.toBeInTheDocument();
  });

  it("toggles a priority filter", async () => {
    renderRoute(BOARD);
    await screen.findByRole("button", { name: /Fix API integration bugs/ });
    const group = screen.getByRole("group", { name: "Filter by priority" });
    const urgent = within(group).getByRole("button", { name: "Urgent" });

    await userEvent.click(urgent);

    expect(urgent).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText(/of \d+ cards$/)).toBeInTheDocument();
  });

  it("focuses the search box when / is pressed", async () => {
    renderRoute(BOARD);
    await screen.findByRole("button", { name: /Fix API integration bugs/ });
    await userEvent.keyboard("/");
    expect(screen.getByLabelText("Search cards")).toHaveFocus();
  });
});
