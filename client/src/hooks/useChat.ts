// hooks/useChat.ts — Streaming chat hook using Server-Sent Events.
// This is the core hook for the AI Chat page.
// Manages message history, streaming state, and SSE connection.

import { useState, useCallback, useRef } from 'react';
import { Message } from '../types';
import { generateId } from '../lib/utils';
import { useSettingsStore } from '../store/useSettingsStore';

interface UseChatOptions {
  agentId?: string;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const { apiKey, model } = useSettingsStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      // Add user message to history
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setStreamingContent('');

      // Abort any existing stream
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      let accumulatedContent = '';
      const assistantId = generateId();

      try {
        // Prepare messages to send (exclude streaming placeholder)
        const messagesToSend = [
          ...messages,
          userMessage,
        ].map(({ role, content }) => ({ role, content }));

        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            messages: messagesToSend,
            agentId: options.agentId,
            model,
            temperature: 0.7,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Stream failed');
        }

        // Read the SSE stream
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = JSON.parse(line.slice(6));

            if (data.type === 'delta') {
              accumulatedContent += data.delta;
              setStreamingContent(accumulatedContent);
            } else if (data.type === 'done') {
              // Stream complete — add final message to history
              const assistantMessage: Message = {
                id: assistantId,
                role: 'assistant',
                content: accumulatedContent,
                timestamp: new Date(),
                tokensUsed: data.tokensUsed,
                durationMs: data.durationMs,
              };
              setMessages((prev) => [...prev, assistantMessage]);
              setStreamingContent('');
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;

        // Add error message to chat
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: `⚠️ Error: ${(err as Error).message}`,
            timestamp: new Date(),
          },
        ]);
        setStreamingContent('');
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
      }
    },
    [messages, isStreaming, apiKey, model, options.agentId]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
  }, []);

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStreamingContent('');
  }, []);

  return {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    clearHistory,
    stopStream,
  };
}
