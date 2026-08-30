import mongoose from "mongoose";
import { config } from "../config/index.js";
import { ensureUsableDnsServers } from "../lib/dnsFallback.js";

mongoose.set("strictQuery", true);

export async function connectMongo(uri: string = config.MONGODB_URI): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  // `mongodb+srv://` needs working SRV/TXT DNS lookups.
  if (uri.startsWith("mongodb+srv://")) ensureUsableDnsServers();
  await mongoose.connect(uri);
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

/** Readiness probe helper (NFR-3.1). */
export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
