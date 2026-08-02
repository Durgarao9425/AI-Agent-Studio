// services/rag.service.ts — Manual RAG (Retrieval-Augmented Generation) pipeline.
// This implements the full RAG pipeline from scratch (no framework abstractions)
// so each step can be visualized and explained during an interview.
//
// Pipeline: Document → Chunking → Embedding → Vector Store → Retrieval → Augmentation → LLM → Answer

import { v4 as uuidv4 } from 'uuid';
import { generateBatchEmbeddings, generateEmbedding, chatCompletion } from './openai.service';
import { metricsService } from './metrics.service';
import { RAGDocument, RAGChunk, RAGResult } from '../types';

// ─── In-Memory Vector Store ───────────────────────────────────────────────────
// Maps documentId → RAGDocument (chunks + their embeddings)
const vectorStore = new Map<string, RAGDocument>();

/**
 * cosineSimilarity — Measures how similar two vectors are.
 * Returns 1.0 for identical vectors, 0 for orthogonal (unrelated), -1 for opposite.
 * This is the core math behind semantic search in vector databases.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

/**
 * chunkText — Splits document text into overlapping chunks.
 * Overlap ensures context is preserved at chunk boundaries.
 * This is equivalent to LangChain's RecursiveCharacterTextSplitter.
 *
 * @param text - Full document text
 * @param chunkSize - Maximum characters per chunk
 * @param overlap - Number of characters to overlap between consecutive chunks
 */
export function chunkText(
  text: string,
  chunkSize = 500,
  overlap = 50
): Array<{ text: string; startIndex: number; endIndex: number }> {
  const chunks: Array<{ text: string; startIndex: number; endIndex: number }> = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunkEnd = end;

    // Try to break at sentence boundaries for more coherent chunks
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('. ', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + chunkSize / 2) {
        chunkEnd = breakPoint + 1;
      }
    }

    const chunkText = text.slice(start, chunkEnd).trim();
    if (chunkText.length > 20) { // Skip very short chunks
      chunks.push({ text: chunkText, startIndex: start, endIndex: chunkEnd });
    }

    start = chunkEnd - overlap; // Slide window with overlap
  }

  return chunks;
}

/**
 * indexDocument — The "indexing" phase of RAG.
 * Chunks the document, generates embeddings for each chunk,
 * and stores them in the in-memory vector store.
 */
export async function indexDocument(
  apiKey: string,
  filename: string,
  text: string,
  chunkSize = 500,
  overlap = 50
): Promise<{
  documentId: string;
  chunks: RAGChunk[];
  totalChunks: number;
}> {
  const documentId = uuidv4();
  const rawChunks = chunkText(text, chunkSize, overlap);

  // Batch embed all chunks in a single API call (much more efficient)
  const chunkTexts = rawChunks.map((c) => c.text);
  const embeddings = await generateBatchEmbeddings(apiKey, chunkTexts);

  const chunks: RAGChunk[] = rawChunks.map((chunk, i) => ({
    id: uuidv4(),
    text: chunk.text,
    embedding: embeddings[i],
    metadata: {
      documentId,
      filename,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
      chunkIndex: i,
    },
  }));

  const ragDoc: RAGDocument = {
    id: documentId,
    filename,
    chunks,
    indexedAt: new Date().toISOString(),
  };

  vectorStore.set(documentId, ragDoc);
  metricsService.incrementDocuments();

  return { documentId, chunks, totalChunks: chunks.length };
}

/**
 * retrieveRelevantChunks — The "retrieval" phase of RAG.
 * Embeds the query, computes cosine similarity with all stored chunk embeddings,
 * and returns the top-K most similar chunks.
 */
export async function retrieveRelevantChunks(
  apiKey: string,
  query: string,
  documentId: string,
  topK = 3
): Promise<Array<{ chunk: RAGChunk; score: number }>> {
  const doc = vectorStore.get(documentId);
  if (!doc) throw new Error(`Document ${documentId} not found in vector store`);

  // Embed the query using the same model used for chunks
  const queryEmbedding = await generateEmbedding(apiKey, query);

  // Score all chunks by cosine similarity with the query embedding
  const scored = doc.chunks
    .filter((chunk) => chunk.embedding) // Safety check
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding!),
    }))
    .sort((a, b) => b.score - a.score) // Descending by similarity
    .slice(0, topK);

  return scored;
}

/**
 * ragQuery — The full RAG pipeline end-to-end.
 * Query → Retrieve → Augment → Generate → Return with metadata.
 * Returns the answer AND all intermediate artifacts for visualization.
 */
export async function ragQuery(
  apiKey: string,
  documentId: string,
  query: string,
  model = 'gpt-4o',
  topK = 3
): Promise<RAGResult> {
  const start = Date.now();

  // Step 1: Retrieve relevant chunks
  const retrievedChunks = await retrieveRelevantChunks(apiKey, query, documentId, topK);

  // Step 2: Build the augmented prompt
  // This is the "A" in RAG — we augment the user's question with retrieved context
  const contextText = retrievedChunks
    .map((r, i) => `[Context ${i + 1}] (relevance: ${(r.score * 100).toFixed(1)}%)\n${r.chunk.text}`)
    .join('\n\n');

  const augmentedPrompt = `You are an expert answering questions based on the provided document context.

DOCUMENT CONTEXT:
${contextText}

USER QUESTION: ${query}

Instructions:
- Answer ONLY based on the provided context
- If the context doesn't contain enough information, say so
- Quote relevant parts of the context when appropriate
- Be concise and accurate`;

  // Step 3: Generate the answer using the augmented prompt
  const { content: answer, tokensUsed } = await chatCompletion(
    apiKey,
    [{ role: 'user', content: augmentedPrompt }],
    model,
    0.1, // Low temperature for factual, grounded answers
    1024
  );

  const durationMs = Date.now() - start;
  const cost = metricsService.estimateCost(tokensUsed, model);

  metricsService.recordActivity({
    type: 'rag',
    label: `RAG Query: "${query.slice(0, 50)}..."`,
    durationMs,
    tokens: tokensUsed,
    cost,
    status: 'success',
  });

  return {
    answer,
    retrievedChunks,
    augmentedPrompt,
    tokensUsed,
  };
}

export function getIndexedDocuments(): RAGDocument[] {
  return Array.from(vectorStore.values()).map((doc) => ({
    ...doc,
    chunks: doc.chunks.map((c) => ({ ...c, embedding: undefined })), // Don't send embeddings to client
  }));
}

export function getDocumentById(id: string): RAGDocument | undefined {
  return vectorStore.get(id);
}
