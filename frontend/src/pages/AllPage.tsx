import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CategoryChips } from '@/components/feed/CategoryChips';
import { FeedSection } from '@/components/feed/FeedSection';
import { Pagination } from '@/components/feed/Pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useItems } from '@/hooks/useItems';
import { useCategories, useSources } from '@/hooks/useCatalog';
import { PAGE_SIZE, sourceTypeLabel } from '@/lib/constants';
import type { CategoryKey } from '@/lib/types';

const ALL_SOURCES = '__all__';

/** All items with category + source filters and pagination. */
export function AllPage(): React.JSX.Element {
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [sourceType, setSourceType] = useState<string>(ALL_SOURCES);
  const [page, setPage] = useState(1);

  const { data, isPending, isError, error, refetch } = useItems({
    category: category ?? undefined,
    source_type: sourceType === ALL_SOURCES ? undefined : sourceType,
    page,
    page_size: PAGE_SIZE,
  });
  const { data: categories } = useCategories();
  const { data: sources } = useSources();

  const counts = categories
    ? Object.fromEntries(categories.map((c) => [c.key, c.count]))
    : undefined;

  const sourceTypes = Array.from(
    new Set((sources ?? []).map((s) => s.source_type)),
  );

  const resetPage = (): void => setPage(1);

  return (
    <div>
      <PageHeader title="全部资讯" description="不限精选的完整资讯流，可按分类与来源筛选。" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <CategoryChips
          value={category}
          onChange={(c) => {
            setCategory(c);
            resetPage();
          }}
          counts={counts}
        />
        <div className="ml-auto w-44">
          <Select
            value={sourceType}
            onValueChange={(v) => {
              setSourceType(v);
              resetPage();
            }}
          >
            <SelectTrigger aria-label="来源类型筛选">
              <SelectValue placeholder="全部来源" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SOURCES}>全部来源</SelectItem>
              {sourceTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {sourceTypeLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <FeedSection
        items={data?.items}
        isPending={isPending}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
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
