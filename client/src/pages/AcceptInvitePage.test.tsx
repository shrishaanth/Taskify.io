import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../test/renderRoute";

describe("AcceptInvitePage", () => {
  it("a brand-new invitee sets a password and lands in the org (UC-2 3a)", async () => {
    renderRoute("/invite/seed-invite-token", { anonymous: true });

    await userEvent.type(await screen.findByLabelText("Your Name"), "Pat Doe");
    await userEvent.type(screen.getByLabelText("Password"), "supersecret1");
    await userEvent.click(
      screen.getByRole("button", { name: "Join organization" }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Projects" }),
    ).toBeInTheDocument();
  });

  it("an existing user accepts an invite into a new org and is routed there", async () => {
    renderRoute("/invite/bright-invite-token", { as: "u-sarah" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Projects" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("No projects yet")).toBeInTheDocument();
  });

  it("shows an error when the signed-in email does not match the invite", async () => {
    renderRoute("/invite/seed-invite-token", { as: "u-alex" });

    expect(
      await screen.findByText(/different email address/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to log in" }),
    ).toBeInTheDocument();
  });

  it("shows an error for an unknown or used token", async () => {
    renderRoute("/invite/does-not-exist", { anonymous: true });
    await userEvent.type(await screen.findByLabelText("Your Name"), "Nobody");
    await userEvent.type(screen.getByLabelText("Password"), "supersecret1");
    await userEvent.click(
      screen.getByRole("button", { name: "Join organization" }),
    );
    expect(
      await screen.findByText(/invalid or has already been used/i),
    ).toBeInTheDocument();
  });
});
