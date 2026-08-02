// components/layout/Sidebar.tsx — The main navigation sidebar.
// Uses Framer Motion for smooth expand/collapse animations.

import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Bot,
  Wrench,
  Users,
  GitBranch,
  FileSearch,
  Database,
  Sliders,
  LayoutDashboard,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', color: '#7c3aed' },
  { path: '/chat', icon: MessageSquare, label: 'AI Chat', color: '#06b6d4' },
  { path: '/agents', icon: Bot, label: 'Agents', color: '#8b5cf6' },
  { path: '/tools', icon: Wrench, label: 'Tool Calling', color: '#f59e0b' },
  { path: '/crew', icon: Users, label: 'CrewAI Demo', color: '#10b981' },
  { path: '/langchain', icon: GitBranch, label: 'LangChain', color: '#3b82f6' },
  { path: '/llamaindex', icon: FileSearch, label: 'LlamaIndex', color: '#06b6d4' },
  { path: '/rag', icon: Database, label: 'RAG Pipeline', color: '#f43f5e' },
  { path: '/playground', icon: Sliders, label: 'Playground', color: '#a78bfa' },
  { path: '/timeline', icon: Activity, label: 'Timeline', color: '#67e8f9' },
  { path: '/settings', icon: Settings, label: 'Settings', color: '#8899cc' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-screen z-50 flex flex-col overflow-hidden shadow-2xl"
      style={{
        background: '#0d1224',
        borderRight: '1px solid rgba(30, 42, 74, 0.8)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet to-cyan flex items-center justify-center flex-shrink-0"
        >
          <Zap size={18} className="text-white" />
        </motion.div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <p className="font-bold text-text-primary text-sm leading-none">AI Agent</p>
            <p className="text-violet-light text-xs font-medium mt-0.5">Studio</p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 4 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group',
                  isActive
                    ? 'bg-white/[0.08] text-white border border-white/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                    isActive ? 'bg-white/10' : 'group-hover:bg-white/5'
                  )}
                  style={{ color: isActive ? item.color : undefined }}
                >
                  <item.icon size={16} />
                </div>

                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}

                {isActive && !collapsed && (
                  <motion.div
                    layoutId="active-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-2 py-3 border-t border-white/5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-all duration-200 text-xs"
        >
          {collapsed ? <ChevronRight size={14} /> : (
            <>
              <ChevronLeft size={14} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
