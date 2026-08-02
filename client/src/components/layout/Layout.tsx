// components/layout/Layout.tsx — Main app layout wrapper.
// Positions the sidebar and content area with proper spacing.

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex" style={{ background: '#0a0f1e' }}>
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <div className="flex-1 flex flex-col ml-[260px] min-w-0 min-h-screen relative z-10">
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
