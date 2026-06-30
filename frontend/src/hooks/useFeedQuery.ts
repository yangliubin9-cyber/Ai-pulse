import { useState } from 'react';
import { useItems } from './useItems';
import { PAGE_SIZE } from '@/lib/constants';
import type { CategoryKey } from '@/lib/types';

interface UseFeedQueryOptions {
  /** When true, restrict the feed to featured items. */
  featured?: boolean;
  /** Extra server-side filters merged into the query (source_type / saved / unread). */
  extraParams?: { source_type?: string; saved?: boolean; unread?: boolean };
}

/**
 * Shared list-feed wiring used by the Featured and All pages: category + query
 * + page state, page reset on filter changes, and the `useItems` fetch. Each
 * page keeps its own page-specific filters (e.g. All's source type) and passes
 * them through `extraParams`.
 */
export function useFeedQuery({ featured, extraParams }: UseFeedQueryOptions = {}) {
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const result = useItems({
    featured: featured || undefined,
    category: category ?? undefined,
    q: query || undefined,
    page,
    page_size: PAGE_SIZE,
    ...extraParams,
  });

  const resetPage = (): void => setPage(1);

  /** Change category and jump back to page 1. */
  const handleCategory = (next: CategoryKey | null): void => {
    setCategory(next);
    resetPage();
  };

  /** Change the search query and jump back to page 1. */
  const handleSearch = (next: string): void => {
    setQuery(next);
    resetPage();
  };

  return {
    category,
    query,
    page,
    setPage,
    resetPage,
    handleCategory,
    handleSearch,
    ...result,
  };
}
