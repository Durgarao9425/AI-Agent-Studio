// routes/tools.ts — Tool calling endpoint.
// POST /api/tools/call — Sends tools to OpenAI, executes the selected tool,
// then returns the tool result + LLM's final answer.

import { Router, Request, Response } from 'express';
import { toolCallingCompletion, chatCompletion } from '../services/openai.service';
import {
  runCalculator,
  runCurrentTime,
  runJsonFormatter,
  runRegexGenerator,
} from '../services/tools.service';
import { TOOL_SCHEMAS, TOOL_INFO } from '../tools/definitions';
import { metricsService } from '../services/metrics.service';
import { Message } from '../types';
import OpenAI from 'openai';

const router = Router();

// GET /api/tools — Returns all available tool definitions for the UI
router.get('/', (_req, res: Response) => {
  res.json({ tools: TOOL_INFO });
});

/**
 * POST /api/tools/call
 * The full tool calling workflow:
 * 1. Send user message + tool schemas to OpenAI
 * 2. OpenAI returns which tool to call + arguments
 * 3. We execute the tool locally
 * 4. Send tool result back to OpenAI for final response
 * 5. Return everything to the client for visualization
 */
router.post('/call', async (req: Request, res: Response): Promise<void> => {
  const { messages, selectedTools, model = 'gpt-4o' } = req.body;
  const apiKey = (req.headers['x-api-key'] as string) || 'demo-mode';

  const start = Date.now();

  try {
    // Filter tool schemas to only include user-selected tools
    const enabledSchemas = selectedTools?.length
      ? TOOL_SCHEMAS.filter((t) => selectedTools.includes(t.function.name))
      : TOOL_SCHEMAS;

    // Step 1: Ask OpenAI which tool to use (if any)
    const { content, toolCalls, tokensUsed: step1Tokens } = await toolCallingCompletion(
      apiKey,
      messages,
      enabledSchemas,
      model
    );

    // If OpenAI didn't call any tools, return the direct response
    if (toolCalls.length === 0) {
      res.json({
        response: content,
        toolCalls: [],
        toolResults: [],
        tokensUsed: step1Tokens,
      });
      return;
    }

    // Step 2: Execute each tool call locally
    const toolResults = [];
    const toolMessages: Message[] = [
      // Include the assistant's message that triggered tool calls
      {
        role: 'assistant' as const,
        content: content || '',
      },
    ];

    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.function.arguments);
      let result;

      // Route to the correct tool handler
      switch (toolCall.function.name) {
        case 'calculator':
          result = runCalculator(args);
          break;
        case 'current_time':
          result = runCurrentTime(args);
          break;
        case 'json_formatter':
          result = runJsonFormatter(args);
          break;
        case 'regex_generator':
          result = runRegexGenerator(args);
          break;
        default:
          // For LLM-powered tools (sql, email, react, etc.), generate via LLM
          result = await generateLLMTool(apiKey, toolCall.function.name, args, model);
      }

      toolResults.push(result);

      // Add tool result to messages for the follow-up LLM call
      toolMessages.push({
        role: 'tool',
        content: JSON.stringify(result.output),
        tool_call_id: toolCall.id,
      });
    }

    // Step 3: Send tool results back to OpenAI for the final synthesized response
    const finalMessages = [
      ...messages,
      { role: 'assistant' as const, content: content || '', tool_calls: toolCalls } as Message,
      ...toolMessages.slice(1), // Skip the duplicate assistant message
    ];

    const { content: finalResponse, tokensUsed: step3Tokens } = await chatCompletion(
      apiKey,
      finalMessages as Message[],
      model,
      0.5
    );

    const totalTokens = step1Tokens + step3Tokens;
    const durationMs = Date.now() - start;
    const cost = metricsService.estimateCost(totalTokens, model);

    metricsService.recordActivity({
      type: 'tool',
      label: `Tool: ${toolCalls.map((t) => t.function.name).join(', ')}`,
      toolName: toolCalls[0]?.function.name,
      durationMs,
      tokens: totalTokens,
      cost,
      status: 'success',
    });

    res.json({
      response: finalResponse,
      toolCalls: toolCalls.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
      toolResults,
      tokensUsed: totalTokens,
      durationMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tool call failed';
    res.status(500).json({ error: message });
  }
});

/**
 * generateLLMTool — For tools that require LLM to generate the output
 * (SQL, email, JavaScript, React component, API docs)
 */
async function generateLLMTool(
  apiKey: string,
  toolName: string,
  args: Record<string, unknown>,
  model: string
): Promise<{ toolName: string; input: Record<string, unknown>; output: unknown }> {
  const prompts: Record<string, string> = {
    sql_generator: `Generate a ${args.dialect || 'PostgreSQL'} SQL query for: ${args.description}${args.schema ? `\n\nTable schema:\n${args.schema}` : ''}. Return ONLY the SQL query with comments.`,
    email_generator: `Write a ${args.tone || 'professional'} email for: ${args.purpose}. ${args.recipient_name ? `To: ${args.recipient_name}` : ''} ${args.sender_name ? `From: ${args.sender_name}` : ''} ${args.key_points ? `Key points: ${(args.key_points as string[]).join(', ')}` : ''}. Include Subject line.`,
    javascript_generator: `Generate clean ${args.language || 'TypeScript'} code for: ${args.description}${args.include_tests ? '\n\nInclude unit tests using Vitest.' : ''}. Include helpful comments.`,
    react_component_generator: `Generate a complete React ${args.component_name} component in TypeScript with Tailwind CSS for: ${args.description}. Props: ${JSON.stringify(args.props || [])}. Include proper TypeScript types, JSDoc, and accessibility attributes.`,
    api_docs_generator: `Generate OpenAPI 3.0 YAML documentation for: ${args.method} ${args.endpoint}\nDescription: ${args.description}\nRequest: ${args.request_body || 'N/A'}\nResponse: ${args.response || 'Standard success response'}`,
  };

  const prompt = prompts[toolName] || `Execute: ${JSON.stringify(args)}`;
  const { content } = await chatCompletion(apiKey, [{ role: 'user', content: prompt }], model, 0.3, 2000);

  return { toolName, input: args, output: content };
}

export default router;
