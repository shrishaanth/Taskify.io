import { z } from "zod";

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

// Every default and example value that has ever been published in this repo.
const PUBLIC_SECRETS = [
  "dev-access-secret",
  "dev-refresh-secret",
  "dev-access-secret-change-me",
  "dev-refresh-secret-change-me",
];

const parsed = EnvSchema.superRefine((env, ctx) => {
  if (env.NODE_ENV !== "production") return;
  // These values are public, so a production server that falls back to them
  // issues tokens anyone can forge. Refuse to start rather than run like that.
  for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const) {
    if (PUBLIC_SECRETS.includes(env[key])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: "must not be a default or example value in production",
      });
    } else if (env[key].length < 32) {
      console.warn(`[config] ${key} is shorter than 32 characters; use a longer random value.`);
    }
  }
}).safeParse(process.env);
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
