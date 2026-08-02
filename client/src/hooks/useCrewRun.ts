// hooks/useCrewRun.ts — CrewAI multi-agent workflow hook.
// Connects to the SSE stream and collects each agent step as it completes.

import { useState, useCallback } from 'react';
import { CrewStep } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';
import { API_BASE_URL } from '../api/client';

interface CrewRunState {
  steps: CrewStep[];
  summary: string | null;
  isRunning: boolean;
  currentAgentIndex: number;
  error: string | null;
}

export function useCrewRun() {
  const [state, setState] = useState<CrewRunState>({
    steps: [],
    summary: null,
    isRunning: false,
    currentAgentIndex: -1,
    error: null,
  });
  const { apiKey, model } = useSettingsStore();

  const runCrew = useCallback(
    async (projectDescription: string) => {
      setState({ steps: [], summary: null, isRunning: true, currentAgentIndex: 0, error: null });

      try {
        const response = await fetch(`${API_BASE_URL}/crew/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({ projectDescription, model }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Crew run failed');
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data: CrewStep = JSON.parse(line.slice(6));

            if (data.type === 'step') {
              setState((prev) => ({
                ...prev,
                steps: [...prev.steps, data],
                currentAgentIndex: (data.agentIndex || 0) + 1,
              }));
            } else if (data.type === 'summary') {
              setState((prev) => ({ ...prev, summary: data.summary || null }));
            } else if (data.type === 'done') {
              setState((prev) => ({ ...prev, isRunning: false, currentAgentIndex: -1 }));
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          }
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: (err as Error).message,
        }));
      }
    },
    [apiKey, model]
  );

  const reset = useCallback(() => {
    setState({ steps: [], summary: null, isRunning: false, currentAgentIndex: -1, error: null });
  }, []);

  return { ...state, runCrew, reset };
}
