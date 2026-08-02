// pages/AgentsPage.tsx — Agent showcase with detail view and capability browser

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Bot, Target, BookOpen, Thermometer, Wrench, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { agentsApi } from '../api';
import { Agent } from '../types';
import { cn } from '../lib/utils';

function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="card-hover cursor-pointer relative overflow-hidden group"
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${agent.color}, transparent)` }}
      />

      {/* Glow effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at top left, ${agent.color}08 0%, transparent 60%)`,
        }}
      />

      <div className="flex items-start gap-4 relative z-10">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border"
          style={{ background: `${agent.color}15`, borderColor: `${agent.color}30` }}
        >
          {agent.avatar}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-text-primary">{agent.name}</h3>
              <p className="text-text-muted text-xs mt-0.5">{agent.role}</p>
            </div>
            <ChevronRight size={16} className="text-text-muted mt-1 flex-shrink-0 group-hover:text-text-primary transition-colors" />
          </div>

          <p className="text-text-secondary text-sm mt-2 leading-relaxed line-clamp-2">
            {agent.goal}
          </p>

          {/* Expertise tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {agent.expertise.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium border"
                style={{
                  color: agent.color,
                  background: `${agent.color}10`,
                  borderColor: `${agent.color}25`,
                }}
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Thermometer size={10} />
              Temp: {agent.temperature}
            </span>
            <span className="flex items-center gap-1">
              <Wrench size={10} />
              {agent.tools.length} tools
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AgentDetail({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div
        className="px-6 py-5 border-b border-white/10"
        style={{ background: `linear-gradient(135deg, ${agent.color}10, transparent)` }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border"
            style={{ background: `${agent.color}15`, borderColor: `${agent.color}30` }}
          >
            {agent.avatar}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{agent.name}</h2>
            <p className="text-text-muted text-sm">{agent.role}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium border"
                style={{ color: agent.color, background: `${agent.color}10`, borderColor: `${agent.color}25` }}
              >
                Temperature: {agent.temperature}
              </span>
              <span className="badge-cyan">{agent.tools.length} Tools</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-320px)]">
        {/* Goal */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className="text-violet-light" />
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Goal</h4>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">{agent.goal}</p>
        </div>

        {/* Backstory */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-cyan" />
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Backstory</h4>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">{agent.backstory}</p>
        </div>

        {/* System Prompt */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bot size={14} className="text-emerald" />
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">System Prompt</h4>
          </div>
          <pre className="code-block text-xs text-text-secondary leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
            {agent.systemPrompt}
          </pre>
        </div>

        {/* Tools */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={14} className="text-amber" />
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Available Tools</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {agent.tools.map((tool) => (
              <span key={tool} className="badge-amber text-xs font-mono">
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* Expertise */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Expertise</h4>
          <div className="flex flex-wrap gap-2">
            {agent.expertise.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-full text-xs font-medium border"
                style={{ color: agent.color, background: `${agent.color}10`, borderColor: `${agent.color}25` }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => navigate(`/chat?agent=${agent.id}`)}
          className="btn-primary w-full justify-center"
        >
          <Bot size={14} />
          Chat with {agent.name}
        </button>
      </div>
    </motion.div>
  );
}

export function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: agentsApi.getAll,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">AI Agents</h1>
        <p className="section-subtitle">
          Specialized AI personas with custom system prompts, goals, and tool access
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Agent Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 content-start">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card animate-pulse h-44" />
              ))
            : agents.map((agent, i) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <AgentCard
                    agent={agent}
                    onClick={() => setSelectedAgent(agent)}
                  />
                </motion.div>
              ))}
        </div>

        {/* Detail Panel */}
        <AnimatePresence mode="wait">
          {selectedAgent ? (
            <AgentDetail
              key={selectedAgent.id}
              agent={selectedAgent}
              onClose={() => setSelectedAgent(null)}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card flex flex-col items-center justify-center text-center p-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet/20 to-cyan/20 flex items-center justify-center mb-4 border border-white/10">
                <Bot size={28} className="text-violet-light" />
              </div>
              <h3 className="font-semibold text-text-primary">Select an Agent</h3>
              <p className="text-text-muted text-sm mt-1">
                Click any agent to see their role, goal, backstory, and system prompt
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
