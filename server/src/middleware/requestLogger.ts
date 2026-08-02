// middleware/requestLogger.ts — Logs every AI request to in-memory metrics store.
// This is how the Activity Timeline and Dashboard get populated.

import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics.service';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    // Only log AI API calls (not health checks or static assets)
    if (req.path.startsWith('/api/') && req.path !== '/api/health') {
      metricsService.recordRequest({
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        durationMs: duration,
      });
    }
  });

  next();
}
