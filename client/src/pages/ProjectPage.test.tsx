import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../test/renderRoute";

describe("ProjectPage — Boards tab", () => {
  it("shows the board tiles and a New Board add-tile for a member", () => {
    renderRoute("/orgs/org-acme/projects/prj-ecom");
    expect(screen.getByRole("heading", { level: 1, name: "E-Commerce Redesign" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sprint Backlog/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New Board" })).toBeInTheDocument();
  });

  it("opens a board tile -> board route", async () => {
    renderRoute("/orgs/org-acme/projects/prj-ecom");
    await userEvent.click(screen.getByRole("button", { name: /Sprint Backlog/ }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Sprint Backlog" }),
    ).toBeInTheDocument();
  });

  it("creates a board via the modal", async () => {
    renderRoute("/orgs/org-acme/projects/prj-tokens");
    // prj-tokens has zero boards -> empty state with a create action
    await userEvent.click(screen.getByRole("button", { name: /New Board/ }));
    await userEvent.type(screen.getByLabelText("Board Name"), "Roadmap");
    await userEvent.click(screen.getByRole("button", { name: "Create Board" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Roadmap" }),
    ).toBeInTheDocument();
  });

  it("switches to the Members tab", async () => {
    renderRoute("/orgs/org-acme/projects/prj-ecom");
    await userEvent.click(screen.getByRole("tab", { name: "Members" }));
    expect(await screen.findByRole("cell", { name: "alex@acme.com" })).toBeInTheDocument();
    // head sees the invite panel
    expect(screen.getByLabelText("Search by Email Address")).toBeInTheDocument();
  });
});

describe("ProjectPage — access control", () => {
  it("shows the 403 access-denied screen for a same-org project with no membership", () => {
    renderRoute("/orgs/org-acme/projects/prj-audit");
    expect(
      screen.getByRole("heading", { name: "You don't have access to this project" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Projects" })).toBeInTheDocument();
  });

  it("shows not-found for an unknown project id", () => {
    renderRoute("/orgs/org-acme/projects/prj-nope");
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});

describe("ProjectPage — Members tab permissions", () => {
  it("a plain Member does not get the invite panel or manage controls", () => {
    renderRoute("/orgs/org-acme/projects/prj-q3/members");
    // current user is a plain member of prj-q3
    expect(screen.queryByLabelText("Search by Email Address")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Remove/ })).not.toBeInTheDocument();
  });
});
