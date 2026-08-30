import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RichTextToolbar } from "./RichTextToolbar";

describe("RichTextToolbar", () => {
  it("renders a toolbar with the four formatting controls", () => {
    render(<RichTextToolbar onCommand={() => {}} />);
    const bar = screen.getByRole("toolbar", { name: "Text formatting" });
    expect(bar).toBeInTheDocument();
    for (const name of ["Bold", "Italic", "Bulleted list", "Insert link"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("emits the matching command", async () => {
    const onCommand = vi.fn();
    render(<RichTextToolbar onCommand={onCommand} />);
    await userEvent.click(screen.getByRole("button", { name: "Bold" }));
    await userEvent.click(screen.getByRole("button", { name: "Bulleted list" }));
    expect(onCommand).toHaveBeenNthCalledWith(1, "bold");
    expect(onCommand).toHaveBeenNthCalledWith(2, "bulletList");
  });

  it("can be disabled", async () => {
    const onCommand = vi.fn();
    render(<RichTextToolbar onCommand={onCommand} disabled />);
    await userEvent.click(screen.getByRole("button", { name: "Italic" }));
    expect(onCommand).not.toHaveBeenCalled();
  });
});
