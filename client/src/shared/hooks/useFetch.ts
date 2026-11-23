import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { ApiError } from "../api/http";

/**
 * Data fetching hook powered by TanStack Query (@tanstack/react-query).
 * Provides caching, automatic background re-validation, and declarative refetching.
 */
export function useFetch<T>(fn: () => Promise<T>, deps: unknown[]) {
  const query = useQuery<T, ApiError>({
    queryKey: ["fetch", ...deps],
    queryFn: fn,
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data ?? null,
    error: query.error ?? null,
    loading: query.isLoading,
    reload: () => query.refetch(),
  };
}
