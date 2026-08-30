import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
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

  it("invites a new member through the modal", async () => {
    renderRoute("/orgs/org-acme/members");
    await userEvent.click(
      await screen.findByRole("button", { name: "+ Invite Member" }),
    );
    await userEvent.type(
      screen.getByLabelText("Email Address"),
      "new.hire@acme.com",
    );
    await userEvent.click(screen.getByRole("button", { name: "Send Invite" }));
    expect(
      await screen.findByRole("cell", { name: "new.hire@acme.com" }),
    ).toBeInTheDocument();
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
    expect(
      screen.getByRole("button", { name: "Delete Organization" }),
    ).toBeDisabled();
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
