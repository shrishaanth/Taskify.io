import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateField } from "./DateField";

describe("DateField", () => {
  it("shows the ISO value as a yyyy-mm-dd date input", () => {
    render(<DateField value="2026-10-24T00:00:00.000Z" onChange={() => {}} />);
    expect(screen.getByLabelText("Due date")).toHaveValue("2026-10-24");
  });

  it("emits an ISO string when a date is picked", async () => {
    const onChange = vi.fn();
    render(<DateField onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Due date"), "2026-11-05");
    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining("2026-11-05"));
  });

  it("emits null when cleared", async () => {
    const onChange = vi.fn();
    render(<DateField value="2026-10-24T00:00:00.000Z" onChange={onChange} />);
    await userEvent.clear(screen.getByLabelText("Due date"));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
