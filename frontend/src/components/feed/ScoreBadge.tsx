import { cn } from '@/lib/cn';
import { useT } from '@/i18n/I18nProvider';

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

/**
 * Heat badge shown only when an item carries a score. Cyan-outlined pill with a
 * four-point star glyph. Rendered by the caller guarded on `score != null`.
 */
export function ScoreBadge({ score, className }: ScoreBadgeProps): React.JSX.Element {
  const t = useT();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-accent/40 px-2 py-0.5 text-[11px] font-medium leading-none text-accent',
        className,
      )}
      title={t('card.heat', { score })}
    >
      <span aria-hidden>✦</span>
      <span className="tabular-nums">{t('card.heat', { score })}</span>
    </span>
  );
}
