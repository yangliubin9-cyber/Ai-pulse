import { Inbox, AlertTriangle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/api/client';

/** Loading skeleton matching the dense card row layout. */
export function FeedSkeleton({ rows = 6 }: { rows?: number }): React.JSX.Element {
  return (
    <div className="divide-y divide-border" data-testid="feed-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-l-2 border-border px-4 py-3">
          <Skeleton className="mb-2 h-3 w-40" />
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="mt-1 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function FeedEmpty({
  title = '暂无资讯',
  description = '换个分类或来源，或稍后手动刷新。',
}: EmptyStateProps): React.JSX.Element {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center"
      data-testid="feed-empty"
    >
      <Inbox className="h-8 w-8 text-muted-foreground/60" aria-hidden />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

export function FeedError({ error, onRetry }: ErrorStateProps): React.JSX.Element {
  const message =
    error instanceof ApiError ? error.message : '加载失败，请检查网络后重试。';
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center"
      data-testid="feed-error"
    >
      <AlertTriangle className="h-8 w-8 text-destructive/70" aria-hidden />
      <p className="text-sm font-medium text-foreground">无法加载资讯</p>
      <p className="max-w-xs text-xs text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          重试
        </Button>
      )}
    </div>
  );
}
