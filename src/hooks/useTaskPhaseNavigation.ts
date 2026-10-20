import { useCallback } from 'react';

import { useDailyTaskSession } from '@/features/daily-task/DailyTaskProvider';
import type { TaskPhase } from '@/features/daily-task/taskReducer';
import { getTaskPhaseRoute } from '@/features/daily-task/taskRoutes';
import { pushOnce, replaceOnce } from '@/utils/navigationActions';

type NavigationOptions = {
  replace?: boolean;
};

export function useTaskPhaseNavigation() {
  const { enterPhase } = useDailyTaskSession();

  return useCallback(
    (phase: TaskPhase, { replace = false }: NavigationOptions = {}) => {
      const route = getTaskPhaseRoute(phase);
      const prepareNavigation = () => enterPhase(phase);
      if (replace) {
        replaceOnce(route, prepareNavigation);
      } else {
        pushOnce(route, prepareNavigation);
      }
    },
    [enterPhase],
  );
}
