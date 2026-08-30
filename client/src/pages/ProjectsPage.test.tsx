import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../test/renderRoute";

describe("ProjectsPage", () => {
  it("lists accessible + no-access project tiles from the API", async () => {
    renderRoute("/orgs/org-acme/projects");
    expect(
      await screen.findByRole("button", { name: /E-Commerce Redesign/ }),
    ).toBeInTheDocument();
    // prj-audit: Alex has no ProjectMembership -> name-only, not a button
    expect(screen.getByText("Private Financial Audit")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Private Financial Audit/ }),
    ).not.toBeInTheDocument();
  });

  it("opens a project tile -> project boards route", async () => {
    renderRoute("/orgs/org-acme/projects");
    await userEvent.click(
      await screen.findByRole("button", { name: /E-Commerce Redesign/ }),
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "E-Commerce Redesign" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Boards" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("creates a project via the modal and navigates into it", async () => {
    renderRoute("/orgs/org-acme/projects");
    await userEvent.click(
      await screen.findByRole("button", { name: "+ New Project" }),
    );
    await userEvent.type(
      screen.getByLabelText("Project Name"),
      "Growth Experiments",
    );
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Growth Experiments" }),
    ).toBeInTheDocument();
  });

  it("shows the empty state for an org with no projects", async () => {
    renderRoute("/orgs/org-bright/projects");
    expect(await screen.findByText("No projects yet")).toBeInTheDocument();
  });

  it("routes unknown orgs to the not-found page", async () => {
    renderRoute("/orgs/does-not-exist/projects");
    expect(
      await screen.findByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
  });

  it("keeps the top nav present", async () => {
    renderRoute("/orgs/org-acme/projects");
    expect(await screen.findByText("Taskify")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Acme Design Studio/ }),
    ).toBeInTheDocument();
  });
});
