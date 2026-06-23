import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CategoryChips } from '@/components/feed/CategoryChips';
import { SearchBar } from '@/components/feed/SearchBar';
import { FeedSection } from '@/components/feed/FeedSection';
import { Pagination } from '@/components/feed/Pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFeedQuery } from '@/hooks/useFeedQuery';
import { useCategories, useSources } from '@/hooks/useCatalog';
import { sourceTypeLabel } from '@/lib/constants';
import { useT } from '@/i18n/I18nProvider';

const ALL_SOURCES = '__all__';

/** All AI items: category + source filters, keyword search, pagination. */
export function AllPage(): React.JSX.Element {
  const t = useT();
  const [sourceType, setSourceType] = useState<string>(ALL_SOURCES);
  const {
    category,
    query,
    data,
    isPending,
    isError,
    error,
    refetch,
    setPage,
    resetPage,
    handleCategory,
    handleSearch,
  } = useFeedQuery({
    extraParams:
      sourceType === ALL_SOURCES ? undefined : { source_type: sourceType },
  });
  const { data: categories } = useCategories();
  const { data: sources } = useSources();

  const counts = categories
    ? Object.fromEntries(categories.map((c) => [c.key, c.count]))
    : undefined;

  const sourceTypes = Array.from(
    new Set((sources ?? []).map((s) => s.source_type)),
  );

  return (
    <div>
      <PageHeader
        title={t('pages.all.title')}
        description={t('pages.all.description')}
      />

      <div className="mb-5 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CategoryChips value={category} onChange={handleCategory} counts={counts} />
          <SearchBar onSearch={handleSearch} value={query} />
        </div>
        <div className="w-44">
          <Select
            value={sourceType}
            onValueChange={(v) => {
              setSourceType(v);
              resetPage();
            }}
          >
            <SelectTrigger aria-label={t('pages.all.sourceFilter')}>
              <SelectValue placeholder={t('pages.all.allSources')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SOURCES}>{t('pages.all.allSources')}</SelectItem>
              {sourceTypes.map((st) => (
                <SelectItem key={st} value={st}>
                  {sourceTypeLabel(st, t)}
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
        emptyDescription={
          query ? t('search.noMatchAll', { query }) : t('search.emptyAll')
        }
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
