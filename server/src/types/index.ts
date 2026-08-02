// types/index.ts — Shared TypeScript interfaces for the entire server.
// Single source of truth for all data shapes.

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
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
  metadata?: Record<string, unknown>;
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

export interface CrewAgent {
  role: string;
  goal: string;
  backstory: string;
  outputLabel: string;
}

export interface CrewStep {
  agent: CrewAgent;
  output: string;
  durationMs: number;
  tokensUsed: number;
}

export interface RAGDocument {
  id: string;
  filename: string;
  chunks: RAGChunk[];
  indexedAt: string;
}

export interface RAGChunk {
  id: string;
  text: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
}

export interface RAGResult {
  answer: string;
  retrievedChunks: Array<{ chunk: RAGChunk; score: number }>;
  augmentedPrompt: string;
  tokensUsed: number;
}
