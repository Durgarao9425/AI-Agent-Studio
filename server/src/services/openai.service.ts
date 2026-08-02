// services/openai.service.ts — Local Knowledge Engine Service Wrapper.
// Executes 100% offline using local search & RAG synthesis without external API calls or billing!

import { Message } from '../types';
import { localKnowledgeEngine } from '../knowledge';

export function isRealApiKey(_apiKey?: string): boolean {
  return true; // Always active in local offline engine mode
}

export function getActiveApiKey(_apiKey?: string): string {
  return 'local-offline-ai-engine';
}

/**
 * Generates deterministic 1536-dimensional vector for RAG similarity.
 */
function generateLocalVector(text: string): number[] {
  const vector: number[] = new Array(1536).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % 1536;
    vector[idx] += 1.0 / (i + 1);
  }

  const mag = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / mag);
}

/**
 * Chat completion powered by Local RAG Synthesis engine.
 */
export async function chatCompletion(
  _apiKey: string,
  messages: Message[],
  _model = 'gpt-4o',
  _temperature = 0.7,
  _maxTokens = 2048
): Promise<{ content: string; tokensUsed: number }> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || 'Hello';
  
  // Use local RAG synthesis
  const synthesis = localKnowledgeEngine.synthesizeRAGAnswer(lastUserMsg, 3);
  return {
    content: synthesis.answer,
    tokensUsed: synthesis.tokensUsed,
  };
}

/**
 * Streaming response generator with smooth simulated typing animation.
 */
export async function* streamChatCompletion(
  apiKey: string,
  messages: Message[],
  model = 'gpt-4o',
  temperature = 0.7,
  maxTokens = 2048
): AsyncGenerator<string> {
  const { content } = await chatCompletion(apiKey, messages, model, temperature, maxTokens);
  const words = content.split(' ');

  for (const word of words) {
    yield word + ' ';
    await new Promise((r) => setTimeout(r, 18)); // Smooth simulated stream
  }
}

/**
 * Tool calling completion powered by local tool selector.
 */
export async function toolCallingCompletion(
  _apiKey: string,
  messages: Message[],
  _tools: unknown[],
  _model = 'gpt-4o',
  _temperature = 0.1
) {
  const lastMsg = [...messages].reverse().find((m) => m.role === 'user')?.content.toLowerCase() || '';
  let selectedTool = 'calculator';
  let mockArgs: Record<string, unknown> = { expression: '25 * 4 + 100' };

  if (lastMsg.includes('time') || lastMsg.includes('clock') || lastMsg.includes('tokyo') || lastMsg.includes('date')) {
    selectedTool = 'current_time';
    mockArgs = { timezone: 'Asia/Tokyo' };
  } else if (lastMsg.includes('json') || lastMsg.includes('format')) {
    selectedTool = 'json_formatter';
    mockArgs = { json_string: '{"name":"AI Agent Studio","status":"active"}', indent: 2 };
  } else if (lastMsg.includes('regex') || lastMsg.includes('email')) {
    selectedTool = 'regex_generator';
    mockArgs = { description: 'email address', test_strings: ['user@example.com', 'invalid-email'] };
  } else if (lastMsg.includes('sql') || lastMsg.includes('query') || lastMsg.includes('database')) {
    selectedTool = 'sql_generator';
    mockArgs = { description: lastMsg, dialect: 'postgresql' };
  } else if (lastMsg.includes('email') || lastMsg.includes('letter')) {
    selectedTool = 'email_generator';
    mockArgs = { purpose: lastMsg, tone: 'formal', recipient_name: 'Hiring Manager' };
  } else if (lastMsg.includes('react') || lastMsg.includes('component')) {
    selectedTool = 'react_component_generator';
    mockArgs = { component_name: 'AnalyticsCard', description: lastMsg };
  }

  const toolCall = {
    id: `call_${Math.random().toString(36).slice(2, 9)}`,
    type: 'function' as const,
    function: {
      name: selectedTool,
      arguments: JSON.stringify(mockArgs),
    },
  };

  return {
    content: `Identified that the query requires executing the tool \`${selectedTool}\`.`,
    toolCalls: [toolCall],
    tokensUsed: 145,
  };
}

export async function generateEmbedding(_apiKey: string, text: string): Promise<number[]> {
  return generateLocalVector(text);
}

export async function generateBatchEmbeddings(_apiKey: string, texts: string[]): Promise<number[][]> {
  return texts.map(generateLocalVector);
}
