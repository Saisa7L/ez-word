import { router } from 'expo-router';
import { useEffect } from 'react';

import { useDailyTaskSession } from '@/features/daily-task/DailyTaskProvider';
import type { TaskPhase } from '@/features/daily-task/taskReducer';
import { getTaskPhaseRoute } from '@/features/daily-task/taskRoutes';

export function useDailyTaskPhaseGuard(expectedPhase: TaskPhase): boolean {
  const { phase, words } = useDailyTaskSession();
  const hasTask = words.length > 0;

  useEffect(() => {
    if (!hasTask) {
      router.replace('/daily-task');
      return;
    }

    if (phase !== expectedPhase) {
      router.replace(getTaskPhaseRoute(phase));
    }
  }, [expectedPhase, hasTask, phase]);

  return hasTask && phase === expectedPhase;
}
