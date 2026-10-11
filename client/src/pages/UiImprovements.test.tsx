import { describe, it, expect } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../test/renderRoute";

const PROJECT = "/orgs/org-acme/projects/prj-ecom";
const BOARD = `${PROJECT}/boards/brd-sprint`;

describe("board actions", () => {
  it("renames the board from its menu", async () => {
    renderRoute(BOARD);
    await userEvent.click(await screen.findByRole("button", { name: "Board actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Rename board" }));

    const field = await screen.findByLabelText("Board name");
    await userEvent.clear(field);
    await userEvent.type(field, "Release Board");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Release Board" }),
    ).toBeInTheDocument();
  });

  it("deletes the board after confirmation and returns to the project", async () => {
    renderRoute(BOARD);
    await userEvent.click(await screen.findByRole("button", { name: "Board actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete board" }));
    await userEvent.click(await screen.findByRole("button", { name: "Delete board" }));

    expect(await screen.findByRole("tab", { name: "Boards" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Sprint Backlog" })).not.toBeInTheDocument();
  });

  it("moves a card to another column from the card dialog, without dragging", async () => {
    renderRoute(BOARD);
    await userEvent.click(
      await screen.findByRole("button", { name: /Fix API integration bugs/ }),
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.selectOptions(
      await within(dialog).findByLabelText("Column"),
      "Done",
    );

    const done = screen.getByRole("region", { name: "Done" });
    await waitFor(() =>
      expect(within(done).getByText(/Fix API integration bugs/)).toBeInTheDocument(),
    );
  });
});

describe("project actions", () => {
  it("edits the project's name and description", async () => {
    renderRoute(PROJECT);
    await userEvent.click(await screen.findByRole("button", { name: "Project actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit project" }));

    const field = await screen.findByLabelText("Project name");
    await userEvent.clear(field);
    await userEvent.type(field, "Storefront Rebuild");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Storefront Rebuild" }),
    ).toBeInTheDocument();
  });

  it("deletes the project after confirmation", async () => {
    renderRoute(PROJECT);
    await userEvent.click(await screen.findByRole("button", { name: "Project actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete project" }));
    await userEvent.click(await screen.findByRole("button", { name: "Delete project" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Projects" }),
    ).toBeInTheDocument();
  });
});

describe("returning to the requested page after login", () => {
  it("sends a signed-out visitor back to the board they asked for", async () => {
    renderRoute(BOARD, { anonymous: true });
    await userEvent.type(await screen.findByLabelText("Email Address"), "u-alex@acme.test");
    await userEvent.type(screen.getByLabelText("Password"), "supersecret1");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Sprint Backlog" }),
    ).toBeInTheDocument();
  });
});
