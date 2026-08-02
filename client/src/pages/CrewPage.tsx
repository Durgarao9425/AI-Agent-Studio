// pages/CrewPage.tsx — CrewAI multi-agent workflow visualization

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Play, RotateCcw, CheckCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useCrewRun } from '../hooks/useCrewRun';
import { CrewStep } from '../types';
import { cn, formatDuration, formatTokens } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const AGENT_COLORS: Record<string, { color: string; bg: string; icon: string }> = {
  'Business Analyst': { color: '#10b981', bg: '#10b98115', icon: '📋' },
  'System Architect': { color: '#3b82f6', bg: '#3b82f615', icon: '🏗️' },
  'Frontend Engineer': { color: '#8b5cf6', bg: '#8b5cf615', icon: '🎨' },
  'Backend Engineer': { color: '#f59e0b', bg: '#f59e0b15', icon: '⚙️' },
  'QA Engineer': { color: '#f43f5e', bg: '#f43f5e15', icon: '🧪' },
};

function AgentStepCard({ step, index }: { step: CrewStep; index: number }) {
  const [expanded, setExpanded] = useState(true);
  const agentStyle = AGENT_COLORS[step.agent?.role || ''] || { color: '#7c3aed', bg: '#7c3aed15', icon: '🤖' };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      {/* Timeline connector */}
      {index > 0 && (
        <div
          className="absolute left-6 -top-6 w-0.5 h-6"
          style={{ background: `linear-gradient(${agentStyle.color}, ${agentStyle.color}40)` }}
        />
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${agentStyle.color}30` }}>
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-3.5 cursor-pointer"
          style={{ background: agentStyle.bg }}
          onClick={() => setExpanded(!expanded)}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border"
            style={{ borderColor: `${agentStyle.color}40`, background: `${agentStyle.color}20` }}
          >
            {agentStyle.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Agent {(step.agentIndex || 0) + 1}/{step.total}</span>
              <CheckCircle size={12} className="text-emerald" />
            </div>
            <p className="font-semibold text-text-primary text-sm">{step.agent?.role}</p>
            <p className="text-xs text-text-muted truncate">{step.agent?.outputLabel}</p>
          </div>

          <div className="flex items-center gap-3 ml-auto flex-shrink-0">
            <div className="text-right">
              <p className="text-xs text-text-muted">{formatDuration(step.durationMs || 0)}</p>
              <p className="text-xs text-text-muted">{formatTokens(step.tokensUsed || 0)} tokens</p>
            </div>
            {expanded ? (
              <ChevronUp size={14} className="text-text-muted" />
            ) : (
              <ChevronDown size={14} className="text-text-muted" />
            )}
          </div>
        </div>

        {/* Expanded output */}
        <AnimatePresence>
          {expanded && step.output && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t overflow-hidden"
              style={{ borderColor: `${agentStyle.color}20` }}
            >
              <div className="p-5 max-h-[400px] overflow-y-auto">
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {step.output}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function AgentProgress({ currentIndex, total }: { currentIndex: number; total: number }) {
  const agents = [
    { role: 'Business Analyst', icon: '📋' },
    { role: 'System Architect', icon: '🏗️' },
    { role: 'Frontend Engineer', icon: '🎨' },
    { role: 'Backend Engineer', icon: '⚙️' },
    { role: 'QA Engineer', icon: '🧪' },
  ];

  return (
    <div className="card p-5">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
        Crew Progress
      </h3>
      <div className="space-y-2">
        {agents.map((agent, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          const agentStyle = AGENT_COLORS[agent.role] || { color: '#7c3aed' };

          return (
            <div
              key={agent.role}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300',
                isActive ? 'bg-white/[0.08]' : isDone ? 'opacity-80' : 'opacity-40'
              )}
            >
              <span className="text-base">{agent.icon}</span>
              <span
                className="text-sm font-medium flex-1"
                style={{ color: isDone || isActive ? agentStyle.color : undefined }}
              >
                {agent.role}
              </span>
              {isDone && <CheckCircle size={14} className="text-emerald" />}
              {isActive && (
                <Loader2 size={14} className="animate-spin" style={{ color: agentStyle.color }} />
              )}
              {!isDone && !isActive && (
                <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CrewPage() {
  const [projectInput, setProjectInput] = useState('Build a Hostel Management System');
  const { steps, summary, isRunning, currentAgentIndex, error, runCrew, reset } = useCrewRun();

  const hasResults = steps.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">CrewAI Multi-Agent Demo</h1>
        <p className="section-subtitle">
          5-agent sequential pipeline: Business Analyst → Architect → Frontend → Backend → QA
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
        {/* Control Panel */}
        <div className="space-y-4">
          {/* Input */}
          <div className="card p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                Project Description
              </label>
              <textarea
                value={projectInput}
                onChange={(e) => setProjectInput(e.target.value)}
                placeholder="Describe your project..."
                className="textarea min-h-[100px]"
                disabled={isRunning}
              />
            </div>

            {/* Quick examples */}
            <div>
              <p className="text-xs text-text-muted mb-2">Examples:</p>
              <div className="space-y-1.5">
                {[
                  'Build a Hostel Management System',
                  'Create an E-commerce Platform',
                  'Design a Hospital Management System',
                  'Build a Learning Management System',
                ].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setProjectInput(ex)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg glass border border-white/10 text-text-secondary hover:text-text-primary hover:border-white/20 transition-all"
                    disabled={isRunning}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => runCrew(projectInput)}
                disabled={isRunning || !projectInput.trim()}
                className="btn-primary flex-1 justify-center"
              >
                {isRunning ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Play size={14} />
                )}
                {isRunning ? 'Running...' : 'Launch Crew'}
              </button>
              {hasResults && (
                <button onClick={reset} className="btn-secondary px-3">
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Progress */}
          {(isRunning || hasResults) && (
            <AgentProgress
              currentIndex={isRunning ? currentAgentIndex : 5}
              total={5}
            />
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {error && (
            <div className="card p-4 border-rose/20">
              <p className="text-rose text-sm">Error: {error}</p>
            </div>
          )}

          {!hasResults && !isRunning && (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald/20 to-cyan/20 flex items-center justify-center mb-4 border border-white/10">
                <Users size={28} className="text-emerald" />
              </div>
              <h3 className="font-semibold text-text-primary">Ready to Launch</h3>
              <p className="text-text-muted text-sm mt-1 max-w-sm">
                Enter a project description and click "Launch Crew" to run the multi-agent pipeline.
                Each agent builds upon the previous one's output.
              </p>
            </div>
          )}

          {/* Agent Steps */}
          <div className="space-y-4">
            {steps.map((step, i) => (
              <AgentStepCard key={i} step={step} index={i} />
            ))}
          </div>

          {/* Loading next agent */}
          {isRunning && currentAgentIndex < 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-5 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-violet/20 flex items-center justify-center">
                <Loader2 size={18} className="animate-spin text-violet-light" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {Object.keys(AGENT_COLORS)[currentAgentIndex] || 'Agent'} is working...
                </p>
                <p className="text-xs text-text-muted">Processing and generating output</p>
              </div>
            </motion.div>
          )}

          {/* Summary */}
          <AnimatePresence>
            {summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 border-violet/20"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet to-cyan flex items-center justify-center">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary">Project Executive Summary</h3>
                    <p className="text-xs text-text-muted">Generated from all agent outputs</p>
                  </div>
                </div>
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
