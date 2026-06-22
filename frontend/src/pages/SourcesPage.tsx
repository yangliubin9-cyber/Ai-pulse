import { PageHeader } from '@/components/layout/PageHeader';
import { SourceIcon } from '@/components/feed/SourceIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { FeedError, FeedEmpty } from '@/components/feed/FeedStates';
import { useSources } from '@/hooks/useCatalog';
import { relativeTime } from '@/lib/time';
import { sourceTypeLabel } from '@/lib/constants';

/** Read-only list of collection sources with per-source item counts. */
export function SourcesPage(): React.JSX.Element {
  const { data, isPending, isError, error, refetch } = useSources();

  return (
    <div>
      <PageHeader title="采集来源" description="当前接入的公开来源及各自的资讯条数。" />

      {isPending && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {isError && <FeedError error={error} onRetry={() => void refetch()} />}

      {data && data.length === 0 && (
        <FeedEmpty title="暂无来源" description="尚未配置任何采集来源。" />
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
                  {sourceTypeLabel(source.source_type)}
                  {source.last_fetch_at && (
                    <span> · 最近采集 {relativeTime(source.last_fetch_at)}</span>
                  )}
                </p>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {source.count} 条
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
