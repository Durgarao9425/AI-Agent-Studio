// pages/ProfilePage.tsx — User Profile screen displaying account information, billing status and metrics summary.

import { motion } from 'framer-motion';
import { User, Mail, Shield, CreditCard, Activity, Cpu, Layers } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { cn } from '../lib/utils';

export function ProfilePage() {
  const { apiKey, model } = useSettingsStore();
  const isOR = apiKey?.startsWith('sk-or-');
  const isDemo = !apiKey || apiKey === 'local-offline-ai-engine' || apiKey === 'demo-mode';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="section-title">User Profile</h1>
        <p className="section-subtitle">Manage your account information and workspace settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 flex flex-col items-center text-center space-y-4 md:col-span-1"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet to-cyan flex items-center justify-center border border-white/10 shadow-lg shadow-violet/10">
            <User size={48} className="text-white animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-lg">Veera Durgarao</h3>
            <p className="text-violet-light text-xs font-semibold mt-0.5">Founder & AI Developer</p>
          </div>
          <div className="w-full pt-4 border-t border-white/5 space-y-2 text-left">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Mail size={12} className="text-text-muted" />
              <span className="truncate">veeradurgarao840@gmail.com</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Shield size={12} className="text-text-muted" />
              <span>Workspace Admin</span>
            </div>
          </div>
        </motion.div>

        {/* Workspace Account Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 space-y-6 md:col-span-2"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <Layers size={16} className="text-violet-light" />
            <h3 className="text-sm font-semibold text-text-primary">Workspace Account Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Account ID</p>
              <p className="text-sm font-mono text-text-primary bg-black/30 px-2 py-1 rounded border border-white/5">
                usr_durgarao9425
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Default Workspace</p>
              <p className="text-sm font-semibold text-text-primary">AI Agent Studio Workspace</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Active Provider</p>
              <p className={cn(
                "text-sm font-semibold",
                isDemo ? "text-emerald" : "text-violet-light"
              )}>
                {isDemo 
                  ? "Local AI Engine (Offline)" 
                  : isOR 
                    ? "OpenRouter (Live)" 
                    : "OpenAI (Live)"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Selected Model</p>
              <div className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                <Cpu size={12} className="text-violet-light" />
                <span>{model}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet/15 flex items-center justify-center border border-violet/30">
                <CreditCard size={18} className="text-violet-light" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Estimated Credits Balance</p>
                <p className="text-sm font-bold text-text-primary">$0.0342 USD</p>
              </div>
            </div>
            <a 
              href="https://openrouter.ai/settings/credits"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Add Credits
            </a>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6 space-y-4"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <Activity size={16} className="text-cyan animate-pulse" />
          <h3 className="text-sm font-semibold text-text-primary">Developer Activity Stats</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Total Agents</p>
            <p className="text-lg font-bold text-text-primary mt-1">6 Active</p>
          </div>
          <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Workspace Health</p>
            <p className="text-lg font-bold text-emerald mt-1">Optimal</p>
          </div>
          <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">RAG Vector Engine</p>
            <p className="text-lg font-bold text-text-primary mt-1">Enabled</p>
          </div>
          <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Platform Status</p>
            <p className="text-lg font-bold text-violet-light mt-1">Connected</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
