import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { Avatar } from "./Avatar";
import { initialsFromName, toneFromName } from "./avatarUtils";

describe("initialsFromName", () => {
  it("takes first + last initial for multi-word names", () => {
    expect(initialsFromName("Alex Rivera")).toBe("AR");
    expect(initialsFromName("Mary Jane Watson")).toBe("MW");
  });
  it("takes the first two letters of a single word", () => {
    expect(initialsFromName("Taskify")).toBe("TA");
    expect(initialsFromName("x")).toBe("X");
  });
  it("handles blank input", () => {
    expect(initialsFromName("   ")).toBe("?");
  });
});

describe("toneFromName", () => {
  it("is deterministic", () => {
    expect(toneFromName("Sarah Chen")).toBe(toneFromName("Sarah Chen"));
  });
});

describe("Avatar", () => {
  it("renders an image when src is given, with alt = name", () => {
    render(<Avatar name="Alex Rivera" src="/a.png" />);
    const img = screen.getByRole("img", { name: "Alex Rivera" });
    expect(img).toBeInstanceOf(HTMLImageElement);
    expect(screen.getByTestId("avatar")).toHaveAttribute("data-size", "md");
  });

  it("falls back to initials when the image fails to load", () => {
    render(<Avatar name="Sarah Chen" src="/broken.png" />);
    fireEvent.error(screen.getByRole("img", { name: "Sarah Chen" }));
    expect(screen.getByTestId("avatar-initials")).toHaveTextContent("SC");
  });

  it("renders initials when there is no src", () => {
    render(<Avatar name="David Kim" />);
    const el = screen.getByRole("img", { name: "David Kim" });
    expect(el).not.toBeInstanceOf(HTMLImageElement);
    expect(el).toHaveTextContent("DK");
  });

  it("gives the same name a stable tone across renders", () => {
    const { rerender } = render(<Avatar name="Emma Watson" />);
    const first = screen.getByTestId("avatar-initials").getAttribute("data-tone");
    rerender(<Avatar name="Emma Watson" />);
    expect(screen.getByTestId("avatar-initials").getAttribute("data-tone")).toBe(
      first,
    );
  });

  it.each(["xs", "sm", "md", "lg"] as const)("supports the %s size", (size) => {
    render(<Avatar name="A B" size={size} />);
    expect(screen.getByTestId("avatar")).toHaveAttribute("data-size", size);
  });

  it("shows a status dot only when requested", () => {
    const { rerender } = render(<Avatar name="A B" />);
    expect(screen.queryByTestId("avatar-status")).not.toBeInTheDocument();
    rerender(<Avatar name="A B" showStatus status="online" />);
    expect(screen.getByTestId("avatar-status")).toHaveAttribute(
      "data-status",
      "online",
    );
  });
});
