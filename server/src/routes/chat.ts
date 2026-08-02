// routes/chat.ts — Chat endpoint with SSE streaming.
// POST /api/chat/stream → streams response chunks as Server-Sent Events
// POST /api/chat/message → non-streaming chat completion

import { Router, Request, Response } from 'express';
import { streamChatCompletion, chatCompletion } from '../services/openai.service';
import { getAgentById } from '../agents/definitions';
import { metricsService } from '../services/metrics.service';
import { Message } from '../types';

const router = Router();

/**
 * POST /api/chat/stream
 * Streams a chat response as Server-Sent Events (SSE).
 * The client must use EventSource or fetch with ReadableStream to consume this.
 */
router.post('/stream', async (req: Request, res: Response): Promise<void> => {
  const { messages, agentId, model = 'gpt-4o', temperature = 0.7 } = req.body;
  const apiKey = (req.headers['x-api-key'] as string) || 'demo-mode';

  // Set SSE headers — this keeps the connection alive for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const start = Date.now();
  let totalContent = '';

  try {
    // Inject agent system prompt if an agent is selected
    const allMessages: Message[] = [...messages];
    if (agentId) {
      const agent = getAgentById(agentId);
      if (agent) {
        // Prepend system message with agent's persona
        allMessages.unshift({ role: 'system', content: agent.systemPrompt });
        metricsService.recordActivity({
          type: 'chat',
          label: `Chat with ${agent.name}`,
          agentId,
          durationMs: 0, // Will update in finish event
          status: 'streaming',
        });
      }
    }

    // Stream the response — each chunk is sent as an SSE event
    for await (const delta of streamChatCompletion(apiKey, allMessages, model, temperature)) {
      totalContent += delta;
      // SSE format: "data: {json}\n\n"
      res.write(`data: ${JSON.stringify({ delta, type: 'delta' })}\n\n`);
    }

    // Send completion event
    const durationMs = Date.now() - start;
    const tokensUsed = Math.ceil(totalContent.length / 4);
    const cost = metricsService.estimateCost(tokensUsed, model);

    metricsService.recordActivity({
      type: 'chat',
      label: agentId ? `Chat with ${getAgentById(agentId)?.name}` : 'AI Chat',
      agentId,
      durationMs,
      tokens: tokensUsed,
      cost,
      status: 'success',
    });

    res.write(`data: ${JSON.stringify({ type: 'done', durationMs, tokensUsed })}\n\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stream failed';
    res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
  } finally {
    res.end();
  }
});

/**
 * POST /api/chat/message
 * Non-streaming chat completion — returns full response at once.
 */
router.post('/message', async (req: Request, res: Response): Promise<void> => {
  const { messages, agentId, model = 'gpt-4o', temperature = 0.7 } = req.body;
  const apiKey = (req.headers['x-api-key'] as string) || 'demo-mode';

  try {
    const allMessages: Message[] = [...messages];
    if (agentId) {
      const agent = getAgentById(agentId);
      if (agent) allMessages.unshift({ role: 'system', content: agent.systemPrompt });
    }

    const { content, tokensUsed } = await chatCompletion(apiKey, allMessages, model, temperature);
    const cost = metricsService.estimateCost(tokensUsed, model);

    res.json({ content, tokensUsed, cost });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chat failed';
    res.status(500).json({ error: message });
  }
});

export default router;
