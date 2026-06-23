import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/I18nProvider';

interface SearchBarProps {
  /** Committed value (debounced) flows up via this callback. */
  onSearch: (value: string) => void;
  /** Initial / controlled text. */
  value?: string;
  placeholder?: string;
  className?: string;
}

const DEBOUNCE_MS = 300;

/**
 * Keyword search field. Typing debounces by 300ms before committing; Enter
 * commits immediately; the clear button resets. Submitting maps to
 * GET /api/v1/items?q=... at the page level.
 */
export function SearchBar({
  onSearch,
  value = '',
  placeholder,
  className,
}: SearchBarProps): React.JSX.Element {
  const t = useT();
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCommitted = useRef(value);

  // Keep local text in sync if the parent resets the committed value.
  useEffect(() => {
    setText(value);
    lastCommitted.current = value;
  }, [value]);

  const commit = (next: string): void => {
    if (next === lastCommitted.current) return;
    lastCommitted.current = next;
    onSearch(next);
  };

  const handleChange = (next: string): void => {
    setText(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next.trim()), DEBOUNCE_MS);
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    commit(text.trim());
  };

  const handleClear = (): void => {
    if (timer.current) clearTimeout(timer.current);
    setText('');
    commit('');
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn('relative w-full sm:w-64', className)}
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder ?? t('search.placeholder')}
        aria-label={t('search.label')}
        className="h-9 w-full rounded-full border border-input bg-surface pl-9 pr-9 text-sm text-foreground transition-colors duration-150 ease-out placeholder:text-muted-foreground focus-visible:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={handleClear}
          aria-label={t('search.clear')}
          className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </form>
  );
}
