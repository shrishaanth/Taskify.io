import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrgSwitcher } from "./OrgSwitcher";
import type { OrgSummary } from "../../../types/domain";

const orgs: OrgSummary[] = [
  { id: "o1", name: "Acme Design Studio", slug: "acme", role: "owner" },
  { id: "o2", name: "Bright Labs", slug: "bright", role: "member" },
];

describe("OrgSwitcher", () => {
  it("shows the current org name and initial", () => {
    render(<OrgSwitcher orgs={orgs} currentOrgId="o1" onSwitch={() => {}} />);
    const trigger = screen.getByRole("button", { name: /acme design studio/i });
    expect(trigger).toHaveTextContent("A");
  });

  it("lists every org and switches on select", async () => {
    const onSwitch = vi.fn();
    render(<OrgSwitcher orgs={orgs} currentOrgId="o1" onSwitch={onSwitch} />);
    await userEvent.click(screen.getByRole("button", { name: /acme design studio/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: /bright labs/i }));
    expect(onSwitch).toHaveBeenCalledWith("o2");
  });

  it("offers Create Organization only when onCreate is given", async () => {
    const onCreate = vi.fn();
    const { rerender } = render(
      <OrgSwitcher orgs={orgs} currentOrgId="o1" onSwitch={() => {}} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /acme/i }));
    expect(
      screen.queryByRole("menuitem", { name: "Create Organization" }),
    ).not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");

    rerender(
      <OrgSwitcher orgs={orgs} currentOrgId="o1" onSwitch={() => {}} onCreate={onCreate} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /acme/i }));
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Create Organization" }),
    );
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
