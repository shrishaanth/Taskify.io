import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5000),
  jwtSecret: process.env.JWT_SECRET || "secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  mongodbUri: process.env.DATABASE_URL || "mongodb://localhost:27017/taskify",
  nodeEnv: process.env.NODE_ENV || "development",
  // Optional. When set, it enables: Socket.IO horizontal scaling (pub/sub
  // adapter), shared presence across instances, stats caching, and the
  // distributed lock for scheduled jobs. Without it the app still works
  // fully on a single instance.
  redisUrl: process.env.REDIS_URL || "",
  // Extra allowed CORS origins (comma-separated), e.g. the deployed client.
  clientOrigins: (process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  // Identifies this instance in /api/health — handy for verifying the load
  // balancer actually distributes requests.
  instanceId: process.env.INSTANCE_ID || `pid-${process.pid}`,
};
