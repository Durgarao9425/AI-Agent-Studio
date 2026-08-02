// pages/LangChainPage.tsx — Visual LangChain chain demonstration

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { GitBranch, Play, Brain, ArrowRight, RotateCcw, Loader2, Database } from 'lucide-react';
import { langchainApi } from '../api';
import { LangChainChainResult } from '../types';
import { cn, generateId } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface ChainComponent {
  id: string;
  name: string;
  type: string;
  description: string;
  color: string;
  code: string;
}

function ChainNode({ component, isActive }: { component: ChainComponent; isActive: boolean }) {
  return (
    <motion.div
      animate={isActive ? { scale: 1.05, boxShadow: `0 0 20px ${component.color}40` } : { scale: 1 }}
      className="relative rounded-xl border p-4 transition-all duration-300"
      style={{
        borderColor: isActive ? component.color : `${component.color}30`,
        background: isActive ? `${component.color}10` : `${component.color}05`,
      }}
    >
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ background: `${component.color}08` }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: component.color, background: `${component.color}15` }}
          >
            {component.type}
          </span>
        </div>
        <h4 className="font-bold text-text-primary text-sm">{component.name}</h4>
        <p className="text-text-muted text-xs mt-1 leading-relaxed">{component.description.slice(0, 100)}...</p>
        <pre className="mt-2 text-[10px] font-mono text-text-secondary bg-black/30 rounded-lg p-2 overflow-x-auto">
          {component.code.slice(0, 150)}...
        </pre>
      </div>
    </motion.div>
  );
}

export function LangChainPage() {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant specializing in technology.');
  const [userPrompt, setUserPrompt] = useState('Explain how LangChain simplifies AI development in 3 bullet points.');
  const [temperature, setTemperature] = useState(0.7);
  const [result, setResult] = useState<LangChainChainResult | null>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [sessionId] = useState(() => generateId());
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string; memory?: string }>>([]);

  const { data: componentData } = useQuery({
    queryKey: ['langchain-components'],
    queryFn: langchainApi.getComponents,
  });

  const chainMutation = useMutation({
    mutationFn: () => langchainApi.runChain(systemPrompt, userPrompt, temperature),
    onMutate: async () => {
      // Animate through the chain nodes
      const nodes = componentData?.flow || ['prompt-template', 'llm', 'output-parser'];
      for (const node of nodes) {
        setActiveNode(node);
        await new Promise((r) => setTimeout(r, 800));
      }
    },
    onSuccess: (data) => {
      setResult(data);
      setActiveNode(null);
    },
    onError: () => setActiveNode(null),
  });

  const conversationMutation = useMutation({
    mutationFn: (msg: string) => langchainApi.conversation(sessionId, msg),
    onSuccess: (data) => {
      setChatMessages((prev) => [
        ...prev,
        { role: 'user', content: chatInput },
        { role: 'assistant', content: data.response, memory: data.memoryContents },
      ]);
      setChatInput('');
    },
  });

  const components: ChainComponent[] = (componentData as { components: ChainComponent[] })?.components || [];
  const flow = (componentData as { flow: string[] })?.flow || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">LangChain Demo</h1>
        <p className="section-subtitle">
          PromptTemplate → ChatOpenAI LLM → StringOutputParser with ConversationChain memory
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chain Visualizer */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-5">
              <GitBranch size={16} className="text-violet-light" />
              <h3 className="text-sm font-semibold text-text-primary">LCEL Chain Architecture</h3>
            </div>

            {/* Chain diagram */}
            <div className="space-y-3">
              {flow.map((nodeId, i) => {
                const component = components.find((c) => c.id === nodeId);
                if (!component) return null;
                return (
                  <div key={nodeId}>
                    <ChainNode component={component} isActive={activeNode === nodeId} />
                    {i < flow.length - 1 && (
                      <div className="flex justify-center my-2">
                        <motion.div
                          animate={activeNode === nodeId ? { y: [0, 4, 0] } : {}}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                        >
                          <ArrowRight size={16} className="text-text-muted rotate-90" />
                        </motion.div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Memory component */}
          {components.find(c => c.id === 'memory') && (
            <ChainNode
              component={components.find(c => c.id === 'memory')!}
              isActive={conversationMutation.isPending}
            />
          )}
        </div>

        {/* Control Panel */}
        <div className="space-y-4">
          {/* Prompt Chain */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Prompt Chain</h3>

            <div>
              <label className="text-xs text-text-muted block mb-1.5">System Prompt</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="textarea text-xs min-h-[60px]"
              />
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1.5">User Prompt</label>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="textarea text-xs min-h-[60px]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs text-text-muted">Temperature: {temperature}</label>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-violet"
              />
            </div>

            <button
              onClick={() => chainMutation.mutate()}
              disabled={chainMutation.isPending}
              className="btn-primary w-full justify-center"
            >
              {chainMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              Run Chain
            </button>

            {/* Chain Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="rounded-xl border border-white/10 p-3 bg-black/20">
                  <p className="text-xs text-text-muted mb-1">Formatted Prompt sent to LLM:</p>
                  <pre className="text-[11px] text-text-secondary font-mono whitespace-pre-wrap">
                    {result.chain.formattedPrompt}
                  </pre>
                </div>
                <div className="rounded-xl border border-emerald/20 p-4" style={{ background: '#10b98108' }}>
                  <p className="text-xs text-emerald mb-2">StringOutputParser → Output:</p>
                  <div className="markdown-content text-sm">
                    <ReactMarkdown>{result.output}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Conversation with Memory */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Database size={14} className="text-cyan" />
              <h3 className="text-sm font-semibold text-text-primary">ConversationChain + BufferMemory</h3>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-xl px-3 py-2 text-xs',
                    msg.role === 'user'
                      ? 'bg-violet/15 text-violet-light ml-8'
                      : 'glass text-text-secondary mr-8'
                  )}
                >
                  <span className="font-semibold">{msg.role === 'user' ? 'You' : 'AI'}:</span>{' '}
                  {msg.content}
                </div>
              ))}
              {chatMessages.length === 0 && (
                <p className="text-text-muted text-xs text-center py-4">
                  Chat here — memory accumulates across messages
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && chatInput.trim() && conversationMutation.mutate(chatInput)}
                placeholder="Say something (memory is retained)..."
                className="input flex-1 text-xs"
                disabled={conversationMutation.isPending}
              />
              <button
                onClick={() => conversationMutation.mutate(chatInput)}
                disabled={!chatInput.trim() || conversationMutation.isPending}
                className="btn-primary px-3"
              >
                {conversationMutation.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Play size={12} />
                )}
              </button>
            </div>

            {/* Memory display */}
            {chatMessages.some((m) => m.memory) && (
              <div className="rounded-xl border border-cyan/20 p-3 bg-cyan/5">
                <p className="text-xs text-cyan mb-1.5">📦 BufferMemory Contents:</p>
                <pre className="text-[10px] text-text-muted font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                  {(() => {
                    const withMemory = chatMessages.filter((m) => m.memory);
                    return withMemory[withMemory.length - 1]?.memory;
                  })()}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
