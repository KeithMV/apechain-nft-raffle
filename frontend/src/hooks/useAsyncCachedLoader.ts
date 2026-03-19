/**
 * Async Cached Loader Hook
 * Reusable pattern for async data loading with caching, loading states, and error handling
 */

import { useState, useEffect, useCallback } from 'react';

interface CacheOperations<T> {
  get: (params: any) => T | null | undefined;
  set: (params: any, data: T) => void;
}

interface LoaderOptions<T, P> {
  cache: CacheOperations<T>;
  cacheParams: P;
  fetchFn: () => Promise<T>;
  shouldLoad: boolean;
  dependencies: any[];
}

interface LoaderResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAsyncCachedLoader<T, P>({
  cache,
  cacheParams,
  fetchFn,
  shouldLoad,
  dependencies
}: LoaderOptions<T, P>): LoaderResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!shouldLoad) return;

    // Check cache first
    const cached = cache.get(cacheParams);
    if (cached) {
      setData(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      cache.set(cacheParams, result);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [cache, cacheParams, fetchFn, shouldLoad]);

  useEffect(() => {
    loadData();
  }, [loadData, ...dependencies]);

  return { data, loading, error, refetch: loadData };
}

export type { CacheOperations, LoaderOptions, LoaderResult };