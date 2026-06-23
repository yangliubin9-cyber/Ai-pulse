import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CategoryBadge } from '@/components/feed/CategoryBadge';
import { ScoreBadge } from '@/components/feed/ScoreBadge';
import { FeedStateGate } from '@/components/feed/FeedStates';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDaily } from '@/hooks/useCatalog';
import { longDateLabel, shiftDateValue, timeOfDay, todayInputValue } from '@/lib/time';
import { CATEGORY_ORDER, categoryLabel } from '@/lib/constants';
import { useI18n } from '@/i18n/I18nProvider';
import { displayTitle } from '@/lib/display';
import { itemPath } from '@/lib/itemPath';
import type { Lang } from '@/i18n';
import type { CategoryKey, Item } from '@/lib/types';

/** AI Daily: featured items for a chosen day, grouped by category, with stats. */
export function DailyPage(): React.JSX.Element {
  const { lang, t } = useI18n();
  const today = todayInputValue();
  const [date, setDate] = useState<string>(today);
  const { data, isPending, isError, error, refetch } = useDaily(date);

  const items = data?.items;

  const groups = useMemo(() => groupByCategory(items ?? []), [items]);
  const sourceCount = useMemo(
    () => new Set((items ?? []).map((i) => i.source_name)).size,
    [items],
  );
  const topCategory = groups[0];

  const atToday = date >= today;
  const hasItems = Boolean(items && items.length > 0);

  return (
    <div>
      <PageHeader
        title={t('pages.daily.title')}
        description={longDateLabel(date, lang)}
        actions={
          <div className="flex items-center gap-1.5">
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
        }
      />

      {/* Stats bar */}
      {hasItems && items && (
        <div className="mb-6 grid grid-cols-3 gap-3" data-testid="daily-stats">
          <StatCard label={t('pages.daily.statEvents')} value={String(items.length)} />
          <StatCard label={t('pages.daily.statSources')} value={String(sourceCount)} />
          <StatCard
            label={t('pages.daily.statTop')}
            value={topCategory ? categoryLabel(topCategory.key, t) : '—'}
          />
        </div>
      )}

      <FeedStateGate
        isPending={isPending}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        isEmpty={!hasItems}
        emptyTitle={t('pages.daily.emptyTitle')}
        emptyDescription={t('pages.daily.emptyDescription')}
      >
        <div className="animate-fade-in space-y-7">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 flex items-center gap-2">
                <CategoryBadge category={group.key} />
                <span className="text-xs text-muted-foreground">
                  {t('pages.daily.groupCount', { count: group.items.length })}
                </span>
              </h2>
              <ul className="divide-y divide-border border-y border-border">
                {group.items.map((item) => (
                  <CompactRow key={item.id} item={item} lang={lang} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </FeedStateGate>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
      <p className="truncate text-lg font-semibold tabular-nums text-foreground">{value}</p>
      <p className="truncate text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/** Compact one-line entry: time · title (→ detail) · heat. */
const CompactRow = memo(function CompactRow({
  item,
  lang,
}: {
  item: Item;
  lang: Lang;
}): React.JSX.Element {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <time
        className="w-10 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground"
        dateTime={item.published_at}
      >
        {timeOfDay(item.published_at)}
      </time>
      <Link
        to={itemPath(item.id)}
        className="min-w-0 flex-1 truncate text-sm text-foreground hover:text-accent hover:underline"
      >
        {displayTitle(item, lang)}
      </Link>
      <span className="shrink-0 truncate text-xs text-muted-foreground">{item.source_name}</span>
      {item.score != null && (
        <span className="shrink-0">
          <ScoreBadge score={item.score} />
        </span>
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
