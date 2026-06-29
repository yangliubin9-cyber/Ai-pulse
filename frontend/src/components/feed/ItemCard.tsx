import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { SourceAvatar } from './SourceAvatar';
import { CategoryBadge } from './CategoryBadge';
import { ScoreBadge } from './ScoreBadge';
import { useI18n } from '@/i18n/I18nProvider';
import { displayTitle, displaySummary } from '@/lib/display';
import { itemPath } from '@/lib/itemPath';
import type { Item } from '@/lib/types';

interface ItemCardProps {
  item: Item;
}

/** Module-level, reference-stable handler so it never re-creates per render. */
function stopPropagation(e: React.MouseEvent): void {
  e.stopPropagation();
}

/**
 * Timeline feed card: source avatar + name + @handle, optional heat badge,
 * a title that opens the in-site detail page, a clamped summary, an optional
 * thumbnail, and a footer of category + tags. A small secondary link still
 * jumps to the original article.
 */
function ItemCardImpl({ item }: ItemCardProps): React.JSX.Element {
  const { lang, t } = useI18n();
  const [imageOk, setImageOk] = useState(true);
  const showImage = Boolean(item.image_url) && imageOk;
  const detailPath = itemPath(item.id);
  const title = displayTitle(item, lang);
  const summary = displaySummary(item, lang);
  // Editorial note shown as a low-key strip. Markdown bold markers are stripped
  // to plain text here (the card is a compact, clamped preview); the full,
  // emphasized rendering lives on the detail page.
  const reason = item.reason_zh?.trim()
    ? item.reason_zh.replace(/\*\*/g, '').trim()
    : null;

  return (
    <article
      className="group surface-card surface-card-hover relative rounded-xl border border-border bg-surface p-4 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-surface"
      data-testid="item-card"
    >
      {/* Header row: avatar · source · @handle · heat badge */}
      <div className="mb-2 flex items-center gap-2 text-xs">
        <SourceAvatar name={item.source_name} />
        <span className="truncate font-medium text-foreground">{item.source_name}</span>
        {item.author && (
          <span className="truncate text-muted-foreground">@{item.author}</span>
        )}
        {item.score != null && (
          <span className="ml-auto shrink-0">
            <ScoreBadge score={item.score} />
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
            <Link
              to={detailPath}
              className="inline-flex items-baseline gap-1 text-foreground decoration-accent/40 decoration-2 underline-offset-2 transition-colors duration-150 hover:text-accent hover:underline"
              title={t('card.viewDetail')}
            >
              <span>{title}</span>
            </Link>
          </h3>

          {summary && (
            <Link
              to={detailPath}
              className="mt-1.5 block line-clamp-2 text-[13px] leading-relaxed text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {summary}
            </Link>
          )}

          {/* Recommendation strip — a low-key editorial note with a left accent
              bar and a small label, shown only when reason_zh is present. */}
          {reason && (
            <div
              className="mt-2.5 flex gap-2 rounded-md border-l-2 border-accent/60 bg-accent/[0.06] py-1.5 pl-2.5 pr-2"
              data-testid="card-reason"
            >
              <span className="mt-px shrink-0 text-[10px] font-semibold uppercase tracking-wide text-accent">
                {t('card.reason')}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                {reason}
              </span>
            </div>
          )}
        </div>

        {showImage && item.image_url && (
          <Link to={detailPath} className="shrink-0" aria-hidden tabIndex={-1}>
            <img
              src={item.image_url}
              alt=""
              loading="lazy"
              onError={() => setImageOk(false)}
              className="h-16 w-24 rounded-lg border border-border object-cover ring-1 ring-inset ring-black/5 sm:h-20 sm:w-28"
            />
          </Link>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={item.category} />
        {item.tags.slice(0, 5).map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-border/70 px-1.5 py-0.5 text-[10.5px] font-medium leading-none text-muted-foreground"
          >
            {tag}
          </span>
        ))}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stopPropagation}
          className="ml-auto inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-accent"
          title={t('card.openExternal')}
        >
          {t('card.original')}
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </div>
    </article>
  );
}

/**
 * Memoized: props are just `item` (a stable reference once fetched), so the
 * card skips re-render when an unrelated sibling/parent state changes.
 */
export const ItemCard = memo(ItemCardImpl);
