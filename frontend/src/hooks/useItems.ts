import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { itemsApi } from '@/api/endpoints';
import type { ItemsQuery } from '@/lib/types';

export function useItems(params: ItemsQuery) {
  return useQuery({
    queryKey: queryKeys.itemList(params),
    queryFn: ({ signal }) => itemsApi.list(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useItemDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.itemDetail(id ?? ''),
    queryFn: ({ signal }) => itemsApi.detail(id as string, signal),
    enabled: Boolean(id),
  });
}

/** Alias for {@link useItemDetail}: fetch one item by id (GET /items/{id}). */
export const useItem = useItemDetail;
