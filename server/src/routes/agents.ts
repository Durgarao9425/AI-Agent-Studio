// routes/agents.ts — Agent management endpoints
import { Router, Request, Response } from 'express';
import { AGENTS, getAgentById } from '../agents/definitions';

const router = Router();

// GET /api/agents — Returns all agent definitions
router.get('/', (_req: Request, res: Response) => {
  res.json({ agents: AGENTS });
});

// GET /api/agents/:id — Returns a specific agent
router.get('/:id', (req: Request, res: Response): void => {
  const agent = getAgentById(req.params.id);
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  res.json({ agent });
});

export default router;
