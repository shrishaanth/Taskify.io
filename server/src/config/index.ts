import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    // In development, provide sensible defaults for most vars
    return '';
  }
  return val;
}

export const config = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // MongoDB
  mongodbUri: process.env.DATABASE_URL || 'mongodb://localhost:27017/taskify',

  // JWT
  jwtSecret: requireEnv('JWT_SECRET') || 'dev-jwt-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Redis (optional)
  redisUrl: process.env.REDIS_URL || '',

  // MinIO / S3 (optional for file uploads)
  storageEndpoint: process.env.STORAGE_ENDPOINT || '',
  storageAccessKey: process.env.STORAGE_ACCESS_KEY || '',
  storageSecretKey: process.env.STORAGE_SECRET_KEY || '',
  storageBucket: process.env.STORAGE_BUCKET || 'taskify',
  storageRegion: process.env.STORAGE_REGION || 'us-east-1',
  storageUseSSL: process.env.STORAGE_USE_SSL === 'true',

  // CORS
  clientOrigins: (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Instance
  instanceId: process.env.INSTANCE_ID || `pid-${process.pid}`,
};
