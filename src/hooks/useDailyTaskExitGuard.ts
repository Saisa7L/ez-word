import { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

import { useDailyTask } from '@/features/daily-task/DailyTaskProvider';
import { returnToHome } from '@/utils/navigation';

export function useDailyTaskExitGuard() {
  const { resetTask } = useDailyTask();
  const [visible, setVisible] = useState(false);

  const requestExit = useCallback(() => {
    setVisible(true);
  }, []);

  const cancelExit = useCallback(() => {
    setVisible(false);
  }, []);

  const confirmExit = useCallback(() => {
    setVisible(false);
    resetTask();
    returnToHome();
  }, [resetTask]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      requestExit();
      return true;
    });

    return () => subscription.remove();
  }, [requestExit]);

  return {
    cancelExit,
    confirmExit,
    requestExit,
    visible,
  };
}
