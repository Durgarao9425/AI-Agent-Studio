// pages/TimelinePage.tsx — Activity timeline showing all AI events

import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Activity, RefreshCw } from 'lucide-react';
import { metricsApi } from '../api';
import { ActivityEntry } from '../types';
import { cn, formatRelativeTime, formatDuration, formatCost, getActivityTypeColor } from '../lib/utils';

const TYPE_ICONS: Record<string, string> = {
  chat: '💬',
  tool: '🔧',
  crew: '👥',
  rag: '🗄️',
  llamaindex: '🔍',
  langchain: '🔗',
  playground: '🎮',
};

const STATUS_COLORS: Record<string, string> = {
  success: '#10b981',
  error: '#f43f5e',
  streaming: '#f59e0b',
};

function TimelineItem({ entry, index }: { entry: ActivityEntry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex gap-4 group"
    >
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 border"
          style={{
            background: `${STATUS_COLORS[entry.status] || '#7c3aed'}15`,
            borderColor: `${STATUS_COLORS[entry.status] || '#7c3aed'}30`,
          }}
        >
          {TYPE_ICONS[entry.type] || '⚡'}
        </div>
        <div className="w-px flex-1 mt-2 mb-2 bg-white/5" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div
          className="rounded-xl border p-4 transition-all duration-200 hover:border-white/15 group-hover:bg-white/2"
          style={{ borderColor: 'rgba(30, 42, 74, 0.6)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('badge text-[10px]', getActivityTypeColor(entry.type))}>
                  {entry.type.toUpperCase()}
                </span>
                {entry.status === 'success' && (
                  <span className="badge badge-emerald text-[10px]">SUCCESS</span>
                )}
                {entry.status === 'error' && (
                  <span className="badge bg-rose/15 text-rose border-rose/25 text-[10px]">ERROR</span>
                )}
                {entry.agentId && (
                  <span className="text-[10px] text-text-muted font-mono">@{entry.agentId}</span>
                )}
                {entry.toolName && (
                  <span className="text-[10px] text-text-muted font-mono">{entry.toolName}</span>
                )}
              </div>
              <p className="text-sm font-medium text-text-primary mt-1.5 truncate">{entry.label}</p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-xs text-text-muted">{formatRelativeTime(entry.timestamp)}</p>
              <p className="text-xs text-text-muted mt-0.5">{formatDuration(entry.durationMs)}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
            {entry.tokens && (
              <span>🔢 {entry.tokens.toLocaleString()} tokens</span>
            )}
            {entry.cost !== undefined && entry.cost > 0 && (
              <span>💰 {formatCost(entry.cost)}</span>
            )}
            <span>⏱ {formatDuration(entry.durationMs)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TimelinePage() {
  const { data: activities = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['timeline'],
    queryFn: () => metricsApi.getTimeline(50),
    refetchInterval: 10000, // Auto-refresh every 10s
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-title">Activity Timeline</h1>
          <p className="section-subtitle">Every AI action tracked in real-time</p>
        </div>
        <button
          onClick={() => refetch()}
          className={cn('btn-secondary gap-2', isFetching && 'opacity-70')}
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex-shrink-0" />
              <div className="flex-1 rounded-xl bg-white/5 h-20" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet/15 flex items-center justify-center mb-4">
            <Activity size={28} className="text-violet-light" />
          </div>
          <h3 className="font-semibold text-text-primary">No Activity Yet</h3>
          <p className="text-text-muted text-sm mt-1">
            Use any feature — Chat, Tools, CrewAI, RAG — and activities will appear here.
          </p>
        </div>
      ) : (
        <div className="max-w-3xl">
          <AnimatePresence initial={false}>
            {activities.map((entry, i) => (
              <TimelineItem key={entry.id} entry={entry} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
