import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../test/renderRoute";

describe("LoginPage", () => {
  it("renders the login form", () => {
    renderRoute("/login");
    expect(screen.getByText("Welcome back to your workspace!")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    renderRoute("/login");
    const pw = screen.getByLabelText("Password");
    expect(pw).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(pw).toHaveAttribute("type", "text");
  });

  it("logs in and lands on the org's projects", async () => {
    renderRoute("/login");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Projects" })).toBeInTheDocument();
  });

  it("links to signup", () => {
    renderRoute("/login");
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup");
  });
});

describe("SignupPage", () => {
  it("rejects a weak password with an inline error", async () => {
    renderRoute("/signup");
    await userEvent.type(screen.getByLabelText("Password"), "short");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
  });

  it("creates an account (no org) and lands on the welcome screen", async () => {
    renderRoute("/signup");
    await userEvent.type(screen.getByLabelText("Your Name"), "Jamie Fox");
    await userEvent.type(screen.getByLabelText("Email Address"), "jamie@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "supersecret");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("heading", { name: /Welcome to Taskify/ })).toBeInTheDocument();
  });
});

describe("WelcomePage", () => {
  it("offers the two onboarding choices, invite side disabled", () => {
    renderRoute("/welcome");
    expect(screen.getByRole("heading", { name: "Create an Organization" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Awaiting workspace approval" }),
    ).toBeDisabled();
  });

  it("creates an organization and routes into its projects", async () => {
    renderRoute("/welcome");
    await userEvent.click(screen.getByRole("button", { name: "Create Organization" }));
    await userEvent.type(
      screen.getByLabelText("Organization Name"),
      "Pixel Forge",
    );
    await userEvent.click(screen.getByRole("button", { name: "Create Workspace" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Projects" })).toBeInTheDocument();
    // brand-new org has no projects
    expect(screen.getByText("No projects yet")).toBeInTheDocument();
  });
});
