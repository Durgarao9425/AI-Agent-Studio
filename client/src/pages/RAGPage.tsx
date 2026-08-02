// pages/RAGPage.tsx — Animated RAG pipeline visualization

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Database, Search, Loader2, ArrowDown, CheckCircle } from 'lucide-react';
import { ragApi } from '../api';
import { RAGQueryResult } from '../types';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface PipelineStep {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  status: 'idle' | 'active' | 'done';
  output?: string;
}

const INITIAL_STEPS: Omit<PipelineStep, 'status' | 'output'>[] = [
  { id: 'upload', label: 'Document Upload', icon: '📄', description: 'User uploads a document (PDF or text)', color: '#7c3aed' },
  { id: 'chunk', label: 'Chunking', icon: '✂️', description: 'Split into ~500 char overlapping chunks', color: '#3b82f6' },
  { id: 'embed', label: 'Embedding', icon: '🔢', description: 'OpenAI text-embedding-3-small generates vectors', color: '#06b6d4' },
  { id: 'store', label: 'Vector Database', icon: '🗄️', description: 'Chunks + embeddings stored in MemoryVectorStore', color: '#10b981' },
  { id: 'retrieve', label: 'Retriever', icon: '🔍', description: 'Cosine similarity finds top-K relevant chunks', color: '#f59e0b' },
  { id: 'prompt', label: 'Prompt Augmentation', icon: '📝', description: 'Retrieved context injected into LLM prompt', color: '#f43f5e' },
  { id: 'llm', label: 'LLM Generation', icon: '🤖', description: 'GPT generates grounded answer from context', color: '#8b5cf6' },
  { id: 'answer', label: 'Final Answer', icon: '✅', description: 'User receives context-grounded response', color: '#06b6d4' },
];

