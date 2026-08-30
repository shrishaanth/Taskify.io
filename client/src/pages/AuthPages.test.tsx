import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../test/renderRoute";

describe("LoginPage", () => {
  it("renders the login form (anonymous)", () => {
    renderRoute("/login", { anonymous: true });
    expect(screen.getByText("Welcome back to your workspace!")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    renderRoute("/login", { anonymous: true });
    const pw = screen.getByLabelText("Password");
    expect(pw).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(pw).toHaveAttribute("type", "text");
  });

  it("logs in with real credentials and lands on the org's projects", async () => {
    renderRoute("/login", { anonymous: true });
    await userEvent.type(screen.getByLabelText("Email Address"), "u-alex@acme.test");
    await userEvent.type(screen.getByLabelText("Password"), "supersecret1");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Projects" }),
    ).toBeInTheDocument();
  });

  it("shows an inline error on bad credentials", async () => {
    renderRoute("/login", { anonymous: true });
    await userEvent.type(screen.getByLabelText("Email Address"), "u-alex@acme.test");
    await userEvent.type(screen.getByLabelText("Password"), "wrongwrong");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(
      await screen.findByText("Invalid email or password."),
    ).toBeInTheDocument();
  });
});

describe("SignupPage", () => {
  it("rejects a weak password with an inline error", async () => {
    renderRoute("/signup", { anonymous: true });
    await userEvent.type(screen.getByLabelText("Password"), "short");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      screen.getByText("Password must be at least 8 characters."),
    ).toBeInTheDocument();
  });

  it("creates an account (no org) and lands on the welcome screen", async () => {
    renderRoute("/signup", { anonymous: true });
    await userEvent.type(screen.getByLabelText("Your Name"), "Jamie Fox");
    await userEvent.type(
      screen.getByLabelText("Email Address"),
      "jamie@example.com",
    );
    await userEvent.type(screen.getByLabelText("Password"), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      await screen.findByRole("heading", { name: /Welcome to Taskify/ }),
    ).toBeInTheDocument();
  });
});

describe("WelcomePage", () => {
  it("offers the two onboarding choices, invite side disabled", async () => {
    renderRoute("/signup", { anonymous: true });
    await userEvent.type(screen.getByLabelText("Your Name"), "Jamie Fox");
    await userEvent.type(
      screen.getByLabelText("Email Address"),
      "jamie2@example.com",
    );
    await userEvent.type(screen.getByLabelText("Password"), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByRole("heading", { name: "Create an Organization" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Awaiting workspace approval" }),
    ).toBeDisabled();
  });

  it("renders the top nav in the zero-org state (no switcher, has account menu)", async () => {
    renderRoute("/welcome", { as: "u-noorg" }); // belongs to no organization

    // the nav is present…
    expect(await screen.findByText("Taskify")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Account: Nadia Ortiz" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /notifications/i }),
    ).toBeInTheDocument();
    // …but there's no org to switch to
    expect(screen.queryByText("Select organization")).not.toBeInTheDocument();

    // the logo is a working link out
    await userEvent.click(screen.getByRole("button", { name: "Taskify home" }));
    expect(
      await screen.findByRole("heading", { name: /Welcome to Taskify/ }),
    ).toBeInTheDocument();
  });

  it("shows a pending invite to an org-less user and accepts it", async () => {
    // u-noorg belongs to no org but has a seeded pending invite to Acme.
    renderRoute("/welcome", { as: "u-noorg" });

    const inviteCard = await screen.findByRole("heading", {
      name: "You have an invitation",
    });
    expect(inviteCard).toBeInTheDocument();
    expect(screen.getByText("Acme Design Studio")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Accept" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Projects" }),
    ).toBeInTheDocument();
  });

  it("creates an organization and routes into its (empty) projects", async () => {
    renderRoute("/signup", { anonymous: true });
    await userEvent.type(screen.getByLabelText("Your Name"), "Pat Lee");
    await userEvent.type(screen.getByLabelText("Email Address"), "pat@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    await userEvent.click(
      await screen.findByRole("button", { name: "Create Organization" }),
    );
    await userEvent.type(
      screen.getByLabelText("Organization Name"),
      "Pixel Forge",
    );
    await userEvent.click(screen.getByRole("button", { name: "Create Workspace" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Projects" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("No projects yet")).toBeInTheDocument();
  });
});
