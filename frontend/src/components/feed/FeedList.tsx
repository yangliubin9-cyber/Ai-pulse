import { memo, useMemo } from 'react';
import { ItemCard } from './ItemCard';
import { groupByDay, timeOfDay } from '@/lib/time';
import { useI18n } from '@/i18n/I18nProvider';
import type { Item } from '@/lib/types';

interface FeedListProps {
  items: Item[];
  /** When true, items are grouped under date headings (timeline feel). */
  grouped?: boolean;
}

/**
 * Timeline feed: a left gutter shows each item's HH:MM, a center rail with a
 * dot strings the cards together, and date headings split the stream by day.
 */
export function FeedList({ items, grouped = true }: FeedListProps): React.JSX.Element {
  const { lang } = useI18n();
  // Re-group only when the items or language actually change.
  const groups = useMemo(
    () => groupByDay(items, (item) => item.published_at, lang),
    [items, lang],
  );

  if (!grouped) {
    return (
      <div className="animate-fade-in space-y-3">
        {items.map((item) => (
          <TimelineRow key={item.id} item={item} />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-7">
      {groups.map((group) => (
        <section key={group.key}>
          <h2 className="sticky top-0 z-10 mb-3 -mx-1 bg-background/90 px-1 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur lg:top-0">
            {group.label}
          </h2>
          <div className="space-y-3">
            {group.items.map((item) => (
              <TimelineRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** One timeline entry: time gutter + rail/dot + card. */
const TimelineRow = memo(function TimelineRow({ item }: { item: Item }): React.JSX.Element {
  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="flex w-9 shrink-0 flex-col items-end pt-4 sm:w-12">
        <time
          className="font-mono text-[11px] tabular-nums text-muted-foreground"
          dateTime={item.published_at}
        >
          {timeOfDay(item.published_at)}
        </time>
      </div>
      <div className="relative flex shrink-0 justify-center" aria-hidden>
        <span className="absolute inset-y-0 w-px bg-border" />
        <span className="mt-4 h-2 w-2 rounded-full border-2 border-accent bg-background" />
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <ItemCard item={item} />
      </div>
    </div>
  );
});