export function RAGPage() {
  const [documentText, setDocumentText] = useState(
    `Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn. Machine learning is a subset of AI that allows computers to learn from data without being explicitly programmed. Deep learning uses neural networks with many layers to analyze various factors of data. Natural Language Processing (NLP) enables computers to understand and generate human language. Large Language Models (LLMs) like GPT are trained on massive datasets and can generate coherent text. Retrieval-Augmented Generation (RAG) combines retrieval systems with generative AI to provide accurate, grounded responses.`
  );
  const [query, setQuery] = useState('What is RAG and how does it work?');
  const [steps, setSteps] = useState<PipelineStep[]>(
    INITIAL_STEPS.map((s) => ({ ...s, status: 'idle' }))
  );
  const [result, setResult] = useState<RAGQueryResult | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const setStepStatus = (id: string, status: PipelineStep['status'], output?: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, output } : s))
    );
  };

  const indexMutation = useMutation({
    mutationFn: () => ragApi.indexText(documentText, 'demo-document.txt', 400, 40),
    onSuccess: (data) => setDocumentId(data.documentId),
  });

  const runFullPipeline = async () => {
    // Reset all steps
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'idle' })));
    setResult(null);

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Step 1: Upload
    setStepStatus('upload', 'active');
    await delay(600);
    setStepStatus('upload', 'done', `Document: ${documentText.length} characters`);

    // Step 2: Chunk
    setStepStatus('chunk', 'active');
    const { totalChunks } = await ragApi.previewChunks(documentText, 400, 40);
    await delay(400);
    setStepStatus('chunk', 'done', `Created ${totalChunks} chunks (400 chars, 40 overlap)`);

    // Step 3: Embed (index the document)
    setStepStatus('embed', 'active');
    const indexResult = await ragApi.indexText(documentText, 'demo-document.txt', 400, 40);
    setDocumentId(indexResult.documentId);
    await delay(600);
    setStepStatus('embed', 'done', `Generated ${indexResult.totalChunks} embeddings (1536-dim vectors)`);

    // Step 4: Store
    setStepStatus('store', 'active');
    await delay(400);
    setStepStatus('store', 'done', `Stored in MemoryVectorStore with cosine similarity index`);

    // Step 5: Retrieve
    setStepStatus('retrieve', 'active');
    await delay(600);
    setStepStatus('retrieve', 'done', `Query embedded → Top-3 chunks retrieved by cosine similarity`);

    // Step 6: Augment Prompt
    setStepStatus('prompt', 'active');
    await delay(500);
    setStepStatus('prompt', 'done', `Context + question merged into augmented prompt`);

    // Step 7: LLM
    setStepStatus('llm', 'active');
    const ragResult = await ragApi.query(indexResult.documentId, query, 3);
    setResult(ragResult);

    setStepStatus('llm', 'done', `Generated ${ragResult.tokensUsed} tokens`);
    setStepStatus('answer', 'done', ragResult.answer.slice(0, 100) + '...');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">RAG Pipeline Visualization</h1>
        <p className="section-subtitle">
          Animated step-by-step Retrieval-Augmented Generation pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
        {/* Pipeline Steps */}
        <div className="card p-6">
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={step.id}>
                <motion.div
                  animate={
                    step.status === 'active'
                      ? { scale: 1.02, boxShadow: `0 0 20px ${step.color}30` }
                      : { scale: 1, boxShadow: 'none' }
                  }
                  transition={{ duration: 0.3 }}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl border transition-all duration-500',
                    step.status === 'active'
                      ? 'border-opacity-60'
                      : step.status === 'done'
                      ? 'border-opacity-30'
                      : 'border-white/8 opacity-50'
                  )}
                  style={{
                    borderColor: step.status !== 'idle' ? step.color : undefined,
                    background:
                      step.status === 'active'
                        ? `${step.color}12`
                        : step.status === 'done'
                        ? `${step.color}06`
                        : undefined,
                  }}
                >
                  {/* Step icon */}
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-all duration-300',
                      step.status === 'active' && 'animate-pulse'
                    )}
                    style={{ background: `${step.color}20` }}
                  >
                    {step.status === 'active' ? (
                      <Loader2 size={20} className="animate-spin" style={{ color: step.color }} />
                    ) : (
                      step.icon
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">Step {i + 1}</span>
                      {step.status === 'done' && (
                        <CheckCircle size={12} className="text-emerald" />
                      )}
                    </div>
                    <p
                      className="font-semibold text-sm"
                      style={{ color: step.status !== 'idle' ? step.color : undefined }}
                    >
                      {step.label}
                    </p>
                    <p className="text-text-muted text-xs mt-0.5">{step.description}</p>
                    {step.output && step.status === 'done' && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs mt-1 font-mono"
                        style={{ color: step.color }}
                      >
                        → {step.output}
                      </motion.p>
                    )}
                  </div>
                </motion.div>

                {i < steps.length - 1 && (
                  <div className="flex justify-start pl-8 my-1">
                    <ArrowDown
                      size={14}
                      className={cn(
                        'transition-colors duration-500',
                        steps[i + 1].status !== 'idle' ? 'text-text-secondary' : 'text-text-muted/30'
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Document Content</h3>
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              className="textarea min-h-[120px] text-xs"
              placeholder="Paste your document text here..."
            />
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Query</h3>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="textarea min-h-[60px]"
              placeholder="What do you want to know?"
            />
            <button
              onClick={runFullPipeline}
              disabled={!documentText.trim() || !query.trim()}
              className="btn-primary w-full justify-center"
            >
              <Database size={14} />
              Run Full RAG Pipeline
            </button>
          </div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-5 space-y-4"
                style={{ borderColor: 'rgba(6, 182, 212, 0.2)' }}
              >
                {/* Retrieved chunks */}
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Retrieved Context ({result.retrievedChunks.length} chunks)
                  </h4>
                  <div className="space-y-2">
                    {result.retrievedChunks.map((rc, i) => (
                      <div key={i} className="rounded-lg border border-white/10 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-text-muted">Chunk {i + 1}</span>
                          <span className="text-xs font-mono text-emerald ml-auto">
                            {(rc.score * 100).toFixed(1)}% match
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">{rc.chunk.text.slice(0, 150)}...</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Answer */}
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    LLM Answer
                  </h4>
                  <div className="markdown-content text-sm">
                    <ReactMarkdown>{result.answer}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
