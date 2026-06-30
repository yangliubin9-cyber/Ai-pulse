import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FeedSection } from '@/components/feed/FeedSection';
import { Pagination } from '@/components/feed/Pagination';
import { useItems } from '@/hooks/useItems';
import { PAGE_SIZE } from '@/lib/constants';
import { useT } from '@/i18n/I18nProvider';

/** Saved (bookmarked) items for the current user — same timeline feed, filtered. */
export function SavedPage(): React.JSX.Element {
  const t = useT();
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = useItems({
    saved: true,
    page,
    page_size: PAGE_SIZE,
  });

  return (
    <div>
      <PageHeader title={t('pages.saved.title')} description={t('pages.saved.description')} />
      <FeedSection
        items={data?.items}
        isPending={isPending}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        emptyDescription={t('pages.saved.empty')}
      />
      {data && (
        <Pagination
          page={data.page}
          pageSize={data.page_size}
          total={data.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
