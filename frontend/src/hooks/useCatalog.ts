import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { catalogApi } from '@/api/endpoints';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: ({ signal }) => catalogApi.categories(signal),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSources() {
  return useQuery({
    queryKey: queryKeys.sources(),
    queryFn: ({ signal }) => catalogApi.sources(signal),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats(),
    queryFn: ({ signal }) => catalogApi.stats(signal),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDaily(date: string | undefined) {
  return useQuery({
    queryKey: queryKeys.daily(date),
    queryFn: ({ signal }) => catalogApi.daily(date, signal),
  });
}
