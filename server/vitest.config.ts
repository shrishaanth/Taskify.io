import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.ts"],
    // mongodb-memory-server download + model index builds need headroom
    testTimeout: 20000,
    hookTimeout: 60000,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    // One shared module registry so Mongoose models register exactly once
    // against the single mongoose singleton.
    isolate: false,
    fileParallelism: false,
  },
});
