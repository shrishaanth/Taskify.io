import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod";
import { errorHandler, notFoundHandler } from "./errorHandler.js";
import { AppError } from "../lib/errors.js";

function appThatThrows(fn: () => void) {
  const a = express();
  a.get("/x", (_req, _res, next) => {
    try {
      fn();
      next();
    } catch (e) {
      next(e);
    }
  });
  a.use(errorHandler);
  return a;
}

describe("errorHandler", () => {
  it("renders an AppError as { message, code }", async () => {
    const res = await request(
      appThatThrows(() => {
        throw AppError.forbidden("no way");
      }),
    ).get("/x");
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "no way", code: "FORBIDDEN" });
  });

  it("renders a ZodError as a 400 VALIDATION_ERROR", async () => {
    const res = await request(
      appThatThrows(() => {
        z.object({ n: z.number() }).parse({ n: "x" });
      }),
    ).get("/x");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.details).toBeDefined();
  });

  it("maps a Mongo duplicate-key error to 409 CONFLICT", async () => {
    const dupKey = Object.assign(new Error("E11000"), { code: 11000 });
    const res = await request(
      appThatThrows(() => {
        throw dupKey;
      }),
    ).get("/x");
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CONFLICT");
  });

  it("hides unexpected errors behind a 500 INTERNAL and logs them", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(
      appThatThrows(() => {
        throw new Error("boom secret detail");
      }),
    ).get("/x");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Internal server error", code: "INTERNAL" });
    expect(JSON.stringify(res.body)).not.toContain("secret detail");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("notFoundHandler ends unmatched routes with a 404", async () => {
    const a = express();
    a.use(notFoundHandler);
    a.use(errorHandler);
    const res = await request(a).get("/anything");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
