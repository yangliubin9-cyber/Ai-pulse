import { cn } from '@/lib/cn';
import { CATEGORY_META, categoryLabel } from '@/lib/constants';
import { useT } from '@/i18n/I18nProvider';
import type { CategoryKey } from '@/lib/types';

interface CategoryBadgeProps {
  category: CategoryKey;
  className?: string;
}

/** Category tag rendered with its own hue token (text + faint tint). */
export function CategoryBadge({
  category,
  className,
}: CategoryBadgeProps): React.JSX.Element {
  const t = useT();
  const meta = CATEGORY_META[category] ?? CATEGORY_META.other;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium leading-none',
        className,
      )}
      style={{
        color: `hsl(var(--cat-${meta.colorVar}))`,
        backgroundColor: `hsl(var(--cat-${meta.colorVar}) / 0.12)`,
      }}
    >
      {categoryLabel(category, t)}
    </span>
  );
}
