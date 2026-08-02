// components/layout/Layout.tsx — Main app layout wrapper.
// Positions the sidebar and content area with proper spacing.

import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../../store/useSettingsStore';
import { cn } from '../../lib/utils';
import { LayoutDashboard, MessageSquare, Bot, GitBranch, Settings } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const BOTTOM_NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', color: '#7c3aed' },
  { path: '/chat', icon: MessageSquare, label: 'Chat', color: '#06b6d4' },
  { path: '/agents', icon: Bot, label: 'Agents', color: '#8b5cf6' },
  { path: '/langchain', icon: GitBranch, label: 'LangChain', color: '#3b82f6' },
  { path: '/settings', icon: Settings, label: 'Settings', color: '#8899cc' },
];

export function Layout({ children }: LayoutProps) {
  const { collapsed, mobileSidebarOpen, setMobileSidebarOpen } = useSettingsStore();
  const location = useLocation();

  return (
    <div className="min-h-screen flex relative overflow-x-hidden pb-16 md:pb-0" style={{ background: '#0a0f1e' }}>
      {/* Mobile Sidebar backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar />

      {/* Main content — dynamic offset by sidebar width */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 min-h-screen relative z-10 transition-all duration-300",
        collapsed ? "md:pl-[72px]" : "md:pl-[260px]"
      )}>
        <Topbar />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex-1 p-6 overflow-y-auto min-w-0"
        >
          {children}
        </motion.main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#0d1224]/90 backdrop-blur-lg border-t border-white/5 z-40 md:hidden flex items-center justify-around px-2 shadow-lg">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200",
                isActive ? "text-white" : "text-text-secondary"
              )}
            >
              <div 
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  isActive ? "bg-white/10" : ""
                )}
                style={{ color: isActive ? item.color : undefined }}
              >
                <item.icon size={18} />
              </div>
              <span className="text-[9px] font-medium tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Ambient background glows */}
      <div
        className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(124, 58, 237, 0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(6, 182, 212, 0.05) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
}
