import { FeedList } from './FeedList';
import { FeedStateGate } from './FeedStates';
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
  return (
    <FeedStateGate
      isPending={isPending}
      isError={isError}
      error={error}
      onRetry={onRetry}
      isEmpty={!items || items.length === 0}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    >
      <FeedList items={items ?? []} grouped={grouped} />
    </FeedStateGate>
  );
}
