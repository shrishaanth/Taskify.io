import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DangerZone } from "./DangerZone";

describe("DangerZone", () => {
  it("renders a labelled section with a danger action", () => {
    render(
      <DangerZone
        description="Permanently delete this organization and all its data. This action is irreversible."
        actionLabel="Delete Organization"
        helperText="Requires no other Owners"
        onAction={() => {}}
      />,
    );
    expect(screen.getByRole("region", { name: "Danger Zone" })).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: "Delete Organization" });
    expect(btn).toHaveAttribute("data-variant", "danger");
    expect(screen.getByText("Requires no other Owners")).toBeInTheDocument();
  });

  it("fires onAction", async () => {
    const onAction = vi.fn();
    render(
      <DangerZone description="x" actionLabel="Delete" onAction={onAction} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("can render the action disabled (C3 — no delete-org endpoint in scope)", async () => {
    const onAction = vi.fn();
    render(
      <DangerZone
        description="x"
        actionLabel="Delete Organization"
        disabled
        onAction={onAction}
      />,
    );
    const btn = screen.getByRole("button", { name: "Delete Organization" });
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onAction).not.toHaveBeenCalled();
  });
});
