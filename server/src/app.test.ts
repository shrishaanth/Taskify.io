import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp, INSTANCE_ID } from "./app.js";

describe("health endpoints", () => {
  it("GET /api/health reports liveness + the instance id", async () => {
    const res = await request(createApp()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", instanceId: INSTANCE_ID });
  });

  it("GET /api/ready is 200 while Mongo is connected (test setup connects it)", async () => {
    const res = await request(createApp()).get("/api/ready");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ready", mongo: true });
  });

  it("unknown routes return the standard 404 error shape", async () => {
    const res = await request(createApp()).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Route not found", code: "NOT_FOUND" });
  });
});
