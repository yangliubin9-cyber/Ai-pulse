import type { ItemsQuery } from '@/lib/types';

/**
 * Central query key factory. Every TanStack Query key flows through here so
 * invalidation and caching stay consistent across the app.
 */
export const queryKeys = {
  all: ['ai-pulse'] as const,

  auth: () => [...queryKeys.all, 'auth'] as const,
  me: () => [...queryKeys.auth(), 'me'] as const,

  items: () => [...queryKeys.all, 'items'] as const,
  itemList: (params: ItemsQuery) => [...queryKeys.items(), 'list', params] as const,
  itemDetail: (id: string) => [...queryKeys.items(), 'detail', id] as const,

  categories: () => [...queryKeys.all, 'categories'] as const,
  sources: () => [...queryKeys.all, 'sources'] as const,
  stats: () => [...queryKeys.all, 'stats'] as const,

  daily: (date?: string) => [...queryKeys.all, 'daily', date ?? 'latest'] as const,
} as const;
