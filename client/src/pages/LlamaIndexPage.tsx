// pages/LlamaIndexPage.tsx — LlamaIndex PDF indexing and Q&A demonstration

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileSearch, Upload, Search, FileText, Layers, Target,
  Loader2, CheckCircle, X, AlertCircle
} from 'lucide-react';
import { llamaindexApi } from '../api';
import { LlamaIndexFile, LlamaIndexQueryResult } from '../types';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 transition-all duration-200 cursor-pointer text-center',
        isDragging
          ? 'border-violet/60 bg-violet/10'
          : 'border-white/15 hover:border-white/25 hover:bg-white/2'
      )}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <div className="w-14 h-14 rounded-2xl bg-violet/15 flex items-center justify-center">
        <Upload size={24} className="text-violet-light" />
      </div>
      <div>
        <p className="text-text-primary font-medium">Drop a PDF or text file here</p>
        <p className="text-text-muted text-sm mt-1">Supports PDF, TXT, MD — max 10MB</p>
      </div>
      <input
        id="file-input"
        type="file"
        accept=".pdf,.txt,.md"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

function SourceNode({ node, index }: { node: { text: string; score: number }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-xl border border-white/10 p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Layers size={12} className="text-cyan" />
        <span className="text-xs text-text-muted">Node {index + 1}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div
            className="h-1.5 rounded-full"
            style={{
              width: `${node.score * 60 + 10}px`,
              background: `linear-gradient(90deg, #10b981, #06b6d4)`,
            }}
          />
          <span className="text-xs text-emerald font-mono">{(node.score * 100).toFixed(1)}%</span>
        </div>
      </div>
      <p className="text-text-secondary text-xs leading-relaxed line-clamp-3">{node.text}</p>
    </motion.div>
  );
}

export function LlamaIndexPage() {
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<LlamaIndexQueryResult | null>(null);
  const queryClient = useQueryClient();

  const { data: files = [] } = useQuery({
    queryKey: ['llamaindex-files'],
    queryFn: llamaindexApi.getFiles,
    refetchInterval: false,
  });

  const uploadMutation = useMutation({
    mutationFn: llamaindexApi.indexFile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['llamaindex-files'] });
      setSelectedIndex(data.indexId);
    },
  });

  const queryMutation = useMutation({
    mutationFn: () => llamaindexApi.query(selectedIndex!, query),
    onSuccess: setResult,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">LlamaIndex Demo</h1>
        <p className="section-subtitle">
          Document indexing, vector storage, retrieval, and Q&A using LlamaIndex.TS
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        {/* Upload & Files Panel */}
        <div className="space-y-4">
          {/* Upload */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">1. Upload Document</h3>
            <DropZone onFile={(f) => uploadMutation.mutate(f)} />
            {uploadMutation.isPending && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Loader2 size={14} className="animate-spin text-violet-light" />
                Parsing PDF, chunking, and embedding...
              </div>
            )}
            {uploadMutation.isSuccess && (
              <div className="flex items-center gap-2 text-sm text-emerald">
                <CheckCircle size={14} />
                Indexed {uploadMutation.data.nodeCount} nodes from {uploadMutation.data.filename}
              </div>
            )}
            {uploadMutation.isError && (
              <div className="flex items-center gap-2 text-sm text-rose">
                <AlertCircle size={14} />
                {(uploadMutation.error as Error).message}
              </div>
            )}
          </div>

          {/* Indexed files */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">2. Indexed Documents</h3>
            {files.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-4">No documents indexed yet</p>
            ) : (
              <div className="space-y-2">
                {files.map((file: LlamaIndexFile) => (
                  <button
                    key={file.indexId}
                    onClick={() => setSelectedIndex(file.indexId)}
                    className={cn(
                      'w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                      selectedIndex === file.indexId
                        ? 'bg-violet/15 border border-violet/30'
                        : 'hover:bg-white/5 border border-transparent'
                    )}
                  >
                    <FileText size={16} className="text-cyan mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary truncate font-medium">{file.filename}</p>
                      <p className="text-xs text-text-muted">{file.nodeCount} nodes indexed</p>
                    </div>
                    {selectedIndex === file.indexId && (
                      <CheckCircle size={14} className="text-violet-light ml-auto mt-0.5 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Query Panel */}
        <div className="space-y-4">
          {/* Query input */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">3. Ask a Question</h3>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={selectedIndex ? 'Ask a question about the document...' : 'Select a document first'}
              className="textarea min-h-[80px]"
              disabled={!selectedIndex}
            />
            <button
              onClick={() => queryMutation.mutate()}
              disabled={!selectedIndex || !query.trim() || queryMutation.isPending}
              className="btn-cyan"
            >
              {queryMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Search size={14} />
              )}
              {queryMutation.isPending ? 'Retrieving...' : 'Query Document'}
            </button>
          </div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {queryMutation.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card p-6 flex items-center gap-3"
              >
                <Loader2 size={18} className="animate-spin text-cyan" />
                <div>
                  <p className="text-text-primary text-sm font-medium">LlamaIndex Pipeline Running</p>
                  <p className="text-text-muted text-xs">Embedding query → Retrieving nodes → Synthesizing answer</p>
                </div>
              </motion.div>
            )}

            {result && !queryMutation.isPending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Retrieved Nodes */}
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers size={14} className="text-cyan" />
                    <h3 className="text-sm font-semibold text-text-primary">
                      Retrieved Nodes ({result.sourceNodes.length})
                    </h3>
                    <span className="badge-cyan ml-auto">Vector Search</span>
                  </div>
                  <div className="space-y-2">
                    {result.sourceNodes.map((node, i) => (
                      <SourceNode key={i} node={node} index={i} />
                    ))}
                  </div>
                </div>

                {/* Final Answer */}
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Target size={14} className="text-emerald" />
                    <h3 className="text-sm font-semibold text-text-primary">Synthesized Answer</h3>
                    <span className="badge-emerald ml-auto">~{result.tokensUsed} tokens</span>
                  </div>
                  <div className="markdown-content">
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
