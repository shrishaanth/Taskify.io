import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("exposes a status role with a default accessible name", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toHaveAccessibleName("Loading");
  });

  it("uses a custom label", () => {
    render(<Spinner label="Saving changes" />);
    expect(screen.getByRole("status")).toHaveAccessibleName("Saving changes");
  });

  it.each(["sm", "md", "lg"] as const)("renders the %s size", (size) => {
    render(<Spinner size={size} label={`s-${size}`} />);
    expect(screen.getByRole("status")).toHaveAttribute("data-size", size);
  });

  it("defaults to the md size", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toHaveAttribute("data-size", "md");
  });
});
