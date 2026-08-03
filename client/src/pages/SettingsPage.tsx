// pages/SettingsPage.tsx — API key, model selection, and validation

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Key, Cpu, CheckCircle, AlertCircle, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { settingsApi } from '../api';
import { cn } from '../lib/utils';

const OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable, best for complex tasks', badge: 'Recommended', color: '#7c3aed' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and cost-effective', badge: 'Fast', color: '#06b6d4' },
  { id: 'gpt-4.1', name: 'GPT-4.1', description: 'Latest GPT-4 series model', badge: 'New', color: '#10b981' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Powerful with 128K context', badge: null, color: '#f59e0b' },
];

const OPENROUTER_MODELS = [
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', description: 'Meta\'s latest model with 128K context', badge: 'Recommended', color: '#10b981' },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B (Free)', description: 'Google\'s high-performance lightweight model', badge: 'Free', color: '#3b82f6' },
  { id: 'meta-llama/llama-3-8b-instruct:free', name: 'Llama 3 8B (Free)', description: 'Meta\'s highly capable instruction model', badge: 'Free', color: '#8b5cf6' },
  { id: 'nvidia/nemotron-4-340b-instruct:free', name: 'Nemotron 4 (Free)', description: 'NVIDIA\'s state-of-the-art synthetic data model', badge: 'Free', color: '#f59e0b' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', description: 'High performance small language model', badge: 'Free', color: '#06b6d4' },
  { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B (Free)', description: 'Alibaba\'s powerful multilingual model', badge: 'Free', color: '#e11d48' },
];

const GEMINI_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast, lightweight and highly capable', badge: 'Recommended', color: '#0ea5e9' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Exceptional reasoning and multimodal tasks', badge: 'Powerful', color: '#6366f1' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Next-gen speed and efficiency', badge: 'New', color: '#10b981' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Advanced speed and capabilities', badge: 'Latest', color: '#8b5cf6' },
];

export function SettingsPage() {
  const { apiKey, model, setApiKey, setModel } = useSettingsStore();
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>({ valid: true });
  const [saved, setSaved] = useState(false);

  const isOR = inputKey.startsWith('sk-or-');
  const isGemini = inputKey && !inputKey.startsWith('sk-') && !isOR && inputKey !== 'demo-mode' && inputKey !== 'local-offline-ai-engine';
  const modelsList = isOR ? OPENROUTER_MODELS : isGemini ? GEMINI_MODELS : OPENAI_MODELS;

  const validateAndSave = async () => {
    if (!inputKey.trim()) return;
    setValidating(true);
    setValidationResult(null);

    try {
      const result = await settingsApi.validateKey(inputKey);
      setValidationResult(result);
      if (result.valid) {
        setApiKey(inputKey);
        const isORKey = inputKey.startsWith('sk-or-');
        const isGeminiKey = inputKey && !inputKey.startsWith('sk-') && !isORKey && inputKey !== 'demo-mode' && inputKey !== 'local-offline-ai-engine';
        if (isORKey) {
          if (!model.includes('/') && !model.includes(':free')) {
            setModel('meta-llama/llama-3.1-8b-instruct:free');
          }
        } else if (isGeminiKey) {
          if (!model.startsWith('gemini-')) {
            setModel('gemini-1.5-flash');
          }
        } else {
          if (model.includes('/') || model.includes(':free') || model.startsWith('gemini-')) {
            setModel('gpt-4o');
          }
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setValidationResult({ valid: false, error: 'Validation failed' });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="section-subtitle">Configure your API key and model preferences</p>
      </div>

      {/* API Key */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet/15 flex items-center justify-center border border-violet/30">
            <Key size={18} className="text-violet-light" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">API Key Configuration</h3>
            <p className="text-text-muted text-xs mt-0.5">
              Your key is stored locally and never sent to our servers
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setValidationResult(null);
                }}
                placeholder="Enter API Key (sk-..., sk-or-..., or Gemini key)"
                className="input pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              onClick={validateAndSave}
              disabled={!inputKey.trim() || validating}
              className="btn-primary flex-shrink-0"
            >
              {validating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : saved ? (
                <CheckCircle size={14} className="text-emerald" />
              ) : (
                <Save size={14} />
              )}
              {validating ? 'Validating...' : saved ? 'Saved!' : 'Validate & Save'}
            </button>
          </div>

          {/* Validation result */}
          {validationResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-xl text-sm',
                validationResult.valid
                  ? 'bg-emerald/10 text-emerald border border-emerald/20'
                  : 'bg-rose/10 text-rose border border-rose/20'
              )}
            >
              {validationResult.valid ? (
                <CheckCircle size={14} />
              ) : (
                <AlertCircle size={14} />
              )}
              {validationResult.valid
                ? `✓ API key is valid. You are connected to ${isOR ? 'OpenRouter' : isGemini ? 'Gemini' : 'OpenAI'}.`
                : `✗ ${validationResult.error || 'Validation failed'}`}
            </motion.div>
          )}

          <p className="text-text-muted text-xs">
            Get your key from{' '}
            {isOR ? (
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-light hover:underline"
              >
                openrouter.ai/keys
              </a>
            ) : isGemini ? (
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-light hover:underline"
              >
                aistudio.google.com
              </a>
            ) : (
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-light hover:underline"
              >
                platform.openai.com/api-keys
              </a>
            )}
          </p>
        </div>
      </motion.div>

      {/* Model Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan/15 flex items-center justify-center border border-cyan/30">
            <Cpu size={18} className="text-cyan" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Model Selection</h3>
            <p className="text-text-muted text-xs mt-0.5">
              Choose the active model for all AI operations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modelsList.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              onClick={() => setModel(m.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'text-left p-4 rounded-xl border transition-all duration-200',
                model === m.id
                  ? 'border-opacity-50'
                  : 'glass border-white/10 hover:border-white/20'
              )}
              style={
                model === m.id
                  ? { borderColor: m.color, background: `${m.color}10` }
                  : {}
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-text-primary">{m.name}</p>
                  <p className="text-text-muted text-xs mt-0.5">{m.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {m.badge && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: m.color, background: `${m.color}15` }}
                    >
                      {m.badge}
                    </span>
                  )}
                  {model === m.id && (
                    <CheckCircle size={14} style={{ color: m.color }} />
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
        style={{ borderColor: 'rgba(124, 58, 237, 0.2)', background: 'rgba(124, 58, 237, 0.04)' }}
      >
        <div className="flex items-start gap-3">
          <Settings size={16} className="text-violet-light mt-0.5 flex-shrink-0" />
          <div className="space-y-1 text-sm text-text-secondary">
            <p className="font-medium text-text-primary">Security Notice</p>
            <p>• Your API key is stored only in your browser's localStorage</p>
            <p>• It is sent with each request in the <code className="font-mono text-xs bg-black/30 px-1 rounded">X-Api-Key</code> header</p>
            <p>• It is never logged or stored on the server</p>
            <p>• Clear your browser data to remove it completely</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
