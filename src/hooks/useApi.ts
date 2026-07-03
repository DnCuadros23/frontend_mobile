/**
 * Hook genérico de fetching con estados de carga/error y reintento.
 * Centraliza el patrón try/catch + loading + mensajes amigables que pide la rúbrica.
 *
 *   const { data, loading, error, refetch } = useApi(() => casesApi.statistics());
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/errorMessages';

interface UseApiOptions {
  /** Si es false, no ejecuta automáticamente al montar (útil para acciones manuales). */
  immediate?: boolean;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: UseApiOptions = {},
) {
  const { immediate = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mounted.current) setData(result);
      return result;
    } catch (err) {
      if (mounted.current) setError(getErrorMessage(err));
      throw err;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) void run().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: run, setData };
}
