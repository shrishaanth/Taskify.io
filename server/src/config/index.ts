import { z } from "zod";

// Load server/.env if present (Node >=20.12). Never throws when the file is
// missing — CI and tests supply env vars directly.
try {
  process.loadEnvFile();
} catch {
  /* no .env file — fine */
}

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/taskify"),
  JWT_ACCESS_SECRET: z.string().min(1).default("dev-access-secret"),
  JWT_REFRESH_SECRET: z.string().min(1).default("dev-refresh-secret"),
  ACCESS_TOKEN_TTL: z.string().min(1).default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CLIENT_ORIGIN: z.string().min(1).default("http://localhost:5173"),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const config = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  isTest: parsed.data.NODE_ENV === "test",
  refreshTokenTtlMs: parsed.data.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
} as const;

export type AppConfig = typeof config;
