import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ChevronRight, Languages, FileQuestion, Sparkles, Bookmark } from 'lucide-react';
import { SourceAvatar } from '@/components/feed/SourceAvatar';
import { CategoryBadge } from '@/components/feed/CategoryBadge';
import { ScoreBadge } from '@/components/feed/ScoreBadge';
import { InlineMarkdown } from '@/components/feed/InlineMarkdown';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FeedError, FeedEmpty } from '@/components/feed/FeedStates';
import { useItem } from '@/hooks/useItems';
import { useMarkRead, useToggleSaved } from '@/hooks/useItemState';
import { cn } from '@/lib/cn';
import { ApiError } from '@/api/client';
import { relativeTime } from '@/lib/time';
import { sourceTypeLabel } from '@/lib/constants';
import { displayTitle, displayBody, hasTranslation, hasBody } from '@/lib/display';
import { splitParagraphs } from '@/lib/paragraphs';
import { useI18n } from '@/i18n/I18nProvider';

/** In-site reading page for a single item (GET /items/{id}). */
export function ItemDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const { data: item, isPending, isError, error, refetch } = useItem(id);

  // When true, show the English original instead of the Chinese translation.
  const [showOriginal, setShowOriginal] = useState(false);

  const is404 = error instanceof ApiError && error.status === 404;

  // Only offer the toggle in the Chinese UI when an original-vs-translation
  // distinction exists (a translated title/summary/body to flip away from).
  const canToggle = lang === 'zh' && item != null && hasTranslation(item);
  // Effective language for the display helpers: forcing 'en' yields the original.
  const displayLang = canToggle && showOriginal ? 'en' : lang;
  const title = item ? displayTitle(item, displayLang) : '';
  // The full article body (longest text the item carries), or null when the
  // source provides no body in this language path (e.g. a HN link-only post).
  const body = item ? displayBody(item, displayLang) : null;
  // Whether the item actually carries a full body (vs. only a summary). Drives
  // the "Article" vs. summary-only heading and the source attribution note.
  const itemHasBody = item != null && hasBody(item);
  // Editorial recommendation note (Chinese only). Shown in its own emphasized
  // box whenever present, regardless of the original/translation toggle.
  const reason = item?.reason_zh?.trim() ? item.reason_zh : null;
  // Rough reading-time estimate, shown only for items with a full body. ~350
  // CJK chars per minute; clamped to a 1-minute floor.
  const readingMin = itemHasBody && body ? Math.max(1, Math.round(body.length / 350)) : null;

  // Mark the item read once it has loaded (fires once per id even though the
  // mutation invalidates the detail query and re-runs this effect).
  const markRead = useMarkRead();
  const toggleSaved = useToggleSaved();
  const markedRef = useRef<string | null>(null);
  useEffect(() => {
    if (item && id && markedRef.current !== id && !item.read) {
      markedRef.current = id;
      markRead.mutate(id);
    }
  }, [item, id, markRead]);

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* Back + breadcrumb */}
      <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-surface-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('pages.detail.back')}
        </button>
        <span aria-hidden className="text-border">
          |
        </span>
        <nav aria-label="breadcrumb" className="flex items-center gap-1">
          <Link to="/all" className="hover:text-foreground">
            {t('pages.detail.breadcrumbFeed')}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="text-foreground">{t('pages.detail.breadcrumbCurrent')}</span>
        </nav>
      </div>

      {isPending && <DetailSkeleton />}

      {!isPending && is404 && (
        <FeedEmpty
          testId="detail-not-found"
          icon={FileQuestion}
          title={t('pages.detail.notFoundTitle')}
          description={t('pages.detail.notFoundDescription')}
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/all">{t('pages.detail.backToFeed')}</Link>
            </Button>
          }
        />
      )}

      {!isPending && isError && !is404 && (
        <FeedError error={error} onRetry={() => void refetch()} />
      )}

      {!isPending && item && (
        <article data-testid="item-detail">
          {/* Header block — title, byline and taxonomy grouped together and set
              off from the body by a bottom divider, giving the page a clear
              "masthead → content" rhythm instead of a stack of loose rows. */}
          <header className="border-b border-border pb-6">
            {/* Title */}
            <h1 className="text-balance text-[26px] font-semibold leading-tight tracking-tight sm:text-[32px]">
              {title}
            </h1>

            {/* Byline — two tiers. Identity (avatar · source), time and heat sit
                on the primary row; the often-long author credit drops to a quieter
                line below so it can't shove the time/heat onto a ragged extra row. */}
            <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <SourceAvatar name={item.source_name} />
                <span className="font-medium text-foreground">{item.source_name}</span>
                <span aria-hidden className="text-border">
                  ·
                </span>
                <time dateTime={item.published_at}>
                  {relativeTime(item.published_at, lang)}
                </time>
                {readingMin != null && (
                  <>
                    <span aria-hidden className="text-border">
                      ·
                    </span>
                    <span>{t('pages.detail.readingTime', { min: readingMin })}</span>
                  </>
                )}
                {item.score != null && (
                  <span className="ml-0.5">
                    <ScoreBadge score={item.score} />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleSaved.mutate({ id: item.id, saved: !item.saved })}
                  aria-label={item.saved ? t('card.unsave') : t('card.save')}
                  aria-pressed={Boolean(item.saved)}
                  className={cn(
                    'ml-auto inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                    item.saved
                      ? 'border-accent/50 bg-accent/10 text-accent'
                      : 'border-border text-muted-foreground hover:bg-surface-muted hover:text-accent',
                  )}
                >
                  <Bookmark className={cn('h-3.5 w-3.5', item.saved && 'fill-current')} aria-hidden />
                  {item.saved ? t('card.unsave') : t('card.save')}
                </button>
              </div>
              {item.author && (
                <p className="text-[13px] leading-relaxed text-muted-foreground/80">
                  @{item.author}
                </p>
              )}
            </div>

            {/* Category + tags — outlined pills, matching the feed card style. */}
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
              <CategoryBadge category={item.category} />
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-border/70 px-1.5 py-0.5 text-[11px] font-medium leading-none text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>

          {/* Recommendation note — an emphasized editorial callout box, shown
              only when reason_zh is present. Accent-tinted, rounded, labelled.
              reason_zh may contain inline markdown bold, rendered XSS-safely. */}
          {reason && (
            <section
              className="mt-8 overflow-hidden rounded-xl border border-accent/40 bg-accent/[0.07]"
              data-testid="reason-box"
            >
              <div className="flex items-center gap-1.5 border-b border-accent/25 bg-accent/10 px-4 py-2">
                <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                  {t('pages.detail.reasonTitle')}
                </span>
              </div>
              <InlineMarkdown
                text={reason}
                className="space-y-2 px-4 py-3.5 text-[15px] leading-[1.8] text-foreground/90"
              />
            </section>
          )}

          {/* Body box — AI summary / article. Skipped entirely when the source
              carries no body (HN link-only), in which case a hint is shown. */}
          <section className="mt-8">
            {/* Body header: section label on the left, translation toggle on the
                right. The "read original" CTA lives once, as the primary accent
                button below the body — keeping this row uncluttered so it never
                wraps awkwardly on narrow screens. */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {itemHasBody ? t('pages.detail.bodyTitleFull') : t('pages.detail.bodyTitle')}
              </h2>
              {canToggle && (
                <button
                  type="button"
                  onClick={() => setShowOriginal((v) => !v)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  data-testid="translation-toggle"
                >
                  <Languages className="h-3.5 w-3.5" aria-hidden />
                  {showOriginal
                    ? t('pages.detail.showTranslation')
                    : t('pages.detail.showOriginal')}
                </button>
              )}
            </div>
            {body ? (
              <div data-testid="body-box">
                {/* Open flowing article — no card border/box around long-form text. */}
                <ArticleBody text={body} />
                {/* Source attribution note shown only for transcribed full bodies. */}
                {itemHasBody && (
                  <p className="mt-10 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                    {t('pages.detail.bodySourceNote')}
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
                {t('pages.detail.noSummary')}
              </p>
            )}
          </section>

          {/* Read original (primary call-to-action at the foot of the body) */}
          <div className="mt-6">
            <Button asChild variant="accent">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {t('pages.detail.readOriginal')}
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </Button>
          </div>

          {/* Attribution footer */}
          <footer className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
            {item.published_at
              ? t('pages.detail.collectedFrom', {
                  source: `${item.source_name} (${sourceTypeLabel(item.source_type, t)})`,
                  time: relativeTime(item.published_at, lang),
                })
              : t('pages.detail.collectedFromNoTime', {
                  source: `${item.source_name} (${sourceTypeLabel(item.source_type, t)})`,
                })}
          </footer>
        </article>
      )}
    </div>
  );
}

/**
 * Renders the full article body as plain text, tuned for comfortable long-form
 * reading of (often machine-translated) Chinese prose. The text comes from the
 * source (HTML already stripped by the backend); we render it as text only —
 * never via dangerouslySetInnerHTML — to avoid XSS.
 *
 * Paragraphs come from `splitParagraphs`: existing blank-line / newline
 * structure is respected, while a long unbroken wall of text (the common
 * machine-translation shape) is soft-split at sentence boundaries for display
 * only. Single newlines inside a paragraph are preserved via
 * `whitespace-pre-wrap`.
 *
 * Reading layout: the body inherits the page's centred ~42em column
 * (`max-w-2xl`), so its line length matches the title, divider and footer for a
 * single clean reading edge. 17px body text at a relaxed 1.9 line-height, a hair
 * of letter-spacing, near-full foreground colour (not muted) so long reads don't
 * strain the eyes, and generous paragraph spacing without first-line indentation.
 */
function ArticleBody({ text }: { text: string }): React.JSX.Element {
  const paragraphs = splitParagraphs(text);

  // Fallback: a body that produced no paragraphs still renders as one block.
  const blocks = paragraphs.length > 0 ? paragraphs : [text];

  return (
    <div
      className="space-y-7 text-[17px] leading-[1.9] tracking-[0.01em] text-foreground/95"
      data-testid="article-body"
    >
      {blocks.map((block, i) => (
        <p key={i} className="whitespace-pre-wrap break-words text-pretty">
          {block}
        </p>
      ))}
    </div>
  );
}

/** Loading skeleton matching the detail layout. */
function DetailSkeleton(): React.JSX.Element {
  return (
    <div data-testid="detail-skeleton">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="mt-3 h-4 w-1/2" />
      <Skeleton className="mt-4 h-5 w-40" />
      <div className="mt-6 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="mt-6 h-9 w-32" />
    </div>
  );
}
