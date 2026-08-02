// src/types/index.ts — Shared TypeScript types for the entire client application

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokensUsed?: number;
  durationMs?: number;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  systemPrompt: string;
  temperature: number;
  tools: string[];
  avatar: string;
  color: string;
  expertise: string[];
}

export interface Tool {
  name: string;
  description: string;
}

export interface ToolCallResult {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  error?: string;
}

export interface ToolCallResponse {
  response: string;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  toolResults: ToolCallResult[];
  tokensUsed: number;
  durationMs: number;
}

export interface CrewStep {
  type: 'step' | 'summary' | 'done' | 'error';
  agentIndex?: number;
  total?: number;
  agent?: {
    role: string;
    goal: string;
    backstory: string;
    outputLabel: string;
  };
  output?: string;
  durationMs?: number;
  tokensUsed?: number;
  summary?: string;
  message?: string;
}

export interface LangChainComponent {
  id: string;
  name: string;
  type: string;
  description: string;
  color: string;
  code: string;
}

export interface LangChainChainResult {
  output: string;
  tokensUsed: number;
  chain: {
    promptTemplate: string;
    llmModel: string;
    outputParser: string;
    formattedPrompt: string;
  };
}

export interface RAGChunk {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
}

export interface RAGDocument {
  id: string;
  filename: string;
  chunks: RAGChunk[];
  indexedAt: string;
}

export interface RAGQueryResult {
  answer: string;
  retrievedChunks: Array<{ chunk: RAGChunk; score: number }>;
  augmentedPrompt: string;
  tokensUsed: number;
}

export interface LlamaIndexFile {
  indexId: string;
  filename: string;
  nodeCount: number;
}

export interface LlamaIndexQueryResult {
  answer: string;
  sourceNodes: Array<{
    text: string;
    score: number;
    metadata: Record<string, unknown>;
  }>;
  tokensUsed: number;
}

export interface ActivityEntry {
  id: string;
  type: 'chat' | 'tool' | 'crew' | 'rag' | 'llamaindex' | 'langchain' | 'playground';
  label: string;
  agentId?: string;
  toolName?: string;
  durationMs: number;
  tokens?: number;
  cost?: number;
  status: 'success' | 'error' | 'streaming';
  timestamp: string;
}

export interface MetricsSnapshot {
  totalRequests: number;
  avgResponseTimeMs: number;
  totalTokens: number;
  estimatedCostUSD: number;
  agentsUsed: Record<string, number>;
  documentsIndexed: number;
  requestsOverTime: Array<{ hour: string; count: number }>;
  tokensOverTime: Array<{ hour: string; tokens: number }>;
  costPerModel: Array<{ model: string; cost: number }>;
}

export interface PlaygroundResult {
  primary: {
    content: string;
    tokensUsed: number;
    durationMs: number;
    cost: number;
    config: {
      model: string;
      temperature: number;
      topP: number;
      maxTokens: number;
    };
  };
  comparison?: {
    content: string;
    tokensUsed: number;
    durationMs: number;
    config: Record<string, unknown>;
  };
}

export interface AppSettings {
  apiKey: string;
  model: string;
  theme: 'dark';
}
