// routes/settings.ts — Settings validation endpoint
import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { isGeminiApiKey } from '../services/openai.service';

const router = Router();

/**
 * POST /api/settings/validate-key
 * Validates an OpenAI/Gemini/OpenRouter API key by making a minimal API call.
 * Returns available models and account info.
 */
router.post('/validate-key', async (req: Request, res: Response): Promise<void> => {
  const apiKey = req.headers['x-api-key'] as string || req.body.apiKey;

  if (!apiKey || apiKey === 'demo-mode' || apiKey.trim() === '') {
    res.json({
      valid: true,
      demoMode: true,
      models: [
        { id: 'gpt-4o', created: Date.now() },
        { id: 'gpt-4o-mini', created: Date.now() },
        { id: 'gpt-4.1', created: Date.now() },
        { id: 'gpt-4-turbo', created: Date.now() },
      ],
    });
    return;
  }

  try {
    const isOR = apiKey.startsWith('sk-or-');
    const isGemini = isGeminiApiKey(apiKey);
    const client = new OpenAI({
      apiKey,
      baseURL: isOR 
        ? 'https://openrouter.ai/api/v1' 
        : isGemini 
          ? 'https://generativelanguage.googleapis.com/v1beta/openai/' 
          : undefined,
      defaultHeaders: isOR ? {
        'HTTP-Referer': 'https://ai-agent-studio-beta.vercel.app',
        'X-Title': 'AI Agent Studio',
      } : undefined
    });
    const models = await client.models.list();

    // Filter to only show chat models
    const chatModels = models.data
      .filter((m) => {
        if (isOR) {
          return m.id.includes('llama') || m.id.includes('gemma') || m.id.includes('mistral') || m.id.includes('claude') || m.id.includes('gpt') || m.id.includes(':free');
        }
        if (isGemini) {
          return m.id.includes('gemini');
        }
        return m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3');
      })
      .map((m) => ({ id: m.id, created: m.created || Date.now() }))
      .sort((a, b) => b.created - a.created)
      .slice(0, 50);

    res.json({ valid: true, models: chatModels });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid API key';
    res.status(401).json({ valid: false, error: message });
  }
});

export default router;
