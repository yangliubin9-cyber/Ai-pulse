import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ingestApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';

/** Trigger a manual ingest run, then refresh feed-related queries. */
export function useIngestRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ingestApi.run(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.items() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sources() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    },
  });
}
