import { PageHeader } from '@/components/layout/PageHeader';
import { CategoryChips } from '@/components/feed/CategoryChips';
import { SearchBar } from '@/components/feed/SearchBar';
import { FeedSection } from '@/components/feed/FeedSection';
import { Pagination } from '@/components/feed/Pagination';
import { useFeedQuery } from '@/hooks/useFeedQuery';
import { useCategories } from '@/hooks/useCatalog';
import { useT } from '@/i18n/I18nProvider';

/** Home: featured items as a date-grouped timeline with category chips + search. */
export function FeaturedPage(): React.JSX.Element {
  const t = useT();
  const {
    category,
    query,
    data,
    isPending,
    isError,
    error,
    refetch,
    setPage,
    handleCategory,
    handleSearch,
  } = useFeedQuery({ featured: true });
  const { data: categories } = useCategories();

  const counts = categories
    ? Object.fromEntries(categories.map((c) => [c.key, c.count]))
    : undefined;

  return (
    <div>
      <PageHeader title={t('pages.featured.title')} description={t('pages.featured.description')} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CategoryChips value={category} onChange={handleCategory} counts={counts} />
        <SearchBar onSearch={handleSearch} value={query} />
      </div>

      <FeedSection
        items={data?.items}
        isPending={isPending}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        emptyDescription={
          query
            ? t('search.noMatchFeatured', { query })
            : t('search.emptyFeatured')
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
