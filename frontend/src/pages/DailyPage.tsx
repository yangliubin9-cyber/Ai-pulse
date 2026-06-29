import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryBadge } from '@/components/feed/CategoryBadge';
import { ScoreBadge } from '@/components/feed/ScoreBadge';
import { FeedStateGate } from '@/components/feed/FeedStates';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDaily } from '@/hooks/useCatalog';
import { longDateLabel, shiftDateValue, todayInputValue } from '@/lib/time';
import { CATEGORY_ORDER, categoryLabel } from '@/lib/constants';
import { useI18n } from '@/i18n/I18nProvider';
import { displayTitle } from '@/lib/display';
import { itemPath } from '@/lib/itemPath';
import type { TFn } from '@/i18n/I18nProvider';
import type { Lang } from '@/i18n';
import type { CategoryKey, Item } from '@/lib/types';

/** AI Daily: a magazine-style brief of a chosen day's featured items. */
export function DailyPage(): React.JSX.Element {
  const { lang, t } = useI18n();
  const today = todayInputValue();
  const [date, setDate] = useState<string>(today);
  const { data, isPending, isError, error, refetch } = useDaily(date);

  const items = data?.items;

  const groups = useMemo(() => groupByCategory(items ?? []), [items]);

  const atToday = date >= today;
  const hasItems = Boolean(items && items.length > 0);
  // Issue number "VOL.YYYY.MM.DD" derived from the selected day.
  const volume = date.replace(/-/g, '.');

  return (
    <div>
      {/* Magazine cover — kicker, big masthead, issue meta, subtitle, and the
          date picker. Deep-token surface, generous spacing, a heavy rule. */}
      <header className="mb-8 border-b-2 border-border pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              {t('pages.daily.coverKicker')}
            </p>
            <h1 className="mt-2 text-4xl font-bold leading-none tracking-tight text-foreground sm:text-5xl">
              {t('pages.daily.title')}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="font-mono font-medium tracking-wide text-foreground/80">
                {t('pages.daily.volume', { vol: volume })}
              </span>
              <span aria-hidden className="text-border">
                /
              </span>
              <span>{longDateLabel(date, lang)}</span>
              {hasItems && items && (
                <>
                  <span aria-hidden className="text-border">
                    /
                  </span>
                  <span className="tabular-nums">
                    {t('pages.daily.issueCount', { count: items.length })}
                  </span>
                </>
              )}
            </div>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {t('pages.daily.coverSubtitle')}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDate((d) => shiftDateValue(d, -1))}
              aria-label={t('pages.daily.prevDay')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-40"
              aria-label={t('pages.daily.pickDate')}
            />
            <Button
              variant="outline"
              size="icon"
              disabled={atToday}
              onClick={() => setDate((d) => shiftDateValue(d, 1))}
              aria-label={t('pages.daily.nextDay')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <FeedStateGate
        isPending={isPending}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        isEmpty={!hasItems}
        emptyTitle={t('pages.daily.emptyTitle')}
        emptyDescription={t('pages.daily.emptyDescription')}
      >
        <div className="animate-fade-in space-y-10">
          {groups.map((group, i) => (
            <DailySection key={group.key} group={group} ordinal={i + 1} lang={lang} t={t} />
          ))}
        </div>
      </FeedStateGate>
    </div>
  );
}

/** One numbered magazine section: big ordinal + category name + count, then rows. */
function DailySection({
  group,
  ordinal,
  lang,
  t,
}: {
  group: CategoryGroup;
  ordinal: number;
  lang: Lang;
  t: TFn;
}): React.JSX.Element {
  return (
    <section data-testid="daily-section">
      <div className="mb-3 flex items-baseline gap-3 border-b border-border pb-2">
        {/* Big two-digit ordinal: 01, 02, 03… */}
        <span
          className="font-mono text-2xl font-bold leading-none tabular-nums text-accent/70"
          aria-hidden
        >
          {String(ordinal).padStart(2, '0')}
        </span>
        <h2 className="flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {categoryLabel(group.key, t)}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('pages.daily.sectionCount', { count: group.items.length })}
          </span>
        </h2>
        <span className="ml-auto self-center">
          <CategoryBadge category={group.key} />
        </span>
      </div>
      <ul className="divide-y divide-border/70">
        {group.items.map((item) => (
          <CompactRow key={item.id} item={item} lang={lang} t={t} />
        ))}
      </ul>
    </section>
  );
}

/** Compact magazine entry: title (→ detail) · source · heat, optional reason line. */
const CompactRow = memo(function CompactRow({
  item,
  lang,
  t,
}: {
  item: Item;
  lang: Lang;
  t: TFn;
}): React.JSX.Element {
  // One-line editorial note (markdown bold stripped to plain text), if present.
  const reason = item.reason_zh?.trim()
    ? item.reason_zh.replace(/\*\*/g, '').trim()
    : null;

  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <Link
          to={itemPath(item.id)}
          className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:text-accent hover:underline"
        >
          {displayTitle(item, lang)}
        </Link>
        <span className="shrink-0 truncate text-xs text-muted-foreground">{item.source_name}</span>
        {item.score != null && (
          <span className="shrink-0">
            <ScoreBadge score={item.score} />
          </span>
        )}
      </div>
      {reason && (
        <p
          className="mt-1 truncate text-xs leading-relaxed text-muted-foreground"
          data-testid="row-reason"
        >
          <span className="mr-1.5 font-medium text-accent/80">{t('card.reason')}</span>
          {reason}
        </p>
      )}
    </li>
  );
});

interface CategoryGroup {
  key: CategoryKey;
  items: Item[];
}

/** Group items by category, ordered by CATEGORY_ORDER, dropping empty groups. */
function groupByCategory(items: Item[]): CategoryGroup[] {
  const buckets = new Map<CategoryKey, Item[]>();
  for (const item of items) {
    const key: CategoryKey = CATEGORY_ORDER.includes(item.category) ? item.category : 'other';
    const arr = buckets.get(key);
    if (arr) arr.push(item);
    else buckets.set(key, [item]);
  }
  return CATEGORY_ORDER.filter((key) => buckets.has(key)).map((key) => ({
    key,
    items: buckets.get(key) as Item[],
  }));
}
