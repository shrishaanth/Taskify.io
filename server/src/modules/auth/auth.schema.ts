import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200);

export const signupSchema = {
  body: z.object({
    email: z.string().email().max(200),
    name: z.string().trim().min(1).max(120),
    password,
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
};

export const refreshSchema = {
  body: z.object({ refreshToken: z.string().min(1).optional() }).default({}),
};

export const logoutSchema = refreshSchema;
