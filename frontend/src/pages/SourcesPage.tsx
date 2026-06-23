import { PageHeader } from '@/components/layout/PageHeader';
import { SourceIcon } from '@/components/feed/SourceIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { FeedError, FeedEmpty } from '@/components/feed/FeedStates';
import { useSources } from '@/hooks/useCatalog';
import { relativeTime } from '@/lib/time';
import { sourceTypeLabel } from '@/lib/constants';
import { useI18n } from '@/i18n/I18nProvider';

/** Read-only list of collection sources with per-source item counts. */
export function SourcesPage(): React.JSX.Element {
  const { lang, t } = useI18n();
  const { data, isPending, isError, error, refetch } = useSources();

  return (
    <div>
      <PageHeader title={t('pages.sources.title')} description={t('pages.sources.description')} />

      {isPending && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {isError && <FeedError error={error} onRetry={() => void refetch()} />}

      {data && data.length === 0 && (
        <FeedEmpty
          title={t('pages.sources.emptyTitle')}
          description={t('pages.sources.emptyDescription')}
        />
      )}

      {data && data.length > 0 && (
        <ul className="divide-y divide-border border-y border-border">
          {data.map((source) => (
            <li
              key={`${source.source_type}-${source.name}`}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-muted-foreground">
                <SourceIcon type={source.source_type} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{source.name}</p>
                <p className="text-xs text-muted-foreground">
                  {sourceTypeLabel(source.source_type, t)}
                  {source.last_fetch_at && (
                    <span>
                      {' · '}
                      {t('pages.sources.lastFetched', {
                        time: relativeTime(source.last_fetch_at, lang),
                      })}
                    </span>
                  )}
                </p>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {t('pages.sources.itemCount', { count: source.count })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
