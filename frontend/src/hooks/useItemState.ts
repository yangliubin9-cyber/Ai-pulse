import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';

/**
 * Per-user item-state mutations (saved / read). Each invalidates the whole
 * `items` key family so every list + the detail view re-reads the fresh flags.
 * Invalidation (not manual cache patching) keeps it simple and correct for this
 * single-user app where list traffic is light.
 */

export function useToggleSaved() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      itemsApi.setSaved(id, saved),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.items() });
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemsApi.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.items() });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => itemsApi.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.items() });
    },
  });
}
