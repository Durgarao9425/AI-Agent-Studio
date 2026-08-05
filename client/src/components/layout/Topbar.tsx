// components/layout/Topbar.tsx — Premium top navigation bar with gradient accents

import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Bell, Cpu, Menu, ChevronRight, Home } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { cn } from '../../lib/utils';

const PAGE_TITLES: Record<string, { title: string; subtitle: string; breadcrumb: string[] }> = {
  '/': { title: 'Dashboard', subtitle: 'AI metrics and system overview', breadcrumb: ['Home'] },
  '/chat': { title: 'AI Chat Assistant', subtitle: 'Streaming conversations with AI agents', breadcrumb: ['Home', 'Chat'] },
  '/agents': { title: 'Agent Selection', subtitle: 'Choose and configure specialized AI agents', breadcrumb: ['Home', 'Agents'] },
  '/tools': { title: 'Tool Calling', subtitle: 'OpenAI function calling demonstration', breadcrumb: ['Home', 'Tools'] },
  '/crew': { title: 'CrewAI Demo', subtitle: 'Multi-agent sequential workflow', breadcrumb: ['Home', 'CrewAI'] },
  '/langchain': { title: 'LangChain Demo', subtitle: 'Chains, memory, and prompt templates', breadcrumb: ['Home', 'LangChain'] },
  '/llamaindex': { title: 'LlamaIndex Demo', subtitle: 'Document indexing and Q&A', breadcrumb: ['Home', 'LlamaIndex'] },
  '/playground': { title: 'Prompt Playground', subtitle: 'Experiment with prompts and parameters', breadcrumb: ['Home', 'Playground'] },
  '/timeline': { title: 'Activity Timeline', subtitle: 'All AI actions and events', breadcrumb: ['Home', 'Timeline'] },
  '/settings': { title: 'Settings', subtitle: 'Configure API keys and model preferences', breadcrumb: ['Home', 'Settings'] },
  '/profile': { title: 'User Profile', subtitle: 'Manage your developer details and credits', breadcrumb: ['Home', 'Profile'] },
};

export function Topbar() {
  const location = useLocation();
  const { model, apiKey, setMobileSidebarOpen } = useSettingsStore();

  const pageInfo = PAGE_TITLES[location.pathname] || {
    title: 'AI Agent Studio',
    subtitle: 'Production AI Showcase',
    breadcrumb: ['Home'],
  };

  const isLive = !apiKey || apiKey === 'local-offline-ai-engine' || apiKey === 'demo-mode';
  const connectionLabel = isLive
    ? 'Local AI'
    : apiKey?.startsWith('sk-or-')
      ? 'OpenRouter'
      : 'OpenAI';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="sticky top-0 z-30 flex-shrink-0"
      style={{
        background: 'rgba(8, 13, 26, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 1px 40px rgba(0,0,0,0.3)',
      }}
    >
      {/* Gradient accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.6) 30%, rgba(6,182,212,0.6) 70%, transparent 100%)' }}
      />

      <div className="h-16 flex items-center justify-between px-5 gap-4">
        {/* Left: Mobile menu + Page info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Mobile menu button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white transition-colors flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Menu size={18} />
          </motion.button>

          {/* Page title + breadcrumb */}
          <div className="min-w-0">
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 mb-0.5">
              {pageInfo.breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={10} className="text-slate-600" />}
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: i === pageInfo.breadcrumb.length - 1 ? 'rgba(167,139,250,0.9)' : 'rgba(100,116,139,0.7)' }}
                  >
                    {crumb}
                  </span>
                </span>
              ))}
            </div>
            <h1 className="text-white font-bold text-[15px] leading-none tracking-tight truncate">
              {pageInfo.title}
            </h1>
          </div>
        </div>

        {/* Right: Status indicators */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Model badge */}
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
            style={{
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.2)',
              color: '#a78bfa',
            }}
          >
            <Cpu size={11} />
            <span className="truncate max-w-[100px]">{model}</span>
          </div>

          {/* Connection status */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold",
            )}
            style={{
              background: isLive ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)',
              border: `1px solid ${isLive ? 'rgba(16,185,129,0.25)' : 'rgba(124,58,237,0.25)'}`,
              color: isLive ? '#34d399' : '#a78bfa',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{
                background: isLive ? '#34d399' : '#a78bfa',
                boxShadow: `0 0 6px ${isLive ? '#34d399' : '#a78bfa'}`,
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            <span className="hidden sm:inline">{connectionLabel}</span>
            <span
              className="hidden sm:inline px-1.5 py-0.5 rounded-md text-[10px]"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              {isLive ? 'Offline' : 'Live'}
            </span>
          </div>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Bell size={14} />
            {/* Notification dot */}
            <span
              className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
              style={{ background: '#a78bfa', boxShadow: '0 0 4px #a78bfa' }}
            />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
