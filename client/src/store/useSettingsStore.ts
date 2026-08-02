// store/useSettingsStore.ts — Global settings store using Zustand.
// Persists API key and model selection to localStorage.
// This is the single source of truth for all configurable settings.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings } from '../types';

interface SettingsStore extends AppSettings {
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  isConfigured: () => boolean;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      apiKey: 'local-offline-ai-engine',
      model: 'gpt-4o',
      theme: 'dark',

      setApiKey: (key: string) => set({ apiKey: key }),
      setModel: (model: string) => set({ model }),

      isConfigured: () => true,
    }),
    {
      name: 'ai-agent-studio-settings', // localStorage key
      partialize: (state) => ({
        apiKey: state.apiKey,
        model: state.model,
      }),
    }
  )
);
