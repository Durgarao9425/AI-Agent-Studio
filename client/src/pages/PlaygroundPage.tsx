// pages/PlaygroundPage.tsx — Prompt Playground with parameter controls and A/B comparison

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Sliders, Play, Loader2, Columns, BarChart3, Copy, Check } from 'lucide-react';
import { playgroundApi } from '../api';
import { PlaygroundResult } from '../types';
import { cn, formatDuration, formatCost, formatTokens } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

const MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4-turbo'];

interface PromptConfig {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
}

function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  color = '#7c3aed',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  color?: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <label className="text-xs text-text-muted">{label}</label>
        <span className="text-xs font-mono" style={{ color }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
    </div>
  );
}

function OutputPanel({
  title,
  content,
  tokensUsed,
  durationMs,
  cost,
  color = '#7c3aed',
}: {
  title: string;
  content: string;
  tokensUsed: number;
  durationMs: number;
  cost: number;
  color?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col rounded-2xl border overflow-hidden" style={{ borderColor: `${color}30` }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: `${color}20`, background: `${color}08` }}>
        <span className="text-sm font-semibold text-text-primary">{title}</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-text-muted">{formatTokens(tokensUsed)} tokens</span>
          <span className="text-xs text-text-muted">{formatDuration(durationMs)}</span>
          <span className="text-xs font-mono" style={{ color }}>{formatCost(cost)}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald" /> : <Copy size={12} className="text-text-muted" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto max-h-96">
        <div className="markdown-content text-sm">
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export function PlaygroundPage() {
  const [config, setConfig] = useState<PromptConfig>({
    systemPrompt: 'You are a helpful AI assistant.',
    userPrompt: 'Explain quantum computing in simple terms.',
    model: 'gpt-4o',
    temperature: 0.7,
    topP: 1,
    maxTokens: 1024,
  });

  const [compareConfig, setCompareConfig] = useState<PromptConfig>({
    ...config,
    model: 'gpt-4o-mini',
    temperature: 0.3,
  });

  const [compareMode, setCompareMode] = useState(false);
  const [result, setResult] = useState<PlaygroundResult | null>(null);

  const runMutation = useMutation({
    mutationFn: () =>
      playgroundApi.run({
        systemPrompt: config.systemPrompt,
        userPrompt: config.userPrompt,
        temperature: config.temperature,
        topP: config.topP,
        maxTokens: config.maxTokens,
        compareConfig: compareMode
          ? {
              systemPrompt: compareConfig.systemPrompt,
              userPrompt: compareConfig.userPrompt,
              model: compareConfig.model,
              temperature: compareConfig.temperature,
              maxTokens: compareConfig.maxTokens,
            }
          : undefined,
      }),
    onSuccess: setResult,
  });

  const updateConfig = (key: keyof PromptConfig, value: unknown) =>
    setConfig((prev) => ({ ...prev, [key]: value }));
  const updateCompare = (key: keyof PromptConfig, value: unknown) =>
    setCompareConfig((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-title">Prompt Playground</h1>
          <p className="section-subtitle">Experiment with prompts, parameters, and compare outputs</p>
        </div>
        <button
          onClick={() => setCompareMode(!compareMode)}
          className={cn('btn-secondary gap-2', compareMode && 'bg-violet/15 border-violet/30 text-violet-light')}
        >
          <Columns size={14} />
          {compareMode ? 'Single Mode' : 'Compare Mode'}
        </button>
      </div>

      <div className={cn('grid gap-6', compareMode ? 'grid-cols-2' : 'grid-cols-1 xl:grid-cols-[340px_1fr]')}>
        {/* Config A */}
        <div className="card p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-violet-light" />
            <h3 className="text-sm font-semibold text-text-primary">
              {compareMode ? 'Config A' : 'Prompt Configuration'}
            </h3>
          </div>

          {/* Model */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Model</label>
            <select
              value={config.model}
              onChange={(e) => updateConfig('model', e.target.value)}
              className="input text-sm"
            >
              {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* System Prompt */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">System Prompt</label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => updateConfig('systemPrompt', e.target.value)}
              className="textarea text-xs min-h-[70px]"
            />
          </div>

          {/* User Prompt */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">User Prompt</label>
            <textarea
              value={config.userPrompt}
              onChange={(e) => updateConfig('userPrompt', e.target.value)}
              className="textarea text-xs min-h-[90px]"
            />
          </div>

          {/* Parameters */}
          <div className="space-y-4">
            <ParamSlider label="Temperature" value={config.temperature} min={0} max={2} step={0.1}
              onChange={(v) => updateConfig('temperature', v)} color="#7c3aed" />
            <ParamSlider label="Top P" value={config.topP} min={0} max={1} step={0.05}
              onChange={(v) => updateConfig('topP', v)} color="#06b6d4" />
            <ParamSlider label="Max Tokens" value={config.maxTokens} min={256} max={4096} step={128}
              onChange={(v) => updateConfig('maxTokens', v)} color="#10b981" />
          </div>

          {!compareMode && (
            <button
              onClick={() => runMutation.mutate()}
              disabled={!config.userPrompt.trim() || runMutation.isPending}
              className="btn-primary w-full justify-center"
            >
              {runMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {runMutation.isPending ? 'Generating...' : 'Run Prompt'}
            </button>
          )}
        </div>

        {/* Config B (compare mode) */}
        {compareMode && (
          <div className="card p-5 space-y-5" style={{ borderColor: 'rgba(6,182,212,0.2)' }}>
            <div className="flex items-center gap-2">
              <Sliders size={14} className="text-cyan" />
              <h3 className="text-sm font-semibold text-text-primary">Config B</h3>
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1.5">Model</label>
              <select value={compareConfig.model} onChange={(e) => updateCompare('model', e.target.value)} className="input text-sm">
                {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1.5">System Prompt</label>
              <textarea value={compareConfig.systemPrompt} onChange={(e) => updateCompare('systemPrompt', e.target.value)} className="textarea text-xs min-h-[70px]" />
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1.5">User Prompt (optional override)</label>
              <textarea value={compareConfig.userPrompt} onChange={(e) => updateCompare('userPrompt', e.target.value)} className="textarea text-xs min-h-[90px]" />
            </div>

            <div className="space-y-4">
              <ParamSlider label="Temperature" value={compareConfig.temperature} min={0} max={2} step={0.1} onChange={(v) => updateCompare('temperature', v)} color="#06b6d4" />
              <ParamSlider label="Max Tokens" value={compareConfig.maxTokens} min={256} max={4096} step={128} onChange={(v) => updateCompare('maxTokens', v)} color="#10b981" />
            </div>
          </div>
        )}

        {/* Run button for compare mode */}
        {compareMode && (
          <div className="col-span-2">
            <button
              onClick={() => runMutation.mutate()}
              disabled={!config.userPrompt.trim() || runMutation.isPending}
              className="btn-primary justify-center w-full max-w-xs mx-auto block"
            >
              {runMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />}
              {runMutation.isPending ? 'Comparing...' : 'Compare Outputs'}
            </button>
          </div>
        )}

        {/* Output(s) */}
        <AnimatePresence mode="wait">
          {result && !runMutation.isPending && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(compareMode ? 'col-span-2 grid grid-cols-2 gap-6' : '')}
            >
              <OutputPanel
                title={compareMode ? `Config A — ${config.model}` : 'Output'}
                content={result.primary.content}
                tokensUsed={result.primary.tokensUsed}
                durationMs={result.primary.durationMs}
                cost={result.primary.cost}
                color="#7c3aed"
              />
              {compareMode && result.comparison && (
                <OutputPanel
                  title={`Config B — ${compareConfig.model}`}
                  content={result.comparison.content}
                  tokensUsed={result.comparison.tokensUsed}
                  durationMs={result.comparison.durationMs}
                  cost={0}
                  color="#06b6d4"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!compareMode && runMutation.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-8 flex items-center justify-center gap-3"
          >
            <Loader2 size={20} className="animate-spin text-violet-light" />
            <p className="text-text-secondary">Generating response...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
