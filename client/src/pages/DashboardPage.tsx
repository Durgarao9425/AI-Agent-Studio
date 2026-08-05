// pages/DashboardPage.tsx — Premium AI metrics dashboard

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Cpu, Zap, DollarSign, Clock, FileText, Bot, TrendingUp,
  Activity, ArrowUpRight, MoreHorizontal, RefreshCw
} from 'lucide-react';
import { metricsApi } from '../api';
import { MetricsSnapshot } from '../types';
import { formatTokens, formatCost, formatDuration } from '../lib/utils';

const CHART_COLORS = ['#a78bfa', '#67e8f9', '#34d399', '#fbbf24', '#f472b6', '#60a5fa'];

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: string;
  sub?: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  delay?: number;
  trend?: string;
}

function StatCard({ icon: Icon, label, value, sub, color, gradientFrom, gradientTo, delay = 0, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
      whileHover={{ y: -2 }}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        border: `1px solid rgba(255,255,255,0.07)`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${color}30`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px ${color}20, 0 0 40px ${color}08`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
      }}
    >
      {/* Background gradient splash */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.08] group-hover:opacity-[0.14] transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, ${color}, transparent)`,
          filter: 'blur(20px)',
          transform: 'translate(30%, -30%)',
        }}
      />

      {/* Top gradient line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }}
      />

      <div className="relative p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${gradientFrom}20, ${gradientTo}10)`,
              border: `1px solid ${color}25`,
              boxShadow: `0 0 20px ${color}15`,
            }}
          >
            <Icon size={18} style={{ color }} />
          </div>

          {trend && (
            <div
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg"
              style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}
            >
              <ArrowUpRight size={11} />
              {trend}
            </div>
          )}
        </div>

        {/* Value */}
        <p
          className="text-3xl font-black leading-none tracking-tight mb-1"
          style={{ color: '#f0f6ff' }}
        >
          {value}
        </p>

        {/* Label */}
        <p className="text-[13px] font-semibold mb-1" style={{ color: 'rgba(248,250,252,0.6)' }}>
          {label}
        </p>

        {/* Sub */}
        {sub && (
          <p className="text-[11px]" style={{ color: 'rgba(100,116,139,0.8)' }}>
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(10,15,35,0.97)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    color: '#f0f6ff',
    fontSize: '12px',
    padding: '10px 14px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  labelStyle: { color: '#a78bfa', fontWeight: '600', marginBottom: '4px' },
  itemStyle: { color: '#e2e8f0' },
};

function ChartCard({
  children,
  title,
  icon: Icon,
  iconColor,
  delay = 0,
}: {
  children: React.ReactNode;
  title: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  iconColor: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Subtle inner glow at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] opacity-50"
        style={{ background: `linear-gradient(90deg, transparent, ${iconColor}40, transparent)` }}
      />

      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: `${iconColor}15`, border: `1px solid ${iconColor}25` }}
            >
              <Icon size={13} style={{ color: iconColor }} />
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
          </div>
          <button
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'rgba(100,116,139,0.6)', background: 'rgba(255,255,255,0.03)' }}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

