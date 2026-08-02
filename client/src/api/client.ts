// api/client.ts — Axios client factory.
// Creates an axios instance with the API key header automatically injected.

import axios from 'axios';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Creates an axios instance with the current API key in the X-Api-Key header.
 * Called at the start of every API request so it always uses the current key.
 */
export function createApiClient() {
  const apiKey = useSettingsStore.getState().apiKey;

  return axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    timeout: 120000, // 2 minute timeout for long AI operations
  });
}

// Named api for convenience — same as createApiClient() but called once
export const api = {
  get: <T>(url: string) => createApiClient().get<T>(url),
  post: <T>(url: string, data?: unknown) => createApiClient().post<T>(url, data),
  delete: <T>(url: string) => createApiClient().delete<T>(url),
};
