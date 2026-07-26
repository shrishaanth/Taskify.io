import mongoose from 'mongoose';
import { config } from './index';

export async function connectDB(): Promise<void> {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`MongoDB: connected to ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB: connection failed:', err);
    if (config.isProduction) {
      process.exit(1);
    }
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('MongoDB: disconnected');
}
