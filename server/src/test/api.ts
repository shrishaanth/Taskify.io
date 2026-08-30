import type { Express } from "express";
import request from "supertest";
import { signAccessToken } from "../lib/tokens.js";
import type { UserDoc } from "../models/index.js";

export const bearer = (userOrId: UserDoc | string) => ({
  Authorization: `Bearer ${signAccessToken(
    typeof userOrId === "string" ? userOrId : userOrId._id.toString(),
  )}`,
});

export function asUser(app: Express, user: UserDoc | string) {
  const headers = bearer(user);
  return {
    get: (url: string) => request(app).get(url).set(headers),
    post: (url: string) => request(app).post(url).set(headers),
    put: (url: string) => request(app).put(url).set(headers),
    patch: (url: string) => request(app).patch(url).set(headers),
    delete: (url: string) => request(app).delete(url).set(headers),
  };
}
