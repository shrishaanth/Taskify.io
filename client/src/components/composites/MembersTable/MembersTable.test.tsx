import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MembersTable } from "./MembersTable";
import type { OrgMemberRow, ProjectMemberRow } from "../../../types/domain";

const orgMembers: OrgMemberRow[] = [
  { user: { id: "u1", name: "Anna Vance", email: "anna@acme.com" }, role: "owner" },
  { user: { id: "u2", name: "Sarah Chen", email: "sarah@acme.com" }, role: "admin" },
  { user: { id: "u3", name: "Ben Johnson", email: "ben@acme.com" }, role: "member" },
];

const projMembers: ProjectMemberRow[] = [
  { user: { id: "u1", name: "Alex Rivera", email: "alex@acme.com" }, role: "head" },
  { user: { id: "u2", name: "Sarah Chen", email: "sarah@acme.com" }, role: "member" },
];

describe("MembersTable — permission-driven rendering", () => {
  it("org: a plain Member sees roles but no manage controls", () => {
    render(
      <MembersTable
        scope="org"
        members={orgMembers}
        viewer={{ projectRole: null, orgRole: "member" }}
      />,
    );
    expect(screen.getByText("OWNER")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Remove/ })).not.toBeInTheDocument();
  });

  it("org: an Admin sees remove + editable role controls", () => {
    render(
      <MembersTable
        scope="org"
        members={orgMembers}
        viewer={{ projectRole: null, orgRole: "admin" }}
        onChangeRole={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Remove Ben Johnson" })).toBeEnabled();
  });

  it("project: a plain Member cannot manage; a Head can", () => {
    const { rerender } = render(
      <MembersTable
        scope="project"
        members={projMembers}
        viewer={{ projectRole: "member", orgRole: "member" }}
        onRemove={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: /^Remove/ })).not.toBeInTheDocument();

    rerender(
      <MembersTable
        scope="project"
        members={projMembers}
        viewer={{ projectRole: "head", orgRole: "member" }}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Remove Sarah Chen" })).toBeInTheDocument();
  });

  it("project: an Org Owner/Admin can manage even without a project role (FR-2.7)", () => {
    render(
      <MembersTable
        scope="project"
        members={projMembers}
        viewer={{ projectRole: null, orgRole: "admin" }}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Remove Alex Rivera" })).toBeInTheDocument();
  });
});

describe("MembersTable — actions + last-owner guard", () => {
  it("locks role change + removal for the sole remaining Owner (FR-1.6)", () => {
    render(
      <MembersTable
        scope="org"
        members={orgMembers}
        viewer={{ projectRole: null, orgRole: "owner" }}
        onChangeRole={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Remove Anna Vance" })).toBeDisabled();
    // the sole owner's role renders as a static badge, not an editable trigger
    const ownerCell = screen.getByText("OWNER").closest("td")!;
    expect(within(ownerCell).queryByRole("button")).not.toBeInTheDocument();
  });

  it("fires onRemove / onChangeRole with the user id", async () => {
    const onRemove = vi.fn();
    const onChangeRole = vi.fn();
    render(
      <MembersTable
        scope="org"
        members={orgMembers}
        viewer={{ projectRole: null, orgRole: "owner" }}
        onChangeRole={onChangeRole}
        onRemove={onRemove}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Remove Ben Johnson" }));
    expect(onRemove).toHaveBeenCalledWith("u3");

    await userEvent.click(screen.getByRole("button", { name: /Member — change role/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Admin" }));
    expect(onChangeRole).toHaveBeenCalledWith("u3", "admin");
  });
});
