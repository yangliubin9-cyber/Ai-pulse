import { API_PREFIX, config } from '@/lib/config';

/** Normalized error shape thrown by the client. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;

  constructor(status: number, code: string, message: string, requestId: string | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

interface BackendError {
  error?: {
    code?: string;
    message?: string;
    request_id?: string;
  };
}

type AuthExpiredHandler = () => void;

let onAuthExpired: AuthExpiredHandler | null = null;

/** Register a callback invoked on a non-/auth/ 401 (clears cache, redirects). */
export function setAuthExpiredHandler(handler: AuthExpiredHandler): void {
  onAuthExpired = handler;
}

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = `${config.apiBaseUrl}${API_PREFIX}${path}`;
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Core fetch wrapper: credentials, request-id, error normalization, 401 handling. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Request-Id': generateRequestId(),
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (response.status === 401 && !path.startsWith('/auth/')) {
    onAuthExpired?.();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const err = (payload as BackendError | null)?.error;
    throw new ApiError(
      response.status,
      err?.code ?? 'UNKNOWN',
      // No localization here (framework-agnostic): keep the backend message, or
      // leave empty so the React layer can render a localized fallback.
      err?.message ?? '',
      err?.request_id ?? null,
    );
  }

  return payload as T;
}
