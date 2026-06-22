/**
 * Runtime configuration. API base never hardcoded:
 * - dev: '' so requests hit '/api/...' and Vite proxy forwards to backend.
 * - prod: same-origin '' (nginx reverse-proxies /api).
 * - override at runtime via window.__APP_CONFIG__ (injected by deploy).
 */

export interface AppConfig {
  apiBaseUrl: string;
  appName: string;
  version: string;
}

interface WindowConfig {
  apiBaseUrl?: string;
  appName?: string;
  version?: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: WindowConfig;
  }
}

const runtime: WindowConfig =
  (typeof window !== 'undefined' && window.__APP_CONFIG__) || {};

export const config: AppConfig = {
  apiBaseUrl: runtime.apiBaseUrl ?? '',
  appName: runtime.appName ?? 'AI Pulse',
  version: runtime.version ?? '0.1.0',
};

/** API prefix shared by every endpoint. */
export const API_PREFIX = '/api/v1';
