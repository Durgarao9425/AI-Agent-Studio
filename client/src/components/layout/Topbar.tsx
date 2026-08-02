// components/layout/Topbar.tsx — Top navigation bar with page title and status.

import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Bell, Cpu, Menu } from 'lucide-react';
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
  '/playground': { title: 'Prompt Playground', subtitle: 'Experiment with prompts and parameters' },
  '/timeline': { title: 'Activity Timeline', subtitle: 'All AI actions and events' },
  '/settings': { title: 'Settings', subtitle: 'Configure API keys and model preferences' },
};

export function Topbar() {
  const location = useLocation();
  const { model, apiKey, setMobileSidebarOpen } = useSettingsStore();

  const pageInfo = PAGE_TITLES[location.pathname] || {
    title: 'AI Agent Studio',
    subtitle: 'Production AI Showcase',
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 border-b border-white/5 flex-shrink-0"
      style={{ background: 'rgba(10, 15, 30, 0.85)', backdropFilter: 'blur(20px)' }}
    >
      {/* Page Info */}
      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
        <button 
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden p-2 -ml-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-text-primary font-semibold text-sm sm:text-base leading-none truncate">
            {pageInfo.title}
          </h1>
          <p className="text-text-muted text-[10px] sm:text-xs mt-0.5 truncate hidden xs:block">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Model badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg glass border border-white/10 text-xs">
          <Cpu size={12} className="text-violet-light" />
          <span className="text-text-secondary truncate max-w-[120px]">{model}</span>
        </div>

        {/* API key status */}
        <div className={cn(
          "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border",
          !apiKey || apiKey === 'local-offline-ai-engine' || apiKey === 'demo-mode'
            ? "bg-emerald/10 text-emerald border-emerald/20" 
            : "bg-violet/10 text-violet-light border-violet/20"
        )}>
          <div className={cn(
            "w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0",
            !apiKey || apiKey === 'local-offline-ai-engine' || apiKey === 'demo-mode' ? "bg-emerald" : "bg-violet-light"
          )} />
          <span className="hidden sm:inline">
            {!apiKey || apiKey === 'local-offline-ai-engine' || apiKey === 'demo-mode' 
              ? "Local AI (Offline)" 
              : apiKey.startsWith('sk-or-') 
                ? "OpenRouter (Live)" 
                : "OpenAI (Live)"}
          </span>
          <span className="sm:hidden text-[10px]">
            {!apiKey || apiKey === 'local-offline-ai-engine' || apiKey === 'demo-mode' 
              ? "Offline" 
              : "Live"}
          </span>
        </div>

        {/* Notification bell */}
        <button className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
          <Bell size={14} />
        </button>
      </div>
    </motion.header>
  );
}
