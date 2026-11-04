import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import {
  deactivateWords,
  getActiveWordCount,
  listActiveWords,
  type WordRecord,
} from '@/database/wordsRepository';
import { setWordsLearningStatus } from '@/database/wrongBookRepository';
import { usePaginatedSelection } from '@/hooks/usePaginatedSelection';

export const WORD_LIBRARY_PAGE_SIZE = 5;

type Notify = (title: string, message?: string) => void;

type UseWordLibraryOptions = {
  notify: Notify;
};

/**
 * 当前词库页的数据与选择状态：分页加载、勾选、移除、批量改状态。
 * 确认弹窗属于交互编排，留在页面。
 */
export function useWordLibrary({ notify }: UseWordLibraryOptions) {
  const db = useSQLiteContext();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const loadPage = useCallback(
    async (targetPageIndex: number) => {
      const [totalCount, items] = await Promise.all([
        getActiveWordCount(db),
        listActiveWords(
          db,
          WORD_LIBRARY_PAGE_SIZE,
          targetPageIndex * WORD_LIBRARY_PAGE_SIZE,
        ),
      ]);
      return { items, totalCount };
    },
    [db],
  );

  const {
    clearSelection,
    isLoading,
    items: words,
    pageCount,
    pageIndex,
    reload,
    selectedIds,
    setPageIndex,
    toggleSelection,
    totalCount,
  } = usePaginatedSelection<WordRecord>({
    loadPage,
    pageSize: WORD_LIBRARY_PAGE_SIZE,
  });

  async function removeSelectedWords() {
    setIsRemoving(true);
    try {
      await deactivateWords(db, [...selectedIds]);
      clearSelection();
      await reload();
    } catch {
      notify('移除失败', '无法从当前词库移除单词，请稍后重试');
    } finally {
      setIsRemoving(false);
    }
  }

  async function changeSelectedStatus(status: 'learned' | 'unlearned') {
    setIsUpdatingStatus(true);
    try {
      await setWordsLearningStatus(db, [...selectedIds], status);
      clearSelection();
      await reload();
    } catch {
      notify('修改失败', '无法修改单词状态，请稍后重试');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return {
    changeSelectedStatus,
    isLoading,
    isRemoving,
    isUpdatingStatus,
    pageCount,
    pageIndex,
    removeSelectedWords,
    selectedIds,
    setPageIndex,
    setStatusModalVisible,
    statusModalVisible,
    toggleSelection,
    totalCount,
    words,
  };
}
