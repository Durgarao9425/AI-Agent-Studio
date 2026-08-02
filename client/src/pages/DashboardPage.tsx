// pages/DashboardPage.tsx — AI metrics dashboard with live charts

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Cpu, Zap, DollarSign, Clock, FileText, Bot, TrendingUp } from 'lucide-react';
import { metricsApi } from '../api';
import { MetricsSnapshot } from '../types';
import { formatTokens, formatCost, formatDuration } from '../lib/utils';

const CHART_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay = 0,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card relative overflow-hidden group hover:border-white/20 transition-all duration-300"
    >
      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle, ${color}, transparent)`, filter: 'blur(20px)' }}
      />

      <div className="relative z-10 flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <p className="text-text-muted text-xs mb-1">{label}</p>
          <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
          {sub && <p className="text-text-muted text-xs mt-1.5">{sub}</p>}
        </div>
      </div>
    </motion.div>
  );
}

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: '#0f1629',
    border: '1px solid #1e2a4a',
    borderRadius: '12px',
    color: '#f0f4ff',
    fontSize: '12px',
  },
};

export function DashboardPage() {
  const { data: metrics, isLoading } = useQuery<MetricsSnapshot>({
    queryKey: ['metrics-snapshot'],
    queryFn: metricsApi.getSnapshot,
    refetchInterval: 15000, // Refresh every 15s
  });

  // Demo data for charts if no real data exists yet
  const demoRequestsOverTime = [
    { hour: '12:00', count: 3 }, { hour: '13:00', count: 7 },
    { hour: '14:00', count: 12 }, { hour: '15:00', count: 5 },
    { hour: '16:00', count: 18 }, { hour: '17:00', count: 14 },
  ];

  const demoTokensOverTime = [
    { hour: '12:00', tokens: 1200 }, { hour: '13:00', tokens: 3400 },
    { hour: '14:00', tokens: 5600 }, { hour: '15:00', tokens: 2100 },
    { hour: '16:00', tokens: 8900 }, { hour: '17:00', tokens: 6700 },
  ];

  const requestsData = metrics?.requestsOverTime?.length ? metrics.requestsOverTime : demoRequestsOverTime;
  const tokensData = metrics?.tokensOverTime?.length ? metrics.tokensOverTime : demoTokensOverTime;
  const agentsData = metrics?.agentsUsed
    ? Object.entries(metrics.agentsUsed).map(([name, count]) => ({ name, count }))
    : [
        { name: 'software-engineer', count: 5 },
        { name: 'frontend-developer', count: 3 },
        { name: 'code-reviewer', count: 7 },
      ];

  const costData = metrics?.costPerModel?.length
    ? metrics.costPerModel
    : [{ model: 'gpt-4o', cost: 0.024 }, { model: 'gpt-4o-mini', cost: 0.003 }];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">AI Dashboard</h1>
          <p className="section-subtitle">Real-time metrics from all AI operations</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <div className="status-dot-green" />
          Live · refreshes every 15s
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          icon={Zap} label="Total Requests" color="#7c3aed" delay={0}
          value={(metrics?.totalRequests || 0).toString()}
          sub="All API calls since server start"
        />
        <StatCard
          icon={Clock} label="Avg Response Time" color="#06b6d4" delay={0.05}
          value={formatDuration(metrics?.avgResponseTimeMs || 0)}
          sub="Mean latency across all requests"
        />
        <StatCard
          icon={Cpu} label="Total Tokens" color="#10b981" delay={0.1}
          value={formatTokens(metrics?.totalTokens || 0)}
          sub="Tokens processed by LLMs"
        />
        <StatCard
          icon={DollarSign} label="Est. Cost" color="#f59e0b" delay={0.15}
          value={formatCost(metrics?.estimatedCostUSD || 0)}
          sub="Estimated OpenAI spend"
        />
        <StatCard
          icon={Bot} label="Agents Used" color="#8b5cf6" delay={0.2}
          value={Object.keys(metrics?.agentsUsed || {}).length.toString()}
          sub="Unique agents invoked"
        />
        <StatCard
          icon={FileText} label="Docs Indexed" color="#f43f5e" delay={0.25}
          value={(metrics?.documentsIndexed || 0).toString()}
          sub="Documents in vector store"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Requests Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-violet-light" />
            <h3 className="text-sm font-semibold text-text-primary">Requests Over Time</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={requestsData}>
              <defs>
                <linearGradient id="requestGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a4a" />
              <XAxis dataKey="hour" tick={{ fill: '#8899cc', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8899cc', fontSize: 11 }} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="count" stroke="#7c3aed" fill="url(#requestGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Token Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={14} className="text-cyan" />
            <h3 className="text-sm font-semibold text-text-primary">Token Usage Over Time</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={tokensData}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a4a" />
              <XAxis dataKey="hour" tick={{ fill: '#8899cc', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8899cc', fontSize: 11 }} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="tokens" stroke="#06b6d4" fill="url(#tokenGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Agents Used */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bot size={14} className="text-emerald" />
            <h3 className="text-sm font-semibold text-text-primary">Agent Usage</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agentsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a4a" />
              <XAxis dataKey="name" tick={{ fill: '#8899cc', fontSize: 10 }} />
              <YAxis tick={{ fill: '#8899cc', fontSize: 11 }} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {agentsData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Cost Per Model */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={14} className="text-amber" />
            <h3 className="text-sm font-semibold text-text-primary">Cost Per Model</h3>
          </div>
          {costData.length > 0 ? (
            <div className="flex gap-4 items-center">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={costData} dataKey="cost" nameKey="model" cx="50%" cy="50%" outerRadius={80} strokeWidth={0}>
                    {costData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: number) => formatCost(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {costData.map((d, i) => (
                  <div key={d.model} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-xs text-text-secondary">{d.model}</span>
                    <span className="text-xs font-mono text-text-muted ml-auto">{formatCost(d.cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-8">No cost data yet</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
