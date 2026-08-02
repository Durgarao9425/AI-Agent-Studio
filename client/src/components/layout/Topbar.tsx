// components/layout/Topbar.tsx — Top navigation bar with page title and status.

import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Bell, Cpu } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { cn } from '../../lib/utils';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'AI metrics and overview' },
  '/chat': { title: 'AI Chat Assistant', subtitle: 'Streaming conversations with AI agents' },
  '/agents': { title: 'Agent Selection', subtitle: 'Choose and configure specialized AI agents' },
  '/tools': { title: 'Tool Calling', subtitle: 'OpenAI function calling demonstration' },
  '/crew': { title: 'CrewAI Demo', subtitle: 'Multi-agent sequential workflow' },
  '/langchain': { title: 'LangChain Demo', subtitle: 'Chains, memory, and prompt templates' },
  '/llamaindex': { title: 'LlamaIndex Demo', subtitle: 'Document indexing and Q&A' },
  '/rag': { title: 'RAG Visualization', subtitle: 'Retrieval-Augmented Generation pipeline' },
  '/playground': { title: 'Prompt Playground', subtitle: 'Experiment with prompts and parameters' },
  '/timeline': { title: 'Activity Timeline', subtitle: 'All AI actions and events' },
  '/settings': { title: 'Settings', subtitle: 'Configure API keys and model preferences' },
};

export function Topbar() {
  const location = useLocation();
  const { model, apiKey, isConfigured } = useSettingsStore();

  const pageInfo = PAGE_TITLES[location.pathname] || {
    title: 'AI Agent Studio',
    subtitle: 'Production AI Showcase',
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 flex items-center justify-between px-6 border-b border-white/5"
      style={{ background: 'rgba(10, 15, 30, 0.8)', backdropFilter: 'blur(20px)' }}
    >
      {/* Page Info */}
      <div>
        <h1 className="text-text-primary font-semibold text-base leading-none">
          {pageInfo.title}
        </h1>
        <p className="text-text-muted text-xs mt-0.5">{pageInfo.subtitle}</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Model badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass border border-white/10 text-xs">
          <Cpu size={12} className="text-violet-light" />
          <span className="text-text-secondary">{model}</span>
        </div>

        {/* API key status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald/10 text-emerald border border-emerald/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
          Local AI Engine (100% Offline)
        </div>

        {/* Notification bell */}
        <button className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
          <Bell size={14} />
        </button>
      </div>
    </motion.header>
  );
}
