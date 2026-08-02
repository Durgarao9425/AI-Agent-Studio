// routes/langchain.ts — LangChain demo endpoints
import { Router, Request, Response } from 'express';
import {
  runPromptChain,
  runConversationChain,
  clearConversationMemory,
  getLangChainComponents,
} from '../services/langchain.service';

const router = Router();

// GET /api/langchain/components — Returns chain component definitions for visualization
router.get('/components', (_req, res: Response) => {
  res.json(getLangChainComponents());
});

// POST /api/langchain/chain — Runs a prompt through a LangChain LCEL chain
router.post('/chain', async (req: Request, res: Response): Promise<void> => {
  const { systemPrompt, userPrompt, model, temperature } = req.body;
  const apiKey = (req.headers['x-api-key'] as string) || 'demo-mode';
  if (!userPrompt) { res.status(400).json({ error: 'userPrompt is required' }); return; }

  try {
    const result = await runPromptChain(apiKey, systemPrompt || '', userPrompt, model, temperature);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Chain failed' });
  }
});

// POST /api/langchain/conversation — Conversational chain with memory
router.post('/conversation', async (req: Request, res: Response): Promise<void> => {
  const { sessionId, message, model, temperature } = req.body;
  const apiKey = (req.headers['x-api-key'] as string) || 'demo-mode';
  if (!sessionId || !message) {
    res.status(400).json({ error: 'sessionId and message are required' });
    return;
  }

  try {
    const result = await runConversationChain(apiKey, sessionId, message, model, temperature);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Conversation failed' });
  }
});

// DELETE /api/langchain/conversation/:sessionId — Clears memory for a session
router.delete('/conversation/:sessionId', (req: Request, res: Response) => {
  const cleared = clearConversationMemory(req.params.sessionId);
  res.json({ cleared, sessionId: req.params.sessionId });
});

export default router;
