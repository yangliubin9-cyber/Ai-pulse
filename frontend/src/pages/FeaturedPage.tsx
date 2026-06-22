import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CategoryChips } from '@/components/feed/CategoryChips';
import { FeedSection } from '@/components/feed/FeedSection';
import { Pagination } from '@/components/feed/Pagination';
import { useItems } from '@/hooks/useItems';
import { useCategories } from '@/hooks/useCatalog';
import { PAGE_SIZE } from '@/lib/constants';
import type { CategoryKey } from '@/lib/types';

/** Home: featured items as a date-grouped timeline with category chips. */
export function FeaturedPage(): React.JSX.Element {
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [page, setPage] = useState(1);

  const query = {
    featured: true,
    category: category ?? undefined,
    page,
    page_size: PAGE_SIZE,
  };
  const { data, isPending, isError, error, refetch } = useItems(query);
  const { data: categories } = useCategories();

  const counts = categories
    ? Object.fromEntries(categories.map((c) => [c.key, c.count]))
    : undefined;

  const handleCategory = (next: CategoryKey | null): void => {
    setCategory(next);
    setPage(1);
  };

  return (
    <div>
      <PageHeader title="精选" description="今天值得一看的 AI 动态，按时间线排列。" />

      <div className="mb-4">
        <CategoryChips value={category} onChange={handleCategory} counts={counts} />
      </div>

      <FeedSection
        items={data?.items}
        isPending={isPending}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        emptyDescription="当前分类暂无精选内容，换个分类或稍后再来。"
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
