import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  detectInitialLang,
  persistLang,
  resources,
  translate,
  type Lang,
  type TKey,
  type TVars,
} from './index';

export type TFn = (key: TKey, vars?: TVars) => string;

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFn;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** Map a Lang to the value for <html lang>. */
function htmlLang(lang: Lang): string {
  return lang === 'zh' ? 'zh-CN' : 'en';
}

function applyHtmlLang(lang: Lang): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = htmlLang(lang);
  }
}

/**
 * Provides the current language, a setter that persists + updates <html lang>,
 * and a type-safe `t`. Switching is instant (state-driven) and survives reloads
 * via localStorage.
 */
export function I18nProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [lang, setLangState] = useState<Lang>(() => {
    const initial = detectInitialLang();
    applyHtmlLang(initial);
    return initial;
  });

  const setLang = useCallback((next: Lang) => {
    persistLang(next);
    applyHtmlLang(next);
    setLangState(next);
  }, []);

  const t = useCallback<TFn>(
    (key, vars) => translate(lang, resources[lang], key, vars),
    [lang],
  );

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Full i18n context. Throws if used outside <I18nProvider>. */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

/** Convenience hook returning just the `t` function. */
export function useT(): TFn {
  return useI18n().t;
}
