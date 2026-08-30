import { describe, it, expect } from "vitest";
import { AppError } from "./errors.js";

describe("AppError", () => {
  it("maps codes to the spec's status codes (§8)", () => {
    expect(AppError.validation("x").status).toBe(400);
    expect(AppError.unauthenticated().status).toBe(401);
    expect(AppError.forbidden().status).toBe(403);
    expect(AppError.notFound().status).toBe(404);
    expect(AppError.conflict("x").status).toBe(409);
    expect(new AppError("INTERNAL", "x").status).toBe(500);
  });

  it("serialises to { message, code } and adds details only when present", () => {
    expect(AppError.forbidden("nope").toBody()).toEqual({
      message: "nope",
      code: "FORBIDDEN",
    });
    expect(AppError.validation("bad", { field: ["required"] }).toBody()).toEqual({
      message: "bad",
      code: "VALIDATION_ERROR",
      details: { field: ["required"] },
    });
  });

  it("is a real Error", () => {
    expect(AppError.notFound()).toBeInstanceOf(Error);
  });
});
