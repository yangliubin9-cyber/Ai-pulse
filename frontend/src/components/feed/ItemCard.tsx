import { ExternalLink } from 'lucide-react';
import { SourceIcon } from './SourceIcon';
import { CategoryBadge } from './CategoryBadge';
import { Badge } from '@/components/ui/badge';
import { relativeTime } from '@/lib/time';
import { sourceTypeLabel } from '@/lib/constants';
import type { Item } from '@/lib/types';

interface ItemCardProps {
  item: Item;
}

/**
 * Dense, text-first feed row. Left accent rule (category hue) instead of a
 * heavy boxed card with shadow — reads like a real aggregator listing.
 */
export function ItemCard({ item }: ItemCardProps): React.JSX.Element {
  return (
    <article
      className="group relative border-l-2 border-border bg-surface px-4 py-3 transition-colors duration-150 ease-out hover:border-l-accent hover:bg-surface-muted"
      data-testid="item-card"
    >
      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <SourceIcon type={item.source_type} className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground/80">{item.source_name}</span>
        <span aria-hidden>·</span>
        <span>{sourceTypeLabel(item.source_type)}</span>
        <span className="ml-auto tabular-nums">{relativeTime(item.published_at)}</span>
      </div>

      <h3 className="text-[15px] font-semibold leading-snug">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-baseline gap-1 text-foreground decoration-accent/40 decoration-2 underline-offset-2 hover:text-accent hover:underline"
        >
          <span>{item.title}</span>
          <ExternalLink
            className="inline h-3.5 w-3.5 shrink-0 translate-y-0.5 opacity-0 transition-opacity group-hover:opacity-60"
            aria-hidden
          />
        </a>
      </h3>

      {item.summary && (
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {item.summary}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={item.category} />
        {item.author && (
          <span className="text-[11px] text-muted-foreground">{item.author}</span>
        )}
        {item.tags.slice(0, 4).map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>
    </article>
  );
}
