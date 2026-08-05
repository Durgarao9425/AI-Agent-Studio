// components/layout/Layout.tsx — Premium main app layout wrapper.

import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../../store/useSettingsStore';
import { cn } from '../../lib/utils';
import { LayoutDashboard, MessageSquare, Bot, Settings, Wrench } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const BOTTOM_NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Home', color: '#a78bfa' },
  { path: '/chat', icon: MessageSquare, label: 'Chat', color: '#67e8f9' },
  { path: '/agents', icon: Bot, label: 'Agents', color: '#c084fc' },
  { path: '/tools', icon: Wrench, label: 'Tools', color: '#fbbf24' },
  { path: '/settings', icon: Settings, label: 'Settings', color: '#94a3b8' },
];

export function Layout({ children }: LayoutProps) {
  const { collapsed, mobileSidebarOpen, setMobileSidebarOpen } = useSettingsStore();
  const location = useLocation();

  return (
    <div
      className="h-screen overflow-hidden flex relative"
      style={{
        background: 'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(124,58,237,0.08) 0%, #080c18 45%, #060a14 100%)',
      }}
    >
      {/* Mobile Sidebar backdrop */}
      {mobileSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar />

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10 transition-all duration-300",
        collapsed ? "md:pl-[72px]" : "md:pl-[260px]"
      )}>
        <Topbar />
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="flex-1 p-4 md:p-6 overflow-y-auto min-w-0 pb-24 md:pb-6"
        >
          {children}
        </motion.main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        style={{
          background: 'rgba(8, 13, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Top gradient accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5), rgba(6,182,212,0.5), transparent)' }}
        />
        <div className="flex items-center justify-around px-2 h-16">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-1 py-1.5 px-3 transition-all duration-200"
              >
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="p-1.5 rounded-xl transition-all duration-200"
                  style={{
                    background: isActive ? `${item.color}18` : 'transparent',
                    color: isActive ? item.color : 'rgba(100,116,139,0.7)',
                    boxShadow: isActive ? `0 0 12px ${item.color}30` : 'none',
                  }}
                >
                  <item.icon size={18} />
                </motion.div>
                <span
                  className="text-[9px] font-semibold tracking-wide"
                  style={{ color: isActive ? item.color : 'rgba(100,116,139,0.5)' }}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Ambient background glows — more vibrant */}
      <div
        className="fixed top-0 left-1/3 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.05) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="fixed bottom-0 right-1/4 w-[500px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(6,182,212,0.04) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="fixed top-1/2 left-0 w-[300px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(167,139,250,0.03) 0%, transparent 70%)',
          filter: 'blur(80px)',
          transform: 'translateY(-50%)',
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />
    </div>
  );
}
