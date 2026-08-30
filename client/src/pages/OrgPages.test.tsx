import { describe, it, expect } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../test/renderRoute";

describe("OrgMembersPage", () => {
  it("lists org members with editable roles for an Owner", async () => {
    renderRoute("/orgs/org-acme/members");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Members" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("cell", { name: "u-sarah@acme.test" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove Marcus Vance" }),
    ).toBeInTheDocument();
  });

  it("changes a member's role", async () => {
    renderRoute("/orgs/org-acme/members");
    const row = (await screen.findByText("Marcus Vance")).closest("tr")!;
    expect(within(row).getByText("MEMBER")).toBeInTheDocument();
    await userEvent.click(
      within(row).getByRole("button", { name: "Member — change role" }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Admin" }));
    expect(await within(row).findByText("ADMIN")).toBeInTheDocument();
  });

  it("removes a member", async () => {
    renderRoute("/orgs/org-acme/members");
    await userEvent.click(
      await screen.findByRole("button", { name: "Remove David Kim" }),
    );
    expect(
      screen.queryByRole("cell", { name: "u-david@acme.test" }),
    ).not.toBeInTheDocument();
  });

  it("creates a pending invite through the modal (no immediate membership)", async () => {
    renderRoute("/orgs/org-acme/members");
    await userEvent.click(
      await screen.findByRole("button", { name: "+ Invite Member" }),
    );
    await userEvent.type(
      screen.getByLabelText("Email Address"),
      "new.hire@acme.com",
    );
    await userEvent.click(screen.getByRole("button", { name: "Send Invite" }));

    // shows up under Pending Invitations, not as a full member row
    const pending = await screen.findByRole("region", {
      name: "Pending invitations",
    });
    expect(
      await within(pending).findByText("new.hire@acme.com"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("cell", { name: "new.hire@acme.com" }),
    ).not.toBeInTheDocument();
  });

  it("lists seeded pending invites and can revoke one", async () => {
    renderRoute("/orgs/org-acme/members");
    const pending = await screen.findByRole("region", {
      name: "Pending invitations",
    });
    expect(
      within(pending).getByText("pending.hire@acme.test"),
    ).toBeInTheDocument();
    await userEvent.click(
      within(pending).getByRole("button", {
        name: "Revoke pending.hire@acme.test",
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByText("pending.hire@acme.test"),
      ).not.toBeInTheDocument(),
    );
  });

  it("hides the invite controls from a plain member", async () => {
    renderRoute("/orgs/org-acme/members", { as: "u-marcus" });
    await screen.findByRole("heading", { level: 1, name: "Members" });
    expect(
      screen.queryByRole("button", { name: "+ Invite Member" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Pending invitations" }),
    ).not.toBeInTheDocument();
  });
});

describe("OrgSettingsPage", () => {
  it("renders the name form and a disabled Danger Zone delete", async () => {
    renderRoute("/orgs/org-acme/settings");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Organization Settings",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Organization Name")).toHaveValue(
      "Acme Design Studio",
    );
    // Alex is an Owner -> Delete is enabled
    expect(
      screen.getByRole("button", { name: "Delete Organization" }),
    ).toBeEnabled();
  });

  it("disables Delete Organization for a non-Owner", async () => {
    renderRoute("/orgs/org-acme/settings", { as: "u-sarah" }); // admin
    expect(
      await screen.findByRole("button", { name: "Delete Organization" }),
    ).toBeDisabled();
  });

  it("deletes the organization after typing its name to confirm", async () => {
    renderRoute("/orgs/org-acme/settings");
    await userEvent.click(
      await screen.findByRole("button", { name: "Delete Organization" }),
    );
    const confirm = await screen.findByLabelText(
      "Type the organization name to confirm",
    );
    const deleteBtn = screen.getByRole("button", { name: "Delete forever" });
    expect(deleteBtn).toBeDisabled();
    await userEvent.type(confirm, "Acme Design Studio");
    expect(deleteBtn).toBeEnabled();
    await userEvent.click(deleteBtn);
    expect(await screen.findByText("Organization deleted")).toBeInTheDocument();
  });

  it("saves a new organization name and shows a toast", async () => {
    renderRoute("/orgs/org-acme/settings");
    const field = await screen.findByLabelText("Organization Name");
    await userEvent.clear(field);
    await userEvent.type(field, "Acme Studios");
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(await screen.findByText("Organization updated")).toBeInTheDocument();
  });

  it("keeps Save disabled until the name changes", async () => {
    renderRoute("/orgs/org-acme/settings");
    await screen.findByLabelText("Organization Name");
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();
  });
});
