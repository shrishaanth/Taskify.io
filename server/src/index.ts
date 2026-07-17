import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import http from "http";
import mongoose from "mongoose";
import { config } from "./config";
import app, { allowedOrigins } from "./app";
import { connectDB } from "./config/database";
import { initRedis, presenceResetLocal } from "./services/redis";
import { initSocket } from "./realtime/socket";
import { startDueSoonJob } from "./jobs/dueSoon";

const server = http.createServer(app);

// Redis first (optional — no-op without REDIS_URL), so the Socket.IO
// adapter can pick it up during init.
initRedis();

const io = initSocket(server, allowedOrigins);

connectDB().then(() => {
  void presenceResetLocal();
  const dueSoonTimer = startDueSoonJob();

  server.listen(config.port, () => {
    console.log(`[${config.instanceId}] Server running on http://localhost:${config.port}`);
  });

  // Graceful shutdown: essential behind a load balancer. On SIGTERM (deploy,
  // scale-down) stop accepting new connections, tell connected clients to
  // reconnect (they'll land on a healthy instance), and drain before exit.
  const shutdown = (signal: string) => {
    console.log(`[${config.instanceId}] ${signal} received — shutting down gracefully`);
    clearInterval(dueSoonTimer);
    io.close();
    server.close(() => {
      void mongoose.connection.close().finally(() => process.exit(0));
    });
    // Hard exit if draining takes too long.
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
});
