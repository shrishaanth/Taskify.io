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

export const deleteAccountSchema = {
  body: z.object({
    // Re-authentication: deleting an account is irreversible, so a stolen or
    // left-open session should not be enough on its own.
    password: z.string().min(1, "Enter your password to confirm"),
    // Typed-out confirmation, checked against the caller's own email.
    confirmEmail: z.string().email(),
  }),
};
