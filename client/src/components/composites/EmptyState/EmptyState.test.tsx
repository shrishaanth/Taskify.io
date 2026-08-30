import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "./EmptyState";
import { Button } from "../../primitives/Button/Button";

describe("EmptyState", () => {
  it("renders icon, title, description", () => {
    render(
      <EmptyState
        icon={<svg data-testid="ic" />}
        title="No projects yet"
        description="Create your first project to get started."
      />,
    );
    expect(screen.getByRole("heading", { name: "No projects yet" })).toBeInTheDocument();
    expect(screen.getByText(/Create your first project/)).toBeInTheDocument();
    expect(screen.getByTestId("ic")).toBeInTheDocument();
  });

  it.each(["sky", "red", "slate"] as const)("supports the %s tone", (tone) => {
    render(<EmptyState icon={<svg />} title="t" tone={tone} />);
    expect(screen.getByRole("status")).toHaveAttribute("data-tone", tone);
  });

  it("renders action buttons and wires their handlers", async () => {
    const onA = vi.fn();
    const onB = vi.fn();
    render(
      <EmptyState
        icon={<svg />}
        title="You don't have access to this project"
        actions={
          <>
            <Button onClick={onA}>Request Access</Button>
            <Button variant="secondary" onClick={onB}>
              Back to Projects
            </Button>
          </>
        }
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Request Access" }));
    await userEvent.click(screen.getByRole("button", { name: "Back to Projects" }));
    expect(onA).toHaveBeenCalledTimes(1);
    expect(onB).toHaveBeenCalledTimes(1);
  });

  it("omits description and actions when not provided", () => {
    render(<EmptyState icon={<svg />} title="All caught up" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
