import { describe, it, expect } from "vitest";
import { labelToneFor } from "./labelColor";

describe("labelToneFor", () => {
  it("is deterministic per label", () => {
    expect(labelToneFor("Design")).toBe(labelToneFor("Design"));
    expect(labelToneFor("Bug")).toBe(labelToneFor("Bug"));
  });
  it("returns a valid tone", () => {
    const valid = [
      "sky",
      "violet",
      "green",
      "amber",
      "red",
      "purple",
      "pink",
      "slate",
    ];
    for (const l of ["Design", "Bug", "Marketing", "Research", "Docs", "Q1"]) {
      expect(valid).toContain(labelToneFor(l));
    }
  });
});
