import { zh, type Zh } from './zh';
import { en } from './en';

export type Lang = 'zh' | 'en';

/** Any dictionary value shape: nested string maps (leaves widened to string). */
export type Dict = Zh;

/** Resource table. `zh` is the source of truth for the key type. */
export const resources: Record<Lang, Dict> = { zh, en };

const STORAGE_KEY = 'ai-pulse:lang';

const VALID_LANGS: readonly Lang[] = ['zh', 'en'];

function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (VALID_LANGS as readonly string[]).includes(value);
}

/** Read the persisted language, defaulting to Chinese. */
export function detectInitialLang(): Lang {
  if (typeof localStorage === 'undefined') return 'zh';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // localStorage may be unavailable (private mode); fall through.
  }
  return 'zh';
}

/** Persist the chosen language. */
export function persistLang(lang: Lang): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Ignore write failures.
  }
}

export { STORAGE_KEY };

/**
 * Recursively build the union of dotted key paths for a nested object whose
 * leaves are strings, e.g. `'feed.pageInfo'`. Numeric/array values are ignored.
 */
export type FlattenKeys<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends object
      ? FlattenKeys<T[K], `${Prefix}${K}.`>
      : never;
}[keyof T & string];

/** The exhaustive union of valid translation keys, derived from `zh`. */
export type TKey = FlattenKeys<typeof zh>;

/** Interpolation variables: `{name}` placeholders -> string/number. */
export type TVars = Record<string, string | number>;

/** Resolve a dotted path against a dictionary, returning the leaf string. */
function resolvePath(dict: Dict, key: string): string | undefined {
  const parts = key.split('.');
  let cursor: unknown = dict;
  for (const part of parts) {
    if (cursor && typeof cursor === 'object' && part in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof cursor === 'string' ? cursor : undefined;
}

/** Replace `{var}` placeholders with values from `vars`. */
function interpolate(template: string, vars?: TVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

/**
 * Resolve `key` in `dict` and interpolate `vars`. On a missing key, returns the
 * key itself and (in dev) logs a guarded warning.
 */
export function translate(lang: Lang, dict: Dict, key: TKey, vars?: TVars): string {
  const template = resolvePath(dict, key);
  if (template === undefined) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[i18n] missing key "${key}" for lang "${lang}"`);
    }
    return key;
  }
  return interpolate(template, vars);
}
