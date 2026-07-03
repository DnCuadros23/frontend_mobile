import { useCallback } from 'react';
import { casesApi, type ListCasesParams } from '../api/cases';
import { useApi } from './useApi';

export function useCases(params: ListCasesParams = {}) {
  const result = useApi(
    () => casesApi.list(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.estado, params.page, params.size],
  );

  const deleteCase = useCallback(
    async (id: number) => {
      await casesApi.remove(id);
      await result.refetch();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result.refetch],
  );

  return {
    ...result,
    cases: result.data?.content ?? [],
    totalPages: result.data?.totalPages ?? 0,
    deleteCase,
  };
}
