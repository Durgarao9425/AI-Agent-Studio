// routes/metrics.ts — Dashboard metrics and activity timeline endpoints
import { Router } from 'express';
import { metricsService } from '../services/metrics.service';

const router = Router();

// GET /api/metrics/snapshot — Dashboard stats and chart data
router.get('/snapshot', (_req, res) => {
  res.json(metricsService.getSnapshot());
});

// GET /api/metrics/timeline — Activity timeline (last 50 events)
router.get('/timeline', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  res.json({ activities: metricsService.getTimeline(limit) });
});

export default router;
