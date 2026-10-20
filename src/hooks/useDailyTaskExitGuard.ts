import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler } from 'react-native';

import { useDailyTaskSession } from '@/features/daily-task/DailyTaskProvider';
import { returnToHome, type AppNavigation } from '@/utils/navigation';

export function useDailyTaskExitGuard() {
  const { resetTask } = useDailyTaskSession();
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

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          requestExit();
          return true;
        },
      );

      return () => subscription.remove();
    }, [requestExit]),
  );

  return {
    cancelExit,
    confirmExit,
    requestExit,
    visible,
  };
}
