import http from 'http';
import mongoose from 'mongoose';
import { config } from './config';
import app from './app';
import { connectDB } from './config/database';
import { initRedis, presenceResetLocal } from './services/redis';

async function main() {
  // ── Infrastructure init ──────────────────────────────────────
  console.log(`[${config.instanceId}] Starting Taskify v2...`);
  console.log(`[${config.instanceId}] Environment: ${config.nodeEnv}`);

  // Redis (optional)
  initRedis();

  // MongoDB
  await connectDB();

  // Clear stale presence state
  presenceResetLocal();

  // ── HTTP Server ──────────────────────────────────────────────
  const server = http.createServer(app);

  server.listen(config.port, () => {
    console.log(`[${config.instanceId}] Server running on http://localhost:${config.port}`);
    console.log(`[${config.instanceId}] API: http://localhost:${config.port}/api/v1`);
  });

  // ── Graceful Shutdown ───────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`[${config.instanceId}] ${signal} received — shutting down gracefully`);
    server.close(async () => {
      await mongoose.connection.close().finally(() => process.exit(0));
    });
    // Hard exit if draining takes too long
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
