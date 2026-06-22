import { cn } from '@/lib/cn';
import { CATEGORY_META, CATEGORY_ORDER } from '@/lib/constants';
import type { CategoryKey } from '@/lib/types';

interface CategoryChipsProps {
  value: CategoryKey | null;
  onChange: (value: CategoryKey | null) => void;
  counts?: Partial<Record<CategoryKey, number>>;
}

/** Horizontal filter chips: 全部 + each category. Left-aligned, dense. */
export function CategoryChips({
  value,
  onChange,
  counts,
}: CategoryChipsProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="分类筛选">
      <Chip active={value === null} onClick={() => onChange(null)}>
        全部
      </Chip>
      {CATEGORY_ORDER.map((key) => {
        const count = counts?.[key];
        return (
          <Chip key={key} active={value === key} onClick={() => onChange(key)}>
            {CATEGORY_META[key].label}
            {typeof count === 'number' && (
              <span className="ml-1 text-[10px] opacity-60">{count}</span>
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
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150 ease-out',
        active
          ? 'border-accent bg-accent/12 text-accent'
          : 'border-border bg-surface text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
