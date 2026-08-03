import { Message } from '../types';
import { localKnowledgeEngine } from '../knowledge';
import OpenAI from 'openai';

export function isRealApiKey(apiKey?: string): boolean {
  return !!apiKey && apiKey !== 'demo-mode' && apiKey.trim() !== '';
}

export function isGeminiApiKey(apiKey?: string): boolean {
  return isRealApiKey(apiKey) && !apiKey!.startsWith('sk-') && !apiKey!.startsWith('sk-or-') && apiKey !== 'local-offline-ai-engine';
}

export function getActiveApiKey(apiKey?: string): string {
  return isRealApiKey(apiKey) ? apiKey! : 'local-offline-ai-engine';
}

function getOpenAIClient(apiKey: string) {
  const isOR = apiKey.startsWith('sk-or-');
  const isGemini = isGeminiApiKey(apiKey);
  return new OpenAI({
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
 * Chat completion powered by Local RAG Synthesis engine or real API.
 */
export async function chatCompletion(
  apiKey: string,
  messages: Message[],
  model = 'gpt-4o',
  temperature = 0.7,
  maxTokens = 2048
): Promise<{ content: string; tokensUsed: number }> {
  if (!isRealApiKey(apiKey)) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || 'Hello';
    
    // Use local RAG synthesis
    const synthesis = localKnowledgeEngine.synthesizeRAGAnswer(lastUserMsg, 3);
    return {
      content: synthesis.answer,
      tokensUsed: synthesis.tokensUsed,
    };
  }

  try {
    const client = getOpenAIClient(apiKey);
    const formattedMessages = messages.map((m) => {
      const msg: any = { role: m.role, content: m.content || '' };
      if (m.tool_calls) msg.tool_calls = m.tool_calls;
      if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
      return msg;
    });
    
    const isGemini = isGeminiApiKey(apiKey);
    let selectedModel = model;
    if (isGemini) {
      if (!selectedModel || selectedModel.startsWith('gpt-') || selectedModel.startsWith('o1') || selectedModel.startsWith('o3')) {
        selectedModel = 'gemini-2.5-flash';
      }
    } else if (apiKey.startsWith('sk-or-')) {
      if (!selectedModel || selectedModel.startsWith('gpt-') || selectedModel.startsWith('o1') || selectedModel.startsWith('o3')) {
        selectedModel = 'meta-llama/llama-3-8b-instruct:free';
      }
    } else {
      if (!selectedModel) {
        selectedModel = 'gpt-4o';
      }
    }

    const response = await client.chat.completions.create({
      model: selectedModel,
      messages: formattedMessages as any,
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || Math.ceil(content.length / 4);

    return { content, tokensUsed };
  } catch (err) {
    console.error('Real API Call failed:', err);
    throw err;
  }
}

/**
 * Streaming response generator with smooth simulated typing animation or real API stream.
 */
export async function* streamChatCompletion(
  apiKey: string,
  messages: Message[],
  model = 'gpt-4o',
  temperature = 0.7,
  maxTokens = 2048
): AsyncGenerator<string> {
  if (!isRealApiKey(apiKey)) {
    const { content } = await chatCompletion(apiKey, messages, model, temperature, maxTokens);
    const words = content.split(' ');

    for (const word of words) {
      yield word + ' ';
      await new Promise((r) => setTimeout(r, 18)); // Smooth simulated stream
    }
    return;
  }

  try {
    const client = getOpenAIClient(apiKey);
    const formattedMessages = messages.map((m) => {
      const msg: any = { role: m.role, content: m.content || '' };
      if (m.tool_calls) msg.tool_calls = m.tool_calls;
      if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
      return msg;
    });
    
    const isGemini = isGeminiApiKey(apiKey);
    let selectedModel = model;
    if (isGemini) {
      if (!selectedModel || selectedModel.startsWith('gpt-') || selectedModel.startsWith('o1') || selectedModel.startsWith('o3')) {
        selectedModel = 'gemini-2.5-flash';
      }
    } else if (apiKey.startsWith('sk-or-')) {
      if (!selectedModel || selectedModel.startsWith('gpt-') || selectedModel.startsWith('o1') || selectedModel.startsWith('o3')) {
        selectedModel = 'meta-llama/llama-3-8b-instruct:free';
      }
    } else {
      if (!selectedModel) {
        selectedModel = 'gpt-4o';
      }
    }

    const stream = await client.chat.completions.create({
      model: selectedModel,
      messages: formattedMessages as any,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  } catch (err) {
    console.error('Real Stream API Call failed:', err);
    throw err;
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
