import { useState } from 'react';
import { CheckCheck } from 'lucide-react';
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
import { useMarkAllRead } from '@/hooks/useItemState';
import { useCategories, useSources } from '@/hooks/useCatalog';
import { sourceTypeLabel } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n/I18nProvider';

const ALL_SOURCES = '__all__';

/** All AI items: category + source + unread filters, keyword search, pagination. */
export function AllPage(): React.JSX.Element {
  const t = useT();
  const [sourceType, setSourceType] = useState<string>(ALL_SOURCES);
  const [unread, setUnread] = useState(false);
  const markAllRead = useMarkAllRead();
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
    extraParams: {
      ...(sourceType === ALL_SOURCES ? {} : { source_type: sourceType }),
      ...(unread ? { unread: true } : {}),
    },
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
        <div className="flex flex-wrap items-center gap-2">
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
          <button
            type="button"
            onClick={() => {
              setUnread((v) => !v);
              resetPage();
            }}
            aria-pressed={unread}
            className={cn(
              'inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition-colors',
              unread
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-border text-muted-foreground hover:bg-surface-muted hover:text-foreground',
            )}
          >
            {t('pages.all.unread')}
          </button>
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" aria-hidden />
            {t('pages.all.markAllRead')}
          </button>
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