export function DashboardPage() {
  const { data: metrics, isLoading } = useQuery<MetricsSnapshot>({
    queryKey: ['metrics-snapshot'],
    queryFn: metricsApi.getSnapshot,
  });

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
        { name: 'engineer', count: 5 },
        { name: 'frontend', count: 3 },
        { name: 'reviewer', count: 7 },
      ];

  const costData = metrics?.costPerModel?.length
    ? metrics.costPerModel
    : [{ model: 'gpt-4o', cost: 0.024 }, { model: 'gpt-4o-mini', cost: 0.003 }];

  const statCards = [
    {
      icon: Zap, label: 'Total Requests', color: '#a78bfa',
      gradientFrom: '#7c3aed', gradientTo: '#a78bfa',
      value: (metrics?.totalRequests || 0).toString(),
      sub: 'All API calls since server start',
      trend: '+12%',
    },
    {
      icon: Clock, label: 'Avg Response Time', color: '#67e8f9',
      gradientFrom: '#06b6d4', gradientTo: '#67e8f9',
      value: formatDuration(metrics?.avgResponseTimeMs || 0),
      sub: 'Mean latency across all requests',
    },
    {
      icon: Cpu, label: 'Total Tokens', color: '#34d399',
      gradientFrom: '#10b981', gradientTo: '#34d399',
      value: formatTokens(metrics?.totalTokens || 0),
      sub: 'Tokens processed by LLMs',
      trend: '+8%',
    },
    {
      icon: DollarSign, label: 'Est. Cost', color: '#fbbf24',
      gradientFrom: '#f59e0b', gradientTo: '#fbbf24',
      value: formatCost(metrics?.estimatedCostUSD || 0),
      sub: 'Estimated OpenAI spend',
    },
    {
      icon: Bot, label: 'Active Agents', color: '#c084fc',
      gradientFrom: '#8b5cf6', gradientTo: '#c084fc',
      value: Object.keys(metrics?.agentsUsed || {}).length.toString(),
      sub: 'Unique agents invoked',
      trend: '+3',
    },
    {
      icon: FileText, label: 'Docs Indexed', color: '#f472b6',
      gradientFrom: '#ec4899', gradientTo: '#f472b6',
      value: (metrics?.documentsIndexed || 0).toString(),
      sub: 'Documents in vector store',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px]">

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Good{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #a78bfa, #67e8f9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
            </span>{' '}
            👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(100,116,139,0.9)' }}>
            Here's your AI operations overview for today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl font-medium"
            style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live · every 15s
          </div>
          <button
            className="p-2 rounded-xl text-slate-500 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            sub={card.sub}
            color={card.color}
            gradientFrom={card.gradientFrom}
            gradientTo={card.gradientTo}
            delay={i * 0.05}
            trend={card.trend}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Requests Over Time */}
        <ChartCard title="Requests Over Time" icon={TrendingUp} iconColor="#a78bfa" delay={0.3}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={requestsData}>
              <defs>
                <linearGradient id="requestGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#a78bfa"
                fill="url(#requestGrad)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Token Usage */}
        <ChartCard title="Token Usage Over Time" icon={Cpu} iconColor="#67e8f9" delay={0.35}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={tokensData}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="tokens"
                stroke="#67e8f9"
                fill="url(#tokenGrad)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#67e8f9', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Agent Usage */}
        <ChartCard title="Agent Usage Breakdown" icon={Bot} iconColor="#34d399" delay={0.4}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agentsData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {agentsData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Cost Per Model */}
        <ChartCard title="Cost Per Model" icon={DollarSign} iconColor="#fbbf24" delay={0.45}>
          {costData.length > 0 ? (
            <div className="flex gap-4 items-center">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={costData}
                    dataKey="cost"
                    nameKey="model"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={48}
                    strokeWidth={0}
                    paddingAngle={3}
                  >
                    {costData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: number) => formatCost(v)} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex-1 space-y-3">
                {costData.map((d, i) => (
                  <div key={d.model} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          background: CHART_COLORS[i % CHART_COLORS.length],
                          boxShadow: `0 0 8px ${CHART_COLORS[i % CHART_COLORS.length]}60`,
                        }}
                      />
                      <span className="text-[12px] text-slate-400 truncate">{d.model}</span>
                    </div>
                    <span
                      className="text-[12px] font-bold font-mono flex-shrink-0"
                      style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                    >
                      {formatCost(d.cost)}
                    </span>
                  </div>
                ))}

                <div
                  className="mt-3 pt-3 flex items-center justify-between"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-[11px] text-slate-500">Total Spend</span>
                  <span className="text-sm font-black text-white">
                    {formatCost(costData.reduce((a, b) => a + b.cost, 0))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
              >
                <Activity size={20} style={{ color: '#fbbf24' }} />
              </div>
              <p className="text-slate-500 text-sm">No cost data yet</p>
              <p className="text-slate-600 text-xs">Run some AI requests to see breakdown</p>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
