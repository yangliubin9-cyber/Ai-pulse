import { ItemCard } from './ItemCard';
import { groupByDay } from '@/lib/time';
import type { Item } from '@/lib/types';

interface FeedListProps {
  items: Item[];
  /** When true, items are grouped under date headings (timeline feel). */
  grouped?: boolean;
}

/** Renders the feed, optionally grouped by day with sticky date headings. */
export function FeedList({ items, grouped = true }: FeedListProps): React.JSX.Element {
  if (!grouped) {
    return (
      <div className="animate-fade-in divide-y divide-border border-y border-border">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    );
  }

  const groups = groupByDay(items, (item) => item.published_at);

  return (
    <div className="animate-fade-in space-y-6">
      {groups.map((group) => (
        <section key={group.key}>
          <h2 className="sticky top-14 z-10 -mx-1 mb-1 bg-background/90 px-1 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
            {group.label}
          </h2>
          <div className="divide-y divide-border border-y border-border">
            {group.items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
