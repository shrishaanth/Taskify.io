import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./Select";

const OPTIONS = [
  { label: "Member", value: "member" },
  { label: "Admin", value: "admin" },
  { label: "Owner", value: "owner", disabled: true },
];

describe("Select", () => {
  it("renders options from the `options` prop", () => {
    render(<Select aria-label="role" options={OPTIONS} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByRole("option", { name: "Owner" })).toBeDisabled();
  });

  it("renders `<option>` children when no options prop is given", () => {
    render(
      <Select aria-label="r">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("fires onChange with the chosen value", async () => {
    const onChange = vi.fn();
    render(
      <Select aria-label="role" options={OPTIONS} defaultValue="member" onChange={onChange} />,
    );
    await userEvent.selectOptions(screen.getByRole("combobox"), "admin");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("combobox")).toHaveValue("admin");
  });

  it("renders a leading icon", () => {
    render(
      <Select aria-label="r" leadingIcon={<svg data-testid="person" />} options={OPTIONS} />,
    );
    expect(screen.getByTestId("person")).toBeInTheDocument();
  });

  it("reflects invalid + disabled", () => {
    render(<Select aria-label="r" options={OPTIONS} invalid disabled />);
    const el = screen.getByRole("combobox");
    expect(el).toHaveAttribute("aria-invalid", "true");
    expect(el).toBeDisabled();
  });
});
