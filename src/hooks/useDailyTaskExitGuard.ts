import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

import { useDailyTask } from '@/features/daily-task/DailyTaskProvider';
import { returnToHome, type AppNavigation } from '@/utils/navigation';

export function useDailyTaskExitGuard() {
  const { resetTask } = useDailyTask();
  const navigation = useNavigation<AppNavigation>('/');
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
    returnToHome(navigation);
  }, [navigation, resetTask]);

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
