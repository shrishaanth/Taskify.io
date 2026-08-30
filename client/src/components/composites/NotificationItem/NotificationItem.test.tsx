import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationItem } from "./NotificationItem";
import type { AppNotification } from "../../../types/domain";

const NOW = new Date("2026-08-30T12:00:00Z");

const make = (over: Partial<AppNotification> = {}): AppNotification => ({
  id: "n1",
  type: "card_assigned",
  title: 'You were assigned to "Homepage Redesign"',
  createdAt: "2026-08-30T11:58:00Z",
  read: false,
  ...over,
});

describe("NotificationItem", () => {
  it("renders title + relative time", () => {
    render(<NotificationItem notification={make()} now={NOW} />);
    expect(screen.getByText(/Homepage Redesign/)).toBeInTheDocument();
    expect(screen.getByText("2 minutes ago")).toBeInTheDocument();
  });

  it("shows the unread treatment + dot", () => {
    render(<NotificationItem notification={make({ read: false })} now={NOW} />);
    expect(screen.getByRole("button")).toHaveAttribute("data-unread", "true");
    expect(screen.getByLabelText("Unread")).toBeInTheDocument();
  });

  it("shows the read treatment (no dot)", () => {
    render(<NotificationItem notification={make({ read: true })} now={NOW} />);
    expect(screen.getByRole("button")).toHaveAttribute("data-unread", "false");
    expect(screen.queryByLabelText("Unread")).not.toBeInTheDocument();
  });

  it.each([
    "card_assigned",
    "comment_mention",
    "role_changed",
    "due_soon",
  ] as const)("renders an icon for %s", (type) => {
    render(<NotificationItem notification={make({ type })} now={NOW} />);
    expect(screen.getByRole("button")).toHaveAttribute("data-type", type);
  });

  it("fires onClick", async () => {
    const onClick = vi.fn();
    render(<NotificationItem notification={make()} onClick={onClick} now={NOW} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
