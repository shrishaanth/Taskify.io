import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { config } from "./config";
import { getRedis } from "./services/redis";
import { errorHandler } from "./middleware/error";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import taskRoutes from "./routes/tasks";
import activityRoutes from "./routes/activity";

export const allowedOrigins: (string | RegExp)[] = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
  "https://taskify-djmp.vercel.app",
  "https://taskify-5btr.onrender.com",
  ...config.clientOrigins,
];

const app = express();

// Behind nginx/a cloud LB the client IP arrives in X-Forwarded-For; without
// this, rate limiting would throttle the load balancer instead of the user.
app.set("trust proxy", 1);

app.use(helmet());
app.use(compression());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "100kb" }));

// Brute-force protection on the auth endpoints only — the app's normal
// refetching traffic shouldn't be throttled.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, try again later" },
});

// Liveness: is this instance up? Includes the instance id so you can watch
// the LB round-robin across the pool.
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", instance: config.instanceId })
);

// Readiness: can this instance actually serve traffic? The LB should stop
// routing here if Mongo is gone. Redis being down only degrades features,
// so it's reported but doesn't fail readiness.
app.get("/api/ready", (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  const redisReady = !!getRedis();
  res.status(mongoReady ? 200 : 503).json({
    status: mongoReady ? "ready" : "not-ready",
    instance: config.instanceId,
    mongo: mongoReady,
    redis: config.redisUrl ? redisReady : "disabled",
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activity", activityRoutes);

app.use(errorHandler);

export default app;
