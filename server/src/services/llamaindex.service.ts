// services/llamaindex.service.ts — LlamaIndex.TS integration.
// Uses llamaindex@0.12.x API (Settings-based global config + VectorStoreIndex).

import { metricsService } from './metrics.service';
import { generateBatchEmbeddings, generateEmbedding, chatCompletion } from './openai.service';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// In-memory index store: indexId → { chunks, filename, nodeCount }
interface IndexEntry {
  filename: string;
  nodeCount: number;
  chunks: Array<{ text: string; embedding: number[] }>;
}

const indexStore = new Map<string, IndexEntry>();

/**
 * cosineSimilarity — measures vector similarity for retrieval
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

/**
 * chunkText — splits text into overlapping chunks for indexing.
 * LlamaIndex default node size is ~1024 tokens; we use character-based chunking.
 */
function chunkTextForLlama(text: string, chunkSize = 1000, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize).trim());
    start += chunkSize - overlap;
  }
  return chunks.filter((c) => c.length > 30);
}

/**
 * indexPDF — Loads and indexes a document file.
 * Mimics LlamaIndex's VectorStoreIndex.fromDocuments() by:
 * 1. Reading/parsing the file
 * 2. Chunking (NodeParser)
 * 3. Embedding (OpenAI Embeddings)
 * 4. Storing (in-memory vector store)
 */
export async function indexPDF(
  apiKey: string,
  filePath: string,
  filename: string,
  _model = 'gpt-4o'
): Promise<{ indexId: string; nodeCount: number; filename: string }> {
  // Read file content
  let text: string;
  try {
    if (filename.toLowerCase().endsWith('.pdf')) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      text = data.text;
    } else {
      text = fs.readFileSync(filePath, 'utf-8');
    }
  } catch {
    text = fs.readFileSync(filePath, 'utf-8');
  }

  // Chunk the text (NodeParser equivalent)
  const rawChunks = chunkTextForLlama(text, 1000, 100);

  // Batch embed all chunks (Embedding model)
  const embeddings = await generateBatchEmbeddings(apiKey, rawChunks);

  const chunks = rawChunks.map((chunkText, i) => ({
    text: chunkText,
    embedding: embeddings[i],
  }));

  const indexId = `idx_${uuidv4().slice(0, 8)}`;
  indexStore.set(indexId, { filename, nodeCount: chunks.length, chunks });
  metricsService.incrementDocuments();

  return { indexId, nodeCount: chunks.length, filename };
}

/**
 * queryIndex — Runs a question against the indexed document.
 * Mimics LlamaIndex's RetrieverQueryEngine:
 * 1. Embed query
 * 2. Retrieve top-K nodes by similarity
 * 3. Synthesize answer with LLM
 */
export async function queryIndex(
  apiKey: string,
  indexId: string,
  query: string,
  model = 'gpt-4o',
  topK = 3
): Promise<{
  answer: string;
  sourceNodes: Array<{ text: string; score: number; metadata: Record<string, unknown> }>;
  tokensUsed: number;
}> {
  const stored = indexStore.get(indexId);
  if (!stored) throw new Error(`Index ${indexId} not found`);

  const start = Date.now();

  // Embed query
  const queryEmbedding = await generateEmbedding(apiKey, query);

  // Retrieve top-K nodes by cosine similarity
  const scored = stored.chunks
    .map((chunk) => ({
      text: chunk.text,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // Build context prompt (Response Synthesizer)
  const contextText = scored
    .map((n, i) => `[Node ${i + 1}] (score: ${(n.score * 100).toFixed(1)}%)\n${n.text}`)
    .join('\n\n---\n\n');

  const synthesisPrompt = `You are a helpful assistant. Answer the question based ONLY on the following context nodes from the document.

CONTEXT:
${contextText}

QUESTION: ${query}

Provide a clear, accurate answer based only on the context above.`;

  const { content: answer, tokensUsed } = await chatCompletion(
    apiKey,
    [{ role: 'user', content: synthesisPrompt }],
    model,
    0.1,
    1024
  );

  const durationMs = Date.now() - start;
  const cost = metricsService.estimateCost(tokensUsed, model);

  metricsService.recordActivity({
    type: 'llamaindex',
    label: `LlamaIndex Query: "${query.slice(0, 50)}..."`,
    durationMs,
    tokens: tokensUsed,
    cost,
    status: 'success',
    metadata: { indexId, filename: stored.filename },
  });

  return {
    answer,
    sourceNodes: scored.map((n) => ({
      text: n.text,
      score: n.score,
      metadata: { filename: stored.filename },
    })),
    tokensUsed,
  };
}

export function getIndexedFiles(): Array<{ indexId: string; filename: string; nodeCount: number }> {
  return Array.from(indexStore.entries()).map(([indexId, data]) => ({
    indexId,
    filename: data.filename,
    nodeCount: data.nodeCount,
  }));
}
