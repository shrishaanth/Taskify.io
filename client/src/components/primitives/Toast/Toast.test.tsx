import { describe, it, expect, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toast } from "./Toast";
import { ToastProvider } from "./ToastProvider";
import { useToast } from "./useToast";

describe("Toast (presentational)", () => {
  it("renders title and description", () => {
    render(<Toast title="Saved" description="Your changes are live" />);
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Your changes are live")).toBeInTheDocument();
  });

  it("uses role=status for info/success and role=alert for error", () => {
    const { rerender } = render(<Toast tone="success" title="ok" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<Toast tone="error" title="bad" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("fires onDismiss", async () => {
    const onDismiss = vi.fn();
    render(<Toast title="x" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("has no dismiss button without onDismiss", () => {
    render(<Toast title="x" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

function Trigger() {
  const { show } = useToast();
  return (
    <button
      onClick={() =>
        show({ tone: "success", title: "Board created", description: "Sprint Backlog" })
      }
    >
      go
    </button>
  );
}

describe("ToastProvider + useToast", () => {
  it("throws when useToast is used outside a provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Trigger />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });

  it("shows a toast on demand and auto-dismisses after the duration", () => {
    vi.useFakeTimers();
    try {
      render(
        <ToastProvider defaultDuration={3000}>
          <Trigger />
        </ToastProvider>,
      );
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "go" }));
      });
      expect(screen.getByText("Board created")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.queryByText("Board created")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("can be dismissed manually before the timeout", async () => {
    render(
      <ToastProvider defaultDuration={0}>
        <Trigger />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "go" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    expect(screen.queryByText("Board created")).not.toBeInTheDocument();
  });

  it("stacks multiple toasts inside a live region", async () => {
    render(
      <ToastProvider defaultDuration={0}>
        <Trigger />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "go" }));
    await userEvent.click(screen.getByRole("button", { name: "go" }));
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(region.querySelectorAll("[data-tone]")).toHaveLength(2);
  });
});
