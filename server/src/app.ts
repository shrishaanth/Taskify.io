import { randomUUID } from "node:crypto";
import cors from "cors";
import express, { type Express } from "express";
import { config } from "./config/index.js";
import { isMongoConnected } from "./db/mongoose.js";
import { errorHandler, notFoundHandler } from "./middleware/index.js";

/** Stable per-process id, surfaced by the health endpoints (NFR-3.1). */
export const INSTANCE_ID = randomUUID();

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }));

  // Liveness — process is up.
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", instanceId: INSTANCE_ID });
  });

  // Readiness — can serve traffic (Mongo reachable).
  app.get("/api/ready", (_req, res) => {
    const ready = isMongoConnected();
    res
      .status(ready ? 200 : 503)
      .json({ status: ready ? "ready" : "not-ready", mongo: ready });
  });

  // API v1 route modules mount here in Phase 6.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
