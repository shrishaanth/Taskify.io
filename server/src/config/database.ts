import mongoose from "mongoose";
import { config } from "./index";

export async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}
