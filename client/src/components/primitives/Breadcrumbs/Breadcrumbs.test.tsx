import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders a labelled nav with all items", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Acme Design Studio", href: "/orgs/1" },
          { label: "E-Commerce Redesign", href: "/p/2" },
          { label: "Sprint Backlog" },
        ]}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByText("Acme Design Studio")).toBeInTheDocument();
    expect(screen.getByText("Sprint Backlog")).toBeInTheDocument();
  });

  it("marks only the last item as current and non-interactive", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Org", href: "/o" },
          { label: "Here" },
        ]}
      />,
    );
    const current = screen.getByText("Here");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.tagName).toBe("SPAN");
    expect(screen.getByRole("link", { name: "Org" })).toHaveAttribute("href", "/o");
  });

  it("renders a button for items with onClick but no href", async () => {
    const onClick = vi.fn();
    render(
      <Breadcrumbs
        items={[
          { label: "Projects", onClick },
          { label: "Current" },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Projects" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("puts a separator between items (items - 1 of them)", () => {
    render(
      <Breadcrumbs
        separator=">"
        items={[{ label: "A", href: "/a" }, { label: "B", href: "/b" }, { label: "C" }]}
      />,
    );
    const seps = screen.getAllByText(">");
    expect(seps).toHaveLength(2);
  });
});
