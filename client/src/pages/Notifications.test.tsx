import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../test/renderRoute";
import { db } from "../test/fakeApi";

/** Push `n` extra unread notifications so the list spans multiple pages. */
function seedManyNotifications(n: number) {
  for (let i = 0; i < n; i++) {
    db.notifications.push({
      id: `bulk-${i}`,
      type: "card_assigned",
      title: `Bulk notification ${i}`,
      createdAt: new Date(Date.now() - i * 60_000).toISOString(),
      read: false,
    });
  }
}

describe("Notification bell — infinite scroll", () => {
  it("loads the first page, then fetches more on demand", async () => {
    renderRoute("/orgs/org-acme/projects", {
      seed: () => seedManyNotifications(30),
    });

    await userEvent.click(
      await screen.findByRole("button", { name: /Notifications/ }),
    );
    const panel = await screen.findByRole("dialog", { name: "Notifications" });

    // page 1 = 20 items, so "Bulk notification 25" is not shown yet
    expect(within(panel).getByText("Bulk notification 0")).toBeInTheDocument();
    expect(
      within(panel).queryByText("Bulk notification 25"),
    ).not.toBeInTheDocument();

    await userEvent.click(
      within(panel).getByRole("button", { name: "Load more" }),
    );

    expect(
      await within(panel).findByText("Bulk notification 25"),
    ).toBeInTheDocument();
    // all pages loaded -> the control is gone
    expect(
      within(panel).queryByRole("button", { name: /Load more/ }),
    ).not.toBeInTheDocument();
  });
});
