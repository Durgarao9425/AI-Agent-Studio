// src/index.ts — Express app entry point
// Sets up middleware, routes, and starts the server.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Routes
import chatRouter from './routes/chat';
import agentsRouter from './routes/agents';
import toolsRouter from './routes/tools';
import crewRouter from './routes/crew';
import langchainRouter from './routes/langchain';
import llamaindexRouter from './routes/llamaindex';
import ragRouter from './routes/rag';
import playgroundRouter from './routes/playground';
import metricsRouter from './routes/metrics';
import settingsRouter from './routes/settings';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // Security headers
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev')); // HTTP request logging
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger); // Custom metrics logger

// Static uploads directory for PDF files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/chat', chatRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/tools', toolsRouter);
app.use('/api/crew', crewRouter);
app.use('/api/langchain', langchainRouter);
app.use('/api/llamaindex', llamaindexRouter);
app.use('/api/rag', ragRouter);
app.use('/api/playground', playgroundRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/settings', settingsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 AI Agent Studio Server running on http://localhost:${PORT}`);
});

export default app;
