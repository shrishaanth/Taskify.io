import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/error';
import authRoutes from './modules/auth/auth.routes';
import orgRoutes from './modules/organizations/org.routes';
import workspaceRoutes from './modules/workspaces/workspace.routes';

const app = express();

// ── Global middleware ─────────────────────────────────────────
app.set('trust proxy', config.isProduction ? 1 : 0);
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
    ...config.clientOrigins,
  ],
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

// ── Rate limiting ─────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, try again later' },
});

// ── Health / Readiness ────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', instance: config.instanceId, version: '2.0.0' });
});

app.get('/api/ready', (_req, res) => {
  const mongoose = require('mongoose');
  const mongoReady = mongoose.connection.readyState === 1;
  res.status(mongoReady ? 200 : 503).json({
    status: mongoReady ? 'ready' : 'not-ready',
    instance: config.instanceId,
    mongo: mongoReady,
  });
});

// ── API v1 Routes ─────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/orgs', orgRoutes);
app.use('/api/v1/orgs/:orgId/workspaces', workspaceRoutes);

// ── Legacy API (existing routes still work) ───────────────────

// ── Error handling ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
