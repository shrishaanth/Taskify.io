import { createServer } from "node:http";
import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { connectMongo, disconnectMongo } from "./db/mongoose.js";
import { initRealtime, shutdownRealtime } from "./realtime/io.js";

async function main() {
  await connectMongo();
  const app = createApp();
  const server = createServer(app);
  initRealtime(server);

  server.listen(config.PORT, () => {
    console.log(`Taskify API + realtime listening on :${config.PORT}`);
  });

  // Graceful shutdown for zero-downtime deploys (NFR-3.2).
  const shutdown = async (signal: string) => {
    console.log(`${signal} received — shutting down`);
    await shutdownRealtime();
    server.close(async () => {
      await disconnectMongo();
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
