import { Monitor, Moon, Sun } from 'lucide-react';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { useT } from '@/i18n/I18nProvider';
import type { TKey } from '@/i18n';
import { cn } from '@/lib/cn';

const OPTIONS: Array<{ mode: ThemeMode; labelKey: TKey; icon: typeof Sun }> = [
  { mode: 'light', labelKey: 'theme.light', icon: Sun },
  { mode: 'dark', labelKey: 'theme.dark', icon: Moon },
  { mode: 'system', labelKey: 'theme.system', icon: Monitor },
];

/**
 * Theme switcher rendered as a row of three small icon buttons
 * (light / dark / system). Designed for the sidebar footer; the active
 * mode gets a cyan-tinted pill.
 */
export function ThemeToggle({ className }: { className?: string }): React.JSX.Element {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const t = useT();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-0.5',
        className,
      )}
      role="radiogroup"
      aria-label={t('theme.toggle')}
    >
      {OPTIONS.map(({ mode: m, labelKey, icon: Icon }) => {
        const active = m === mode;
        const label = t(labelKey);
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setMode(m)}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-md transition-colors duration-150 ease-out',
              active
                ? 'bg-accent/20 text-accent'
                : 'text-sidebar-foreground hover:bg-white/10 hover:text-white',
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
