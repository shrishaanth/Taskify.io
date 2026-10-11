import { randomUUID } from "node:crypto";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { config } from "./config/index.js";
import { isMongoConnected } from "./db/mongoose.js";
import { requestContext } from "./lib/requestContext.js";
import { errorHandler, notFoundHandler } from "./middleware/index.js";
import { apiV1Router } from "./modules/router.js";

export const INSTANCE_ID = randomUUID();

export function createApp(): Express {
  const app = express();

  // Render and most hosts terminate TLS at a proxy. Without this every
  // request appears to come from that proxy and all users share one
  // rate-limit bucket.
  if (config.isProduction) app.set("trust proxy", 1);

  // The API serves JSON only; the defaults are safe for that. Cross-origin
  // resource policy is relaxed because the SPA lives on another origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", instanceId: INSTANCE_ID });
  });

  app.get("/api/ready", (_req, res) => {
    const ready = isMongoConnected();
    res
      .status(ready ? 200 : 503)
      .json({ status: ready ? "ready" : "not-ready", mongo: ready });
  });

  app.use("/api/v1", requestContext, apiV1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
