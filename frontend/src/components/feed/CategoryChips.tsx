import { cn } from '@/lib/cn';
import { CATEGORY_ORDER, categoryLabel } from '@/lib/constants';
import { useT } from '@/i18n/I18nProvider';
import type { CategoryKey } from '@/lib/types';

interface CategoryChipsProps {
  value: CategoryKey | null;
  onChange: (value: CategoryKey | null) => void;
  counts?: Partial<Record<CategoryKey, number>>;
}

/**
 * Category filter rendered as a row of pill tabs: "All" + each category.
 * The active pill is filled cyan; the rest are quiet outlined chips.
 */
export function CategoryChips({
  value,
  onChange,
  counts,
}: CategoryChipsProps): React.JSX.Element {
  const t = useT();
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="tablist"
      aria-label={t('category.filter')}
    >
      <Chip active={value === null} onClick={() => onChange(null)}>
        {t('common.all')}
      </Chip>
      {CATEGORY_ORDER.map((key) => {
        const count = counts?.[key];
        return (
          <Chip key={key} active={value === key} onClick={() => onChange(key)}>
            {categoryLabel(key, t)}
            {typeof count === 'number' && (
              <span className="ml-1 text-[10px] opacity-70">{count}</span>
            )}
          </Chip>
        );
      })}
    </div>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Chip({ active, onClick, children }: ChipProps): React.JSX.Element {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'rounded-full px-3.5 py-1.5 text-xs font-medium transition-[color,background-color,border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        active
          ? 'bg-accent text-accent-foreground shadow-sm shadow-accent/20'
          : 'border border-border bg-surface text-muted-foreground hover:border-accent/40 hover:bg-surface-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
