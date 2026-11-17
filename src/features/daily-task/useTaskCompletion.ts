import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { completeTaskSession } from '@/database/taskCompletionRepository';
import {
  useDailyTaskMistakes,
  useDailyTaskSession,
} from '@/features/daily-task/DailyTaskProvider';

export type TaskCompletionState = 'error' | 'saved' | 'saving';

export type TaskCompletionResult = {
  retry: () => void;
  state: TaskCompletionState;
};

/**
 * 每日任务完成页的写入流程：进入相位就绪后自动保存一次，
 * 失败可重试，且保证同一次会话只写入一次。
 * 只持有保存状态与副作用，不涉及任何渲染细节。
 */
export function useTaskCompletion(enabled: boolean): TaskCompletionResult {
  const db = useSQLiteContext();
  const { taskMode, taskSettings, words } = useDailyTaskSession();
  const { fillMistakeWordIds, listeningMistakeWordIds } =
    useDailyTaskMistakes();
  const startedRef = useRef(false);
  const [state, setState] = useState<TaskCompletionState>('saving');

  const saveCompletion = useCallback(async () => {
    if (startedRef.current || words.length === 0) {
      return;
    }

    startedRef.current = true;
    try {
      await completeTaskSession(db, {
        autoRemoveCorrectWrongReview: taskSettings.autoRemoveCorrectWrongReview,
        fillMistakeWordIds: [...fillMistakeWordIds],
        listeningMistakeWordIds: [...listeningMistakeWordIds],
        mode: taskMode,
        wordIds: words.map((word) => word.id),
      });
      setState('saved');
    } catch {
      startedRef.current = false;
      setState('error');
    }
  }, [
    db,
    fillMistakeWordIds,
    listeningMistakeWordIds,
    taskMode,
    taskSettings.autoRemoveCorrectWrongReview,
    words,
  ]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timer = setTimeout(() => {
      void saveCompletion();
    }, 0);
    return () => clearTimeout(timer);
  }, [enabled, saveCompletion]);

  const retry = useCallback(() => {
    setState('saving');
    void saveCompletion();
  }, [saveCompletion]);

  return { retry, state };
}
