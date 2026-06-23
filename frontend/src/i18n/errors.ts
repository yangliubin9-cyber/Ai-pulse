import { ApiError } from '@/api/client';
import type { TFn } from './I18nProvider';
import type { TKey } from './index';

/**
 * Backend error codes that map to a dedicated localized message. Anything not
 * listed falls back to the backend-provided message (which is content, not
 * chrome, so we leave it untranslated).
 */
const KNOWN_CODES: Record<string, TKey> = {
  AUTH_INVALID_CREDENTIALS: 'errors.AUTH_INVALID_CREDENTIALS',
  AUTH_TOO_MANY_ATTEMPTS: 'errors.AUTH_TOO_MANY_ATTEMPTS',
  AUTH_OLD_PASSWORD_WRONG: 'errors.AUTH_OLD_PASSWORD_WRONG',
  UNAUTHORIZED: 'errors.UNAUTHORIZED',
  VALIDATION_ERROR: 'errors.VALIDATION_ERROR',
  INTERNAL_ERROR: 'errors.INTERNAL_ERROR',
};

/**
 * Localized, human-readable message for any thrown error. `client.ts` is
 * framework-agnostic and keeps the raw backend message; localization happens
 * here in the React layer where `t` is available.
 */
export function getErrorMessage(error: unknown, t: TFn): string {
  if (error instanceof ApiError) {
    const key = KNOWN_CODES[error.code];
    if (key) return t(key);
    // Unknown / generic code: prefer the backend message; otherwise a fallback.
    if (error.message) return error.message;
    return t('errors.operationFailed');
  }
  return t('errors.network');
}
