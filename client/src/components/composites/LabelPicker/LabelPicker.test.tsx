import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabelPicker } from "./LabelPicker";

function Harness({ initial = ["Marketing", "Design"] }: { initial?: string[] }) {
  const [labels, setLabels] = useState(initial);
  return <LabelPicker labels={labels} onChange={setLabels} />;
}

describe("LabelPicker", () => {
  it("renders a removable chip per label", () => {
    render(<Harness />);
    expect(screen.getByText("Marketing")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Design" })).toBeInTheDocument();
  });

  it("removes a label", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Remove Marketing" }));
    expect(screen.queryByText("Marketing")).not.toBeInTheDocument();
  });

  it("adds a new label via the + affordance", async () => {
    render(<Harness initial={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Add label" }));
    await userEvent.type(screen.getByLabelText("New label"), "Q1{Enter}");
    expect(screen.getByText("Q1")).toBeInTheDocument();
  });

  it("does not add a duplicate label", async () => {
    const onChange = vi.fn();
    render(<LabelPicker labels={["Design"]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Add label" }));
    await userEvent.type(screen.getByLabelText("New label"), "Design{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("is read-only when canEdit is false", () => {
    render(<LabelPicker labels={["Design"]} onChange={() => {}} canEdit={false} />);
    expect(screen.queryByRole("button", { name: "Remove Design" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add label" })).not.toBeInTheDocument();
  });
});
