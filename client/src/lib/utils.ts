// lib/utils.ts — Utility functions used throughout the application

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — Combines Tailwind classes intelligently, resolving conflicts.
 * Example: cn('px-2 px-4') → 'px-4' (last wins)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * formatDuration — Formats milliseconds to human-readable string.
 * e.g. 1234 → "1.2s", 65000 → "1m 5s"
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

/**
 * formatTokens — Formats token count with K suffix for large numbers.
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}

/**
 * formatCost — Formats USD cost to appropriate decimal places.
 */
export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.001) return `$${cost.toFixed(6)}`;
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * formatRelativeTime — Returns relative time string.
 * e.g. "2 minutes ago", "just now"
 */
export function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * truncateText — Truncates text to a maximum length with ellipsis.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * getActivityTypeColor — Returns a color class for each activity type.
 */
export function getActivityTypeColor(type: string): string {
  const colors: Record<string, string> = {
    chat: 'badge-violet',
    tool: 'badge-cyan',
    crew: 'badge-amber',
    rag: 'badge-emerald',
    llamaindex: 'badge-emerald',
    langchain: 'badge-violet',
    playground: 'badge-rose',
  };
  return colors[type] || 'badge-violet';
}

/**
 * getStatusIcon — Returns an emoji for each status.
 */
export function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    success: '✓',
    error: '✗',
    streaming: '◌',
  };
  return icons[status] || '?';
}

/**
 * sleep — Async sleep utility.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * generateId — Generates a short unique ID.
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}
