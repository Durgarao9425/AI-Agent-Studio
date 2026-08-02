// api/index.ts — All typed API functions for every feature

import { api, API_BASE_URL } from './client';
import { useSettingsStore } from '../store/useSettingsStore';
import type {
  Agent,
  Tool,
  ToolCallResponse,
  LangChainChainResult,
  RAGDocument,
  RAGQueryResult,
  LlamaIndexFile,
  LlamaIndexQueryResult,
  MetricsSnapshot,
  ActivityEntry,
  PlaygroundResult,
  Message,
} from '../types';

// ─── Agents API ───────────────────────────────────────────────────────────────
export const agentsApi = {
  getAll: () => api.get<{ agents: Agent[] }>('/agents').then((r) => r.data.agents),
  getById: (id: string) => api.get<{ agent: Agent }>(`/agents/${id}`).then((r) => r.data.agent),
};

// ─── Tools API ────────────────────────────────────────────────────────────────
export const toolsApi = {
  getAll: () => api.get<{ tools: Tool[] }>('/tools').then((r) => r.data.tools),
  call: (messages: Message[], selectedTools?: string[]) =>
    api
      .post<ToolCallResponse>('/tools/call', {
        messages,
        selectedTools,
        model: useSettingsStore.getState().model,
      })
      .then((r) => r.data),
};

// ─── Chat API ─────────────────────────────────────────────────────────────────
export const chatApi = {
  message: (messages: Message[], agentId?: string) =>
    api
      .post<{ content: string; tokensUsed: number }>('/chat/message', {
        messages,
        agentId,
        model: useSettingsStore.getState().model,
      })
      .then((r) => r.data),
};

// ─── Crew API ─────────────────────────────────────────────────────────────────
// Note: crew/run uses SSE streaming — handled by the useCrewRun hook directly

// ─── LangChain API ───────────────────────────────────────────────────────────
export const langchainApi = {
  getComponents: () =>
    api.get<{ components: unknown[]; flow: string[] }>('/langchain/components').then((r) => r.data),

  runChain: (systemPrompt: string, userPrompt: string, temperature?: number) =>
    api
      .post<LangChainChainResult>('/langchain/chain', {
        systemPrompt,
        userPrompt,
        temperature,
        model: useSettingsStore.getState().model,
      })
      .then((r) => r.data),

  conversation: (sessionId: string, message: string) =>
    api
      .post<{ response: string; memoryContents: string; sessionId: string; messageCount: number }>(
        '/langchain/conversation',
        { sessionId, message, model: useSettingsStore.getState().model }
      )
      .then((r) => r.data),

  clearMemory: (sessionId: string) =>
    api.delete<{ cleared: boolean }>(`/langchain/conversation/${sessionId}`).then((r) => r.data),
};

// ─── LlamaIndex API ───────────────────────────────────────────────────────────
export const llamaindexApi = {
  getFiles: () =>
    api.get<{ files: LlamaIndexFile[] }>('/llamaindex/files').then((r) => r.data.files),

  indexFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', useSettingsStore.getState().model);
    return fetch(`${API_BASE_URL}/llamaindex/index`, {
      method: 'POST',
      headers: { 'x-api-key': useSettingsStore.getState().apiKey },
      body: formData,
    }).then((r) => r.json() as Promise<{ indexId: string; nodeCount: number; filename: string }>);
  },

  query: (indexId: string, query: string, topK = 3) =>
    api
      .post<LlamaIndexQueryResult>('/llamaindex/query', {
        indexId,
        query,
        topK,
        model: useSettingsStore.getState().model,
      })
      .then((r) => r.data),
};

// ─── RAG API ─────────────────────────────────────────────────────────────────
export const ragApi = {
  getDocuments: () =>
    api.get<{ documents: RAGDocument[] }>('/rag/documents').then((r) => r.data.documents),

  previewChunks: (text: string, chunkSize?: number, overlap?: number) =>
    api
      .post<{ chunks: Array<{ text: string; startIndex: number; endIndex: number }>; totalChunks: number }>(
        '/rag/chunk',
        { text, chunkSize, overlap }
      )
      .then((r) => r.data),

  indexText: (text: string, filename: string, chunkSize?: number, overlap?: number) =>
    api
      .post<{ documentId: string; totalChunks: number }>('/rag/index', {
        text,
        filename,
        chunkSize,
        overlap,
      })
      .then((r) => r.data),

  query: (documentId: string, query: string, topK = 3) =>
    api
      .post<RAGQueryResult>('/rag/query', {
        documentId,
        query,
        topK,
        model: useSettingsStore.getState().model,
      })
      .then((r) => r.data),
};

// ─── Playground API ───────────────────────────────────────────────────────────
export const playgroundApi = {
  run: (params: {
    systemPrompt?: string;
    userPrompt: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    compareConfig?: Record<string, unknown>;
  }) =>
    api
      .post<PlaygroundResult>('/playground/run', {
        ...params,
        model: useSettingsStore.getState().model,
      })
      .then((r) => r.data),
};

// ─── Metrics API ──────────────────────────────────────────────────────────────
export const metricsApi = {
  getSnapshot: () => api.get<MetricsSnapshot>('/metrics/snapshot').then((r) => r.data),
  getTimeline: (limit = 50) =>
    api
      .get<{ activities: ActivityEntry[] }>(`/metrics/timeline?limit=${limit}`)
      .then((r) => r.data.activities),
};

// ─── Settings API ─────────────────────────────────────────────────────────────
export const settingsApi = {
  validateKey: (apiKey: string) =>
    fetch(`${API_BASE_URL}/settings/validate-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    }).then((r) => r.json() as Promise<{ valid: boolean; models?: unknown[]; error?: string }>),
};
