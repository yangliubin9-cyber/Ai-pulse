import { FeedList } from './FeedList';
import { FeedSkeleton, FeedEmpty, FeedError } from './FeedStates';
import type { Item } from '@/lib/types';

interface FeedSectionProps {
  items: Item[] | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry?: () => void;
  grouped?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Resolves loading / error / empty / data into the right feed view. */
export function FeedSection({
  items,
  isPending,
  isError,
  error,
  onRetry,
  grouped = true,
  emptyTitle,
  emptyDescription,
}: FeedSectionProps): React.JSX.Element {
  if (isPending) return <FeedSkeleton />;
  if (isError) return <FeedError error={error} onRetry={onRetry} />;
  if (!items || items.length === 0) {
    return <FeedEmpty title={emptyTitle} description={emptyDescription} />;
  }
  return <FeedList items={items} grouped={grouped} />;
}
