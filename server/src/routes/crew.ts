// routes/crew.ts — CrewAI multi-agent workflow endpoint.
// GET /api/crew/agents — Returns crew agent definitions
// POST /api/crew/run — Runs the full CrewAI pipeline with SSE streaming

import { Router, Request, Response } from 'express';
import { runCrew, generateProjectSummary } from '../services/crew.service';

const router = Router();

/**
 * POST /api/crew/run
 * Runs the 5-agent sequential pipeline and streams each step as SSE.
 * Frontend can render each agent's output as it completes.
 */
router.post('/run', async (req: Request, res: Response): Promise<void> => {
  const { projectDescription, model = 'gpt-4o' } = req.body;
  const apiKey = (req.headers['x-api-key'] as string) || 'demo-mode';

  if (!projectDescription) {
    res.status(400).json({ error: 'projectDescription is required' });
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const allOutputs: Array<{ role: string; output: string }> = [];

  try {
    // Stream each agent step as it completes
    for await (const step of runCrew(projectDescription, apiKey, model)) {
      allOutputs.push({ role: step.agent.role, output: step.output });

      res.write(
        `data: ${JSON.stringify({
          type: 'step',
          agentIndex: step.agentIndex,
          total: step.total,
          agent: step.agent,
          output: step.output,
          durationMs: step.durationMs,
          tokensUsed: step.tokensUsed,
        })}\n\n`
      );
    }

    // Generate the project summary after all agents complete
    const summary = await generateProjectSummary(
      projectDescription,
      allOutputs,
      apiKey,
      model
    );

    res.write(
      `data: ${JSON.stringify({
        type: 'summary',
        summary,
      })}\n\n`
    );

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Crew run failed';
    res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
  } finally {
    res.end();
  }
});

export default router;
