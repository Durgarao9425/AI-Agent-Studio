// pages/ChatPage.tsx — AI Chat with streaming, markdown, agent selection, and history

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, Trash2, Bot, User, Copy, Check, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { useQuery } from '@tanstack/react-query';
import { useChat } from '../hooks/useChat';
import { agentsApi } from '../api';
import { Agent, Message } from '../types';
import { cn, formatDuration, formatTokens } from '../lib/utils';

function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1',
          isUser
            ? 'bg-gradient-to-br from-violet to-violet-dark'
            : 'bg-gradient-to-br from-cyan-dark to-blue-600'
        )}
      >
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>

      {/* Content */}
      <div className={cn('max-w-[75%] space-y-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm relative',
            isUser
              ? 'bg-gradient-to-br from-violet/30 to-violet-dark/30 border border-violet/30 text-text-primary rounded-tr-sm'
              : 'glass border border-white/10 rounded-tl-sm'
          )}
        >
          {isUser ? (
            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  a: ({ node, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" className="text-cyan-light hover:underline font-semibold" />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Copy button */}
          <button
            onClick={copyToClipboard}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded glass"
          >
            {copied ? (
              <Check size={12} className="text-emerald" />
            ) : (
              <Copy size={12} className="text-text-muted" />
            )}
          </button>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 px-1">
          <span className="text-text-muted text-xs">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.tokensUsed && (
            <span className="text-text-muted text-xs">{formatTokens(message.tokensUsed)} tokens</span>
          )}
          {message.durationMs && (
            <span className="text-text-muted text-xs">{formatDuration(message.durationMs)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TypingIndicator({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-dark to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
        <Bot size={14} className="text-white" />
      </div>
      <div className="glass border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[75%]">
        {content ? (
          <div className="markdown-content typing-cursor">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                a: ({ node, ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" className="text-cyan-light hover:underline font-semibold" />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-violet-light"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ChatPage() {
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: agentsApi.getAll,
  });

  const { messages, isStreaming, streamingContent, sendMessage, clearHistory, stopStream } =
    useChat({ agentId: selectedAgent?.id });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-4">
      {/* Agent Selector Sidebar */}
      <div className="w-64 flex flex-col gap-3">
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Select Agent
          </h3>
          <div className="space-y-1.5">
            <button
              onClick={() => setSelectedAgent(null)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                !selectedAgent
                  ? 'bg-violet/15 text-violet-light border border-violet/20'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              )}
            >
              <Bot size={14} />
              Default AI
            </button>
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-left',
                  selectedAgent?.id === agent.id
                    ? 'border text-text-primary'
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                )}
                style={
                  selectedAgent?.id === agent.id
                    ? {
                        backgroundColor: `${agent.color}15`,
                        borderColor: `${agent.color}30`,
                        color: agent.color,
                      }
                    : {}
                }
              >
                <span>{agent.avatar}</span>
                <span className="truncate">{agent.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected agent info */}
        <AnimatePresence mode="wait">
          {selectedAgent && (
            <motion.div
              key={selectedAgent.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedAgent.avatar}</span>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{selectedAgent.name}</p>
                  <p className="text-xs text-text-muted">{selectedAgent.role}</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{selectedAgent.goal}</p>
              <div className="flex flex-wrap gap-1">
                {selectedAgent.expertise.slice(0, 3).map((e) => (
                  <span key={e} className="badge-violet text-[10px]">
                    {e}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col card p-0 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="status-dot-green" />
            <span className="text-sm font-medium text-text-primary">
              {selectedAgent ? selectedAgent.name : 'AI Assistant'}
            </span>
            {isStreaming && (
              <span className="text-xs text-violet-light animate-pulse">Generating...</span>
            )}
          </div>
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-muted hover:text-rose text-xs hover:bg-rose/10 transition-all duration-200"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <AnimatePresence initial={false}>
            {messages.length === 0 && !isStreaming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet/20 to-cyan/20 flex items-center justify-center mb-4 border border-white/10">
                  <Bot size={28} className="text-violet-light" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {selectedAgent ? `Chat with ${selectedAgent.name}` : 'Start a conversation'}
                </h3>
                <p className="text-text-muted text-sm mt-1 max-w-sm">
                  {selectedAgent
                    ? selectedAgent.goal
                    : 'Ask anything — I support markdown, code highlighting, and streaming responses.'}
                </p>
              </motion.div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {isStreaming && <TypingIndicator content={streamingContent} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-5 py-4 border-t border-white/10">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${selectedAgent?.name || 'AI Assistant'}... (Enter to send, Shift+Enter for newline)`}
                className="textarea min-h-[48px] max-h-[120px] pt-3"
                rows={1}
                disabled={isStreaming}
              />
            </div>
            {isStreaming ? (
              <button
                type="button"
                onClick={stopStream}
                className="btn-secondary flex-shrink-0 h-12 px-4"
              >
                <Square size={14} className="text-rose" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="btn-primary flex-shrink-0 h-12 px-4"
              >
                <Send size={14} />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
