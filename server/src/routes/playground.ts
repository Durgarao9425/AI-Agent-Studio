// routes/playground.ts — Prompt Playground endpoint
import { Router, Request, Response } from 'express';
import { chatCompletion } from '../services/openai.service';
import { metricsService } from '../services/metrics.service';

const router = Router();

/**
 * POST /api/playground/run
 * Runs a prompt with custom parameters and returns the result.
 * Also supports running two configs simultaneously for comparison.
 */
router.post('/run', async (req: Request, res: Response): Promise<void> => {
  const {
    systemPrompt,
    userPrompt,
    model = 'gpt-4o',
    temperature = 0.7,
    topP = 1,
    maxTokens = 1024,
    compareConfig, // Optional second config for A/B comparison
  } = req.body;
  const apiKey = (req.headers['x-api-key'] as string) || 'demo-mode';
  if (!userPrompt) { res.status(400).json({ error: 'userPrompt is required' }); return; }

  try {
    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: userPrompt },
    ];

    const start = Date.now();

    // Run primary config
    const primary = await chatCompletion(apiKey, messages, model, temperature, maxTokens);
    const primaryDuration = Date.now() - start;

    // Run comparison config if provided
    let comparison = null;
    if (compareConfig) {
      const compareStart = Date.now();
      const compareMessages = [
        ...(compareConfig.systemPrompt ? [{ role: 'system' as const, content: compareConfig.systemPrompt }] : []),
        { role: 'user' as const, content: compareConfig.userPrompt || userPrompt },
      ];
      const compareResult = await chatCompletion(
        apiKey,
        compareMessages,
        compareConfig.model || model,
        compareConfig.temperature ?? temperature,
        compareConfig.maxTokens || maxTokens
      );
      comparison = {
        ...compareResult,
        durationMs: Date.now() - compareStart,
        config: compareConfig,
      };
    }

    const cost = metricsService.estimateCost(primary.tokensUsed, model);
    metricsService.recordActivity({
      type: 'playground',
      label: `Playground: ${model} temp=${temperature}`,
      durationMs: primaryDuration,
      tokens: primary.tokensUsed,
      cost,
      status: 'success',
    });

    res.json({
      primary: {
        content: primary.content,
        tokensUsed: primary.tokensUsed,
        durationMs: primaryDuration,
        cost,
        config: { model, temperature, topP, maxTokens },
      },
      comparison,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Playground run failed' });
  }
});

export default router;
