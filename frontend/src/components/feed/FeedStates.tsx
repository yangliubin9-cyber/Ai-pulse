import { Inbox, AlertTriangle, RefreshCw, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/api/client';
import { useT } from '@/i18n/I18nProvider';

/** Loading skeleton matching the timeline card layout. */
export function FeedSkeleton({ rows = 6 }: { rows?: number }): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="feed-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 sm:gap-4">
          <div className="w-9 shrink-0 pt-4 text-right sm:w-12">
            <Skeleton className="ml-auto h-3 w-8" />
          </div>
          <div className="relative flex shrink-0 justify-center">
            <span className="absolute inset-y-0 w-px bg-border" />
            <span className="mt-4 h-2 w-2 rounded-full bg-border" />
          </div>
          <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface p-4">
            <Skeleton className="mb-2 h-4 w-40" />
            <Skeleton className="mb-2 h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="mt-1 h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  /** Override the default inbox glyph (e.g. a 404 marker on the detail page). */
  icon?: LucideIcon;
  /** Optional call-to-action rendered below the description (e.g. a link/button). */
  action?: React.ReactNode;
  /** Overrides the default `feed-empty` testid for distinct empty states. */
  testId?: string;
}

export function FeedEmpty({
  title,
  description,
  icon: Icon = Inbox,
  action,
  testId = 'feed-empty',
}: EmptyStateProps): React.JSX.Element {
  const t = useT();
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center"
      data-testid={testId}
    >
      <Icon className="h-8 w-8 text-muted-foreground/60" aria-hidden />
      <p className="text-sm font-medium text-foreground">{title ?? t('feed.emptyTitle')}</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        {description ?? t('feed.emptyDescription')}
      </p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

interface FeedStateGateProps {
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Treated as the empty state when true; `children` render only when false. */
  isEmpty: boolean;
  /** Empty-state overrides forwarded to `FeedEmpty`. */
  emptyTitle?: string;
  emptyDescription?: string;
  /** The data view, rendered only in the resolved non-empty state. */
  children: React.ReactNode;
}

/**
 * Three-state gate (loading / error / empty) shared by feed surfaces. It owns
 * only the skeleton/error/empty branches; the data branch is delegated to
 * `children`, so each caller keeps its own data rendering.
 */
export function FeedStateGate({
  isPending,
  isError,
  error,
  onRetry,
  isEmpty,
  emptyTitle,
  emptyDescription,
  children,
}: FeedStateGateProps): React.JSX.Element {
  if (isPending) return <FeedSkeleton />;
  if (isError) return <FeedError error={error} onRetry={onRetry} />;
  if (isEmpty) return <FeedEmpty title={emptyTitle} description={emptyDescription} />;
  return <>{children}</>;
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

export function FeedError({ error, onRetry }: ErrorStateProps): React.JSX.Element {
  const t = useT();
  const message =
    error instanceof ApiError && error.message ? error.message : t('feed.errorDescription');
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center"
      data-testid="feed-error"
    >
      <AlertTriangle className="h-8 w-8 text-destructive/70" aria-hidden />
      <p className="text-sm font-medium text-foreground">{t('feed.errorTitle')}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
