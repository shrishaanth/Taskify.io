import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod";
import { validate } from "./validate.js";
import { errorHandler } from "./errorHandler.js";

describe("validate", () => {
  it("400s with VALIDATION_ERROR + details on a bad body", async () => {
    const a = express();
    a.use(express.json());
    a.post(
      "/x",
      validate({ body: z.object({ name: z.string().min(1) }) }),
      (_req, res) => res.json({ ok: true }),
    );
    a.use(errorHandler);

    const res = await request(a).post("/x").send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.details).toBeDefined();
  });

  it("passes a valid body straight through", async () => {
    const a = express();
    a.use(express.json());
    a.post(
      "/x",
      validate({ body: z.object({ name: z.string().min(1) }) }),
      (req, res) => res.json(req.body),
    );
    a.use(errorHandler);

    const res = await request(a).post("/x").send({ name: "Taskify" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: "Taskify" });
  });

  it("writes coerced query values back onto the request", async () => {
    const a = express();
    a.get(
      "/x",
      validate({
        query: z.object({
          page: z.coerce.number().int().default(1),
          limit: z.coerce.number().int().default(20),
        }),
      }),
      (req, res) => res.json(req.query),
    );
    a.use(errorHandler);

    const res = await request(a).get("/x?page=3");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ page: 3, limit: 20 });
  });

  it("validates params too", async () => {
    const a = express();
    a.get(
      "/x/:id",
      validate({ params: z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) }) }),
      (_req, res) => res.json({ ok: true }),
    );
    a.use(errorHandler);
    expect((await request(a).get("/x/short")).status).toBe(400);
    expect((await request(a).get("/x/64b7f0000000000000000000")).status).toBe(200);
  });
});
