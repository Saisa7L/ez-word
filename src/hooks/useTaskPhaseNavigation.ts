import { router } from 'expo-router';
import { useCallback } from 'react';

import { useDailyTaskSession } from '@/features/daily-task/DailyTaskProvider';
import type { TaskPhase } from '@/features/daily-task/taskReducer';
import { getTaskPhaseRoute } from '@/features/daily-task/taskRoutes';

type NavigationOptions = {
  replace?: boolean;
};

export function useTaskPhaseNavigation() {
  const { enterPhase } = useDailyTaskSession();

  return useCallback(
    (phase: TaskPhase, { replace = false }: NavigationOptions = {}) => {
      enterPhase(phase);
      const route = getTaskPhaseRoute(phase);
      if (replace) {
        router.replace(route);
      } else {
        router.push(route);
      }
    },
    [enterPhase],
  );
}
