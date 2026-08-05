// components/layout/Sidebar.tsx — Premium navigation sidebar with glassmorphism design

import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  User,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useSettingsStore } from '../../store/useSettingsStore';

const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard', color: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
      { path: '/chat', icon: MessageSquare, label: 'AI Chat', color: '#67e8f9', glow: 'rgba(103,232,249,0.15)' },
      { path: '/agents', icon: Bot, label: 'Agents', color: '#c084fc', glow: 'rgba(192,132,252,0.15)' },
    ]
  },
  {
    label: 'Tools',
    items: [
      { path: '/tools', icon: Wrench, label: 'Tool Calling', color: '#fbbf24', glow: 'rgba(251,191,36,0.15)' },
      { path: '/crew', icon: Users, label: 'CrewAI Demo', color: '#34d399', glow: 'rgba(52,211,153,0.15)' },
      { path: '/langchain', icon: GitBranch, label: 'LangChain', color: '#60a5fa', glow: 'rgba(96,165,250,0.15)' },
      { path: '/llamaindex', icon: FileSearch, label: 'LlamaIndex', color: '#67e8f9', glow: 'rgba(103,232,249,0.15)' },
    ]
  },
  {
    label: 'Account',
    items: [
      { path: '/timeline', icon: Activity, label: 'Timeline', color: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
      { path: '/profile', icon: User, label: 'Profile', color: '#f472b6', glow: 'rgba(244,114,182,0.15)' },
      { path: '/settings', icon: Settings, label: 'Settings', color: '#94a3b8', glow: 'rgba(148,163,184,0.15)' },
    ]
  }
];

export function Sidebar() {
  const { collapsed, setCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useSettingsStore();
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className={cn(
        "fixed left-0 top-0 h-screen z-50 flex flex-col overflow-hidden transition-transform duration-300",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
      style={{
        background: 'linear-gradient(180deg, #080d1a 0%, #0a0f20 40%, #080c18 100%)',
        borderRight: '1px solid rgba(124, 58, 237, 0.12)',
        boxShadow: '4px 0 30px rgba(0,0,0,0.5), inset -1px 0 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #7c3aed, #06b6d4, transparent)' }}
      />

      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 border-b",
        collapsed ? "py-5 justify-center" : "py-5"
      )}
        style={{ borderColor: 'rgba(255,255,255,0.04)' }}
      >
        <motion.div
          whileHover={{ scale: 1.08, rotate: 15 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            boxShadow: '0 0 20px rgba(124,58,237,0.4), 0 0 40px rgba(6,182,212,0.15)',
          }}
        >
          <Sparkles size={16} className="text-white" />
          <div
            className="absolute inset-0 rounded-xl opacity-50"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2), transparent)' }}
          />
        </motion.div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-bold text-white text-[15px] leading-none tracking-tight">AI Agent</p>
              <p
                className="text-xs font-semibold mt-0.5 tracking-wider uppercase"
                style={{
                  background: 'linear-gradient(90deg, #a78bfa, #67e8f9)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Studio
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {NAV_SECTIONS.map((section) => {
          return (
            <div key={section.label}>
              <AnimatePresence>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5"
                    style={{ color: 'rgba(148,163,184,0.4)' }}
                  >
                    {section.label}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);

                  return (
                    <NavLink key={item.path} to={item.path} onClick={() => setMobileSidebarOpen(false)}>
                      <motion.div
                        whileHover={{ x: collapsed ? 0 : 2 }}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          'relative flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group overflow-hidden',
                          collapsed && 'justify-center px-2',
                          isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                        )}
                        style={
                          isActive
                            ? {
                                background: `linear-gradient(135deg, ${item.glow}, rgba(255,255,255,0.04))`,
                                border: `1px solid ${item.color}25`,
                                boxShadow: `0 0 20px ${item.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                              }
                            : { background: 'transparent', border: '1px solid transparent' }
                        }
                      >
                        {/* Hover background */}
                        {!isActive && (
                          <div
                            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            style={{ background: 'rgba(255,255,255,0.03)' }}
                          />
                        )}

                        {/* Icon */}
                        <div
                          className="relative flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                          style={{
                            background: isActive ? `${item.color}20` : 'transparent',
                            color: isActive ? item.color : 'inherit',
                          }}
                        >
                          <item.icon size={15} />
                        </div>

                        <AnimatePresence>
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="whitespace-nowrap text-[13px] font-medium flex-1"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* Active indicator dot */}
                        {isActive && !collapsed && (
                          <motion.div
                            layoutId="active-dot"
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{
                              background: item.color,
                              boxShadow: `0 0 8px ${item.color}`,
                            }}
                          />
                        )}

                        {/* Collapsed tooltip */}
                        {collapsed && (
                          <div
                            className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap
                                        opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-0 group-hover:translate-x-0 z-50"
                            style={{
                              background: '#1a1f3a',
                              border: '1px solid rgba(255,255,255,0.1)',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            }}
                          >
                            {item.label}
                          </div>
                        )}
                      </motion.div>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom: Version info + Collapse */}
      <div className="px-2 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        {/* Version tag */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg"
              style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-400">v1.0.0 · All systems go</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 group"
          style={{
            color: 'rgba(148,163,184,0.5)',
            border: '1px solid transparent',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(148,163,184,0.5)';
          }}
        >
          {collapsed
            ? <ChevronRight size={14} />
            : (
              <>
                <ChevronLeft size={14} />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )
          }
        </button>
      </div>
    </motion.aside>
  );
}
