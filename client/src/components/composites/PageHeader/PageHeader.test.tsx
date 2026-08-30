import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "./PageHeader";
import { Button } from "../../primitives/Button/Button";

describe("PageHeader", () => {
  it("renders title + subtitle as an h1", () => {
    render(
      <PageHeader
        title="Projects"
        subtitle="Manage your workspace projects, access team boards."
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeInTheDocument();
    expect(screen.getByText(/Manage your workspace/)).toBeInTheDocument();
  });

  it("renders an optional action", () => {
    render(<PageHeader title="Members" action={<Button>Invite Member</Button>} />);
    expect(screen.getByRole("button", { name: "Invite Member" })).toBeInTheDocument();
  });

  it("renders breadcrumbs when provided", () => {
    render(
      <PageHeader
        title="Organization Settings"
        breadcrumbs={[{ label: "Acme Design Studio", href: "/o" }, { label: "Settings" }]}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });

  it("omits breadcrumbs / action / subtitle when absent", () => {
    render(<PageHeader title="Bare" />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
