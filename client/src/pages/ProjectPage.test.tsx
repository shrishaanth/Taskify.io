import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../test/renderRoute";

describe("ProjectPage — Boards tab", () => {
  it("shows board tiles and a New Board add-tile", async () => {
    renderRoute("/orgs/org-acme/projects/prj-ecom");
    expect(
      await screen.findByRole("heading", { level: 1, name: "E-Commerce Redesign" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /Sprint Backlog/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New Board" })).toBeInTheDocument();
  });

  it("opens a board tile -> board route", async () => {
    renderRoute("/orgs/org-acme/projects/prj-ecom");
    await userEvent.click(
      await screen.findByRole("button", { name: /Sprint Backlog/ }),
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "Sprint Backlog" }),
    ).toBeInTheDocument();
  });

  it("creates a board via the modal (empty project)", async () => {
    renderRoute("/orgs/org-acme/projects/prj-tokens");
    await userEvent.click(
      await screen.findByRole("button", { name: /New Board/ }),
    );
    await userEvent.type(screen.getByLabelText("Board Name"), "Roadmap");
    await userEvent.click(screen.getByRole("button", { name: "Create Board" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Roadmap" }),
    ).toBeInTheDocument();
  });

  it("switches to the Members tab", async () => {
    renderRoute("/orgs/org-acme/projects/prj-ecom");
    await userEvent.click(await screen.findByRole("tab", { name: "Members" }));
    expect(
      await screen.findByRole("cell", { name: "u-alex@acme.test" }),
    ).toBeInTheDocument();
    // Alex is Head -> invite panel visible
    expect(screen.getByLabelText("Search by Email Address")).toBeInTheDocument();
  });
});

describe("ProjectPage — access control", () => {
  it("shows the 403 screen for a same-org project with no membership", async () => {
    renderRoute("/orgs/org-acme/projects/prj-audit");
    expect(
      await screen.findByRole("heading", {
        name: "You don't have access to this project",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back to Projects" }),
    ).toBeInTheDocument();
  });

  it("shows not-found for an unknown project id", async () => {
    renderRoute("/orgs/org-acme/projects/prj-nope");
    expect(
      await screen.findByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
  });
});

describe("ProjectPage — Members tab permissions", () => {
  it("a plain Member (also a plain org member) does not get the invite panel", async () => {
    // Marcus: org 'member' + project 'member' of prj-ecom — no manage rights.
    renderRoute("/orgs/org-acme/projects/prj-ecom/members", { as: "u-marcus" });
    await screen.findByRole("heading", { level: 1, name: "E-Commerce Redesign" });
    expect(
      screen.queryByLabelText("Search by Email Address"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Remove/ }),
    ).not.toBeInTheDocument();
  });

  it("an Org Owner sees the invite panel even as a plain project member (FR-2.7)", async () => {
    // Alex is org owner + plain project member of prj-q3.
    renderRoute("/orgs/org-acme/projects/prj-q3/members");
    await screen.findByRole("heading", { level: 1, name: "Q3 Marketing Strategy" });
    expect(
      await screen.findByLabelText("Search by Email Address"),
    ).toBeInTheDocument();
  });
});
