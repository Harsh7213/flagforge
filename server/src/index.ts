import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import router from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import migrate from './db/migrate';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// ── Security & Parsing ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// ── Health check ────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ───────────────────────────────────────────────────────
app.use('/api/v1', router);

// ── 404 + Error Handler ──────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Startup ──────────────────────────────────────────────────────────
async function start() {
  try {
    await migrate();
    app.listen(PORT, () => {
      console.log(`\n🚀 Feature Flags API running at http://localhost:${PORT}`);
      console.log(`   Health:   http://localhost:${PORT}/health`);
      console.log(`   API:      http://localhost:${PORT}/api/v1`);
      console.log(`   Env:      ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
