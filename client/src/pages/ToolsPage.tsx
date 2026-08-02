// pages/ToolsPage.tsx — OpenAI Function Calling demonstration

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Wrench, Play, CheckCircle, AlertCircle, Loader2, Code2, Terminal } from 'lucide-react';
import { toolsApi } from '../api';
import { Tool, ToolCallResponse } from '../types';
import { cn, formatDuration } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { Message } from '../types';
import { generateId } from '../lib/utils';

const TOOL_ICONS: Record<string, string> = {
  calculator: '🧮',
  current_time: '🕐',
  json_formatter: '📋',
  regex_generator: '🔤',
  sql_generator: '🗄️',
  email_generator: '📧',
  javascript_generator: '⚡',
  react_component_generator: '⚛️',
  api_docs_generator: '📚',
};

function ToolCard({ tool, selected, onClick }: { tool: Tool; selected: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-xl border transition-all duration-200',
        selected
          ? 'bg-violet/15 border-violet/40 text-violet-light'
          : 'glass border-white/10 text-text-secondary hover:border-white/20 hover:text-text-primary'
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{TOOL_ICONS[tool.name] || '🔧'}</span>
        <div>
          <p className="text-sm font-semibold font-mono">{tool.name}</p>
          <p className="text-xs mt-0.5 leading-relaxed opacity-70">{tool.description.slice(0, 80)}...</p>
        </div>
      </div>
    </motion.button>
  );
}

export function ToolsPage() {
  const [input, setInput] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [result, setResult] = useState<ToolCallResponse | null>(null);

  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: toolsApi.getAll,
  });

  const toolMutation = useMutation({
    mutationFn: ({ message, tools }: { message: string; tools: string[] }) => {
      const messages: Message[] = [{ id: generateId(), role: 'user', content: message, timestamp: new Date() }];
      return toolsApi.call(messages, tools);
    },
    onSuccess: (data) => setResult(data),
  });

  const toggleTool = (toolName: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolName) ? prev.filter((t) => t !== toolName) : [...prev, toolName]
    );
  };

  const handleRun = () => {
    if (!input.trim()) return;
    toolMutation.mutate({ message: input, tools: selectedTools });
  };

  const EXAMPLE_QUERIES = [
    'Calculate the compound interest on $10,000 at 5% for 10 years',
    'What is the current time in Tokyo?',
    'Format this JSON: {"name":"John","age":30,"city":"NYC"}',
    'Generate a regex pattern for validating email addresses',
    'Write a SQL query to get the top 10 customers by total order value',
    'Generate a TypeScript utility function to deep clone an object',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Tool Calling</h1>
        <p className="section-subtitle">
          OpenAI Function Calling — AI selects and executes tools to answer your questions
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        {/* Tools Panel */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Available Tools ({tools.length})
              </h3>
              <button
                onClick={() => setSelectedTools(selectedTools.length === tools.length ? [] : tools.map(t => t.name))}
                className="text-xs text-violet-light hover:underline"
              >
                {selectedTools.length === tools.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="space-y-2">
              {tools.map((tool) => (
                <ToolCard
                  key={tool.name}
                  tool={tool}
                  selected={selectedTools.includes(tool.name)}
                  onClick={() => toggleTool(tool.name)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="space-y-4">
          {/* Input */}
          <div className="card p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                Your Message
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something that requires using a tool..."
                className="textarea min-h-[80px]"
              />
            </div>

            {/* Example queries */}
            <div>
              <p className="text-xs text-text-muted mb-2">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-xs px-3 py-1.5 rounded-lg glass border border-white/10 text-text-secondary hover:text-text-primary hover:border-white/20 transition-all"
                  >
                    {q.slice(0, 45)}...
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRun}
              disabled={!input.trim() || toolMutation.isPending}
              className="btn-primary"
            >
              {toolMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              {toolMutation.isPending ? 'Running...' : 'Run Tool Call'}
            </button>
          </div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {toolMutation.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card p-6 flex items-center justify-center gap-3"
              >
                <Loader2 size={20} className="animate-spin text-violet-light" />
                <p className="text-text-secondary">OpenAI is selecting and calling tools...</p>
              </motion.div>
            )}

            {result && !toolMutation.isPending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Tool Calls */}
                {result.toolCalls.length > 0 && (
                  <div className="card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Wrench size={14} className="text-amber" />
                      <h3 className="text-sm font-semibold text-text-primary">
                        Tools Called ({result.toolCalls.length})
                      </h3>
                      <span className="badge-amber ml-auto">
                        {formatDuration(result.durationMs)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {result.toolCalls.map((tc, i) => {
                        const toolResult = result.toolResults[i];
                        return (
                          <div key={tc.id} className="rounded-xl border border-white/10 overflow-hidden">
                            {/* Tool call header */}
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5">
                              <span className="text-base">{TOOL_ICONS[tc.name] || '🔧'}</span>
                              <code className="text-sm font-mono text-cyan">{tc.name}</code>
                              {toolResult?.error ? (
                                <AlertCircle size={14} className="text-rose ml-auto" />
                              ) : (
                                <CheckCircle size={14} className="text-emerald ml-auto" />
                              )}
                            </div>

                            {/* Arguments */}
                            <div className="px-4 py-3 border-t border-white/5">
                              <p className="text-xs text-text-muted mb-1.5">Arguments:</p>
                              <pre className="code-block text-xs text-text-secondary">
                                {JSON.stringify(tc.arguments, null, 2)}
                              </pre>
                            </div>

                            {/* Result */}
                            <div className="px-4 py-3 border-t border-white/5">
                              <p className="text-xs text-text-muted mb-1.5">Output:</p>
                              {toolResult?.error ? (
                                <p className="text-rose text-sm">{toolResult.error}</p>
                              ) : (
                                <pre className="code-block text-xs text-emerald">
                                  {JSON.stringify(toolResult?.output, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Final Response */}
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Terminal size={14} className="text-violet-light" />
                    <h3 className="text-sm font-semibold text-text-primary">AI Response</h3>
                    <span className="badge-violet ml-auto">{result.tokensUsed} tokens</span>
                  </div>
                  <div className="markdown-content">
                    <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                      {result.response}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}

            {toolMutation.isError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card p-5 border-rose/20"
              >
                <div className="flex items-center gap-2 text-rose">
                  <AlertCircle size={16} />
                  <p className="text-sm">{(toolMutation.error as Error).message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
