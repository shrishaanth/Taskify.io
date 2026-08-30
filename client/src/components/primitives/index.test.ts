import { describe, it, expect } from "vitest";
import * as primitives from "./index";

describe("primitives barrel", () => {
  it("exports every Phase 2 primitive", () => {
    const expected = [
      "Button",
      "IconButton",
      "Input",
      "Textarea",
      "Select",
      "Checkbox",
      "Avatar",
      "AvatarGroup",
      "Badge",
      "Chip",
      "AddChip",
      "Surface",
      "Modal",
      "ProgressBar",
      "Spinner",
      "Skeleton",
      "Divider",
      "Tabs",
      "Breadcrumbs",
      "Menu",
      "Toast",
      "ToastProvider",
      "useToast",
      "initialsFromName",
      "toneFromName",
    ];
    for (const name of expected) {
      expect(primitives, name).toHaveProperty(name);
      const value = (primitives as Record<string, unknown>)[name];
      // plain components are functions; forwardRef components are objects
      expect(["function", "object"], name).toContain(typeof value);
      expect(value, name).toBeTruthy();
    }
  });
});
