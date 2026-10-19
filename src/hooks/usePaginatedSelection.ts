import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { getLastPageIndex, getPageCount } from '@/utils/pagination';

type PageResult<T> = {
  items: T[];
  totalCount: number;
};

type UsePaginatedSelectionOptions<T> = {
  enabled?: boolean;
  loadPage: (pageIndex: number) => Promise<PageResult<T>>;
  pageSize: number;
};

export function usePaginatedSelection<T>({
  enabled = true,
  loadPage,
  pageSize,
}: UsePaginatedSelectionOptions<T>) {
  const requestIdRef = useRef(0);
  const [items, setItems] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);

    try {
      const result = await loadPage(pageIndex);
      if (requestIdRef.current !== requestId) {
        return;
      }

      const lastPage = getLastPageIndex(result.totalCount, pageSize);
      if (pageIndex > lastPage) {
        setPageIndex(lastPage);
        return;
      }

      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch {
      if (requestIdRef.current === requestId) {
        setItems([]);
        setTotalCount(0);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [loadPage, pageIndex, pageSize]);

  useFocusEffect(
    useCallback(() => {
      if (enabled) {
        void reload();
      }

      return () => {
        requestIdRef.current += 1;
      };
    }, [enabled, reload]),
  );

  const toggleSelection = useCallback((wordId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    clearSelection,
    isLoading,
    items,
    pageCount: getPageCount(totalCount, pageSize),
    pageIndex,
    reload,
    selectedIds,
    setPageIndex,
    toggleSelection,
    totalCount,
  };
}
