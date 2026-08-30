import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "./SearchInput";

describe("SearchInput", () => {
  it("renders a search landmark with a labelled field", () => {
    render(<SearchInput placeholder="Search projects…" aria-label="Search projects" />);
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search projects" })).toBeInTheDocument();
  });

  it("reports each keystroke via onChange", async () => {
    function Wrap() {
      const [v, setV] = useState("");
      return (
        <>
          <SearchInput value={v} onChange={setV} aria-label="s" />
          <output>{v}</output>
        </>
      );
    }
    render(<Wrap />);
    await userEvent.type(screen.getByRole("searchbox"), "kanban");
    expect(screen.getByText("kanban")).toBeInTheDocument();
  });

  it("calls onSearch on submit (Enter)", async () => {
    const onSearch = vi.fn();
    render(<SearchInput defaultValue="boards" onSearch={onSearch} aria-label="s" />);
    await userEvent.type(screen.getByRole("searchbox"), "{Enter}");
    expect(onSearch).toHaveBeenCalledWith("boards");
  });
});
